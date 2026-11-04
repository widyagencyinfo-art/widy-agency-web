/* =====================================================================
   Leads y clientes: embudo (arrastrar y soltar), lista con acciones en
   bloque, ficha del cliente con resumen de la IA y modal «Nuevo lead».
   También expone App.ld (piezas compartidas con la vista de WhatsApp).
   ===================================================================== */
(function(){
const App = window.App;
const {html, raw, icon, db, C, ui} = App;

/* ---------- utilidades locales ---------- */
const nom1 = c => (c && c.nombre || '').split(' ')[0];
const nom2 = c => (c && c.nombre || '').split(' ').slice(0, 2).join(' ');
const vehDe = c => (c.interes || []).map(db.veh).filter(Boolean);
const veh1 = c => vehDe(c)[0] || null;
const precioLead = c => { const v = veh1(c); return v ? (v.precioVenta || v.precio) : 0; };
const comerciales = () => App.S.users.filter(u => u.rol === 'Comercial');
const vencida = p => p && new Date(p.fecha) < new Date();
const cuotaTxt = v => App.num(db.cuota(v.precio)) + ' €/mes';
const TL = {
  lead:          {icon:'zap',            color:'var(--accent)'},
  ia:            {icon:'sparkles',       color:'var(--violet)'},
  etapa:         {icon:'git-branch',     color:'var(--ink-2)'},
  cita:          {icon:'calendar-check', color:'var(--violet)'},
  presupuesto:   {icon:'file-text',      color:'var(--pink)'},
  tasacion:      {icon:'scan-line',      color:'var(--amber)'},
  financiacion:  {icon:'landmark',       color:'var(--green)'},
  llamada:       {icon:'phone',          color:'var(--cyan)'},
  nota:          {icon:'sticky-note',    color:'var(--amber)'},
  venta:         {icon:'badge-euro',     color:'var(--green)'},
  automatizacion:{icon:'workflow',       color:'var(--violet)'},
  whatsapp:      {icon:'message-circle', color:'var(--wa-dark)'}
};
const MOTIVOS = ['Compró en otro concesionario', 'No le aprobaron la financiación', 'Buscaba algo más barato', 'No contesta tras 3 intentos', 'Decidió no cambiar de coche', 'Se fue a un coche nuevo (km 0)'];
const ETIQUETAS_SUG = ['Coche a cuenta', 'Financiación', 'Urgente', 'Presupuesto enviado', 'Señal pagada', 'Eléctrico', 'Empresa', 'Cliente repetidor', 'Recomendado'];

/* reparto por turnos: el comercial con menos leads nuevos (y si empatan, el que no recibió el último) */
function turnoComercial() {
  const coms = comerciales(); if (!coms.length) return App.S.me;
  const ultimo = App.S.contacts.find(c => coms.some(u => u.id === c.asignado));
  const carga = u => App.S.contacts.filter(c => c.asignado === u.id && ['nuevo', 'contactado'].includes(c.etapa)).length;
  return coms.slice().sort((a, b) => carga(a) - carga(b) || (a.id === (ultimo && ultimo.asignado)) - (b.id === (ultimo && ultimo.asignado)))[0].id;
}

/* ---------- selector de coche del stock (modal) → Promise<vehicleId|null> ---------- */
function elegirCoche({title = 'Elige un coche del stock', sub = '', excluir = [], boton = ''} = {}) {
  return new Promise(res => {
    let q = '', done = false;
    const lista = () => {
      const w = App.norm(q).split(/\s+/).filter(Boolean);
      const vs = db.stock().filter(v => !excluir.includes(v.id)).filter(v => { const s = App.norm(`${v.marca} ${v.modelo} ${v.version} ${v.matricula} ${v.anio} ${v.color} ${v.combustible} ${v.carroceria}`); return w.every(x => s.includes(x)); });
      return vs.length ? html`${vs.map(v => html`<button class="ld-pick__item" data-vid="${v.id}">
          ${ui.thumb(v)}
          <span class="ld-pick__main"><b>${ui.vehNombre(v)}</b><span>${ui.vehSub(v)}</span></span>
          <span class="ld-pick__side"><b class="tnum">${App.eur(v.precio)}</b>${v.estado === 'disponible' ? html`<span class="xs muted">${cuotaTxt(v)}</span>` : ui.vehEstado(v.estado)}</span>
        </button>`)}` : html`<div class="empty"><div><b>Ningún coche coincide</b><p>Prueba con la marca, el modelo o la matrícula.</p></div></div>`;
    };
    App.modal({title, sub, size: 'lg', cls: 'ld-pick-modal',
      body: html`<div class="input-group">${icon('search', 16)}<input class="input" id="ldPickQ" placeholder="Busca por marca, modelo, matrícula…" autocomplete="off" autofocus></div>
        <div class="ld-pick mt-12">${lista()}</div>`,
      onMount(n, close) {
        const box = n.querySelector('.ld-pick');
        n.querySelector('#ldPickQ').addEventListener('input', e => { q = e.target.value; box.innerHTML = App.str(lista()); });
        box.addEventListener('click', e => { const b = e.target.closest('[data-vid]'); if (!b) return; done = true; close(); res(b.dataset.vid); });
      },
      onClose: () => { if (!done) res(null); }
    });
  });
}

/* ---------- resumen de la IA (reglas sobre datos + texto de sus mensajes) ---------- */
function resumenIA(c) {
  const cli = db.mensajes(c.id).filter(m => m.from === 'cliente');
  const t = App.norm(cli.map(m => m.texto || '').join(' \n '));
  const v = veh1(c);
  let busca = v ? `${v.carroceria} ${v.combustible.toLowerCase()}${v.cambio === 'Automático' ? ' automático' : ''}, como el ${ui.vehNombre(v)}` : 'Todavía no ha dicho qué coche busca';
  if (/(novel|carnet|mi hijo|mi hija)/.test(t)) busca += ', para un conductor novel';
  if (/(autonomia|bateria|cargar)/.test(t)) busca += '; le importa la autonomía';
  const pres = c.presupuesto ? `Hasta ${App.eur(c.presupuesto)}` : v ? `Sobre ${App.eur(v.precio)} (por el coche que mira)` : 'Sin datos';
  const financia = !!c.financiar || /(financ|cuota|al mes|entrada|plazos)/.test(t);
  const cuenta = c.cocheACuenta ? `${c.cocheACuenta.marca} ${c.cocheACuenta.modelo} de ${c.cocheACuenta.anio} · ${App.km(c.cocheACuenta.km)}` : /(para dejar|a cuenta|tasar|tasacion|mi coche|tengo un)/.test(t) ? 'Lo ha mencionado, falta concretar' : 'No';
  const obj = [];
  if (/(ultimo|rebaja|descuento|negociable|buen precio|precio final)/.test(t)) obj.push('Quiere apretar el precio');
  if (/(lo hablo|me lo pienso|mi mujer|mi marido|os digo|pensarlo)/.test(t)) obj.push('Lo tiene que hablar en casa');
  if (/sin entrada/.test(t)) obj.push('Quiere financiar sin entrada');
  if (/garantia/.test(t)) obj.push('Pregunta por la garantía');
  if (/(autonomia|bateria)/.test(t)) obj.push('Dudas de autonomía y batería');
  if (/(papeles|itv|documentacion)/.test(t)) obj.push('Quiere los papeles al día');
  if (v && c.presupuesto && v.precio > c.presupuesto * 1.05) obj.push(`El coche supera su presupuesto en ${App.eur(v.precio - c.presupuesto)}`);
  const futura = db.eventosDe(c.id).find(e => new Date(e.inicio) > new Date() && !['cancelada', 'hecha', 'no_vino'].includes(e.estado));
  let p = ({nuevo: 18, contactado: 26, cita: 45, prueba: 55, negociacion: 64, reservado: 88, vendido: 100, perdido: 4})[c.etapa] ?? 20;
  if (!['vendido', 'perdido'].includes(c.etapa)) {
    p += ({caliente: 12, templado: 0, frio: -12})[c.temperatura] || 0;
    p += Math.min(cli.length, 4) * 2 + (c.necesitaHumano ? 5 : 0) + (futura ? 6 : 0) + (financia ? 2 : 0);
    if (obj.some(o => o.startsWith('El coche supera'))) p -= 8;
    p = App.clamp(Math.round(p), 3, 97);
  }
  const nivel = p >= 60 ? 'alta' : p >= 35 ? 'media' : 'baja';
  const cc = c.cocheACuenta ? `${c.cocheACuenta.marca} ${c.cocheACuenta.modelo}` : '';
  const coche = v ? `el ${ui.vehNombre(v)}` : 'el coche';
  let paso;
  if (c.etapa === 'vendido') paso = 'Pedirle la reseña en Google y ofrecerle la primera revisión en el taller.';
  else if (c.etapa === 'perdido') paso = 'Reactivarlo dentro de 30 días mandándole coches parecidos a su presupuesto.';
  else if (c.necesitaHumano) paso = `Contéstale tú ya: quiere cerrar precio${cc ? ` con su ${cc} a cuenta` : ''}. Dale la tasación y ofrécele reservar con 300 € de señal.`;
  else if (c.etapa === 'nuevo') paso = `Llámale en los próximos 15 minutos y proponle probar ${coche} esta semana.`;
  else if (c.etapa === 'contactado') paso = `Proponle día y hora para ver ${coche}${financia ? ' y mándale la cuota a 72 y 96 meses' : ''}.`;
  else if (c.etapa === 'cita') paso = futura ? `Confirmar la cita de ${App.diaRel(futura.inicio).toLowerCase()} a las ${App.hora(futura.inicio)} y tener ${coche} limpio y listo${financia ? '. Pedirle DNI y nómina para preaprobar' : ''}.` : `Cerrar día y hora para la prueba de ${coche}.`;
  else if (c.etapa === 'prueba') paso = `Mandarle hoy el presupuesto con la cuota${cc ? ` y su ${cc} descontado` : ''}.`;
  else if (c.etapa === 'negociacion') paso = financia ? 'Enviar hoy el estudio a la financiera y ofrecer reservarlo con 300 € de señal.' : 'Ofrecerle reservarlo con 300 € de señal antes de que lo vea otro interesado.';
  else paso = 'Preparar la documentación de la entrega, la transferencia y el seguro.';
  return {busca, pres, financia, cuenta, obj, p, nivel, paso};
}

/* ---------- coches del stock que le encajan ---------- */
function encajan(c, n = 3) {
  const v = veh1(c), pres = c.presupuesto || (v ? v.precio : 18000);
  return db.stock().filter(x => x.estado === 'disponible' && !(c.interes || []).includes(x.id))
    .map(x => ({x, s: Math.abs(x.precio - pres) / pres * 100 - (v && x.carroceria === v.carroceria ? 12 : 0) - (v && x.combustible === v.combustible ? 4 : 0) + (x.precio > pres * 1.15 ? 25 : 0)}))
    .sort((a, b) => a.s - b.s).slice(0, n).map(o => o.x);
}

/* texto que acompaña a la ficha de un coche enviada por WhatsApp */
const textoFicha = (c, v) => `${c && c.nombre !== 'Cliente de prueba' ? 'Hola ' + nom1(c) + ', t' : 'T'}e paso la ficha del ${ui.vehNombre(v)} ${v.version}: ${v.anio}, ${App.km(v.km)}, ${App.eur(v.precio)} o desde ${cuotaTxt(v)}. ¿Te encaja? Si quieres, te lo reservo para que lo veas.`;

/* respuesta de la IA protegida (si ia.js aún no está, contesta algo creíble) */
async function iaResponder(cid, texto) {
  try { if (App.ia && App.ia.responder) return await App.ia.responder(cid, texto); } catch (e) { console.error(e); }
  const c = db.contact(cid), v = c && veh1(c) || db.stock().find(x => x.destacado);
  return {texto: v ? `¡Hola! El ${ui.vehNombre(v)} está disponible a ${App.eur(v.precio)} o desde ${cuotaTxt(v)}. ¿Quieres venir a verlo y probarlo?` : '¡Hola! ¿Qué coche estás buscando? Te paso las mejores opciones del stock.', segundos: 12, accion: null};
}

/* ---------- modal: marcar como perdido ---------- */
function modalPerdido(cid) {
  const c = db.contact(cid); if (!c) return;
  let motivo = '';
  App.modal({title: `¿Por qué se ha perdido ${nom1(c)}?`, sub: 'Saber por qué se pierden los leads te ayuda a vender más el mes que viene.', size: 'sm',
    body: html`<div class="ld-motivos">${MOTIVOS.map(m => html`<button class="chip" data-m="${m}">${m}</button>`)}</div>
      <div class="field mt-16"><label>Otro motivo o detalle</label><input class="input" id="ldMotivo" placeholder="Ej.: se lo ha quedado un familiar"></div>`,
    foot: html`<button class="btn" data-close>Cancelar</button><button class="btn btn--danger" id="ldPerdOk">${icon('circle-x', 16)}Marcar como perdido</button>`,
    onMount(n, close) {
      const inp = n.querySelector('#ldMotivo');
      n.querySelector('.ld-motivos').addEventListener('click', e => { const b = e.target.closest('[data-m]'); if (!b) return; n.querySelectorAll('.ld-motivos .chip').forEach(x => x.classList.toggle('is-on', x === b)); motivo = b.dataset.m; });
      n.querySelector('#ldPerdOk').onclick = () => {
        const m = inp.value.trim() || motivo;
        if (!m) { n.querySelector('.ld-motivos').classList.remove('flash'); void n.offsetWidth; n.querySelector('.ld-motivos').classList.add('flash'); return App.toast('Elige un motivo', {tipo: 'warn'}); }
        close(); db.setEtapa(cid, 'perdido', {motivo: m}); db.updateContact(cid, {iaActiva: false, proxima: null, temperatura: 'frio'});
      };
    }});
}

/* ---------- modal: venta (soltar en «Vendido») ---------- */
function modalVenta(cid) {
  const c = db.contact(cid); if (!c) return;
  const stock = db.stock();
  const preferidos = stock.filter(v => c.interes.includes(v.id));
  let vid = (preferidos[0] || stock[0]).id, financiado = !!c.financiar;
  const opts = () => html`${preferidos.length ? html`<optgroup label="Coches que le interesan">${preferidos.map(v => html`<option value="${v.id}" ${v.id === vid ? 'selected' : ''}>${ui.vehNombre(v)} · ${v.anio} · ${App.eur(v.precio)}</option>`)}</optgroup>` : ''}
    <optgroup label="Resto del stock">${stock.filter(v => !c.interes.includes(v.id)).map(v => html`<option value="${v.id}" ${v.id === vid ? 'selected' : ''}>${ui.vehNombre(v)} · ${v.anio} · ${App.eur(v.precio)}</option>`)}</optgroup>`;
  const resumen = () => { const v = db.veh(vid); return html`${ui.thumb(v, 'thumb--lg')}<div class="grow"><b>${ui.vehNombre(v)}</b><div class="small muted">${ui.vehSub(v)}</div><div class="small muted">${v.matricula} · margen previsto <b class="green">${App.eur(db.margen(v))}</b></div></div>`; };
  App.modal({title: `Venta a ${nom2(c)}`, sub: 'Se retira de todos los portales y se registra en informes.', size: 'sm',
    body: html`<div class="stack">
      <div class="ld-venta__veh" id="ldVentaVeh">${resumen()}</div>
      <div class="field"><label>Coche vendido</label><select class="select" id="ldVentaV">${opts()}</select></div>
      <div class="form-grid">
        <div class="field"><label>Precio final</label><div class="input-group ld-suffix"><input class="input tnum" id="ldVentaP" inputmode="numeric" value="${App.num(db.veh(vid).precio)}"><span class="input-group__suffix">€</span></div></div>
        <div class="field"><label>Vendedor</label><select class="select" id="ldVentaU">${App.S.users.filter(u => ['Comercial', 'Gerente'].includes(u.rol)).map(u => html`<option value="${u.id}" ${u.id === c.asignado ? 'selected' : ''}>${u.nombre}</option>`)}</select></div>
      </div>
      <div class="between ld-toggle-row"><span><b class="semi">Financiado</b><span class="small muted" style="display:block">Suma a la comisión de la financiera</span></span><button class="switch ${financiado ? 'is-on' : ''}" id="ldVentaF" aria-label="Financiado"></button></div>
    </div>`,
    foot: html`<button class="btn" data-close>Cancelar</button><button class="btn btn--primary" id="ldVentaOk">${icon('badge-euro', 16)}Registrar venta</button>`,
    onMount(n, close) {
      const sel = n.querySelector('#ldVentaV'), pr = n.querySelector('#ldVentaP');
      sel.onchange = () => { vid = sel.value; pr.value = App.num(db.veh(vid).precio); n.querySelector('#ldVentaVeh').innerHTML = App.str(resumen()); };
      n.querySelector('#ldVentaF').onclick = e => { financiado = !financiado; e.currentTarget.classList.toggle('is-on', financiado); };
      n.querySelector('#ldVentaOk').onclick = () => {
        const precio = +String(pr.value).replace(/\D/g, '') || db.veh(vid).precio, v = db.veh(vid);
        close();
        if (!c.interes.includes(vid)) db.updateContact(cid, {interes: [vid].concat(c.interes)});
        db.venderVehiculo(vid, {contactId: cid, precio, userId: n.querySelector('#ldVentaU').value, financiado});
        db.updateContact(cid, {proxima: null, temperatura: 'caliente', etiquetas: [...new Set((c.etiquetas || []).filter(t => t !== 'Presupuesto enviado').concat(['Cliente']))]});
        App.toast('¡Venta registrada! 🎉', {sub: `${ui.vehNombre(v)} · ${App.eur(precio)} · retirado de los portales`, icon: 'badge-euro'});
      };
    }});
}

/* ---------- modal: WhatsApp a varios ---------- */
const PLANTILLAS_MASIVAS = [
  {id: 'seguimiento', label: 'Seguimiento', texto: 'Hola {nombre} 👋 ¿Sigues buscando coche? El {coche} sigue disponible. Si quieres, te lo reservo para que vengas a probarlo esta semana.'},
  {id: 'bajada', label: 'Bajada de precio', texto: 'Hola {nombre}, te escribo de {concesionario}: hemos rebajado el {coche}. ¿Te paso el precio nuevo y la cuota?'},
  {id: 'prueba', label: 'Invitar a probarlo', texto: 'Hola {nombre} 🙂 Este sábado abrimos de 10:00 a 14:00. ¿Te apunto para probar el {coche}? Solo tienes que decirme la hora.'},
  {id: 'libre', label: 'Mensaje libre', texto: ''}
];
function modalWhatsAppVarios(ids, onDone) {
  const cs = ids.map(db.contact).filter(Boolean); if (!cs.length) return;
  const sust = (txt, c) => { const v = veh1(c); return txt.replace(/\{nombre\}/g, nom1(c)).replace(/\{coche\}/g, v ? ui.vehNombre(v) : 'coche que te interesa').replace(/\{concesionario\}/g, App.S.dealer.nombre); };
  let plantilla = PLANTILLAS_MASIVAS[0];
  App.modal({title: `WhatsApp a ${cs.length} ${cs.length === 1 ? 'cliente' : 'clientes'}`, sub: 'Cada uno lo recibe por separado, con su nombre y su coche.', size: 'lg',
    body: html`<div class="ld-bulk-wa">
      <div class="stack">
        <div class="chips" id="ldBwTpl">${PLANTILLAS_MASIVAS.map((p, i) => html`<button class="chip ${i ? '' : 'is-on'}" data-tpl="${p.id}">${p.label}</button>`)}</div>
        <div class="field"><label>Mensaje</label><textarea class="textarea" id="ldBwTxt" rows="5">${plantilla.texto}</textarea>
          <div class="row-sm wrap mt-4"><span class="xs muted">Variables:</span>${['{nombre}', '{coche}', '{concesionario}'].map(x => html`<button class="tag ld-var" data-var="${x}">${x}</button>`)}</div></div>
        <div class="av-stack">${cs.slice(0, 8).map(c => App.avatar(c.nombre, {size: 'sm'}))}${cs.length > 8 ? html`<span class="small muted" style="margin-left:8px">+${cs.length - 8}</span>` : ''}</div>
      </div>
      <div class="ld-bulk-wa__prev"><div class="xs up mb-8">Vista previa · ${nom2(cs[0])}</div><div class="wa-bubble wa-bubble--out" id="ldBwPrev"></div></div>
    </div>`,
    foot: html`<button class="btn" data-close>Cancelar</button><button class="btn btn--wa" id="ldBwOk">${icon('send', 15)}Enviar a ${cs.length}</button>`,
    onMount(n, close) {
      const ta = n.querySelector('#ldBwTxt'), prev = n.querySelector('#ldBwPrev');
      const upd = () => { prev.textContent = sust(ta.value, cs[0]) || 'Escribe el mensaje…'; };
      ta.addEventListener('input', upd); upd();
      n.querySelector('#ldBwTpl').addEventListener('click', e => { const b = e.target.closest('[data-tpl]'); if (!b) return; plantilla = PLANTILLAS_MASIVAS.find(p => p.id === b.dataset.tpl); n.querySelectorAll('#ldBwTpl .chip').forEach(x => x.classList.toggle('is-on', x === b)); ta.value = plantilla.texto; upd(); ta.focus(); });
      n.addEventListener('click', e => { const b = e.target.closest('[data-var]'); if (!b) return; const s = ta.selectionStart ?? ta.value.length; ta.value = ta.value.slice(0, s) + b.dataset.var + ta.value.slice(ta.selectionEnd ?? s); ta.focus(); upd(); });
      n.querySelector('#ldBwOk').onclick = () => {
        const txt = ta.value.trim(); if (!txt) return ta.focus();
        close();
        cs.forEach(c => db.addMessage(c.id, {from: 'agente', texto: sust(txt, c)}));
        App.toast(`Enviado a ${cs.length}`, {sub: 'Por WhatsApp, uno a uno y con su nombre', tipo: 'wa'});
        onDone && onDone();
      };
    }});
}

/* ---------- modal: nuevo lead ---------- */
App.modals.nuevoLead = (opts = {}) => {
  const st = {vid: opts.vehicle || null, asignado: turnoComercial(), financiar: false, cuenta: false, ia: true, origen: opts.origen || 'cochesnet'};
  const origenes = ['cochesnet', 'wallapop', 'milanuncios', 'web', 'meta', 'fbmarket', 'autoscout', 'whatsapp', 'google', 'telefono', 'exposicion', 'recomendado'];
  const cocheSel = () => { const v = db.veh(st.vid); return v ? html`<div class="ld-nl-veh">${ui.thumb(v)}<div class="grow"><b>${ui.vehNombre(v)}</b><div class="xs muted">${ui.vehSub(v)}</div></div><b class="tnum">${App.eur(v.precio)}</b><button class="icon-btn" data-nl="quitar" aria-label="Quitar">${icon('x', 16)}</button></div>` : ''; };
  const sugerencias = q => { const w = App.norm(q).split(/\s+/).filter(Boolean); if (!w.length) return ''; const vs = db.stock().filter(v => { const s = App.norm(`${v.marca} ${v.modelo} ${v.version} ${v.matricula} ${v.anio}`); return w.every(x => s.includes(x)); }).slice(0, 5); return vs.length ? html`${vs.map(v => html`<button class="ld-pick__item" data-nlv="${v.id}">${ui.thumb(v, 'thumb--sm')}<span class="ld-pick__main"><b>${ui.vehNombre(v)}</b><span>${ui.vehSub(v)}</span></span><b class="tnum small">${App.eur(v.precio)}</b></button>`)}` : html`<div class="small muted" style="padding:10px 12px">Ningún coche coincide</div>`; };
  App.modal({title: 'Nuevo lead', sub: 'Se asigna por turnos y queda en el embudo al momento.', size: 'lg', cls: 'ld-nl',
    body: html`<div class="form-grid">
      <div class="field"><label>Nombre y apellidos</label><input class="input" id="nlNombre" placeholder="Ej.: Ana García Ruiz" autofocus autocomplete="off"></div>
      <div class="field"><label>Teléfono (WhatsApp)</label><div class="input-group">${icon('phone', 16)}<input class="input" id="nlTel" inputmode="tel" placeholder="612 34 56 78" autocomplete="off"></div></div>
      <div class="field"><label>Email <span class="faint">(opcional)</span></label><input class="input" id="nlEmail" type="email" placeholder="ana@gmail.com" autocomplete="off"></div>
      <div class="field"><label>Origen</label><select class="select" id="nlOrigen">${origenes.map(o => html`<option value="${o}" ${o === st.origen ? 'selected' : ''}>${C.origen(o).label}</option>`)}</select></div>
      <div class="field span-all"><label>Coche de interés</label>
        <div id="nlVeh">${cocheSel()}</div>
        <div class="ld-nl-search ${st.vid ? 'hidden' : ''}"><div class="input-group">${icon('search', 16)}<input class="input" id="nlVq" placeholder="Busca en el stock: marca, modelo o matrícula" autocomplete="off"></div><div class="ld-nl-sug" id="nlSug"></div></div>
      </div>
      <div class="field"><label>Comercial <span class="faint">· por turnos</span></label><div class="ld-nl-coms" id="nlComs">${comerciales().concat(App.S.users.filter(u => u.rol === 'Gerente')).map(u => html`<button class="ld-nl-com ${u.id === st.asignado ? 'is-on' : ''}" data-u="${u.id}">${App.avatar(u.nombre, {size: 'sm', color: u.color})}${nom1(u)}</button>`)}</div></div>
      <div class="field"><label>Presupuesto</label><div class="input-group ld-suffix"><input class="input tnum" id="nlPres" inputmode="numeric" placeholder="18.000"><span class="input-group__suffix">€</span></div></div>
      <div class="span-all ld-nl-toggles">
        <div class="between ld-toggle-row"><span class="semi">¿Quiere financiar?</span><button class="switch" data-nl="financiar" aria-label="Financiar"></button></div>
        <div class="ld-nl-extra hidden" id="nlFin"><div class="form-grid"><div class="field"><label>Entrada</label><div class="input-group ld-suffix"><input class="input tnum" id="nlEntrada" inputmode="numeric" placeholder="3.000"><span class="input-group__suffix">€</span></div></div><div class="field"><label>Plazo</label><select class="select" id="nlPlazo"><option>60</option><option>72</option><option>84</option><option selected>96</option></select></div></div><div class="small muted mt-8" id="nlCuota"></div></div>
        <div class="between ld-toggle-row"><span class="semi">¿Deja coche a cuenta?</span><button class="switch" data-nl="cuenta" aria-label="Coche a cuenta"></button></div>
        <div class="ld-nl-extra hidden" id="nlCuenta"><div class="form-grid form-grid--3"><div class="field"><label>Marca y modelo</label><input class="input" id="nlCcM" placeholder="Seat León"></div><div class="field"><label>Año</label><input class="input tnum" id="nlCcA" inputmode="numeric" placeholder="2016"></div><div class="field"><label>Km</label><input class="input tnum" id="nlCcK" inputmode="numeric" placeholder="120.000"></div></div></div>
        <div class="ld-nl-ia"><span class="ld-nl-ia__ico">${icon('sparkles', 18)}</span><span class="grow"><b>Que la IA le escriba ahora por WhatsApp</b><span>Se presenta, le da precio y cuota del coche y le propone venir a probarlo.</span></span><button class="switch is-on" data-nl="ia" aria-label="IA"></button></div>
      </div>
    </div>`,
    foot: html`<button class="btn" data-close>Cancelar</button><button class="btn btn--primary" id="nlOk">${icon('user-plus', 16)}Crear lead</button>`,
    onMount(n, close) {
      const $ = s => n.querySelector(s);
      const drawVeh = () => { $('#nlVeh').innerHTML = App.str(cocheSel()); $('.ld-nl-search').classList.toggle('hidden', !!st.vid); drawCuota(); };
      const drawCuota = () => { const v = db.veh(st.vid); const e = +$('#nlEntrada').value.replace(/\D/g, '') || 0; $('#nlCuota').innerHTML = v ? App.str(html`Cuota orientativa del ${ui.vehNombre(v)}: <b class="ink">${App.num(db.cuota(v.precio, e, +$('#nlPlazo').value))} €/mes</b> · TIN ${App.dec(App.S.dealer.tin)} %`) : 'Elige un coche para ver la cuota.'; };
      $('#nlVq').addEventListener('input', e => { $('#nlSug').innerHTML = App.str(sugerencias(e.target.value)); });
      $('#nlEntrada').addEventListener('input', drawCuota); $('#nlPlazo').addEventListener('change', drawCuota);
      n.addEventListener('click', e => {
        const sv = e.target.closest('[data-nlv]'); if (sv) { st.vid = sv.dataset.nlv; $('#nlVq').value = ''; $('#nlSug').innerHTML = ''; const v = db.veh(st.vid); if (!$('#nlPres').value) $('#nlPres').value = App.num(v.precio); drawVeh(); return; }
        const u = e.target.closest('[data-u]'); if (u) { st.asignado = u.dataset.u; n.querySelectorAll('.ld-nl-com').forEach(x => x.classList.toggle('is-on', x === u)); return; }
        const t = e.target.closest('[data-nl]'); if (!t) return;
        const k = t.dataset.nl;
        if (k === 'quitar') { st.vid = null; drawVeh(); setTimeout(() => $('#nlVq').focus(), 30); return; }
        st[k] = !st[k]; t.classList.toggle('is-on', st[k]);
        if (k === 'financiar') { $('#nlFin').classList.toggle('hidden', !st.financiar); drawCuota(); }
        if (k === 'cuenta') $('#nlCuenta').classList.toggle('hidden', !st.cuenta);
      });
      $('#nlOk').onclick = () => {
        const nombre = $('#nlNombre').value.trim().replace(/\s+/g, ' ');
        const tel = $('#nlTel').value.trim();
        if (!nombre) { $('#nlNombre').focus(); return App.toast('Falta el nombre', {tipo: 'warn'}); }
        if (tel.replace(/\D/g, '').length < 9) { $('#nlTel').focus(); return App.toast('Revisa el teléfono', {sub: 'Necesitamos 9 cifras para escribirle por WhatsApp', tipo: 'warn'}); }
        const v = db.veh(st.vid);
        const ccTxt = $('#nlCcM').value.trim().split(' ');
        const cuenta = st.cuenta && ccTxt[0] ? {marca: App.cap(ccTxt[0]), modelo: ccTxt.slice(1).join(' ') || '—', anio: +$('#nlCcA').value || 2016, km: +$('#nlCcK').value.replace(/\D/g, '') || 100000} : null;
        const etiquetas = [].concat(cuenta ? ['Coche a cuenta'] : [], st.financiar ? ['Financiación'] : []);
        const c = db.addContact({nombre: nombre.split(' ').map(App.cap).join(' '), tel: App.telFmt(tel) || tel, email: $('#nlEmail').value.trim(), origen: $('#nlOrigen').value,
          interes: v ? [v.id] : [], presupuesto: +$('#nlPres').value.replace(/\D/g, '') || 0, financiar: st.financiar, cocheACuenta: cuenta, asignado: st.asignado,
          etiquetas, iaActiva: st.ia, temperatura: 'templado', proxima: {fecha: App.addMin(new Date(), 15).toISOString(), texto: st.ia ? 'Revisar la conversación con la IA' : 'Primera llamada'}});
        close();
        App.open.contacto(c.id);
        const u = db.user(st.asignado);
        App.toast('Lead creado', {sub: `${nom2(c)} · asignado a ${nom1(u)}`, tipo: 'lead', icon: 'user-plus'});
        if (st.ia) {
          App.T.typing[c.id] = true; App.emit('change', 'typing');
          setTimeout(() => {
            delete App.T.typing[c.id];
            const fin = st.financiar && v ? ` Financiado se queda desde ${cuotaTxt(v)}.` : '';
            const texto = v
              ? `¡Hola ${nom1(c)}! 👋 Soy el asistente de ${App.S.dealer.nombre}. Te escribo por el ${ui.vehNombre(v)} ${v.version}: ${v.anio}, ${App.km(v.km)} y ${v.garantia} meses de garantía, a ${App.eur(v.precio)}.${fin}${cuenta ? ` Tu ${cuenta.marca} ${cuenta.modelo} te lo tasamos en 20 minutos.` : ''}\n\n¿Te viene bien venir a verlo y probarlo esta semana?`
              : `¡Hola ${nom1(c)}! 👋 Soy el asistente de ${App.S.dealer.nombre}. Gracias por contactar con nosotros. ¿Qué coche estás buscando? Dime tipo de coche y presupuesto (o cuota al mes) y te paso las mejores opciones.`;
            db.addMessage(c.id, {from: 'ia', ia: true, segundos: 4, texto});
            db.addTimeline(c.id, {tipo: 'ia', texto: 'La IA le escribió por WhatsApp en 4 s', autor: 'ia'});
            App.toast('La IA ya le ha escrito por WhatsApp', {sub: nom2(c), tipo: 'wa', accion: 'Ver chat', onAccion: () => App.open.whatsapp(c.id)});
          }, 1600);
        }
      };
    }});
};

/* piezas compartidas con whatsapp.js */
App.ld = {elegirCoche, resumenIA, encajan, iaResponder, textoFicha, modalPerdido, modalVenta, veh1, nom1, nom2, cuotaTxt, vencida, TL};

/* =====================================================================
   LISTADO
   ===================================================================== */
const st = {com: [], origen: '', temp: '', q: '', sort: {k: 'ultimo', dir: -1}, sel: [], plegadas: {vendido: true, perdido: true}, left: 0, tab: {}, tlTipo: 'nota'};
const vista = () => App.S.prefs.vistaLeads === 'lista' ? 'lista' : 'embudo';

function filtrados() {
  const w = App.norm(st.q).split(/\s+/).filter(Boolean);
  return App.S.contacts.filter(c =>
    (!st.com.length || st.com.includes(c.asignado)) &&
    (!st.origen || c.origen === st.origen) &&
    (!st.temp || c.temperatura === st.temp) &&
    (!w.length || (s => w.every(x => s.includes(x)))(App.norm(`${c.nombre} ${c.tel} ${c.email} ${c.ciudad} ${vehDe(c).map(v => v.marca + ' ' + v.modelo).join(' ')}`))));
}

function statsHTML() {
  const S = App.S, h = S.hist[S.hist.length - 1] || {ventas: 0, leads: 1};
  const nuevosHoy = S.contacts.filter(c => App.isToday(c.creado)).length;
  const neg = S.contacts.filter(c => c.etapa === 'negociacion');
  const sinAtender = S.contacts.filter(c => c.necesitaHumano).length;
  const items = [
    {ic: 'users', color: 'var(--accent)', v: App.num(db.activos().length), l: 'Leads activos', s: sinAtender ? html`<span class="red">${sinAtender} ${sinAtender === 1 ? 'espera' : 'esperan'} a una persona</span>` : 'Todos atendidos'},
    {ic: 'zap', color: 'var(--violet)', v: App.num(nuevosHoy), l: 'Nuevos hoy', s: nuevosHoy ? 'La IA ya les ha contestado' : `${S.contacts.filter(c => Date.now() - new Date(c.creado) < 864e5).length} en las últimas 24 h`},
    {ic: 'target', color: 'var(--green)', v: App.pct(h.leads ? h.ventas / h.leads * 100 : 0), l: 'Conversión del mes', s: `${h.ventas} ventas de ${h.leads} leads`},
    {ic: 'handshake', color: 'var(--pink)', v: App.eur(App.sum(neg, precioLead)), l: 'En negociación', s: `${neg.length} clientes`}
  ];
  return html`<div class="ld-stats">${items.map(i => html`<div class="ld-stat"><span class="ld-stat__ico" style="--c:${i.color}">${icon(i.ic, 16)}</span><div class="ld-stat__txt"><b class="tnum">${i.v}</b><span>${i.l}</span><small>${i.s}</small></div></div>`)}</div>`;
}

function toolbarHTML(n) {
  const users = App.S.users.filter(u => App.S.contacts.some(c => c.asignado === u.id));
  const hayFiltro = st.com.length || st.origen || st.temp || st.q;
  const origenes = [...new Set(App.S.contacts.map(c => c.origen))];
  return html`<div class="ld-toolbar">
    <div class="input-group ld-search">${icon('search', 16)}<input class="input" id="ldQ" placeholder="Buscar por nombre, teléfono o coche" value="${st.q}" data-act-input="ld-q" autocomplete="off"></div>
    <div class="ld-coms" title="Filtrar por comercial">${users.map(u => html`<button class="ld-com ${st.com.includes(u.id) ? 'is-on' : ''} ${st.com.length && !st.com.includes(u.id) ? 'is-off' : ''}" data-act="ld-com" data-id="${u.id}" title="${u.nombre}">${App.avatar(u.nombre, {size: 'sm', color: u.color})}<span>${nom1(u)}</span></button>`)}</div>
    <select class="select select--sm ld-sel" data-act-change="ld-origen" aria-label="Origen"><option value="">Origen</option>${origenes.map(o => html`<option value="${o}" ${st.origen === o ? 'selected' : ''}>${C.origen(o).label}</option>`)}</select>
    <select class="select select--sm ld-sel" data-act-change="ld-temp" aria-label="Temperatura"><option value="">Temperatura</option>${Object.entries(C.TEMP).map(([k, t]) => html`<option value="${k}" ${st.temp === k ? 'selected' : ''}>${t.label}</option>`)}</select>
    ${hayFiltro ? html`<button class="btn btn--ghost btn--sm" data-act="ld-limpiar">${icon('x', 14)}Quitar filtros <span class="chip__n">${n}</span></button>` : ''}
  </div>`;
}

function cardHTML(c, first) {
  const v = veh1(c), p = c.proxima, late = vencida(p), unread = db.sinLeer(c.id);
  const tags = (c.etiquetas || []).filter(t => ['Coche a cuenta', 'Financiación', 'Financiación aprobada', 'Señal pagada', 'Presupuesto enviado', 'Urgente'].includes(t)).slice(0, 2);
  return html`<article class="ld-card ${c.necesitaHumano ? 'is-alert' : ''}" data-cid="${c.id}" ${first ? raw('data-tour="lead-card"') : ''} tabindex="0">
    <div class="ld-card__top">
      ${App.avatar(c.nombre, {size: 'sm'})}
      <b class="ld-card__name">${nom2(c)}</b>
      ${unread ? html`<span class="ld-card__unread" title="${unread} sin leer en WhatsApp"></span>` : ''}
      <span class="temp temp--${c.temperatura} ld-card__temp" title="${C.TEMP[c.temperatura].label}">${icon(C.TEMP[c.temperatura].icon, 13)}</span>
      ${ui.portal(c.origen, 'sm')}
    </div>
    ${v ? html`<div class="ld-card__veh">${ui.thumb(v, 'thumb--sm')}<span class="grow"><b>${ui.vehNombre(v)}</b><span class="tnum">${App.eur(v.precioVenta || v.precio)}${c.interes.length > 1 ? html` · +${c.interes.length - 1}` : ''}</span></span></div>` : ''}
    ${c.necesitaHumano ? html`<div class="ld-card__alert">${icon('user-check', 13)}Quiere hablar con una persona</div>` : ''}
    ${p && !['vendido', 'perdido'].includes(c.etapa) ? html`<div class="ld-card__next ${late ? 'is-late' : ''}">${icon(late ? 'alert-triangle' : 'clock-3', 13)}<span class="ellipsis">${p.texto}</span><b>${late ? App.rel(p.fecha).replace('hace ', '−') : App.relFuture(p.fecha)}</b></div>` : ''}
    ${c.etapa === 'perdido' && c.motivoPerdida ? html`<div class="ld-card__next">${icon('circle-x', 13)}<span class="ellipsis">${c.motivoPerdida}</span></div>` : ''}
    ${tags.length ? html`<div class="ld-card__tags">${tags.map(t => html`<span class="tag">${t}</span>`)}</div>` : ''}
    <div class="ld-card__foot">
      ${c.iaActiva && !c.necesitaHumano && !['vendido', 'perdido'].includes(c.etapa) ? ui.ia('La lleva la IA') : ''}
      <span class="grow"></span>
      <span class="xs faint nowrap">${App.rel(c.ultimoContacto)}</span>
      ${ui.user(c.asignado)}
      <button class="icon-btn ld-card__move" data-act="ld-mover" data-id="${c.id}" aria-label="Mover a…">${icon('more-horizontal', 16)}</button>
    </div>
  </article>`;
}

function embudoHTML(cs) {
  let first = true;
  return html`<div class="ld-board" data-tour="pipeline" id="ldBoard">${C.ETAPAS.map(e => {
    const col = cs.filter(c => c.etapa === e.id).sort((a, b) => (b.necesitaHumano ? 1 : 0) - (a.necesitaHumano ? 1 : 0) || b.ultimoContacto.localeCompare(a.ultimoContacto));
    const fin = ['vendido', 'perdido'].includes(e.id), pleg = fin && st.plegadas[e.id];
    const suma = App.sum(col, precioLead);
    const cards = col.map(c => { const h = cardHTML(c, first && !fin); first = false; return h; });
    return html`<section class="ld-col ${fin ? 'ld-col--fin' : ''} ${pleg ? 'is-folded' : ''}" data-etapa="${e.id}" style="--ec:${e.color}">
      <header class="ld-col__head" ${fin ? raw(`data-act="ld-plegar" data-id="${e.id}"`) : ''}>
        <span class="ld-col__dot"></span><b>${e.label}</b><span class="ld-col__n">${col.length}</span>
        <span class="ld-col__sum tnum">${App.k(suma)} €</span>
        ${fin ? html`<span class="ld-col__fold">${icon(pleg ? 'chevron-right' : 'chevron-left', 15)}</span>` : ''}
      </header>
      <div class="ld-col__body" data-keep-scroll="ldCol-${e.id}">${cards.length ? cards : html`<div class="ld-col__empty">${icon(e.icon, 18)}<span>Suelta aquí un lead</span></div>`}</div>
    </section>`;
  })}</div>`;
}

const COLS = [
  {k: 'nombre', l: 'Cliente', v: c => c.nombre},
  {k: 'tel', l: 'Teléfono', v: c => c.tel},
  {k: 'coche', l: 'Coche', v: c => { const v = veh1(c); return v ? ui.vehNombre(v) : ''; }},
  {k: 'origen', l: 'Origen', v: c => C.origen(c.origen).label},
  {k: 'etapa', l: 'Etapa', v: c => C.ETAPAS.findIndex(e => e.id === c.etapa)},
  {k: 'temp', l: 'Temperatura', v: c => ({caliente: 0, templado: 1, frio: 2})[c.temperatura]},
  {k: 'com', l: 'Comercial', v: c => (db.user(c.asignado) || {}).nombre || ''},
  {k: 'prox', l: 'Próxima acción', v: c => c.proxima ? c.proxima.fecha : 'z'},
  {k: 'ultimo', l: 'Último contacto', v: c => c.ultimoContacto}
];
function listaHTML(cs) {
  const col = COLS.find(x => x.k === st.sort.k) || COLS[8];
  const rows = cs.slice().sort((a, b) => { const x = col.v(a), y = col.v(b); return (x > y ? 1 : x < y ? -1 : 0) * st.sort.dir; });
  st.sel = st.sel.filter(id => rows.some(c => c.id === id));
  const all = rows.length && st.sel.length === rows.length;
  return html`${st.sel.length ? html`<div class="ld-bulk slide-in">
      <b>${st.sel.length} ${st.sel.length === 1 ? 'seleccionado' : 'seleccionados'}</b>
      <button class="btn btn--sm" data-act="ld-bulk-com">${icon('user-check', 15)}Asignar comercial</button>
      <button class="btn btn--sm" data-act="ld-bulk-etapa">${icon('git-branch', 15)}Cambiar etapa</button>
      <button class="btn btn--sm btn--wa" data-act="ld-bulk-wa">${icon('message-circle', 15)}WhatsApp a los seleccionados</button>
      <button class="btn btn--sm btn--ghost" data-act="ld-bulk-clear">Cancelar</button>
    </div>` : ''}
    <div class="card ld-table-card"><div class="table-wrap" data-keep-scroll="ldTable"><table class="table ld-table">
      <thead><tr><th class="ld-th-check"><button class="ld-check ${all ? 'is-on' : st.sel.length ? 'is-mid' : ''}" data-act="ld-sel-all" aria-label="Seleccionar todos">${icon('check', 12)}</button></th>
        ${COLS.map(x => html`<th><button class="ld-sort ${st.sort.k === x.k ? 'is-on' : ''}" data-act="ld-sort" data-k="${x.k}">${x.l}${st.sort.k === x.k ? icon(st.sort.dir > 0 ? 'arrow-up' : 'arrow-down', 12) : ''}</button></th>`)}</tr></thead>
      <tbody>${rows.length ? rows.map(c => { const v = veh1(c), late = vencida(c.proxima), on = st.sel.includes(c.id); return html`<tr class="is-link ${on ? 'is-sel' : ''}" data-act="contacto" data-id="${c.id}">
        <td class="ld-td-check" data-act="ld-sel" data-id="${c.id}"><span class="ld-check ${on ? 'is-on' : ''}">${icon('check', 12)}</span></td>
        <td><span class="cell-main">${App.avatar(c.nombre, {size: 'sm'})}<span style="min-width:0"><b>${c.nombre}</b><span>${c.ciudad}</span></span>${c.necesitaHumano ? html`<span class="badge badge--red" title="Quiere hablar con una persona">${icon('user-check', 12)}Persona</span>` : db.sinLeer(c.id) ? html`<span class="ld-card__unread"></span>` : ''}</span></td>
        <td class="nowrap tnum muted">${c.tel}</td>
        <td>${v ? html`<span class="cell-main">${ui.thumb(v, 'thumb--sm')}<span style="min-width:0"><b>${ui.vehNombre(v)}</b><span class="tnum">${App.eur(v.precioVenta || v.precio)}</span></span></span>` : html`<span class="faint">—</span>`}</td>
        <td>${ui.origen(c.origen)}</td>
        <td>${ui.etapa(c.etapa)}</td>
        <td>${ui.temp(c.temperatura)}</td>
        <td>${ui.user(c.asignado, {name: true})}</td>
        <td class="ld-td-next ${late ? 'red' : ''}">${c.proxima && !['vendido', 'perdido'].includes(c.etapa) ? html`<b class="ellipsis">${c.proxima.texto}</b><span>${late ? 'Vencida · ' + App.rel(c.proxima.fecha) : App.relFuture(c.proxima.fecha)}</span>` : html`<span class="faint">—</span>`}</td>
        <td class="nowrap muted">${App.rel(c.ultimoContacto)}</td>
      </tr>`; }) : html`<tr><td colspan="10">${ui.empty('users', 'Ningún lead con estos filtros', 'Quita algún filtro para ver más.')}</td></tr>`}</tbody>
    </table></div></div>`;
}

function listadoHTML() {
  const cs = filtrados(), v = vista();
  return html`<div class="ld">
    <div class="page-head ld-head">
      <div><h1>Leads y clientes</h1><p>Entran solos de los portales y de WhatsApp. La IA contesta y tu equipo sabe qué hacer con cada uno.</p></div>
      <div class="page-head__actions">
        <div class="seg" role="tablist"><button class="${v === 'embudo' ? 'is-on' : ''}" data-act="ld-vista" data-v="embudo">${icon('kanban', 15)}Embudo</button><button class="${v === 'lista' ? 'is-on' : ''}" data-act="ld-vista" data-v="lista">${icon('list', 15)}Lista</button></div>
        <button class="btn btn--primary" data-act="nuevo" data-what="lead">${icon('user-plus', 16)}Nuevo lead</button>
      </div>
    </div>
    ${statsHTML()}
    ${toolbarHTML(cs.length)}
    ${v === 'embudo' ? embudoHTML(cs) : listaHTML(cs)}
  </div>`;
}

/* =====================================================================
   FICHA DEL CLIENTE
   ===================================================================== */
const PASOS = C.ETAPAS.filter(e => e.id !== 'perdido');
const FTABS = [
  {id: 'actividad', l: 'Actividad', ic: 'activity'},
  {id: 'whatsapp', l: 'WhatsApp', ic: 'message-circle'},
  {id: 'citas', l: 'Citas', ic: 'calendar'},
  {id: 'presupuestos', l: 'Presupuestos', ic: 'file-text'},
  {id: 'tasfin', l: 'Tasaciones y financiación', ic: 'landmark'}
];

function heroHTML(c) {
  const e = C.etapa(c.etapa), u = db.user(c.asignado), idx = PASOS.findIndex(x => x.id === c.etapa);
  return html`<div class="card ld-hero">
    <div class="ld-hero__top">
      ${App.avatar(c.nombre, {size: 'xl'})}
      <div class="ld-hero__id">
        <div class="row-sm wrap"><h1>${c.nombre}</h1>${c.necesitaHumano ? html`<span class="badge badge--red">${icon('user-check', 13)}Quiere hablar con una persona</span>` : c.iaActiva && !['vendido', 'perdido'].includes(c.etapa) ? ui.ia('La lleva la IA') : ''}</div>
        <div class="ld-hero__badges">
          <button class="ld-pill badge badge--${e.badge} badge--dot" data-act="ld-etapa-menu" data-id="${c.id}">${e.label}${icon('chevron-down', 13)}</button>
          <button class="ld-pill temp temp--${c.temperatura}" data-act="ld-temp-menu" data-id="${c.id}">${icon(C.TEMP[c.temperatura].icon, 13)}${C.TEMP[c.temperatura].label}${icon('chevron-down', 13)}</button>
          ${ui.origen(c.origen)}
          <button class="ld-pill ld-pill--user" data-act="ld-com-menu" data-id="${c.id}">${ui.user(c.asignado)}<span class="small">${u ? u.nombre : 'Sin asignar'}</span>${icon('chevron-down', 13)}</button>
        </div>
        <div class="ld-hero__meta">
          <span>${icon('phone', 14)}${ui.telLink(c.tel)}</span>
          ${c.email ? html`<span class="ld-hero__mail">${icon('mail', 14)}<a href="mailto:${c.email}" class="ellipsis">${c.email}</a></span>` : ''}
          <span>${icon('map-pin', 14)}${c.ciudad}</span>
          <span>${icon('calendar-plus', 14)}Alta ${App.rel(c.creado)}</span>
          ${c.motivoPerdida && c.etapa === 'perdido' ? html`<span class="red">${icon('circle-x', 14)}${c.motivoPerdida}</span>` : ''}
        </div>
      </div>
    </div>
    <div class="ld-actions" data-tour="ficha-acciones">
      <button class="btn btn--wa" data-act="whatsapp" data-id="${c.id}">${icon('message-circle', 16)}WhatsApp${db.sinLeer(c.id) ? html`<span class="ld-actions__n">${db.sinLeer(c.id)}</span>` : ''}</button>
      <button class="btn" data-act="llamar" data-id="${c.id}">${icon('phone', 16)}Llamar</button>
      <button class="btn" data-act="ld-cita" data-id="${c.id}">${icon('calendar-plus', 16)}Cita</button>
      <button class="btn" data-act="ld-presu" data-id="${c.id}">${icon('file-text', 16)}Presupuesto</button>
      <button class="btn hide-m" data-act="ld-tasacion" data-id="${c.id}">${icon('scan-line', 16)}Tasación</button>
      <button class="btn hide-m" data-act="ld-fin" data-id="${c.id}">${icon('landmark', 16)}Financiación</button>
      <button class="btn hide-m" data-act="ld-tarea" data-id="${c.id}">${icon('list-checks', 16)}Tarea</button>
      <button class="btn btn--icon" data-act="ld-more" data-id="${c.id}" aria-label="Más acciones">${icon('more-horizontal', 18)}</button>
    </div>
    <div class="ld-steps ${c.etapa === 'perdido' ? 'is-lost' : ''}">${PASOS.map((p, i) => html`<button class="ld-step ${i < idx ? 'is-done' : ''} ${i === idx ? 'is-on' : ''}" data-act="ld-step" data-id="${c.id}" data-etapa="${p.id}" title="Pasar a «${p.label}»"><i></i><span>${p.label}</span></button>`)}</div>
  </div>`;
}

function tlHTML(c) {
  return html`<div class="ld-tl-new">
      <div class="seg seg--sm">${[['nota', 'sticky-note', 'Nota'], ['llamada', 'phone', 'Llamada']].map(([k, ic, l]) => html`<button class="${st.tlTipo === k ? 'is-on' : ''}" data-act="ld-tl-tipo" data-k="${k}">${icon(ic, 14)}${l}</button>`)}</div>
      <textarea class="textarea" id="ldTlTxt" rows="2" placeholder="${st.tlTipo === 'llamada' ? 'Resumen de la llamada: qué ha dicho, qué queda pendiente…' : 'Escribe una nota para el equipo…'}"></textarea>
      <div class="row-sm"><span class="xs faint grow">Queda en el historial con tu nombre y la hora.</span><button class="btn btn--primary btn--sm" data-act="ld-tl-save" data-id="${c.id}">${icon('check', 14)}Guardar</button></div>
    </div>
    <div class="tl ld-tl mt-16">${c.timeline.map(t => { const x = TL[t.tipo] || TL.nota; const ia = t.autor === 'ia'; return html`<div class="tl__item">
      <span class="tl__ico" style="color:${x.color};background:color-mix(in srgb,${x.color} 12%,var(--surface))">${icon(x.icon, 15)}</span>
      <div class="tl__body"><div class="ld-tl__txt">${t.texto}</div>
        <div class="tl__time">${ia ? html`<span class="ld-tl__ia">${icon('sparkles', 11)}Asistente IA</span>` : ui.autor(t.autor)} · ${App.rel(t.fecha)}</div></div>
    </div>`; })}</div>`;
}

function waTabHTML(c) {
  const ms = db.mensajes(c.id);
  if (!ms.length) return ui.empty('message-circle', 'Aún no hay conversación', 'Escríbele por WhatsApp o deja que la IA le salude.', html`<button class="btn btn--wa" data-act="whatsapp" data-id="${c.id}">${icon('message-circle', 16)}Abrir WhatsApp</button>`);
  const bubbles = App.wa && App.wa.bubbles ? App.wa.bubbles(ms.slice(-6), c) : ms.slice(-6).map(m => html`<div class="small">${m.texto}</div>`);
  return html`<div class="ld-wa-prev wa-scroll">${ms.length > 6 ? html`<div class="wa-sys"><span>${ms.length - 6} mensajes anteriores</span></div>` : ''}${bubbles}</div>
    <div class="row mt-12"><span class="small muted grow">${c.iaActiva ? html`${icon('sparkles', 14)} La IA está contestando por ti` : 'Esta conversación la llevas tú'}</span><button class="btn btn--wa btn--sm" data-act="whatsapp" data-id="${c.id}">${icon('message-circle', 15)}Abrir conversación</button></div>`;
}

function citasHTML(c) {
  const evs = db.eventosDe(c.id).slice().reverse();
  return html`<div class="between mb-12"><span class="small muted">${evs.length} ${evs.length === 1 ? 'cita' : 'citas'}</span><button class="btn btn--sm" data-act="ld-cita" data-id="${c.id}">${icon('calendar-plus', 15)}Nueva cita</button></div>
    ${evs.length ? html`<div class="list ld-mini-list">${evs.map(e => { const v = db.veh(e.vehicleId), fut = new Date(e.inicio) > new Date(); return html`<a class="list__item is-link" href="#/agenda">
      <span class="ld-date ${fut ? 'is-fut' : ''}"><b>${new Date(e.inicio).getDate()}</b><span>${App.MESES_C[new Date(e.inicio).getMonth()]}</span></span>
      <span class="list__main"><b>${e.titulo}</b><span>${App.diaRel(e.inicio)} · ${App.hora(e.inicio)} · ${ui.autor(e.userId)}${e.origen === 'ia' ? ' · agendada por la IA' : ''}</span></span>
      <span class="list__side row-sm">${ui.evTipo(e.tipo)}${ui.estado('ESTADOS_EV', e.estado)}</span></a>`; })}</div>` : ui.empty('calendar', 'Sin citas', 'Agenda una prueba de conducción o una visita.')}`;
}

function presuHTML(c) {
  const qs = db.presupuestosDe(c.id);
  return html`<div class="between mb-12"><span class="small muted">${qs.length} ${qs.length === 1 ? 'documento' : 'documentos'}</span><button class="btn btn--sm" data-act="ld-presu" data-id="${c.id}">${icon('file-plus', 15)}Nuevo presupuesto</button></div>
    ${qs.length ? html`<div class="list ld-mini-list">${qs.map(q => { const v = db.veh(q.vehicleId), t = db.totalQuote(q); return html`<a class="list__item is-link" href="#/presupuestos/${q.id}">
      ${v ? ui.thumb(v, 'thumb--sm') : ''}
      <span class="list__main"><b>${q.numero} · ${ui.vehNombre(v)}</b><span>${App.fecha(q.fecha)} · ${q.vistas ? `visto ${q.vistas} ${q.vistas === 1 ? 'vez' : 'veces'}` : 'sin abrir'}${q.financiacion ? ` · ${App.num(q.financiacion.cuota)} €/mes` : ''}</span></span>
      <span class="list__side"><b class="ink tnum">${App.eur(t.total)}</b><div class="mt-4">${ui.estado('ESTADOS_Q', q.estado)}</div></span></a>`; })}</div>` : ui.empty('file-text', 'Sin presupuestos', 'Hazle uno en 1 minuto y mándaselo por WhatsApp.')}`;
}

function tasfinHTML(c) {
  const ts = db.tasacionesDe(c.id), fs = db.financiacionesDe(c.id);
  return html`<div class="between mb-12"><h4>Tasaciones</h4><button class="btn btn--sm" data-act="ld-tasacion" data-id="${c.id}">${icon('scan-line', 15)}Nueva tasación</button></div>
    ${ts.length ? html`<div class="list ld-mini-list">${ts.map(t => html`<a class="list__item is-link" href="#/tasaciones"><span class="kpi__ico">${icon('car-front', 15)}</span><span class="list__main"><b>${t.marca} ${t.modelo} ${t.anio}</b><span>${App.km(t.km)} · ${t.combustible} · ${App.fecha(t.fecha)}</span></span><span class="list__side">${t.oferta ? html`<b class="ink tnum">${App.eur(t.oferta)}</b>` : ''}<div class="mt-4">${ui.estado('ESTADOS_TAS', t.estado)}</div></span></a>`)}</div>` : html`<p class="small muted mb-16">${c.cocheACuenta ? `Tiene un ${c.cocheACuenta.marca} ${c.cocheACuenta.modelo} para dejar a cuenta y aún no está tasado.` : 'Sin tasaciones.'}</p>`}
    <div class="between mb-12 mt-24"><h4>Financiación</h4><button class="btn btn--sm" data-act="ld-fin" data-id="${c.id}">${icon('landmark', 15)}Nueva financiación</button></div>
    ${fs.length ? html`<div class="list ld-mini-list">${fs.map(f => html`<a class="list__item is-link" href="#/financiacion"><span class="kpi__ico">${icon('landmark', 15)}</span><span class="list__main"><b>${f.entidad}</b><span>${App.eur(f.importe)} · ${f.plazo} meses · entrada ${App.eur(f.entrada)}</span></span><span class="list__side"><b class="ink tnum">${App.num(f.cuota)} €/mes</b><div class="mt-4">${ui.estado('ESTADOS_FIN', f.estado)}</div></span></a>`)}</div>` : html`<p class="small muted">${c.financiar ? 'Quiere financiar: pídele DNI y nómina para enviarlo a la financiera.' : 'Sin financiación.'}</p>`}`;
}

function iaCardHTML(c) {
  const r = resumenIA(c);
  return html`<div class="card ld-ai">
    <div class="ld-ai__head"><h3>${icon('sparkles', 16)}Resumen de la IA</h3>${ui.ia('IA')}</div>
    <div class="ld-ai__body">
      <div class="ld-ai__row"><span>Qué busca</span><b>${r.busca}</b></div>
      <div class="ld-ai__grid">
        <div><span>Presupuesto</span><b>${r.pres}</b></div>
        <div><span>Financia</span><b>${r.financia ? 'Sí' : 'No'}</b></div>
        <div class="ld-ai__wide"><span>Coche a cuenta</span><b>${r.cuenta}</b></div>
      </div>
      <div class="ld-ai__row"><span>Objeciones</span>${r.obj.length ? html`<ul class="ld-ai__obj">${r.obj.map(o => html`<li>${o}</li>`)}</ul>` : html`<b class="muted">Ninguna por ahora</b>`}</div>
      <div class="ld-ai__prob ld-ai__prob--${r.nivel}"><div class="between"><span>Probabilidad de compra</span><b>${App.cap(r.nivel)} · ${r.p} %</b></div><div class="progress mt-8"><i style="width:${r.p}%"></i></div></div>
      <div class="ld-ai__next"><span>${icon('arrow-right', 14)}Siguiente paso recomendado</span><p>${r.paso}</p></div>
    </div>
  </div>`;
}

function lateralHTML(c) {
  const vs = vehDe(c), fits = ['vendido'].includes(c.etapa) ? [] : encajan(c), p = c.proxima, late = vencida(p);
  return html`<div class="stack ld-side">
    ${iaCardHTML(c)}
    <div class="card">
      <div class="card__head"><h3>${icon('car', 16)}${vs.length > 1 ? 'Coches de interés' : 'Coche de interés'}</h3><button class="btn btn--ghost btn--xs" data-act="ld-int-add" data-id="${c.id}">${icon('plus', 14)}Añadir</button></div>
      <div class="card__body stack-sm">${vs.length ? vs.map(v => html`<div class="ld-veh">
        <a href="#/stock/${v.id}" class="ld-veh__img"><img src="${ui.img(v, 's')}" alt="${ui.vehNombre(v)}" loading="lazy">${v.estado !== 'disponible' ? html`<span class="ld-veh__st">${ui.vehEstado(v.estado)}</span>` : ''}</a>
        <div class="ld-veh__info"><div class="between"><a href="#/stock/${v.id}" class="ld-veh__name">${ui.vehNombre(v)}</a><button class="icon-btn ld-veh__del" data-act="ld-int-del" data-id="${c.id}" data-vid="${v.id}" aria-label="Quitar">${icon('x', 15)}</button></div>
          <div class="xs muted">${ui.vehSub(v)}</div>
          <div class="ld-veh__price"><b class="tnum">${App.eur(v.precioVenta || v.precio)}</b>${v.estado !== 'vendido' ? html`<span class="small muted">o ${cuotaTxt(v)}</span>` : ''}</div></div>
      </div>`) : html`<p class="small muted">No tiene ningún coche marcado.</p>`}</div>
    </div>
    ${fits.length ? html`<div class="card">
      <div class="card__head"><div><h3>${icon('sparkles', 16)}Otros coches que le encajan</h3><p>Por presupuesto y tipo de coche</p></div></div>
      <div class="list">${fits.map(v => html`<div class="list__item ld-fit">
        <a href="#/stock/${v.id}">${ui.thumb(v, 'thumb--sm')}</a>
        <span class="list__main"><b>${ui.vehNombre(v)}</b><span class="tnum">${App.eur(v.precio)} · ${v.anio} · ${App.k(v.km)} km</span></span>
        <button class="btn btn--xs btn--success" data-act="ld-enviar-coche" data-id="${c.id}" data-vid="${v.id}" title="Enviar por WhatsApp">${icon('send', 13)}<span>Enviar</span></button>
      </div>`)}</div>
    </div>` : ''}
    <div class="card">
      <div class="card__head"><h3>${icon('clock-3', 16)}Próxima acción</h3><button class="btn btn--ghost btn--xs" data-act="ld-prox-edit" data-id="${c.id}">${icon('pencil', 13)}Editar</button></div>
      <div class="card__body">${p ? html`<div class="ld-next ${late ? 'is-late' : ''}"><b>${p.texto}</b><span>${late ? 'Vencida · ' + App.rel(p.fecha) : App.cap(App.relFuture(p.fecha))}</span></div>
        <button class="btn btn--sm btn--block mt-12" data-act="ld-prox-hecha" data-id="${c.id}">${icon('check', 15)}Hecho</button>` : html`<button class="btn btn--sm btn--block" data-act="ld-prox-edit" data-id="${c.id}">${icon('plus', 15)}Programar próxima acción</button>`}</div>
    </div>
    <div class="card">
      <div class="card__head"><h3>${icon('user', 16)}Datos</h3><button class="btn btn--ghost btn--xs" data-act="ld-datos-edit" data-id="${c.id}">${icon('pencil', 13)}Editar</button></div>
      <div class="card__body"><dl class="dl">
        <dt>Presupuesto</dt><dd class="tnum">${c.presupuesto ? App.eur(c.presupuesto) : '—'}</dd>
        <dt>Financiar</dt><dd>${c.financiar ? 'Sí' : 'No'}</dd>
        <dt>Coche a cuenta</dt><dd>${c.cocheACuenta ? `${c.cocheACuenta.marca} ${c.cocheACuenta.modelo} · ${c.cocheACuenta.anio}` : 'No'}</dd>
        ${c.cocheACuenta ? html`<dt>Km</dt><dd class="tnum">${App.km(c.cocheACuenta.km)}</dd>` : ''}
        <dt>Teléfono</dt><dd class="tnum">${c.tel}</dd>
      </dl></div>
    </div>
    <div class="card">
      <div class="card__head"><h3>${icon('tags', 16)}Etiquetas</h3><button class="btn btn--ghost btn--xs" data-act="ld-tag-add" data-id="${c.id}">${icon('plus', 14)}Añadir</button></div>
      <div class="card__body"><div class="ld-tags">${(c.etiquetas || []).length ? c.etiquetas.map(t => html`<span class="ld-tag">${t}<button data-act="ld-tag-del" data-id="${c.id}" data-tag="${t}" aria-label="Quitar ${t}">${icon('x', 12)}</button></span>`) : html`<span class="small muted">Sin etiquetas</span>`}</div></div>
    </div>
    <div class="card">
      <div class="card__head"><h3>${icon('notebook-pen', 16)}Notas</h3><span class="xs faint">Se guardan solas</span></div>
      <div class="card__body"><textarea class="textarea" id="ldNotas-${c.id}" data-act-change="ld-notas" data-id="${c.id}" rows="4" placeholder="Lo que tu equipo debe saber de este cliente…">${c.notas}</textarea></div>
    </div>
  </div>`;
}

function fichaHTML(c) {
  const tab = st.tab[c.id] || 'actividad';
  const n = {actividad: c.timeline.length, whatsapp: db.mensajes(c.id).length, citas: db.eventosDe(c.id).length, presupuestos: db.presupuestosDe(c.id).length, tasfin: db.tasacionesDe(c.id).length + db.financiacionesDe(c.id).length};
  const panel = {actividad: tlHTML, whatsapp: waTabHTML, citas: citasHTML, presupuestos: presuHTML, tasfin: tasfinHTML}[tab](c);
  return html`<div class="ld ld-ficha">
    ${heroHTML(c)}
    <div class="grid-main ld-ficha__grid">
      <div class="stack ld-maincol">
      <div class="card ld-main" data-tour="ficha-timeline">
        <div class="tabs ld-tabs">${FTABS.map(t => html`<button class="tab ${t.id === tab ? 'is-on' : ''}" data-act="ld-tab" data-id="${c.id}" data-tab="${t.id}">${icon(t.ic, 15)}${t.l}${n[t.id] ? html`<span class="chip__n">${n[t.id]}</span>` : ''}</button>`)}</div>
        <div class="card__body ld-panel">${panel}</div>
      </div>
      ${tab !== 'whatsapp' && n.whatsapp && App.wa ? html`<div class="card ld-lastwa hide-m">
        <div class="card__head"><h3>${icon('message-circle', 16)}Última conversación por WhatsApp</h3><button class="btn btn--wa btn--sm" data-act="whatsapp" data-id="${c.id}">${icon('message-circle', 15)}Abrir conversación</button></div>
        <div class="ld-wa-prev ld-wa-prev--flat">${App.wa.bubbles(db.mensajes(c.id).slice(-3), c)}</div>
      </div>` : ''}
      </div>
      ${lateralHTML(c)}
    </div>
  </div>`;
}

/* =====================================================================
   ARRASTRAR Y SOLTAR (pointer events: ratón directo, táctil con pulsación larga)
   ===================================================================== */
let drag = null, pendiente = false, noClick = 0;
const rerender = () => App.render({keepScroll: true});

function cambiarEtapa(cid, etapa) {
  const c = db.contact(cid); if (!c || c.etapa === etapa) return;
  if (etapa === 'perdido') return modalPerdido(cid);
  if (etapa === 'vendido') return modalVenta(cid);
  db.setEtapa(cid, etapa);
}

function mountBoard(root) {
  const board = root.querySelector('#ldBoard'); if (!board) return;
  board.scrollLeft = st.left;
  board.addEventListener('scroll', () => { st.left = board.scrollLeft; }, {passive: true});
  board.addEventListener('pointerdown', e => down(e, board));
  board.addEventListener('contextmenu', e => { if (e.target.closest('.ld-card')) e.preventDefault(); });
  board.addEventListener('click', e => {
    const card = e.target.closest('.ld-card');
    if (!card || e.target.closest('[data-act],a,button')) return;
    if (Date.now() - noClick < 350) return;
    App.open.contacto(card.dataset.cid);
  });
  board.addEventListener('keydown', e => { const card = e.target.closest('.ld-card'); if (card && e.key === 'Enter') App.open.contacto(card.dataset.cid); });
}

function down(e, board) {
  if (e.button !== 0 || drag) return;
  const card = e.target.closest('.ld-card');
  if (!card || e.target.closest('button,a')) return;
  drag = {cid: card.dataset.cid, card, board, sx: e.clientX, sy: e.clientY, x: e.clientX, y: e.clientY, pid: e.pointerId, touch: e.pointerType !== 'mouse', started: false};
  if (drag.touch) {
    card.classList.add('is-press');
    drag.timer = setTimeout(() => drag && !drag.started && start(), 360);
  }
  window.addEventListener('pointermove', move, {passive: false});
  window.addEventListener('pointerup', up);
  window.addEventListener('pointercancel', cancel);
  document.addEventListener('touchmove', blockScroll, {passive: false});
}
const blockScroll = e => { if (drag && drag.started) e.preventDefault(); };

function start() {
  const d = drag, r = d.card.getBoundingClientRect();
  d.started = true; d.ox = d.x - r.left; d.oy = d.y - r.top;
  d.from = d.card.closest('.ld-col').dataset.etapa;
  d.ghost = d.card.cloneNode(true); d.ghost.classList.add('ld-ghost'); d.ghost.classList.remove('is-press'); d.ghost.removeAttribute('data-tour');
  d.ghost.style.width = r.width + 'px';
  document.body.appendChild(d.ghost);
  d.ph = document.createElement('div'); d.ph.className = 'ld-ph'; d.ph.style.height = r.height + 'px';
  d.card.after(d.ph); d.card.classList.add('is-dragging'); d.card.classList.remove('is-press');
  document.body.classList.add('ld-is-dragging');
  if (navigator.vibrate) try { navigator.vibrate(12); } catch (e) {}
  place(); d.raf = requestAnimationFrame(tick);
}

function move(e) {
  const d = drag; if (!d || e.pointerId !== d.pid) return;
  d.x = e.clientX; d.y = e.clientY;
  const dist = Math.hypot(d.x - d.sx, d.y - d.sy);
  if (!d.started) {
    if (d.touch) { if (dist > 8) cancel(); }
    else if (dist > 5) start();
    return;
  }
  e.preventDefault(); place();
}

function place() {
  const d = drag; if (!d || !d.started) return;
  d.ghost.style.transform = `translate(${d.x - d.ox}px,${d.y - d.oy}px) rotate(2.5deg)`;
  const el = document.elementFromPoint(d.x, d.y);
  const col = el && el.closest('.ld-col');
  d.board.querySelectorAll('.ld-col.is-over').forEach(x => x !== col && x.classList.remove('is-over'));
  d.over = col ? col.dataset.etapa : null;
  if (!col) return;
  col.classList.add('is-over');
  const body = col.querySelector('.ld-col__body');
  if (col.classList.contains('is-folded')) { if (d.ph.parentNode !== d.card.parentNode) d.card.after(d.ph); return; }
  const cards = [...body.querySelectorAll('.ld-card:not(.is-dragging)')];
  const before = cards.find(k => { const r = k.getBoundingClientRect(); return d.y < r.top + r.height / 2; });
  if (before) { if (before.previousElementSibling !== d.ph) body.insertBefore(d.ph, before); }
  else if (body.lastElementChild !== d.ph) body.appendChild(d.ph);
}

function tick() {
  const d = drag; if (!d || !d.started) return;
  const r = d.board.getBoundingClientRect(), edge = 70;
  let moved = false;
  if (d.x < r.left + edge) { d.board.scrollLeft -= Math.ceil((r.left + edge - d.x) / 5); moved = true; }
  else if (d.x > r.right - edge) { d.board.scrollLeft += Math.ceil((d.x - (r.right - edge)) / 5); moved = true; }
  const body = document.elementFromPoint(d.x, d.y)?.closest('.ld-col__body');
  if (body) { const b = body.getBoundingClientRect(); if (d.y < b.top + 50) { body.scrollTop -= 8; moved = true; } else if (d.y > b.bottom - 50) { body.scrollTop += 8; moved = true; } }
  if (!body && d.y > innerHeight - 60) { window.scrollBy(0, 10); moved = true; }
  if (moved) place();
  d.raf = requestAnimationFrame(tick);
}

function cleanup() {
  const d = drag; if (!d) return;
  clearTimeout(d.timer); cancelAnimationFrame(d.raf);
  window.removeEventListener('pointermove', move);
  window.removeEventListener('pointerup', up);
  window.removeEventListener('pointercancel', cancel);
  document.removeEventListener('touchmove', blockScroll);
  d.card.classList.remove('is-press', 'is-dragging');
  if (d.ghost) d.ghost.remove();
  if (d.ph) d.ph.remove();
  document.body.classList.remove('ld-is-dragging');
  document.querySelectorAll('.ld-col.is-over').forEach(x => x.classList.remove('is-over'));
  drag = null;
  if (pendiente) { pendiente = false; rerender(); }
}
function cancel() { cleanup(); }
function up(e) {
  const d = drag; if (!d || e.pointerId !== d.pid) return;
  if (!d.started) return cleanup();
  const target = d.over, cid = d.cid, from = d.from;
  noClick = Date.now();
  cleanup();
  if (target && target !== from) cambiarEtapa(cid, target);
}

/* =====================================================================
   MODALES PEQUEÑOS DE LA FICHA
   ===================================================================== */
function modalProxima(cid) {
  const c = db.contact(cid); if (!c) return;
  const p = c.proxima, f = p ? new Date(p.fecha) : App.addMin(new Date(), 60);
  const dias = [[0, 'Hoy'], [1, 'Mañana'], [2, 'Pasado mañana'], [3, 'En 3 días'], [7, 'En una semana']];
  const dSel = App.clamp(App.daysBetween(new Date(), f), 0, 7);
  const sug = ['Llamar para agendar la prueba', 'Mandar presupuesto con la cuota', 'Confirmar la cita', 'Pedir documentación para financiar', 'Llamar: lo estaba hablando en casa'];
  App.modal({title: 'Próxima acción', sub: `Qué hay que hacer con ${nom1(c)} y cuándo. Te avisamos si se pasa la hora.`, size: 'sm',
    body: html`<div class="stack">
      <div class="field"><label>Qué hay que hacer</label><input class="input" id="ldPxT" value="${p ? p.texto : ''}" placeholder="Llamar para cerrar la prueba" autofocus></div>
      <div class="chips">${sug.map(s => html`<button class="chip ld-chip-sm" data-s="${s}">${s}</button>`)}</div>
      <div class="form-grid"><div class="field"><label>Día</label><select class="select" id="ldPxD">${dias.map(([n, l]) => html`<option value="${n}" ${n === dSel ? 'selected' : ''}>${l}</option>`)}</select></div>
      <div class="field"><label>Hora</label><input class="input" type="time" id="ldPxH" value="${App.hora(f)}"></div></div>
    </div>`,
    foot: html`<button class="btn" data-close>Cancelar</button><button class="btn btn--primary" id="ldPxOk">Guardar</button>`,
    onMount(n, close) {
      n.addEventListener('click', e => { const b = e.target.closest('[data-s]'); if (b) n.querySelector('#ldPxT').value = b.dataset.s; });
      n.querySelector('#ldPxOk').onclick = () => {
        const texto = n.querySelector('#ldPxT').value.trim(); if (!texto) return n.querySelector('#ldPxT').focus();
        const [h, m] = (n.querySelector('#ldPxH').value || '10:00').split(':').map(Number);
        close(); db.updateContact(cid, {proxima: {fecha: App.at(+n.querySelector('#ldPxD').value, h, m), texto}});
        App.toast('Próxima acción guardada', {sub: texto});
      };
    }});
}

function modalDatos(cid) {
  const c = db.contact(cid); if (!c) return;
  let fin = !!c.financiar, cuenta = !!c.cocheACuenta;
  const cc = c.cocheACuenta || {};
  App.modal({title: 'Datos del cliente', size: 'sm',
    body: html`<div class="stack">
      <div class="form-grid"><div class="field"><label>Teléfono</label><input class="input" id="ldDTel" value="${c.tel}"></div><div class="field"><label>Ciudad</label><input class="input" id="ldDCiu" value="${c.ciudad}"></div></div>
      <div class="field"><label>Email</label><input class="input" id="ldDMail" value="${c.email}"></div>
      <div class="field"><label>Presupuesto</label><div class="input-group ld-suffix"><input class="input tnum" id="ldDPres" inputmode="numeric" value="${c.presupuesto || ''}"><span class="input-group__suffix">€</span></div></div>
      <div class="between ld-toggle-row"><span class="semi">Quiere financiar</span><button class="switch ${fin ? 'is-on' : ''}" id="ldDFin" aria-label="Financiar"></button></div>
      <div class="between ld-toggle-row"><span class="semi">Deja coche a cuenta</span><button class="switch ${cuenta ? 'is-on' : ''}" id="ldDCc" aria-label="Coche a cuenta"></button></div>
      <div class="form-grid ${cuenta ? '' : 'hidden'}" id="ldDCcBox">
        <div class="field"><label>Marca</label><input class="input" id="ldDCcMa" value="${cc.marca || ''}"></div><div class="field"><label>Modelo</label><input class="input" id="ldDCcMo" value="${cc.modelo || ''}"></div>
        <div class="field"><label>Año</label><input class="input tnum" id="ldDCcA" inputmode="numeric" value="${cc.anio || ''}"></div><div class="field"><label>Km</label><input class="input tnum" id="ldDCcK" inputmode="numeric" value="${cc.km || ''}"></div>
      </div>
    </div>`,
    foot: html`<button class="btn" data-close>Cancelar</button><button class="btn btn--primary" id="ldDOk">Guardar</button>`,
    onMount(n, close) {
      const $ = s => n.querySelector(s);
      $('#ldDFin').onclick = e => { fin = !fin; e.currentTarget.classList.toggle('is-on', fin); };
      $('#ldDCc').onclick = e => { cuenta = !cuenta; e.currentTarget.classList.toggle('is-on', cuenta); $('#ldDCcBox').classList.toggle('hidden', !cuenta); };
      $('#ldDOk').onclick = () => {
        const coche = cuenta && $('#ldDCcMa').value.trim() ? {marca: $('#ldDCcMa').value.trim(), modelo: $('#ldDCcMo').value.trim(), anio: +$('#ldDCcA').value || 2015, km: +$('#ldDCcK').value.replace(/\D/g, '') || 0} : null;
        let et = (c.etiquetas || []).filter(t => t !== 'Coche a cuenta' && t !== 'Financiación');
        if (coche) et.push('Coche a cuenta'); if (fin) et.push('Financiación');
        close();
        db.updateContact(cid, {tel: $('#ldDTel').value.trim(), ciudad: $('#ldDCiu').value.trim(), email: $('#ldDMail').value.trim(), presupuesto: +$('#ldDPres').value.replace(/\D/g, '') || 0, financiar: fin, cocheACuenta: coche, etiquetas: [...new Set(et)]});
        App.toast('Datos guardados', {sub: nom2(c)});
      };
    }});
}

function menuEtapas(el, cid, onPick) {
  const c = db.contact(cid);
  App.menu(el, [{header: 'Mover a'}].concat(C.ETAPAS.filter(e => !c || e.id !== c.etapa).map(e => ({label: e.label, icon: e.icon, danger: e.id === 'perdido', onClick: () => onPick(e.id)}))));
}
function menuComerciales(el, onPick) {
  App.menu(el, [{header: 'Asignar a'}].concat(App.S.users.filter(u => ['Comercial', 'Gerente'].includes(u.rol)).map(u => ({label: `${u.nombre} · ${u.rol}`, icon: 'user', onClick: () => onPick(u)}))));
}

/* =====================================================================
   ACCIONES
   ===================================================================== */
const actions = {
  'ld-vista'(el) { App.S.prefs.vistaLeads = el.dataset.v === 'lista' ? 'lista' : 'kanban'; App.store.save(); rerender(); },
  'ld-com'(el) { const id = el.dataset.id; st.com = st.com.includes(id) ? st.com.filter(x => x !== id) : st.com.concat(id); rerender(); },
  'ld-origen'(el) { st.origen = el.value; rerender(); },
  'ld-temp'(el) { st.temp = el.value; rerender(); },
  'ld-q'(el) { st.q = el.value; rerender(); },
  'ld-limpiar'() { Object.assign(st, {com: [], origen: '', temp: '', q: ''}); rerender(); },
  'ld-plegar'(el) { st.plegadas[el.dataset.id] = !st.plegadas[el.dataset.id]; rerender(); },
  'ld-mover'(el) { menuEtapas(el, el.dataset.id, et => cambiarEtapa(el.dataset.id, et)); },
  'ld-sort'(el) { const k = el.dataset.k; st.sort = st.sort.k === k ? {k, dir: -st.sort.dir} : {k, dir: ['ultimo', 'prox'].includes(k) ? (k === 'ultimo' ? -1 : 1) : 1}; rerender(); },
  'ld-sel'(el) { const id = el.dataset.id; st.sel = st.sel.includes(id) ? st.sel.filter(x => x !== id) : st.sel.concat(id); rerender(); },
  'ld-sel-all'() { const ids = filtrados().map(c => c.id); st.sel = st.sel.length === ids.length ? [] : ids; rerender(); },
  'ld-bulk-clear'() { st.sel = []; rerender(); },
  'ld-bulk-com'(el) {
    menuComerciales(el, u => { const ids = st.sel.slice(); App.store.update(S => S.contacts.forEach(c => { if (ids.includes(c.id)) { c.asignado = u.id; c.timeline.unshift({id: App.uid('t'), tipo: 'nota', texto: `Asignado a ${u.nombre}`, fecha: new Date().toISOString(), autor: S.me}); } }), 'contacts'); st.sel = []; App.toast(`${ids.length} ${ids.length === 1 ? 'lead asignado' : 'leads asignados'} a ${nom1(u)}`, {icon: 'user-check'}); rerender(); });
  },
  'ld-bulk-etapa'(el) {
    App.menu(el, [{header: 'Cambiar etapa a'}].concat(C.ETAPAS.filter(e => e.id !== 'vendido').map(e => ({label: e.label, icon: e.icon, danger: e.id === 'perdido', onClick: () => {
      const ids = st.sel.slice();
      App.store.update(S => S.contacts.forEach(c => { if (ids.includes(c.id) && c.etapa !== e.id) { c.timeline.unshift({id: App.uid('t'), tipo: 'etapa', texto: `${C.etapa(c.etapa).label} → ${e.label}`, fecha: new Date().toISOString(), autor: S.me}); c.etapa = e.id; if (e.id === 'perdido') c.motivoPerdida = c.motivoPerdida || 'Cambio en bloque'; } }), 'contacts');
      st.sel = []; App.toast(`${ids.length} ${ids.length === 1 ? 'lead' : 'leads'} → ${e.label}`, {icon: e.icon}); rerender();
    }}))));
  },
  'ld-bulk-wa'() { modalWhatsAppVarios(st.sel, () => { st.sel = []; rerender(); }); },
  /* ficha */
  'ld-etapa-menu'(el) { menuEtapas(el, el.dataset.id, et => cambiarEtapa(el.dataset.id, et)); },
  'ld-step'(el) { cambiarEtapa(el.dataset.id, el.dataset.etapa); },
  'ld-temp-menu'(el) { const id = el.dataset.id; App.menu(el, Object.entries(C.TEMP).map(([k, t]) => ({label: t.label, icon: t.icon, onClick: () => { db.updateContact(id, {temperatura: k}); App.toast(`Temperatura: ${t.label}`, {icon: t.icon}); }}))); },
  'ld-com-menu'(el) { const id = el.dataset.id; menuComerciales(el, u => { const c = db.contact(id); if (c.asignado === u.id) return; db.updateContact(id, {asignado: u.id}); db.addTimeline(id, {tipo: 'nota', texto: `Reasignado a ${u.nombre}`}); App.toast(`${nom1(c)} ahora lo lleva ${nom1(u)}`, {icon: 'user-check', sub: 'Le hemos avisado en su móvil'}); }); },
  'ld-more'(el) {
    const id = el.dataset.id, c = db.contact(id);
    App.menu(el, [
      {label: 'Tasación', icon: 'scan-line', onClick: () => App.nuevo('tasacion', {contact: id})},
      {label: 'Financiación', icon: 'landmark', onClick: () => App.nuevo('financiacion', {contact: id, vehicle: (veh1(c) || {}).id})},
      {label: 'Tarea', icon: 'list-checks', onClick: () => App.nuevo('tarea', {contact: id})},
      {sep: true},
      {label: c.iaActiva ? 'Tomar la conversación (quitar IA)' : 'Que la lleve la IA', icon: c.iaActiva ? 'user-check' : 'sparkles', onClick: () => { db.updateContact(id, {iaActiva: !c.iaActiva}); App.toast(c.iaActiva ? 'La conversación la llevas tú' : 'La IA contestará por ti', {icon: 'sparkles'}); }},
      {label: 'Reasignar comercial', icon: 'users', onClick: () => actions['ld-com-menu'](el)},
      {label: 'Copiar teléfono', icon: 'copy', onClick: () => { try { navigator.clipboard.writeText(c.tel); } catch (e) {} App.toast('Teléfono copiado', {sub: c.tel}); }},
      {sep: true},
      c.etapa === 'perdido' ? {label: 'Reactivar lead', icon: 'rotate-ccw', onClick: () => { db.setEtapa(id, 'contactado'); db.updateContact(id, {iaActiva: true, temperatura: 'templado'}); }} : {label: 'Marcar como perdido', icon: 'circle-x', danger: true, onClick: () => modalPerdido(id)}
    ], {align: 'right'});
  },
  'ld-cita'(el) { const c = db.contact(el.dataset.id); App.nuevo('cita', {contact: c.id, vehicle: (veh1(c) || {}).id}); },
  'ld-presu'(el) { const c = db.contact(el.dataset.id); App.nuevo('presupuesto', {contact: c.id, vehicle: (veh1(c) || {}).id}); },
  'ld-tasacion'(el) { App.nuevo('tasacion', {contact: el.dataset.id}); },
  'ld-fin'(el) { const c = db.contact(el.dataset.id); App.nuevo('financiacion', {contact: c.id, vehicle: (veh1(c) || {}).id}); },
  'ld-tarea'(el) { App.nuevo('tarea', {contact: el.dataset.id}); },
  'ld-tab'(el) { st.tab[el.dataset.id] = el.dataset.tab; rerender(); },
  'ld-tl-tipo'(el) {
    st.tlTipo = el.dataset.k;
    el.parentNode.querySelectorAll('button').forEach(b => b.classList.toggle('is-on', b === el));
    const ta = App.$('#ldTlTxt'); if (ta) { ta.placeholder = st.tlTipo === 'llamada' ? 'Resumen de la llamada: qué ha dicho, qué queda pendiente…' : 'Escribe una nota para el equipo…'; ta.focus(); }
  },
  'ld-tl-save'(el) {
    const ta = App.$('#ldTlTxt'), texto = ta && ta.value.trim();
    if (!texto) { ta && ta.focus(); return; }
    ta.value = '';
    db.addTimeline(el.dataset.id, {tipo: st.tlTipo, texto: st.tlTipo === 'llamada' ? `Llamada: ${texto}` : texto});
    App.toast(st.tlTipo === 'llamada' ? 'Llamada registrada' : 'Nota guardada', {icon: st.tlTipo === 'llamada' ? 'phone' : 'sticky-note'});
  },
  'ld-int-add'(el) {
    const c = db.contact(el.dataset.id);
    elegirCoche({title: 'Añadir coche de interés', sub: nom2(c), excluir: c.interes}).then(vid => { if (!vid) return; db.updateContact(c.id, {interes: c.interes.concat(vid)}); App.toast('Coche añadido', {sub: ui.vehNombre(db.veh(vid))}); });
  },
  'ld-int-del'(el) {
    const c = db.contact(el.dataset.id), vid = el.dataset.vid, antes = c.interes.slice();
    db.updateContact(c.id, {interes: c.interes.filter(x => x !== vid)});
    App.toast('Coche quitado', {sub: ui.vehNombre(db.veh(vid)), tipo: 'info', accion: 'Deshacer', onAccion: () => db.updateContact(c.id, {interes: antes})});
  },
  'ld-enviar-coche'(el) {
    const c = db.contact(el.dataset.id), v = db.veh(el.dataset.vid);
    db.addMessage(c.id, {from: 'agente', texto: textoFicha(c, v), ficha: v.id});
    db.addTimeline(c.id, {tipo: 'whatsapp', texto: `Ficha del ${ui.vehNombre(v)} enviada por WhatsApp`});
    App.toast('Enviado por WhatsApp', {sub: `${ui.vehNombre(v)} → ${nom1(c)}`, tipo: 'wa', accion: 'Ver chat', onAccion: () => App.open.whatsapp(c.id)});
  },
  'ld-datos-edit'(el) { modalDatos(el.dataset.id); },
  'ld-prox-edit'(el) { modalProxima(el.dataset.id); },
  'ld-prox-hecha'(el) {
    const c = db.contact(el.dataset.id), p = c.proxima; if (!p) return;
    db.updateContact(c.id, {proxima: null}); db.addTimeline(c.id, {tipo: 'nota', texto: `Hecho: ${p.texto}`});
    App.toast('¡Hecho!', {sub: p.texto, accion: 'Programar la siguiente', onAccion: () => modalProxima(c.id)});
  },
  'ld-tag-add'(el) {
    const c = db.contact(el.dataset.id);
    const add = t => { if (!t || c.etiquetas.includes(t)) return; db.updateContact(c.id, {etiquetas: c.etiquetas.concat(t)}); };
    App.menu(el, [{header: 'Añadir etiqueta'}].concat(ETIQUETAS_SUG.filter(t => !c.etiquetas.includes(t)).map(t => ({label: t, icon: 'tag', onClick: () => add(t)})), [{sep: true}, {label: 'Otra etiqueta…', icon: 'plus', onClick: () => App.modal({title: 'Nueva etiqueta', size: 'sm', body: html`<input class="input" id="ldTagIn" placeholder="Ej.: Quiere automático" autofocus>`, foot: html`<button class="btn" data-close>Cancelar</button><button class="btn btn--primary" id="ldTagOk">Añadir</button>`, onMount(n, close) { const ok = () => { const v = n.querySelector('#ldTagIn').value.trim(); if (!v) return; close(); add(v); }; n.querySelector('#ldTagOk').onclick = ok; n.querySelector('#ldTagIn').onkeydown = e => e.key === 'Enter' && ok(); }})}]), {align: 'right'});
  },
  'ld-tag-del'(el) { const c = db.contact(el.dataset.id); db.updateContact(c.id, {etiquetas: c.etiquetas.filter(t => t !== el.dataset.tag)}); },
  'ld-notas'(el) { const c = db.contact(el.dataset.id); if (!c || c.notas === el.value) return; db.updateContact(c.id, {notas: el.value}); App.toast('Notas guardadas', {icon: 'notebook-pen'}); }
};

/* =====================================================================
   VISTA
   ===================================================================== */
App.views.leads = {
  title: r => r.id ? ((db.contact(r.id) || {}).nombre || 'Cliente') : 'Leads y clientes',
  crumbs: r => r.id ? [{label: 'Leads y clientes', href: '#/leads'}] : null,
  deps: ['contacts', 'messages', 'events', 'quotes', 'appraisals', 'financings', 'vehicles', 'tasks'],
  get full() { return !(App.route && App.route.id); },
  onChange(what) {
    if (what === 'typing') return true;
    if (drag && drag.started) { pendiente = true; return true; }
    return false;
  },
  render(r) {
    if (r.id) {
      const c = db.contact(r.id);
      return c ? fichaHTML(c) : ui.empty('user', 'Este cliente no existe', 'Puede que se haya borrado al restablecer la demo.', html`<a class="btn" href="#/leads">Volver a leads</a>`);
    }
    return listadoHTML();
  },
  mount(root, r) {
    if (!r.id && vista() === 'embudo') mountBoard(root);
    const on = r.id && root.querySelector('.ld-step.is-on');
    if (on && on.parentNode.scrollWidth > on.parentNode.clientWidth) on.parentNode.scrollLeft = on.offsetLeft - 40;
  },
  unmount() { if (drag) cleanup(); },
  actions
};
})();
