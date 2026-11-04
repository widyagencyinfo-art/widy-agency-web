/* =====================================================================
   Automatizaciones (#/automatizaciones) — lo que el CRM hace solo.
   Resumen + horas ahorradas por área + tarjetas por grupo con interruptor
   y un panel «Ver cómo funciona» (flujo, mensaje de ejemplo, ejecuciones).
   ===================================================================== */
(function(){
const App = window.App;
const {html, raw, icon, db, C, ui} = App;
const P = App.panel;
const st = {grupo: 'todas', pruebas: {}};
let abierto = null;   // {node, id} del panel abierto

const GRUPOS = [
  {id:'Atención', color:'var(--violet)', icon:'messages-square', desc:'Que ningún cliente espere'},
  {id:'Citas', color:'var(--accent)', icon:'calendar-check', desc:'Que vengan a la cita'},
  {id:'Ventas', color:'var(--pink)', icon:'handshake', desc:'Que el «me lo pienso» no se enfríe'},
  {id:'Stock', color:'var(--amber)', icon:'car', desc:'Que los coches roten'},
  {id:'Postventa', color:'var(--green)', icon:'star', desc:'Que vuelvan y te recomienden'},
  {id:'Gestión', color:'var(--cyan)', icon:'bar-chart-3', desc:'Que sepas cómo va todo'}
];
const grupo = id => GRUPOS.find(g => g.id === id) || {id, color:'var(--ink-3)', icon:'zap', desc:''};

/* mensajes aproximados que genera cada automatización por ejecución */
function mensajes30() {
  const S = App.S;
  const ia = S.messages.filter(m => m.from === 'ia');
  const porConv = ia.length / Math.max(new Set(ia.map(m => m.contactId)).size, 1);
  const F = {ia_whatsapp: porConv, recordatorio: 2, seguimiento48: 1, bajada_precio: 4, resena: 1.6, revision: 1, cumple: 1};
  return Math.round(App.sum(S.automations, a => (a.n30 || 0) * (F[a.id] || 0)));
}

/* ---------- ejemplos y flujos ---------- */
const vEj = () => db.veh('144b15bb') || db.stock()[0];
const ultimo = (auto) => App.S.messages.filter(m => m.auto === auto).pop();
function flujo(a) {
  const S = App.S, d = S.dealer;
  const v = vEj(), lento = db.stock().filter(x => x.estado === 'disponible').sort((x, y) => db.diasStock(y) - db.diasStock(x))[0];
  const conHist = db.stock().find(x => (x.precioHistorial || []).length) || lento;
  const leadPortal = S.contacts.filter(c => C.PORTALES.includes(c.origen)).sort((x, y) => y.creado.localeCompare(x.creado))[0];
  const nom = c => c ? P.nombre(c.nombre) : 'Carlos';
  const F = {
    ia_whatsapp: {
      trigger: ['message-circle', 'Un cliente escribe', 'Por WhatsApp, desde un portal o desde Instagram. A cualquier hora, también de noche y en festivos.'],
      cond: [['sparkles', 'Entiende qué pide', 'Precio, cuota, disponibilidad, garantía, cita o coche a cuenta.'], ['user-check', '¿Quiere negociar o cerrar?', 'Entonces pasa la conversación al comercial y le avisa en el móvil.']],
      acts: [['car', 'Contesta con los datos del coche', 'Precio, kilómetros, garantía y cuota con la entrada que diga el cliente.'], ['calendar-check', 'Agenda la prueba', 'Solo en huecos libres del comercial, y queda en Google Calendar.'], ['user', 'Actualiza la ficha', 'Etapa, coche de interés y próxima acción.']],
      in: `Hola, ¿el ${ui.vehNombre(v)} se puede financiar sin entrada?`,
      out: `¡Hola! Sí 🙌 El ${ui.vehNombre(v)} ${v.version.split(' ').slice(0, 2).join(' ')} de ${v.anio} está a ${App.eur(v.precio)} o desde ${db.cuota(v.precio, 0, 96)} €/mes sin entrada (96 meses, TIN ${App.dec(d.tin)} %).\n\n¿Quieres venir a probarlo? Mañana tengo hueco a las 17:30 o a las 18:30.`
    },
    portales_crm: {
      trigger: ['inbox', 'Entra un lead en un portal', 'coches.net, Wallapop, Milanuncios, AutoScout24, Marketplace o la web.'],
      cond: [['search', '¿Ya es cliente?', 'Busca por teléfono y email para no duplicar fichas.']],
      acts: [['user-plus', 'Crea o actualiza la ficha', 'Con el coche que le interesa y de dónde viene.'], ['bot', 'La IA le escribe al momento', 'Por WhatsApp, si ha dejado el teléfono.'], ['bell', 'Avisa al comercial', 'Notificación en el móvil con el resumen.']],
      out: `🔔 Nuevo lead de ${leadPortal ? C.origen(leadPortal.origen).label : 'Wallapop'}\n${nom(leadPortal)} pregunta por el ${leadPortal ? ui.vehNombre(db.veh(leadPortal.interes[0])) : 'Jeep Renegade'}.\nYa le ha contestado la IA. Asignado a ${leadPortal ? P.nombre(db.user(leadPortal.asignado).nombre) : 'Javier'}.`, aviso: true
    },
    reparto: {
      trigger: ['zap', 'Entra un lead nuevo', 'De cualquier portal, de la web o por teléfono.'],
      cond: [['clock', '¿Quién está trabajando?', 'Según el horario y las vacaciones del equipo.'], ['repeat', 'Por turnos', 'Reparte a partes iguales entre los comerciales.']],
      acts: [['user-check', 'Asigna el lead', 'Aparece en su lista y en su móvil.'], ['timer', 'Si en 15 minutos nadie lo atiende…', 'Avisa a la gerente para que no se enfríe.']],
      out: `👋 Rocío, te toca: ${nom(S.contacts.find(c => c.id === 'c5'))} pregunta por el SEAT Ibiza (Milanuncios). La IA ya le ha contestado; llámala cuando puedas.`, aviso: true
    },
    recordatorio: {
      trigger: ['calendar', 'Hay una cita en la agenda', 'Prueba, visita, tasación o entrega.'],
      cond: [['clock', '24 h y 2 h antes', 'Los dos avisos salen solos.'], ['circle-check', '¿Ha confirmado?', 'Si no contesta, avisa al comercial para que le llame.']],
      acts: [['send', 'WhatsApp al cliente', 'Con el día, la hora y qué traer.'], ['map-pin', 'Ubicación en Google Maps', 'Para que llegue sin perderse.']],
      out: (ultimo('recordatorio') || {}).texto || `Hola 👋 Te recuerdo tu cita de mañana a las 11:00 en ${d.direccion}. ¡Nos vemos!`
    },
    seguimiento48: {
      trigger: ['file-text', 'Recibe un presupuesto o prueba un coche', 'Queda registrado en su ficha.'],
      cond: [['hourglass', 'Pasan 48 h sin respuesta', 'Ni mensajes ni llamadas.'], ['circle-x', 'No está vendido ni perdido', 'Si ya decidió, no molesta.']],
      acts: [['send', 'Le escribe con una razón para volver', 'Otro interesado, cuota sin entrada o tasación de su coche.'], ['phone', 'Si tampoco contesta…', 'Crea una tarea de llamada para el comercial.']],
      out: (ultimo('seguimiento48h') || {}).texto || 'Hola 👋 ¿Pudiste ver el presupuesto? Si quieres, te lo dejamos reservado con 300 € de señal.'
    },
    bajada_precio: {
      trigger: ['trending-down', 'Rebajas un coche', 'Desde su ficha o desde la alerta de coche parado.'],
      cond: [['users', 'Busca a quién le interesó', 'Leads activos y los que se perdieron por precio.']],
      acts: [['send', 'WhatsApp a cada interesado', 'Con el precio anterior y el nuevo.'], ['globe', 'Actualiza los portales', 'Web, coches.net, Wallapop y el resto a la vez.']],
      out: `Hola 👋 El ${ui.vehNombre(conHist)} que te interesaba ha bajado de precio: ahora ${App.eur(conHist.precio)}${(conHist.precioHistorial || []).length ? ` (antes ${App.eur(conHist.precioHistorial[conHist.precioHistorial.length - 1].precio)})` : ''}. ¿Te lo reservo para verlo esta semana?`
    },
    stock_parado: {
      trigger: ['hourglass', 'Un coche cumple 60 días en stock', 'Y otra vez a los 90.'],
      cond: [['scale', 'Lo compara con el mercado', 'Mismo modelo, año y kilómetros en los portales.']],
      acts: [['bell', 'Te avisa con un precio sugerido', 'Y cuántos anuncios parecidos hay.'], ['list-checks', 'Crea la tarea «Revisar precio»', 'Para la gerente.']],
      out: `⏳ El ${ui.vehNombre(lento)} lleva ${db.diasStock(lento)} días en stock. Hay 14 anuncios parecidos. Precio sugerido: ${App.eur(P.sugerido(lento) || lento.precio)}${P.sugerido(lento) ? ` (−${App.eur(lento.precio - P.sugerido(lento))})` : ''}.`, aviso: true
    },
    publicacion: {
      trigger: ['car', 'Das de alta un coche', 'Con sus fotos y su precio.'],
      cond: [['image', '¿Fotos listas?', 'Mejora el fondo y las ordena: frontal primero.']],
      acts: [['globe', 'Lo publica en los portales elegidos', 'Con la descripción y el equipamiento.'], ['badge-check', 'Al venderlo, lo retira de todos', 'Sin llamadas de un coche que ya no tienes.']],
      out: `✅ ${ui.vehNombre(v)} publicado en la web, coches.net, Wallapop y Marketplace. Te aviso con el primer interesado.`, aviso: true
    },
    resena: {
      trigger: ['handshake', 'Entregas un coche', 'Queda marcado como vendido.'],
      cond: [['clock', 'Pasan 3 días', 'Tiempo para estrenarlo.'], ['smile', '¿Está contento?', 'Si responde con una queja, avisa a la gerente y no pide reseña.']],
      acts: [['star', 'Le pide la reseña en Google', 'Con el enlace directo para dejarla en un minuto.']],
      out: (ultimo('resena') || {}).texto || 'Hola 😊 ¿Qué tal con el coche? Si estás contento, nos ayudaría mucho una reseña en Google.', reply: 'Hecho, 5 estrellas'
    },
    revision: {
      trigger: ['wrench', 'Se acerca la revisión o la ITV', 'Según la fecha de compra y la de la ITV.'],
      cond: [['calendar', '30 días antes', 'Con margen para encontrar hueco.']],
      acts: [['send', 'Avisa al cliente', 'Por WhatsApp, con lo que le toca.'], ['calendar-plus', 'Le da cita en el taller', 'Si acepta, queda en la agenda de Manuel.']],
      out: 'Hola 👋 A tu Toyota Yaris le toca la revisión del primer año. ¿Te viene bien el jueves a las 9:30 en nuestro taller? Dura una hora y te lo lavamos.'
    },
    informe: {
      trigger: ['calendar-days', 'Cada lunes a las 8:00', 'Antes de abrir.'],
      cond: [],
      acts: [['bar-chart-3', 'Resume la semana', 'Ventas, leads, citas, margen y coches parados.'], ['mail', 'Lo envía a la gerente', 'Por WhatsApp y por email.']],
      out: (() => { const h = S.hist[S.hist.length - 2]; return `📊 Tu semana en ${d.corto}\n• ${Math.round(h.ventas / 4)} ventas · ${App.eur(h.margen / 4)} de margen\n• ${Math.round(h.leads / 4)} leads · respuesta media ${P.durMin(h.respuestaMin)}\n• ${Math.round(h.citas / 4)} citas\n• ${db.stock().filter(x => db.diasStock(x) > 90).length} coches con más de 90 días`; })(), aviso: true
    },
    cumple: {
      trigger: ['gift', 'Se cumple un año de la compra', 'Con cada cliente.'],
      cond: [['circle-check', 'Sin incidencias abiertas', 'Si hay algo pendiente, no se envía.']],
      acts: [['send', 'Le felicita', 'Y le ofrece tasar su coche por si quiere cambiarlo.']],
      out: '¡Feliz primer año con tu MINI Cooper! 🎉 Si te estás pensando cambiarlo, te lo tasamos gratis en 20 minutos y sin compromiso.'
    }
  };
  return F[a.id] || {trigger: [a.icono, a.nombre, a.desc], cond: [], acts: [], out: a.desc};
}

function ejecuciones(a) {
  const S = App.S, now = Date.now();
  const r = [];
  const add = (fecha, texto, ic, link) => { if (new Date(fecha).getTime() <= now) r.push({fecha: new Date(fecha).toISOString(), texto, icon: ic, link}); };
  const nombre = id => { const c = db.contact(id); return c ? P.corto(c.nombre) : 'cliente'; };
  const portal = S.contacts.filter(c => C.PORTALES.includes(c.origen) || c.origen === 'meta').sort((x, y) => y.creado.localeCompare(x.creado));
  switch (a.id) {
    case 'ia_whatsapp': S.messages.filter(m => m.from === 'ia' && m.segundos).slice(-8).forEach(m => add(m.fecha, `Contestó a ${nombre(m.contactId)} en ${m.segundos} s`, 'bot', '#/whatsapp/' + m.contactId)); break;
    case 'portales_crm': portal.slice(0, 8).forEach(c => add(c.creado, `Lead de ${C.origen(c.origen).label}: ${P.corto(c.nombre)} · ${ui.vehNombre(db.veh(c.interes[0]))}`, 'inbox', '#/leads/' + c.id)); break;
    case 'reparto': portal.slice(0, 8).forEach(c => add(c.creado, `${P.corto(c.nombre)} → ${P.nombre((db.user(c.asignado) || {nombre: '—'}).nombre)}`, 'user-check', '#/leads/' + c.id)); break;
    case 'recordatorio':
      S.events.filter(e => e.recordatorio && e.contactId && new Date(e.inicio).getTime() - 2 * 36e5 <= now && new Date(e.inicio).getTime() > now - 3 * 864e5)
        .forEach(e => add(new Date(new Date(e.inicio).getTime() - 2 * 36e5), `Recordatorio a ${nombre(e.contactId)} · ${C.TIPOS_EV[e.tipo].short} ${P.cuando(e.inicio)} ${P.hh(e.inicio)}`, 'bell-ring', '#/leads/' + e.contactId));
      break;
    case 'seguimiento48':
      S.messages.filter(m => m.auto === 'seguimiento48h').forEach(m => add(m.fecha, `Seguimiento a ${nombre(m.contactId)} (48 h sin respuesta)`, 'repeat', '#/whatsapp/' + m.contactId));
      S.quotes.filter(q => ['enviado','visto'].includes(q.estado)).forEach(q => add(new Date(new Date(q.fecha).getTime() + 48 * 36e5), `Seguimiento a ${nombre(q.contactId)} · presupuesto ${q.numero}`, 'repeat', '#/presupuestos/' + q.id));
      break;
    case 'bajada_precio': S.vehicles.forEach(v => (v.precioHistorial || []).forEach(h => add(h.fecha, `${ui.vehNombre(v)}: ${App.eur(h.precio)} → ${App.eur(v.precio)} · aviso a ${P.n(Math.max(db.leadsDe(v.id).length, 1), 'interesado', 'interesados')}`, 'trending-down', '#/stock/' + v.id))); break;
    case 'stock_parado': db.stock().filter(v => db.diasStock(v) > 60).forEach(v => { add(App.addDays(v.fechaEntrada, 60), `${ui.vehNombre(v)} cumplió 60 días · precio sugerido`, 'hourglass', '#/stock/' + v.id); if (db.diasStock(v) > 90) add(App.addDays(v.fechaEntrada, 90), `${ui.vehNombre(v)} pasó de 90 días`, 'alert-triangle', '#/stock/' + v.id); }); break;
    case 'publicacion':
      db.stock().filter(v => v.estado !== 'preparacion').forEach(v => add(v.fechaEntrada, `Publicado: ${ui.vehNombre(v)} en ${Object.values(v.portales || {}).filter(p => p.on).length} portales`, 'globe', '#/stock/' + v.id));
      db.vendidos().forEach(v => add(v.fechaVenta, `Retirado de todos los portales: ${ui.vehNombre(v)} (vendido)`, 'badge-check', '#/stock/' + v.id));
      break;
    case 'resena':
      S.messages.filter(m => m.auto === 'resena').forEach(m => add(m.fecha, `Petición de reseña a ${nombre(m.contactId)} → dejó 5 ★`, 'star', '#/whatsapp/' + m.contactId));
      db.vendidos().filter(v => v.cliente && !S.messages.some(m => m.auto === 'resena' && m.contactId === v.cliente)).forEach(v => add(App.addDays(v.fechaVenta, 3), `Petición de reseña a ${nombre(v.cliente)} · ${ui.vehNombre(v)}`, 'star', '#/leads/' + v.cliente));
      break;
    case 'revision': S.events.filter(e => e.tipo === 'taller').forEach(e => add(App.addDays(e.inicio, -30), `Aviso de ${/itv/i.test(e.titulo) ? 'ITV' : 'revisión'} · ${e.titulo.split(' · ').pop()}`, 'wrench', '#/agenda')); break;
    case 'informe': { const lun = App.startOfWeek(new Date()); for (let i = 0; i < 6; i++) { const f = App.addDays(lun, -7 * i); f.setHours(8, 0, 0, 0); add(f, `Informe semanal enviado a ${P.nombre(db.me().nombre)}`, 'bar-chart-3', '#/informes'); } break; }
  }
  r.sort((x, y) => y.fecha.localeCompare(x.fecha));
  return (st.pruebas[a.id] || []).concat(r).slice(0, 7);
}

/* ---------- piezas ---------- */
function resumen(S) {
  const autos = S.automations, activas = autos.filter(a => a.on);
  const horas = App.sum(activas, a => a.ahorro);
  const porGrupo = GRUPOS.map(g => ({label: g.id, value: App.sum(activas.filter(a => a.grupo === g.id), a => a.ahorro), color: g.color})).filter(x => x.value).sort((a, b) => b.value - a.value);
  const msgs = mensajes30();
  return html`<section class="card au-hero">
    <div class="au-hero__stats">
      <div class="au-stat"><span class="au-stat__l">${icon('zap', 14)}Automatizaciones</span><b class="tnum">${autos.length}</b><span class="au-stat__s">${activas.length} activas · ${autos.length - activas.length} en pausa</span></div>
      <div class="au-stat au-stat--hl"><span class="au-stat__l">${icon('clock', 14)}Horas que ahorran</span><b class="tnum">${horas}<small> h/mes</small></b><span class="au-stat__s">≈ ${Math.round(horas / 8)} jornadas de trabajo</span></div>
      <div class="au-stat"><span class="au-stat__l">${icon('send', 14)}Mensajes enviados</span><b class="tnum">${App.num(msgs)}</b><span class="au-stat__s">en los últimos 30 días</span></div>
      <div class="au-stat"><span class="au-stat__l">${icon('activity', 14)}Ejecuciones</span><b class="tnum">${App.num(App.sum(autos, a => a.n30))}</b><span class="au-stat__s">en los últimos 30 días</span></div>
    </div>
    <div class="au-hero__chart">
      <div class="between"><h3>Horas ahorradas al mes, por área</h3><span class="small muted tnum">${horas} h</span></div>
      <div class="mt-12">${App.chart.hbars(porGrupo, {fmt: n => n + ' h'})}</div>
    </div>
  </section>`;
}

function tarjeta(a) {
  const g = grupo(a.grupo);
  return html`<article class="au-card ${a.on ? '' : 'is-off'}" style="--c:${g.color}">
    <div class="au-card__top">
      <span class="au-card__ico">${icon(a.icono, 20)}</span>
      <div class="au-card__state">${a.on ? html`<span class="au-on"><i class="live-dot"></i>Activa</span>` : html`<span class="badge">Pausada</span>`}
        <button class="switch ${a.on ? 'is-on' : ''}" data-act="au-toggle" data-id="${a.id}" role="switch" aria-checked="${a.on ? 'true' : 'false'}" aria-label="${a.on ? 'Pausar' : 'Activar'} ${a.nombre}"></button></div>
    </div>
    <h3>${a.nombre}</h3>
    <p class="au-card__desc">${a.desc}</p>
    ${a.impacto ? html`<div class="au-impact">${icon('trending-up', 13)}${a.impacto}</div>` : ''}
    <div class="au-card__foot">
      <div class="au-card__metric"><b class="tnum">${App.num(a.n30)}</b><span>${a.metrica} en 30 días</span></div>
      <div class="au-card__metric"><b class="tnum">${a.ahorro ? a.ahorro + ' h' : '—'}</b><span>ahorradas al mes</span></div>
      <button class="link-btn au-card__more" data-act="au-ver" data-id="${a.id}">Ver cómo funciona${icon('arrow-right', 14)}</button>
    </div>
  </article>`;
}

function drawerBody(a) {
  const f = flujo(a), g = grupo(a.grupo), runs = ejecuciones(a);
  const nodo = (tipo, n, i) => html`<div class="au-node au-node--${tipo}">
    <span class="au-node__ico">${icon(n[0], 16)}</span>
    <div class="au-node__txt"><span class="au-node__k">${tipo === 'trigger' ? 'Cuando' : tipo === 'cond' ? (i ? 'Y' : 'Si') : (i ? 'Y además' : 'Entonces')}</span><b>${n[1]}</b><span>${n[2]}</span></div>
  </div>`;
  const hora = P.hh(App.at(0, a.id === 'informe' ? 8 : a.id === 'ia_whatsapp' ? 23 : 10, a.id === 'ia_whatsapp' ? 14 : 0));
  return html`
    <p class="au-d-desc">${a.desc}</p>
    <div class="au-d-stats">
      <div><b class="tnum">${App.num(a.n30)}</b><span>${a.metrica} en 30 días</span></div>
      <div><b class="tnum">${a.ahorro ? a.ahorro + ' h' : '—'}</b><span>ahorro al mes</span></div>
      <div><b>${a.on ? 'Activa' : 'Pausada'}</b><span>${g.id} · ${g.desc.toLowerCase()}</span></div>
    </div>
    ${a.impacto ? html`<div class="au-impact au-impact--lg">${icon('trending-up', 14)}${a.impacto}</div>` : ''}
    <h4 class="au-d-h">Cómo funciona</h4>
    <div class="au-flow" style="--c:${g.color}">
      ${nodo('trigger', f.trigger, 0)}
      ${f.cond.map((n, i) => nodo('cond', n, i))}
      ${f.acts.map((n, i) => nodo('act', n, i))}
    </div>
    <h4 class="au-d-h">${f.aviso ? 'Así llega el aviso' : 'Ejemplo del mensaje'}</h4>
    <div class="au-wa">
      <div class="au-wa__bar">${f.aviso ? html`<span class="au-wa__av au-wa__av--crm">${icon('zap', 14)}</span><div><b>${App.S.dealer.corto} CRM</b><span>aviso interno</span></div>` : html`<span class="au-wa__av">${App.S.dealer.siglas}</span><div><b>${App.S.dealer.nombre}</b><span>cuenta de empresa</span></div>`}</div>
      <div class="au-wa__body">
        ${f.in ? html`<div class="au-bub au-bub--in">${f.in}<small>${hora}</small></div>` : ''}
        <div class="au-bub au-bub--out">${f.out}<small>${hora} ${icon('check-check', 14)}</small></div>
        ${f.reply ? html`<div class="au-bub au-bub--in">${f.reply}<small>${hora}</small></div>` : ''}
      </div>
    </div>
    <h4 class="au-d-h">Últimas ejecuciones</h4>
    <div class="au-runs">${runs.length ? runs.map(r => html`<div class="au-run ${r.link ? 'is-link' : ''}" ${r.link ? raw(`data-act="go" data-href="${App.esc(r.link)}" role="button" tabindex="0"`) : ''}>
      <span class="au-run__ico" style="--c:${r.prueba ? 'var(--accent)' : g.color}">${icon(r.icon, 13)}</span><span class="au-run__txt">${r.texto}</span><span class="au-run__t">${App.rel(r.fecha)}</span>
    </div>`) : html`<div class="au-runs__empty">${icon(a.on ? 'clock' : 'pause', 16)}${a.on ? 'Todavía no se ha ejecutado. Aparecerá aquí en cuanto ocurra.' : 'Está en pausa. Actívala y empezará a funcionar con los próximos clientes.'}</div>`}</div>`;
}

function abrir(id) {
  const a = App.S.automations.find(x => x.id === id); if (!a) return;
  const g = grupo(a.grupo);
  const head = () => html`<div class="au-d-head" style="--c:${g.color}"><span class="au-card__ico">${icon(a.icono, 20)}</span><div><h2>${a.nombre}</h2><p>${g.id}</p></div></div>`;
  const foot = () => html`<label class="au-d-switch"><button class="switch ${a.on ? 'is-on' : ''}" data-act="au-toggle" data-id="${a.id}" role="switch" aria-checked="${a.on}"></button><span>${a.on ? 'Activa' : 'Pausada'}</span></label><button class="btn btn--primary" data-act="au-probar" data-id="${a.id}">${icon('play', 15)}Probar ahora</button>`;
  const d = App.drawer({width: 520, head: head(), body: P.nb(drawerBody(a)), foot: foot(),
    onMount(node) { node.classList.add('au-drawer'); node.addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.matches('[role="button"][data-act]')) { e.preventDefault(); App.runAct(e.target, e); } }); },
    onClose() { abierto = null; }});
  abierto = {node: d.node, id, close: d.close, refresh() { const x = App.S.automations.find(y => y.id === id); if (!x) return; Object.assign(a, x); d.node.querySelector('.drawer__body').innerHTML = App.str(P.nb(drawerBody(x))); d.node.querySelector('.drawer__foot').innerHTML = App.str(foot()); }};
}

const PRUEBA = {
  ia_whatsapp: ['Mensaje de prueba contestado en 9 s', 'La IA respondió con el precio y la cuota. Míralo en tu WhatsApp.'],
  portales_crm: ['Portales sincronizados', 'coches.net, Wallapop, Milanuncios y Marketplace al día. Sin leads perdidos.'],
  reparto: ['Siguiente lead → Rocío', 'Turno comprobado: Javier y Rocío están trabajando.'],
  recordatorio: ['Recordatorio de prueba enviado', 'Te ha llegado a tu WhatsApp tal y como lo recibe el cliente.'],
  seguimiento48: ['Seguimiento de prueba enviado', 'Lo tienes en tu WhatsApp. Ningún cliente ha recibido nada.'],
  bajada_precio: ['Aviso de bajada de prueba enviado', 'Solo a tu WhatsApp, para que veas cómo llega.'],
  stock_parado: ['Stock revisado', 'Comparado con los portales: el aviso te ha llegado al móvil.'],
  publicacion: ['Conexión con los portales correcta', 'Todos los anuncios activos están publicados.'],
  resena: ['Petición de reseña de prueba enviada', 'Te ha llegado a tu WhatsApp con el enlace de Google.'],
  revision: ['Aviso de revisión de prueba enviado', 'Lo tienes en tu WhatsApp.'],
  informe: ['Informe semanal enviado', 'Revisa tu WhatsApp y tu email.'],
  cumple: ['Felicitación de prueba enviada', 'Te ha llegado a tu WhatsApp.']
};

/* ---------- vista ---------- */
App.views.automatizaciones = {
  title: 'Automatizaciones',
  deps: ['*'],
  render() {
    const S = App.S, autos = S.automations;
    const filtradas = st.grupo === 'todas' ? autos : autos.filter(a => a.grupo === st.grupo);
    const grupos = GRUPOS.filter(g => filtradas.some(a => a.grupo === g.id));
    return P.nb(html`<div class="au">
      <div class="page-head">
        <div><h1>Automatizaciones</h1><p>Lo que el CRM hace solo, cada día, sin que nadie tenga que acordarse.</p></div>
        <div class="page-head__actions"><button class="btn" data-act="go" data-href="#/informes">${icon('bar-chart-3', 16)}Ver resultados</button></div>
      </div>
      ${resumen(S)}
      <div class="chips au-chips">
        <button class="chip ${st.grupo === 'todas' ? 'is-on' : ''}" data-act="au-grupo" data-v="todas">Todas <span class="chip__n">${autos.length}</span></button>
        ${GRUPOS.map(g => { const n = autos.filter(a => a.grupo === g.id).length; return n ? html`<button class="chip ${st.grupo === g.id ? 'is-on' : ''}" data-act="au-grupo" data-v="${g.id}"><i class="au-dot" style="background:${g.color}"></i>${g.id} <span class="chip__n">${n}</span></button>` : ''; })}
      </div>
      <div class="au-groups" data-tour="auto-list">${grupos.map(g => {
        const list = filtradas.filter(a => a.grupo === g.id);
        const h = App.sum(list.filter(a => a.on), a => a.ahorro);
        return html`<section class="au-group">
          <div class="au-group__head" style="--c:${g.color}">${P.icoTile(g.icon, g.color, 16)}<div><h2>${g.id}</h2><p>${g.desc}</p></div><span class="au-group__meta">${P.n(list.length, 'automatización', 'automatizaciones')}${h ? ` · ${h} h/mes` : ''}</span></div>
          <div class="au-grid">${list.map(tarjeta)}</div>
        </section>`;
      })}</div>
    </div>`);
  },
  unmount() { if (abierto) abierto.close(); },
  actions: {
    'au-grupo'(el) { st.grupo = el.dataset.v; App.render({keepScroll: true}); },
    'au-ver'(el) { abrir(el.dataset.id); },
    async 'au-toggle'(el) {
      const a = App.S.automations.find(x => x.id === el.dataset.id); if (!a) return;
      if (a.on && a.id === 'ia_whatsapp') {
        const ok = await App.confirm({title: '¿Pausar el WhatsApp con IA?', text: 'Los mensajes que lleguen se quedarán sin contestar hasta que alguien del equipo los atienda, también por la noche.', ok: 'Pausar', danger: true});
        if (!ok) return;
      }
      App.store.update(() => { a.on = !a.on; }, 'automations');
      db.log(`Automatización ${a.on ? 'activada' : 'pausada'}: ${a.nombre}`, {icon: a.on ? 'zap' : 'pause', link: '#/automatizaciones'});
      App.toast(a.on ? `${a.nombre}: activada` : `${a.nombre}: en pausa`, {tipo: a.on ? 'ok' : 'info', icon: a.on ? 'zap' : 'pause', sub: a.on ? 'Empieza a funcionar ahora mismo.' : 'Puedes volver a activarla cuando quieras.'});
      if (abierto && abierto.id === a.id) abierto.refresh();
    },
    'au-probar'(el) {
      const a = App.S.automations.find(x => x.id === el.dataset.id); if (!a) return;
      el.classList.add('is-disabled');
      el.innerHTML = App.str(html`<span class="spin">${icon('refresh-cw', 15)}</span>Probando…`);
      setTimeout(() => {
        const [t, sub] = PRUEBA[a.id] || [`${a.nombre}: prueba correcta`, 'Todo funciona.'];
        (st.pruebas[a.id] = st.pruebas[a.id] || []).unshift({fecha: new Date().toISOString(), texto: `Prueba manual · ${t.charAt(0).toLowerCase() + t.slice(1)}`, icon: 'play', prueba: true});
        db.log(`Prueba de «${a.nombre}»: ${t.charAt(0).toLowerCase() + t.slice(1)}`, {icon: 'play', link: '#/automatizaciones'});
        App.store.update(() => { a.n30 = (a.n30 || 0) + 1; }, 'automations');
        App.toast(t, {tipo: ['ia_whatsapp','recordatorio','seguimiento48','bajada_precio','resena','revision','cumple'].includes(a.id) ? 'wa' : 'ok', sub});
        if (abierto && abierto.id === a.id) abierto.refresh();
      }, 900);
    }
  }
};
})();
