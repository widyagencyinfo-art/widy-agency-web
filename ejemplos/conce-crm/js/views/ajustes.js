/* =====================================================================
   Ajustes: concesionario, equipo y permisos, integraciones, asistente IA,
   plantillas de WhatsApp y personalización de la demo.
   ===================================================================== */
(function(){
const App = window.App;
const {html, raw, icon, db, ui} = App;

const TABS = [
  ['concesionario', 'Concesionario', 'building-2'],
  ['equipo', 'Equipo y permisos', 'users'],
  ['integraciones', 'Integraciones', 'workflow'],
  ['ia', 'Asistente IA', 'bot'],
  ['plantillas', 'Plantillas', 'message-square-text'],
  ['demo', 'Personalizar demo', 'palette']
];
const COLORES = ['#1A56DB', '#0B0F19', '#E02424', '#0E9F6E', '#D97706', '#7E3AF2', '#0891B2', '#DB2777', '#B91C1C', '#1E3A8A'];

const INTEG = [
  {id:'gcal', nombre:'Google Calendar', desc:'Las citas del CRM aparecen en el calendario de cada comercial y al revés.', sello:'G', color:'#4285F4', grupo:'Agenda y comunicación'},
  {id:'whatsapp', nombre:'WhatsApp Business', desc:'API oficial de Meta: la IA contesta, se envían recordatorios y presupuestos.', sello:'wa', color:'#25D366', grupo:'Agenda y comunicación'},
  {id:'meta', nombre:'Instagram y Facebook', desc:'Los mensajes y los formularios de tus anuncios entran como leads.', sello:'IG', color:'#D6297A', grupo:'Agenda y comunicación'},
  {id:'google', nombre:'Google Business', desc:'Reseñas, llamadas y mensajes de tu ficha de Google Maps.', sello:'G', color:'#34A853', grupo:'Agenda y comunicación'},
  {id:'cochesnet', nombre:'coches.net', desc:'Publicación de stock y entrada automática de leads.', sello:'c.n', color:'#F26B21', grupo:'Portales'},
  {id:'wallapop', nombre:'Wallapop', desc:'Publicación como profesional y chat conectado al CRM.', sello:'wp', color:'#13C1AC', grupo:'Portales'},
  {id:'milanuncios', nombre:'Milanuncios', desc:'Publicación de stock y leads por email y chat.', sello:'MA', color:'#5E9C2F', grupo:'Portales'},
  {id:'autoscout', nombre:'AutoScout24', desc:'Publicación en España y Europa.', sello:'AS', color:'#E5A800', grupo:'Portales'},
  {id:'fbmarket', nombre:'Facebook Marketplace', desc:'Catálogo de vehículos sincronizado con tu stock.', sello:'f', color:'#1877F2', grupo:'Portales'},
  {id:'holded', nombre:'Holded', desc:'Facturas de venta y compra enviadas a tu contabilidad.', sello:'H', color:'#FF5A5F', grupo:'Gestión'},
  {id:'dgt', nombre:'Informes DGT', desc:'Cargas, titulares e ITV de cualquier matrícula en segundos.', sello:'DGT', color:'#1E3A8A', grupo:'Gestión'},
  {id:'gmail', nombre:'Gmail / Outlook', desc:'Los correos con clientes quedan guardados en su ficha.', sello:'@', color:'#EA4335', grupo:'Gestión'}
];

const PERMISOS = [
  ['Ver precio de compra y márgenes', [1, 0, 1, 0]],
  ['Cambiar precios de venta', [1, 0, 0, 0]],
  ['Ver leads de otros comerciales', [1, 0, 1, 0]],
  ['Hacer presupuestos y reservas', [1, 1, 1, 0]],
  ['Enviar a financieras', [1, 1, 1, 0]],
  ['Dar de alta y editar vehículos', [1, 1, 1, 1]],
  ['Descargar informes', [1, 0, 1, 0]],
  ['Gestionar integraciones y equipo', [1, 0, 0, 0]]
];
const ROLES = ['Gerente', 'Comercial', 'Administración', 'Taller y preparación'];

function cfg() {
  const S = App.S;
  if (!S.iaConfig) S.iaConfig = {nombre: 'Asistente de ' + S.dealer.corto, tono: 'cercano', cuando: 'siempre', precio: true, cuota: true, citas: true, fotos: true, humanoDescuento: true, humanoQueja: true, humanoSenal: true, emojis: true, firma: true};
  if (!S.permisos) S.permisos = PERMISOS.map(p => p[1].slice());
  if (!S.plantillas) S.plantillas = [
    {id:'p1', nombre:'Bienvenida', cat:'Atención', texto:'¡Hola {nombre}! 👋 Soy {comercial}, de {concesionario}. He visto que te interesa el {coche}. ¿Quieres que te cuente más o prefieres venir a verlo?'},
    {id:'p2', nombre:'Cuota', cat:'Ventas', texto:'El {coche} se queda en {cuota} €/mes a 96 meses (cálculo orientativo). Con DNI y nómina te lo dejamos preaprobado en el día.'},
    {id:'p3', nombre:'Recordatorio de cita', cat:'Citas', texto:'Hola {nombre}, te recuerdo tu cita {dia} a las {hora} para ver el {coche}. 📍 {direccion}. ¡Te esperamos!'},
    {id:'p4', nombre:'Seguimiento a las 48 h', cat:'Ventas', texto:'Hola {nombre}, ¿pudiste pensar lo del {coche}? Si te ayuda, lo podemos dejar reservado con 300 € de señal que se descuentan del precio.'},
    {id:'p5', nombre:'Bajada de precio', cat:'Ventas', texto:'¡Buenas noticias, {nombre}! El {coche} que te interesaba ha bajado a {precio}. ¿Te lo guardo?'},
    {id:'p6', nombre:'Pedir fotos del coche a cuenta', cat:'Tasación', texto:'Para tasar tu coche mándame 4 fotos: delante, detrás, interior y cuentakilómetros. Te doy la valoración hoy mismo.'},
    {id:'p7', nombre:'Documentación para financiar', cat:'Financiación', texto:'Para el estudio de financiación necesito: DNI por las dos caras, las 2 últimas nóminas y un recibo del banco con tu IBAN. Puedes mandármelo por aquí.'},
    {id:'p8', nombre:'Reseña tras la entrega', cat:'Postventa', texto:'Hola {nombre} 😊 ¿Qué tal con tu {coche}? Si estás contento, nos ayudarías mucho con una reseña: {enlace_resenas}'}
  ];
  return S.iaConfig;
}

const sw = (on, attrs = '', cls = '') => raw(`<button class="switch ${cls} ${on ? 'is-on' : ''}" ${attrs} role="switch" aria-checked="${on}"></button>`);

function tabConcesionario() {
  const d = App.S.dealer;
  const f = (k, label, extra = {}) => html`<div class="field ${extra.span ? 'span-2' : ''}"><label for="dl-${k}">${label}</label><input class="input" id="dl-${k}" data-act-change="dealer" data-k="${k}" value="${d[k] || ''}" ${extra.type ? raw(`type="${extra.type}"`) : ''}></div>`;
  return html`
  <div class="grid-main">
    <div class="card">
      <div class="card__head"><div><h2>Datos del concesionario</h2><p>Salen en los presupuestos, en los carteles y en los mensajes de la IA.</p></div></div>
      <div class="card__body">
        <div class="form-grid">
          ${f('nombre', 'Nombre comercial')}${f('razon', 'Razón social')}
          ${f('cif', 'CIF')}${f('ciudad', 'Ciudad')}
          ${f('direccion', 'Dirección', {span: true})}
          ${f('tel', 'Teléfono')}${f('whatsapp', 'WhatsApp')}
          ${f('email', 'Email', {type: 'email'})}${f('web', 'Web')}
          ${f('horario', 'Horario', {span: true})}
          <div class="field"><label for="dl-garantia">Garantía por defecto (meses)</label><input class="input" id="dl-garantia" type="number" min="0" data-act-change="dealer" data-k="garantia" value="${d.garantia}"></div>
          <div class="field"><label for="dl-tin">TIN por defecto (%)</label><input class="input" id="dl-tin" type="number" step="0.01" data-act-change="dealer" data-k="tin" value="${d.tin}"></div>
        </div>
      </div>
    </div>
    <div class="stack">
      <div class="card card--pad">
        <h3>Marca</h3>
        <div class="aj-brand mt-12">
          <div class="aj-logo" style="background:${d.color}">${d.siglas}</div>
          <div class="grow"><b>${d.nombre}</b><div class="small muted">${d.web}</div></div>
        </div>
        <div class="field mt-16"><label for="dl-siglas">Siglas del logo</label><input class="input" id="dl-siglas" maxlength="3" data-act-change="dealer" data-k="siglas" value="${d.siglas}"></div>
        <div class="label mt-16 mb-8">Color de marca</div>
        <div class="aj-colors">${COLORES.map(c => html`<button class="aj-color ${c.toLowerCase() === (d.color || '').toLowerCase() ? 'is-on' : ''}" style="background:${c}" data-act="color" data-c="${c}" aria-label="Color ${c}"></button>`)}<label class="aj-color aj-color--custom" title="Otro color">${icon('plus', 14)}<input type="color" value="${d.color}" data-act-input="color-custom"></label></div>
      </div>
      <div class="card card--pad">
        <h3>Vista previa</h3>
        <p class="small muted mt-4">Cabecera de un presupuesto</p>
        <div class="aj-doc mt-12">
          <div class="aj-doc__top" style="border-color:${d.color}"><div class="aj-logo aj-logo--sm" style="background:${d.color}">${d.siglas}</div><div><b>${d.nombre}</b><span>${d.direccion}</span><span>${d.tel} · ${d.email}</span></div></div>
          <div class="aj-doc__lines"><i></i><i></i><i style="width:60%"></i></div>
        </div>
      </div>
    </div>
  </div>`;
}

function tabEquipo() {
  const S = App.S; cfg();
  const cuenta = uid => ({leads: S.contacts.filter(c => c.asignado === uid && !['vendido','perdido'].includes(c.etapa)).length, citas: S.events.filter(e => e.userId === uid && new Date(e.inicio) >= App.today()).length});
  return html`
  <div class="stack">
    <div class="card">
      <div class="card__head"><div><h2>Equipo</h2><p>${S.users.length} usuarios · cada uno entra con su email y ve lo que le toca.</p></div><button class="btn btn--sm" data-act="add-user">${icon('user-plus', 15)}Invitar</button></div>
      <div class="table-wrap"><table class="table">
        <thead><tr><th>Usuario</th><th>Rol</th><th class="hide-m">Contacto</th><th class="r">Leads activos</th><th class="r hide-m">Citas próximas</th><th class="c">Activo</th></tr></thead>
        <tbody>${S.users.map(u => { const n = cuenta(u.id); return html`<tr>
          <td><span class="cell-main">${App.avatar(u.nombre, {color: u.color})}<span><b>${u.nombre}${u.id === S.me ? html` <span class="badge badge--outline">Tú</span>` : ''}</b><span>${u.email}</span></span></span></td>
          <td><span class="badge ${u.rol === 'Gerente' ? 'badge--dark' : u.rol === 'Comercial' ? 'badge--blue' : ''}">${u.rol}</span></td>
          <td class="hide-m muted">${u.tel}</td><td class="r tnum">${n.leads}</td><td class="r tnum hide-m">${n.citas}</td>
          <td class="c">${sw(u.activo !== false, `data-act="user-activo" data-id="${u.id}" ${u.id === S.me ? 'disabled' : ''}`)}</td></tr>`; })}</tbody>
      </table></div>
    </div>
    <div class="card">
      <div class="card__head"><div><h2>Permisos por rol</h2><p>Por ejemplo: los comerciales no ven el precio de compra ni el margen.</p></div></div>
      <div class="table-wrap"><table class="table aj-perm">
        <thead><tr><th>Permiso</th>${ROLES.map(r => html`<th class="c">${r}</th>`)}</tr></thead>
        <tbody>${PERMISOS.map((p, i) => html`<tr><td class="semi">${p[0]}</td>${ROLES.map((r, j) => html`<td class="c">${sw(!!S.permisos[i][j], `data-act="perm" data-i="${i}" data-j="${j}" ${j === 0 ? 'disabled' : ''}`, 'switch--sm')}</td>`)}</tr>`)}</tbody>
      </table></div>
    </div>
  </div>`;
}

function tabIntegraciones() {
  const S = App.S;
  const estado = id => id === 'dgt' || id === 'gmail' ? (S.integraciones[id] !== false) : !!S.integraciones[id];
  const grupos = App.groupBy(INTEG, i => i.grupo);
  const conectadas = INTEG.filter(i => estado(i.id)).length;
  return html`
  <div class="stack">
    <div class="card card--pad aj-integ-head">
      <div><h2>${conectadas} de ${INTEG.length} conectadas</h2><p class="muted mt-4">Todo entra y sale del CRM solo: no hay que copiar ni pegar nada entre programas.</p></div>
      <div class="row-sm"><span class="live-dot"></span><span class="small semi">Sincronizado hace 1 min</span></div>
    </div>
    ${Object.entries(grupos).map(([g, list]) => html`
      <div><div class="up mb-8">${g}</div>
      <div class="aj-integ">${list.map(i => { const on = estado(i.id); return html`
        <div class="card aj-int ${on ? 'is-on' : ''}">
          <div class="row"><span class="portal portal--lg" style="background:${i.color}">${i.sello}</span><div class="grow"><b>${i.nombre}</b><div class="small ${on ? 'green' : 'muted'} row-sm">${on ? html`<span class="status-dot status-dot--green"></span>Conectado` : 'Sin conectar'}</div></div></div>
          <p class="small muted mt-12">${i.desc}</p>
          <div class="mt-12"><button class="btn btn--sm ${on ? 'btn--ghost' : 'btn--primary'}" data-act="integ" data-id="${i.id}">${on ? 'Desconectar' : 'Conectar'}</button></div>
        </div>`; })}</div></div>`)}
  </div>`;
}

function tabIA() {
  const c = cfg(), d = App.S.dealer;
  const opt = (k, label, sub) => html`<div class="aj-opt"><div class="grow"><b>${label}</b>${sub ? html`<span>${sub}</span>` : ''}</div>${sw(c[k], `data-act="ia-opt" data-k="${k}"`)}</div>`;
  const conv = App.S.messages.filter(m => m.ia && new Date(m.fecha) > App.addDays(new Date(), -30)).length;
  return html`
  <div class="grid-main grid-main--wide">
    <div class="stack">
      <div class="card card--pad aj-ia-hero">
        <div class="row-lg wrap">
          <div class="aj-ia-av">${icon('bot', 26)}</div>
          <div class="grow"><div class="row-sm">${ui.ia('Activo')}<span class="small muted">${conv} respuestas en los últimos 30 días</span></div><h2 class="mt-8">${c.nombre}</h2><p class="muted mt-4">Contesta en WhatsApp con tu stock real: precio, cuota, garantía y huecos libres de la agenda. Cuando hace falta, te pasa la conversación.</p></div>
        </div>
      </div>
      <div class="card">
        <div class="card__head"><h3>Cómo habla</h3></div>
        <div class="card__body stack">
          <div class="field"><label for="ia-nombre">Nombre del asistente</label><input class="input" id="ia-nombre" data-act-change="ia-nombre" value="${c.nombre}"></div>
          <div class="between wrap"><div><b class="semi">Tono</b><div class="small muted">Cómo se dirige a los clientes</div></div><div class="seg">${[['cercano', 'Cercano'], ['profesional', 'Profesional']].map(([k, l]) => html`<button class="${c.tono === k ? 'is-on' : ''}" data-act="ia-set" data-k="tono" data-v="${k}">${l}</button>`)}</div></div>
          <div class="between wrap"><div><b class="semi">Cuándo contesta</b><div class="small muted">El resto del tiempo solo avisa al comercial</div></div><div class="seg">${[['siempre', '24/7'], ['fuera', 'Fuera de horario'], ['tarde', 'Si no contestáis en 5 min']].map(([k, l]) => html`<button class="${c.cuando === k ? 'is-on' : ''}" data-act="ia-set" data-k="cuando" data-v="${k}">${l}</button>`)}</div></div>
          ${opt('emojis', 'Usar algún emoji', 'Con moderación, como escribiría una persona')}
        </div>
      </div>
      <div class="card">
        <div class="card__head"><h3>Qué puede hacer</h3></div>
        <div class="card__body p-0">
          ${opt('precio', 'Dar precio y datos del coche', 'Km, año, equipamiento, garantía, ITV')}
          ${opt('cuota', 'Calcular la cuota', `Con entrada y plazo, TIN por defecto ${App.dec(d.tin)} %`)}
          ${opt('citas', 'Agendar pruebas y visitas', 'Solo en huecos libres del comercial asignado')}
          ${opt('fotos', 'Pedir fotos del coche a cuenta', 'Y dar una horquilla orientativa de tasación')}
        </div>
      </div>
      <div class="card">
        <div class="card__head"><h3>Cuándo pasa la conversación a una persona</h3></div>
        <div class="card__body p-0">
          ${opt('humanoDescuento', 'Si pide descuento o «último precio»', 'La negociación la lleva siempre tu equipo')}
          ${opt('humanoQueja', 'Si hay una queja o reclamación', 'Y avisa al gerente al momento')}
          ${opt('humanoSenal', 'Si quiere reservar con señal', 'Para cerrar la venta en caliente')}
        </div>
      </div>
    </div>
    <div class="card aj-chat">
      <div class="card__head"><div><h3>Pruébala aquí</h3><p>Escribe como si fueras un cliente.</p></div><button class="btn btn--ghost btn--sm" data-act="ia-reset">${icon('rotate-ccw', 14)}Borrar</button></div>
      <div class="aj-chat__body" id="ajChat" data-keep-scroll="ajchat"></div>
      <div class="aj-chat__sug" id="ajSug">${['¿Sigue disponible el Kia XCeed?', '¿Cuánto al mes con 3.000 de entrada?', 'Tengo un Clio del 2015 para dejar', '¿Puedo ir mañana a las 18:00?', '¿Cuál es el último precio?', 'Busco un SUV automático hasta 25.000'].map(s => html`<button class="chip" data-act="ia-sug" data-t="${s}">${s}</button>`)}</div>
      <form class="aj-chat__form" id="ajForm"><input class="input" id="ajIn" placeholder="Escribe un mensaje…" autocomplete="off"><button class="btn btn--wa btn--icon" aria-label="Enviar">${icon('send', 16)}</button></form>
    </div>
  </div>`;
}

function tabPlantillas() {
  cfg();
  const P = App.S.plantillas;
  const pinta = t => t.replace(/\{(\w+)\}/g, '<mark class="aj-var">{$1}</mark>');
  return html`
  <div class="card">
    <div class="card__head"><div><h2>Plantillas de WhatsApp</h2><p>Mensajes listos para mandar con un toque. Las variables se rellenan solas.</p></div><button class="btn btn--sm" data-act="tpl-new">${icon('plus', 15)}Nueva plantilla</button></div>
    <div class="aj-tpls">${P.map(p => html`
      <div class="aj-tpl">
        <div class="between"><div class="row-sm"><b>${p.nombre}</b><span class="badge">${p.cat}</span></div><div class="row-sm"><span class="badge badge--green hide-m">${icon('badge-check', 12)}Aprobada por Meta</span><button class="icon-btn" data-act="tpl-edit" data-id="${p.id}" aria-label="Editar">${icon('pencil', 16)}</button></div></div>
        <div class="aj-bubble mt-8">${raw(pinta(App.esc(p.texto)))}</div>
      </div>`)}</div>
  </div>`;
}

function tabDemo() {
  const d = App.S.dealer;
  return html`
  <div class="grid-main grid-main--wide">
    <div class="card">
      <div class="card__head"><div><h2>Enlace personalizado</h2><p>Antes de una reunión, pon el nombre del concesionario y manda o abre este enlace: el CRM aparece con su nombre y su color.</p></div></div>
      <div class="card__body stack">
        <div class="form-grid">
          <div class="field"><label for="dm-n">Nombre del concesionario</label><input class="input" id="dm-n" value="${d.nombre}" data-act-input="demo-url"></div>
          <div class="field"><label for="dm-c">Ciudad</label><input class="input" id="dm-c" value="${d.ciudad}" data-act-input="demo-url"></div>
        </div>
        <div><div class="label mb-8">Color</div><div class="aj-colors" id="dmColors">${COLORES.map(c => html`<button class="aj-color ${c.toLowerCase() === d.color.toLowerCase() ? 'is-on' : ''}" style="background:${c}" data-act="demo-color" data-c="${c}" aria-label="Color ${c}"></button>`)}</div></div>
        <div class="aj-url"><span class="grow ellipsis mono" id="dmUrl"></span><button class="btn btn--sm" data-act="demo-copy">${icon('copy', 14)}Copiar</button><a class="btn btn--sm btn--primary" id="dmOpen" target="_blank" rel="noopener">${icon('external-link', 14)}Abrir</a></div>
        <div class="row wrap"><button class="btn" data-act="demo-apply">${icon('check', 15)}Aplicar aquí ahora</button><span class="small muted">Añade <span class="mono">&amp;tour=1</span> para que arranque en modo presentación.</span></div>
      </div>
    </div>
    <div class="stack">
      <div class="card card--pad">
        <h3>Modo presentación</h3>
        <p class="small muted mt-4">Recorrido guiado de 2 minutos por lo que más impresiona: la IA contestando, el embudo, el stock en portales, el presupuesto en PDF y los informes.</p>
        <button class="btn btn--primary btn--block mt-12" data-act="tour">${icon('presentation', 16)}Empezar presentación</button>
      </div>
      <div class="card card--pad">
        <h3>Datos de ejemplo</h3>
        <p class="small muted mt-4">Todo lo que se toca en la demo se guarda en este navegador. Vuelve al estado inicial antes de cada reunión.</p>
        <button class="btn btn--danger btn--block mt-12" data-act="reset-demo">${icon('rotate-ccw', 16)}Restablecer datos de ejemplo</button>
      </div>
    </div>
  </div>`;
}

let demoColor = null;
const demoUrl = () => {
  const n = App.$('#dm-n'), c = App.$('#dm-c'); if (!n) return '';
  const p = new URLSearchParams(); p.set('n', n.value.trim() || App.S.dealer.nombre); if (c.value.trim()) p.set('c', c.value.trim()); p.set('color', (demoColor || App.S.dealer.color).replace('#', ''));
  return location.origin + location.pathname + '?' + p.toString().replace(/\+/g, '%20');
};
const pintaUrl = () => { const u = demoUrl(); const el = App.$('#dmUrl'); if (el) { el.textContent = u; App.$('#dmOpen').href = u + '&reset=1'; } };

/* chat de prueba de la IA (no guarda nada) */
const chat = {msgs: [], id: 'prueba-ajustes'};
function pintaChat() {
  const box = App.$('#ajChat'); if (!box) return;
  box.innerHTML = chat.msgs.length ? App.str(chat.msgs.map(m => m.typing
    ? html`<div class="aj-msg aj-msg--ia"><span class="typing"><i></i><i></i><i></i></span></div>`
    : m.sys ? html`<div class="aj-sys">${icon('calendar-check', 13)}${m.texto}</div>`
    : html`<div class="aj-msg aj-msg--${m.from}">${m.from === 'ia' ? html`<span class="aj-msg__who">${icon('sparkles', 11)}Asistente IA${m.segundos ? ' · ' + m.segundos + ' s' : ''}</span>` : ''}${m.texto}</div>`))
    : App.str(html`<div class="aj-chat__empty">${icon('message-circle', 22)}<p>Toca una sugerencia o escribe tu pregunta.</p></div>`);
  box.scrollTop = box.scrollHeight;
}
async function enviarChat(texto) {
  texto = (texto || '').trim(); if (!texto) return;
  chat.msgs.push({from: 'cliente', texto}); chat.msgs.push({typing: true}); pintaChat();
  const [r] = await Promise.all([App.ia.responder(chat.id, texto), App.sleep(1100 + Math.random() * 900)]);
  chat.msgs = chat.msgs.filter(m => !m.typing);
  chat.msgs.push({from: 'ia', texto: r.texto, segundos: r.segundos});
  if (r.accion && r.accion.tipo === 'cita') chat.msgs.push({sys: true, texto: `Cita creada en la agenda · ${App.diaRel(r.accion.evento.inicio)} ${App.hora(r.accion.evento.inicio)} (prueba, no se guarda)`});
  if (r.accion && r.accion.tipo === 'humano') chat.msgs.push({sys: true, texto: 'Conversación pasada a una persona'});
  pintaChat();
}

App.views.ajustes = {
  title: 'Ajustes',
  deps: ['*'],
  onChange(what) { return what === 'messages' || what === 'typing' || what === 'events'; },
  render(route) {
    cfg();
    const tab = TABS.find(t => t[0] === route.id) ? route.id : 'concesionario';
    const body = {concesionario: tabConcesionario, equipo: tabEquipo, integraciones: tabIntegraciones, ia: tabIA, plantillas: tabPlantillas, demo: tabDemo}[tab]();
    return html`
      <div class="page-head"><div><h1>Ajustes</h1><p>Configura el CRM a la medida de tu concesionario.</p></div></div>
      <div class="tabs mb-16">${TABS.map(([id, l, ic]) => html`<a class="tab ${tab === id ? 'is-on' : ''}" href="#/ajustes/${id}">${icon(ic, 16)}${l}</a>`)}</div>
      <div class="aj">${body}</div>`;
  },
  mount(root, route) {
    if (route.id === 'demo') { demoColor = null; pintaUrl(); }
    if (route.id === 'ia') {
      pintaChat();
      const f = App.$('#ajForm');
      f.onsubmit = e => { e.preventDefault(); const i = App.$('#ajIn'); const t = i.value; i.value = ''; enviarChat(t); };
    }
  },
  actions: {
    dealer(el) {
      const k = el.dataset.k; let v = el.value;
      if (k === 'garantia') v = +v || 0; if (k === 'tin') v = +v || 0;
      App.store.update(s => { s.dealer[k] = v; if (k === 'nombre') { s.dealer.corto = v.split(/\s+/)[0]; } }, 'dealer');
      App.toast('Guardado', {sub: el.closest('.field').querySelector('label').textContent});
      if (['nombre', 'siglas', 'ciudad'].includes(k)) location.reload();
    },
    color(el) { App.store.update(s => s.dealer.color = el.dataset.c, 'dealer'); App.applyTheme(); },
    'color-custom': App.debounce(el => { App.store.update(s => s.dealer.color = el.value, 'dealer'); App.applyTheme(); }, 250),
    'user-activo'(el) { const u = db.user(el.dataset.id); App.store.update(() => u.activo = u.activo === false, 'users'); },
    perm(el) { const i = +el.dataset.i, j = +el.dataset.j; App.store.update(s => s.permisos[i][j] = s.permisos[i][j] ? 0 : 1, 'users'); },
    'add-user'() {
      App.modal({title: 'Invitar a alguien del equipo', size: 'sm',
        body: html`<div class="stack"><div class="field"><label>Nombre</label><input class="input" id="nuN" autofocus placeholder="Nombre y apellidos"></div><div class="field"><label>Email</label><input class="input" id="nuE" type="email" placeholder="nombre@concesionario.es"></div><div class="field"><label>Rol</label><select class="select" id="nuR">${ROLES.map(r => html`<option>${r}</option>`)}</select></div></div>`,
        foot: html`<button class="btn" data-close>Cancelar</button><button class="btn btn--primary" id="nuOk">Enviar invitación</button>`,
        onMount(n, close) { n.querySelector('#nuOk').onclick = () => { const nombre = n.querySelector('#nuN').value.trim(); if (!nombre) return; const email = n.querySelector('#nuE').value.trim(); App.store.update(s => s.users.push({id: App.uid('u'), nombre, rol: n.querySelector('#nuR').value, email: email || App.norm(nombre.split(' ')[0]) + '@' + s.dealer.web, tel: '', color: App.avColor(nombre), activo: true}), 'users'); close(); App.toast('Invitación enviada', {sub: nombre}); }; }});
    },
    async integ(el) {
      const id = el.dataset.id, S = App.S; const on = id === 'dgt' || id === 'gmail' ? S.integraciones[id] !== false : !!S.integraciones[id];
      const i = INTEG.find(x => x.id === id);
      if (on) { if (!(await App.confirm({title: `¿Desconectar ${i.nombre}?`, text: 'Dejarán de sincronizarse los datos con el CRM.', ok: 'Desconectar', danger: true}))) return; App.store.update(s => s.integraciones[id] = false, 'integraciones'); return; }
      el.innerHTML = App.str(html`${icon('refresh-cw', 14, 'spin')}Conectando…`); el.disabled = true;
      await App.sleep(1300);
      App.store.update(s => s.integraciones[id] = true, 'integraciones');
      App.toast(`${i.nombre} conectado`, {sub: 'Sincronizando datos…'});
    },
    'ia-opt'(el) { const k = el.dataset.k; App.store.update(s => s.iaConfig[k] = !s.iaConfig[k], 'ia'); },
    'ia-set'(el) { App.store.update(s => s.iaConfig[el.dataset.k] = el.dataset.v, 'ia'); },
    'ia-nombre'(el) { App.store.update(s => s.iaConfig.nombre = el.value, 'ia'); App.toast('Guardado'); },
    'ia-sug'(el) { enviarChat(el.dataset.t); },
    'ia-reset'() { chat.msgs = []; delete App.ia._ctx[chat.id]; pintaChat(); },
    'tpl-edit'(el) { plantilla(App.S.plantillas.find(p => p.id === el.dataset.id)); },
    'tpl-new'() { plantilla(null); },
    'demo-url'() { pintaUrl(); },
    'demo-color'(el) { demoColor = el.dataset.c; App.$$('#dmColors .aj-color').forEach(b => b.classList.toggle('is-on', b === el)); pintaUrl(); },
    async 'demo-copy'() { const u = demoUrl(); try { await navigator.clipboard.writeText(u); App.toast('Enlace copiado', {sub: u.replace(/^https?:\/\//, '')}); } catch (e) { App.toast('No se pudo copiar', {sub: u, tipo: 'warn'}); } },
    'demo-apply'() {
      const nombre = App.$('#dm-n').value.trim(), ciudad = App.$('#dm-c').value.trim();
      App.store.update(s => {
        const d = s.dealer;
        if (nombre) { d.nombre = nombre; d.corto = nombre.split(/\s+/)[0]; d.siglas = App.initials(nombre.replace(/\b(de|del|la|el|y|s\.?l\.?)\b/gi, '')).slice(0, 2); const slug = App.norm(nombre).replace(/[^a-z0-9]/g, ''); d.web = slug + '.es'; d.email = 'ventas@' + slug + '.es'; d.razon = nombre + ' S.L.'; if (s.iaConfig) s.iaConfig.nombre = 'Asistente de ' + d.corto; }
        if (ciudad) d.ciudad = ciudad;
        if (demoColor) d.color = demoColor;
      }, 'dealer');
      location.reload();
    }
  }
};

function plantilla(p) {
  const nueva = !p;
  p = p || {id: App.uid('p'), nombre: '', cat: 'Ventas', texto: ''};
  App.modal({title: nueva ? 'Nueva plantilla' : 'Editar plantilla', size: 'lg',
    body: html`<div class="stack">
      <div class="form-grid"><div class="field"><label>Nombre</label><input class="input" id="tpN" value="${p.nombre}" autofocus></div><div class="field"><label>Categoría</label><select class="select" id="tpC">${['Atención', 'Ventas', 'Citas', 'Tasación', 'Financiación', 'Postventa'].map(c => html`<option ${c === p.cat ? 'selected' : ''}>${c}</option>`)}</select></div></div>
      <div class="field"><label>Mensaje</label><textarea class="textarea" id="tpT" rows="5">${p.texto}</textarea><div class="field__hint">Variables: ${['{nombre}', '{coche}', '{precio}', '{cuota}', '{comercial}', '{dia}', '{hora}', '{direccion}', '{concesionario}'].map(v => html`<button class="tag aj-varbtn" data-v="${v}">${v}</button> `)}</div></div>
    </div>`,
    foot: html`<button class="btn" data-close>Cancelar</button><button class="btn btn--primary" id="tpOk">Guardar</button>`,
    onMount(n, close) {
      n.addEventListener('click', e => { const b = e.target.closest('.aj-varbtn'); if (!b) return; e.preventDefault(); const ta = n.querySelector('#tpT'); const s = ta.selectionStart; ta.value = ta.value.slice(0, s) + b.dataset.v + ta.value.slice(ta.selectionEnd); ta.focus(); });
      n.querySelector('#tpOk').onclick = () => {
        const nombre = n.querySelector('#tpN').value.trim(), texto = n.querySelector('#tpT').value.trim(); if (!nombre || !texto) return;
        App.store.update(s => { Object.assign(p, {nombre, texto, cat: n.querySelector('#tpC').value}); if (nueva) s.plantillas.push(p); }, 'plantillas');
        close(); App.toast(nueva ? 'Plantilla creada' : 'Plantilla guardada', {sub: nueva ? 'Enviada a Meta para aprobación' : nombre});
      };
    }});
}
})();
