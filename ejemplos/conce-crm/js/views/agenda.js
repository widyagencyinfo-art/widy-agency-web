/* =====================================================================
   Agenda: semana / día / mes / lista, arrastrar para mover, drawer de
   cita, sincronización con Google Calendar y modal «Nueva cita».
   También define App.ventasPick (buscador de cliente / coche) que usan
   presupuestos y financiación.
   ===================================================================== */
(function(){
const App = window.App;
const {html, raw, icon, db, C, ui} = App;

const H0 = 9, H1 = 21, HPX = 60;              // horas visibles y px por hora
const DUR = {prueba: 45, visita: 45, entrega: 45, tasacion: 30, firma: 45, taller: 90, llamada: 15};
const PLU = {prueba: ['prueba', 'pruebas'], visita: ['visita', 'visitas'], entrega: ['entrega', 'entregas'], tasacion: ['tasación', 'tasaciones'], firma: ['firma', 'firmas'], taller: ['taller', 'taller'], llamada: ['llamada', 'llamadas']};
const EST_ICO = {confirmada: 'circle-check', pendiente: 'clock-3', hecha: 'check-check', no_vino: 'circle-x', cancelada: 'ban'};
const isM = () => window.matchMedia('(max-width:900px)').matches;
const p2 = n => String(n).padStart(2, '0');
const ymd = d => { d = new Date(d); return d.getFullYear() + '-' + p2(d.getMonth() + 1) + '-' + p2(d.getDate()); };
const fromYmd = (s, min = 0) => { const [y, m, d] = s.split('-').map(Number); const x = new Date(y, m - 1, d); x.setMinutes(min); return x; };
const minOf = d => { d = new Date(d); return d.getHours() * 60 + d.getMinutes(); };
const hm = min => Math.floor(min / 60) + ':' + p2(min % 60);
const first = n => (n || '').split(' ')[0];

/* =====================================================================
   Buscador compartido de cliente / coche (App.ventasPick)
   ===================================================================== */
const Pick = App.ventasPick = {
  search(kind, q) {
    q = App.norm(q).trim(); const w = q.split(/\s+/).filter(Boolean);
    const hit = s => { s = App.norm(s); return w.every(x => s.includes(x)); };
    if (kind === 'contact') {
      const all = App.S.contacts.slice().sort((a, b) => (b.ultimoContacto || '').localeCompare(a.ultimoContacto || ''));
      return (q ? all.filter(c => hit(`${c.nombre} ${c.tel} ${c.email} ${c.ciudad}`)) : all.filter(c => !['vendido','perdido'].includes(c.etapa))).slice(0, 6);
    }
    const st = db.stock().slice().sort((a, b) => (b.destacado - a.destacado) || b.precio - a.precio);
    return (q ? st.filter(v => hit(`${v.marca} ${v.modelo} ${v.version} ${v.matricula} ${v.anio} ${v.color}`)) : st).slice(0, 6);
  },
  html({kind, id, placeholder, create = false, label}) {
    const sel = id ? (kind === 'contact' ? db.contact(id) : db.veh(id)) : null;
    if (sel && kind === 'contact') return html`<div class="ag-pk ag-pk--sel" data-pk="${kind}">
      ${App.avatar(sel.nombre)}<div class="grow"><b class="ellipsis">${sel.nombre}</b><span class="ellipsis">${sel.tel}${sel.ciudad ? ' · ' + sel.ciudad : ''}</span></div>
      ${ui.etapa(sel.etapa)}<button type="button" class="link-btn ag-pk__change">Cambiar</button></div>`;
    if (sel) return html`<div class="ag-pk ag-pk--sel" data-pk="${kind}">
      ${ui.thumb(sel, 'thumb--sm')}<div class="grow"><b class="ellipsis">${ui.vehNombre(sel)} <span class="ag-pk__ver">${sel.version}</span></b><span class="ellipsis">${sel.matricula} · ${sel.anio} · ${App.km(sel.km)} · <b class="ink">${App.eur(sel.precio)}</b></span></div>
      <button type="button" class="link-btn ag-pk__change">Cambiar</button></div>`;
    return html`<div class="ag-pk" data-pk="${kind}" data-create="${create ? 1 : ''}">
      <div class="input-group">${icon(kind === 'contact' ? 'user' : 'car', 16)}<input class="input ag-pk__in" autocomplete="off" placeholder="${placeholder || (kind === 'contact' ? 'Busca por nombre o teléfono…' : 'Busca marca, modelo o matrícula…')}" aria-label="${label || placeholder || ''}"></div>
      <div class="ag-pk__list" role="listbox"></div></div>`;
  },
  list(pk, q) {
    const kind = pk.dataset.pk, res = Pick.search(kind, q), box = pk.querySelector('.ag-pk__list');
    const rows = res.map((x, i) => kind === 'contact'
      ? html`<button type="button" class="ag-pk__item ${i === 0 ? 'is-focus' : ''}" data-pid="${x.id}">${App.avatar(x.nombre, {size: 'sm'})}<span class="grow"><b>${x.nombre}</b><span>${x.tel} · ${x.ciudad}</span></span>${ui.etapa(x.etapa, {dot: false})}</button>`
      : html`<button type="button" class="ag-pk__item ${i === 0 ? 'is-focus' : ''}" data-pid="${x.id}">${ui.thumb(x, 'thumb--sm')}<span class="grow"><b>${ui.vehNombre(x)} <small>${x.version}</small></b><span>${x.matricula} · ${x.anio} · ${App.km(x.km)}${x.estado !== 'disponible' ? ' · ' + C.ESTADOS_VEH[x.estado].label : ''}</span></span><b class="tnum nowrap">${App.eur(x.precio)}</b></button>`);
    const head = html`<div class="ag-pk__head">${q.trim() ? (res.length ? 'Resultados' : 'Sin resultados') : (kind === 'contact' ? 'Clientes recientes' : 'Coches en stock')}</div>`;
    const crear = pk.dataset.create && kind === 'contact' ? html`<button type="button" class="ag-pk__item ag-pk__new" data-pnew="1">${icon('user-plus', 16)}<span class="grow"><b>${q.trim() ? `Crear «${q.trim()}» como cliente nuevo` : 'Crear un cliente nuevo'}</b><span>Solo nombre y teléfono</span></span></button>` : '';
    box.innerHTML = App.str(html`${head}${rows}${crear}`);
    pk.classList.add('is-open');
  },
  /* bind(root, () => ({onSelect(kind, id), onCreate(texto)})) — delegación, se puede llamar varias veces */
  bind(root, getOpts) {
    root.__pkOpts = getOpts;
    if (root.__pk) return; root.__pk = true;
    const opts = () => (root.__pkOpts && root.__pkOpts()) || {};
    root.addEventListener('focusin', e => { const inp = e.target.closest('.ag-pk__in'); if (inp) Pick.list(inp.closest('.ag-pk'), inp.value); });
    root.addEventListener('input', e => { const inp = e.target.closest('.ag-pk__in'); if (inp) Pick.list(inp.closest('.ag-pk'), inp.value); });
    root.addEventListener('focusout', e => { const inp = e.target.closest('.ag-pk__in'); if (inp) setTimeout(() => inp.closest('.ag-pk')?.classList.remove('is-open'), 160); });
    root.addEventListener('keydown', e => {
      const inp = e.target.closest('.ag-pk__in'); if (!inp) return;
      const pk = inp.closest('.ag-pk'), items = [...pk.querySelectorAll('.ag-pk__item')]; if (!items.length) return;
      let i = items.findIndex(x => x.classList.contains('is-focus'));
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); i = App.clamp(i + (e.key === 'ArrowDown' ? 1 : -1), 0, items.length - 1); items.forEach((x, k) => x.classList.toggle('is-focus', k === i)); items[i].scrollIntoView({block: 'nearest'}); }
      else if (e.key === 'Enter') { e.preventDefault(); (items[i] || items[0]).dispatchEvent(new MouseEvent('pointerdown', {bubbles: true})); }
      else if (e.key === 'Escape') { e.stopPropagation(); pk.classList.remove('is-open'); inp.blur(); }
    });
    root.addEventListener('pointerdown', e => {
      const it = e.target.closest('.ag-pk__item'); if (!it) return;
      e.preventDefault();
      const pk = it.closest('.ag-pk'), o = opts();
      if (it.dataset.pnew) o.onCreate && o.onCreate(pk.querySelector('.ag-pk__in').value.trim());
      else o.onSelect && o.onSelect(pk.dataset.pk, it.dataset.pid);
    });
    root.addEventListener('click', e => {
      const ch = e.target.closest('.ag-pk__change'); if (!ch) return;
      e.preventDefault(); const o = opts(); o.onSelect && o.onSelect(ch.closest('.ag-pk').dataset.pk, null, {focus: true});
    });
  }
};

/* =====================================================================
   Estado de la vista
   ===================================================================== */
const st = {cur: App.today(), users: new Set(), tipos: new Set(), syncing: false, lastSync: Date.now() - 3 * 6e4, flash: null, drag: null, justDragged: 0, mq: null, ro: null};
App.agendaIr = (fecha, evId) => { st.cur = new Date(fecha); st.cur.setHours(0, 0, 0, 0); if (evId) st.flash = evId; };

const pref = () => App.S.prefs.vistaAgenda || 'semana';
const vista = () => { const v = pref(); return isM() && v === 'semana' ? 'dia' : v; };
const filtrados = () => App.S.events.filter(e => e.estado !== 'cancelada' && (!st.users.size || st.users.has(e.userId)) && (!st.tipos.size || st.tipos.has(e.tipo)));
const delDia = (evs, d) => evs.filter(e => App.sameDay(e.inicio, d)).sort((a, b) => a.inicio.localeCompare(b.inicio));

function semanaDias(evs) {
  const s = App.startOfWeek(st.cur);
  const dias = Array.from({length: 6}, (_, i) => App.addDays(s, i));
  const dom = App.addDays(s, 6);
  if (delDia(evs, dom).length) dias.push(dom);
  return dias;
}
function titulo(v) {
  const c = st.cur, y = new Date().getFullYear();
  if (v === 'dia') return html`${App.cap(App.DIAS[c.getDay()])} ${c.getDate()} ${App.MESES_C[c.getMonth()]} <span>${c.getFullYear()}</span>`;
  if (v === 'mes') return html`${App.cap(App.MESES[c.getMonth()])} <span>${c.getFullYear()}</span>`;
  const a = v === 'semana' ? App.startOfWeek(c) : c, b = App.addDays(a, v === 'semana' ? semanaDias(filtrados()).length - 1 : 13);
  const txt = a.getMonth() === b.getMonth() ? `${a.getDate()} – ${b.getDate()} ${App.MESES_C[b.getMonth()]}` : `${a.getDate()} ${App.MESES_C[a.getMonth()]} – ${b.getDate()} ${App.MESES_C[b.getMonth()]}`;
  return html`${txt} <span>${b.getFullYear()}</span>`;
}

/* layout de solapes: columnas por grupo de citas que se pisan */
function layout(evs) {
  const items = evs.map(e => ({e, s: minOf(e.inicio), f: Math.max(minOf(e.fin), minOf(e.inicio) + 15)})).sort((a, b) => a.s - b.s || b.f - a.f);
  let group = [], end = -1;
  const flush = () => { const cols = []; group.forEach(it => { let k = cols.findIndex(f => f <= it.s); if (k < 0) { k = cols.length; cols.push(0); } cols[k] = it.f; it.col = k; }); group.forEach(it => it.n = cols.length); group = []; };
  items.forEach(it => { if (it.s >= end) { flush(); end = it.f; } else end = Math.max(end, it.f); group.push(it); });
  flush();
  return items;
}

/* =====================================================================
   Piezas de render
   ===================================================================== */
function evBlock(it) {
  const {e} = it, t = C.TIPOS_EV[e.tipo] || C.TIPOS_EV.visita, c = db.contact(e.contactId), v = db.veh(e.vehicleId);
  const top = (App.clamp(it.s, H0 * 60, H1 * 60) - H0 * 60) / 60 * HPX;
  const h = Math.max((App.clamp(it.f, H0 * 60 + 15, H1 * 60) - App.clamp(it.s, H0 * 60, H1 * 60)) / 60 * HPX - 2, 20);
  const size = h < 36 ? 'xs' : h < 56 ? 'sm' : 'md';
  const w = 100 / it.n;
  return html`<div class="ag-ev ag-ev--${size} is-${e.estado} ${e.origen === 'ia' && size !== 'xs' ? 'has-ia' : ''} ${st.flash === e.id ? 'flash' : ''}" data-ev="${e.id}" style="--c:${t.color};top:${top}px;height:${h}px;left:calc(${w * it.col}% + 1px);width:calc(${w}% - 3px)" title="${e.titulo}">
    ${v && size === 'md' ? html`<img class="ag-ev__img" src="${ui.img(v)}" alt="" loading="lazy" draggable="false">` : ''}
    <div class="ag-ev__txt">
      <b class="ag-ev__t">${size === 'xs' ? html`<span class="ag-ev__time">${App.hora(e.inicio)}</span> ` : ''}${e.titulo}</b>
      ${size !== 'xs' ? html`<span class="ag-ev__s"><span class="ag-ev__time">${App.hora(e.inicio)}</span>${c ? ' · ' + first(c.nombre) + ' ' + (c.nombre.split(' ')[1] || '') : ''}</span>` : ''}
    </div>
    <span class="ag-ev__st" title="${C.ESTADOS_EV[e.estado].label}">${e.origen === 'ia' && size !== 'xs' ? html`<i class="ag-ev__ia">${icon('sparkles', 10)}</i>` : ''}${icon(EST_ICO[e.estado] || 'circle', 13)}</span>
  </div>`;
}
function hoursCol() {
  return html`<div class="ag-hours">${Array.from({length: H1 - H0}, (_, i) => html`<div class="ag-hours__h"><span>${H0 + i}:00</span></div>`)}</div>`;
}
function dayCol(d, evs) {
  const today = App.isToday(d), nowM = minOf(new Date());
  return html`<div class="ag-col ${today ? 'is-today' : ''} ${d.getDay() === 0 ? 'is-sun' : ''}" data-day="${ymd(d)}">
    ${layout(delDia(evs, d)).map(evBlock)}
    ${today && nowM >= H0 * 60 && nowM <= H1 * 60 ? html`<div class="ag-now" style="top:${(nowM - H0 * 60) / 60 * HPX}px"></div>` : ''}
  </div>`;
}
function dayHead(d, evs, {click = true} = {}) {
  const n = delDia(evs, d).length;
  return html`<button class="ag-dh ${App.isToday(d) ? 'is-today' : ''}" ${click ? raw(`data-act="ag-dia" data-fecha="${ymd(d)}"`) : ''}>
    <span class="ag-dh__d">${App.DIAS_C[d.getDay()]}</span><b class="ag-dh__n">${d.getDate()}</b><span class="ag-dh__c">${n ? n + (n === 1 ? ' cita' : ' citas') : 'Libre'}</span></button>`;
}
function grid(dias, evs, {heads = true} = {}) {
  return html`<div class="ag-grid" style="--days:${dias.length};--hpx:${HPX}px">
    ${heads ? html`<div class="ag-grid__head"><div class="ag-grid__tz">GMT+2</div>${dias.map(d => dayHead(d, evs))}</div>` : ''}
    <div class="ag-grid__scroll" data-keep-scroll="ag-grid">
      <div class="ag-grid__body">${hoursCol()}${dias.map(d => dayCol(d, evs))}</div>
    </div>
  </div>`;
}
function evRow(e, {fecha = false} = {}) {
  const t = C.TIPOS_EV[e.tipo], c = db.contact(e.contactId), v = db.veh(e.vehicleId), u = db.user(e.userId);
  return html`<button class="ag-row is-${e.estado} ${st.flash === e.id ? 'flash' : ''}" data-act="ag-ver" data-id="${e.id}" style="--c:${t.color}">
    <span class="ag-row__time tnum"><b>${App.hora(e.inicio)}</b><span>${App.hora(e.fin)}</span></span>
    <span class="ag-row__bar"></span>
    <span class="ag-row__main"><b class="ellipsis">${e.titulo}</b><span class="ellipsis">${icon(t.icon, 13)} ${c ? c.nombre : t.label}${fecha ? ' · ' + App.fecha(e.inicio) : ''}</span></span>
    ${v ? html`<img class="ag-row__img" src="${ui.img(v)}" alt="" loading="lazy">` : html`<span class="ag-row__img ag-row__img--none"></span>`}
    ${u ? App.avatar(u.nombre, {size: 'sm', color: u.color}) : ''}
    <span class="ag-row__st">${ui.estado('ESTADOS_EV', e.estado)}</span>
  </button>`;
}

function vSemana(evs) { return grid(semanaDias(evs), evs); }
function vDia(evs) {
  const d = st.cur, list = delDia(evs, d), s = App.startOfWeek(d);
  const strip = html`<div class="ag-strip show-m">${Array.from({length: 7}, (_, i) => App.addDays(s, i)).map(x => {
    const n = delDia(evs, x).length;
    return html`<button class="ag-strip__d ${App.sameDay(x, d) ? 'is-on' : ''} ${App.isToday(x) ? 'is-today' : ''}" data-act="ag-dia" data-fecha="${ymd(x)}"><span>${App.DIAS_C[x.getDay()]}</span><b>${x.getDate()}</b><i>${Array.from({length: Math.min(n, 3)}, () => raw('<em></em>'))}</i></button>`;
  })}</div>`;
  const tipos = App.groupBy(list, e => e.tipo);
  return html`${strip}<div class="ag-day">
    <div class="ag-day__cal">${grid([d], evs, {heads: !isM()})}</div>
    <aside class="ag-day__side hide-m">
      <div class="ag-side__head"><h3>${App.diaRel(d)}</h3><p>${list.length ? `${list.length} ${list.length === 1 ? 'cita' : 'citas'} · ${list.filter(e => !['hecha', 'no_vino'].includes(e.estado)).length} pendientes` : 'Sin citas'}</p>
        ${list.length ? html`<div class="ag-side__tipos">${Object.entries(tipos).map(([k, a]) => html`<span style="--c:${C.TIPOS_EV[k].color}"><i></i>${a.length} ${PLU[k][a.length === 1 ? 0 : 1]}</span>`)}</div>` : ''}</div>
      ${list.length ? html`<div class="ag-side__list">${list.map(e => evRow(e))}</div>` : ui.empty('calendar-days', 'Día libre', 'Haz clic en una hora para crear una cita.', html`<button class="btn btn--sm" data-act="ag-nueva" data-fecha="${ymd(d)}">${icon('plus', 15)}Nueva cita</button>`)}
    </aside>
  </div>`;
}
function vMes(evs) {
  const m0 = App.startOfMonth(st.cur), g0 = App.startOfWeek(m0);
  const dim = new Date(m0.getFullYear(), m0.getMonth() + 1, 0).getDate();
  const weeks = Math.ceil((App.daysBetween(g0, m0) + dim) / 7);
  const days = Array.from({length: weeks * 7}, (_, i) => App.addDays(g0, i));
  const mob = isM();
  const sel = delDia(evs, st.cur);
  return html`<div class="ag-month" style="--weeks:${weeks}">
    <div class="ag-month__head">${['lun','mar','mié','jue','vie','sáb','dom'].map(d => html`<div>${d}</div>`)}</div>
    <div class="ag-month__grid">${days.map(d => {
      const l = delDia(evs, d), out = d.getMonth() !== m0.getMonth(), max = 3;
      return html`<div class="ag-mc ${out ? 'is-out' : ''} ${App.isToday(d) ? 'is-today' : ''} ${mob && App.sameDay(d, st.cur) ? 'is-sel' : ''}" data-act="${mob ? 'ag-sel' : 'ag-dia'}" data-fecha="${ymd(d)}">
        <span class="ag-mc__n">${d.getDate()}</span>
        ${mob ? html`<span class="ag-mc__dots">${l.slice(0, 4).map(e => html`<i style="--c:${C.TIPOS_EV[e.tipo].color}"></i>`)}</span>`
          : html`${l.slice(0, l.length > max ? max - 1 : max).map(e => html`<button class="ag-chip is-${e.estado}" data-act="ag-ver" data-id="${e.id}" style="--c:${C.TIPOS_EV[e.tipo].color}"><i></i><span class="tnum">${App.hora(e.inicio)}</span> ${e.titulo}</button>`)}
            ${l.length > max ? html`<span class="ag-mc__more">+${l.length - max + 1} más</span>` : ''}`}
      </div>`;
    })}</div>
  </div>
  ${mob ? html`<div class="ag-mlist"><div class="ag-list__day"><b>${App.diaRel(st.cur)}</b><span>${sel.length ? sel.length + (sel.length === 1 ? ' cita' : ' citas') : 'Sin citas'}</span></div>${sel.map(e => evRow(e))}</div>` : ''}`;
}
function vLista(evs) {
  const a = App.today() > st.cur ? st.cur : st.cur, dias = Array.from({length: 14}, (_, i) => App.addDays(a, i));
  const grupos = dias.map(d => [d, delDia(evs, d)]).filter(([, l]) => l.length);
  if (!grupos.length) return ui.empty('calendar-days', 'Sin citas en estas dos semanas', 'Crea una cita o cambia los filtros.', html`<button class="btn btn--sm" data-act="ag-nueva">${icon('plus', 15)}Nueva cita</button>`);
  return html`<div class="ag-list">${grupos.map(([d, l]) => html`<section class="ag-list__g">
    <div class="ag-list__day ${App.isToday(d) ? 'is-today' : ''}"><b>${App.diaRel(d)}</b><span>${App.diaRel(d).includes(' ') ? '' : App.fechaLarga(d) + ' · '}${l.length} ${l.length === 1 ? 'cita' : 'citas'}</span></div>
    ${l.map(e => evRow(e))}</section>`)}</div>`;
}

function syncTxt() { const m = Math.round((Date.now() - st.lastSync) / 6e4); return m < 1 ? 'sincronizado ahora' : `sincronizado · hace ${m} min`; }

/* =====================================================================
   Vista
   ===================================================================== */
App.views.agenda = {
  title: 'Agenda',
  full: true,
  deps: ['events'],
  render(route) {
    if (route.query.fecha) { st.cur = fromYmd(route.query.fecha); }
    const v = vista(), evs = filtrados(), S = App.S;
    const hoyN = delDia(evs, new Date()).filter(e => !['hecha', 'no_vino'].includes(e.estado)).length;
    const semN = semanaDias(evs).reduce((n, d) => n + delDia(evs, d).length, 0);
    const users = S.users.filter(u => S.events.some(e => e.userId === u.id));
    const tiposUsados = Object.keys(C.TIPOS_EV);
    const segs = [['dia', 'Día', 'calendar'], ['semana', 'Semana', 'columns-3'], ['mes', 'Mes', 'layout-grid'], ['lista', 'Lista', 'list']];
    const body = v === 'semana' ? vSemana(evs) : v === 'dia' ? vDia(evs) : v === 'mes' ? vMes(evs) : vLista(evs);
    return html`<div class="ag ag--${v}">
      <div class="ag-bar">
        <div class="ag-bar__nav">
          <button class="btn btn--sm" data-act="ag-hoy">Hoy</button>
          <div class="ag-arrows"><button class="icon-btn" data-act="ag-mover" data-dir="-1" aria-label="Anterior">${icon('chevron-left', 18)}</button><button class="icon-btn" data-act="ag-mover" data-dir="1" aria-label="Siguiente">${icon('chevron-right', 18)}</button></div>
          <h1 class="ag-title">${titulo(v)}</h1>
          <button class="btn btn--soft btn--icon show-m ag-add-m" data-act="ag-nueva" aria-label="Nueva cita">${icon('calendar-plus', 18)}</button>
        </div>
        <div class="ag-bar__right">
          <div class="seg ag-seg">${segs.map(([id, l, ic]) => html`<button class="${v === id ? 'is-on' : ''} ${id === 'semana' ? 'hide-m' : ''}" data-act="ag-vista" data-v="${id}">${icon(ic, 14)}${l}</button>`)}</div>
          <div class="ag-gcal" data-tour="agenda-gcal">
            <span class="ag-gcal__logo" aria-hidden="true"><i></i><b>${new Date().getDate()}</b></span>
            <span class="ag-gcal__txt"><b>Google Calendar</b><small><span class="live-dot"></span><span class="ag-gcal__st">${syncTxt()}</span></small></span>
            <button class="btn btn--xs ag-gcal__btn" data-act="ag-sync" title="Sincronizar ahora">${icon('refresh-cw', 13, st.syncing ? 'spin' : '')}<span class="hide-m">Sincronizar</span></button>
          </div>
          <button class="btn btn--primary hide-m" data-act="ag-nueva">${icon('plus', 16)}Nueva cita</button>
        </div>
      </div>
      <div class="ag-filters">
        <div class="ag-people" role="group" aria-label="Filtrar por persona">
          ${users.map(u => html`<button class="ag-person ${st.users.has(u.id) ? 'is-on' : ''} ${st.users.size && !st.users.has(u.id) ? 'is-dim' : ''}" data-act="ag-user" data-id="${u.id}" title="${u.nombre} · ${u.rol}">${App.avatar(u.nombre, {size: 'sm', color: u.color})}<span>${first(u.nombre)}</span></button>`)}
        </div>
        <span class="ag-filters__sep hide-m"></span>
        <div class="ag-tipos">${tiposUsados.map(k => { const t = C.TIPOS_EV[k]; return html`<button class="ag-tchip ${st.tipos.has(k) ? 'is-on' : ''} ${st.tipos.size && !st.tipos.has(k) ? 'is-dim' : ''}" data-act="ag-tipo" data-id="${k}" style="--c:${t.color}"><i></i>${t.short}</button>`; })}</div>
        ${st.users.size || st.tipos.size ? html`<button class="link-btn ag-clear" data-act="ag-limpiar">${icon('x', 13)}Quitar filtros</button>` : ''}
        <span class="ag-count hide-m">${semN} ${semN === 1 ? 'cita' : 'citas'} esta semana · <b>${hoyN} pendientes hoy</b></span>
      </div>
      <div class="ag-cal card" data-tour="agenda-cal">${body}</div>
    </div>`;
  },
  mount(root, route) {
    const scroll = root.querySelector('.ag-grid__scroll');
    if (scroll && !scroll.dataset.init && !App.$('[data-keep-scroll]') ) scroll.scrollTop = 0;
    if (!st.mq) { st.mq = window.matchMedia('(max-width:900px)'); st.mq.addEventListener('change', () => { if (App.currentView === App.views.agenda) App.render({keepScroll: true}); }); }
    if (st.flash) { const el = root.querySelector(`[data-ev="${st.flash}"], .ag-row[data-id="${st.flash}"]`); if (el) setTimeout(() => el.scrollIntoView({block: 'center', behavior: 'smooth'}), 60); setTimeout(() => { st.flash = null; }, 1800); }
    if (route.id && !st.openedFor) { st.openedFor = route.id; setTimeout(() => verCita(route.id), 50); }
    if (!route.id) st.openedFor = null;
    bindGrid(root);
  },
  unmount() { st.drag = null; st.openedFor = null; },
  actions: {
    'ag-hoy'() { st.cur = App.today(); App.render({keepScroll: true}); },
    'ag-mover'(el) {
      const d = +el.dataset.dir, v = vista(), c = new Date(st.cur);
      if (v === 'dia') { c.setDate(c.getDate() + d); if (c.getDay() === 0 && !delDia(filtrados(), c).length) c.setDate(c.getDate() + d); }
      else if (v === 'semana') c.setDate(c.getDate() + 7 * d);
      else if (v === 'mes') { c.setDate(1); c.setMonth(c.getMonth() + d); }
      else c.setDate(c.getDate() + 14 * d);
      st.cur = c; App.render({keepScroll: true});
    },
    'ag-vista'(el) { App.S.prefs.vistaAgenda = el.dataset.v; App.store.save(); App.render({keepScroll: true}); },
    'ag-dia'(el) { st.cur = fromYmd(el.dataset.fecha); App.S.prefs.vistaAgenda = 'dia'; App.store.save(); App.render({keepScroll: true}); },
    'ag-sel'(el) { st.cur = fromYmd(el.dataset.fecha); App.render({keepScroll: true}); },
    'ag-user'(el) { const id = el.dataset.id; st.users.has(id) ? st.users.delete(id) : st.users.add(id); App.render({keepScroll: true}); },
    'ag-tipo'(el) { const id = el.dataset.id; st.tipos.has(id) ? st.tipos.delete(id) : st.tipos.add(id); App.render({keepScroll: true}); },
    'ag-limpiar'() { st.users.clear(); st.tipos.clear(); App.render({keepScroll: true}); },
    'ag-ver'(el) { verCita(el.dataset.id); },
    'ag-nueva'(el) {
      const o = {};
      if (st.users.size === 1) o.user = [...st.users][0];
      if (el.dataset.fecha) o.inicio = fromYmd(el.dataset.fecha, 10 * 60).toISOString();
      else if (!App.isToday(st.cur) && st.cur > App.today()) o.inicio = new Date(new Date(st.cur).setHours(10, 0, 0, 0)).toISOString();
      App.modals.nuevaCita(o);
    },
    'ag-sync'(el) {
      if (st.syncing) return;
      st.syncing = true;
      const box = el.closest('.ag-gcal'); box.classList.add('is-syncing');
      el.querySelector('.i')?.classList.add('spin'); box.querySelector('.ag-gcal__st').textContent = 'sincronizando…';
      setTimeout(() => {
        st.syncing = false; st.lastSync = Date.now();
        const n = App.S.events.filter(e => e.gcal && new Date(e.inicio) >= App.today()).length;
        if (document.body.contains(box)) { box.classList.remove('is-syncing'); el.querySelector('.i')?.classList.remove('spin'); box.querySelector('.ag-gcal__st').textContent = syncTxt(); }
        App.toast('Google Calendar sincronizado', {sub: `${n} citas próximas al día en los calendarios del equipo`, icon: 'cloud-check'});
      }, 1500);
    }
  }
};

/* ---------- arrastrar, clic en hueco, fantasma al pasar ---------- */
function bindGrid(root) {
  const body = root.querySelector('.ag-grid__body'); if (!body) return;
  const ghost = App.el('<div class="ag-ghost"><span></span></div>');
  const minAt = (col, y) => { const r = col.getBoundingClientRect(); return App.clamp(Math.floor((y - r.top) / HPX * 2) * 30 + H0 * 60, H0 * 60, H1 * 60 - 30); };

  body.addEventListener('pointermove', e => {
    if (st.drag) return dragMove(e);
    if (e.pointerType !== 'mouse') return;
    const col = e.target.closest('.ag-col');
    if (!col || e.target.closest('.ag-ev')) { ghost.remove(); return; }
    const m = minAt(col, e.clientY);
    if (ghost.parentNode !== col) col.appendChild(ghost);
    ghost.style.top = (m - H0 * 60) / 60 * HPX + 'px';
    ghost.firstChild.textContent = '+ ' + hm(m);
  });
  body.addEventListener('pointerleave', () => ghost.remove());
  body.addEventListener('click', e => {
    if (Date.now() - st.justDragged < 300) return;
    const evEl = e.target.closest('.ag-ev');
    if (evEl) return verCita(evEl.dataset.ev);
    const col = e.target.closest('.ag-col'); if (!col) return;
    const m = minAt(col, e.clientY);
    const o = {inicio: fromYmd(col.dataset.day, m).toISOString()};
    if (st.users.size === 1) o.user = [...st.users][0];
    App.modals.nuevaCita(o);
  });
  body.addEventListener('pointerdown', e => {
    const evEl = e.target.closest('.ag-ev'); if (!evEl || e.button) return;
    const ev = db.event(evEl.dataset.ev); if (!ev) return;
    const d = st.drag = {evEl, ev, x: e.clientX, y: e.clientY, top: parseFloat(evEl.style.top), h: evEl.offsetHeight, id: e.pointerId, armed: e.pointerType === 'mouse', moving: false, col: evEl.parentNode, body};
    if (!d.armed) d.timer = setTimeout(() => { d.armed = true; evEl.classList.add('is-lift'); navigator.vibrate && navigator.vibrate(8); }, 320);
  });
  const end = e => {
    const d = st.drag; if (!d) return;
    clearTimeout(d.timer); st.drag = null;
    if (!d.moving) { d.evEl.classList.remove('is-lift'); return; }
    st.justDragged = Date.now();
    const durMin = Math.round((new Date(d.ev.fin) - new Date(d.ev.inicio)) / 6e4) || 45;
    const ini = fromYmd(d.col.dataset.day, d.min), fin = App.addMin(ini, durMin);
    if (ini.getTime() === new Date(d.ev.inicio).getTime()) { App.render({keepScroll: true}); return; }
    db.updateEvent(d.ev.id, {inicio: ini.toISOString(), fin: fin.toISOString()});
    avisoCambio(d.ev);
    App.toast(`Movida a ${App.diaRel(ini).toLowerCase()} a las ${App.hora(ini)}`, {sub: d.ev.contactId ? 'Se avisa al cliente por WhatsApp' : 'Actualizada también en Google Calendar', tipo: d.ev.contactId ? 'wa' : 'ok', icon: 'calendar-check'});
  };
  body.addEventListener('pointerup', end);
  body.addEventListener('pointercancel', e => { const d = st.drag; if (d && !d.moving) { clearTimeout(d.timer); st.drag = null; d.evEl.classList.remove('is-lift'); } else end(e); });
  body.addEventListener('touchmove', e => { if (st.drag && st.drag.armed) e.preventDefault(); }, {passive: false});
  body.addEventListener('contextmenu', e => { if (e.target.closest('.ag-ev')) e.preventDefault(); });

  function dragMove(e) {
    const d = st.drag, dx = e.clientX - d.x, dy = e.clientY - d.y;
    if (!d.moving) {
      if (Math.hypot(dx, dy) < 5) return;
      if (!d.armed) { clearTimeout(d.timer); st.drag = null; return; }
      d.moving = true; ghost.remove();
      try { d.evEl.setPointerCapture(d.id); } catch (err) {}
      d.evEl.classList.add('is-drag');
      d.dur = Math.round((new Date(d.ev.fin) - new Date(d.ev.inicio)) / 6e4) || 45;
    }
    e.preventDefault();
    const cols = [...d.body.querySelectorAll('.ag-col')];
    let col = cols.find(c => { const r = c.getBoundingClientRect(); return e.clientX >= r.left && e.clientX < r.right; });
    if (!col) col = e.clientX < cols[0].getBoundingClientRect().left ? cols[0] : cols[cols.length - 1];
    if (col !== d.col) { col.appendChild(d.evEl); d.col = col; }
    const startMin = minOf(d.ev.inicio);
    let m = Math.round((startMin + dy / HPX * 60) / 15) * 15;
    m = App.clamp(m, H0 * 60, H1 * 60 - Math.min(d.dur, 60));
    d.min = m;
    Object.assign(d.evEl.style, {top: (m - H0 * 60) / 60 * HPX + 'px', left: '1px', width: 'calc(100% - 3px)'});
    const t = d.evEl.querySelectorAll('.ag-ev__time'); t.forEach(x => x.textContent = hm(m) + '–' + hm(m + d.dur));
  }
}

/* mensaje de la IA al cliente cuando cambia la hora */
function avisoCambio(e) {
  const c = db.contact(e.contactId); if (!c) return;
  const v = db.veh(e.vehicleId), t = C.TIPOS_EV[e.tipo];
  const ev = db.event(e.id) || e;
  db.addMessage(c.id, {from: 'ia', ia: true, auto: 'recordatorio', texto: `Hola ${first(c.nombre)} 👋 Te escribimos de ${App.S.dealer.nombre}: tu ${t.label.toLowerCase()}${v ? ' del ' + ui.vehNombre(v) : ''} pasa al ${App.fechaLarga(ev.inicio)} a las ${App.hora(ev.inicio)}. Si no te viene bien, contéstanos por aquí y te buscamos otro hueco.`});
  db.addTimeline(c.id, {tipo: 'cita', texto: `Cita reprogramada: ${App.diaRel(ev.inicio)} a las ${App.hora(ev.inicio)} · aviso por WhatsApp`});
}

/* =====================================================================
   Drawer de cita
   ===================================================================== */
function recordatorioTxt(e) {
  const h = (new Date(e.inicio) - Date.now()) / 36e5;
  const a = h <= 24 ? html`<span class="green">enviado 24 h antes ${icon('check', 13)}</span>` : html`<span>programado 24 h antes</span>`;
  const b = h <= 2 ? html`<span class="green">enviado 2 h antes ${icon('check', 13)}</span>` : html`<span>programado 2 h antes</span>`;
  return html`${a}<span class="faint"> · </span>${b}`;
}
function verCita(id) {
  const e0 = db.event(id); if (!e0) return;
  let resched = false;
  const body = () => {
    const e = db.event(id); if (!e) return '';
    const t = C.TIPOS_EV[e.tipo], c = db.contact(e.contactId), v = db.veh(e.vehicleId), u = db.user(e.userId);
    const dur = Math.round((new Date(e.fin) - new Date(e.inicio)) / 6e4);
    const estados = [['confirmada', 'Confirmar', 'circle-check'], ['hecha', 'Hecha', 'check-check'], ['no_vino', 'No vino', 'circle-x'], ['cancelada', 'Cancelar', 'ban']];
    return html`<div class="ag-dw" style="--c:${t.color}">
      <div class="ag-dw__hero">
        <div class="between"><span class="ag-dw__tipo">${icon(t.icon, 14)}${t.label}</span>${ui.estado('ESTADOS_EV', e.estado)}</div>
        <h2>${e.titulo}</h2>
        <div class="ag-dw__when">${icon('calendar-days', 15)}<span><b>${App.cap(App.fechaLarga(e.inicio))}</b> · ${App.hora(e.inicio)} – ${App.hora(e.fin)} <span class="muted">(${dur} min)</span></span>
          ${resched ? '' : html`<button class="link-btn" data-dw="resched">${icon('pencil', 13)}Reprogramar</button>`}</div>
        ${resched ? html`<div class="ag-dw__resched fade-in">
          <input type="date" class="input input--sm" id="dwFecha" value="${ymd(e.inicio)}">
          <select class="select select--sm" id="dwHora">${Array.from({length: (H1 - H0) * 4}, (_, i) => H0 * 60 + i * 15).map(m => html`<option value="${m}" ${m === minOf(e.inicio) ? 'selected' : ''}>${hm(m)}</option>`)}</select>
          <button class="btn btn--sm btn--primary" data-dw="resched-ok">Guardar</button><button class="btn btn--sm btn--ghost btn--icon" data-dw="resched-no" aria-label="Cancelar" title="Cancelar">${icon('x', 15)}</button>
        </div>` : ''}
        <div class="row wrap mt-12">
          ${e.origen === 'ia' ? ui.ia('Agendada por la IA') : html`<span class="badge">${icon('user', 12)}Creada a mano</span>`}
          ${e.gcal ? html`<span class="badge badge--outline ag-dw__gc">${icon('cloud-check', 13)}En Google Calendar</span>` : html`<button class="btn btn--xs" data-dw="gcal">${icon('calendar-plus', 13)}Añadir a Google Calendar</button>`}
        </div>
      </div>

      <div class="ag-dw__sec">
        <div class="up mb-8">Estado</div>
        <div class="ag-dw__states">${estados.map(([k, l, ic]) => html`<button class="ag-st ag-st--${k} ${e.estado === k ? 'is-on' : ''}" data-dw="estado" data-v="${k}">${icon(ic, 15)}${e.estado === 'confirmada' && k === 'confirmada' ? 'Confirmada' : l}</button>`)}</div>
      </div>

      ${c ? html`<div class="ag-dw__sec"><div class="up mb-8">Cliente</div>
        <div class="ag-dw__card is-link" data-dw="contacto">
          ${App.avatar(c.nombre, {size: 'lg'})}
          <div class="grow"><b>${c.nombre}</b><span>${c.tel} · ${c.ciudad}</span><div class="row-sm mt-4">${ui.etapa(c.etapa)}${ui.temp(c.temperatura)}</div></div>
          ${icon('chevron-right', 18, 'faint')}
        </div></div>` : ''}

      ${v ? html`<div class="ag-dw__sec"><div class="up mb-8">Coche</div>
        <div class="ag-dw__car is-link" data-dw="vehiculo">
          <img src="${ui.img(v, 's')}" alt="${ui.vehNombre(v)}">
          <div class="grow"><b>${ui.vehNombre(v)}</b><span class="ellipsis">${v.version}</span><span>${v.anio} · ${App.km(v.km)} · ${v.matricula}</span>
            <div class="between mt-4"><b class="ag-dw__price">${App.eur(v.precio)}</b>${ui.vehEstado(v.estado)}</div></div>
        </div></div>` : ''}

      <div class="ag-dw__sec"><div class="up mb-8">Atiende</div>
        <div class="ag-dw__users">${App.S.users.map(x => html`<button class="ag-uopt ${x.id === e.userId ? 'is-on' : ''}" data-dw="user" data-v="${x.id}" title="${x.nombre}">${App.avatar(x.nombre, {size: 'sm', color: x.color})}<span>${first(x.nombre)}</span></button>`)}</div>
      </div>

      <div class="ag-dw__sec"><div class="up mb-8">Avisos</div>
        <div class="ag-dw__rem">
          <span class="ag-dw__remico ag-dw__remico--wa">${icon('message-circle', 15)}</span>
          <div class="grow"><b>Recordatorio por WhatsApp</b><div class="small">${e.recordatorio && c ? recordatorioTxt(e) : html`<span class="muted">${c ? 'Desactivado' : 'Sin cliente asociado'}</span>`}</div></div>
          ${c ? html`<button class="switch switch--sm ${e.recordatorio ? 'is-on' : ''}" data-dw="rec" aria-label="Recordatorio"></button>` : ''}
        </div>
        <div class="ag-dw__rem">
          <span class="ag-dw__remico ag-dw__remico--gc">${icon('calendar-check', 15)}</span>
          <div class="grow"><b>Google Calendar</b><div class="small muted">${e.gcal ? `En el calendario de ${u ? first(u.nombre) : 'el equipo'} · invitación al cliente` : 'No sincronizada'}</div></div>
          <button class="switch switch--sm ${e.gcal ? 'is-on' : ''}" data-dw="gcal" aria-label="Google Calendar"></button>
        </div>
      </div>

      <div class="ag-dw__sec"><div class="between mb-8"><span class="up">Notas</span><span class="xs faint" id="dwSaved"></span></div>
        <textarea class="textarea" id="dwNotas" rows="3" placeholder="Qué hay que tener preparado, qué busca el cliente…">${e.notas || ''}</textarea>
      </div>
    </div>`;
  };
  const e = e0, c = db.contact(e.contactId);
  App.drawer({
    width: 460,
    head: html`<div class="row"><span class="ag-dw__hico" style="--c:${C.TIPOS_EV[e.tipo].color}">${icon(C.TIPOS_EV[e.tipo].icon, 16)}</span><div><h2>Cita</h2><p class="small muted">${e.origen === 'ia' ? 'Agendada por el asistente de WhatsApp' : 'Agenda del concesionario'}</p></div></div>`,
    body: body(),
    foot: html`<button class="btn btn--danger btn--sm" data-dw="borrar">${icon('trash-2', 15)}Eliminar</button><span class="grow"></span>
      ${c ? html`<button class="btn btn--sm" data-dw="llamar">${icon('phone', 15)}<span class="hide-xs">Llamar</span></button><button class="btn btn--wa btn--sm" data-dw="wa">${icon('message-circle', 15)}WhatsApp</button>` : html`<button class="btn btn--sm" data-close>Cerrar</button>`}`,
    onMount(node, close) {
      const bodyEl = node.querySelector('.drawer__body');
      const paint = () => { const s = bodyEl.scrollTop; if (!db.event(id)) return close(); bodyEl.innerHTML = App.str(body()); bodyEl.scrollTop = s; };
      const save = App.debounce(val => { db.updateEvent(id, {notas: val}); const s = node.querySelector('#dwSaved'); if (s) s.textContent = 'Guardado'; }, 500);
      node.addEventListener('input', ev => { if (ev.target.id === 'dwNotas') { const s = node.querySelector('#dwSaved'); if (s) s.textContent = 'Guardando…'; save(ev.target.value); } });
      node.addEventListener('click', async ev => {
        const b = ev.target.closest('[data-dw]'); if (!b) return;
        const e = db.event(id); if (!e) return close();
        const c = db.contact(e.contactId), a = b.dataset.dw;
        if (a === 'contacto') { close(); App.open.contacto(c.id); }
        else if (a === 'vehiculo') { close(); App.open.vehiculo(e.vehicleId); }
        else if (a === 'wa') { close(); App.open.whatsapp(c.id); }
        else if (a === 'llamar') App.actions.llamar({dataset: {id: c.id}});
        else if (a === 'resched') { resched = true; paint(); }
        else if (a === 'resched-no') { resched = false; paint(); }
        else if (a === 'resched-ok') {
          const f = node.querySelector('#dwFecha').value, m = +node.querySelector('#dwHora').value;
          if (!f) return;
          const dur = new Date(e.fin) - new Date(e.inicio), ini = fromYmd(f, m);
          resched = false;
          if (ini.getTime() !== new Date(e.inicio).getTime()) {
            db.updateEvent(id, {inicio: ini.toISOString(), fin: new Date(ini.getTime() + dur).toISOString()});
            avisoCambio(e); st.cur = App.today() <= ini || true ? new Date(new Date(ini).setHours(0, 0, 0, 0)) : st.cur; st.flash = id;
            App.render({keepScroll: true});
            App.toast(`Reprogramada: ${App.diaRel(ini).toLowerCase()} a las ${App.hora(ini)}`, {sub: c ? 'Se avisa al cliente por WhatsApp' : 'Actualizada en Google Calendar', tipo: c ? 'wa' : 'ok', icon: 'calendar-check'});
          }
          paint();
        }
        else if (a === 'estado') {
          const nuevo = b.dataset.v, antes = e.estado;
          if (nuevo === antes) return;
          db.updateEvent(id, {estado: nuevo});
          if (nuevo === 'cancelada') {
            close();
            App.toast('Cita cancelada', {sub: c ? `Se avisa a ${first(c.nombre)} y se quita de Google Calendar` : 'Quitada de Google Calendar', icon: 'ban', tipo: 'info', accion: 'Deshacer', onAccion: () => { db.updateEvent(id, {estado: antes}); App.toast('Cita recuperada'); }});
            if (c) db.addTimeline(c.id, {tipo: 'cita', texto: `Cita cancelada: ${e.titulo}`});
            return;
          }
          if (nuevo === 'hecha') {
            App.toast('Cita marcada como hecha', {sub: e.tipo === 'prueba' && c ? 'La IA le escribirá mañana para saber qué le pareció' : e.titulo});
            if (c && e.tipo === 'prueba' && ['nuevo', 'contactado', 'cita'].includes(c.etapa)) db.setEtapa(c.id, 'prueba', {silencioso: true});
            if (c) db.addTimeline(c.id, {tipo: 'cita', texto: `${C.TIPOS_EV[e.tipo].label} hecha`});
          } else if (nuevo === 'no_vino') {
            if (c) {
              db.addMessage(c.id, {from: 'ia', ia: true, auto: 'seguimiento48h', texto: `Hola ${first(c.nombre)}, te esperábamos hoy a las ${App.hora(e.inicio)} 🙂 ¿Te ha surgido algo? Si quieres te buscamos otro hueco esta semana, dime qué día te viene mejor.`});
              db.addTimeline(c.id, {tipo: 'cita', texto: 'No vino a la cita · la IA le ha escrito para reagendar'});
            }
            App.toast('Marcada como «No vino»', {sub: c ? 'La IA le ha escrito por WhatsApp para buscar otro hueco' : e.titulo, tipo: c ? 'wa' : 'warn', icon: 'circle-x', accion: c ? 'Ver conversación' : '', onAccion: () => { close(); App.open.whatsapp(c.id); }});
          } else {
            App.toast('Cita confirmada', {sub: c ? `${first(c.nombre)} recibe la confirmación por WhatsApp` : e.titulo, icon: 'circle-check'});
          }
          paint();
        }
        else if (a === 'user') { const u = db.user(b.dataset.v); db.updateEvent(id, {userId: u.id}); App.toast(`Ahora la atiende ${first(u.nombre)}`, {sub: 'Se ha movido a su Google Calendar', icon: 'user-check'}); paint(); }
        else if (a === 'rec') { db.updateEvent(id, {recordatorio: !e.recordatorio}); paint(); }
        else if (a === 'gcal') { db.updateEvent(id, {gcal: !e.gcal}); App.toast(!e.gcal ? 'Añadida a Google Calendar' : 'Quitada de Google Calendar', {icon: 'calendar-check'}); paint(); }
        else if (a === 'borrar') {
          if (await App.confirm({title: '¿Eliminar esta cita?', text: 'Se borra de la agenda y de Google Calendar. Si solo no va a venir, mejor márcala como cancelada.', ok: 'Eliminar', danger: true})) {
            db.removeEvent(id); close(); App.toast('Cita eliminada', {sub: e.titulo, icon: 'trash-2', tipo: 'info'});
          }
        }
      });
    }
  });
}
App.modals.verCita = o => verCita(typeof o === 'string' ? o : (o && (o.id || o.evento)));

/* =====================================================================
   Modal «Nueva cita»
   ===================================================================== */
App.modals.nuevaCita = (opts = {}) => {
  const S = App.S;
  const cont = db.contact(opts.contact || opts.contactId);
  const tipo = C.TIPOS_EV[opts.tipo] ? opts.tipo : 'prueba';
  const veh = db.veh(opts.vehicle || opts.vehicleId) || (cont && cont.interes.map(db.veh).find(v => v && v.estado !== 'vendido')) || null;
  const f = {
    tipo, contactId: cont ? cont.id : null, vehicleId: veh ? veh.id : null, dur: DUR[tipo],
    userId: opts.user || (cont && ['u2', 'u3'].includes(cont.asignado) ? cont.asignado : 'u2'),
    fecha: null, min: null, notas: '', wa: true, rec: true, gcal: !!S.integraciones.gcal, nuevo: null, err: ''
  };
  // fecha y hora iniciales
  let ini = opts.inicio ? new Date(opts.inicio) : null;
  if (!ini || isNaN(ini)) { ini = new Date(); const m = Math.ceil((minOf(ini) + 30) / 30) * 30; if (m > (H1 - 1) * 60) { ini = App.addDays(App.today(), 1); ini.setHours(10, 0, 0, 0); } else ini.setHours(0, m, 0, 0); if (ini.getDay() === 0) { ini = App.addDays(ini, 1); ini.setHours(10, 0, 0, 0); } }
  f.fecha = ymd(ini); f.min = App.clamp(Math.floor(minOf(ini) / 30) * 30, H0 * 60, H1 * 60 - 30);

  const busy = (uid, fecha, min, dur) => S.events.some(e => e.userId === uid && e.estado !== 'cancelada' && App.sameDay(e.inicio, fromYmd(fecha)) && minOf(e.inicio) < min + dur && Math.max(minOf(e.fin), minOf(e.inicio) + 15) > min);
  const past = (fecha, min) => fromYmd(fecha, min) < new Date();
  const slots = () => Array.from({length: (H1 - H0) * 2}, (_, i) => H0 * 60 + i * 30);
  const libre = (m) => !busy(f.userId, f.fecha, m, f.dur) && !past(f.fecha, m);
  const ajusta = () => {
    if (libre(f.min)) return;
    if (opts.inicio && !opts.user) { const otro = ['u2', 'u3', 'u1'].find(u => u !== f.userId && !busy(u, f.fecha, f.min, f.dur) && !past(f.fecha, f.min)); if (otro) { f.userId = otro; return; } }
    const ok = slots().filter(libre).sort((a, b) => Math.abs(a - f.min) - Math.abs(b - f.min))[0];
    if (ok != null) f.min = ok;
  };
  ajusta();

  const needsClient = () => !['taller', 'llamada'].includes(f.tipo);
  const resumen = () => { const d = fromYmd(f.fecha, f.min), u = db.user(f.userId); return `${App.cap(App.DIAS_C[d.getDay()])} ${d.getDate()} ${App.MESES_C[d.getMonth()]} · ${hm(f.min)}–${hm(f.min + f.dur)} · ${u ? first(u.nombre) : ''}`; };

  const body = () => {
    const libres = slots().filter(libre).length;
    const clientBox = f.nuevo
      ? html`<div class="ag-nc__new fade-in"><div class="form-grid"><div class="field"><label>Nombre</label><input class="input" id="ncNom" value="${f.nuevo.nombre}" placeholder="Nombre y apellidos"></div><div class="field"><label>Teléfono</label><input class="input" id="ncTel" type="tel" inputmode="tel" value="${f.nuevo.tel}" placeholder="600 00 00 00"></div></div><button type="button" class="link-btn mt-8" data-nc="sin-nuevo">${icon('x', 13)}Buscar un cliente existente</button></div>`
      : Pick.html({kind: 'contact', id: f.contactId, create: true});
    return html`<div class="ag-nc">
      <div class="ag-nc__tipos" role="radiogroup" aria-label="Tipo de cita">${Object.entries(C.TIPOS_EV).map(([k, t]) => html`<button type="button" class="ag-nc__tipo ${f.tipo === k ? 'is-on' : ''}" data-nc="tipo" data-v="${k}" style="--c:${t.color}">${icon(t.icon, 18)}<span>${t.short}</span></button>`)}</div>
      <div class="ag-nc__cols">
        <div class="stack">
          <div class="field"><label>Cliente ${needsClient() ? '' : html`<span class="faint">(opcional)</span>`}</label>${clientBox}</div>
          <div class="field"><label>Coche ${['prueba', 'entrega'].includes(f.tipo) ? '' : html`<span class="faint">(opcional)</span>`}</label>${Pick.html({kind: 'vehicle', id: f.vehicleId})}</div>
          <div class="field"><label>Atiende</label><div class="ag-dw__users">${S.users.map(x => html`<button type="button" class="ag-uopt ${x.id === f.userId ? 'is-on' : ''}" data-nc="user" data-v="${x.id}" title="${x.nombre} · ${x.rol}">${App.avatar(x.nombre, {size: 'sm', color: x.color})}<span>${first(x.nombre)}</span></button>`)}</div></div>
          <div class="field"><label for="ncNotas">Notas</label><textarea class="textarea" id="ncNotas" rows="2" placeholder="Traer DNI y nómina, cargar la batería…">${f.notas}</textarea></div>
        </div>
        <div class="stack">
          <div class="form-grid">
            <div class="field"><label for="ncFecha">Fecha</label><input class="input" type="date" id="ncFecha" value="${f.fecha}" min="${ymd(new Date())}"></div>
            <div class="field"><label for="ncDur">Duración</label><select class="select" id="ncDur">${[15, 30, 45, 60, 90, 120].map(m => html`<option value="${m}" ${m === f.dur ? 'selected' : ''}>${m < 60 ? m + ' min' : (m / 60) + (m === 60 ? ' hora' : ' horas').replace('1.5', '1,5')}</option>`)}</select></div>
          </div>
          <div class="field"><div class="between"><label>Hora</label><span class="xs faint">${libres ? `${libres} huecos libres de ${first(db.user(f.userId).nombre)}` : 'Sin huecos libres este día'}</span></div>
            <div class="ag-nc__slots">${slots().map(m => { const b = busy(f.userId, f.fecha, m, f.dur), p = past(f.fecha, m); return html`<button type="button" class="ag-slot ${m === f.min ? 'is-on' : ''} ${b ? 'is-busy' : ''}" data-nc="hora" data-v="${m}" ${b || p ? 'disabled' : ''} title="${b ? 'Ocupado' : p ? 'Ya ha pasado' : ''}">${hm(m)}</button>`; })}</div>
          </div>
        </div>
      </div>
      <div class="ag-nc__toggles">
        <label class="ag-tg"><span class="ag-tg__ico ag-tg__ico--wa">${icon('message-circle', 15)}</span><span class="grow"><b>Confirmar por WhatsApp</b><span>Le llega la cita con la dirección</span></span><button type="button" class="switch ${f.wa ? 'is-on' : ''}" data-nc="wa" aria-label="Confirmar por WhatsApp"></button></label>
        <label class="ag-tg"><span class="ag-tg__ico">${icon('bell-ring', 15)}</span><span class="grow"><b>Recordatorio 24 h y 2 h antes</b><span>Si no confirma, avisa al comercial</span></span><button type="button" class="switch ${f.rec ? 'is-on' : ''}" data-nc="rec" aria-label="Recordatorio"></button></label>
        <label class="ag-tg"><span class="ag-tg__ico ag-tg__ico--gc">${icon('calendar-check', 15)}</span><span class="grow"><b>Añadir a Google Calendar</b><span>En el calendario de quien atiende</span></span><button type="button" class="switch ${f.gcal ? 'is-on' : ''}" data-nc="gcal" aria-label="Google Calendar"></button></label>
      </div>
      ${f.err ? html`<div class="ag-nc__err fade-in">${icon('alert-triangle', 15)}${f.err}</div>` : ''}
    </div>`;
  };

  App.modal({
    title: 'Nueva cita', sub: 'Se guarda en la agenda y en Google Calendar', size: 'xl', cls: 'ag-ncm',
    body: body(),
    foot: html`<span class="spacer small muted ag-nc__sum hide-m">${icon('calendar-days', 14)} <span id="ncSum">${resumen()}</span></span><button class="btn" data-close>Cancelar</button><button class="btn btn--primary" id="ncOk">${icon('check', 16)}Guardar cita</button>`,
    onMount(node, close) {
      const bodyEl = node.querySelector('.modal__body');
      const paint = () => { const s = bodyEl.scrollTop; bodyEl.innerHTML = App.str(body()); bodyEl.scrollTop = s; const sum = node.querySelector('#ncSum'); if (sum) sum.textContent = resumen(); };
      Pick.bind(node, () => ({
        onSelect(kind, pid, o = {}) {
          if (kind === 'contact') { f.contactId = pid; f.err = ''; const c = db.contact(pid); if (c && !f.vehicleId) { const v = c.interes.map(db.veh).find(x => x && x.estado !== 'vendido'); if (v) f.vehicleId = v.id; } if (c && ['u2', 'u3'].includes(c.asignado) && !opts.user) { f.userId = c.asignado; ajusta(); } }
          else f.vehicleId = pid;
          paint();
          if (o.focus) setTimeout(() => node.querySelector(`.ag-pk[data-pk="${kind}"] .ag-pk__in`)?.focus(), 30);
        },
        onCreate(q) { const tel = /^[\d\s+]+$/.test(q); f.nuevo = {nombre: tel ? '' : q, tel: tel ? q : ''}; f.contactId = null; paint(); setTimeout(() => node.querySelector(tel || !q ? '#ncNom' : '#ncTel')?.focus(), 30); }
      }));
      node.addEventListener('input', e => {
        if (e.target.id === 'ncNotas') f.notas = e.target.value;
        if (e.target.id === 'ncNom' && f.nuevo) f.nuevo.nombre = e.target.value;
        if (e.target.id === 'ncTel' && f.nuevo) f.nuevo.tel = e.target.value;
      });
      node.addEventListener('change', e => {
        if (e.target.id === 'ncFecha' && e.target.value) { f.fecha = e.target.value; ajusta(); paint(); }
        if (e.target.id === 'ncDur') { f.dur = +e.target.value; ajusta(); paint(); }
      });
      node.addEventListener('click', e => {
        const b = e.target.closest('[data-nc]'); if (!b) return;
        e.preventDefault();
        const a = b.dataset.nc;
        if (a === 'tipo') { f.tipo = b.dataset.v; f.dur = DUR[f.tipo]; ajusta(); if (f.tipo === 'taller' && !opts.user) f.userId = 'u5'; f.err = ''; }
        else if (a === 'user') { f.userId = b.dataset.v; ajusta(); }
        else if (a === 'hora') f.min = +b.dataset.v;
        else if (['wa', 'rec', 'gcal'].includes(a)) f[a] = !f[a];
        else if (a === 'sin-nuevo') f.nuevo = null;
        paint();
      });
      node.querySelector('#ncOk').onclick = () => {
        if (f.nuevo) {
          if (!f.nuevo.nombre.trim() || f.nuevo.tel.replace(/\D/g, '').length < 9) { f.err = 'Pon el nombre y un teléfono de 9 cifras del cliente nuevo.'; return paint(); }
        } else if (needsClient() && !f.contactId) { f.err = 'Elige el cliente (o crea uno nuevo con nombre y teléfono).'; paint(); return setTimeout(() => node.querySelector('.ag-pk[data-pk="contact"] .ag-pk__in')?.focus(), 30); }
        if (!libre(f.min)) { f.err = 'Esa hora ya no está libre. Elige otro hueco.'; return paint(); }
        let cid = f.contactId;
        if (f.nuevo) {
          const c = db.addContact({nombre: f.nuevo.nombre.trim().replace(/\s+/g, ' '), tel: App.telFmt(f.nuevo.tel) || f.nuevo.tel, origen: 'telefono', asignado: ['u2', 'u3'].includes(f.userId) ? f.userId : 'u2', interes: f.vehicleId ? [f.vehicleId] : []});
          cid = c.id;
        }
        const ini = fromYmd(f.fecha, f.min), fin = App.addMin(ini, f.dur);
        const ev = db.addEvent({tipo: f.tipo, contactId: cid, vehicleId: f.vehicleId, userId: f.userId, inicio: ini.toISOString(), fin: fin.toISOString(), estado: f.wa && cid ? 'confirmada' : 'pendiente', gcal: f.gcal, recordatorio: f.rec && !!cid, origen: 'manual', notas: f.notas.trim()});
        const c = db.contact(cid), v = db.veh(f.vehicleId), u = db.user(f.userId), t = C.TIPOS_EV[f.tipo];
        if (f.wa && c) {
          db.addMessage(c.id, {from: 'ia', ia: true, auto: 'recordatorio', texto: `Hola ${first(c.nombre)} 👋 Te confirmo tu ${t.label.toLowerCase()}${v ? ' del ' + ui.vehNombre(v) : ''} el ${App.fechaLarga(ini)} a las ${App.hora(ini)}.\n📍 ${S.dealer.direccion}\nTe atenderá ${first(u.nombre)}. Si necesitas cambiar la hora, contesta a este mensaje.`});
        }
        close();
        st.cur = new Date(new Date(ini).setHours(0, 0, 0, 0)); st.flash = ev.id;
        if (App.currentView === App.views.agenda) App.render({keepScroll: true});
        App.toast('Cita creada', {sub: `${t.short} · ${App.diaRel(ini)} a las ${App.hora(ini)}${f.wa && c ? ' · confirmada por WhatsApp' : ''}`, tipo: f.wa && c ? 'wa' : 'ok', icon: 'calendar-check', accion: 'Ver en agenda', onAccion: () => { App.agendaIr(ini, ev.id); App.go('#/agenda'); }});
      };
    }
  });
};
})();
