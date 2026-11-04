/* =====================================================================
   Estado + persistencia (localStorage) + consultas y cambios (App.db)
   + catálogos (App.C) + piezas de interfaz compartidas (App.ui).
   ===================================================================== */
(function(){
const App = window.App;
const {html, raw, icon} = App;
const KEY = 'crm-conce-v3';

/* ---------- eventos ---------- */
const subs = {};
App.on = (ev, fn) => { (subs[ev] = subs[ev] || []).push(fn); return () => subs[ev] = subs[ev].filter(f => f !== fn); };
App.emit = (ev, data) => (subs[ev] || []).slice().forEach(f => { try { f(data); } catch (e) { console.error(e); } });

/* ---------- carga / guardado ---------- */
function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) { const s = JSON.parse(raw); if (s && s.version === 3) return s; }
  } catch (e) {}
  return App.seed();
}
App.S = load();
App.T = {typing: {}};                         // estado efímero (no se guarda)
let saveT;
App.store = {
  save() { clearTimeout(saveT); saveT = setTimeout(() => { try { localStorage.setItem(KEY, JSON.stringify(App.S)); } catch (e) {} }, 120); },
  /* muta y avisa: App.store.update(S => { ... }, 'contacts') */
  update(fn, what = '*') { fn(App.S); this.save(); App.emit('change', what); },
  reset() { try { localStorage.removeItem(KEY); } catch (e) {} const prefs = App.S.prefs, dealer = App.S.dealer; App.S = App.seed(); App.S.prefs = prefs; App.S.dealer = Object.assign(App.S.dealer, dealer); this.save(); App.emit('change', '*'); }
};

/* ---------- catálogos ---------- */
const C = App.C = {};
C.ETAPAS = [
  {id:'nuevo',       label:'Nuevo',          badge:'blue',   color:'#1A56DB', icon:'sparkles'},
  {id:'contactado',  label:'Contactado',     badge:'cyan',   color:'#0891B2', icon:'message-circle'},
  {id:'cita',        label:'Cita agendada',  badge:'violet', color:'#7E3AF2', icon:'calendar-check'},
  {id:'prueba',      label:'Prueba hecha',   badge:'amber',  color:'#D97706', icon:'key'},
  {id:'negociacion', label:'Negociación',    badge:'pink',   color:'#DB2777', icon:'handshake'},
  {id:'reservado',   label:'Reservado',      badge:'green',  color:'#0E9F6E', icon:'bookmark'},
  {id:'vendido',     label:'Vendido',        badge:'dark',   color:'#0B0F19', icon:'badge-check'},
  {id:'perdido',     label:'Perdido',        badge:'red',    color:'#E02424', icon:'circle-x'}
];
C.etapa = id => C.ETAPAS.find(e => e.id === id) || C.ETAPAS[0];
C.ORIGENES = {
  cochesnet:   {label:'coches.net',   short:'c.n', color:'#F26B21'},
  wallapop:    {label:'Wallapop',     short:'wp',  color:'#13C1AC'},
  milanuncios: {label:'Milanuncios',  short:'MA',  color:'#5E9C2F'},
  autoscout:   {label:'AutoScout24',  short:'AS',  color:'#E5A800'},
  fbmarket:    {label:'Marketplace',  short:'f',   color:'#1877F2'},
  web:         {label:'Web',          short:'W',   color:'#0B0F19'},
  meta:        {label:'Instagram Ads',short:'IG',  color:'#D6297A'},
  google:      {label:'Google',       short:'G',   color:'#4285F4'},
  whatsapp:    {label:'WhatsApp',     short:'wa',  color:'#25D366'},
  exposicion:  {label:'Exposición',   short:'EX',  color:'#6B7280'},
  telefono:    {label:'Teléfono',     short:'TF',  color:'#0891B2'},
  recomendado: {label:'Recomendado',  short:'RC',  color:'#7E3AF2'}
};
C.origen = id => C.ORIGENES[id] || {label: id || '—', short:'?', color:'#6B7280'};
C.PORTALES = ['web','cochesnet','wallapop','milanuncios','autoscout','fbmarket'];
C.ESTADOS_VEH = {
  disponible:  {label:'Disponible',     badge:'green'},
  reservado:   {label:'Reservado',      badge:'amber'},
  preparacion: {label:'En preparación', badge:'blue'},
  vendido:     {label:'Vendido',        badge:'dark'}
};
C.TIPOS_EV = {
  prueba:   {label:'Prueba de conducción', short:'Prueba',   color:'#7E3AF2', badge:'violet', icon:'key'},
  visita:   {label:'Visita',               short:'Visita',   color:'#1A56DB', badge:'blue',   icon:'store'},
  entrega:  {label:'Entrega',              short:'Entrega',  color:'#0E9F6E', badge:'green',  icon:'handshake'},
  tasacion: {label:'Tasación',             short:'Tasación', color:'#D97706', badge:'amber',  icon:'scan-line'},
  firma:    {label:'Firma',                short:'Firma',    color:'#DB2777', badge:'pink',   icon:'file-signature'},
  taller:   {label:'Taller / ITV',         short:'Taller',   color:'#0891B2', badge:'cyan',   icon:'wrench'},
  llamada:  {label:'Llamada',              short:'Llamada',  color:'#6B7280', badge:'',       icon:'phone'}
};
C.ESTADOS_EV = {pendiente:{label:'Sin confirmar', badge:'amber'}, confirmada:{label:'Confirmada', badge:'green'}, hecha:{label:'Hecha', badge:''}, no_vino:{label:'No vino', badge:'red'}, cancelada:{label:'Cancelada', badge:'red'}};
C.ESTADOS_Q = {borrador:{label:'Borrador', badge:''}, enviado:{label:'Enviado', badge:'blue'}, visto:{label:'Visto', badge:'violet'}, aceptado:{label:'Aceptado', badge:'green'}, rechazado:{label:'Rechazado', badge:'red'}};
C.ESTADOS_TAS = {pendiente:{label:'Pendiente', badge:'amber'}, valorada:{label:'Valorada', badge:'blue'}, aceptada:{label:'Aceptada', badge:'green'}, rechazada:{label:'Rechazada', badge:'red'}};
C.ESTADOS_FIN = {estudio:{label:'En estudio', badge:''}, enviada:{label:'Enviada', badge:'blue'}, aprobada:{label:'Aprobada', badge:'green'}, denegada:{label:'Denegada', badge:'red'}, firmada:{label:'Firmada', badge:'dark'}};
C.ENTIDADES = ['Santander Consumer','Cetelem','BBVA Consumer','Sofinco','CaixaBank Payments'];
C.TEMP = {caliente:{label:'Caliente', icon:'flame'}, templado:{label:'Templado', icon:'thermometer'}, frio:{label:'Frío', icon:'snowflake'}};
C.COMBUSTIBLES = ['Gasolina','Diésel','Híbrido','Híbrido enchufable','Eléctrico','GLP'];
C.CARROCERIAS = ['Urbano','Compacto','Berlina','SUV','SUV coupé','Familiar','Monovolumen','Cabrio','Furgoneta'];
C.ETIQUETAS = ['0','ECO','C','B'];

/* ---------- consultas y cambios ---------- */
const S = () => App.S;
const db = App.db = {
  me: () => db.user(S().me),
  user: id => S().users.find(u => u.id === id),
  veh: id => S().vehicles.find(v => v.id === id),
  contact: id => S().contacts.find(c => c.id === id),
  event: id => S().events.find(e => e.id === id),
  quote: id => S().quotes.find(q => q.id === id),
  stock: () => S().vehicles.filter(v => v.estado !== 'vendido'),
  vendidos: () => S().vehicles.filter(v => v.estado === 'vendido').sort((a, b) => b.fechaVenta.localeCompare(a.fechaVenta)),
  activos: () => S().contacts.filter(c => !['vendido','perdido'].includes(c.etapa)),
  mensajes: cid => S().messages.filter(m => m.contactId === cid),
  ultimoMensaje: cid => { const m = S().messages; for (let i = m.length - 1; i >= 0; i--) if (m[i].contactId === cid) return m[i]; return null; },
  sinLeer: cid => S().messages.filter(m => m.contactId === cid && m.from === 'cliente' && !m.leido).length,
  totalSinLeer: () => S().messages.filter(m => m.from === 'cliente' && !m.leido).length,
  conversaciones: () => {
    const ids = [...new Set(S().messages.map(m => m.contactId))];
    return ids.map(id => ({contact: db.contact(id), last: db.ultimoMensaje(id), unread: db.sinLeer(id)})).filter(x => x.contact).sort((a, b) => b.last.fecha.localeCompare(a.last.fecha));
  },
  leadsDe: vid => S().contacts.filter(c => c.interes.includes(vid)),
  eventosDe: cid => S().events.filter(e => e.contactId === cid).sort((a, b) => a.inicio.localeCompare(b.inicio)),
  eventosDia: d => S().events.filter(e => App.sameDay(e.inicio, d) && e.estado !== 'cancelada').sort((a, b) => a.inicio.localeCompare(b.inicio)),
  presupuestosDe: cid => S().quotes.filter(q => q.contactId === cid),
  tasacionesDe: cid => S().appraisals.filter(t => t.contactId === cid),
  financiacionesDe: cid => S().financings.filter(f => f.contactId === cid),
  tareasDe: cid => S().tasks.filter(t => t.contactId === cid),
  diasStock: v => App.daysSince(v.fechaEntrada) - (v.estado === 'vendido' ? App.daysSince(v.fechaVenta) : 0),
  costeTotal: v => v.precioCompra + App.sum(v.gastos || [], g => g.importe),
  margen: v => (v.precioVenta || v.precio) - db.costeTotal(v),
  visitas: v => App.sum(Object.values(v.portales || {}), p => p.visitas),
  leadsPortales: v => App.sum(Object.values(v.portales || {}), p => p.leads),
  cuota: (precio, entrada = 0, meses = 96, tin = S().dealer.tin) => Math.round(App.cuota(precio - entrada, tin, meses)),
  nextQuoteNumber: () => { const max = Math.max(0, ...S().quotes.map(q => +q.numero.split('-').pop() || 0)); return 'P-' + new Date().getFullYear() + '-' + String(max + 1).padStart(4, '0'); },
  buscar(q) {
    q = App.norm(q).trim(); if (!q) return {contacts: [], vehicles: []};
    const words = q.split(/\s+/);
    const hit = s => { s = App.norm(s); return words.every(w => s.includes(w)); };
    return {
      contacts: S().contacts.filter(c => hit(`${c.nombre} ${c.tel} ${c.email} ${c.ciudad}`)).slice(0, 6),
      vehicles: S().vehicles.filter(v => hit(`${v.marca} ${v.modelo} ${v.version} ${v.matricula} ${v.anio} ${v.color} ${v.combustible}`)).sort((a, b) => (a.estado === 'vendido') - (b.estado === 'vendido')).slice(0, 6)
    };
  },

  /* ---- cambios (todos guardan y emiten 'change') ---- */
  log(texto, {icon: ic = 'activity', link = ''} = {}) { S().activity.unshift({fecha: new Date().toISOString(), texto, icon: ic, link}); S().activity.length = Math.min(S().activity.length, 60); },
  notify({titulo, texto = '', link = '', tipo = 'info', icon: ic}) { const n = {id: App.uid('n'), tipo, titulo, texto, fecha: new Date().toISOString(), leida: false, link, icon: ic}; App.store.update(s => s.notifications.unshift(n), 'notifications'); return n; },
  addTimeline(cid, {tipo = 'nota', texto, autor = S().me, ...extra}) {
    const c = db.contact(cid); if (!c) return;
    App.store.update(() => { c.timeline.unshift(Object.assign({id: App.uid('t'), tipo, texto, fecha: new Date().toISOString(), autor}, extra)); c.ultimoContacto = new Date().toISOString(); }, 'contacts');
  },
  addContact(data) {
    const c = Object.assign({id: App.uid('c'), nombre:'', tel:'', email:'', ciudad: S().dealer.ciudad, origen:'exposicion', etapa:'nuevo', temperatura:'templado', interes: [], presupuesto: 0, financiar: false, cocheACuenta: null, asignado: 'u2', creado: new Date().toISOString(), ultimoContacto: new Date().toISOString(), proxima: null, notas:'', etiquetas: [], iaActiva: true, sinLeer: 0, timeline: [], motivoPerdida:'', valoracion: 0}, data);
    App.store.update(s => { s.contacts.unshift(c); c.timeline.unshift({id: App.uid('t'), tipo:'lead', texto: `Alta de contacto · ${C.origen(c.origen).label}`, fecha: c.creado, autor: data.autor || s.me}); db.log(`Nuevo contacto: ${c.nombre}`, {icon:'user-plus', link:'#/leads/' + c.id}); }, 'contacts');
    return c;
  },
  updateContact(id, patch, what = 'contacts') { const c = db.contact(id); if (!c) return; App.store.update(() => Object.assign(c, patch), what); return c; },
  setEtapa(id, etapa, {motivo = '', silencioso = false} = {}) {
    const c = db.contact(id); if (!c || c.etapa === etapa) return;
    const antes = C.etapa(c.etapa).label, e = C.etapa(etapa);
    App.store.update(s => {
      c.etapa = etapa; if (motivo) c.motivoPerdida = motivo;
      c.timeline.unshift({id: App.uid('t'), tipo:'etapa', texto: `${antes} → ${e.label}${motivo ? ' · ' + motivo : ''}`, fecha: new Date().toISOString(), autor: s.me});
      db.log(`${c.nombre.split(' ')[0]} pasó a «${e.label}»`, {icon: e.icon, link:'#/leads/' + c.id});
    }, 'contacts');
    if (!silencioso) App.toast(`${c.nombre.split(' ').slice(0, 2).join(' ')} → ${e.label}`, {icon: e.icon});
  },
  addMessage(cid, {from = 'agente', texto, ...extra}) {
    const m = Object.assign({id: App.uid('m'), contactId: cid, from, texto, fecha: new Date().toISOString(), leido: from !== 'cliente', autor: from === 'agente' ? S().me : undefined}, extra);
    App.store.update(() => { S().messages.push(m); const c = db.contact(cid); if (c) c.ultimoContacto = m.fecha; }, 'messages');
    return m;
  },
  marcarLeidos(cid) { const ms = S().messages.filter(m => m.contactId === cid && !m.leido); if (!ms.length) return; App.store.update(() => { ms.forEach(m => m.leido = true); const c = db.contact(cid); if (c) { c.sinLeer = 0; c.necesitaHumano = false; } }, 'messages'); },
  addEvent(data) {
    const e = Object.assign({id: App.uid('e'), tipo:'visita', titulo:'', contactId: null, vehicleId: null, userId: S().me, inicio: new Date().toISOString(), fin: App.addMin(new Date(), 45).toISOString(), estado:'confirmada', gcal: !!S().integraciones.gcal, recordatorio: true, origen:'manual', notas:''}, data);
    if (!e.titulo) { const v = db.veh(e.vehicleId); e.titulo = C.TIPOS_EV[e.tipo].short + (v ? ' · ' + v.marca + ' ' + v.modelo : ''); }
    App.store.update(s => {
      s.events.push(e); s.events.sort((a, b) => a.inicio.localeCompare(b.inicio));
      if (e.contactId) { const c = db.contact(e.contactId); if (c) { c.timeline.unshift({id: App.uid('t'), tipo:'cita', texto: `${C.TIPOS_EV[e.tipo].label} · ${App.diaRel(e.inicio)} a las ${App.hora(e.inicio)}`, fecha: new Date().toISOString(), autor: data.origen === 'ia' ? 'ia' : s.me}); c.proxima = {fecha: e.inicio, texto: e.titulo}; if (['nuevo','contactado'].includes(c.etapa) && ['prueba','visita','tasacion'].includes(e.tipo)) c.etapa = 'cita'; } }
      db.log(`Cita: ${e.titulo} · ${App.diaRel(e.inicio)} ${App.hora(e.inicio)}`, {icon:'calendar-plus', link:'#/agenda'});
    }, 'events');
    return e;
  },
  updateEvent(id, patch) { const e = db.event(id); if (!e) return; App.store.update(() => Object.assign(e, patch), 'events'); return e; },
  removeEvent(id) { App.store.update(s => s.events = s.events.filter(e => e.id !== id), 'events'); },
  addVehicle(data) {
    const v = Object.assign({id: App.uid('v'), tipo:'coche', estado:'preparacion', ubicacion:'Taller', fechaEntrada: new Date().toISOString(), fotos: [], equipamiento: [], gastos: [], precioHistorial: [], portales: Object.fromEntries(C.PORTALES.map(p => [p, {on:false, visitas:0, leads:0, favoritos:0, desde:null}])), garantia: 12, duenos: 1, notas:'', descripcion:'', destacado:false, fotosMejoradas:false}, data);
    App.store.update(s => { s.vehicles.unshift(v); db.log(`Alta en stock: ${v.marca} ${v.modelo}`, {icon:'car', link:'#/stock/' + v.id}); }, 'vehicles');
    return v;
  },
  updateVehicle(id, patch, what = 'vehicles') { const v = db.veh(id); if (!v) return; App.store.update(() => Object.assign(v, patch), what); return v; },
  setPortal(vid, portal, on) {
    const v = db.veh(vid); if (!v) return;
    App.store.update(() => { const p = v.portales[portal]; p.on = on; p.desde = on ? new Date().toISOString() : null; }, 'vehicles');
  },
  addQuote(data) {
    const q = Object.assign({id: App.uid('q'), numero: db.nextQuoteNumber(), tipo:'presupuesto', contactId: null, vehicleId: null, userId: S().me, fecha: new Date().toISOString(), precio: 0, descuento: 0, extras: [], tasacion: null, financiacion: null, senal: 0, estado:'borrador', validez: 15, vistas: 0, notas:''}, data);
    App.store.update(s => { s.quotes.unshift(q); if (q.contactId) { const c = db.contact(q.contactId); c && c.timeline.unshift({id: App.uid('t'), tipo:'presupuesto', texto: `Presupuesto ${q.numero} creado`, fecha: q.fecha, autor: s.me}); } db.log(`Presupuesto ${q.numero} creado`, {icon:'file-text', link:'#/presupuestos/' + q.id}); }, 'quotes');
    return q;
  },
  updateQuote(id, patch) { const q = db.quote(id); if (!q) return; App.store.update(() => Object.assign(q, patch), 'quotes'); return q; },
  totalQuote(q) {
    const extras = App.sum(q.extras || [], e => e.importe);
    const tas = q.tasacion ? q.tasacion.importe : 0;
    const total = q.precio - (q.descuento || 0) + extras - tas;
    return {extras, tasacion: tas, total, aFinanciar: q.financiacion ? Math.max(total - (q.financiacion.entrada || 0), 0) : 0, pendiente: total - (q.senal || 0)};
  },
  addTasacion(data) { const t = Object.assign({id: App.uid('ta'), contactId: null, estado:'pendiente', fecha: new Date().toISOString(), userId: S().me, danos: [], fotos: 0, valorMercado: 0, oferta: 0, reacondicionado: 0, comparables: [], notas:''}, data); App.store.update(s => { s.appraisals.unshift(t); db.log(`Tasación: ${t.marca} ${t.modelo}`, {icon:'scan-line', link:'#/tasaciones'}); }, 'appraisals'); return t; },
  updateTasacion(id, patch) { const t = S().appraisals.find(x => x.id === id); if (!t) return; App.store.update(() => Object.assign(t, patch), 'appraisals'); return t; },
  addFinanciacion(data) { const f = Object.assign({id: App.uid('f'), estado:'estudio', fecha: new Date().toISOString(), tin: S().dealer.tin, userId:'u4', docs:{dni:false, nomina:false, banco:false}, notas:''}, data); App.store.update(s => { s.financings.unshift(f); db.log(`Financiación en estudio (${f.entidad})`, {icon:'landmark', link:'#/financiacion'}); }, 'financings'); return f; },
  updateFinanciacion(id, patch) { const f = S().financings.find(x => x.id === id); if (!f) return; App.store.update(() => Object.assign(f, patch), 'financings'); return f; },
  addTask(data) { const t = Object.assign({id: App.uid('k'), texto:'', fecha: App.at(0, 20, 0), userId: S().me, contactId: null, vehicleId: null, hecha: false, tipo:'nota'}, data); App.store.update(s => s.tasks.unshift(t), 'tasks'); return t; },
  toggleTask(id) { const t = S().tasks.find(x => x.id === id); if (!t) return; App.store.update(() => t.hecha = !t.hecha, 'tasks'); return t; },
  venderVehiculo(vid, {contactId, precio, userId = S().me, financiado = false} = {}) {
    const v = db.veh(vid); if (!v) return;
    App.store.update(s => {
      Object.assign(v, {estado:'vendido', fechaVenta: new Date().toISOString(), precioVenta: precio || v.precio, vendedor: userId, financiado, cliente: contactId, ubicacion:'Entregado'});
      Object.values(v.portales).forEach(p => { p.on = false; });
      if (contactId) { const c = db.contact(contactId); if (c) { c.etapa = 'vendido'; c.timeline.unshift({id: App.uid('t'), tipo:'venta', texto: `Compró el ${v.marca} ${v.modelo} · ${App.eur(v.precioVenta)}`, fecha: v.fechaVenta, autor: userId}); } }
      db.log(`Venta: ${v.marca} ${v.modelo} · margen ${App.eur(db.margen(v))}`, {icon:'badge-euro', link:'#/stock/' + v.id});
    }, 'vehicles');
  }
};

/* ---------- piezas de interfaz compartidas ---------- */
App.ui = {
  vehNombre: v => v ? `${v.marca} ${v.modelo}` : '—',
  vehSub: v => v ? `${v.version} · ${v.anio} · ${App.km(v.km)}` : '',
  img: (v, size = 's', i = 0) => v && v.fotos && v.fotos.length ? `img/v/${v.fotos[Math.min(i, v.fotos.length - 1)]}-${size}.webp` : 'img/placeholder.svg',
  thumb: (v, cls = '') => html`<img class="thumb ${cls}" src="${App.ui.img(v)}" alt="${App.ui.vehNombre(v)}" loading="lazy">`,
  etapa: (id, {dot = true} = {}) => { const e = C.etapa(id); return html`<span class="badge badge--${e.badge} ${dot ? 'badge--dot' : ''}">${e.label}</span>`; },
  origen: (id, {label = true, size = 'sm'} = {}) => { const o = C.origen(id); return html`<span class="row-sm" title="${o.label}"><span class="portal portal--${size}" style="background:${o.color}">${o.short}</span>${label ? html`<span class="small">${o.label}</span>` : ''}</span>`; },
  portal: (id, size = '') => { const o = C.origen(id); return html`<span class="portal ${size ? 'portal--' + size : ''}" style="background:${o.color}" title="${o.label}">${o.short}</span>`; },
  vehEstado: estado => { const e = C.ESTADOS_VEH[estado] || C.ESTADOS_VEH.disponible; return html`<span class="badge badge--${e.badge} badge--dot">${e.label}</span>`; },
  dias: v => { const d = db.diasStock(v); const cls = d > 90 ? 'red' : d > 60 ? 'amber' : d < 15 ? 'green' : ''; return html`<span class="badge ${cls ? 'badge--' + cls : ''}" title="Días en stock">${icon('clock-3', 12)}${d} d</span>`; },
  temp: t => { const x = C.TEMP[t] || C.TEMP.templado; return html`<span class="temp temp--${t}">${icon(x.icon, 13)}${x.label}</span>`; },
  user: (id, {size = 'sm', name = false} = {}) => { const u = db.user(id); if (!u) return ''; return name ? html`<span class="row-sm">${App.avatar(u.nombre, {size, color: u.color})}<span class="small">${u.nombre.split(' ')[0]}</span></span>` : App.avatar(u.nombre, {size, color: u.color}); },
  autor: id => id === 'ia' ? 'Asistente IA' : id === 'sistema' ? 'Sistema' : (db.user(id) || {nombre: '—'}).nombre,
  evTipo: t => { const x = C.TIPOS_EV[t] || C.TIPOS_EV.visita; return html`<span class="badge ${x.badge ? 'badge--' + x.badge : ''}">${icon(x.icon, 12)}${x.short}</span>`; },
  estado: (map, id) => { const x = C[map][id] || {label: id, badge: ''}; return html`<span class="badge ${x.badge ? 'badge--' + x.badge : ''}">${x.label}</span>`; },
  empty: (ic, title, text = '', action = '') => html`<div class="empty"><div><div class="empty__ico" style="margin:0 auto 12px">${icon(ic, 24)}</div><b>${title}</b><p>${text}</p>${action ? html`<div class="mt-16">${action}</div>` : ''}</div></div>`,
  ia: (txt = 'IA') => html`<span class="ia-badge">${icon('sparkles', 11)}${txt}</span>`,
  kpi: ({label, value, sub = '', icon: ic, delta, spark, color}) => html`<div class="kpi">
    <div class="kpi__label">${ic ? html`<span class="kpi__ico" style="${color ? `background:color-mix(in srgb,${color} 12%,transparent);color:${color}` : ''}">${icon(ic, 15)}</span>` : ''}${label}</div>
    <div class="kpi__value">${value}</div>
    <div class="kpi__foot">${delta != null ? html`<span class="delta delta--${delta >= 0 ? 'up' : 'down'}">${icon(delta >= 0 ? 'arrow-up-right' : 'arrow-down-right', 13)}${Math.abs(delta)} %</span>` : ''}${sub}</div>
    ${spark ? html`<div class="kpi__spark">${spark}</div>` : ''}
  </div>`,
  contactoMini: c => c ? html`<span class="cell-main">${App.avatar(c.nombre, {size:'sm'})}<span style="min-width:0"><b>${c.nombre}</b></span></span>` : html`<span class="muted">—</span>`,
  telLink: t => html`<a href="tel:${String(t).replace(/\s/g, '')}" class="nowrap">${t}</a>`
};

/* ---------- navegación rápida ---------- */
App.go = hash => { if (location.hash === hash) App.render(); else location.hash = hash; };
App.open = {
  contacto: id => App.go('#/leads/' + id),
  vehiculo: id => App.go('#/stock/' + id),
  whatsapp: id => App.go('#/whatsapp/' + id),
  presupuesto: id => App.go('#/presupuestos/' + id)
};
})();
