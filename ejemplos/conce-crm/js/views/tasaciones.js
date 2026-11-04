/* =====================================================================
   Tasaciones · tablero por estado (o lista), detalle con comparables
   y desglose de la oferta, y modal de nueva tasación con valoración
   en vivo. Rutas: #/tasaciones · #/tasaciones/:id
   ===================================================================== */
(function(){
const App = window.App;
const {html, icon, db, C, ui} = App;
const S = () => App.S;
const eur = App.eur;
const stk = () => App.stk;
const round = (n, s = 100) => Math.round(n / s) * s;
const first = n => String(n || '').split(' ')[0];
const rerender = () => App.render({keepScroll: true});
const YEAR = new Date().getFullYear();
const hash = s => stk().hash(s);
const rnd = (s, i) => stk().rnd(s, i);

const COLS = [
  {id: 'pendiente', label: 'Pendiente', hint: 'Por ver o valorar'},
  {id: 'valorada', label: 'Valorada', hint: 'Oferta hecha, esperando respuesta'},
  {id: 'aceptada', label: 'Aceptada', hint: 'El cliente dijo que sí'},
  {id: 'rechazada', label: 'Rechazada', hint: 'No hubo acuerdo'}
];
const DANOS = [
  {id: 'Paragolpes', coste: 180},
  {id: 'Carrocería', coste: 450},
  {id: 'Llantas', coste: 160},
  {id: 'Neumáticos', coste: 320},
  {id: 'Tapicería', coste: 220},
  {id: 'Mecánica', coste: 900},
  {id: 'Cristales', coste: 260}
];
const costeDano = d => { const s = App.norm(d); const x = DANOS.find(k => s.includes(App.norm(k.id).slice(0, 6))) || (s.includes('llanta') ? DANOS[2] : s.includes('neum') ? DANOS[3] : null); return x ? x.coste : 200; };
const PREMIUM = ['BMW', 'Mercedes-Benz', 'Mercedes', 'Audi', 'Porsche', 'Tesla', 'Volvo', 'Lexus', 'Land Rover', 'Jaguar', 'Cupra', 'MINI'];
const LOW = ['Dacia', 'Fiat', 'Lancia', 'Suzuki', 'MG', 'Citroën', 'Citroen', 'Chevrolet'];

function estimarMercado({marca, anio, km, combustible}) {
  const nuevo = PREMIUM.some(m => App.norm(m) === App.norm(marca)) ? 42000 : LOW.some(m => App.norm(m) === App.norm(marca)) ? 17500 : 25500;
  const edad = Math.max(0, YEAR - (+anio || YEAR - 8));
  let v = nuevo * Math.pow(.87, edad) * (edad === 0 ? .9 : 1);
  const esperados = Math.max(edad, 1) * 15000;
  v *= App.clamp(1 - ((km === '' || km == null ? esperados : +km) - esperados) / 250000, .7, 1.12);
  v *= ({'Híbrido': 1.06, 'Híbrido enchufable': 1.04, 'Eléctrico': .95, 'Diésel': .96, GLP: .98})[combustible] || 1;
  return Math.max(round(v), 1200);
}

/* desglose de una tasación (guardada o en borrador) */
function valoracion(t) {
  const mercado = t.valorMercado || estimarMercado(t);
  const danos = (t.danos || []).map(d => ({concepto: d, importe: costeDano(d)}));
  const sumD = App.sum(danos, d => d.importe);
  const base = Math.max((t.reacondicionado || round(mercado * .06 + 150, 10)) - sumD, 150);
  const items = danos.concat({concepto: 'Preparación, limpieza e ITV', importe: round(base, 10)});
  const reacond = App.sum(items, i => i.importe);
  const margenObj = round(mercado * .12, 50);
  const recomendada = Math.max(round(mercado - reacond - margenObj, 50), 0);
  const oferta = t.oferta || recomendada;
  return {mercado, items, reacond, margenObj, recomendada, oferta, margen: mercado - reacond - oferta, estimada: !t.valorMercado};
}
function comparables(t, mercado) {
  const P = ['cochesnet', 'wallapop', 'milanuncios', 'autoscout', 'fbmarket'];
  const CIU = ['Sevilla', 'Málaga', 'Córdoba', 'Huelva', 'Jerez', 'Cádiz', 'Granada', 'Badajoz'];
  const F = [.9, .95, 1, 1.04, 1.11];
  const list = F.map((f, i) => {
    const r = rnd(t.id + 'cmp', i);
    return {portal: P[(hash(t.id) + i * 3) % P.length], anio: +t.anio + [-1, 0, 0, 0, 1][(i + hash(t.id)) % 5], km: Math.max(round(+t.km * (.78 + r * .44), 500), 5000),
      precio: round(mercado * (f + (r - .5) * .02), 50), dias: 2 + Math.floor(rnd(t.id + 'd', i) * 58), ciudad: CIU[(hash(t.id) + i) % CIU.length]};
  });
  const diff = mercado * list.length - App.sum(list, c => c.precio);
  list[2].precio = round(list[2].precio + diff, 10);
  return list.sort((a, b) => a.precio - b.precio);
}
const tasacion = id => S().appraisals.find(x => x.id === id);

/* =====================================================================
   LISTADO
   ===================================================================== */
function listado() {
  const all = S().appraisals.slice().sort((a, b) => b.fecha.localeCompare(a.fecha));
  const by = e => all.filter(t => t.estado === e);
  const cerradas = by('aceptada').length + by('rechazada').length;
  const pct = cerradas ? by('aceptada').length / cerradas * 100 : 0;
  const ofertas = all.filter(t => t.oferta > 0);
  const media = ofertas.length ? App.sum(ofertas, t => t.oferta) / ofertas.length : 0;
  const vista = S().prefs.vistaTasaciones === 'lista' ? 'lista' : 'tablero';
  return html`
  <div class="page-head">
    <div><h1>Tasaciones</h1><p>${all.length} coches valorados · coches a cuenta y compras directas</p></div>
    <div class="page-head__actions">
      <div class="seg" role="group" aria-label="Vista">
        <button class="${vista === 'tablero' ? 'is-on' : ''}" data-act="ta-vista" data-vista="tablero">${icon('columns-3', 15)}<span class="hide-m">Tablero</span></button>
        <button class="${vista === 'lista' ? 'is-on' : ''}" data-act="ta-vista" data-vista="lista">${icon('list', 15)}<span class="hide-m">Lista</span></button>
      </div>
      <button class="btn btn--primary" data-act="nuevo" data-what="tasacion">${icon('plus', 16)}Nueva tasación</button>
    </div>
  </div>
  <div class="kpis ta-kpis">
    ${ui.kpi({label: 'Pendientes', value: by('pendiente').length, sub: 'por ver o valorar', icon: 'hourglass', color: 'var(--amber)'})}
    ${ui.kpi({label: 'Valoradas', value: by('valorada').length, sub: 'esperando respuesta', icon: 'scan-line', color: 'var(--accent)'})}
    ${ui.kpi({label: 'Aceptadas', value: App.pct(pct), sub: `${by('aceptada').length} de ${cerradas} cerradas`, icon: 'handshake', color: 'var(--green)'})}
    ${ui.kpi({label: 'Oferta media', value: eur(media), sub: `en ${ofertas.length} tasaciones`, icon: 'badge-euro', color: 'var(--violet)'})}
  </div>
  ${all.length ? (vista === 'lista' ? lista(all) : tablero(all)) : html`<div class="card mt-16">${ui.empty('scan-line', 'Todavía no hay tasaciones', 'Valora el coche de un cliente en dos minutos con precios de mercado.', html`<button class="btn btn--primary" data-act="nuevo" data-what="tasacion">${icon('plus', 16)}Nueva tasación</button>`)}</div>`}`;
}

function tcard(t) {
  const c = db.contact(t.contactId);
  const r = t.valorMercado ? App.clamp(t.oferta / t.valorMercado * 100, 0, 100) : 0;
  return html`<article class="ta-card" draggable="true" data-act="ta-open" data-id="${t.id}">
    <div class="ta-card__top"><b class="ellipsis">${t.marca} ${t.modelo}</b><span class="xs faint nowrap">${App.rel(t.fecha)}</span></div>
    <div class="small muted ellipsis">${t.version}</div>
    <div class="ta-card__meta"><span>${t.anio}</span><span>${App.km(t.km)}</span><span>${t.combustible}</span></div>
    ${t.oferta ? html`<div class="ta-card__money">
        <div><span>Oferta</span><b class="tnum">${eur(t.oferta)}</b></div>
        <div class="r"><span>Mercado</span><b class="tnum muted">${eur(t.valorMercado)}</b></div>
      </div>
      <div class="ta-card__bar" title="Oferta sobre el valor de mercado"><i style="width:${r.toFixed(1)}%"></i></div>`
    : html`<div class="ta-card__pending">${icon('scan-line', 14)}Sin valorar · ${t.fotos ? `${t.fotos} fotos recibidas` : 'faltan fotos'}</div>`}
    <div class="ta-card__foot">
      ${t.compraDirecta ? html`<span class="badge badge--outline">${icon('banknote', 12)}Compra directa</span>` : c ? html`<span class="row-sm grow ta-card__who">${App.avatar(c.nombre, {size: 'sm'})}<span class="small ellipsis">${c.nombre}</span></span>` : html`<span class="small muted">Sin cliente</span>`}
      <span class="row-sm xs muted nowrap">${t.danos && t.danos.length ? html`<span class="ta-dmg" title="Daños">${icon('alert-triangle', 12)}${t.danos.length}</span>` : ''}${icon('camera', 12)}${t.fotos || 0}</span>
    </div>
  </article>`;
}

function tablero(all) {
  return html`<div class="ta-board mt-16" data-tour="tas-list" data-keep-x="ta-board">${COLS.map(col => {
    const items = all.filter(t => t.estado === col.id);
    const suma = App.sum(items, t => t.oferta || 0);
    return html`<section class="ta-col ta-col--${col.id}" data-estado="${col.id}">
      <header class="ta-col__head"><span class="ta-dot"></span><b>${col.label}</b><span class="chip__n">${items.length}</span><span class="grow"></span>${suma ? html`<span class="xs muted tnum">${eur(suma)}</span>` : ''}</header>
      <p class="ta-col__hint">${col.hint}</p>
      <div class="ta-col__list">${items.length ? items.map(tcard) : html`<div class="ta-col__empty">${icon('move', 16)}Arrastra aquí una tasación</div>`}</div>
    </section>`;
  })}</div>`;
}

function lista(all) {
  return html`<div class="card mt-16" data-tour="tas-list"><div class="table-wrap"><table class="table ta-table">
    <thead><tr><th>Coche</th><th>Matrícula</th><th>Año · km</th><th>Cliente</th><th class="r">Mercado</th><th class="r">Oferta</th><th>Estado</th><th>Fecha</th></tr></thead>
    <tbody>${all.map(t => { const c = db.contact(t.contactId); return html`<tr class="is-link" data-act="ta-open" data-id="${t.id}">
      <td><div class="cell-main"><span class="ta-ico">${icon('car-front', 16)}</span><span class="grow"><b>${t.marca} ${t.modelo}</b><span>${t.version}</span></span></div></td>
      <td>${stk().plate(t.matricula, 'stk-plate--sm')}</td>
      <td class="nowrap">${t.anio}<span class="muted"> · ${App.km(t.km)}</span></td>
      <td>${t.compraDirecta ? html`<span class="badge badge--outline">Compra directa</span>` : ui.contactoMini(c)}</td>
      <td class="r tnum muted">${t.valorMercado ? eur(t.valorMercado) : '—'}</td>
      <td class="r tnum semi">${t.oferta ? eur(t.oferta) : '—'}</td>
      <td>${ui.estado('ESTADOS_TAS', t.estado)}</td>
      <td class="nowrap muted">${App.fecha(t.fecha)}</td>
    </tr>`; })}</tbody></table></div></div>`;
}

/* =====================================================================
   DETALLE
   ===================================================================== */
function detalle(id) {
  const t = tasacion(id);
  if (!t) return html`<div class="card mt-24">${ui.empty('scan-line', 'No encontramos esta tasación', 'Puede que se haya borrado.', html`<a class="btn" href="#/tasaciones">Volver a tasaciones</a>`)}</div>`;
  const c = db.contact(t.contactId), u = db.user(t.userId);
  const val = valoracion(t), comps = comparables(t, val.mercado);
  const min = comps[0].precio, max = comps[comps.length - 1].precio;
  const pos = x => (App.clamp((x - min) / Math.max(max - min, 1), 0, 1) * 100).toFixed(1);
  const vInt = c ? c.interes.map(db.veh).find(v => v && v.estado !== 'vendido') : null;
  const vStock = t.vehiculoId ? db.veh(t.vehiculoId) : null;
  const sobre = val.oferta - val.recomendada;
  return html`
  <div class="card ta-hero">
    <div class="ta-hero__main">
      <div class="row wrap">${ui.estado('ESTADOS_TAS', t.estado)}${t.compraDirecta ? html`<span class="badge badge--outline">Compra directa</span>` : ''}<span class="xs muted">${App.cap(App.fechaLarga(t.fecha))}${u ? ` · ${u.nombre}` : ''}</span></div>
      <h1>${t.marca} ${t.modelo}</h1>
      <p class="muted">${t.version}</p>
      <div class="row wrap mt-12">${stk().plate(t.matricula)}<span class="tag">${t.anio}</span><span class="tag">${App.km(t.km)}</span><span class="tag">${t.combustible}</span><span class="tag">${icon('camera', 12)} ${t.fotos || 0} fotos</span></div>
    </div>
    <div class="ta-hero__offer">
      <span>${val.estimada ? 'Oferta recomendada' : 'Oferta al cliente'}</span>
      <b class="tnum">${eur(val.oferta)}</b>
      <small class="tnum">Valor de mercado ${eur(val.mercado)}</small>
    </div>
  </div>

  <div class="grid-main ta-grid mt-16">
    <div class="stack">
      <section class="card">
        <div class="card__head"><div><h3>${icon('search', 17)}Anuncios comparables</h3><p>Mismo modelo, ±1 año y kilómetros parecidos · ${App.fecha(new Date())}</p></div></div>
        <div class="table-wrap"><table class="table ta-comps">
          <thead><tr><th>Portal</th><th>Anuncio</th><th>Año</th><th class="r">Km</th><th class="r">Precio</th><th class="r">Publicado</th></tr></thead>
          <tbody>${comps.map(x => html`<tr>
            <td>${ui.origen(x.portal)}</td>
            <td><div class="cell-main"><span class="grow"><b>${t.marca} ${t.modelo}</b><span>${t.version} · ${x.ciudad}</span></span></div></td>
            <td class="tnum">${x.anio}</td><td class="r tnum nowrap">${App.km(x.km)}</td><td class="r tnum semi nowrap">${eur(x.precio)}</td>
            <td class="r nowrap"><span class="badge ${x.dias > 45 ? 'badge--amber' : ''}">${x.dias} días</span></td>
          </tr>`)}</tbody>
        </table></div>
        <div class="card__body ta-range">
          <div class="ta-range__track">
            <i class="ta-range__mk ta-range__mk--mkt" style="left:${pos(val.mercado)}%"><span>Mercado ${eur(val.mercado)}</span></i>
            <i class="ta-range__mk ta-range__mk--offer" style="left:${pos(val.oferta)}%"><span>Oferta ${eur(val.oferta)}</span></i>
          </div>
          <div class="between xs muted tnum"><span>${eur(min)}</span><span>${eur(max)}</span></div>
        </div>
      </section>

      <section class="card">
        <div class="card__head"><div><h3>${icon('calculator', 17)}Desglose de la oferta</h3><p>${val.estimada ? 'Valoración estimada: confírmala antes de enviarla' : 'Así llegamos a la cifra'}</p></div></div>
        <div class="card__body">
          <div class="ta-calc">
            <div class="ta-calc__row"><span>Valor de mercado <small>media de ${comps.length} anuncios</small></span><b class="tnum">${eur(val.mercado)}</b></div>
            <div class="ta-calc__row is-minus"><span>Reacondicionamiento</span><b class="tnum">− ${eur(val.reacond)}</b></div>
            ${val.items.map(i => html`<div class="ta-calc__sub"><span>${i.concepto}</span><span class="tnum">${eur(i.importe)}</span></div>`)}
            <div class="ta-calc__row is-minus"><span>Margen objetivo <small>12 %</small></span><b class="tnum">− ${eur(val.margenObj)}</b></div>
            <div class="ta-calc__row is-total"><span>Oferta recomendada</span><b class="tnum">${eur(val.recomendada)}</b></div>
            ${!val.estimada && t.oferta ? html`
              <div class="ta-calc__row"><span>Oferta al cliente ${sobre ? html`<small class="${sobre > 0 ? 'amber' : 'green'}">${sobre > 0 ? '+' : '−'}${eur(Math.abs(sobre))} ${sobre > 0 ? 'sobre' : 'bajo'} la recomendada</small>` : ''}</span><b class="tnum">${eur(val.oferta)}</b></div>
              <div class="ta-calc__row"><span>Margen previsto en la reventa</span><b class="tnum ${val.margen < 0 ? 'red' : 'green'}">${eur(val.margen)}</b></div>` : ''}
          </div>
          ${sobre > 0 && !val.estimada ? html`<div class="ta-tip">${icon('lightbulb', 16)}<p>Sobretasación de <b>${eur(sobre)}</b> para cerrar la venta${vInt ? html` del <a href="#/stock/${vInt.id}">${ui.vehNombre(vInt)}</a>, que deja ${eur(db.margen(vInt))} de margen` : ''}.</p></div>` : ''}
          ${t.estado !== 'rechazada' ? html`<button class="btn btn--sm mt-16" data-act="ta-ajustar" data-id="${t.id}">${icon('sliders-horizontal', 15)}Ajustar oferta</button>` : ''}
        </div>
      </section>
    </div>

    <div class="stack">
      <section class="card ta-side">
        <div class="card__head"><h3>${icon('user', 17)}Cliente</h3>${c ? html`<button class="link-btn" data-act="contacto" data-id="${c.id}">Ver ficha${icon('arrow-right', 14)}</button>` : ''}</div>
        <div class="card__body">
          ${c ? html`<div class="row">${App.avatar(c.nombre, {size: 'lg'})}<div class="grow"><b>${c.nombre}</b><div class="small muted">${c.tel} · ${c.ciudad}</div><div class="mt-4">${ui.etapa(c.etapa)}</div></div></div>
            ${vInt ? html`<a class="ta-int" href="#/stock/${vInt.id}"><img src="${stk().fotos(vInt)[0].s}" alt=""><span class="grow"><small>Quiere comprar</small><b>${ui.vehNombre(vInt)}</b><span>${eur(vInt.precio)}${t.oferta ? ` · le quedaría en ${eur(vInt.precio - val.oferta)}` : ''}</span></span></a>` : ''}
            <div class="ta-actions mt-16">
              <button class="btn btn--wa btn--block" data-act="ta-wa" data-id="${t.id}" ${t.estado === 'rechazada' ? 'disabled' : ''}>${icon('message-circle', 16)}Enviar oferta por WhatsApp</button>
              <div class="row"><button class="btn btn--sm grow" data-act="llamar" data-id="${c.id}">${icon('phone', 15)}Llamar</button>${vInt ? html`<button class="btn btn--sm grow" data-act="ta-presupuesto" data-id="${t.id}">${icon('file-text', 15)}Presupuesto</button>` : ''}</div>
            </div>`
          : html`<p class="small muted">${t.compraDirecta ? 'Compra directa: no hay venta asociada.' : 'Esta tasación no tiene cliente asociado.'}</p>`}
        </div>
      </section>

      <section class="card ta-side">
        <div class="card__head"><h3>${icon('git-branch', 17)}Estado</h3></div>
        <div class="card__body">
          <div class="ta-estados">${COLS.map(col => html`<button class="ta-estado ta-estado--${col.id} ${t.estado === col.id ? 'is-on' : ''}" data-act="ta-estado" data-id="${t.id}" data-estado="${col.id}"><span class="ta-dot"></span>${col.label}</button>`)}</div>
          ${val.estimada ? html`<button class="btn btn--primary btn--block mt-12" data-act="ta-valorar" data-id="${t.id}">${icon('check', 16)}Confirmar valoración · ${eur(val.recomendada)}</button>` : ''}
          ${t.estado === 'aceptada' ? (vStock
            ? html`<a class="btn btn--block mt-12" href="#/stock/${vStock.id}">${icon('car', 16)}Ver en stock</a>`
            : html`<button class="btn btn--primary btn--block mt-12" data-act="ta-stock" data-id="${t.id}">${icon('car', 16)}Pasar a stock</button><p class="xs muted mt-8">Entra como «En preparación» con la compra y el reacondicionamiento como costes.</p>`) : ''}
        </div>
      </section>

      <section class="card ta-side">
        <div class="card__head"><h3>${icon('clipboard-list', 17)}Revisión</h3><span class="xs muted">${(t.danos || []).length ? `${t.danos.length} ${t.danos.length === 1 ? 'daño' : 'daños'}` : 'Sin daños'}</span></div>
        <div class="card__body">
          ${(t.danos || []).length ? html`<div class="stack-sm">${t.danos.map(d => html`<div class="between small"><span class="row-sm">${icon('alert-triangle', 14, 'amber')}${d}</span><span class="muted tnum">${eur(costeDano(d))}</span></div>`)}</div>` : html`<p class="small row-sm green">${icon('circle-check', 15)}Sin daños a la vista</p>`}
          ${t.notas ? html`<div class="tl__card mt-12">${t.notas}</div>` : ''}
          <div class="ta-fotos mt-12">${Array.from({length: Math.min(t.fotos || 0, 6)}, (_, i) => html`<span class="ta-foto">${icon('image', 16)}${i === 5 && t.fotos > 6 ? html`<b>+${t.fotos - 5}</b>` : ''}</span>`)}</div>
        </div>
      </section>
    </div>
  </div>`;
}

/* =====================================================================
   MODALES
   ===================================================================== */
App.modals.nuevaTasacion = (opts = {}) => {
  const cid = opts.contact || '';
  const c0 = db.contact(cid);
  const st = {contactId: cid, matricula: '', marca: '', modelo: '', version: '', anio: '', km: '', combustible: 'Gasolina', danos: [], fotos: 6, notas: '', oferta: null, buscando: false};
  if (c0 && c0.cocheACuenta) Object.assign(st, {marca: c0.cocheACuenta.marca, modelo: c0.cocheACuenta.modelo, anio: c0.cocheACuenta.anio, km: c0.cocheACuenta.km});
  const contactos = db.activos().slice().sort((a, b) => (!!b.cocheACuenta - !!a.cocheACuenta) || a.nombre.localeCompare(b.nombre, 'es'));
  const fld = (k, label, {type = 'text', span = '', ph = '', suffix = ''} = {}) => html`<div class="field ${span}"><label for="taN_${k}">${label}</label>${suffix
    ? html`<div class="input-group stk-suf"><input class="input" id="taN_${k}" data-k="${k}" type="${type}" value="${st[k]}" placeholder="${ph}"><span class="input-group__suffix">${suffix}</span></div>`
    : html`<input class="input" id="taN_${k}" data-k="${k}" type="${type}" value="${st[k]}" placeholder="${ph}">`}</div>`;

  App.modal({title: 'Nueva tasación', sub: 'Valora el coche en dos minutos con precios de mercado', size: 'xl', cls: 'ta-modal',
    body: html`<div class="ta-new">
      <div class="ta-new__form">
        <div class="field"><label for="taN_contact">Cliente <span class="faint">(opcional)</span></label>
          <select class="select" id="taN_contact"><option value="">Sin cliente · compra directa</option>${contactos.map(c => html`<option value="${c.id}" ${c.id === cid ? 'selected' : ''}>${c.nombre}${c.cocheACuenta ? ` · trae ${c.cocheACuenta.marca} ${c.cocheACuenta.modelo}` : ''}</option>`)}</select></div>
        <div class="field mt-12"><label for="taN_mat">Matrícula</label>
          <div class="ta-lookup"><label class="stk-plate stk-plate--input stk-plate--md"><i>E</i><input id="taN_mat" placeholder="0000 XXX" maxlength="9" autocomplete="off" autocapitalize="characters" spellcheck="false"></label>
          <button class="btn btn--primary" id="taN_buscar" type="button">${icon('search', 16)}Buscar datos</button></div>
          <div class="ta-found hidden" id="taN_found">${icon('circle-check', 16)}Datos traídos de la ficha técnica</div></div>
        <div class="form-grid form-grid--3 mt-12">
          ${fld('marca', 'Marca', {ph: 'Seat'})}${fld('modelo', 'Modelo', {ph: 'León'})}${fld('anio', 'Año', {type: 'number', ph: '2017'})}
          ${fld('version', 'Versión', {span: 'span-2', ph: '1.6 TDI 115 CV Style'})}${fld('km', 'Kilómetros', {type: 'number', ph: '120000', suffix: 'km'})}
          <div class="field"><label for="taN_combustible">Combustible</label><select class="select" id="taN_combustible" data-k="combustible">${C.COMBUSTIBLES.map(x => html`<option ${x === st.combustible ? 'selected' : ''}>${x}</option>`)}</select></div>
          <div class="field span-2"><label>Fotos recibidas</label><div class="ta-stepper"><button type="button" class="btn btn--sm btn--icon" data-step="-1" aria-label="Menos">${icon('chevron-down', 15)}</button><b class="tnum" id="taN_fotos">${st.fotos}</b><button type="button" class="btn btn--sm btn--icon" data-step="1" aria-label="Más">${icon('chevron-up', 15)}</button><span class="small muted">frontal, trasera, interior, cuentakilómetros…</span></div></div>
        </div>
        <div class="field mt-16"><label>Estado y daños</label>
          <div class="ta-danos">${DANOS.map(d => html`<button type="button" class="ta-dano" data-dano="${d.id}"><span class="ta-dano__chk">${icon('check', 12)}</span>${d.id}<small>−${eur(d.coste)}</small></button>`)}</div></div>
        <div class="field mt-16"><label for="taN_notas">Notas</label><textarea class="textarea" id="taN_notas" rows="2" placeholder="Distribución hecha, libro sellado, un rayón en la puerta…"></textarea></div>
      </div>
      <aside class="ta-new__res" id="taN_res"></aside>
    </div>`,
    foot: html`<button class="btn" data-close>Cancelar</button><button class="btn btn--primary" id="taN_ok">${icon('check', 16)}Guardar tasación</button>`,
    onMount(n, close) {
      const $ = s => n.querySelector(s);
      const listo = () => st.marca.trim() && st.modelo.trim() && +st.anio > 1980;
      const draft = () => ({id: 'nuevo-' + st.marca + st.modelo + st.anio, marca: st.marca, modelo: st.modelo, anio: +st.anio, km: st.km === '' ? '' : +st.km, combustible: st.combustible, danos: st.danos, valorMercado: 0, oferta: 0, reacondicionado: 0});
      const draw = () => {
        const res = $('#taN_res');
        if (!listo()) { res.innerHTML = App.str(html`<div class="ta-res ta-res--empty">${icon('scan-line', 26)}<b>Valoración en vivo</b><p>Busca la matrícula o escribe marca, modelo y año y verás aquí la oferta recomendada.</p></div>`); return; }
        const d = draft(), val = valoracion(d), comps = comparables(d, val.mercado);
        const lo = round(val.recomendada * .8, 50), hi = Math.max(round(val.mercado - val.reacond, 50), round(val.recomendada * 1.15, 50));
        const of = st.oferta == null ? val.recomendada : App.clamp(st.oferta, lo, hi);
        const margen = val.mercado - val.reacond - of;
        res.innerHTML = App.str(html`<div class="ta-res">
          <div class="ta-res__head"><span class="up">Valoración en vivo</span><span class="ia-badge">${icon('sparkles', 11)}Mercado</span></div>
          <div class="ta-res__mkt"><span>Valor de mercado</span><b class="tnum">${eur(val.mercado)}</b><small>${comps.length + 7 + hash(d.id) % 9} anuncios · de ${eur(comps[0].precio)} a ${eur(comps[comps.length - 1].precio)}</small></div>
          <div class="ta-calc ta-calc--sm">
            <div class="ta-calc__row is-minus"><span>Reacondicionamiento${st.danos.length ? html` <small>${st.danos.length} ${st.danos.length === 1 ? 'daño' : 'daños'}</small>` : ''}</span><b class="tnum">− ${eur(val.reacond)}</b></div>
            <div class="ta-calc__row is-minus"><span>Margen objetivo <small>12 %</small></span><b class="tnum">− ${eur(val.margenObj)}</b></div>
            <div class="ta-calc__row is-total"><span>Oferta recomendada</span><b class="tnum">${eur(val.recomendada)}</b></div>
          </div>
          <div class="ta-res__adj">
            <div class="between"><span class="small semi">Tu oferta</span><b class="tnum ta-res__of">${eur(of)}</b></div>
            <input type="range" class="range" id="taN_of" min="${lo}" max="${hi}" step="50" value="${of}" aria-label="Ajustar oferta">
            <div class="between xs muted tnum"><span>${eur(lo)}</span><span>${eur(hi)}</span></div>
            <p class="small mt-8">Margen previsto en la reventa: <b class="tnum ${margen < 300 ? 'amber' : 'green'}">${eur(margen)}</b></p>
          </div>
        </div>`);
        const r = $('#taN_of');
        r.addEventListener('input', () => { st.oferta = +r.value; const m = val.mercado - val.reacond - st.oferta; res.querySelector('.ta-res__of').textContent = eur(st.oferta); const b = res.querySelector('.ta-res__adj p b'); b.textContent = eur(m); b.className = 'tnum ' + (m < 300 ? 'amber' : 'green'); });
      };
      n.querySelectorAll('[data-k]').forEach(inp => inp.addEventListener('input', () => { st[inp.dataset.k] = inp.value; draw(); }));
      $('#taN_contact').addEventListener('change', e => {
        st.contactId = e.target.value; const c = db.contact(st.contactId);
        if (c && c.cocheACuenta && !st.marca) {
          Object.assign(st, {marca: c.cocheACuenta.marca, modelo: c.cocheACuenta.modelo, anio: c.cocheACuenta.anio, km: c.cocheACuenta.km});
          ['marca', 'modelo', 'anio', 'km'].forEach(k => { $('#taN_' + k).value = st[k]; });
          draw();
        }
      });
      const mat = $('#taN_mat');
      mat.addEventListener('input', () => { const p = mat.selectionStart; mat.value = mat.value.toUpperCase(); mat.setSelectionRange(p, p); st.matricula = mat.value; });
      const buscar = () => {
        const val = mat.value.trim();
        if (val.replace(/\s/g, '').length < 5) { mat.focus(); return App.toast('Escribe la matrícula completa', {tipo: 'warn', sub: 'Por ejemplo 4521 JKL'}); }
        const b = $('#taN_buscar'); b.disabled = true; b.innerHTML = App.str(html`${icon('refresh-cw', 16, 'spin')}Buscando…`);
        n.querySelectorAll('.ta-new__form .form-grid .input').forEach(i => i.classList.add('skel'));
        setTimeout(() => {
          if (!n.isConnected) return;
          const p = stk().plantilla(val);
          const edad = Math.max(YEAR - p.anio, 1);
          Object.assign(st, {marca: p.marca, modelo: p.modelo, version: p.version, anio: p.anio, combustible: p.combustible, km: st.km || round(edad * 14500 * (.85 + rnd(val, 1) * .3), 500)});
          ['marca', 'modelo', 'version', 'anio', 'km'].forEach(k => { $('#taN_' + k).value = st[k]; });
          $('#taN_combustible').value = st.combustible;
          n.querySelectorAll('.ta-new__form .form-grid .input').forEach(i => i.classList.remove('skel'));
          b.disabled = false; b.innerHTML = App.str(html`${icon('search', 16)}Buscar datos`);
          $('#taN_found').classList.remove('hidden');
          draw();
        }, 1000);
      };
      $('#taN_buscar').onclick = buscar;
      mat.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); buscar(); } });
      n.querySelectorAll('[data-step]').forEach(b => b.onclick = () => { st.fotos = App.clamp(st.fotos + +b.dataset.step, 0, 40); $('#taN_fotos').textContent = st.fotos; });
      n.querySelectorAll('[data-dano]').forEach(b => b.onclick = () => { const d = b.dataset.dano; st.danos = st.danos.includes(d) ? st.danos.filter(x => x !== d) : st.danos.concat(d); b.classList.toggle('is-on', st.danos.includes(d)); draw(); });
      $('#taN_ok').onclick = () => {
        if (!listo()) { const f = !st.marca.trim() ? 'marca' : !st.modelo.trim() ? 'modelo' : 'anio'; $('#taN_' + f).focus(); return App.toast('Faltan la marca, el modelo o el año', {tipo: 'warn'}); }
        const d = draft(), val = valoracion(d);
        const lo = round(val.recomendada * .8, 50), hi = Math.max(round(val.mercado - val.reacond, 50), round(val.recomendada * 1.15, 50));
        const oferta = st.oferta == null ? val.recomendada : App.clamp(st.oferta, lo, hi);
        const t = db.addTasacion({contactId: st.contactId || null, marca: st.marca.trim(), modelo: st.modelo.trim(), version: st.version.trim(), anio: +st.anio, km: +st.km || 0, combustible: st.combustible,
          matricula: (st.matricula || '').toUpperCase().replace(/^(\d{4})\s?([A-Z]{3})$/, '$1 $2') || '—', estado: 'valorada', valorMercado: val.mercado, oferta, reacondicionado: val.reacond,
          danos: st.danos.slice(), fotos: st.fotos, notas: $('#taN_notas').value.trim(), compraDirecta: !st.contactId, comparables: comparables(d, val.mercado).map(x => x.precio)});
        const c = db.contact(st.contactId);
        if (c) db.addTimeline(c.id, {tipo: 'tasacion', texto: `Tasación del ${t.marca} ${t.modelo} ${t.anio}: oferta ${eur(oferta)}`});
        close();
        if (App.route && App.route.name === 'tasaciones') { App.go('#/tasaciones/' + t.id); App.toast('Tasación guardada', {icon: 'scan-line', sub: `${t.marca} ${t.modelo} · oferta ${eur(oferta)}`}); }
        else App.toast('Tasación guardada', {icon: 'scan-line', sub: `${t.marca} ${t.modelo} · oferta ${eur(oferta)}`, accion: 'Ver', onAccion: () => App.go('#/tasaciones/' + t.id)});
      };
      draw();
    }});
};

function modalAjustar(t) {
  const val = valoracion(t);
  const lo = round(val.recomendada * .75, 50), hi = Math.max(round(val.mercado - val.reacond, 50), round(val.recomendada * 1.2, 50));
  App.modal({title: 'Ajustar oferta', sub: `${t.marca} ${t.modelo} ${t.anio} · mercado ${eur(val.mercado)}`, size: 'sm',
    body: html`<div class="stack">
      <div class="ta-adj"><span>Oferta</span><b class="tnum" id="taA_v">${eur(val.oferta)}</b></div>
      <input type="range" class="range" id="taA_r" min="${lo}" max="${hi}" step="50" value="${App.clamp(val.oferta, lo, hi)}">
      <div class="between xs muted tnum"><span>${eur(lo)}</span><span>Recomendada ${eur(val.recomendada)}</span><span>${eur(hi)}</span></div>
      <div class="ta-calc ta-calc--sm" id="taA_calc"></div>
    </div>`,
    foot: html`<button class="btn" data-close>Cancelar</button><button class="btn btn--primary" id="taA_ok">Guardar oferta</button>`,
    onMount(n, close) {
      const r = n.querySelector('#taA_r');
      const draw = () => { const of = +r.value, m = val.mercado - val.reacond - of; n.querySelector('#taA_v').textContent = eur(of);
        n.querySelector('#taA_calc').innerHTML = App.str(html`<div class="ta-calc__row"><span>Diferencia con la recomendada</span><b class="tnum ${of > val.recomendada ? 'amber' : ''}">${of >= val.recomendada ? '+' : '−'}${eur(Math.abs(of - val.recomendada))}</b></div><div class="ta-calc__row"><span>Margen previsto en la reventa</span><b class="tnum ${m < 0 ? 'red' : 'green'}">${eur(m)}</b></div>`); };
      r.addEventListener('input', draw); draw();
      n.querySelector('#taA_ok').onclick = () => {
        const of = +r.value;
        db.updateTasacion(t.id, {oferta: of, valorMercado: val.mercado, reacondicionado: val.reacond, estado: t.estado === 'pendiente' ? 'valorada' : t.estado});
        close(); App.toast('Oferta actualizada', {icon: 'badge-euro', sub: `${t.marca} ${t.modelo} · ${eur(of)}`});
      };
    }});
}

function pasarAStock(t) {
  const val = valoracion(t);
  const pl = stk().plantilla(t.matricula || t.id);
  const mismo = App.norm(pl.marca) === App.norm(t.marca);
  const v = db.addVehicle({
    marca: t.marca, modelo: t.modelo, version: t.version || '', anio: +t.anio, km: +t.km || 0, combustible: t.combustible,
    cambio: mismo ? pl.cambio : 'Manual', cv: mismo ? pl.cv : (t.combustible === 'Diésel' ? 115 : 110), carroceria: mismo ? pl.carroceria : 'Compacto', color: 'Gris',
    etiqueta: stk().etqDe(t.combustible, +t.anio), garantia: 12, puertas: 5, plazas: 5, matricula: t.matricula, bastidor: stk().genVin(t.marca, t.id),
    fechaMatriculacion: `${t.anio}-06-15`, itv: `${YEAR + 1}-0${1 + hash(t.id) % 9}`, duenos: 1, libroRevisiones: true, estadoGeneral: (t.danos || []).length > 1 ? 'Bueno' : 'Muy bueno',
    precio: round(val.mercado), precioMin: round(val.mercado * .955), precioCompra: val.oferta,
    gastos: val.items.map(i => ({concepto: i.concepto, importe: i.importe})), estado: 'preparacion', ubicacion: 'Taller', fotos: [], equipamiento: [],
    descripcion: '', origenTasacion: t.id, docs: {permiso: true, ficha: true, itv: true, dgt: false, libro: true, contrato: true, llaves: false}
  });
  v.descripcion = stk().textoIA(v);
  db.updateTasacion(t.id, {vehiculoId: v.id});
  App.go('#/stock/' + v.id);
  App.toast('Pasado a stock', {icon: 'car', sub: `${t.marca} ${t.modelo} · en preparación en el taller`});
}

/* =====================================================================
   VISTA
   ===================================================================== */
const keepXMap = {};
App.views.tasaciones = {
  title: route => route.id ? (tasacion(route.id) ? `${tasacion(route.id).marca} ${tasacion(route.id).modelo}` : 'Tasación') : 'Tasaciones',
  crumbs: route => route.id ? [{label: 'Tasaciones', href: '#/tasaciones'}] : null,
  deps: ['appraisals', 'contacts', 'vehicles'],
  render(route) { return route.id ? detalle(route.id) : listado(); },
  mount(root, route) {
    App.$$('[data-keep-x]', root).forEach(el => {
      const k = el.dataset.keepX;
      if (keepXMap[k] != null) el.scrollLeft = keepXMap[k];
      el.addEventListener('scroll', () => { keepXMap[k] = el.scrollLeft; }, {passive: true});
    });
    if (route.id) return;
    let dragId = null;
    App.$$('.ta-card', root).forEach(cd => {
      cd.addEventListener('dragstart', e => { dragId = cd.dataset.id; cd.classList.add('is-drag'); try { e.dataTransfer.setData('text/plain', dragId); e.dataTransfer.effectAllowed = 'move'; } catch (x) {} });
      cd.addEventListener('dragend', () => { cd.classList.remove('is-drag'); App.$$('.ta-col.is-over', root).forEach(c => c.classList.remove('is-over')); });
    });
    App.$$('.ta-col', root).forEach(col => {
      col.addEventListener('dragover', e => { if (!dragId) return; e.preventDefault(); col.classList.add('is-over'); });
      col.addEventListener('dragleave', e => { if (!col.contains(e.relatedTarget)) col.classList.remove('is-over'); });
      col.addEventListener('drop', e => {
        e.preventDefault(); col.classList.remove('is-over');
        const t = tasacion(dragId); dragId = null; if (!t || t.estado === col.dataset.estado) return;
        App.actions['ta-estado-set'](t, col.dataset.estado);
      });
    });
  },
  actions: {
    'ta-vista'(el) { S().prefs.vistaTasaciones = el.dataset.vista; App.store.save(); rerender(); },
    'ta-open'(el) { App.go('#/tasaciones/' + el.dataset.id); },
    'ta-estado'(el) { const t = tasacion(el.dataset.id); if (t && t.estado !== el.dataset.estado) App.actions['ta-estado-set'](t, el.dataset.estado); },
    'ta-valorar'(el) {
      const t = tasacion(el.dataset.id); if (!t) return;
      const val = valoracion(t);
      db.updateTasacion(t.id, {valorMercado: val.mercado, oferta: val.recomendada, reacondicionado: val.reacond, estado: 'valorada'});
      App.toast('Valoración confirmada', {icon: 'scan-line', sub: `${t.marca} ${t.modelo} · oferta ${eur(val.recomendada)}`});
    },
    'ta-ajustar'(el) { const t = tasacion(el.dataset.id); if (t) modalAjustar(t); },
    'ta-wa'(el) {
      const t = tasacion(el.dataset.id); if (!t) return;
      const c = db.contact(t.contactId); if (!c) return;
      const val = valoracion(t);
      const vInt = c.interes.map(db.veh).find(v => v && v.estado !== 'vendido');
      const texto = `Hola ${first(c.nombre)} 👋 Ya tenemos la valoración de tu ${t.marca} ${t.modelo} de ${t.anio} con ${App.km(t.km)}: te ofrecemos ${eur(val.oferta)}.` +
        (vInt ? ` Te lo descontamos directamente del ${ui.vehNombre(vInt)}, que se te quedaría en ${eur(vInt.precio - val.oferta)}.` : ' Te lo pagamos por transferencia el mismo día de la firma.') +
        ' La oferta es válida 7 días. ¿Te encaja?';
      if (t.estado === 'pendiente' || !t.valorMercado) db.updateTasacion(t.id, {valorMercado: val.mercado, oferta: val.oferta, reacondicionado: val.reacond, estado: 'valorada'});
      db.addMessage(c.id, {from: 'agente', texto});
      db.addTimeline(c.id, {tipo: 'tasacion', texto: `Oferta de tasación enviada por WhatsApp: ${eur(val.oferta)} (${t.marca} ${t.modelo})`});
      App.toast('Oferta enviada por WhatsApp', {tipo: 'wa', sub: `${c.nombre} · ${eur(val.oferta)}`});
      App.open.whatsapp(c.id);
    },
    'ta-presupuesto'(el) {
      const t = tasacion(el.dataset.id); if (!t) return;
      const c = db.contact(t.contactId); const vInt = c && c.interes.map(db.veh).find(v => v && v.estado !== 'vendido');
      App.nuevo('presupuesto', {contact: c ? c.id : '', vehicle: vInt ? vInt.id : ''});
    },
    'ta-stock'(el) { const t = tasacion(el.dataset.id); if (t && !t.vehiculoId) pasarAStock(t); }
  }
};

/* cambio de estado compartido (botones del detalle y arrastrar en el tablero) */
App.actions['ta-estado-set'] = (t, estado) => {
  const patch = {estado};
  if (['valorada', 'aceptada'].includes(estado) && !t.valorMercado) { const val = valoracion(t); Object.assign(patch, {valorMercado: val.mercado, oferta: val.recomendada, reacondicionado: val.reacond}); }
  db.updateTasacion(t.id, patch);
  const c = db.contact(t.contactId);
  if (c && ['aceptada', 'rechazada'].includes(estado)) db.addTimeline(c.id, {tipo: 'tasacion', texto: `Tasación del ${t.marca} ${t.modelo} ${estado === 'aceptada' ? 'aceptada' : 'rechazada'} (${eur(t.oferta || patch.oferta || 0)})`});
  const label = C.ESTADOS_TAS[estado].label;
  if (estado === 'aceptada' && !t.vehiculoId) App.toast(`${t.marca} ${t.modelo} · ${label}`, {icon: 'handshake', sub: 'Cuando llegue el coche, pásalo a stock', accion: 'Pasar a stock', onAccion: () => pasarAStock(tasacion(t.id))});
  else App.toast(`${t.marca} ${t.modelo} · ${label}`, {icon: 'scan-line'});
};
})();
