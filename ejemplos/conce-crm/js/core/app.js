/* =====================================================================
   Carcasa de la app: router por hash, barra lateral, barra superior,
   búsqueda global (⌘K), notificaciones, menú «Nuevo», acciones globales,
   tema y personalización por URL.
   ===================================================================== */
(function(){
const App = window.App;
const {html, raw, icon, db, C, ui} = App;

/* ---------- personalización por URL: ?n=Autos Pepe&c=Málaga&color=%23E02424&reset=1&tour=1 ---------- */
(function personaliza(){
  const q = App.parseQuery(location.search);
  if (q.reset) App.store.reset();
  const d = App.S.dealer; let cambia = false;
  const nombre = q.n || q.nombre || q.concesionario;
  if (nombre) { d.nombre = nombre; d.corto = nombre.split(/\s+/)[0]; d.siglas = App.initials(nombre.replace(/\b(de|del|la|el|y|s\.?l\.?)\b/gi, '')).slice(0, 2); d.email = 'ventas@' + App.norm(nombre).replace(/[^a-z0-9]/g, '') + '.es'; d.web = App.norm(nombre).replace(/[^a-z0-9]/g, '') + '.es'; d.razon = nombre + ' S.L.'; cambia = true; }
  if (q.c || q.ciudad) { d.ciudad = q.c || q.ciudad; cambia = true; }
  if (q.color) { d.color = q.color.startsWith('#') ? q.color : '#' + q.color; cambia = true; }
  if (q.tel) { d.whatsapp = q.tel; cambia = true; }
  if (q.dir) { d.direccion = q.dir; cambia = true; }
  if (cambia) App.store.save();
  App.startTour = !!q.tour;
  if (q.tema) App.S.prefs.tema = q.tema === 'oscuro' || q.tema === 'dark' ? 'dark' : 'light';
})();

/* ---------- tema ---------- */
App.applyTheme = () => {
  document.documentElement.dataset.theme = App.S.prefs.tema === 'dark' ? 'dark' : 'light';
  document.documentElement.style.setProperty('--brand', App.S.dealer.color || '#1A56DB');
};

/* ---------- navegación ---------- */
const NAV = [
  {group:'Principal', items:[
    {id:'inicio', label:'Inicio', icon:'layout-dashboard'},
    {id:'whatsapp', label:'WhatsApp', icon:'message-circle', badge: () => db.totalSinLeer(), wa:true},
    {id:'leads', label:'Leads y clientes', icon:'users', badge: () => App.S.contacts.filter(c => c.etapa === 'nuevo').length},
    {id:'agenda', label:'Agenda', icon:'calendar', badge: () => db.eventosDia(new Date()).filter(e => !['hecha','no_vino'].includes(e.estado)).length}
  ]},
  {group:'Vehículos', items:[
    {id:'stock', label:'Stock', icon:'car'},
    {id:'portales', label:'Portales', icon:'globe'},
    {id:'tasaciones', label:'Tasaciones', icon:'scan-line'}
  ]},
  {group:'Ventas', items:[
    {id:'presupuestos', label:'Presupuestos', icon:'file-text'},
    {id:'financiacion', label:'Financiación', icon:'landmark'},
    {id:'informes', label:'Informes', icon:'bar-chart-3'}
  ]},
  {group:'Sistema', items:[
    {id:'automatizaciones', label:'Automatizaciones', icon:'zap'},
    {id:'ajustes', label:'Ajustes', icon:'settings'}
  ]}
];
App.NAV = NAV;

function parseHash() {
  const h = location.hash.replace(/^#\/?/, '');
  const [path, qs] = h.split('?');
  const parts = path.split('/').filter(Boolean).map(decodeURIComponent);
  return {name: parts[0] || 'inicio', id: parts[1] || null, sub: parts[2] || null, parts, query: App.parseQuery(qs), hash: location.hash || '#/inicio'};
}

/* ---------- carcasa ---------- */
function shell() {
  const d = App.S.dealer, me = db.me();
  return html`
  <div class="app ${App.S.prefs.sidebar === 'collapsed' ? 'is-collapsed' : ''}" id="app">
    <aside class="side" data-tour="sidebar">
      <div class="side__brand">
        <div class="side__logo">${d.siglas || App.initials(d.nombre)}</div>
        <div class="side__name"><b>${d.nombre}</b><span>${d.ciudad} · CRM</span></div>
      </div>
      <nav class="side__nav" id="sideNav"></nav>
      <div class="side__foot">
        <button class="side__present" data-act="tour" data-tour="present">${icon('presentation', 17)}<span>Modo presentación</span></button>
        <button class="side__user" data-act="menu-user">${App.avatar(me.nombre, {color: me.color})}<div><b>${me.nombre}</b><span>${me.rol}</span></div></button>
        <div class="side__powered">Hecho por <b>Widy</b></div>
      </div>
    </aside>
    <div class="side-scrim" data-act="nav-close"></div>
    <div class="main">
      <header class="top" id="top">
        <button class="icon-btn top__menu" data-act="nav-open" aria-label="Menú">${icon('menu', 20)}</button>
        <button class="icon-btn hide-m" data-act="nav-collapse" aria-label="Plegar menú" title="Plegar menú">${icon('panel-left', 18)}</button>
        <div class="top__title" id="topTitle"></div>
        <button class="top__search" data-act="cmdk" data-tour="search">${icon('search', 16)}<span>Buscar cliente, coche, matrícula…</span><span class="kbd">⌘K</span></button>
        <div class="top__actions">
          <button class="btn btn--soft btn--sm hide-m" data-act="sim-lead" data-tour="sim" title="Simula un lead entrando ahora mismo">${icon('zap', 15)}Lead en directo</button>
          <button class="icon-btn" data-act="notifs" aria-label="Notificaciones" id="bell">${icon('bell', 19)}</button>
          <button class="btn btn--primary btn--sm" data-act="menu-nuevo" data-tour="nuevo">${icon('plus', 16)}<span class="hide-m">Nuevo</span></button>
        </div>
      </header>
      <main class="page" id="page"></main>
    </div>
    <nav class="bnav" id="bnav"></nav>
  </div>`;
}

function renderNav(route) {
  const nav = App.$('#sideNav'); if (!nav) return;
  nav.innerHTML = App.str(NAV.map(g => html`<div class="side__group"><div class="side__label">${g.group}</div>${g.items.map(it => {
    const n = it.badge ? it.badge() : 0;
    return html`<a href="#/${it.id}" class="nav ${route.name === it.id ? 'is-active' : ''}" data-nav="${it.id}" title="${it.label}">${icon(it.icon, 18)}<span class="nav__txt">${it.label}</span>${n ? html`<span class="nav__badge ${it.wa ? 'nav__badge--wa' : ''}">${n}</span>` : ''}</a>`;
  })}</div>`));
  const b = App.$('#bnav');
  const items = [['inicio','layout-dashboard','Inicio'], ['whatsapp','message-circle','WhatsApp'], ['leads','users','Leads'], ['agenda','calendar','Agenda']];
  b.innerHTML = App.str(html`${items.map(([id, ic, l]) => { const it = NAV.flatMap(g => g.items).find(x => x.id === id); const n = it.badge ? it.badge() : 0; return html`<a href="#/${id}" class="${route.name === id ? 'is-active' : ''}">${icon(ic, 21)}${l}${n ? html`<span class="nav__badge ${it.wa ? 'nav__badge--wa' : ''}">${n}</span>` : ''}</a>`; })}<button data-act="nav-open" class="${['inicio','whatsapp','leads','agenda'].includes(route.name) ? '' : 'is-active'}">${icon('layout-grid', 21)}Más</button>`);
  const bell = App.$('#bell');
  if (bell) { const un = App.S.notifications.some(n => !n.leida); bell.querySelector('.dot')?.remove(); if (un) bell.insertAdjacentHTML('beforeend', '<span class="dot"></span>'); }
}

function renderTitle(view, route) {
  const t = App.$('#topTitle'); if (!t) return;
  const crumbs = view && view.crumbs ? view.crumbs(route) : null;
  const title = view ? (typeof view.title === 'function' ? view.title(route) : view.title) : '';
  t.innerHTML = App.str(crumbs && crumbs.length
    ? html`${crumbs.map((c, i) => html`<a class="crumb" href="${c.href}">${c.label}</a><span class="crumb-sep faint">${icon('chevron-right', 16)}</span>`)}<span class="ellipsis">${title}</span>`
    : html`<span class="ellipsis">${title}</span>`);
  document.title = (title ? title + ' · ' : '') + App.S.dealer.nombre + ' CRM';
}

/* ---------- render de vista ---------- */
let current = null;
App.render = function({keepScroll = false} = {}) {
  const route = App.route = parseHash();
  const view = App.views[route.name] || App.views.inicio || notFound;
  const page = App.$('#page'); if (!page) return;
  const same = current && current.view === view && current.hash === route.hash;
  // guardar scroll y foco
  const sy = window.scrollY;
  const keep = {}; App.$$('[data-keep-scroll]', page).forEach(el => keep[el.dataset.keepScroll] = el.scrollTop);
  const fe = document.activeElement, fid = fe && page.contains(fe) && fe.id, sel = fid && fe.selectionStart != null ? [fe.selectionStart, fe.selectionEnd] : null;
  if (current && !same && current.view.unmount) try { current.view.unmount(); } catch (e) { console.error(e); }
  App.currentView = view;
  page.className = 'page' + (view.full ? ' page--full' : '') + (view.flush ? ' page--flush' : '');
  try {
    page.innerHTML = App.str(view.render(route));
  } catch (e) {
    console.error(e);
    page.innerHTML = App.str(html`<div class="card card--pad mt-24"><b>Error al pintar la vista «${route.name}»</b><pre class="small muted" style="white-space:pre-wrap">${String(e && e.stack || e)}</pre></div>`);
  }
  if (!same) page.classList.add('view-enter'); else page.classList.remove('view-enter');
  renderTitle(view, route);
  renderNav(route);
  App.bindActs(page);
  if (view.mount) try { view.mount(page, route, {rerender: same}); } catch (e) { console.error(e); }
  if (same || keepScroll) {
    window.scrollTo(0, sy);
    App.$$('[data-keep-scroll]', page).forEach(el => { if (keep[el.dataset.keepScroll] != null) el.scrollTop = keep[el.dataset.keepScroll]; });
    if (fid) { const n = document.getElementById(fid); if (n) { n.focus(); if (sel && n.setSelectionRange) try { n.setSelectionRange(...sel); } catch (e) {} } }
  } else window.scrollTo(0, 0);
  current = {view, hash: route.hash};
  App.$('#app')?.classList.remove('is-nav-open');
  App.emit('rendered', route);
};
const notFound = {title:'No encontrado', render: () => ui.empty('circle-alert', 'Esta pantalla no existe', 'Vuelve al inicio.', html`<a class="btn" href="#/inicio">Ir al inicio</a>`)};

/* re-render al cambiar datos: la vista decide con deps ['contacts',...] o onChange() */
App.on('change', what => {
  const v = App.currentView, route = App.route;
  renderNav(route || parseHash());
  if (!v) return;
  if (v.onChange && v.onChange(what, route) === true) return;
  const deps = v.deps || ['*'];
  if (what === '*' || deps.includes('*') || deps.includes(what)) App.render({keepScroll: true});
});

/* ---------- acciones globales ---------- */
const A = App.actions;
A.go = el => App.go(el.dataset.href);
A.contacto = el => App.open.contacto(el.dataset.id);
A.vehiculo = el => App.open.vehiculo(el.dataset.id);
A.whatsapp = el => App.open.whatsapp(el.dataset.id);
A.llamar = el => {
  const c = db.contact(el.dataset.id);
  const tel = el.dataset.tel || (c && c.tel);
  App.toast('Llamando desde tu móvil…', {sub: (c ? c.nombre + ' · ' : '') + tel, icon: 'phone', tipo: 'info'});
  if (c) db.addTimeline(c.id, {tipo:'llamada', texto:'Llamada saliente'});
};
A['nav-open'] = () => App.$('#app').classList.add('is-nav-open');
A['nav-close'] = () => App.$('#app').classList.remove('is-nav-open');
A['nav-collapse'] = () => { App.S.prefs.sidebar = App.S.prefs.sidebar === 'collapsed' ? 'open' : 'collapsed'; App.$('#app').classList.toggle('is-collapsed', App.S.prefs.sidebar === 'collapsed'); App.store.save(); };
A.tema = () => { App.S.prefs.tema = App.S.prefs.tema === 'dark' ? 'light' : 'dark'; App.applyTheme(); App.store.save(); };
A['sim-lead'] = () => App.sim && App.sim.lead();
A.tour = () => App.tour && App.tour.start();
A['reset-demo'] = async () => { if (await App.confirm({title:'¿Restablecer los datos de ejemplo?', text:'Se borran los cambios hechos en esta demo (citas, mensajes, presupuestos…) y vuelve todo al estado inicial.', ok:'Restablecer', danger:true})) { App.store.reset(); App.toast('Datos de ejemplo restablecidos'); App.go('#/inicio'); } };
A['tarea-toggle'] = el => { const t = db.toggleTask(el.dataset.id); if (t && t.hecha) App.toast('Tarea hecha', {sub: t.texto}); };
A.nuevo = el => App.nuevo(el.dataset.what, Object.assign({}, el.dataset));
A['menu-nuevo'] = el => App.menu(el, [
  {header:'Crear'},
  {label:'Lead o cliente', icon:'user-plus', onClick: () => App.nuevo('lead')},
  {label:'Cita en la agenda', icon:'calendar-plus', onClick: () => App.nuevo('cita')},
  {label:'Vehículo en stock', icon:'car', onClick: () => App.nuevo('vehiculo')},
  {label:'Presupuesto', icon:'file-text', onClick: () => App.nuevo('presupuesto')},
  {label:'Tasación', icon:'scan-line', onClick: () => App.nuevo('tasacion')},
  {label:'Financiación', icon:'landmark', onClick: () => App.nuevo('financiacion')},
  {label:'Tarea', icon:'list-checks', onClick: () => App.nuevo('tarea')},
  {sep:true},
  {label:'Simular lead en directo', icon:'zap', onClick: () => App.sim && App.sim.lead()}
], {align:'right'});
A['menu-user'] = el => App.menu(el, [
  {header: App.S.dealer.nombre},
  {label: App.S.prefs.tema === 'dark' ? 'Modo claro' : 'Modo oscuro', icon: App.S.prefs.tema === 'dark' ? 'sun' : 'moon', onClick: A.tema},
  {label:'Ajustes y equipo', icon:'settings', onClick: () => App.go('#/ajustes')},
  {label:'Modo presentación', icon:'presentation', onClick: () => App.tour && App.tour.start()},
  {sep:true},
  {label:'Restablecer datos de ejemplo', icon:'rotate-ccw', onClick: A['reset-demo']}
]);

/* intents de creación (cada vista registra su modal en App.modals) */
App.nuevo = (what, opts = {}) => {
  const map = {lead:'nuevoLead', cita:'nuevaCita', vehiculo:'nuevoVehiculo', presupuesto:'nuevoPresupuesto', tasacion:'nuevaTasacion', financiacion:'nuevaFinanciacion', tarea:'nuevaTarea'};
  const fn = App.modals[map[what] || what];
  if (fn) return fn(opts);
  if (what === 'vehiculo') return App.go('#/stock/nuevo');
  if (what === 'presupuesto') return App.go('#/presupuestos/nuevo' + (opts.contact ? '?c=' + opts.contact : ''));
  App.toast('Disponible en la versión completa', {tipo:'info'});
};

/* modal de tarea (compartido) */
App.modals.nuevaTarea = ({contact, vehicle} = {}) => {
  const users = App.S.users;
  App.modal({title:'Nueva tarea', size:'sm',
    body: html`<div class="stack">
      <div class="field"><label>Qué hay que hacer</label><input class="input" id="tkTxt" placeholder="Llamar para confirmar la financiación…" autofocus></div>
      <div class="form-grid">
        <div class="field"><label>Para</label><select class="select" id="tkUser">${users.map(u => html`<option value="${u.id}" ${u.id === App.S.me ? 'selected' : ''}>${u.nombre}</option>`)}</select></div>
        <div class="field"><label>Cuándo</label><select class="select" id="tkDia"><option value="0">Hoy</option><option value="1">Mañana</option><option value="2">Pasado mañana</option><option value="7">En una semana</option></select></div>
      </div></div>`,
    foot: html`<button class="btn" data-close>Cancelar</button><button class="btn btn--primary" id="tkOk">Crear tarea</button>`,
    onMount(n, close) {
      const ok = () => { const texto = n.querySelector('#tkTxt').value.trim(); if (!texto) return n.querySelector('#tkTxt').focus(); db.addTask({texto, userId: n.querySelector('#tkUser').value, fecha: App.at(+n.querySelector('#tkDia').value, 20, 0), contactId: contact || null, vehicleId: vehicle || null}); close(); App.toast('Tarea creada', {sub: texto}); };
      n.querySelector('#tkOk').onclick = ok; n.querySelector('#tkTxt').onkeydown = e => e.key === 'Enter' && ok();
    }});
};

/* ---------- notificaciones ---------- */
A.notifs = () => {
  const list = () => App.S.notifications.slice(0, 30);
  const NI = {lead:'zap', humano:'user-check', cita:'calendar-check', presupuesto:'eye', stock:'hourglass', financiacion:'landmark', resena:'star', info:'info', ia:'bot'};
  const NC = {lead:'var(--accent)', humano:'var(--red)', cita:'var(--violet)', presupuesto:'var(--pink)', stock:'var(--amber)', financiacion:'var(--green)', resena:'var(--amber)', ia:'var(--violet)'};
  const body = () => html`${list().map(n => html`<div class="notif ${n.leida ? '' : 'is-unread'}" data-link="${n.link}" data-nid="${n.id}">
      <span class="notif__ico" style="${NC[n.tipo] ? `background:color-mix(in srgb,${NC[n.tipo]} 14%,transparent);color:${NC[n.tipo]}` : ''}">${icon(n.icon || NI[n.tipo] || 'bell', 16)}</span>
      <div class="grow"><b>${n.titulo}</b><span>${n.texto}</span><div class="xs faint mt-4">${App.rel(n.fecha)}</div></div></div>`)}`;
  App.drawer({width: 420, head: html`<div><h2>Notificaciones</h2><p class="small muted">${App.S.notifications.filter(n => !n.leida).length} sin leer</p></div>`,
    body: body(), foot: html`<button class="btn btn--sm" id="nfAll">${icon('check-check', 15)}Marcar todo como leído</button>`,
    onMount(n, close) {
      n.querySelector('.drawer__body').classList.add('p-0');
      n.addEventListener('click', e => { const it = e.target.closest('[data-nid]'); if (!it) return; const nn = App.S.notifications.find(x => x.id === it.dataset.nid); if (nn) { nn.leida = true; App.store.save(); } close(); if (it.dataset.link) App.go(it.dataset.link); renderNav(App.route); });
      n.querySelector('#nfAll').onclick = () => { App.store.update(s => s.notifications.forEach(x => x.leida = true), 'notifications'); n.querySelector('.drawer__body').innerHTML = App.str(body()); };
    }});
};

/* ---------- paleta de comandos ⌘K ---------- */
A.cmdk = () => {
  if (App.$('.cmdk')) return;
  const ov = App.el('<div class="overlay"></div>');
  const box = App.el(App.str(html`<div class="cmdk" role="dialog"><div class="cmdk__input">${icon('search', 18, 'faint')}<input id="cmdkIn" placeholder="Busca un cliente, un coche, una matrícula o una acción…" autocomplete="off"><span class="kbd">esc</span></div><div class="cmdk__list" id="cmdkList"></div><div class="cmdk__foot"><span><span class="kbd">↑</span> <span class="kbd">↓</span> moverse</span><span><span class="kbd">↵</span> abrir</span></div></div>`));
  document.body.append(ov, box);
  requestAnimationFrame(() => { ov.classList.add('is-in'); box.classList.add('is-in'); });
  const input = box.querySelector('input'), listEl = box.querySelector('#cmdkList');
  let items = [], focus = 0;
  const close = () => { ov.remove(); box.remove(); document.removeEventListener('keydown', key, true); };
  const cmds = [
    ...NAV.flatMap(g => g.items).map(it => ({t:'Ir a', label: it.label, icon: it.icon, run: () => App.go('#/' + it.id)})),
    {t:'Acciones', label:'Nuevo lead', icon:'user-plus', run: () => App.nuevo('lead')},
    {t:'Acciones', label:'Nueva cita', icon:'calendar-plus', run: () => App.nuevo('cita')},
    {t:'Acciones', label:'Nuevo presupuesto', icon:'file-text', run: () => App.nuevo('presupuesto')},
    {t:'Acciones', label:'Dar de alta un vehículo', icon:'car', run: () => App.nuevo('vehiculo')},
    {t:'Acciones', label:'Nueva tasación', icon:'scan-line', run: () => App.nuevo('tasacion')},
    {t:'Acciones', label:'Simular lead en directo', icon:'zap', run: () => App.sim && App.sim.lead()},
    {t:'Acciones', label:'Modo presentación', icon:'presentation', run: () => App.tour && App.tour.start()},
    {t:'Acciones', label:'Cambiar modo claro / oscuro', icon:'moon', run: A.tema}
  ];
  const draw = () => {
    const q = input.value.trim();
    const r = db.buscar(q);
    const nq = App.norm(q);
    const cm = q ? cmds.filter(c => App.norm(c.label).includes(nq)) : cmds.slice(0, 12);
    items = [
      ...r.vehicles.map(v => ({t:'Vehículos', v, run: () => App.open.vehiculo(v.id)})),
      ...r.contacts.map(c => ({t:'Clientes', c, run: () => App.open.contacto(c.id)})),
      ...cm
    ];
    focus = Math.min(focus, Math.max(items.length - 1, 0));
    let last = '';
    listEl.innerHTML = items.length ? App.str(items.map((it, i) => {
      const head = it.t !== last ? html`<div class="cmdk__group">${it.t}</div>` : ''; last = it.t;
      const body = it.v ? html`${ui.thumb(it.v)}<div class="grow"><b>${ui.vehNombre(it.v)}</b> <span>${it.v.version}</span><div class="small muted">${it.v.matricula} · ${it.v.anio} · ${App.km(it.v.km)}</div></div><span class="cmdk__meta">${it.v.estado === 'vendido' ? 'Vendido' : App.eur(it.v.precio)}</span>`
        : it.c ? html`${App.avatar(it.c.nombre)}<div class="grow"><b>${it.c.nombre}</b><div class="small muted">${it.c.tel} · ${it.c.ciudad}</div></div><span class="cmdk__meta">${C.etapa(it.c.etapa).label}</span>`
        : html`<span class="kpi__ico">${icon(it.icon, 15)}</span><b>${it.label}</b>`;
      return html`${head}<div class="cmdk__item ${i === focus ? 'is-focus' : ''}" data-i="${i}">${body}</div>`;
    })) : App.str(html`<div class="empty"><div><b>Sin resultados</b><p>Prueba con la marca, el modelo, la matrícula o el nombre.</p></div></div>`);
    listEl.querySelector('.is-focus')?.scrollIntoView({block:'nearest'});
  };
  const key = e => {
    if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close(); }
    else if (e.key === 'ArrowDown') { e.preventDefault(); focus = Math.min(focus + 1, items.length - 1); draw(); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); focus = Math.max(focus - 1, 0); draw(); }
    else if (e.key === 'Enter') { e.preventDefault(); const it = items[focus]; if (it) { close(); it.run(); } }
  };
  document.addEventListener('keydown', key, true);
  input.addEventListener('input', () => { focus = 0; draw(); });
  listEl.addEventListener('click', e => { const el = e.target.closest('[data-i]'); if (!el) return; const it = items[+el.dataset.i]; close(); it.run(); });
  ov.onclick = close;
  draw(); input.focus();
};
document.addEventListener('keydown', e => {
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); A.cmdk(); }
  else if (e.key === '/' && !e.target.closest('input,textarea,select,[contenteditable]') && !App.$('.modal,.drawer,.cmdk')) { e.preventDefault(); A.cmdk(); }
});

/* ---------- arranque ---------- */
function boot() {
  App.applyTheme();
  document.body.insertAdjacentHTML('afterbegin', App.str(shell()));
  App.bindActs(App.$('#app'));
  window.addEventListener('hashchange', () => { App.closeAll(); App.render(); });
  window.addEventListener('scroll', () => App.$('#top')?.classList.toggle('is-scrolled', window.scrollY > 4), {passive: true});
  if (!location.hash) history.replaceState(null, '', location.pathname + location.search + '#/inicio');
  App.render();
  // la hora avanza: refresca etiquetas relativas cada minuto sin tocar el scroll
  setInterval(() => { if (!App.$('.modal,.drawer,.cmdk,.tour-card') && !document.activeElement.closest?.('input,textarea,select')) App.render({keepScroll: true}); }, 60000);
  const b = App.$('.boot'); if (b) { b.style.opacity = 0; setTimeout(() => b.remove(), 300); }
  if (App.startTour && App.tour) setTimeout(() => App.tour.start(), 600);
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
