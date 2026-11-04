/* =====================================================================
   WhatsApp: bandeja (lista · chat · ficha lateral), compositor con
   plantillas, fichas de coche y sugerencias de la IA, y «Probar la IA».
   Las burbujas se exponen en App.wa.bubbles para la ficha del cliente.
   ===================================================================== */
(function(){
const App = window.App;
const {html, raw, icon, db, C, ui} = App;
const L = () => App.ld || {};
const nom1 = c => (c && c.nombre || '').split(' ')[0];
const nom2 = c => (c && c.nombre || '').split(' ').slice(0, 2).join(' ');
const veh1 = c => (c.interes || []).map(db.veh).filter(Boolean)[0] || null;
const W = {tab: 'todas', q: '', draft: {}, busy: {}, n: {}, abajo: {}};
const esPrueba = cid => cid && cid === App.S.prefs.contactoPrueba;

const horaLista = d => { const n = App.daysSince(d); return n === 0 ? App.hora(d) : n === 1 ? 'Ayer' : n < 7 ? App.cap(App.DIAS_C[new Date(d).getDay()]) : App.fechaNum(d).slice(0, 5); };
const diaSep = d => { const n = App.daysSince(d); return n === 0 ? 'Hoy' : n === 1 ? 'Ayer' : App.cap(App.fechaLarga(d)); };

/* ---------- burbujas ---------- */
const AUTO = {recordatorio: ['bell-ring', 'Recordatorio automático de la cita'], seguimiento48h: ['repeat', 'Seguimiento automático · 48 h sin respuesta'], resena: ['star', 'Petición de reseña automática']};
const FOTOS = ['Frontal', 'Trasera', 'Interior', 'Cuentakilómetros', 'Lateral', 'Motor'];

function ticks(m, msgs) {
  const leido = msgs.some(x => x.from === 'cliente' && x.fecha > m.fecha) || Date.now() - new Date(m.fecha) > 120000;
  return html`<span class="wa-ticks ${leido ? 'is-read' : ''}">${icon('check-check', 15)}</span>`;
}

function citasPorMensaje(msgs, c) {
  const map = {};
  if (!c) return map;
  const ligadas = new Set(msgs.filter(m => m.evento).map(m => m.evento));
  msgs.forEach(m => { if (m.evento) map[m.id] = db.event(m.evento); });
  const evs = db.eventosDe(c.id).filter(e => e.origen === 'ia' && !ligadas.has(e.id));
  const oks = msgs.filter(m => m.from === 'ia' && !m.evento && /✅/.test(m.texto || ''));
  evs.slice().reverse().forEach((e, i) => { const m = oks[oks.length - 1 - i]; if (m) map[m.id] = e; });
  return map;
}

function bubble(m, msgs, c) {
  const out = m.from !== 'cliente';
  const v = m.ficha ? db.veh(m.ficha) : null;
  const q = m.pdf ? App.S.quotes.find(x => x.numero === m.pdf) : null;
  const u = m.from === 'agente' ? db.user(m.autor || App.S.me) : null;
  const soloAdjunto = (m.fotos && /^\[\d+ fotos?\]$/.test(m.texto || '')) || (m.pdf && /\.pdf$/i.test(m.texto || ''));
  return html`<div class="wa-row ${out ? 'wa-row--out' : 'wa-row--in'}">
    <div class="wa-bubble ${out ? 'wa-bubble--out' : 'wa-bubble--in'} ${m.from === 'ia' ? 'wa-bubble--ia' : ''}">
      ${m.from === 'ia' ? html`<div class="wa-bubble__who wa-bubble__who--ia">${icon('sparkles', 12)}Asistente IA${m.segundos ? html`<span> · respondió en ${m.segundos} s</span>` : m.auto ? html`<span> · automático</span>` : ''}</div>` : ''}
      ${u ? html`<div class="wa-bubble__who">${App.avatar(u.nombre, {size: 'sm', color: u.color})}${nom1(u)}</div>` : ''}
      ${m.fotos ? html`<div class="wa-photos wa-photos--${Math.min(m.fotos, 4)}">${Array.from({length: Math.min(m.fotos, 4)}, (_, i) => html`<span class="wa-photo">${icon('image', 18)}<small>${FOTOS[i]}</small>${i === 3 && m.fotos > 4 ? html`<b>+${m.fotos - 4}</b>` : ''}</span>`)}</div>` : ''}
      ${m.pdf ? html`<button class="wa-file" ${q ? raw(`data-act="wa-pdf" data-id="${q.id}"`) : raw('data-act="wa-pdf"')}><span class="wa-file__ico">PDF</span><span class="grow"><b>Presupuesto ${m.pdf}.pdf</b><span>2 páginas · 184 KB${q ? ` · visto ${q.vistas || 0} veces` : ''}</span></span>${icon('download', 16)}</button>` : ''}
      ${v ? html`<a class="wa-car" href="#/stock/${v.id}"><img src="${ui.img(v, 's')}" alt="${ui.vehNombre(v)}" loading="lazy"><span class="wa-car__info"><b>${ui.vehNombre(v)}</b><span>${ui.vehSub(v)}</span><span class="wa-car__price"><b>${App.eur(v.precio)}</b> · desde ${App.num(db.cuota(v.precio))} €/mes</span></span></a>` : ''}
      ${m.texto && !soloAdjunto ? html`<div class="wa-bubble__txt">${m.texto}</div>` : ''}
      <div class="wa-bubble__meta">${App.hora(m.fecha)}${out ? ticks(m, msgs) : ''}</div>
    </div>
  </div>`;
}

function bubbles(msgs, c, {typing = false} = {}) {
  const citas = citasPorMensaje(msgs, c);
  let dia = '';
  const out = msgs.map(m => {
    const d = diaSep(m.fecha), parts = [];
    if (d !== dia) { dia = d; parts.push(html`<div class="wa-day"><span>${d}</span></div>`); }
    if (m.auto && AUTO[m.auto]) parts.push(html`<div class="wa-sys">${icon(AUTO[m.auto][0], 13)}<span>${AUTO[m.auto][1]}</span></div>`);
    parts.push(bubble(m, msgs, c));
    if (m.handoff) { const u = c && db.user(c.asignado); parts.push(html`<div class="wa-sys wa-sys--red">${icon('user-check', 13)}<span>La IA ha pasado la conversación a ${u ? nom1(u) : 'un comercial'}</span></div>`); }
    const e = citas[m.id];
    if (e) parts.push(html`<a class="wa-sys wa-sys--violet" href="#/agenda">${icon('calendar-check', 13)}<span>Cita creada: ${e.titulo} · ${App.diaRel(e.inicio)} ${App.hora(e.inicio)}${e.gcal ? ' · en Google Calendar' : ''}</span></a>`);
    return parts;
  });
  if (typing) out.push(html`<div class="wa-row wa-row--out wa-typing-row"><div class="wa-bubble wa-bubble--out wa-bubble--ia"><div class="wa-bubble__who wa-bubble__who--ia">${icon('sparkles', 12)}Asistente IA</div><span class="typing"><i></i><i></i><i></i></span><span class="wa-typing-txt">escribiendo…</span></div></div>`);
  return out;
}
App.wa = {bubbles: (msgs, c) => bubbles(msgs, c)};

/* ---------- plantillas del compositor ---------- */
const PLANTILLAS = [
  {id: 'saludo', l: 'Saludo', ic: 'smile', t: 'Hola {nombre} 👋 Soy {agente}, de {concesionario}. ¿En qué te puedo ayudar?'},
  {id: 'cuota', l: 'Cuota', ic: 'calculator', t: 'El {coche} se queda en {cuota} €/mes a 96 meses sin entrada (TIN {tin} %, cálculo orientativo). ¿Te preparo la oferta por escrito?'},
  {id: 'fotos', l: 'Fotos del coche a cuenta', ic: 'camera', t: 'Para tasarte tu coche, mándame 4 fotos: frontal, trasera, interior y el cuentakilómetros. Con eso te doy una valoración hoy mismo 📸'},
  {id: 'ubicacion', l: 'Ubicación y horario', ic: 'map-pin', t: 'Estamos en {direccion} 📍\nHorario: {horario}.\n¿Cuándo te viene bien pasarte?'},
  {id: 'docs', l: 'Documentación para financiar', ic: 'file-check', t: 'Para estudiar la financiación necesito: DNI por las dos caras, las 2 últimas nóminas y un recibo del banco con tu IBAN. Con eso te damos respuesta en 24-48 h.'}
];
const PREGUNTAS_PRUEBA = ['¿Sigue disponible el Kia XCeed?', '¿Cuánto se queda al mes con 3.000 de entrada?', 'Tengo un Clio del 2015 para dejar', '¿Puedo ir mañana a las 18:00?', '¿Cuál es el último precio?'];
function sustituir(t, c) {
  const v = veh1(c), d = App.S.dealer, me = db.me();
  return t.replace(/\{nombre\}/g, nom1(c)).replace(/\{coche\}/g, v ? ui.vehNombre(v) : 'coche').replace(/\{cuota\}/g, v ? App.num(db.cuota(v.precio)) : '—')
    .replace(/\{tin\}/g, App.dec(d.tin)).replace(/\{agente\}/g, nom1(me)).replace(/\{concesionario\}/g, d.nombre).replace(/\{direccion\}/g, d.direccion).replace(/\{horario\}/g, d.horario);
}

/* ---------- lista de conversaciones ---------- */
const TABS = [
  {id: 'todas', l: 'Todas', f: () => true},
  {id: 'sinleer', l: 'Sin leer', f: x => x.unread > 0},
  {id: 'humano', l: 'Necesitan a una persona', short: 'Persona', f: x => x.contact.necesitaHumano},
  {id: 'ia', l: 'Las lleva la IA', short: 'IA', f: x => x.contact.iaActiva && !x.contact.necesitaHumano}
];
function convs() {
  const w = App.norm(W.q).split(/\s+/).filter(Boolean);
  return db.conversaciones().filter(x => !w.length || w.every(p => App.norm(`${x.contact.nombre} ${x.contact.tel} ${(veh1(x.contact) || {}).modelo || ''}`).includes(p)));
}
function tabsHTML() {
  const all = convs();
  return html`${TABS.map(t => { const n = all.filter(t.f).length; return html`<button class="wa-tab ${W.tab === t.id ? 'is-on' : ''} ${t.id === 'humano' && n ? 'wa-tab--red' : ''}" data-act="wa-tab" data-tab="${t.id}"><span class="wa-tab__l">${t.l}</span>${t.short ? html`<span class="wa-tab__s">${t.short}</span>` : ''}${t.id !== 'todas' && n ? html`<span class="wa-tab__n">${n}</span>` : ''}</button>`; })}`;
}
function rowsHTML(sel) {
  const t = TABS.find(x => x.id === W.tab) || TABS[0];
  const list = convs().filter(t.f);
  if (!list.length) return html`<div class="wa-list__empty">${icon(W.tab === 'humano' ? 'check-check' : 'message-circle', 22)}<b>${W.tab === 'humano' ? 'Nadie está esperando' : 'No hay conversaciones'}</b><span>${W.tab === 'humano' ? 'La IA está resolviendo todo lo que entra.' : 'Prueba con otro filtro.'}</span></div>`;
  return html`${list.map(({contact: c, last, unread}) => {
    const typing = App.T.typing[c.id];
    const out = last.from !== 'cliente';
    const prev = last.fotos ? '📷 Fotos' : last.pdf ? '📄 Presupuesto en PDF' : last.ficha ? '🚗 Ficha de coche' : last.texto;
    return html`<a class="wa-item ${sel === c.id ? 'is-on' : ''} ${unread ? 'is-unread' : ''}" href="#/whatsapp/${c.id}">
      <span class="wa-item__av">${App.avatar(c.nombre, {size: 'lg'})}<span class="wa-item__src">${ui.portal(c.origen, 'sm')}</span></span>
      <span class="wa-item__main">
        <span class="wa-item__line"><b class="ellipsis">${esPrueba(c.id) ? 'Cliente de prueba' : nom2(c)}</b><span class="wa-item__time">${horaLista(last.fecha)}</span></span>
        <span class="wa-item__line">
          <span class="wa-item__prev ellipsis">${typing ? html`<span class="wa-item__typing">escribiendo…</span>` : html`${out ? html`<span class="wa-ticks ${last.from === 'ia' ? '' : ''} ${msgsLeido(last) ? 'is-read' : ''}">${icon('check-check', 14)}</span>` : ''}${last.from === 'ia' ? html`<span class="wa-item__ia">${icon('sparkles', 11)}</span>` : ''}${prev}`}</span>
          ${unread ? html`<span class="wa-item__n">${unread}</span>` : ''}
        </span>
        <span class="wa-item__tags">${c.necesitaHumano ? html`<span class="badge badge--red">${icon('user-check', 12)}Quiere hablar con una persona</span>` : c.iaActiva && !['vendido', 'perdido'].includes(c.etapa) ? ui.ia('La lleva la IA') : html`<span class="badge">${icon('user', 12)}${(db.user(c.asignado) || {nombre: '—'}).nombre.split(' ')[0]}</span>`}${esPrueba(c.id) ? html`<span class="badge badge--amber">Prueba</span>` : ''}</span>
      </span>
    </a>`;
  })}`;
}
const msgsLeido = m => App.S.messages.some(x => x.contactId === m.contactId && x.from === 'cliente' && x.fecha > m.fecha) || Date.now() - new Date(m.fecha) > 120000;

/* ---------- cabecera del chat ---------- */
function headHTML(c) {
  const v = veh1(c), e = C.etapa(c.etapa), on = !!c.iaActiva;
  return html`<a class="icon-btn wa-back" href="#/whatsapp" aria-label="Volver">${icon('arrow-left', 20)}</a>
    <a class="wa-head__who" href="#/leads/${c.id}">
      ${App.avatar(c.nombre, {size: 'lg'})}
      <span class="wa-head__txt"><b class="ellipsis">${c.nombre}</b>
        <span class="wa-head__sub">${v ? html`<span class="ellipsis">${ui.vehNombre(v)}</span><span class="wa-dot-sep"></span>` : ''}<span class="badge badge--${e.badge} badge--dot">${e.label}</span><span class="wa-dot-sep hide-m wa-head__tel"></span><span class="tnum hide-m wa-head__tel">${c.tel}</span></span></span>
    </a>
    <div class="wa-head__acts">
      <button class="icon-btn" data-act="llamar" data-id="${c.id}" title="Llamar" aria-label="Llamar">${icon('phone', 18)}</button>
      <a class="icon-btn hide-m" href="#/leads/${c.id}" title="Abrir ficha" aria-label="Abrir ficha">${icon('user', 18)}</a>
      <button class="wa-ia ${on ? 'is-on' : ''}" data-act="wa-ia" data-id="${c.id}" data-tour="wa-ia" aria-pressed="${on}">
        <span class="switch ${on ? 'is-on' : ''}"></span>
        <span class="wa-ia__txt"><b>${on ? 'La IA contesta' : 'Lo llevas tú'}</b><small>${on ? 'Responde en segundos, 24/7' : 'La IA no escribirá'}</small></span>
      </button>
    </div>`;
}

/* ---------- mensajes ---------- */
function msgsHTML(c) {
  const ms = db.mensajes(c.id), typing = !!App.T.typing[c.id];
  if (esPrueba(c.id) && !ms.length && !typing) return html`<div class="wa-intro">
    <div class="wa-intro__ico">${icon('sparkles', 24)}</div>
    <b>Pon a prueba a tu asistente</b>
    <p>Escribe abajo como si fueras un cliente que ha visto un coche en coches.net o Wallapop. La IA contesta con tu stock real: precio, cuota, garantía, tasación y huecos libres en la agenda.</p>
    <span class="xs faint">Toca una pregunta de ejemplo para empezar ↓</span>
  </div>`;
  return html`${bubbles(ms, c, {typing})}`;
}

/* ---------- compositor ---------- */
function composerHTML(c) {
  const prueba = esPrueba(c.id);
  return html`<div class="wa-quick" data-keep-scroll="waQuick">${prueba
      ? PREGUNTAS_PRUEBA.map(p => html`<button class="wa-chip wa-chip--q" data-act="wa-pregunta" data-q="${p}">${p}</button>`)
      : html`${PLANTILLAS.map(p => html`<button class="wa-chip" data-act="wa-tpl" data-id="${p.id}">${icon(p.ic, 14)}${p.l}</button>`)}
        <button class="wa-chip" data-act="wa-ficha" data-id="${c.id}">${icon('car', 14)}Enviar ficha de un coche</button>
        <button class="wa-chip" data-act="wa-presu" data-id="${c.id}">${icon('file-text', 14)}Enviar presupuesto</button>`}</div>
    <div class="wa-comp">
      <button class="icon-btn wa-comp__btn" data-act="wa-adjuntar" data-id="${c.id}" aria-label="Adjuntar">${icon('plus', 20)}</button>
      <div class="wa-comp__field"><textarea id="waTxt-${c.id}" class="wa-comp__ta" rows="1" data-cid="${c.id}" placeholder="${prueba ? 'Escribe como si fueras un cliente…' : 'Escribe un mensaje'}">${W.draft[c.id] || ''}</textarea></div>
      ${prueba ? '' : html`<button class="wa-sug" data-act="wa-sugerir" data-id="${c.id}" title="Sugerir respuesta con IA">${icon('sparkles', 16)}<span>Sugerir con IA</span></button>`}
      <button class="wa-send" data-act="wa-enviar" data-id="${c.id}" aria-label="Enviar">${icon('send', 18)}</button>
    </div>`;
}

function chatHTML(c) {
  const prueba = esPrueba(c.id);
  return html`<header class="wa-head" id="waHead">${headHTML(c)}</header>
    ${prueba ? html`<div class="wa-test">${icon('sparkles', 15)}<span class="grow"><b>Modo prueba.</b> Tú escribes como cliente (izquierda) y la IA contesta (derecha).</span><button class="btn btn--xs" data-act="wa-reiniciar" data-id="${c.id}">${icon('rotate-ccw', 13)}Empezar de nuevo</button></div>` : ''}
    ${c.necesitaHumano && !prueba ? html`<div class="wa-alert">${icon('user-check', 15)}<span class="grow"><b>${nom1(c)} quiere hablar con una persona.</b> La IA ha dejado de contestar hasta que respondas.</span></div>` : ''}
    <div class="wa-msgs" id="waMsgs" data-keep-scroll="waMsgs-${c.id}"><div class="wa-msgs__in" id="waMsgsIn">${msgsHTML(c)}</div></div>
    <footer class="wa-foot">${composerHTML(c)}</footer>`;
}

/* ---------- ficha lateral ---------- */
function sideHTML(c) {
  const v = veh1(c), e = C.etapa(c.etapa);
  const cita = db.eventosDe(c.id).find(x => new Date(x.fin || x.inicio) > new Date() && !['cancelada', 'no_vino', 'hecha'].includes(x.estado));
  const r = L().resumenIA ? L().resumenIA(c) : null;
  return html`<div class="wa-side__card wa-side__who">
      ${App.avatar(c.nombre, {size: 'xl'})}
      <b>${c.nombre}</b><span class="tnum">${c.tel}</span>
      <div class="row-sm wrap" style="justify-content:center">${ui.origen(c.origen)}<span class="faint">·</span>${ui.user(c.asignado, {name: true})}</div>
    </div>
    <div class="wa-side__sec"><div class="wa-side__lbl">Etapa</div>
      <button class="wa-side__select" data-act="wa-etapa" data-id="${c.id}"><span class="badge badge--${e.badge} badge--dot">${e.label}</span>${icon('chevron-down', 15)}</button></div>
    <div class="wa-side__sec"><div class="wa-side__lbl">Temperatura</div>
      <div class="seg wa-temp">${Object.entries(C.TEMP).map(([k, t]) => html`<button class="${c.temperatura === k ? 'is-on' : ''} temp--${k}" data-act="wa-temp" data-id="${c.id}" data-k="${k}">${icon(t.icon, 13)}${t.label}</button>`)}</div></div>
    ${v ? html`<div class="wa-side__sec"><div class="wa-side__lbl">Coche de interés</div>
      <a class="wa-side__car" href="#/stock/${v.id}"><img src="${ui.img(v, 's')}" alt="${ui.vehNombre(v)}" loading="lazy"><span><b>${ui.vehNombre(v)}</b><small>${v.anio} · ${App.km(v.km)}</small><em class="tnum">${App.eur(v.precio)} · ${App.num(db.cuota(v.precio))} €/mes</em></span></a></div>` : ''}
    <div class="wa-side__sec"><div class="wa-side__lbl">Próxima cita</div>
      ${cita ? html`<a class="wa-side__cita" href="#/agenda">${ui.evTipo(cita.tipo)}<span><b>${App.diaRel(cita.inicio)} · ${App.hora(cita.inicio)}</b><small>${cita.titulo}${cita.origen === 'ia' ? ' · la agendó la IA' : ''}</small></span></a>`
        : html`<button class="btn btn--sm btn--block" data-act="wa-cita" data-id="${c.id}">${icon('calendar-plus', 15)}Crear cita</button>`}</div>
    ${r && !['vendido', 'perdido'].includes(c.etapa) ? html`<div class="wa-side__sec"><div class="wa-side__lbl">${icon('sparkles', 12)} Siguiente paso</div><p class="wa-side__next">${r.paso}</p></div>` : ''}
    <div class="wa-side__sec"><div class="wa-side__lbl">Notas</div>
      <textarea class="textarea" id="waNotas-${c.id}" rows="3" data-act-change="wa-notas" data-id="${c.id}" placeholder="Algo que el equipo deba saber…">${c.notas}</textarea></div>
    <a class="btn btn--block" href="#/leads/${c.id}">${icon('user', 16)}Abrir ficha completa</a>`;
}

/* ---------- vacío (escritorio sin conversación elegida) ---------- */
function vacioHTML() {
  const S = App.S;
  const hoy = S.messages.filter(m => m.from === 'ia' && App.isToday(m.fecha));
  const conSeg = S.messages.filter(m => m.from === 'ia' && m.segundos);
  const media = conSeg.length ? Math.round(App.sum(conSeg, m => m.segundos) / conSeg.length) : 0;
  const citasIA = S.events.filter(e => e.origen === 'ia' && App.daysSince(e.inicio) <= 7 && App.daysSince(e.inicio) >= -7).length;
  const esperando = db.conversaciones().find(x => x.contact.necesitaHumano);
  return html`<div class="wa-empty">
    <div class="wa-empty__ico">${icon('messages-square', 30)}</div>
    <h2>Tu WhatsApp, atendido 24/7</h2>
    <p>Elige una conversación o prueba tú mismo cómo contesta la IA a un cliente.</p>
    <div class="wa-empty__stats">
      <div><b class="tnum">${hoy.length}</b><span>respuestas de la IA hoy</span></div>
      <div><b class="tnum">${media} s</b><span>tiempo medio de respuesta</span></div>
      <div><b class="tnum">${citasIA}</b><span>citas agendadas por la IA</span></div>
    </div>
    <div class="row wrap" style="justify-content:center">
      <button class="btn btn--primary" data-act="wa-probar">${icon('sparkles', 16)}Probar la IA</button>
      ${esperando ? html`<a class="btn" href="#/whatsapp/${esperando.contact.id}">${icon('user-check', 16)}Atender a ${nom1(esperando.contact)}</a>` : ''}
    </div>
  </div>`;
}

function render(route) {
  const c = route.id ? db.contact(route.id) : null;
  const total = db.totalSinLeer();
  return html`<div class="wa ${c ? 'wa--chat' : 'wa--list'}">
    <aside class="wa-list" data-tour="wa-list">
      <div class="wa-list__head">
        <div class="wa-list__title"><span class="wa-logo">${icon('message-circle', 18)}</span><div><h2>WhatsApp</h2><span class="xs muted">${App.S.dealer.whatsapp} · ${total ? `${total} sin leer` : 'todo al día'}</span></div></div>
        <button class="btn btn--sm wa-probar" data-act="wa-probar">${icon('sparkles', 15)}Probar la IA</button>
      </div>
      <div class="wa-list__search"><div class="input-group">${icon('search', 16)}<input class="input" id="waQ" placeholder="Buscar conversación" value="${W.q}" data-act-input="wa-q" autocomplete="off"></div></div>
      <div class="wa-tabs" id="waTabs">${tabsHTML()}</div>
      <div class="wa-list__rows" id="waRows" data-keep-scroll="waRows">${rowsHTML(c && c.id)}</div>
    </aside>
    <section class="wa-chat ${c && esPrueba(c.id) ? 'is-test' : ''}" data-tour="wa-chat">${c ? chatHTML(c) : route.id ? ui.empty('message-circle', 'Conversación no encontrada', 'Puede que se haya borrado al restablecer la demo.', html`<a class="btn" href="#/whatsapp">Volver</a>`) : vacioHTML()}</section>
    ${c ? html`<aside class="wa-side" id="waSide">${sideHTML(c)}</aside>` : ''}
  </div>`;
}

/* ---------- refresco parcial (no toca el compositor) ---------- */
function alFinal(force) {
  const box = App.$('#waMsgs'); if (!box) return;
  const go = () => { box.scrollTop = box.scrollHeight; };
  if (force) { go(); requestAnimationFrame(go); }
}
function refresh() {
  const r = App.route, root = App.$('.wa'); if (!root || !r || r.name !== 'whatsapp') return false;
  const rows = App.$('#waRows'); if (rows) { const st = rows.scrollTop; rows.innerHTML = App.str(rowsHTML(r.id)); rows.scrollTop = st; }
  const tabs = App.$('#waTabs'); if (tabs) tabs.innerHTML = App.str(tabsHTML());
  if (!r.id) return true;
  const c = db.contact(r.id); if (!c) return false;
  if (!!App.$('.wa-alert') !== !!(c.necesitaHumano && !esPrueba(c.id))) return false;   // cambia la estructura → repintado completo
  const head = App.$('#waHead'); if (head) head.innerHTML = App.str(headHTML(c));
  const box = App.$('#waMsgs'), inner = App.$('#waMsgsIn');
  if (box && inner) {
    const cerca = box.scrollHeight - box.scrollTop - box.clientHeight < 160;
    const n = db.mensajes(c.id).length + (App.T.typing[c.id] ? .5 : 0);
    const nuevo = n !== W.n[c.id]; W.n[c.id] = n;
    inner.innerHTML = App.str(msgsHTML(c));
    if (nuevo || cerca) alFinal(true);
  }
  const side = App.$('#waSide'); if (side && !side.contains(document.activeElement)) side.innerHTML = App.str(sideHTML(c));
  if (!esPrueba(c.id) && db.sinLeer(c.id) && !document.hidden) setTimeout(() => leer(c.id), 600);
  return true;
}

/* marcar leídos sin quitar el aviso de «quiere hablar con una persona» (se quita al contestar tú) */
function leer(cid) { const c = db.contact(cid); if (!c || !db.sinLeer(cid)) return; const nh = !!c.necesitaHumano; db.marcarLeidos(cid); if (nh) db.updateContact(cid, {necesitaHumano: true}, 'messages'); }

/* ---------- enviar ---------- */
const ta = cid => App.$('#waTxt-' + cid);
const autosize = el => { const box = App.$('#waMsgs'), cerca = box && box.scrollHeight - box.scrollTop - box.clientHeight < 160; el.style.height = 'auto'; el.style.height = Math.min(el.scrollHeight, 140) + 'px'; if (cerca) box.scrollTop = box.scrollHeight; };
function setTexto(cid, t) { const el = ta(cid); W.draft[cid] = t; if (el) { el.value = t; autosize(el); el.focus(); } }

async function enviarPrueba(cid, texto) {
  if (W.busy[cid]) return App.toast('Espera a que conteste la IA', {tipo: 'info', ms: 1800});
  W.busy[cid] = true;
  try {
    db.addMessage(cid, {from: 'cliente', texto, leido: true});
    await App.sleep(450);
    const t0 = Date.now();
    App.T.typing[cid] = true; App.emit('change', 'typing');
    const [r] = await Promise.all([L().iaResponder ? L().iaResponder(cid, texto) : App.ia.responder(cid, texto), App.sleep(1500 + Math.random() * 1400)]);
    delete App.T.typing[cid];
    const extra = {}, acc = r && r.accion;
    if (acc && acc.tipo === 'cita' && acc.evento) {
      const ev = db.addEvent(Object.assign({origen: 'ia'}, acc.evento, {contactId: cid}));
      extra.evento = ev.id;
      App.toast('La IA ha agendado una cita', {sub: `${ev.titulo} · ${App.diaRel(ev.inicio)} ${App.hora(ev.inicio)}`, icon: 'calendar-check', accion: 'Ver agenda', onAccion: () => App.go('#/agenda'), ms: 6000});
    }
    if (acc && acc.tipo === 'humano') extra.handoff = true;
    db.addMessage(cid, Object.assign({from: 'ia', ia: true, texto: (r && r.texto) || '…', segundos: Math.max(2, Math.round((Date.now() - t0) / 1000))}, extra));
    if (extra.handoff) {
      db.updateContact(cid, {necesitaHumano: true});
      App.toast('La IA pide que entre una persona', {sub: 'Avisa al comercial en el móvil y marca la conversación en rojo', tipo: 'warn', icon: 'user-check', ms: 6000});
    }
  } catch (e) { console.error(e); delete App.T.typing[cid]; App.emit('change', 'typing'); }
  W.busy[cid] = false;
}

function enviar(cid) {
  const el = ta(cid); const texto = (el ? el.value : W.draft[cid] || '').trim();
  if (!texto) { el && el.focus(); return; }
  setTexto(cid, '');
  if (esPrueba(cid)) return enviarPrueba(cid, texto);
  db.addMessage(cid, {from: 'agente', texto});
  const c = db.contact(cid); if (c && c.necesitaHumano) db.updateContact(cid, {necesitaHumano: false}, 'messages');
}

function contactoPrueba() {
  let c = App.S.prefs.contactoPrueba && db.contact(App.S.prefs.contactoPrueba);
  if (!c) {
    c = db.addContact({nombre: 'Cliente de prueba', tel: '600 000 000', email: '', origen: 'whatsapp', etapa: 'nuevo', temperatura: 'templado', asignado: 'u2', iaActiva: true, etiquetas: ['Prueba'], interes: ['144b15bb'].filter(db.veh), autor: 'sistema', notas: 'Contacto para probar la IA desde WhatsApp.'});
    App.S.prefs.contactoPrueba = c.id; App.store.save();
  }
  return c;
}

/* ---------- acciones ---------- */
App.actions['wa-pdf'] = el => { if (el.dataset.id) App.open.presupuesto(el.dataset.id); else App.toast('Presupuesto en PDF', {tipo: 'info', icon: 'file-text'}); };
App.actions['wa-probar'] = () => App.go('#/whatsapp/' + contactoPrueba().id);

const actions = {
  'wa-tab'(el) { W.tab = el.dataset.tab; refresh() || App.render({keepScroll: true}); },
  'wa-q'(el) { W.q = el.value; refresh(); },
  'wa-ia'(el) {
    const c = db.contact(el.dataset.id), on = !c.iaActiva;
    db.updateContact(c.id, {iaActiva: on, necesitaHumano: on ? c.necesitaHumano : false});
    App.toast(on ? 'La IA contesta a ' + nom1(c) : 'Esta conversación la llevas tú', {sub: on ? 'Responde en segundos y te avisa si hace falta una persona' : 'La IA no escribirá hasta que la vuelvas a activar', icon: on ? 'sparkles' : 'user-check'});
  },
  'wa-tpl'(el) { const route = App.route, c = db.contact(route.id), p = PLANTILLAS.find(x => x.id === el.dataset.id); if (c && p) setTexto(c.id, sustituir(p.t, c)); },
  'wa-pregunta'(el) { const cid = App.route.id; if (cid) enviarPrueba(cid, el.dataset.q); },
  'wa-ficha'(el) {
    const c = db.contact(el.dataset.id);
    const pick = L().elegirCoche ? L().elegirCoche({title: 'Enviar ficha de un coche', sub: `A ${nom2(c)} por WhatsApp · con foto, precio y cuota`}) : Promise.resolve((veh1(c) || {}).id);
    pick.then(vid => { if (!vid) return; const v = db.veh(vid); db.addMessage(c.id, {from: 'agente', texto: L().textoFicha ? L().textoFicha(c, v) : ui.vehNombre(v), ficha: vid}); db.addTimeline(c.id, {tipo: 'whatsapp', texto: `Ficha del ${ui.vehNombre(v)} enviada por WhatsApp`}); });
  },
  'wa-presu'(el) { const c = db.contact(el.dataset.id); App.nuevo('presupuesto', {contact: c.id, vehicle: (veh1(c) || {}).id}); },
  'wa-adjuntar'(el) {
    const c = db.contact(el.dataset.id);
    App.menu(el, [
      {label: 'Ficha de un coche', icon: 'car', onClick: () => actions['wa-ficha'](el)},
      {label: 'Presupuesto', icon: 'file-text', onClick: () => actions['wa-presu'](el)},
      {label: 'Ubicación', icon: 'map-pin', onClick: () => setTexto(c.id, sustituir(PLANTILLAS[3].t, c))},
      {sep: true}, {header: 'Plantillas'},
      ...PLANTILLAS.map(p => ({label: p.l, icon: p.ic, onClick: () => setTexto(c.id, sustituir(p.t, c))}))
    ]);
  },
  async 'wa-sugerir'(el) {
    const cid = el.dataset.id;
    const last = db.mensajes(cid).filter(m => m.from === 'cliente').pop();
    if (!last) return App.toast('Todavía no ha escrito el cliente', {tipo: 'info'});
    if (el.classList.contains('is-loading')) return;
    el.classList.add('is-loading');
    const box = ta(cid); if (box) { box.value = ''; box.placeholder = 'La IA está pensando una respuesta…'; }
    let r;
    try { r = L().iaResponder ? await L().iaResponder(cid, last.texto) : await App.ia.responder(cid, last.texto); } catch (e) { r = {texto: ''}; }
    await App.sleep(350);
    const txt = (r && r.texto) || '', b = ta(cid);
    el.classList.remove('is-loading');
    if (!b) { W.draft[cid] = txt; return; }
    b.placeholder = 'Escribe un mensaje'; b.classList.add('is-ai');
    for (let i = 0; i <= txt.length; i += 3) { b.value = txt.slice(0, i); autosize(b); await App.sleep(10); }
    b.value = txt; W.draft[cid] = txt; autosize(b); b.focus();
    setTimeout(() => b.classList.remove('is-ai'), 900);
  },
  'wa-enviar'(el) { enviar(el.dataset.id); },
  'wa-reiniciar'(el) {
    const cid = el.dataset.id;
    App.store.update(S => { S.messages = S.messages.filter(m => m.contactId !== cid); S.events = S.events.filter(e => e.contactId !== cid); const c = S.contacts.find(x => x.id === cid); if (c) Object.assign(c, {etapa: 'nuevo', necesitaHumano: false, proxima: null, iaActiva: true}); }, '*');
    W.draft[cid] = '';
    App.toast('Prueba reiniciada', {sub: 'Escribe como si fueras un cliente', icon: 'rotate-ccw'});
  },
  'wa-etapa'(el) {
    const c = db.contact(el.dataset.id);
    App.menu(el, [{header: 'Mover a'}].concat(C.ETAPAS.filter(e => e.id !== c.etapa).map(e => ({label: e.label, icon: e.icon, danger: e.id === 'perdido', onClick: () => {
      if (e.id === 'perdido' && L().modalPerdido) return L().modalPerdido(c.id);
      if (e.id === 'vendido' && L().modalVenta) return L().modalVenta(c.id);
      db.setEtapa(c.id, e.id);
    }}))), {align: 'right'});
  },
  'wa-temp'(el) { db.updateContact(el.dataset.id, {temperatura: el.dataset.k}); },
  'wa-cita'(el) { const c = db.contact(el.dataset.id); App.nuevo('cita', {contact: c.id, vehicle: (veh1(c) || {}).id}); },
  'wa-notas'(el) { const c = db.contact(el.dataset.id); if (!c || c.notas === el.value) return; db.updateContact(c.id, {notas: el.value}); App.toast('Nota guardada', {icon: 'notebook-pen'}); }
};

App.views.whatsapp = {
  title: r => { const c = r.id && db.contact(r.id); return c ? (esPrueba(c.id) ? 'Probar la IA' : nom2(c)) : 'WhatsApp'; },
  crumbs: r => r.id ? [{label: 'WhatsApp', href: '#/whatsapp'}] : null,
  deps: ['messages', 'contacts', 'events', 'typing'],
  full: true,
  onChange(what) { if (what === '*') return false; return refresh(); },
  render,
  mount(root, route, {rerender}) {
    document.body.classList.add('wa-on');
    const cid = route.id, c = cid && db.contact(cid);
    if (!c) return;
    W.n[cid] = db.mensajes(cid).length + (App.T.typing[cid] ? .5 : 0);
    const box = root.querySelector('#waMsgs');
    box.addEventListener('scroll', () => { W.abajo[cid] = box.scrollHeight - box.scrollTop - box.clientHeight < 160; }, {passive: true});
    if (!rerender || W.abajo[cid] !== false) alFinal(true);
    if (!rerender) {
      box.addEventListener('load', () => { if (box.scrollHeight - box.scrollTop - box.clientHeight < 400) box.scrollTop = box.scrollHeight; }, true);
    }
    const t = ta(cid);
    if (t) {
      autosize(t);
      t.addEventListener('input', () => { W.draft[cid] = t.value; autosize(t); });
      t.addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); enviar(cid); } });
      if (!rerender && matchMedia('(min-width: 901px)').matches) setTimeout(() => t.focus({preventScroll: true}), 80);
    }
    if (!esPrueba(cid) && db.sinLeer(cid)) setTimeout(() => leer(cid), 700);
  },
  unmount() { document.body.classList.remove('wa-on'); },
  actions
};
})();
