/* =====================================================================
   Inicio (#/inicio) — la primera pantalla: saludo, KPIs, resumen de la IA,
   lo que necesita atención, agenda de hoy, embudo, origen de leads,
   coches parados, tareas, ranking y actividad.
   También define App.panel: utilidades compartidas por Inicio, Informes
   y Automatizaciones (mismo grupo de archivos).
   ===================================================================== */
(function(){
const App = window.App;
const {html, raw, icon, db, C, ui} = App;

/* ---------- utilidades compartidas del grupo «panel» ---------- */
const P = App.panel = App.panel || {};
const COMPUESTOS = ['José Luis','Miguel Ángel','Juan Carlos','María José','José Antonio','Juan Antonio','María del Mar'];
P.nombre = n => { n = String(n || ''); return COMPUESTOS.find(x => n === x || n.startsWith(x + ' ')) || n.split(/\s+/)[0]; };
P.corto = n => { n = String(n || ''); const pila = P.nombre(n); const resto = n.slice(pila.length).trim().split(/\s+/)[0] || ''; return (pila + ' ' + resto).trim(); };
P.hh = d => { d = new Date(d); return d.getHours() + ':' + String(d.getMinutes()).padStart(2, '0'); };
P.n = (n, uno, varios) => App.num(n) + ' ' + (Math.round(n) === 1 ? uno : varios);
P.pct = (a, b) => b ? Math.round(a / b * 100) : 0;
P.delta = (a, b) => b ? Math.round((a - b) / b * 100) : null;
P.avg = (arr, f = x => x) => arr.length ? App.sum(arr, f) / arr.length : 0;
P.frac = () => Math.min(new Date().getDate() / 30, 1);           // mismo criterio que el histórico (mes en curso parcial)
P.lista = arr => arr.length <= 1 ? (arr[0] || '') : arr.slice(0, -1).join(', ') + ' y ' + arr[arr.length - 1];
P.recorta = (t, n = 64) => {
  t = String(t || '').replace(/\s+/g, ' ').trim();
  if (t.length <= n) return t;
  const cut = t.slice(0, n), sp = cut.lastIndexOf(' ');
  return cut.slice(0, sp > n * .5 ? sp : n).replace(/[,.;:!¿?\s]+$/, '') + '…';
};
P.durMin = min => {
  if (min < 1) return Math.max(1, Math.round(min * 60)) + ' s';
  if (min < 60) return Math.round(min) + ' min';
  const h = Math.floor(min / 60), m = Math.round(min - h * 60);
  return m ? `${h} h ${m} min` : `${h} h`;
};
P.durSeg = s => P.durMin(s / 60);
// horario del concesionario: L-V 9:30-14:00 y 17:00-20:30 · S 10:00-14:00
P.enHorario = d => { d = new Date(d); const wd = d.getDay(), m = d.getHours() * 60 + d.getMinutes(); if (wd === 0) return false; if (wd === 6) return m >= 600 && m < 840; return (m >= 570 && m < 840) || (m >= 1020 && m < 1230); };
P.ultimoCierre = () => {
  for (let i = 1; i < 8; i++) { const d = App.addDays(App.today(), -i); const wd = d.getDay(); if (wd === 0) continue; d.setHours(wd === 6 ? 14 : 20, wd === 6 ? 0 : 30, 0, 0); return d; }
  return App.addDays(new Date(), -1);
};
P.cuando = d => {
  const n = App.daysBetween(new Date(), d);
  if (n === 0) return 'hoy'; if (n === 1) return 'mañana'; if (n === -1) return 'ayer';
  if (Math.abs(n) < 7) return 'el ' + App.DIAS[new Date(d).getDay()];
  return 'el ' + App.fecha(d);
};
P.reparto = (total, pesos) => {
  total = Math.round(total);
  const sum = pesos.reduce((a, b) => a + b, 0) || 1;
  const raw = pesos.map(p => total * p / sum), base = raw.map(Math.floor);
  let rest = total - base.reduce((a, b) => a + b, 0);
  raw.map((r, i) => [r - base[i], i]).sort((a, b) => b[0] - a[0]).forEach(([, i]) => { if (rest > 0) { base[i]++; rest--; } });
  return base;
};
P.comerciales = () => App.S.users.filter(u => u.rol === 'Comercial');
P.ORIGENES = ['cochesnet','wallapop','web','meta','milanuncios','fbmarket','otros'];
const CORTOS = {cochesnet:'coches.net', meta:'Instagram', fbmarket:'Marketplace', autoscout:'AutoScout24'};
// el histórico no siempre reparte el 100 % de los leads por origen: lo que falta va a «Otros»
P.origenMes = h => { const o = Object.assign({}, h.origen); o.otros = Math.max(h.leads - App.sum(Object.keys(o).filter(k => k !== 'otros'), k => o[k]), 0); return o; };
P.origenInfo = id => id === 'otros' ? {label:'Otros', short:'+', color:'#94A3B8'} : Object.assign({}, C.origen(id), CORTOS[id] ? {label: CORTOS[id]} : {});
P.embudo = h => [
  {id:'leads',      label:'Leads',       n: h.leads},
  {id:'contactados',label:'Contactados', n: Math.round(h.leads * .96)},
  {id:'citas',      label:'Citas',       n: h.citas},
  {id:'pruebas',    label:'Pruebas',     n: Math.round(h.citas * .72)},
  {id:'ventas',     label:'Ventas',      n: h.ventas}
];
// precio sugerido según los días en stock (misma regla que la alerta de coche parado)
P.sugerido = v => { const d = db.diasStock(v); const f = d > 120 ? .94 : d > 90 ? .955 : d > 60 ? .97 : 1; const p = Math.round(v.precio * f / 100) * 100; return p < v.precio ? p : null; };
P.rebajadoHoy = v => (v.precioHistorial || []).some(h => App.isToday(h.fecha));
// espacio duro entre número y unidad («38 s», «15 h», «142 d», «11.300 €») en el HTML ya generado
P.nb = safe => raw(App.str(safe).replace(/(\d) (h|min|s|d|km|€|%|ventas?|citas?|veces)(?=[\s.,;:·)»<]|$)/g, '$1&nbsp;$2'));
P.icoTile = (ic, color, size = 16) => html`<span class="in-tile" style="--c:${color}">${icon(ic, size)}</span>`;
P.cardHead = ({ic, color, title, sub, right}) => html`<div class="card__head in-head">
  <div class="in-head__l">${ic ? P.icoTile(ic, color) : ''}<div class="in-head__t"><h3>${title}</h3>${sub ? html`<p>${sub}</p>` : ''}</div></div>
  ${right ? html`<div class="in-head__r">${right}</div>` : ''}</div>`;

/* ---------- estado local de la vista ---------- */
const st = {tareas: 'equipo', atencionTodo: false, pedidos: new Set()};

/* ---------- cálculos ---------- */
function resumenIA() {
  const S = App.S, since = P.ultimoCierre();
  const ms = S.messages.filter(m => new Date(m.fecha) >= since);
  const ia = ms.filter(m => m.from === 'ia');
  const conSeg = ia.filter(m => m.segundos);
  const contactos = [...new Set(ia.map(m => m.contactId))];
  const agendadas = [], ejemplos = [];
  contactos.forEach(cid => {
    const c = db.contact(cid); if (!c) return;
    const suyos = ms.filter(m => m.contactId === cid);
    const primero = suyos.find(m => m.from === 'cliente');
    const resp = suyos.find(m => m.from === 'ia' && m.segundos);
    const agendo = (c.timeline || []).find(t => t.autor === 'ia' && new Date(t.fecha) >= since && (t.tipo === 'cita' || /agend/i.test(t.texto)));
    const ev = agendo && S.events.filter(e => e.contactId === cid && e.origen === 'ia' && new Date(e.inicio) >= App.today()).sort((a, b) => a.inicio.localeCompare(b.inicio))[0];
    const handoff = suyos.find(m => m.handoff);
    const v = db.veh((ev && ev.vehicleId) || c.interes[0]);
    const nom = P.nombre(c.nombre), coche = v ? ui.vehNombre(v) : 'un coche';
    const ultimoIA = suyos.filter(m => m.from === 'ia').pop();
    if (agendo && ev) {
      agendadas.push(cid);
      const tipo = {prueba:'una prueba de conducción', visita:'una visita', tasacion:'una tasación', entrega:'la entrega', firma:'la firma'}[ev.tipo] || 'una cita';
      ejemplos.push({score: 3, fecha: ultimoIA.fecha, c, chip: {ic:'calendar-check', txt: C.TIPOS_EV[ev.tipo].short + ' ' + P.cuando(ev.inicio) + ' ' + P.hh(ev.inicio), cls:'ok'},
        texto: html`<b>${nom}</b> escribió ${P.cuando(primero ? primero.fecha : ultimoIA.fecha)} a las ${P.hh(primero ? primero.fecha : ultimoIA.fecha)} por el ${coche}. La IA contestó en ${resp ? resp.segundos : 30} s y le agendó ${tipo} para ${P.cuando(ev.inicio)} a las ${P.hh(ev.inicio)}.`});
    } else if (handoff) {
      const u = db.user(c.asignado);
      ejemplos.push({score: 2, fecha: handoff.fecha, c, chip: {ic:'user-check', txt:'Pasada a ' + (u ? P.nombre(u.nombre) : 'una persona'), cls:'warn'},
        texto: html`<b>${nom}</b> preguntó por el ${coche}${c.cocheACuenta ? ' y quiere dejar su coche a cuenta' : ''}. La IA le contestó en ${resp ? resp.segundos : 30} s y, al hablar de precio, pasó la conversación a ${u ? P.nombre(u.nombre) : 'tu equipo'}.`});
    } else if (primero && resp && !P.enHorario(primero.fecha)) {
      ejemplos.push({score: 1, fecha: resp.fecha, c, chip: {ic:'moon', txt:'Fuera de horario', cls:''},
        texto: html`<b>${nom}</b> preguntó ${P.cuando(primero.fecha)} a las ${P.hh(primero.fecha)} por el ${coche}, con el concesionario cerrado. La IA le contestó en ${resp.segundos} s con el precio y la cuota.`});
    }
  });
  ejemplos.sort((a, b) => b.score - a.score || b.fecha.localeCompare(a.fecha));
  return {
    since, conversaciones: contactos.length, mensajes: ia.length, citas: agendadas.length,
    respuesta: Math.round(P.avg(conSeg, m => m.segundos)),
    fuera: ia.filter(m => !P.enHorario(m.fecha)).length,
    humano: ms.filter(m => m.handoff).length,
    ejemplos: ejemplos.slice(0, 3)
  };
}

function atencion() {
  const S = App.S, now = Date.now();
  const cats = [];
  // 1. conversaciones que esperan a una persona o sin leer
  cats.push(db.conversaciones().filter(x => x.contact.necesitaHumano || x.unread)
    .sort((a, b) => (b.contact.necesitaHumano ? 1 : 0) - (a.contact.necesitaHumano ? 1 : 0))
    .map(({contact: c, last}) => {
      const cli = db.mensajes(c.id).filter(m => m.from === 'cliente').pop() || last;
      const quote = cli.fotos ? `${cli.fotos} fotos` : `«${P.recorta(cli.texto, 46)}»`;
      return c.necesitaHumano
        ? {ic:'user-check', color:'var(--red)', title: html`<b>${P.nombre(c.nombre)}</b> espera a una persona`, sub: html`${quote} · ${App.rel(cli.fecha)}`, btn: html`<button class="btn btn--xs btn--wa" data-act="whatsapp" data-id="${c.id}">${icon('message-circle', 13)}Responder</button>`}
        : {ic:'message-circle', color:'var(--wa-dark)', title: html`<b>${P.nombre(c.nombre)}</b> te ha escrito`, sub: html`${quote} · ${App.rel(cli.fecha)}`, btn: html`<button class="btn btn--xs" data-act="whatsapp" data-id="${c.id}">Abrir</button>`};
    }));
  // 2. presupuestos vistos sin respuesta
  cats.push(S.quotes.filter(q => q.estado === 'visto').filter(q => !db.mensajes(q.contactId).some(m => m.from === 'cliente' && m.fecha > q.fecha))
    .sort((a, b) => b.vistas - a.vistas).map(q => {
      const c = db.contact(q.contactId), v = db.veh(q.vehicleId);
      return c && {ic:'eye', color:'var(--pink)', title: html`<b>${P.nombre(c.nombre)}</b> ha abierto el presupuesto ${q.vistas > 1 ? P.n(q.vistas, 'vez', 'veces') : ''}`, sub: html`${q.numero} · ${ui.vehNombre(v)} · sin respuesta`, btn: html`<button class="btn btn--xs" data-act="llamar" data-id="${c.id}">${icon('phone', 13)}Llamar</button>`};
    }).filter(Boolean));
  // 3. citas sin confirmar (próximos 3 días)
  cats.push(S.events.filter(e => e.estado === 'pendiente' && new Date(e.inicio) > now && App.daysBetween(new Date(), e.inicio) <= 2)
    .sort((a, b) => a.inicio.localeCompare(b.inicio)).map(e => {
      const c = db.contact(e.contactId), v = db.veh(e.vehicleId), u = db.user(e.userId);
      return {ic:'calendar', color:'var(--violet)', title: html`<b>${C.TIPOS_EV[e.tipo].short}</b> sin confirmar · ${P.cuando(e.inicio)} ${P.hh(e.inicio)}`,
        sub: [c ? P.corto(c.nombre) : e.titulo, v && c ? ui.vehNombre(v) : '', u ? (u.id === S.me ? 'contigo' : 'con ' + P.nombre(u.nombre)) : ''].filter(Boolean).join(' · '),
        btn: html`<button class="btn btn--xs" data-act="in-ev-confirmar" data-id="${e.id}">${icon('check', 13)}Confirmar</button>`};
    }));
  // 4. financiaciones con documentación pendiente
  const DOC = {dni:'DNI', nomina:'nómina', banco:'extracto del banco'};
  cats.push(S.financings.filter(f => ['estudio','enviada'].includes(f.estado) && Object.values(f.docs || {}).some(x => !x)).map(f => {
    const c = db.contact(f.contactId); if (!c) return null;
    const faltan = Object.keys(DOC).filter(k => !f.docs[k]).map(k => DOC[k]);
    const pedido = st.pedidos.has(f.id);
    return {ic:'landmark', color:'var(--green)', title: html`Faltan papeles de <b>${P.nombre(c.nombre)}</b>`, sub: `${App.cap(P.lista(faltan))} · ${f.entidad}`,
      btn: pedido ? html`<span class="badge badge--green">${icon('check', 12)}Pedidos</span>` : html`<button class="btn btn--xs" data-act="in-pedir-docs" data-id="${f.id}">${icon('send', 13)}Pedir</button>`};
  }).filter(Boolean));
  // 5. leads nuevos sin llamar (la IA ya contestó, nadie del equipo todavía)
  cats.push(S.contacts.filter(c => c.etapa === 'nuevo' && !db.sinLeer(c.id) && !(c.timeline || []).some(t => t.autor !== 'ia' && t.autor !== 'sistema') && !db.mensajes(c.id).some(m => m.from === 'agente'))
    .sort((a, b) => a.creado.localeCompare(b.creado)).map(c => {
      const v = db.veh(c.interes[0]);
      return {ic:'zap', color:'var(--accent)', title: html`<b>${P.nombre(c.nombre)}</b>, lead nuevo sin llamar`, sub: `${v ? ui.vehNombre(v) + ' · ' : ''}${C.origen(c.origen).label} · ${App.rel(c.creado)}`,
        btn: html`<button class="btn btn--xs" data-act="llamar" data-id="${c.id}">${icon('phone', 13)}Llamar</button>`};
    }));
  // 6. coches con más de 90 días
  const lentos = db.stock().filter(v => v.estado === 'disponible' && db.diasStock(v) > 90).sort((a, b) => db.diasStock(b) - db.diasStock(a));
  if (lentos.length) cats.push([{ic:'hourglass', color:'var(--amber)', title: html`<b>${P.n(lentos.length, 'coche lleva', 'coches llevan')}</b> más de 90 días`,
    sub: lentos.slice(0, 3).map(v => `${ui.vehNombre(v)} ${db.diasStock(v)} d`).join(' · '),
    btn: html`<button class="btn btn--xs" data-act="vehiculo" data-id="${lentos[0].id}">Revisar</button>`}]);
  // reparto alterno entre categorías para que se vea de todo
  const out = [];
  for (let i = 0; out.length < 60; i++) { let any = false; cats.forEach(cat => { if (cat[i]) { out.push(cat[i]); any = true; } }); if (!any) break; }
  return out;
}

/* ---------- piezas ---------- */
function head(S) {
  const me = db.me(), now = new Date();
  const hoy = db.eventosDia(now);
  const quedan = hoy.filter(e => new Date(e.inicio) > now && !['hecha','no_vino'].includes(e.estado));
  const esperan = db.conversaciones().filter(x => x.contact.necesitaHumano || x.unread).length;
  const ia = resumenIA();
  const partes = [];
  if (!hoy.length) partes.push(html`Hoy no tienes citas`);
  else if (quedan.length) partes.push(html`Hoy tienes <b>${P.n(hoy.length, 'cita', 'citas')}</b> (la próxima, a las ${P.hh(quedan[0].inicio)})`);
  else partes.push(html`Hoy has tenido <b>${P.n(hoy.length, 'cita', 'citas')}</b>`);
  partes.push(esperan ? html`<b>${P.n(esperan, 'conversación espera', 'conversaciones esperan')}</b> a una persona` : html`no hay conversaciones pendientes`);
  const frase = html`${partes[0]}, ${partes[1]} y la IA ha contestado <b>${P.n(ia.mensajes, 'mensaje', 'mensajes')}</b> desde el cierre de ${P.cuando(ia.since) === 'ayer' ? 'ayer' : App.DIAS[ia.since.getDay()]}.`;
  return html`<div class="page-head in-hello">
    <div class="in-hello__txt">
      <div class="in-hello__date">${icon('calendar-days', 14)}${App.cap(App.fechaLarga(now))}</div>
      <h1>${App.saludo()}, ${P.nombre(me.nombre)}</h1>
      <p>${frase}</p>
    </div>
    <div class="page-head__actions">
      <button class="btn" data-act="go" data-href="#/agenda">${icon('calendar', 16)}Ver agenda</button>
      <button class="btn btn--primary" data-act="sim-lead">${icon('zap', 16)}Lead en directo</button>
    </div>
  </div>`;
}

// leads que han entrado en directo durante la demo (se suman al mes en curso)
P.mesActual = S => { const cur = S.hist[S.hist.length - 1], m0 = App.startOfMonth(new Date()); const extra = S.contacts.filter(c => /^c_/.test(c.id) && new Date(c.creado) >= m0).length; return extra ? Object.assign({}, cur, {leads: cur.leads + extra}) : cur; };
function kpis(S) {
  const H = S.hist, cur = P.mesActual(S), prev = H[H.length - 2], fr = P.frac(), now = new Date();
  const proy = (k) => H.slice(-8).map((h, i, a) => i === a.length - 1 ? Math.round(h[k] / fr) : h[k]);
  const wk0 = App.startOfWeek(now), wk1 = App.addDays(wk0, 7);
  const semana = S.events.filter(e => e.estado !== 'cancelada' && new Date(e.inicio) >= wk0 && new Date(e.inicio) < wk1);
  const conSeg = S.messages.filter(m => m.segundos);
  const resp = Math.round(P.avg(conSeg, m => m.segundos));
  const antes = P.avg(H.slice(0, Math.max(H.length - 4, 1)), h => h.respuestaMin);
  const stock = db.stock();
  const diasMed = Math.round(P.avg(stock, v => db.diasStock(v)));
  const lentos = stock.filter(v => db.diasStock(v) > 90).length;
  const mes = App.MESES_C[now.getMonth() === 0 ? 11 : now.getMonth() - 1];
  return html`<div class="kpis in-kpis" data-tour="kpis">
    ${ui.kpi({label:'Leads del mes', icon:'zap', color:'var(--accent)', value: App.num(cur.leads), delta: P.delta(cur.leads, prev.leads * fr), sub:`vs mismo día de ${mes}`, spark: App.chart.spark(proy('leads'), {color:'var(--accent)', w: 84, h: 30})})}
    ${ui.kpi({label:'Citas esta semana', icon:'calendar-check', color:'var(--violet)', value: App.num(semana.length), sub: html`${db.eventosDia(now).length} hoy · <span class="in-kpi-ia">${icon('sparkles', 11)}${semana.filter(e => e.origen === 'ia').length} por la IA</span>`, spark: App.chart.spark(proy('citas'), {color:'var(--violet)', w: 84, h: 30})})}
    ${ui.kpi({label:'Ventas del mes', icon:'badge-euro', color:'var(--green)', value: html`${cur.ventas}<small>${cur.ventas === 1 ? 'coche' : 'coches'}</small>`, delta: P.delta(cur.ventas, prev.ventas * fr), sub:`${App.eur(cur.facturacion)} facturados`, spark: App.chart.spark(proy('ventas'), {color:'var(--green)', w: 84, h: 30})})}
    ${ui.kpi({label:'Margen del mes', icon:'wallet', color:'var(--cyan)', value: App.eur(cur.margen), delta: P.delta(cur.margen, prev.margen * fr), sub:`${App.eur(cur.margen / Math.max(cur.ventas, 1))} por coche`, spark: App.chart.spark(proy('margen'), {color:'var(--cyan)', w: 84, h: 30})})}
    ${ui.kpi({label:'Tiempo de respuesta', icon:'timer', color:'var(--pink)', value: P.durSeg(resp), sub: html`${ui.ia('IA')}<span>antes ${P.durMin(antes)}</span>`})}
    ${ui.kpi({label:'Coches en stock', icon:'car', color:'var(--amber)', value: App.num(stock.length), sub: html`${diasMed} días de media${lentos ? html` · <span class="amber semi">${lentos} con +90 d</span>` : ''}`})}
  </div>`;
}

function iaCard() {
  const r = resumenIA();
  const cierre = (P.cuando(r.since) === 'ayer' ? 'Desde ayer' : 'Desde el ' + App.DIAS[r.since.getDay()]) + ' a las ' + P.hh(r.since);
  const stats = [
    ['messages-square', r.conversaciones, r.conversaciones === 1 ? 'conversación atendida' : 'conversaciones atendidas'],
    ['calendar-check', r.citas, r.citas === 1 ? 'cita agendada' : 'citas agendadas'],
    ['timer', r.respuesta ? P.durSeg(r.respuesta) : '—', 'de respuesta media'],
    ['moon', r.fuera, r.fuera === 1 ? 'mensaje fuera de horario' : 'mensajes fuera de horario'],
    ['user-check', r.humano, r.humano === 1 ? 'pasada a una persona' : 'pasadas a una persona']
  ];
  return html`<section class="in-ia" data-tour="ia-resumen">
    <div class="in-ia__head">
      <div class="in-ia__titles">
        <div class="in-ia__eyebrow">${ui.ia('Asistente IA')}<span class="in-ia__live"><i class="live-dot"></i>Activo 24 h</span></div>
        <h2>Mientras no estabas, la IA…</h2>
        <p>${cierre} · WhatsApp, portales e Instagram</p>
      </div>
      <button class="in-ia__cta" data-act="go" data-href="#/whatsapp">Ver conversaciones${icon('arrow-right', 15)}</button>
    </div>
    <div class="in-ia__stats">${stats.map(([ic, n, l], i) => html`<div class="in-ia__stat ${i === 1 ? 'is-hl' : ''}">${icon(ic, 15)}<b class="tnum">${n}</b><span>${l}</span></div>`)}</div>
    ${r.ejemplos.length ? html`<div class="in-ia__list">${r.ejemplos.map(e => html`<button class="in-ia__ex" data-act="whatsapp" data-id="${e.c.id}">
        ${App.avatar(e.c.nombre, {wa: true})}
        <span class="in-ia__txt">${e.texto}</span>
        <span class="in-ia__meta"><span class="in-ia__chip ${e.chip.cls ? 'is-' + e.chip.cls : ''}">${icon(e.chip.ic, 12)}${e.chip.txt}</span><span class="in-ia__go">${icon('chevron-right', 16)}</span></span>
      </button>`)}</div>` : html`<div class="in-ia__empty">${icon('moon', 16)}Noche tranquila: ningún mensaje desde el cierre.</div>`}
  </section>`;
}

function atencionCard() {
  const items = atencion();
  const N = 7, shown = st.atencionTodo ? items : items.slice(0, N);
  return html`<section class="card in-card" data-tour="atencion" data-in="atencion">
    ${P.cardHead({ic:'bell-ring', color:'var(--red)', title:'Necesitan atención', sub: items.length ? `${P.n(items.length, 'cosa', 'cosas')} por resolver` : 'Todo al día', right: items.length ? html`<span class="badge badge--red">${items.length}</span>` : ''})}
    ${items.length ? html`<div class="in-at-list">${shown.map(it => html`<div class="in-at">
        ${P.icoTile(it.ic, it.color, 15)}
        <div class="in-at__main"><div class="in-at__title">${it.title}</div><div class="in-at__sub">${it.sub}</div></div>
        <div class="in-at__btn">${it.btn}</div>
      </div>`)}</div>
      ${items.length > N ? html`<div class="card__foot in-foot"><button class="link-btn" data-act="in-atencion-todo">${st.atencionTodo ? 'Ver menos' : `Ver ${items.length - N} más`}${icon(st.atencionTodo ? 'chevron-up' : 'chevron-down', 15)}</button></div>` : ''}`
    : ui.empty('circle-check', 'Nada pendiente', 'Conversaciones, citas y papeles están al día.')}
  </section>`;
}

function agendaCard(S) {
  const now = new Date();
  const evs = db.eventosDia(now);
  const hechas = evs.filter(e => e.estado === 'hecha').length;
  const nextIdx = evs.findIndex(e => new Date(e.inicio) > now);
  const nowRow = html`<div class="in-now"><span class="in-now__t tnum">${P.hh(now)}</span><span class="in-now__dot"></span><span class="in-now__line"></span><span class="in-now__lbl">Ahora</span></div>`;
  const row = (e, i) => {
    const c = db.contact(e.contactId), v = db.veh(e.vehicleId), u = db.user(e.userId), tipo = C.TIPOS_EV[e.tipo] || C.TIPOS_EV.visita;
    const ini = new Date(e.inicio), pasado = ini <= now;
    const dur = Math.round((new Date(e.fin) - ini) / 6e4);
    const done = ['hecha','no_vino'].includes(e.estado);
    const btns = [];
    if (e.estado === 'pendiente' && !pasado) btns.push(html`<button class="btn btn--xs" data-act="in-ev-confirmar" data-id="${e.id}">${icon('check', 13)}Confirmar</button>`);
    if (!done && pasado) btns.push(html`<button class="btn btn--xs" data-act="in-ev-hecha" data-id="${e.id}" title="Marcar como hecha">${icon('check', 13)}Hecha</button>`);
    if (!done && !pasado && e.estado === 'confirmada' && c) btns.push(html`<button class="icon-btn in-ev__wa" data-act="whatsapp" data-id="${c.id}" title="Escribir por WhatsApp" aria-label="WhatsApp">${icon('message-circle', 16)}</button>`);
    return html`<div class="in-ev ${done ? 'is-done' : ''} ${i === nextIdx ? 'is-next' : ''}" style="--c:${tipo.color}">
      <div class="in-ev__time tnum"><b>${App.hora(e.inicio)}</b><span>${dur} min</span></div>
      <div class="in-ev__rail"><i></i></div>
      <div class="in-ev__card">
        ${v ? html`<button class="in-ev__img" data-act="vehiculo" data-id="${v.id}" aria-label="Ver ${ui.vehNombre(v)}"><img src="${ui.img(v)}" alt=""></button>` : html`<span class="in-ev__img in-ev__img--ico">${icon(tipo.icon, 18)}</span>`}
        <div class="in-ev__main">
          <div class="in-ev__tags">${ui.evTipo(e.tipo)}${e.origen === 'ia' ? ui.ia('Agendada por IA') : ''}</div>
          ${c ? html`<button class="in-ev__who" data-act="contacto" data-id="${c.id}">${P.corto(c.nombre)}</button>` : html`<span class="in-ev__who">${e.titulo}</span>`}
          <span class="in-ev__sub">${[v ? ui.vehNombre(v) : (c ? e.titulo : ''), u ? (u.id === App.S.me ? 'contigo' : 'con ' + P.nombre(u.nombre)) : ''].filter(Boolean).join(' · ')}</span>
        </div>
        <div class="in-ev__side">
          ${ui.estado('ESTADOS_EV', e.estado)}
          ${btns.length ? html`<div class="in-ev__btns">${btns}</div>` : ''}
        </div>
      </div>
    </div>`;
  };
  const rows = [];
  evs.forEach((e, i) => { if (i === nextIdx) rows.push(nowRow); rows.push(row(e, i)); });
  if (evs.length && nextIdx === -1) rows.push(nowRow);
  return html`<section class="card in-card" data-tour="hoy" data-in="hoy">
    ${P.cardHead({ic:'calendar-days', color:'var(--violet)', title:'Hoy en la agenda', sub: evs.length ? `${App.cap(App.fechaLarga(now))} · ${P.n(evs.length, 'cita', 'citas')} · ${hechas} ${hechas === 1 ? 'hecha' : 'hechas'}` : App.cap(App.fechaLarga(now)),
      right: html`<button class="btn btn--sm btn--ghost hide-m" data-act="go" data-href="#/agenda">Ver agenda</button><button class="btn btn--sm" data-act="nuevo" data-what="cita">${icon('plus', 15)}Cita</button>`})}
    ${evs.length ? html`<div class="in-tl">${rows}</div>` : html`<div class="in-empty-agenda">${ui.empty('calendar-check', 'Hoy no hay citas', 'Buen momento para llamar a los leads nuevos o revisar los coches parados.', html`<button class="btn btn--sm" data-act="nuevo" data-what="cita">${icon('plus', 15)}Agendar una cita</button>`)}</div>`}
  </section>`;
}

function embudoCard(S) {
  const cur = P.mesActual(S);
  const pasos = P.embudo(cur), max = pasos[0].n || 1;
  const COL = ['var(--accent)', 'var(--cyan)', 'var(--violet)', 'var(--amber)', 'var(--green)'];
  const mes = App.MESES[new Date().getMonth()];
  return html`<section class="card in-card" data-in="embudo">
    ${P.cardHead({ic:'filter', color:'var(--accent)', title:'Embudo del mes', sub:`De lead a venta · ${mes}`})}
    <div class="card__body in-fun">
      ${pasos.map((p, i) => html`<div class="in-fun__row">
        <span class="in-fun__lbl">${p.label}</span>
        <div class="in-fun__track"><i style="width:${Math.max(p.n / max * 100, 4).toFixed(1)}%;background:${COL[i]}"></i></div>
        <b class="in-fun__n tnum">${App.num(p.n)}</b>
        <span class="in-fun__pct tnum ${i ? '' : 'is-first'}">${i ? P.pct(p.n, pasos[i - 1].n) + ' %' : '100 %'}</span>
      </div>`)}
    </div>
    <div class="card__foot in-foot"><span class="small muted"><b class="ink">${P.pct(cur.ventas, cur.leads)} de cada 100</b> leads compran</span><button class="link-btn" data-act="go" data-href="#/informes">Informes${icon('arrow-right', 14)}</button></div>
  </section>`;
}

function origenCard(S) {
  const cur = S.hist[S.hist.length - 1];
  const orig = P.origenMes(cur);
  const parts = P.ORIGENES.map(id => ({id, name: P.origenInfo(id).label, value: orig[id] || 0, color: id === 'web' ? 'var(--ink)' : P.origenInfo(id).color})).filter(p => p.value).sort((a, b) => b.value - a.value);
  const tot = App.sum(parts, p => p.value);
  return html`<section class="card in-card" data-in="origen">
    ${P.cardHead({ic:'globe', color:'var(--cyan)', title:'Leads por origen', sub:`${App.num(tot)} este mes`})}
    <div class="card__body in-org">
      <div class="in-org__donut">${App.chart.donut(parts, {size: 118, stroke: 16, center: App.num(tot), sub: 'leads'})}</div>
      <ul class="in-org__legend">${parts.map(p => html`<li>
        ${p.id === 'otros' ? html`<span class="portal portal--sm" style="background:${p.color}">+</span>` : ui.portal(p.id, 'sm')}
        <span class="in-org__name">${p.name}</span><b class="tnum">${p.value}</b><span class="in-org__pct tnum">${P.pct(p.value, tot)} %</span>
      </li>`)}</ul>
    </div>
  </section>`;
}

function paradosCard(S) {
  const lista = db.stock().filter(v => v.estado === 'disponible').sort((a, b) => db.diasStock(b) - db.diasStock(a)).slice(0, 5);
  return html`<section class="card in-card" data-in="parados">
    ${P.cardHead({ic:'hourglass', color:'var(--amber)', title:'Coches que no se mueven', sub:'Más días en stock y precio sugerido'})}
    <div class="in-park">${lista.map(v => {
      const sug = P.sugerido(v), hoy = P.rebajadoHoy(v);
      return html`<div class="in-park__row" data-act="vehiculo" data-id="${v.id}" role="button" tabindex="0">
        <img class="thumb" src="${ui.img(v)}" alt="">
        <div class="in-park__main"><b>${ui.vehNombre(v)}</b><span class="in-park__sub">${ui.dias(v)}<span>${v.anio}</span></span></div>
        <div class="in-park__side">
          <span class="in-park__price tnum">${App.eur(v.precio)}</span>
          ${hoy ? html`<span class="in-park__sug is-done">${icon('check', 12)}Rebajado hoy</span>`
            : sug ? html`<button class="btn btn--xs in-park__btn" data-act="in-rebaja" data-id="${v.id}" title="Aplicar el precio sugerido">${icon('trending-down', 13)}${App.eur(sug)}</button>`
            : html`<span class="in-park__sug">Precio en mercado</span>`}
        </div>
      </div>`;
    })}</div>
    <div class="card__foot in-foot"><span class="small muted">${icon('trending-down', 13)} Precio sugerido: pulsa para aplicarlo</span><button class="link-btn" data-act="go" data-href="#/stock">Stock${icon('arrow-right', 14)}</button></div>
  </section>`;
}

function rankingCard(S) {
  const cur = S.hist[S.hist.length - 1], now = new Date(), m0 = App.startOfMonth(now);
  const coms = P.comerciales();
  const enMes = d => new Date(d) >= m0;
  const realV = coms.map(u => db.vendidos().filter(v => v.vendedor === u.id && enMes(v.fechaVenta)));
  const ventas = P.reparto(cur.ventas, realV.map(x => x.length + .5));
  const margen = P.reparto(cur.margen, realV.map(x => App.sum(x, v => db.margen(v)) + 1));
  const citas = P.reparto(cur.citas, coms.map(u => S.events.filter(e => e.userId === u.id && enMes(e.inicio) && ['prueba','visita','tasacion'].includes(e.tipo)).length + .5));
  const leads = P.reparto(cur.leads, coms.map(u => S.contacts.filter(c => c.asignado === u.id && enMes(c.creado)).length + .5));
  const rows = coms.map((u, i) => ({u, ventas: ventas[i], margen: margen[i], citas: citas[i], leads: leads[i], conv: P.pct(ventas[i], leads[i])})).sort((a, b) => b.ventas - a.ventas || b.margen - a.margen);
  const maxV = Math.max(...rows.map(r => r.ventas), 1);
  // la IA como «compañera» del equipo (fuera del ranking)
  const iaCitas = S.events.filter(e => e.origen === 'ia' && enMes(e.inicio)).length;
  const iaConv = new Set(S.messages.filter(m => m.from === 'ia' && enMes(m.fecha)).map(m => m.contactId)).size;
  const auto = S.automations.find(a => a.id === 'ia_whatsapp');
  // objetivo: la media de los 3 meses cerrados, +10 %
  const H = S.hist, cerrados = H.slice(-4, -1);
  const objetivo = Math.max(Math.round(P.avg(cerrados, h => h.ventas) * 1.1), cur.ventas + 1);
  const diasMes = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const ritmo = now.getDate() / diasMes;
  const vaBien = cur.ventas / objetivo >= ritmo - .05;
  return html`<section class="card in-card" data-in="ranking">
    ${P.cardHead({ic:'award', color:'var(--green)', title:'Ranking del mes', sub:'Comerciales · ' + App.MESES[now.getMonth()]})}
    <div class="in-rank">${rows.map((r, i) => html`<div class="in-rank__row">
      <span class="in-rank__pos ${i === 0 ? 'is-first' : ''}">${i + 1}</span>
      ${App.avatar(r.u.nombre, {color: r.u.color})}
      <div class="in-rank__main">
        <div class="between"><b>${P.corto(r.u.nombre)}</b><span class="in-rank__v tnum"><b>${r.ventas}</b> ${r.ventas === 1 ? 'venta' : 'ventas'}</span></div>
        <div class="progress in-rank__bar"><i style="width:${(r.ventas / maxV * 100).toFixed(1)}%;background:${r.u.color === '#0B0F19' ? 'var(--ink)' : r.u.color}"></i></div>
        <div class="in-rank__stats"><span><b class="tnum">${r.citas}</b> citas</span><span><b class="tnum">${r.conv} %</b> conversión</span><span><b class="tnum">${App.eur(r.margen)}</b> margen</span></div>
      </div>
    </div>`)}
      <div class="in-rank__row in-rank__row--ia">
        <span class="in-rank__pos">${icon('sparkles', 12)}</span>
        <span class="in-rank__iav">${icon('bot', 18)}</span>
        <div class="in-rank__main">
          <div class="between"><b>Asistente IA</b>${auto && auto.on ? ui.ia('Fuera de concurso') : html`<span class="badge">Pausada</span>`}</div>
          <div class="in-rank__stats"><span><b class="tnum">${iaConv}</b> conversaciones</span><span><b class="tnum">${iaCitas}</b> citas agendadas</span></div>
        </div>
      </div>
    </div>
    <div class="card__foot in-foot in-goal">
      <div class="grow">
        <div class="between small"><span class="muted">Objetivo de ${App.MESES[now.getMonth()]}</span><span class="tnum"><b class="ink">${cur.ventas}</b><span class="muted"> de ${objetivo} ventas</span></span></div>
        <div class="in-goal__bar"><i style="width:${Math.min(cur.ventas / objetivo * 100, 100).toFixed(1)}%"></i><em style="left:${(ritmo * 100).toFixed(1)}%" title="Hoy"></em></div>
        <div class="xs ${vaBien ? 'green' : 'amber'} semi mt-4">${vaBien ? 'Vais al ritmo del objetivo' : `Faltan ${objetivo - cur.ventas} en ${diasMes - now.getDate()} días`}</div>
      </div>
    </div>
  </section>`;
}

function tareasCard(S) {
  const today = App.today(), me = S.me;
  const base = S.tasks.filter(t => App.isToday(t.fecha) || (new Date(t.fecha) < today && !t.hecha));
  const lista = (st.tareas === 'mias' ? base.filter(t => t.userId === me) : base).slice().sort((a, b) => (a.hecha - b.hecha) || a.fecha.localeCompare(b.fecha));
  const hechas = lista.filter(t => t.hecha).length;
  return html`<section class="card in-card" data-in="tareas">
    ${P.cardHead({ic:'list-checks', color:'var(--accent)', title:'Tareas de hoy', sub: lista.length ? `${hechas} de ${lista.length} hechas` : 'Sin tareas',
      right: html`<div class="seg in-seg"><button class="${st.tareas === 'mias' ? 'is-on' : ''}" data-act="in-tareas" data-v="mias">Mías</button><button class="${st.tareas === 'equipo' ? 'is-on' : ''}" data-act="in-tareas" data-v="equipo">Equipo</button></div><button class="btn btn--sm btn--icon" data-act="nuevo" data-what="tarea" title="Nueva tarea" aria-label="Nueva tarea">${icon('plus', 16)}</button>`})}
    ${lista.length ? html`<div class="progress progress--green in-task-prog"><i style="width:${P.pct(hechas, lista.length)}%"></i></div>
      <div class="in-tasks">${lista.map(t => {
        const u = db.user(t.userId), c = db.contact(t.contactId), v = db.veh(t.vehicleId), tarde = !t.hecha && new Date(t.fecha) < today;
        return html`<div class="in-task ${t.hecha ? 'is-done' : ''}">
          <button class="in-task__chk" data-act="tarea-toggle" data-id="${t.id}" aria-label="${t.hecha ? 'Marcar como pendiente' : 'Marcar como hecha'}">${icon('check', 13)}</button>
          <div class="in-task__main">
            <span class="in-task__txt">${t.texto}</span>
            <div class="in-task__meta">
              ${u ? html`<span class="row-sm">${App.avatar(u.nombre, {size:'sm', color: u.color})}<span>${u.id === me ? 'Tú' : P.nombre(u.nombre)}</span></span>` : ''}
              ${c ? html`<button class="in-task__link" data-act="contacto" data-id="${c.id}">${icon('user', 12)}${P.corto(c.nombre)}</button>` : v ? html`<button class="in-task__link" data-act="vehiculo" data-id="${v.id}">${icon('car', 12)}${ui.vehNombre(v)}</button>` : ''}
              ${tarde ? html`<span class="badge badge--red">${App.cap(P.cuando(t.fecha))}</span>` : ''}
            </div>
          </div>
        </div>`;
      })}</div>`
    : ui.empty('circle-check', st.tareas === 'mias' ? 'No tienes tareas para hoy' : 'Sin tareas para hoy', 'Crea una y aparecerá aquí.', html`<button class="btn btn--sm" data-act="nuevo" data-what="tarea">${icon('plus', 15)}Nueva tarea</button>`)}
  </section>`;
}

function actividadCard(S) {
  const ICOL = {bot:'var(--violet)', zap:'var(--accent)', repeat:'var(--cyan)', 'bell-ring':'var(--amber)', hourglass:'var(--amber)', 'message-circle':'var(--wa-dark)', 'calendar-check':'var(--violet)', 'calendar-plus':'var(--violet)', 'badge-euro':'var(--green)', 'trending-down':'var(--pink)', 'user-plus':'var(--accent)', 'file-text':'var(--pink)'};
  const acts = S.activity.slice(0, 7);
  return html`<section class="card in-card" data-in="actividad">
    ${P.cardHead({ic:'activity', color:'var(--ink-2)', title:'Actividad reciente', sub:'Lo último del equipo y la IA'})}
    ${acts.length ? html`<div class="in-acts">${acts.map(a => html`<div class="in-act ${a.link ? 'is-link' : ''}" ${a.link ? raw(`data-act="go" data-href="${App.esc(a.link)}" role="button" tabindex="0"`) : ''}>
      <span class="in-act__ico" style="--c:${ICOL[a.icon] || 'var(--ink-3)'}">${icon(a.icon || 'activity', 14)}</span>
      <span class="in-act__txt">${a.texto}</span>
      <span class="in-act__time">${App.rel(a.fecha)}</span>
    </div>`)}</div>` : ui.empty('activity', 'Sin actividad todavía', '')}
  </section>`;
}

/* ---------- vista ---------- */
App.views.inicio = {
  title: 'Inicio',
  deps: ['*'],
  render() {
    const S = App.S;
    return P.nb(html`<div class="in">
      ${head(S)}
      <div class="in-body">
        ${kpis(S)}
        <div class="in-layout">
          <div class="in-col in-col--main">
            ${iaCard()}
            ${agendaCard(S)}
            <div class="in-pair in-pair--a">${embudoCard(S)}${origenCard(S)}</div>
            <div class="in-pair in-pair--b">${paradosCard(S)}${rankingCard(S)}</div>
          </div>
          <div class="in-col in-col--side">
            ${atencionCard()}
            ${tareasCard(S)}
            ${actividadCard(S)}
          </div>
        </div>
      </div>
    </div>`);
  },
  mount(root) {
    // accesibilidad: filas con role=button responden a Enter
    root.addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.matches('[role="button"][data-act]')) { e.preventDefault(); App.runAct(e.target, e); } });
  },
  actions: {
    'in-ev-confirmar'(el) {
      const e = db.event(el.dataset.id); if (!e) return;
      const c = db.contact(e.contactId);
      db.updateEvent(e.id, {estado: 'confirmada'});
      App.toast('Cita confirmada', {sub: (c ? P.corto(c.nombre) + ' · ' : '') + `${P.cuando(e.inicio)} a las ${P.hh(e.inicio)}${c ? ' · aviso enviado por WhatsApp' : ''}`, tipo: c ? 'wa' : 'ok', icon: 'calendar-check'});
    },
    'in-ev-hecha'(el) {
      const e = db.event(el.dataset.id); if (!e) return;
      const c = db.contact(e.contactId);
      db.log(`${C.TIPOS_EV[e.tipo].short} hecha: ${e.titulo}`, {icon: 'calendar-check', link: c ? '#/leads/' + c.id : '#/agenda'});
      db.updateEvent(e.id, {estado: 'hecha'});
      App.toast(`${C.TIPOS_EV[e.tipo].short} marcada como hecha`, {sub: c ? c.nombre : e.titulo, accion: c ? 'Ver ficha' : '', onAccion: () => c && App.open.contacto(c.id)});
    },
    'in-atencion-todo'() { st.atencionTodo = !st.atencionTodo; App.render({keepScroll: true}); },
    'in-tareas'(el) { st.tareas = el.dataset.v; App.render({keepScroll: true}); },
    'in-pedir-docs'(el) {
      const f = App.S.financings.find(x => x.id === el.dataset.id); if (!f) return;
      const c = db.contact(f.contactId); if (!c) return;
      const DOC = {dni:'el DNI por las dos caras', nomina:'la última nómina', banco:'un extracto del banco'};
      const faltan = P.lista(Object.keys(DOC).filter(k => !f.docs[k]).map(k => DOC[k]));
      st.pedidos.add(f.id);
      db.addTimeline(c.id, {tipo: 'financiacion', texto: `Documentación pedida por WhatsApp (${f.entidad})`});
      db.addMessage(c.id, {from: 'agente', texto: `Hola ${P.nombre(c.nombre)} 👋 Para seguir con tu financiación con ${f.entidad} solo nos falta ${faltan}. Puedes mandarnos una foto por aquí mismo. ¡Gracias!`});
      App.toast('Documentación pedida por WhatsApp', {tipo: 'wa', sub: `${c.nombre} · ${f.entidad}`, accion: 'Ver chat', onAccion: () => App.open.whatsapp(c.id)});
    },
    'in-rebaja'(el) {
      const v = db.veh(el.dataset.id); if (!v) return;
      const nuevo = P.sugerido(v); if (!nuevo) return;
      const antes = {precio: v.precio, precioMin: v.precioMin, precioHistorial: (v.precioHistorial || []).slice()};
      const interesados = db.leadsDe(v.id).filter(c => !['vendido','perdido'].includes(c.etapa)).length;
      const aviso = (App.S.automations.find(a => a.id === 'bajada_precio') || {}).on;
      db.log(`Rebaja: ${ui.vehNombre(v)} de ${App.eur(antes.precio)} a ${App.eur(nuevo)}`, {icon: 'trending-down', link: '#/stock/' + v.id});
      db.updateVehicle(v.id, {precio: nuevo, precioMin: Math.round(nuevo * .955 / 100) * 100, precioHistorial: antes.precioHistorial.concat([{fecha: new Date().toISOString(), precio: antes.precio}])});
      App.toast(`${ui.vehNombre(v)} rebajado a ${App.eur(nuevo)}`, {icon: 'trending-down',
        sub: aviso && interesados ? `Portales actualizados y aviso por WhatsApp a ${P.n(interesados, 'interesado', 'interesados')}` : 'Precio actualizado en la web y en los portales',
        accion: 'Deshacer', onAccion: () => { db.updateVehicle(v.id, antes); App.toast('Rebaja deshecha', {sub: `${ui.vehNombre(v)} vuelve a ${App.eur(antes.precio)}`, icon: 'undo-2'}); }});
    }
  }
};
})();
