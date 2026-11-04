/* =====================================================================
   Financiación: KPIs, tablero por estado, drawer con documentación y
   consulta simulada a financieras, calculadora y modal de solicitud.
   ===================================================================== */
(function(){
const App = window.App;
const {html, raw, icon, db, C, ui} = App;

const COLS = ['estudio', 'enviada', 'aprobada', 'firmada', 'denegada'];
const COL_UI = {estudio: {c: 'var(--ink-4)', ic: 'hourglass'}, enviada: {c: 'var(--accent)', ic: 'send'}, aprobada: {c: 'var(--green)', ic: 'circle-check'}, firmada: {c: 'var(--ink)', ic: 'file-signature'}, denegada: {c: 'var(--red)', ic: 'circle-x'}};
const ENT = {
  'Santander Consumer': {s: 'SC', c: '#EC0000', tin: 7.49},
  'Cetelem':            {s: 'CT', c: '#00965E', tin: 7.99},
  'BBVA Consumer':      {s: 'BB', c: '#004481', tin: 8.29},
  'Sofinco':            {s: 'SF', c: '#E05206', tin: 8.99},
  'CaixaBank Payments': {s: 'CX', c: '#007EAE', tin: 6.99}
};
const DOCS = [['dni', 'DNI o NIE', 'Por las dos caras'], ['nomina', 'Última nómina', 'O la renta si es autónomo'], ['banco', 'Extracto bancario', 'Últimos 3 meses']];
const PLAZOS = [48, 60, 72, 84, 96];
const first = n => (n || '').split(' ')[0];
const r10 = n => Math.round(n / 10) * 10;
const fins = () => App.S.financings;
const entLogo = (name, size = '') => { const e = ENT[name]; return html`<span class="fi-ent ${size ? 'fi-ent--' + size : ''}" style="--c:${e ? e.c : '#6B7280'}" title="${name}">${e ? e.s : '?'}</span>`; };
const hash = s => { let h = 0; for (const ch of String(s)) h = (h * 31 + ch.charCodeAt(0)) >>> 0; return h; };

const st = {expand: {}, ofertas: {}, openedFor: null};
const calc = {vid: '', precio: 21900, entrada: 3000, plazo: 72, tin: null};

/* ---------- tablero ---------- */
function card(f) {
  const c = db.contact(f.contactId), v = db.veh(f.vehicleId), d = f.docs || {};
  const nd = DOCS.filter(([k]) => d[k]).length;
  return html`<button class="fi-card" data-act="fi-ver" data-id="${f.id}">
    <span class="fi-card__top">${c ? App.avatar(c.nombre, {size: 'sm'}) : ''}<b class="ellipsis">${c ? c.nombre : '—'}</b><span class="fi-card__date">${App.rel(f.fecha)}</span></span>
    ${v ? html`<span class="fi-card__veh"><img src="${ui.img(v)}" alt="" loading="lazy"><span class="ellipsis">${ui.vehNombre(v)} <small>${v.anio}</small></span></span>` : ''}
    <span class="fi-card__amt"><b class="tnum">${App.eur(f.importe)}</b><span class="tnum">${f.plazo} m · <b>${App.eur(f.cuota)}</b>/mes</span></span>
    <span class="fi-card__foot">
      <span class="fi-card__ent">${entLogo(f.entidad, 'sm')}<span class="ellipsis small muted">${ENT[f.entidad] ? f.entidad : 'Sin elegir'}</span></span>
      <span class="fi-docs" title="${nd} de 3 documentos">${DOCS.map(([k, l]) => html`<i class="${d[k] ? 'is-ok' : ''}" title="${l}${d[k] ? ' · recibido' : ' · falta'}">${{dni: 'DNI', nomina: 'Nómina', banco: 'Banco'}[k]}</i>`)}</span>
    </span>
  </button>`;
}
function board() {
  return html`<div class="fi-board" data-tour="fin-board" data-keep-scroll="fi-board">${COLS.map(k => {
    const list = fins().filter(f => f.estado === k), e = C.ESTADOS_FIN[k], max = 4, open = st.expand[k];
    return html`<section class="fi-col fi-col--${k}" style="--cc:${COL_UI[k].c}">
      <header class="fi-col__head"><span class="fi-col__dot"></span><b>${e.label}</b><span class="fi-col__n">${list.length}</span><span class="fi-col__sum tnum">${App.k(App.sum(list, f => f.importe))} €</span></header>
      <div class="fi-col__body">
        ${list.length ? (open ? list : list.slice(0, max)).map(card) : html`<div class="fi-col__empty">${icon(COL_UI[k].ic, 18)}<span>Nada ${k === 'denegada' ? 'denegado' : 'por aquí'}</span></div>`}
        ${list.length > max ? html`<button class="fi-col__more" data-act="fi-expand" data-k="${k}">${open ? 'Ver menos' : `Ver ${list.length - max} más`}</button>` : ''}
      </div>
    </section>`;
  })}</div>`;
}

/* ---------- calculadora ---------- */
function calcOut() {
  const tin = calc.tin == null ? App.S.dealer.tin : calc.tin;
  const cap = Math.max(calc.precio - calc.entrada, 0);
  const rows = PLAZOS.map(p => { const q = App.cuota(cap, tin, p); return {p, q, int: q * p - cap, tot: q * p + calc.entrada}; });
  const sel = rows.find(r => r.p === calc.plazo) || rows[2];
  return html`<div class="fi-calc__res">
      <div class="fi-calc__cuota"><span>Cuota mensual</span><b class="tnum">${App.eur(sel.q)}<small>/mes</small></b><em>${calc.plazo} meses · TIN ${App.dec(tin)} %</em></div>
      <div class="fi-calc__grid">
        <div><span>Importe financiado</span><b class="tnum">${App.eur(cap)}</b></div>
        <div><span>Intereses totales</span><b class="tnum">${App.eur(sel.int)}</b></div>
        <div><span>Precio total a plazos</span><b class="tnum">${App.eur(sel.tot)}</b></div>
        <div><span>Tu comisión (≈2,5 %)</span><b class="tnum green">${App.eur(r10(cap * 0.025))}</b></div>
      </div>
    </div>
    <div class="table-wrap fi-calc__tw"><table class="table fi-calc__table">
      <thead><tr><th>Plazo</th><th class="r">Cuota</th><th class="r">Intereses</th><th class="r">Total a plazos</th></tr></thead>
      <tbody>${rows.map(r => html`<tr class="is-link ${r.p === calc.plazo ? 'is-sel' : ''}" data-act="fi-cplazo" data-v="${r.p}"><td><b>${r.p} meses</b> <span class="muted small">${r.p / 12} años</span></td><td class="r tnum"><b>${App.eur(r.q)}</b></td><td class="r tnum muted">${App.eur(r.int)}</td><td class="r tnum">${App.eur(r.tot)}</td></tr>`)}</tbody>
    </table></div>`;
}
function calculadora() {
  const tin = calc.tin == null ? App.S.dealer.tin : calc.tin;
  const maxE = Math.max(1000, Math.round(calc.precio * 0.6 / 500) * 500);
  return html`<section class="card fi-calc" id="fiCalc" data-tour="fin-calc">
    <div class="card__head"><div><h3>${icon('calculator', 17)}Calculadora de cuotas</h3><p>La misma cuenta que hace la financiera, para dársela al cliente en el momento.</p></div>
      <button class="btn btn--primary btn--sm hide-m" data-act="fi-crear-calc">${icon('plus', 15)}Crear solicitud</button></div>
    <div class="fi-calc__wrap">
      <div class="fi-calc__form">
        <div class="field"><label for="fiCVeh">Coche del stock</label><select class="select" id="fiCVeh" data-act-change="fi-cveh"><option value="">Importe libre</option>${db.stock().filter(v => v.estado !== 'vendido').sort((a, b) => a.marca.localeCompare(b.marca)).map(v => html`<option value="${v.id}" ${calc.vid === v.id ? 'selected' : ''}>${ui.vehNombre(v)} · ${v.anio} · ${App.eur(v.precio)}</option>`)}</select></div>
        <div class="form-grid">
          <div class="field"><label for="fiCPrecio">Precio</label><div class="input-group fi-money"><input class="input tnum" type="number" id="fiCPrecio" value="${calc.precio}" step="100" min="0" data-act-input="fi-cset" data-k="precio"><span class="input-group__suffix">€</span></div></div>
          <div class="field"><label for="fiCTin">TIN</label><div class="input-group fi-money"><input class="input tnum" type="number" id="fiCTin" value="${tin}" step="0.1" min="0" data-act-input="fi-cset" data-k="tin"><span class="input-group__suffix">%</span></div></div>
        </div>
        <div class="field"><div class="between"><label for="fiCEntrada">Entrada</label><b class="tnum" data-live="fi-entrada">${App.eur(calc.entrada)}</b></div>
          <input type="range" class="range" id="fiCEntrada" min="0" max="${maxE}" step="100" value="${calc.entrada}" data-act-input="fi-cset" data-k="entrada">
          <div class="between xs faint"><span>Sin entrada</span><span>${App.eur(maxE)}</span></div></div>
        <div class="field"><label>Plazo</label><div class="seg fi-plazos">${PLAZOS.map(p => html`<button class="${calc.plazo === p ? 'is-on' : ''}" data-act="fi-cplazo" data-v="${p}">${p}</button>`)}</div></div>
        <button class="btn btn--primary btn--block show-m" data-act="fi-crear-calc">${icon('plus', 15)}Crear solicitud con estos datos</button>
      </div>
      <div class="fi-calc__out" data-live="fi-calc">${calcOut()}</div>
    </div>
  </section>`;
}
function entidades() {
  const rows = Object.keys(ENT).map(name => {
    const l = fins().filter(f => f.entidad === name), ok = l.filter(f => ['aprobada', 'firmada'].includes(f.estado)).length, res = l.filter(f => ['aprobada', 'firmada', 'denegada'].includes(f.estado)).length;
    return {name, n: l.length, pct: res ? Math.round(ok / res * 100) : null, imp: App.sum(l.filter(f => ['aprobada', 'firmada'].includes(f.estado)), f => f.importe)};
  }).sort((a, b) => b.imp - a.imp);
  const max = Math.max(...rows.map(r => r.imp), 1);
  return html`<section class="card fi-ents">
    <div class="card__head"><div><h3>${icon('landmark', 17)}Financieras</h3><p>Importe aprobado y tasa de aprobación</p></div></div>
    <div class="card__body stack-sm">${rows.map(r => html`<div class="fi-ents__row">
      ${entLogo(r.name)}
      <div class="grow"><div class="between"><b class="small ink">${r.name}</b><b class="small tnum">${App.eur(r.imp)}</b></div>
        <div class="progress mt-4"><i style="width:${(r.imp / max * 100).toFixed(1)}%;background:${ENT[r.name].c}"></i></div>
        <div class="xs muted mt-4">${r.n} ${r.n === 1 ? 'operación' : 'operaciones'} · ${r.pct == null ? 'sin respuestas' : r.pct + ' % aprobadas'} · TIN desde ${App.dec(ENT[r.name].tin)} %</div></div>
    </div>`)}</div>
  </section>`;
}

/* ---------- vista ---------- */
App.views.financiacion = {
  title: 'Financiación',
  deps: ['financings', 'contacts', 'vehicles'],
  render() {
    const mes = App.startOfMonth(new Date()), L = fins();
    const enMes = f => new Date(f.fecha) >= mes;
    const estudio = L.filter(f => ['estudio', 'enviada'].includes(f.estado));
    const aprobMes = L.filter(f => ['aprobada', 'firmada'].includes(f.estado) && enMes(f));
    const resueltas = L.filter(f => ['aprobada', 'firmada', 'denegada'].includes(f.estado));
    const pct = resueltas.length ? Math.round(resueltas.filter(f => f.estado !== 'denegada').length / resueltas.length * 100) : 0;
    const comision = App.sum(aprobMes, f => f.comision || r10(f.importe * 0.025));
    return html`
      <div class="page-head">
        <div><h1>Financiación</h1><p>Solicitudes a financieras, documentación del cliente y comisiones, todo en un sitio.</p></div>
        <div class="page-head__actions"><button class="btn" data-act="fi-ir-calc">${icon('calculator', 16)}Calculadora</button><button class="btn btn--primary" data-act="fi-nueva">${icon('plus', 16)}Nueva solicitud</button></div>
      </div>
      <div class="kpis fi-kpis">
        ${ui.kpi({label: 'En estudio', value: estudio.length, sub: `${App.eur(App.sum(estudio, f => f.importe))} en juego`, icon: 'hourglass', color: 'var(--amber)'})}
        ${ui.kpi({label: 'Aprobadas este mes', value: aprobMes.length, sub: `${L.filter(f => f.estado === 'firmada' && enMes(f)).length} ya firmadas`, icon: 'circle-check', color: 'var(--green)'})}
        ${ui.kpi({label: 'Tasa de aprobación', value: raw(`${pct}<small>%</small>`), sub: `${resueltas.length} respuestas`, icon: 'percent', color: 'var(--accent)'})}
        ${ui.kpi({label: 'Financiado este mes', value: App.eur(App.sum(aprobMes, f => f.importe)), sub: 'aprobado y firmado', icon: 'banknote', color: 'var(--violet)'})}
        ${ui.kpi({label: 'Comisión generada', value: App.eur(comision), sub: 'de las financieras este mes', icon: 'piggy-bank', color: 'var(--pink)'})}
      </div>
      <div class="between mt-24 mb-12"><h2 class="fi-h2">Solicitudes</h2><span class="small muted hide-m">Toca una tarjeta para ver documentación y consultar a las financieras</span></div>
      ${board()}
      <div class="fi-bottom mt-24">${calculadora()}${entidades()}</div>`;
  },
  mount(root, route) {
    if (route.id && st.openedFor !== route.id) { st.openedFor = route.id; setTimeout(() => ver(route.id), 60); }
    if (!route.id) st.openedFor = null;
  },
  unmount() { st.openedFor = null; },
  actions: {
    'fi-ver'(el) { ver(el.dataset.id); },
    'fi-expand'(el) { st.expand[el.dataset.k] = !st.expand[el.dataset.k]; App.render({keepScroll: true}); },
    'fi-nueva'() { App.modals.nuevaFinanciacion(); },
    'fi-ir-calc'() { App.$('#fiCalc')?.scrollIntoView({behavior: 'smooth', block: 'start'}); },
    'fi-cveh'(el) { calc.vid = el.value; const v = db.veh(el.value); if (v) { calc.precio = v.precio; calc.entrada = Math.min(calc.entrada, Math.round(v.precio * 0.6 / 100) * 100); } App.render({keepScroll: true}); },
    'fi-cset'(el) {
      const val = parseFloat(String(el.value).replace(',', '.')) || 0;
      calc[el.dataset.k] = val;
      if (el.dataset.k === 'precio') calc.vid = '';
      calc.entrada = Math.min(calc.entrada, calc.precio);
      const root = el.closest('.fi-calc');
      root.querySelector('[data-live="fi-calc"]').innerHTML = App.str(calcOut());
      root.querySelector('[data-live="fi-entrada"]').textContent = App.eur(calc.entrada);
      if (el.dataset.k === 'precio') { const r = root.querySelector('#fiCEntrada'), maxE = Math.max(1000, Math.round(calc.precio * 0.6 / 500) * 500); r.max = maxE; r.nextElementSibling.lastElementChild.textContent = App.eur(maxE); root.querySelector('#fiCVeh').value = ''; }
    },
    'fi-cplazo'(el) { calc.plazo = +el.dataset.v; App.render({keepScroll: true}); },
    'fi-crear-calc'() { App.modals.nuevaFinanciacion({vehicle: calc.vid, precio: calc.precio, entrada: calc.entrada, plazo: calc.plazo}); }
  }
};

/* ---------- consulta a financieras (simulada) ---------- */
function simular(f) {
  const h = hash(f.id), pat = ['aprobada', 'aprobada', 'estudio', 'aprobada', 'denegada'];
  const names = Object.keys(ENT);
  return names.map((name, i) => {
    const res = pat[(i + h) % 5];
    const tin = +(ENT[name].tin + ((h >> i) % 3 - 1) * 0.25).toFixed(2);
    return {name, res, tin, cuota: Math.round(App.cuota(f.importe, tin, f.plazo)), delay: 900 + i * 700 + (h >> (i + 2)) % 400,
      msg: res === 'estudio' ? 'Pide la última nómina · responde en 24 h' : res === 'denegada' ? (h % 2 ? 'Endeudamiento por encima del 40 %' : 'Antigüedad laboral insuficiente') : 'Preaprobada al momento'};
  });
}
function ofertasHTML(f) {
  const o = st.ofertas[f.id]; if (!o) return '';
  const now = Date.now();
  const ready = o.rows.filter(r => now - o.t >= r.delay);
  const best = ready.filter(r => r.res === 'aprobada').sort((a, b) => a.cuota - b.cuota)[0];
  const done = ready.length === o.rows.length;
  return html`<div class="fi-offers">
    <div class="between small mb-8"><span class="${done ? 'green semi' : 'muted'}">${done ? html`${icon('circle-check', 14)} ${o.rows.filter(r => r.res === 'aprobada').length} de ${o.rows.length} la aprueban` : html`${icon('refresh-cw', 14, 'spin')} Consultando a ${o.rows.length} financieras…`}</span><span class="xs faint">${ready.length}/${o.rows.length}</span></div>
    ${o.rows.map(r => {
      const ok = now - o.t >= r.delay, chosen = f.entidad === r.name && ['aprobada', 'firmada'].includes(f.estado);
      return html`<div class="fi-offer ${ok ? 'is-' + r.res : 'is-wait'} ${best === r ? 'is-best' : ''} ${chosen ? 'is-chosen' : ''}">
        ${entLogo(r.name)}
        <div class="grow"><b>${r.name}</b>${ok ? html`<span>${r.res === 'aprobada' ? `TIN ${App.dec(r.tin)} % · ${r.msg}` : r.msg}</span>` : html`<span class="fi-offer__skel"><i class="skel"></i></span>`}</div>
        ${!ok ? html`<span class="fi-offer__spin">${icon('refresh-cw', 15, 'spin')}</span>`
          : r.res === 'aprobada' ? html`<div class="fi-offer__right"><b class="tnum">${App.eur(r.cuota)}<small>/mes</small></b>${chosen ? html`<span class="badge badge--green">${icon('check', 12)}Elegida</span>` : html`<button class="btn btn--xs ${best === r ? 'btn--primary' : ''}" data-fd="elegir" data-ent="${r.name}">${best === r ? 'Elegir esta' : 'Elegir'}</button>`}</div>`
          : html`<span class="badge ${r.res === 'estudio' ? 'badge--amber' : 'badge--red'}">${r.res === 'estudio' ? 'En estudio' : 'Denegada'}</span>`}
        ${best === r && ok ? html`<span class="fi-offer__tag">Mejor cuota</span>` : ''}
      </div>`;
    })}
  </div>`;
}

/* ---------- drawer ---------- */
function ver(id) {
  if (!fins().find(x => x.id === id)) return;
  const get = () => fins().find(x => x.id === id);
  const body = () => {
    const f = get(); if (!f) return '';
    const c = db.contact(f.contactId), v = db.veh(f.vehicleId), d = f.docs || {};
    const nd = DOCS.filter(([k]) => d[k]).length;
    const steps = ['estudio', 'enviada', 'aprobada', 'firmada'], idx = steps.indexOf(f.estado);
    return html`<div class="fi-dw">
      <div class="fi-dw__hero">
        <div class="between"><span class="row-sm">${entLogo(f.entidad)}<span class="small semi">${ENT[f.entidad] ? f.entidad : 'Financiera sin elegir'}</span></span>${ui.estado('ESTADOS_FIN', f.estado)}</div>
        <div class="fi-dw__amt"><b class="tnum">${App.eur(f.importe)}</b><span class="tnum">${f.plazo} meses · <b>${App.eur(f.cuota)}/mes</b> · TIN ${App.dec(f.tin)} %</span></div>
        <div class="fi-steps">${steps.map((k, i) => html`<button class="fi-step ${f.estado !== 'denegada' && i <= idx ? 'is-done' : ''} ${k === f.estado ? 'is-cur' : ''}" data-fd="estado" data-v="${k}"><i>${i < idx && f.estado !== 'denegada' ? icon('check', 12) : i + 1}</i><span>${C.ESTADOS_FIN[k].label}</span></button>`)}</div>
        ${f.estado === 'denegada' ? html`<div class="fi-dw__den">${icon('circle-x', 15)}Denegada${f.notas ? ' · ' + f.notas : ''}</div>` : ''}
      </div>

      ${c || v ? html`<div class="fi-dw__sec"><div class="up mb-8">Operación</div>
        ${c ? html`<div class="fi-dw__row is-link" data-fd="contacto">${App.avatar(c.nombre)}<div class="grow"><b>${c.nombre}</b><span>${c.tel} · ${c.ciudad}</span></div>${ui.etapa(c.etapa)}</div>` : ''}
        ${v ? html`<div class="fi-dw__row is-link" data-fd="vehiculo"><img src="${ui.img(v)}" alt=""><div class="grow"><b>${ui.vehNombre(v)}</b><span>${v.version} · ${v.anio}</span></div><b class="tnum">${App.eur(v.precioVenta || v.precio)}</b></div>` : ''}
        <dl class="dl mt-12"><dt>Entrada</dt><dd class="tnum">${App.eur(f.entrada || 0)}</dd><dt>Importe a financiar</dt><dd class="tnum">${App.eur(f.importe)}</dd><dt>Intereses totales</dt><dd class="tnum">${App.eur(f.cuota * f.plazo - f.importe)}</dd><dt>Comisión estimada</dt><dd class="tnum green">${App.eur(f.comision || r10(f.importe * 0.025))}</dd></dl>
      </div>` : ''}

      <div class="fi-dw__sec">
        <div class="between mb-8"><span class="up">Documentación</span><span class="small ${nd === 3 ? 'green semi' : 'muted'}">${nd} de 3</span></div>
        <div class="progress ${nd === 3 ? 'progress--green' : ''} mb-12"><i style="width:${nd / 3 * 100}%"></i></div>
        ${DOCS.map(([k, l, sub]) => html`<div class="fi-doc ${d[k] ? 'is-ok' : ''}"><span class="fi-doc__ico">${icon(d[k] ? 'file-check' : 'file-text', 16)}</span><div class="grow"><b>${l}</b><span>${d[k] ? 'Recibido por WhatsApp' : sub}</span></div><button class="switch switch--sm ${d[k] ? 'is-on' : ''}" data-fd="doc" data-k="${k}" aria-label="${l}"></button></div>`)}
        ${c && nd < 3 ? html`<button class="btn btn--wa btn--sm btn--block mt-12" data-fd="pedir">${icon('message-circle', 15)}Pedir documentación por WhatsApp</button>` : ''}
      </div>

      <div class="fi-dw__sec">
        <div class="between mb-8"><span class="up">Financieras</span>${st.ofertas[f.id] ? html`<button class="link-btn" data-fd="enviar">${icon('refresh-cw', 13)}Volver a consultar</button>` : ''}</div>
        ${st.ofertas[f.id] ? ofertasHTML(f) : html`<div class="fi-send"><div class="fi-send__logos">${Object.keys(ENT).map(n => entLogo(n))}</div><p class="small muted">Manda la operación a las ${Object.keys(ENT).length} financieras a la vez y elige la que mejor cuota dé.</p>
          <button class="btn btn--primary btn--block" data-fd="enviar">${icon('send', 15)}Enviar a las financieras</button></div>`}
      </div>

      <div class="fi-dw__sec"><div class="between mb-8"><span class="up">Notas</span><span class="xs faint" id="fiSaved"></span></div>
        <textarea class="textarea" id="fiNotas" rows="3" placeholder="Avalista, antigüedad laboral, lo que pidió la financiera…">${f.notas || ''}</textarea></div>
    </div>`;
  };
  const f0 = get(), c0 = db.contact(f0.contactId);
  App.drawer({
    width: 480,
    head: html`<div class="row">${c0 ? App.avatar(c0.nombre, {size: 'lg'}) : ''}<div><h2>${c0 ? c0.nombre : 'Financiación'}</h2><p class="small muted">Solicitud del ${App.fecha(f0.fecha)}</p></div></div>`,
    body: body(),
    foot: html`<button class="btn btn--sm ${f0.estado === 'denegada' ? 'hidden' : ''}" data-fd="estado" data-v="denegada" aria-label="Marcar denegada">${icon('circle-x', 15)}<span class="hide-m">Denegada</span></button><span class="grow"></span>${c0 ? html`<button class="btn btn--wa btn--sm" data-fd="wa">${icon('message-circle', 15)}WhatsApp</button>` : ''}<button class="btn btn--primary btn--sm" data-fd="firmar">${icon('file-signature', 15)}Marcar firmada</button>`,
    onClose() { if (location.hash.startsWith('#/financiacion/')) { history.replaceState(null, '', '#/financiacion'); App.route = Object.assign({}, App.route, {id: null, hash: '#/financiacion'}); } },
    onMount(node, close) {
      const bodyEl = node.querySelector('.drawer__body');
      const paint = () => { const s = bodyEl.scrollTop; bodyEl.innerHTML = App.str(body()); bodyEl.scrollTop = s; const den = node.querySelector('.drawer__foot [data-v="denegada"]'), f = get(); if (den && f) den.classList.toggle('hidden', f.estado === 'denegada'); };
      const save = App.debounce(val => { db.updateFinanciacion(id, {notas: val}); const s = node.querySelector('#fiSaved'); if (s) s.textContent = 'Guardado'; }, 500);
      node.addEventListener('input', e => { if (e.target.id === 'fiNotas') { const s = node.querySelector('#fiSaved'); if (s) s.textContent = 'Guardando…'; save(e.target.value); } });
      const setEstado = (estado, extra = {}) => {
        const f = get(), c = db.contact(f.contactId);
        db.updateFinanciacion(id, Object.assign({estado}, extra));
        const lbl = C.ESTADOS_FIN[estado].label;
        if (c) db.addTimeline(c.id, {tipo: 'financiacion', texto: `Financiación ${lbl.toLowerCase()}${ENT[get().entidad] ? ' · ' + get().entidad : ''}`});
        if (estado === 'firmada') App.toast('Financiación firmada', {sub: `Comisión de ${App.eur(get().comision || r10(f.importe * 0.025))} para el concesionario`, icon: 'file-signature'});
        else if (estado === 'denegada') App.toast('Marcada como denegada', {sub: 'Prueba con otra financiera o con avalista', tipo: 'warn', icon: 'circle-x'});
        else App.toast(`Estado: ${lbl}`, {icon: COL_UI[estado].ic});
        paint();
      };
      node.addEventListener('click', e => {
        const b = e.target.closest('[data-fd]'); if (!b) return;
        const f = get(); if (!f) return close();
        const c = db.contact(f.contactId), a = b.dataset.fd;
        if (a === 'contacto') { close(); App.open.contacto(c.id); }
        else if (a === 'vehiculo') { close(); App.open.vehiculo(f.vehicleId); }
        else if (a === 'wa') { close(); App.open.whatsapp(c.id); }
        else if (a === 'estado') { if (b.dataset.v !== f.estado) setEstado(b.dataset.v); }
        else if (a === 'firmar') { if (f.estado !== 'firmada') setEstado('firmada'); }
        else if (a === 'doc') { const docs = Object.assign({}, f.docs, {[b.dataset.k]: !f.docs[b.dataset.k]}); db.updateFinanciacion(id, {docs}); paint(); }
        else if (a === 'pedir') {
          const v = db.veh(f.vehicleId), falta = DOCS.filter(([k]) => !f.docs[k]);
          db.addMessage(c.id, {from: 'ia', ia: true, texto: `Hola ${first(c.nombre)} 👋 Para tramitar la financiación${v ? ' del ' + ui.vehNombre(v) : ''} necesito:\n${falta.map(([, l, s]) => `• ${l} (${s.toLowerCase()})`).join('\n')}\n\nPuedes mandarme fotos por aquí mismo 📸 En cuanto lo tenga, te damos respuesta en el día.`});
          db.addTimeline(c.id, {tipo: 'financiacion', texto: `La IA pidió la documentación por WhatsApp (${falta.length} ${falta.length === 1 ? 'documento' : 'documentos'})`, autor: 'ia'});
          App.toast('Documentación pedida por WhatsApp', {sub: falta.map(x => x[1]).join(', '), tipo: 'wa', accion: 'Ver conversación', onAccion: () => { close(); App.open.whatsapp(c.id); }});
        }
        else if (a === 'enviar') {
          const o = st.ofertas[id] = {t: Date.now(), rows: simular(f)};
          if (f.estado === 'estudio') db.updateFinanciacion(id, {estado: 'enviada'});
          paint();
          o.rows.forEach(r => setTimeout(() => { if (st.ofertas[id] === o && document.body.contains(node)) paint(); }, r.delay + 20));
        }
        else if (a === 'elegir') {
          const o = st.ofertas[id], r = o && o.rows.find(x => x.name === b.dataset.ent); if (!r) return;
          db.updateFinanciacion(id, {entidad: r.name, tin: r.tin, cuota: r.cuota, estado: 'aprobada', comision: r10(f.importe * 0.025)});
          if (c) {
            db.addTimeline(c.id, {tipo: 'financiacion', texto: `Financiación aprobada por ${r.name} · ${App.eur(r.cuota)}/mes a ${f.plazo} meses`});
            db.addMessage(c.id, {from: 'ia', ia: true, texto: `¡Buenas noticias, ${first(c.nombre)}! 🎉 Tu financiación está aprobada: ${App.eur(r.cuota)}/mes a ${f.plazo} meses. ¿Cuándo te viene bien pasar a firmar y ver la entrega?`});
          }
          App.toast(`Aprobada con ${r.name}`, {sub: `${App.eur(r.cuota)}/mes · se lo hemos dicho a ${c ? first(c.nombre) : 'el cliente'} por WhatsApp`, icon: 'circle-check'});
          paint();
        }
      });
    }
  });
}
App.modals.verFinanciacion = o => ver(typeof o === 'string' ? o : o && o.id);

/* ---------- modal nueva solicitud ---------- */
App.modals.nuevaFinanciacion = (opts = {}) => {
  const S = App.S, Pick = App.ventasPick;
  const c0 = db.contact(opts.contact || opts.contactId);
  const v0 = db.veh(opts.vehicle || opts.vehicleId) || (c0 && c0.interes.map(db.veh).find(x => x && x.estado !== 'vendido')) || null;
  const f = {contactId: c0 ? c0.id : null, vehicleId: v0 ? v0.id : null, precio: +opts.precio || (v0 ? v0.precio : 0), entrada: opts.entrada != null && opts.entrada !== '' ? +opts.entrada : null, plazo: +opts.plazo || 72, entidad: 'todas', err: ''};
  if (f.entrada == null) f.entrada = Math.min(3000, Math.round(f.precio * 0.2 / 100) * 100);
  const tin = () => ENT[f.entidad] ? ENT[f.entidad].tin : S.dealer.tin;
  const cuota = () => Math.round(App.cuota(Math.max(f.precio - f.entrada, 0), tin(), f.plazo));
  const out = () => html`<div class="fi-nm__cuota"><span>Cuota orientativa</span><b class="tnum">${App.eur(cuota())}<small>/mes</small></b><em>Financia ${App.eur(Math.max(f.precio - f.entrada, 0))} · TIN ${App.dec(tin())} %</em></div>`;
  const body = () => {
    const maxE = Math.max(1000, Math.round(f.precio * 0.6 / 500) * 500);
    return html`<div class="stack fi-nm">
      <div class="field"><label>Cliente</label>${Pick.html({kind: 'contact', id: f.contactId})}</div>
      <div class="field"><label>Coche</label>${Pick.html({kind: 'vehicle', id: f.vehicleId})}</div>
      <div class="form-grid">
        <div class="field"><label for="nfPrecio">Precio</label><div class="input-group fi-money"><input class="input tnum" type="number" id="nfPrecio" value="${f.precio}" step="100" min="0"><span class="input-group__suffix">€</span></div></div>
        <div class="field"><label for="nfEnt">Financiera</label><select class="select" id="nfEnt"><option value="todas" ${f.entidad === 'todas' ? 'selected' : ''}>Consultar a todas</option>${Object.keys(ENT).map(n => html`<option value="${n}" ${f.entidad === n ? 'selected' : ''}>${n}</option>`)}</select></div>
      </div>
      <div class="field"><div class="between"><label for="nfEntrada">Entrada</label><b class="tnum" id="nfEntradaV">${App.eur(f.entrada)}</b></div><input type="range" class="range" id="nfEntrada" min="0" max="${maxE}" step="100" value="${Math.min(f.entrada, maxE)}"></div>
      <div class="field"><label>Plazo</label><div class="seg fi-plazos">${PLAZOS.map(p => html`<button type="button" class="${f.plazo === p ? 'is-on' : ''}" data-nf="plazo" data-v="${p}">${p} meses</button>`)}</div></div>
      <div id="nfOut">${out()}</div>
      ${f.err ? html`<div class="ag-nc__err">${icon('alert-triangle', 15)}${f.err}</div>` : ''}
    </div>`;
  };
  App.modal({
    title: 'Nueva solicitud de financiación', sub: 'Queda en estudio y la puedes mandar a las financieras', size: 'lg',
    body: body(),
    foot: html`<button class="btn" data-close>Cancelar</button><button class="btn btn--primary" id="nfOk">${icon('check', 16)}Crear solicitud</button>`,
    onMount(node, close) {
      const bodyEl = node.querySelector('.modal__body');
      const paint = () => { const s = bodyEl.scrollTop; bodyEl.innerHTML = App.str(body()); bodyEl.scrollTop = s; };
      const liveOut = () => { node.querySelector('#nfOut').innerHTML = App.str(out()); node.querySelector('#nfEntradaV').textContent = App.eur(f.entrada); };
      Pick.bind(node, () => ({
        onSelect(kind, pid, o = {}) {
          if (kind === 'contact') { f.contactId = pid; const c = db.contact(pid); if (c && !f.vehicleId) { const v = c.interes.map(db.veh).find(x => x && x.estado !== 'vendido'); if (v) { f.vehicleId = v.id; f.precio = v.precio; } } }
          else { f.vehicleId = pid; const v = db.veh(pid); if (v) f.precio = v.precio; }
          if (f.entrada > f.precio * 0.6 || (!f.entrada && f.precio)) f.entrada = Math.min(3000, Math.round(f.precio * 0.2 / 100) * 100);
          f.err = ''; paint();
          if (o.focus) setTimeout(() => node.querySelector(`.ag-pk[data-pk="${kind}"] .ag-pk__in`)?.focus(), 30);
        }
      }));
      node.addEventListener('input', e => {
        if (e.target.id === 'nfPrecio') { f.precio = +e.target.value || 0; f.entrada = Math.min(f.entrada, f.precio); liveOut(); }
        if (e.target.id === 'nfEntrada') { f.entrada = +e.target.value; liveOut(); }
      });
      node.addEventListener('change', e => { if (e.target.id === 'nfEnt') { f.entidad = e.target.value; liveOut(); } if (e.target.id === 'nfPrecio') paint(); });
      node.addEventListener('click', e => { const b = e.target.closest('[data-nf]'); if (!b) return; e.preventDefault(); f.plazo = +b.dataset.v; paint(); });
      node.querySelector('#nfOk').onclick = () => {
        if (!f.contactId) { f.err = 'Elige el cliente.'; return paint(); }
        if (f.precio <= f.entrada) { f.err = 'La entrada no puede cubrir todo el precio.'; return paint(); }
        const importe = f.precio - f.entrada;
        const nf = db.addFinanciacion({contactId: f.contactId, vehicleId: f.vehicleId, entidad: f.entidad === 'todas' ? 'Por elegir' : f.entidad, importe, entrada: f.entrada, plazo: f.plazo, tin: tin(), cuota: cuota(), comision: r10(importe * 0.025), docs: {dni: false, nomina: false, banco: false}});
        const c = db.contact(f.contactId);
        db.addTimeline(c.id, {tipo: 'financiacion', texto: `Solicitud de financiación: ${App.eur(importe)} a ${f.plazo} meses (${App.eur(cuota())}/mes)`});
        if (!c.financiar) db.updateContact(c.id, {financiar: true});
        close();
        App.toast('Solicitud creada', {sub: `${c.nombre} · ${App.eur(importe)} a ${f.plazo} meses`, icon: 'landmark', accion: 'Ver solicitud', onAccion: () => { if (App.route && App.route.name === 'financiacion') ver(nf.id); else App.go('#/financiacion/' + nf.id); }});
      };
    }
  });
};
})();
