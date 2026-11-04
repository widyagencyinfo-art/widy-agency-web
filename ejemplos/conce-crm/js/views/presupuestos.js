/* =====================================================================
   Presupuestos: lista con KPIs y editor con vista previa A4 en vivo
   (presupuesto, proforma y hoja de reserva), PDF, WhatsApp y email.
   ===================================================================== */
(function(){
const App = window.App;
const {html, raw, icon, db, C, ui} = App;

const TIPOS = {
  presupuesto: {label: 'Presupuesto', doc: 'Presupuesto', icon: 'file-text', art: 'el presupuesto'},
  proforma:    {label: 'Proforma', doc: 'Factura proforma', icon: 'receipt', art: 'la factura proforma'},
  reserva:     {label: 'Hoja de reserva', doc: 'Hoja de reserva', icon: 'bookmark', art: 'la hoja de reserva'}
};
const SUG = [
  {concepto: 'Transferencia y gestoría', importe: 250},
  {concepto: 'Garantía ampliada 24 meses', importe: 390},
  {concepto: 'Alfombrillas', importe: 90},
  {concepto: 'Tratamiento cerámico', importe: 290}
];
const PLAZOS = [48, 60, 72, 84, 96];
const first = n => (n || '').split(' ')[0];
const r100 = n => Math.round(n / 100) * 100;
const isM = () => window.matchMedia('(max-width:900px)').matches;

let D = null, Dkey = null, dirty = false, mtab = 'form', tab = 'todos', q = '', ro = null;

/* ---------- borrador ---------- */
function nuevoBorrador(query) {
  const c = db.contact(query.c), S = App.S;
  const v = db.veh(query.v) || (c && c.interes.map(db.veh).find(x => x && x.estado !== 'vendido')) || null;
  const tas = c ? db.tasacionesDe(c.id).find(t => ['aceptada', 'valorada'].includes(t.estado) && t.oferta) : null;
  const tipo = TIPOS[query.tipo] ? query.tipo : 'presupuesto';
  return {
    id: null, numero: db.nextQuoteNumber(), tipo, contactId: c ? c.id : null, vehicleId: v ? v.id : null,
    userId: c && ['u2', 'u3'].includes(c.asignado) ? c.asignado : S.me, fecha: new Date().toISOString(),
    precio: v ? v.precio : 0, descuento: 0, extras: [Object.assign({}, SUG[0])],
    tasacion: tas ? {importe: tas.oferta, vehiculo: `${tas.marca} ${tas.modelo} ${tas.anio}`, tasacionId: tas.id} : null,
    financiacion: c && c.financiar ? {entrada: 3000, plazo: 72, tin: S.dealer.tin, cuota: 0} : null,
    senal: tipo === 'reserva' ? 300 : 0, estado: 'borrador', validez: 15, vistas: 0, notas: ''
  };
}
function draft(route) {
  const key = route.id === 'nuevo' ? route.hash : '#/presupuestos/' + route.id;
  if (Dkey === key && D) return D;
  if (route.id === 'nuevo') D = nuevoBorrador(route.query);
  else { const qq = db.quote(route.id); if (!qq) return null; D = JSON.parse(JSON.stringify(qq)); }
  Dkey = key; dirty = false; mtab = 'form';
  recalc();
  return D;
}
function recalc() {
  if (!D) return;
  const tot = db.totalQuote(D);
  if (D.financiacion) {
    D.financiacion.entrada = App.clamp(D.financiacion.entrada || 0, 0, Math.max(tot.total, 0));
    D.financiacion.cuota = Math.round(App.cuota(db.totalQuote(D).aFinanciar, D.financiacion.tin, D.financiacion.plazo));
  }
  return tot;
}

/* ---------- documento A4 ---------- */
function docHTML(d) {
  const dl = App.S.dealer, c = db.contact(d.contactId), v = db.veh(d.vehicleId), u = db.user(d.userId), t = TIPOS[d.tipo] || TIPOS.presupuesto;
  const tot = db.totalQuote(d), fin = d.financiacion;
  const cuota = fin ? Math.round(App.cuota(tot.aFinanciar, fin.tin, fin.plazo)) : 0;
  const hasta = App.addDays(d.fecha, d.validez || 15);
  const gar = v ? Math.max(v.garantia || 0, dl.garantia) : dl.garantia;
  const transf = (d.extras || []).some(e => /transferencia/i.test(e.concepto));
  const itv = v && v.itv ? v.itv.split('-').reverse().join('/') : '';
  const subtotal = d.precio - (d.descuento || 0) + tot.extras;
  const cond = [
    `Garantía de ${gar} meses incluida${v && v.garantia > dl.garantia ? ' (garantía oficial de fábrica)' : ''}.`,
    transf ? 'Transferencia y gestoría ante la DGT incluidas.' : 'Gastos de transferencia a cargo del comprador.',
    v ? `Vehículo revisado en nuestro taller${itv ? `, con ITV en vigor hasta ${itv}` : ''} y libro de mantenimiento.` : 'Vehículo revisado en nuestro taller.',
    d.tipo === 'reserva' ? `La señal de ${App.eur(d.senal || 0)} reserva el vehículo hasta el ${App.fechaNum(hasta)} y se descuenta del precio final. Si la financiación no se aprueba, se devuelve íntegra.`
      : d.tipo === 'proforma' ? 'Documento sin validez fiscal. La factura definitiva se emite en la entrega del vehículo.'
      : `Oferta válida ${d.validez || 15} días (hasta el ${App.fechaNum(hasta)}), salvo venta previa del vehículo.`,
    d.tasacion ? 'La valoración del vehículo a cuenta queda sujeta a que se entregue en el estado en que se tasó.' : '',
    'Precios con IVA incluido. Vehículo sujeto al régimen especial de bienes usados (REBU).'
  ].filter(Boolean);
  const spec = v ? [['Matrícula', v.matricula], ['1.ª matriculación', App.fechaNum(v.fechaMatriculacion)], ['Kilómetros', App.km(v.km)], ['Combustible', v.combustible], ['Cambio', v.cambio], ['Potencia', v.cv + ' CV'], ['Color', v.color], ['Bastidor', v.bastidor]] : [];
  return html`<article class="pr-doc" style="--b:${dl.color}">
    <header class="pr-doc__head">
      <div class="pr-doc__brand">
        <div class="pr-doc__logo">${dl.siglas}</div>
        <div class="pr-doc__dealer"><b>${dl.nombre}</b><span>${dl.razon} · CIF ${dl.cif}</span><span>${dl.direccion}</span><span>${dl.tel} · ${dl.email}</span></div>
      </div>
      <div class="pr-doc__meta">
        <div class="pr-doc__type">${t.doc}</div>
        <dl><dt>Número</dt><dd>${d.numero}</dd><dt>Fecha</dt><dd>${App.fechaNum(d.fecha)}</dd><dt>${d.tipo === 'reserva' ? 'Reserva hasta' : d.tipo === 'proforma' ? 'Entrega prevista' : 'Válido hasta'}</dt><dd>${App.fechaNum(d.tipo === 'proforma' ? App.addDays(d.fecha, 7) : hasta)}</dd></dl>
      </div>
    </header>

    <section class="pr-doc__parties">
      <div><h6>Cliente</h6>${c ? html`<b>${c.nombre}</b><span>Tel. ${c.tel}</span><span>${c.email}</span><span>${c.ciudad}</span>` : html`<span class="pr-doc__ph">Selecciona un cliente</span>`}</div>
      <div><h6>Te atiende</h6>${u ? html`<b>${u.nombre}</b><span>${u.rol}</span><span>Tel. ${u.tel}</span><span>${u.email}</span>` : ''}</div>
    </section>

    ${v ? html`<section class="pr-doc__veh">
      <img src="${ui.img(v, 'l')}" alt="${ui.vehNombre(v)}">
      <div class="pr-doc__vinfo">
        <div class="pr-doc__vname"><b>${ui.vehNombre(v)}</b><span>${v.version} · ${v.anio}</span></div>
        <div class="pr-doc__spec">${spec.map(([k, x]) => html`<div><span>${k}</span><b>${x}</b></div>`)}</div>
      </div>
    </section>` : html`<section class="pr-doc__veh pr-doc__veh--ph"><span class="pr-doc__ph">Selecciona un vehículo del stock</span></section>`}

    <table class="pr-doc__lines">
      <thead><tr><th>Concepto</th><th>Importe</th></tr></thead>
      <tbody>
        <tr><td><b>${v ? `${ui.vehNombre(v)} ${v.version}` : 'Vehículo'}</b>${v ? html`<small>${v.matricula} · ${v.anio} · ${App.km(v.km)}</small>` : ''}</td><td>${App.eur(d.precio || 0)}</td></tr>
        ${d.descuento ? html`<tr><td>Descuento comercial</td><td class="pr-doc__neg">−${App.eur(d.descuento)}</td></tr>` : ''}
        ${(d.extras || []).filter(e => e.concepto || e.importe).map(e => html`<tr><td>${e.concepto || 'Concepto'}</td><td>${e.importe ? App.eur(e.importe) : html`<span class="pr-doc__inc">Incluido</span>`}</td></tr>`)}
      </tbody>
    </table>
    <div class="pr-doc__totals">
      ${d.tasacion || d.descuento || tot.extras ? html`<div><span>Subtotal</span><b>${App.eur(subtotal)}</b></div>` : ''}
      ${d.tasacion ? html`<div><span>Tu coche a cuenta · ${d.tasacion.vehiculo || 'vehículo tasado'}</span><b class="pr-doc__neg">−${App.eur(d.tasacion.importe || 0)}</b></div>` : ''}
      <div class="pr-doc__total"><span>Total <small>IVA incluido</small></span><b>${App.eur(tot.total)}</b></div>
      ${d.tipo === 'reserva' ? html`<div><span>Señal entregada</span><b class="pr-doc__neg">−${App.eur(d.senal || 0)}</b></div><div class="pr-doc__pend"><span>Pendiente a la entrega</span><b>${App.eur(tot.pendiente)}</b></div>` : ''}
    </div>

    ${fin ? html`<section class="pr-doc__fin">
      <div class="pr-doc__fincuota"><span>Cuota orientativa</span><b>${App.eur(cuota)}<small>/mes</small></b></div>
      <div class="pr-doc__fingrid">
        <div><span>Entrada</span><b>${App.eur(fin.entrada || 0)}</b></div>
        <div><span>A financiar</span><b>${App.eur(tot.aFinanciar)}</b></div>
        <div><span>Plazo</span><b>${fin.plazo} meses</b></div>
        <div><span>TIN</span><b>${App.dec(fin.tin)} %</b></div>
      </div>
      <p>Cálculo orientativo sujeto a aprobación de la entidad financiera. TAE y coste total según la entidad.</p>
    </section>` : ''}

    <section class="pr-doc__cond">
      <h6>Condiciones</h6>
      <ul>${cond.map(x => html`<li>${x}</li>`)}</ul>
      ${d.notas ? html`<h6>Observaciones</h6><p>${d.notas}</p>` : ''}
    </section>

    <section class="pr-doc__sign">
      <div><span>Por ${dl.nombre}</span><i></i><small>${u ? u.nombre : ''}</small></div>
      <div><span>${d.tipo === 'reserva' ? 'Firma del comprador' : 'Conforme, el cliente'}</span><i></i><small>${c ? c.nombre : ''}</small></div>
    </section>

    <footer class="pr-doc__foot"><span>${dl.razon} · CIF ${dl.cif} · ${dl.direccion} · ${dl.web}</span><span>${d.numero} · Página 1 de 1</span></footer>
  </article>`;
}

/* ---------- lista ---------- */
function renderLista() {
  const S = App.S, qs = S.quotes, mes = App.startOfMonth(new Date());
  const enviadosMes = qs.filter(x => x.estado !== 'borrador' && new Date(x.fecha) >= mes);
  const cerrados = qs.filter(x => x.estado !== 'borrador');
  const pctAcept = cerrados.length ? Math.round(qs.filter(x => x.estado === 'aceptado').length / cerrados.length * 100) : 0;
  const pendientes = qs.filter(x => ['enviado', 'visto'].includes(x.estado));
  const importePend = App.sum(pendientes, x => db.totalQuote(x).total);
  const vistos = qs.filter(x => x.estado === 'visto');
  const TABS = [['todos', 'Todos'], ['borrador', 'Borradores'], ['enviado', 'Enviados'], ['visto', 'Vistos'], ['aceptado', 'Aceptados'], ['rechazado', 'Rechazados']];
  const nq = App.norm(q).trim();
  const list = qs.filter(x => tab === 'todos' || x.estado === tab).filter(x => {
    if (!nq) return true; const c = db.contact(x.contactId), v = db.veh(x.vehicleId);
    return App.norm(`${x.numero} ${c ? c.nombre : ''} ${v ? v.marca + ' ' + v.modelo + ' ' + v.matricula : ''}`).includes(nq);
  });
  const vistasTxt = x => x.estado === 'borrador' ? html`<span class="faint">Sin enviar</span>` : x.vistas && x.estado !== 'enviado' ? html`<span class="pr-seen">${icon('eye', 14)}Visto ${x.vistas} ${x.vistas === 1 ? 'vez' : 'veces'}</span>` : html`<span class="faint">${icon('eye-off', 14)} Sin abrir</span>`;
  return html`
    <div class="page-head">
      <div><h1>Presupuestos</h1><p>Presupuestos, proformas y hojas de reserva con tu logo, listos para mandar por WhatsApp.</p></div>
      <div class="page-head__actions"><button class="btn btn--primary" data-act="pr-nuevo">${icon('plus', 16)}Nuevo presupuesto</button></div>
    </div>
    <div class="kpis">
      ${ui.kpi({label: 'Enviados este mes', value: enviadosMes.length, sub: `${App.eur(App.sum(enviadosMes, x => db.totalQuote(x).total))} en total`, icon: 'send', color: 'var(--accent)'})}
      ${ui.kpi({label: 'Aceptados', value: raw(`${pctAcept}<small>%</small>`), sub: `${qs.filter(x => x.estado === 'aceptado').length} de ${cerrados.length} enviados`, icon: 'circle-check', color: 'var(--green)'})}
      ${ui.kpi({label: 'Importe pendiente', value: App.eur(importePend), sub: `${pendientes.length} esperando respuesta`, icon: 'hourglass', color: 'var(--amber)'})}
      ${ui.kpi({label: 'Vistos sin respuesta', value: vistos.length, sub: vistos.length ? 'buen momento para llamar' : 'todo al día', icon: 'eye', color: 'var(--violet)'})}
    </div>
    <div class="card mt-16 pr-listcard">
      <div class="pr-listbar">
        <div class="tabs pr-tabs">${TABS.map(([id, l]) => { const n = id === 'todos' ? qs.length : qs.filter(x => x.estado === id).length; return html`<button class="tab ${tab === id ? 'is-on' : ''}" data-act="pr-tab" data-id="${id}">${l}<span class="chip__n">${n}</span></button>`; })}</div>
        <div class="input-group pr-search">${icon('search', 16)}<input class="input input--sm" id="prSearch" placeholder="Número, cliente o coche…" value="${q}" data-act-input="pr-buscar"></div>
      </div>
      ${list.length ? html`
      <div class="table-wrap hide-m"><table class="table pr-table">
        <thead><tr><th>Número</th><th>Cliente</th><th>Vehículo</th><th class="r">Total</th><th>Estado</th><th>Actividad</th><th>Fecha</th><th class="c">Comercial</th></tr></thead>
        <tbody>${list.map(x => { const c = db.contact(x.contactId), v = db.veh(x.vehicleId), t = TIPOS[x.tipo] || TIPOS.presupuesto; return html`<tr class="is-link" data-act="pr-abrir" data-id="${x.id}">
          <td><div class="pr-num"><span class="pr-num__ico">${icon(t.icon, 15)}</span><div><b class="tnum">${x.numero}</b><span>${t.label}</span></div></div></td>
          <td>${c ? html`<div class="pr-who">${App.avatar(c.nombre, {size: 'sm'})}<b class="ellipsis">${c.nombre}</b></div>` : html`<span class="muted">—</span>`}</td>
          <td><div class="cell-main">${v ? ui.thumb(v, 'thumb--sm') : ''}<span style="min-width:0"><b>${ui.vehNombre(v)}</b><span>${v ? v.matricula : ''}</span></span></div></td>
          <td class="r tnum"><b>${App.eur(db.totalQuote(x).total)}</b>${x.financiacion ? html`<div class="xs muted">${App.eur(x.financiacion.cuota)}/mes</div>` : ''}</td>
          <td>${ui.estado('ESTADOS_Q', x.estado)}</td>
          <td class="small">${vistasTxt(x)}</td>
          <td class="muted small nowrap">${App.rel(x.fecha)}</td>
          <td class="c">${ui.user(x.userId)}</td></tr>`; })}</tbody>
      </table></div>
      <div class="pr-cards show-m">${list.map(x => { const c = db.contact(x.contactId), v = db.veh(x.vehicleId), t = TIPOS[x.tipo] || TIPOS.presupuesto; return html`<button class="pr-mcard" data-act="pr-abrir" data-id="${x.id}">
          ${v ? html`<img src="${ui.img(v)}" alt="" loading="lazy">` : ''}
          <span class="grow"><span class="between"><b class="tnum">${x.numero}</b>${ui.estado('ESTADOS_Q', x.estado)}</span>
            <span class="pr-mcard__who">${c ? c.nombre : '—'} · ${ui.vehNombre(v)}</span>
            <span class="between"><b class="tnum">${App.eur(db.totalQuote(x).total)}</b><span class="xs muted">${t.label} · ${App.rel(x.fecha)}</span></span></span>
        </button>`; })}</div>`
      : ui.empty('file-text', 'No hay presupuestos aquí', nq ? 'Prueba con otro nombre, número o matrícula.' : 'Crea uno en un minuto desde la ficha del cliente o desde aquí.', html`<button class="btn btn--sm" data-act="pr-nuevo">${icon('plus', 15)}Nuevo presupuesto</button>`)}
    </div>`;
}

/* ---------- editor ---------- */
function money(id, k, val, {suffix = '€', step = 50, min = 0, attrs = ''} = {}) {
  return html`<div class="input-group pr-money"><input class="input tnum" type="number" inputmode="decimal" id="${id}" data-act-input="pr-set" data-k="${k}" value="${val}" step="${step}" min="${min}" ${raw(attrs)}><span class="input-group__suffix">${suffix}</span></div>`;
}
function sec(ic, title, body, {right = '', cls = ''} = {}) {
  return html`<section class="card pr-sec ${cls}"><div class="pr-sec__head"><h3><span class="pr-sec__ico">${icon(ic, 15)}</span>${title}</h3>${right}</div><div class="pr-sec__body">${body}</div></section>`;
}
function resumen(d) {
  const tot = db.totalQuote(d), fin = d.financiacion;
  return html`<div class="pr-sum__rows">
    <div><span>Precio del coche</span><b>${App.eur(d.precio || 0)}</b></div>
    ${d.descuento ? html`<div><span>Descuento</span><b class="red">−${App.eur(d.descuento)}</b></div>` : ''}
    ${tot.extras ? html`<div><span>Extras</span><b>+${App.eur(tot.extras)}</b></div>` : ''}
    ${d.tasacion ? html`<div><span>Coche a cuenta</span><b class="red">−${App.eur(d.tasacion.importe || 0)}</b></div>` : ''}
  </div>
  <div class="pr-sum__total"><span>Total</span><b>${App.eur(tot.total)}</b></div>
  ${fin ? html`<div class="pr-sum__fin">${icon('landmark', 14)}<span>${App.eur(fin.entrada)} de entrada + <b>${App.eur(fin.cuota)}/mes</b> en ${fin.plazo} meses</span></div>` : ''}
  ${d.tipo === 'reserva' ? html`<div class="pr-sum__fin">${icon('bookmark', 14)}<span>Señal ${App.eur(d.senal || 0)} · pendiente <b>${App.eur(tot.pendiente)}</b></span></div>` : ''}`;
}
function renderEditor(route) {
  const d = draft(route);
  if (!d) return ui.empty('file-text', 'Este presupuesto no existe', 'Puede que se haya eliminado.', html`<a class="btn" href="#/presupuestos">Volver a presupuestos</a>`);
  const S = App.S, c = db.contact(d.contactId), v = db.veh(d.vehicleId), t = TIPOS[d.tipo], tot = db.totalQuote(d), fin = d.financiacion;
  const tasas = c ? db.tasacionesDe(c.id).filter(x => x.oferta) : [];
  const neto = (d.precio || 0) - (d.descuento || 0);
  const maxEntrada = Math.max(1000, r100(Math.max(tot.total, 0) * 0.6));
  const usados = (d.extras || []).map(e => App.norm(e.concepto));
  const sugs = SUG.filter(s => !usados.includes(App.norm(s.concepto)));
  const est = C.ESTADOS_Q[d.estado];

  const acciones = html`<div class="pr-acts" data-tour="pres-enviar">
    <button class="btn ${dirty || !d.id ? '' : 'is-saved'}" data-act="pr-guardar">${icon(dirty || !d.id ? 'download' : 'check', 15)}<span>${dirty || !d.id ? 'Guardar' : 'Guardado'}</span></button>
    <button class="btn" data-act="pr-pdf">${icon('printer', 15)}<span>Descargar PDF</span></button>
    <button class="btn hide-m" data-act="pr-email">${icon('mail', 15)}Email</button>
    ${d.estado !== 'aceptado' ? html`<button class="btn btn--success hide-m" data-act="pr-aceptar">${icon('circle-check', 15)}${d.tipo === 'reserva' ? 'Reservar coche' : 'Marcar aceptado'}</button>` : ''}
    <button class="btn btn--icon" data-act="pr-mas" aria-label="Más acciones">${icon('more-horizontal', 17)}</button>
    <button class="btn btn--wa pr-acts__wa" data-act="pr-wa">${icon('message-circle', 16)}Enviar por WhatsApp</button>
  </div>`;

  const form = html`<div class="pr-form" data-tour="pres-editor">
    ${sec('file-text', 'Documento', html`
      <div class="pr-tipos">${Object.entries(TIPOS).map(([k, x]) => html`<button class="pr-tipo ${d.tipo === k ? 'is-on' : ''}" data-act="pr-tipo" data-v="${k}">${icon(x.icon, 17)}<span>${x.label}</span></button>`)}</div>
      <div class="form-grid form-grid--3 mt-12">
        <div class="field"><label for="prUser">Comercial</label><select class="select" id="prUser" data-act-change="pr-user">${S.users.filter(u => ['u1', 'u2', 'u3'].includes(u.id)).map(u => html`<option value="${u.id}" ${u.id === d.userId ? 'selected' : ''}>${u.nombre}</option>`)}</select></div>
        <div class="field"><label for="prValidez">${d.tipo === 'reserva' ? 'Reserva (días)' : 'Validez (días)'}</label>${money('prValidez', 'validez', d.validez, {suffix: 'días', step: 1, min: 1})}</div>
        <div class="field"><label>Número</label><div class="pr-ro tnum">${d.numero}</div></div>
      </div>`)}

    ${sec('user', 'Cliente', App.ventasPick.html({kind: 'contact', id: d.contactId}))}

    ${sec('car', 'Vehículo y precio', html`
      ${App.ventasPick.html({kind: 'vehicle', id: d.vehicleId})}
      <div class="form-grid mt-12">
        <div class="field"><label for="prPrecio">Precio de venta</label>${money('prPrecio', 'precio', d.precio, {step: 100})}</div>
        <div class="field"><label for="prDesc">Descuento</label>${money('prDesc', 'descuento', d.descuento, {step: 50})}</div>
      </div>
      ${v ? html`<div class="pr-hint" data-live="minimo">${minimoHint(v, neto)}</div>` : ''}`)}

    ${sec('list-checks', 'Extras', html`
      <div class="pr-extras">${(d.extras || []).map((e, i) => html`<div class="pr-extra">
        <input class="input" id="prExC${i}" data-act-input="pr-set" data-k="extra" data-i="${i}" data-f="concepto" value="${e.concepto}" placeholder="Concepto">
        ${money('prExI' + i, 'extra', e.importe, {step: 10, attrs: `data-i="${i}" data-f="importe"`})}
        <button class="icon-btn" data-act="pr-extra-del" data-i="${i}" aria-label="Quitar línea">${icon('trash-2', 16)}</button></div>`)}
      </div>
      <div class="pr-sugs">${sugs.map(s => html`<button class="chip pr-sug" data-act="pr-extra-add" data-c="${s.concepto}" data-imp="${s.importe}">${icon('plus', 13)}${s.concepto} <span class="chip__n">${App.eur(s.importe)}</span></button>`)}
        <button class="chip pr-sug pr-sug--blank" data-act="pr-extra-add">${icon('plus', 13)}Otra línea</button></div>`,
      {right: tot.extras ? html`<span class="small muted tnum">+${App.eur(tot.extras)}</span>` : ''})}

    ${sec('repeat', 'Coche a cuenta', d.tasacion ? html`
      ${tasas.length ? html`<div class="pr-tasas">${tasas.map(x => html`<button class="pr-tasa ${d.tasacion.tasacionId === x.id ? 'is-on' : ''}" data-act="pr-tas-use" data-id="${x.id}">
        <span class="pr-tasa__ico">${icon('scan-line', 16)}</span><span class="grow"><b>${x.marca} ${x.modelo} ${x.anio}</b><span>${App.km(x.km)} · tasado ${App.rel(x.fecha)} · ${C.ESTADOS_TAS[x.estado].label.toLowerCase()}</span></span><b class="tnum">${App.eur(x.oferta)}</b></button>`)}</div>` : html`<p class="small muted">Este cliente no tiene tasaciones. Pon el importe a mano.</p>`}
      <div class="form-grid mt-12">
        <div class="field"><label for="prTasV">Vehículo</label><input class="input" id="prTasV" data-act-input="pr-set" data-k="tas.vehiculo" value="${d.tasacion.vehiculo}" placeholder="Marca, modelo y año"></div>
        <div class="field"><label for="prTasI">Se descuenta</label>${money('prTasI', 'tas.importe', d.tasacion.importe, {step: 100})}</div>
      </div>` : html`<p class="small muted">${tasas.length ? `${c ? first(c.nombre) : 'El cliente'} tiene ${tasas.length === 1 ? 'una tasación' : tasas.length + ' tasaciones'}: actívalo para restarla del total.` : 'Si deja su coche como parte del pago, se resta del total.'}</p>`,
      {right: html`<button class="switch ${d.tasacion ? 'is-on' : ''}" data-act="pr-tas-toggle" aria-label="Coche a cuenta"></button>`})}

    ${sec('landmark', 'Financiación', fin ? html`
      <div class="pr-fin">
        <div class="field"><div class="between"><label for="prEntrada">Entrada</label><b class="tnum" data-live="entrada">${App.eur(fin.entrada)}</b></div>
          <input type="range" class="range" id="prEntrada" min="0" max="${maxEntrada}" step="100" value="${fin.entrada}" data-act-input="pr-set" data-k="fin.entrada">
          <div class="between xs faint"><span>0 €</span><span>${App.eur(maxEntrada)}</span></div></div>
        <div class="field"><label>Plazo</label><div class="seg pr-plazos">${PLAZOS.map(p => html`<button class="${fin.plazo === p ? 'is-on' : ''}" data-act="pr-plazo" data-v="${p}">${p} m</button>`)}</div></div>
        <div class="form-grid">
          <div class="field"><label for="prTin">TIN</label>${money('prTin', 'fin.tin', fin.tin, {suffix: '%', step: 0.1})}</div>
          <div class="pr-cuota"><span>Cuota orientativa</span><b class="tnum" data-live="cuota">${App.eur(fin.cuota)}<small>/mes</small></b><span class="xs" data-live="afin">Financias ${App.eur(tot.aFinanciar)}</span></div>
        </div>
      </div>` : html`<p class="small muted">${c && c.financiar ? `${first(c.nombre)} quiere financiar. ` : ''}Añade la cuota al documento con entrada, plazo y TIN.</p>`,
      {right: html`<button class="switch ${fin ? 'is-on' : ''}" data-act="pr-fin-toggle" aria-label="Financiación"></button>`})}

    ${d.tipo === 'reserva' ? sec('bookmark', 'Señal', html`
      <div class="form-grid"><div class="field"><label for="prSenal">Importe de la señal</label>${money('prSenal', 'senal', d.senal, {step: 50})}</div>
      <div class="field"><label>Rápido</label><div class="chips">${[300, 500, 1000].map(n => html`<button class="chip ${+d.senal === n ? 'is-on' : ''}" data-act="pr-senal" data-v="${n}">${App.eur(n)}</button>`)}</div></div></div>`) : ''}

    ${sec('notebook-pen', 'Condiciones y notas', html`<textarea class="textarea" id="prNotas" rows="3" data-act-input="pr-set" data-k="notas" placeholder="Entrega en 7 días tras aprobar la financiación, cambio de aceite hecho…">${d.notas}</textarea><p class="xs faint mt-8">Garantía, transferencia, validez e IVA (REBU) se añaden solos al documento.</p>`)}

    <section class="card pr-sum" data-live="resumen">${resumen(d)}</section>
  </div>`;

  const preview = html`<div class="pr-side">
    <div class="pr-prev" data-tour="pres-preview">
      <div class="pr-prev__bar"><span class="row-sm">${icon('eye', 15)}<b>Vista previa</b><span class="muted">· A4, así lo recibe ${c ? first(c.nombre) : 'el cliente'}</span></span><button class="link-btn" data-act="pr-pdf">${icon('printer', 14)}PDF</button></div>
      <div class="pr-prev__fit"><div class="pr-prev__scale" data-live="doc">${docHTML(d)}</div></div>
    </div>
  </div>`;

  return html`<div class="pr-ed" data-mtab="${mtab}">
    <div class="pr-top">
      <div class="pr-top__id">
        <span class="pr-top__ico">${icon(t.icon, 18)}</span>
        <div class="grow"><div class="row-sm wrap"><h1>${d.id ? d.numero : 'Nuevo ' + t.label.toLowerCase()}</h1>${ui.estado('ESTADOS_Q', d.estado)}${d.vistas && d.estado !== 'enviado' ? html`<span class="pr-seen">${icon('eye', 14)}Visto ${d.vistas} ${d.vistas === 1 ? 'vez' : 'veces'}</span>` : ''}${dirty ? html`<span class="pr-dirty">Cambios sin guardar</span>` : ''}</div>
          <p class="small muted ellipsis">${c ? c.nombre : 'Sin cliente'} · ${v ? ui.vehNombre(v) : 'sin coche'} · <b class="ink tnum" data-live="total">${App.eur(tot.total)}</b></p></div>
      </div>
      ${acciones}
    </div>
    <div class="tabs pr-mtabs show-m"><button class="tab ${mtab === 'form' ? 'is-on' : ''}" data-act="pr-mtab" data-v="form">${icon('pencil', 15)}Editar</button><button class="tab ${mtab === 'preview' ? 'is-on' : ''}" data-act="pr-mtab" data-v="preview">${icon('eye', 15)}Vista previa</button></div>
    <div class="pr-cols">${form}${preview}</div>
  </div>`;
}
function minimoHint(v, neto) {
  return neto < v.precioMin
    ? html`<span class="amber">${icon('alert-triangle', 14)} ${App.eur(v.precioMin - neto)} por debajo del precio mínimo (${App.eur(v.precioMin)})</span>`
    : html`<span class="green">${icon('circle-check', 14)} Por encima del precio mínimo · margen de negociación ${App.eur(neto - v.precioMin)}</span>`;
}

/* actualiza en vivo sin re-pintar el formulario */
function live(root) {
  if (!D) return;
  const tot = recalc(), v = db.veh(D.vehicleId), set = (k, h) => { const el = root.querySelector(`[data-live="${k}"]`); if (el) el.innerHTML = App.str(h); };
  set('doc', docHTML(D)); set('resumen', resumen(D)); set('total', App.eur(db.totalQuote(D).total));
  if (v) set('minimo', minimoHint(v, (D.precio || 0) - (D.descuento || 0)));
  if (D.financiacion) { set('entrada', App.eur(D.financiacion.entrada)); set('cuota', html`${App.eur(D.financiacion.cuota)}<small>/mes</small>`); set('afin', 'Financias ' + App.eur(db.totalQuote(D).aFinanciar)); }
  if (!dirty) { dirty = true; const b = root.querySelector('[data-act="pr-guardar"]'); if (b) { b.classList.remove('is-saved'); b.innerHTML = App.str(html`${icon('download', 15)}<span>Guardar</span>`); } const id = root.querySelector('.pr-top__id .row-sm'); if (id && !id.querySelector('.pr-dirty')) id.insertAdjacentHTML('beforeend', '<span class="pr-dirty">Cambios sin guardar</span>'); }
  fit(root);
}
function fit(root) {
  const box = root.querySelector('.pr-prev__fit'), sc = root.querySelector('.pr-prev__scale'); if (!box || !sc) return;
  const w = box.clientWidth; if (!w) return;
  const s = Math.min(1, w / 794), doc = sc.firstElementChild;
  sc.style.transform = `scale(${s})`;
  box.style.height = (doc ? doc.offsetHeight : 1123) * s + 'px';
}
const rerender = () => App.render({keepScroll: true});
const touch = () => { dirty = true; recalc(); rerender(); };

function guardar({silent = false} = {}) {
  if (!D.contactId || !D.vehicleId) { App.toast(!D.contactId ? 'Elige el cliente' : 'Elige el coche', {tipo: 'warn', sub: 'Hace falta para guardar el documento'}); return null; }
  recalc();
  const data = JSON.parse(JSON.stringify(D)); delete data.id;
  const nuevo = !D.id;
  let qq;
  if (nuevo) { qq = db.addQuote(data); D.id = qq.id; D.numero = qq.numero; }
  else qq = db.updateQuote(D.id, data);
  dirty = false;
  if (nuevo) { Dkey = '#/presupuestos/' + qq.id; App.go(Dkey); }
  else rerender();
  if (!silent) App.toast(nuevo ? `${TIPOS[D.tipo].label} ${D.numero} creado` : 'Cambios guardados', {sub: `${db.contact(D.contactId).nombre} · ${App.eur(db.totalQuote(D).total)}`, icon: 'file-check'});
  return qq;
}
function syncQuote(patch) { if (!D || !D.id) return; db.updateQuote(D.id, patch); Object.assign(D, patch); }

App.views.presupuestos = {
  title: route => route.id ? (route.id === 'nuevo' ? 'Nuevo presupuesto' : (db.quote(route.id) || {}).numero || 'Presupuesto') : 'Presupuestos',
  crumbs: route => route.id ? [{label: 'Presupuestos', href: '#/presupuestos'}] : null,
  deps: ['quotes', 'contacts', 'vehicles', 'appraisals'],
  full: false,
  render(route) { return route.id ? renderEditor(route) : renderLista(); },
  mount(root, route) {
    if (ro) { ro.disconnect(); ro = null; }
    if (!route.id) return;
    fit(root);
    const box = root.querySelector('.pr-prev__fit');
    if (box && window.ResizeObserver) { ro = new ResizeObserver(() => fit(root)); ro.observe(box); }
    root.querySelectorAll('.pr-doc img').forEach(img => { if (!img.complete) img.addEventListener('load', () => fit(root), {once: true}); });
    App.ventasPick.bind(root, () => ({
      onSelect(kind, id, o = {}) {
        if (!D) return;
        if (kind === 'contact') {
          D.contactId = id;
          const c = db.contact(id);
          if (c) {
            if (!D.vehicleId) { const v = c.interes.map(db.veh).find(x => x && x.estado !== 'vendido'); if (v) { D.vehicleId = v.id; D.precio = v.precio; } }
            const tas = db.tasacionesDe(c.id).find(t => ['aceptada', 'valorada'].includes(t.estado) && t.oferta);
            if (tas && !D.tasacion) D.tasacion = {importe: tas.oferta, vehiculo: `${tas.marca} ${tas.modelo} ${tas.anio}`, tasacionId: tas.id};
            if (c.financiar && !D.financiacion) D.financiacion = {entrada: 3000, plazo: 72, tin: App.S.dealer.tin, cuota: 0};
            if (['u2', 'u3'].includes(c.asignado)) D.userId = c.asignado;
          }
        } else { D.vehicleId = id; const v = db.veh(id); if (v) { D.precio = v.precio; D.descuento = 0; } }
        touch();
        if (o.focus) setTimeout(() => App.$(`.ag-pk[data-pk="${kind}"] .ag-pk__in`)?.focus(), 30);
      }
    }));
  },
  unmount() { if (ro) { ro.disconnect(); ro = null; } },
  actions: {
    'pr-nuevo'() { App.go('#/presupuestos/nuevo'); },
    'pr-abrir'(el) { App.open.presupuesto(el.dataset.id); },
    'pr-tab'(el) { tab = el.dataset.id; rerender(); },
    'pr-buscar'(el) { q = el.value; rerender(); },
    'pr-mtab'(el) { mtab = el.dataset.v; rerender(); window.scrollTo(0, 0); },
    'pr-set'(el) {
      const k = el.dataset.k, num = el.type === 'number' || el.type === 'range', val = num ? (parseFloat(String(el.value).replace(',', '.')) || 0) : el.value;
      if (k === 'extra') D.extras[+el.dataset.i][el.dataset.f] = val;
      else if (k.startsWith('fin.')) D.financiacion[k.slice(4)] = val;
      else if (k.startsWith('tas.')) D.tasacion[k.slice(4)] = val;
      else D[k] = val;
      live(App.$('#page'));
    },
    'pr-user'(el) { D.userId = el.value; touch(); },
    'pr-tipo'(el) { D.tipo = el.dataset.v; if (D.tipo === 'reserva' && !D.senal) D.senal = 300; touch(); },
    'pr-extra-add'(el) { D.extras.push({concepto: el.dataset.c || '', importe: +el.dataset.imp || 0}); touch(); if (!el.dataset.c) setTimeout(() => App.$('#prExC' + (D.extras.length - 1))?.focus(), 30); },
    'pr-extra-del'(el) { D.extras.splice(+el.dataset.i, 1); touch(); },
    'pr-tas-toggle'() {
      if (D.tasacion) D.tasacion = null;
      else { const t = D.contactId ? db.tasacionesDe(D.contactId).find(x => x.oferta) : null; D.tasacion = t ? {importe: t.oferta, vehiculo: `${t.marca} ${t.modelo} ${t.anio}`, tasacionId: t.id} : {importe: 0, vehiculo: ''}; }
      touch();
    },
    'pr-tas-use'(el) { const t = App.S.appraisals.find(x => x.id === el.dataset.id); if (t) D.tasacion = {importe: t.oferta, vehiculo: `${t.marca} ${t.modelo} ${t.anio}`, tasacionId: t.id}; touch(); },
    'pr-fin-toggle'() { D.financiacion = D.financiacion ? null : {entrada: Math.min(3000, r100(db.totalQuote(D).total * 0.2)), plazo: 72, tin: App.S.dealer.tin, cuota: 0}; touch(); },
    'pr-plazo'(el) { D.financiacion.plazo = +el.dataset.v; touch(); },
    'pr-senal'(el) { D.senal = +el.dataset.v; touch(); },
    'pr-guardar'() { guardar(); },
    'pr-pdf'() {
      if (!D.contactId || !D.vehicleId) return App.toast('Elige cliente y coche antes de descargar', {tipo: 'warn'});
      App.printHTML(App.str(docHTML(D)), {title: `${TIPOS[D.tipo].label} ${D.numero}`});
      App.toast('Preparando el PDF…', {sub: 'Elige «Guardar como PDF» en la ventana de impresión', icon: 'printer', tipo: 'info'});
    },
    'pr-wa'() {
      if (!guardar({silent: true})) return;
      const c = db.contact(D.contactId), v = db.veh(D.vehicleId), t = TIPOS[D.tipo], tot = db.totalQuote(D), id = D.id;
      db.addMessage(c.id, {from: 'agente', texto: `Hola ${first(c.nombre)}, te paso ${t.art} del ${ui.vehNombre(v)}: ${App.eur(tot.total)}${D.tasacion ? ' con tu ' + (D.tasacion.vehiculo || 'coche') + ' descontado' : ''}${D.financiacion ? ` o ${App.eur(D.financiacion.cuota)}/mes financiado` : ''}. Cualquier duda me dices 😊`});
      db.addMessage(c.id, {from: 'agente', texto: `📄 ${t.label} ${D.numero}.pdf`, pdf: D.numero});
      if (D.estado === 'borrador') syncQuote({estado: 'enviado'});
      db.addTimeline(c.id, {tipo: 'presupuesto', texto: `${t.label} ${D.numero} enviado por WhatsApp · ${App.eur(tot.total)}`});
      rerender();
      App.toast('Enviado por WhatsApp', {sub: `${c.nombre} · ${D.numero}.pdf`, tipo: 'wa', accion: 'Ver conversación', onAccion: () => App.open.whatsapp(c.id)});
      setTimeout(() => {
        const qq = db.quote(id); if (!qq || qq.estado !== 'enviado') return;
        db.updateQuote(id, {estado: 'visto', vistas: (qq.vistas || 0) + 1});
        if (D && D.id === id) { D.estado = 'visto'; D.vistas = (D.vistas || 0) + 1; }
        db.notify({titulo: `${first(c.nombre)} ha abierto ${t.art}`, texto: `${qq.numero} · ${ui.vehNombre(v)}`, tipo: 'presupuesto', link: '#/presupuestos/' + id, icon: 'eye'});
        App.toast(`${first(c.nombre)} ha abierto ${t.art}`, {sub: `${qq.numero} · ahora mismo`, tipo: 'info', icon: 'eye'});
      }, 8000);
    },
    'pr-email'() {
      if (!guardar({silent: true})) return;
      const c = db.contact(D.contactId), t = TIPOS[D.tipo];
      if (D.estado === 'borrador') syncQuote({estado: 'enviado'});
      db.addTimeline(c.id, {tipo: 'presupuesto', texto: `${t.label} ${D.numero} enviado por email`});
      rerender();
      App.toast('Enviado por email', {sub: `${c.email} · ${D.numero}.pdf adjunto`, icon: 'mail'});
    },
    'pr-aceptar'() {
      if (!guardar({silent: true})) return;
      const c = db.contact(D.contactId), v = db.veh(D.vehicleId), t = TIPOS[D.tipo];
      syncQuote({estado: 'aceptado'});
      if (D.tipo === 'reserva') {
        db.updateVehicle(v.id, {estado: 'reservado', reservadoPor: c.id});
        db.setEtapa(c.id, 'reservado', {silencioso: true});
        db.addTimeline(c.id, {tipo: 'etapa', texto: `Hoja de reserva ${D.numero} firmada · señal ${App.eur(D.senal || 0)}`});
        rerender();
        App.toast('Coche reservado', {sub: `${ui.vehNombre(v)} para ${c.nombre} · señal ${App.eur(D.senal || 0)}. Ya sale como reservado en el stock.`, icon: 'bookmark'});
      } else {
        if (['nuevo', 'contactado', 'cita', 'prueba'].includes(c.etapa)) db.setEtapa(c.id, 'negociacion', {silencioso: true});
        db.addTimeline(c.id, {tipo: 'presupuesto', texto: `${t.label} ${D.numero} aceptado`});
        rerender();
        const base = JSON.parse(JSON.stringify(D));
        App.toast(`${t.label} aceptado`, {sub: '¿Preparamos la hoja de reserva con la señal?', icon: 'circle-check', accion: 'Crear hoja de reserva', ms: 7000, onAccion: () => {
          const key = `#/presupuestos/nuevo?c=${base.contactId}&v=${base.vehicleId}&tipo=reserva`;
          D = Object.assign(base, {id: null, numero: db.nextQuoteNumber(), tipo: 'reserva', estado: 'borrador', vistas: 0, senal: 300, fecha: new Date().toISOString()});
          Dkey = key; dirty = true; App.go(key);
        }});
      }
    },
    'pr-mas'(el) {
      App.menu(el, [
        {label: 'Enviar por email', icon: 'mail', onClick: () => this.actions['pr-email']()},
        ...(D.estado !== 'aceptado' ? [{label: D.tipo === 'reserva' ? 'Reservar coche' : 'Marcar aceptado', icon: 'circle-check', onClick: () => this.actions['pr-aceptar']()}] : []),
        ...(D.id && D.estado !== 'rechazado' ? [{label: 'Marcar rechazado', icon: 'circle-x', onClick: () => { syncQuote({estado: 'rechazado'}); rerender(); App.toast('Marcado como rechazado', {tipo: 'info', icon: 'circle-x'}); }}] : []),
        {label: 'Duplicar', icon: 'copy', onClick: () => { const base = JSON.parse(JSON.stringify(D)); const key = `#/presupuestos/nuevo?c=${base.contactId || ''}&v=${base.vehicleId || ''}&d=${Date.now()}`; D = Object.assign(base, {id: null, numero: db.nextQuoteNumber(), estado: 'borrador', vistas: 0, fecha: new Date().toISOString()}); Dkey = key; dirty = true; App.go(key); App.toast('Copia creada', {sub: 'Cambia lo que quieras y guárdala'}); }},
        ...(D.id ? [{sep: true}, {label: 'Eliminar', icon: 'trash-2', danger: true, onClick: async () => {
          if (!await App.confirm({title: `¿Eliminar ${D.numero}?`, text: 'Se borra el documento. Si ya se lo mandaste al cliente, él seguirá teniendo el PDF.', ok: 'Eliminar', danger: true})) return;
          const id = D.id; D = null; Dkey = null;
          App.store.update(s => { s.quotes = s.quotes.filter(x => x.id !== id); }, 'quotes');
          App.go('#/presupuestos'); App.toast('Presupuesto eliminado', {icon: 'trash-2', tipo: 'info'});
        }}] : [])
      ], {align: 'right'});
    }
  }
};

App.modals.nuevoPresupuesto = ({contact, vehicle} = {}) => App.go('#/presupuestos/nuevo?c=' + (contact || '') + '&v=' + (vehicle || ''));
})();
