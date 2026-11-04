/* =====================================================================
   Stock · listado (rejilla / tabla), ficha del coche con pestañas,
   asistente de alta y cartel de parabrisas para imprimir.
   Rutas: #/stock · #/stock/:id(/pestaña) · #/stock/nuevo
   ===================================================================== */
(function(){
const App = window.App;
const {html, icon, db, C, ui} = App;
const S = () => App.S;
const eur = App.eur;

/* ---------- utilidades locales ---------- */
const hash = s => { let h = 2166136261; for (const ch of String(s)) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };
const rnd = (seed, i = 0) => hash(seed + '·' + i) % 10000 / 10000;
const round = (n, s = 100) => Math.round(n / s) * s;
const plural = (n, uno, varios) => `${App.num(n)} ${n === 1 ? uno : varios}`;
const nowISO = () => new Date().toISOString();
const first = n => String(n || '').split(' ')[0];
const mesAnio = ym => { if (!ym) return '—'; const [y, m] = String(ym).split('-'); return (App.MESES[(+m || 1) - 1] || '') + ' de ' + y; };
const isMobile = () => window.matchMedia('(max-width: 900px)').matches;
const rerender = () => App.render({keepScroll: true});
const CUR_YEAR = new Date().getFullYear();

const PORTAL = {
  web:         {label: 'Tu web',      ficha: 'Ficha con financiación y cita online'},
  cochesnet:   {label: 'coches.net',  ficha: 'Anuncio profesional con hasta 40 fotos'},
  wallapop:    {label: 'Wallapop',    ficha: 'Perfil PRO · los chats entran al CRM'},
  milanuncios: {label: 'Milanuncios', ficha: 'Anuncio que se renueva solo cada día'},
  autoscout:   {label: 'AutoScout24', ficha: 'Compradores de toda España'},
  fbmarket:    {label: 'Marketplace', ficha: 'Catálogo en Facebook e Instagram'}
};
const pLabel = p => (PORTAL[p] || C.origen(p)).label;
const activos = v => C.PORTALES.filter(p => v.portales && v.portales[p] && v.portales[p].on);
const nLeads = v => Math.max(db.leadsPortales(v), db.leadsDe(v.id).length);
const interesadosActivos = v => db.leadsDe(v.id).filter(c => !['vendido', 'perdido'].includes(c.etapa));
const RANK = ['reservado', 'negociacion', 'prueba', 'cita', 'contactado', 'nuevo', 'vendido', 'perdido'];
const porEtapa = (a, b) => RANK.indexOf(a.etapa) - RANK.indexOf(b.etapa) || String(b.ultimoContacto).localeCompare(String(a.ultimoContacto));

/* fotos: las subidas en esta sesión (object URLs) mandan sobre las del catálogo */
const localFotos = {};
const fotosDe = v => {
  if (localFotos[v.id] && localFotos[v.id].length) return localFotos[v.id].map(u => ({s: u, l: u, local: true}));
  return (v.fotos || []).map(f => ({s: `img/v/${f}-s.webp`, l: `img/v/${f}-l.webp`}));
};
const fotosOr = v => { const f = fotosDe(v); return f.length ? f : [{s: 'img/placeholder.svg', l: 'img/placeholder.svg', ph: true}]; };

/* matrícula con franja azul y etiqueta ambiental */
const plate = (m, cls = '') => html`<span class="stk-plate ${cls}"><i>E</i><b>${m || '0000 XXX'}</b></span>`;
const ETQ = {'0': ['#1A56DB', '#fff', '0'], ECO: ['linear-gradient(90deg,#1A56DB 50%,#0E9F6E 50%)', '#fff', 'ECO'], C: ['#0E9F6E', '#fff', 'C'], B: ['#E3B505', '#1F2937', 'B']};
const etiqueta = e => { const x = ETQ[e]; return x ? html`<span class="stk-etq" style="background:${x[0]};color:${x[1]}" title="Etiqueta ambiental DGT ${e}">${x[2]}</span>` : ''; };
const etqDe = (comb, anio) => ['Eléctrico', 'Híbrido enchufable'].includes(comb) ? '0' : ['Híbrido', 'GLP'].includes(comb) ? 'ECO' : comb === 'Diésel' ? (anio >= 2015 ? 'C' : 'B') : (anio >= 2006 ? 'C' : 'B');

const estadoPill = v => v.estado === 'disponible' ? '' : html`<span class="stk-pill stk-pill--${v.estado}">${(C.ESTADOS_VEH[v.estado] || {}).label}</span>`;
const diasPill = v => { const d = db.diasStock(v); const cls = d > 90 ? 'red' : d > 60 ? 'amber' : d < 15 ? 'green' : ''; return html`<span class="stk-pill ${cls ? 'stk-pill--' + cls : ''}" title="Días en stock">${icon('clock-3', 12)}${d} d</span>`; };

/* precio sugerido: misma regla que la alerta de coche parado del Inicio */
const factorDias = d => d > 120 ? .94 : d > 90 ? .955 : d > 60 ? .97 : 1;

/* precio frente al mercado (determinista a partir del id) */
function mercado(v) {
  const h = hash(v.id), dias = db.diasStock(v);
  const n = ({a6f79ac4: 14})[v.id] || 9 + h % 14;
  let media = v.mercadoMedia;
  if (!media) {
    const f = factorDias(dias);
    media = f < 1 ? round(v.precio * f + 100) : round(v.precio * (0.965 + (h % 80) / 1000));
  }
  const min = round(media * .87), max = round(media * 1.13);
  const diff = v.precio - media, pctDiff = diff / media * 100;
  const estado = pctDiff > 1.5 ? 'alto' : pctDiff < -1.5 ? 'bajo' : 'medio';
  const sugerido = estado === 'alto' ? round(media - 100) : estado === 'bajo' ? media : v.precio;
  const pos = App.clamp((v.precio - min) / (max - min), 0, 1);
  return {n, media, min, max, diff, pctDiff, estado, sugerido, pos, posMedia: (media - min) / (max - min)};
}

/* historial de precios → [{fecha, de, a}] */
function cambiosPrecio(v) {
  const h = (v.precioHistorial || []).slice().sort((a, b) => a.fecha.localeCompare(b.fecha));
  return h.map((e, i) => ({fecha: e.fecha, de: e.precio, a: e.nuevo != null ? e.nuevo : (h[i + 1] ? h[i + 1].precio : v.precio)}));
}
const precioOriginal = v => { const h = cambiosPrecio(v); return h.length && h[0].de > v.precio ? h[0].de : 0; };

/* documentación */
const DOCS = [
  {id: 'permiso',  label: 'Permiso de circulación', icon: 'file-text',      sub: v => `A nombre del vendedor anterior · ${v.duenos || 1} ${v.duenos > 1 ? 'titulares' : 'titular'}`},
  {id: 'ficha',    label: 'Ficha técnica',          icon: 'file-check',     sub: v => `ITV y reformas al día · ${v.cv} CV`},
  {id: 'itv',      label: 'ITV en vigor',           icon: 'shield-check',   sub: v => 'Válida hasta ' + mesAnio(v.itv)},
  {id: 'dgt',      label: 'Informe de la DGT',      icon: 'landmark',       sub: v => v.dgt ? 'Consultado ' + App.rel(v.dgt.fecha) + ' · sin cargas' : docsOf(v).dgt ? 'Sin cargas · consultado al comprarlo' : 'Sin consultar todavía'},
  {id: 'libro',    label: 'Libro de revisiones',    icon: 'notebook-pen',   sub: v => 'Sellado en servicio oficial'},
  {id: 'contrato', label: 'Contrato de compra',     icon: 'file-signature', sub: v => `Compra por ${eur(v.precioCompra)}`},
  {id: 'llaves',   label: '2 llaves',               icon: 'key',            sub: v => 'Llave principal y de repuesto'}
];
function docsOf(v) {
  if (v.docs) return v.docs;
  const h = hash(v.id + 'docs');
  if (App.daysSince(v.fechaEntrada) < 2) return {permiso: true, ficha: true, itv: true, dgt: false, libro: false, contrato: true, llaves: false};
  return {permiso: true, ficha: true, itv: true, dgt: h % 3 !== 0, libro: v.libroRevisiones !== false, contrato: true, llaves: h % 4 !== 1};
}

const GASTO_ICON = [[/transporte/i, 'route'], [/limpieza|preparaci/i, 'sparkles'], [/itv|revisi/i, 'shield-check'], [/neum/i, 'circle'], [/chapa|pintura/i, 'palette'], [/pastillas|discos|aceite|filtro|taller|mec/i, 'wrench'], [/reacondi/i, 'hammer']];
const gastoIcon = c => (GASTO_ICON.find(([r]) => r.test(c)) || [0, 'receipt'])[1];

/* textos vendedores para la descripción */
const INTRO = {
  SUV: 'SUV alto y cómodo, con buena visibilidad y maletero de sobra para el día a día y las escapadas.',
  'SUV coupé': 'SUV coupé con diseño deportivo, posición de conducción elevada y mucho espacio interior.',
  Compacto: 'Compacto ágil y fácil de aparcar, con el espacio justo para no quedarse corto.',
  Urbano: 'Urbano perfecto para la ciudad: cabe en cualquier hueco y gasta muy poco.',
  Berlina: 'Berlina de representación, con un confort de marcha y un acabado difíciles de igualar.',
  Familiar: 'Familiar con un maletero enorme, cómodo en viajes largos y económico de mantener.',
  Monovolumen: 'Monovolumen práctico y espacioso, pensado para la familia.',
  Cabrio: 'Descapotable para disfrutar de cada trayecto con buen tiempo.',
  Furgoneta: 'Furgoneta versátil, lista para trabajar o para el ocio.'
};
const MOTOR = {
  Gasolina: x => `Motor de gasolina de ${x.cv} CV, suave y fiable.`,
  'Diésel': x => `Motor diésel de ${x.cv} CV, ideal si haces muchos kilómetros en carretera.`,
  'Híbrido': () => 'Híbrido con etiqueta ECO: gasta poco en ciudad y entra sin problema en las zonas de bajas emisiones.',
  'Híbrido enchufable': () => 'Híbrido enchufable con etiqueta 0: el día a día en modo eléctrico y sin restricciones de acceso.',
  'Eléctrico': () => '100 % eléctrico con etiqueta 0: sin gasolina, sin restricciones y con un coste por kilómetro mínimo.',
  GLP: x => `Motor bifuel GLP de ${x.cv} CV con etiqueta ECO: repostar sale mucho más barato.`
};
function textoIA(x) {
  const d = S().dealer;
  const eq = (x.equipamiento || []).slice(0, 5);
  return [
    `${x.marca} ${x.modelo} ${x.version || ''}`.replace(/\s+/g, ' ').trim() + ` · ${x.anio} · ${App.km(x.km || 0)}`,
    '',
    `${INTRO[x.carroceria] || 'Coche cómodo, fiable y listo para el día a día.'} ${(MOTOR[x.combustible] || MOTOR.Gasolina)(x)}`,
    '',
    'Lo que más gusta:',
    ...eq.map(e => '• ' + e),
    `• Cambio ${String(x.cambio || 'manual').toLowerCase()} y ${x.cv} CV`,
    (x.duenos || 1) === 1 ? '• Un solo propietario y libro de revisiones al día' : '• Libro de revisiones al día',
    x.itv ? `• ITV en vigor hasta ${mesAnio(x.itv)}` : null,
    '',
    `Por qué comprarlo en ${d.nombre}:`,
    `✔ ${x.garantia || d.garantia} meses de garantía`,
    '✔ Revisado y preparado en nuestro taller',
    x.precio ? `✔ Financiación a tu medida: desde ${App.num(db.cuota(x.precio))} €/mes` : '✔ Financiación a tu medida',
    '✔ Aceptamos tu coche como parte del pago',
    '',
    `Ven a verlo a ${d.direccion} o escríbenos por WhatsApp al ${d.whatsapp}.`
  ].filter(l => l !== null).join('\n');
}
/* efecto de escritura de la IA */
function escribir(el, texto, onDone) {
  let i = 0; const paso = Math.max(2, Math.round(texto.length / 150));
  const prop = 'value' in el && el.tagName !== 'DIV' ? 'value' : 'textContent';
  el.classList.add('is-typing');
  const t = setInterval(() => {
    if (!el.isConnected) { clearInterval(t); onDone && onDone(); return; }
    i = Math.min(texto.length, i + paso);
    el[prop] = texto.slice(0, i);
    el.scrollTop = el.scrollHeight;
    if (i >= texto.length) { clearInterval(t); el.classList.remove('is-typing'); onDone && onDone(); }
  }, 16);
}

/* plantillas de ficha técnica para «Buscar datos» */
const PLANTILLAS = [
  {marca: 'Volkswagen', modelo: 'Golf', version: 'Life 1.5 TSI 130 CV', anio: 2021, min: 2020, combustible: 'Gasolina', cv: 130, cambio: 'Manual', carroceria: 'Compacto'},
  {marca: 'Toyota', modelo: 'C-HR', version: '125H Advance', anio: 2021, min: 2017, combustible: 'Híbrido', cv: 122, cambio: 'Automático', carroceria: 'SUV'},
  {marca: 'Peugeot', modelo: '3008', version: '1.2 PureTech 130 CV Allure Pack', anio: 2022, min: 2017, combustible: 'Gasolina', cv: 130, cambio: 'Manual', carroceria: 'SUV'},
  {marca: 'BMW', modelo: 'Serie 1', version: '118i M Sport 136 CV', anio: 2022, min: 2019, combustible: 'Gasolina', cv: 136, cambio: 'Automático', carroceria: 'Compacto'},
  {marca: 'Hyundai', modelo: 'Tucson', version: '1.6 TGDI 48V Tecno 150 CV', anio: 2022, min: 2021, combustible: 'Híbrido', cv: 150, cambio: 'Automático', carroceria: 'SUV'},
  {marca: 'Renault', modelo: 'Captur', version: 'E-Tech full hybrid 145 Techno', anio: 2023, min: 2021, combustible: 'Híbrido', cv: 143, cambio: 'Automático', carroceria: 'SUV'},
  {marca: 'Mercedes-Benz', modelo: 'Clase A', version: 'A 180 d Progressive Line', anio: 2020, min: 2018, combustible: 'Diésel', cv: 116, cambio: 'Automático', carroceria: 'Compacto'},
  {marca: 'Skoda', modelo: 'Octavia Combi', version: '2.0 TDI 116 CV Style', anio: 2021, min: 2020, combustible: 'Diésel', cv: 116, cambio: 'Manual', carroceria: 'Familiar'},
  {marca: 'Cupra', modelo: 'Formentor', version: '1.5 TSI 150 CV DSG', anio: 2022, min: 2021, combustible: 'Gasolina', cv: 150, cambio: 'Automático', carroceria: 'SUV'},
  {marca: 'Tesla', modelo: 'Model 3', version: 'Gran Autonomía AWD', anio: 2021, min: 2019, combustible: 'Eléctrico', cv: 440, cambio: 'Automático', carroceria: 'Berlina'},
  {marca: 'Citroën', modelo: 'C4', version: 'PureTech 130 S&S Shine', anio: 2022, min: 2021, combustible: 'Gasolina', cv: 130, cambio: 'Manual', carroceria: 'Compacto'},
  {marca: 'Kia', modelo: 'Sportage', version: '1.6 T-GDi MHEV Drive 150 CV', anio: 2023, min: 2022, combustible: 'Híbrido', cv: 150, cambio: 'Manual', carroceria: 'SUV'}
];
const LETRA_ANIO = {B: 2001, C: 2003, D: 2005, F: 2007, G: 2009, H: 2012, J: 2015, K: 2018, L: 2020, M: 2022, N: 2024, P: 2025, R: 2026};
function plantilla(mat) {
  const clean = String(mat || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  const p = Object.assign({}, PLANTILLAS[hash(clean) % PLANTILLAS.length]);
  const m = clean.match(/^\d{4}([BCDFGHJKLMNPRSTVWXYZ])[A-Z]{2}$/);
  if (m && LETRA_ANIO[m[1]]) p.anio = App.clamp(LETRA_ANIO[m[1]], p.min, CUR_YEAR);
  p.etiqueta = etqDe(p.combustible, p.anio);
  delete p.min;
  return p;
}
const VINP = {Volkswagen: 'WVWZZZCD', Toyota: 'NMTKZ3BX', Peugeot: 'VF3MCYHZ', BMW: 'WBA7K110', Hyundai: 'TMAJ3815', Renault: 'VF1RJB00', 'Mercedes-Benz': 'W1K17708', Skoda: 'TMBJG7NX', Cupra: 'VSSZZZKM', Tesla: '5YJ3E7EB', 'Citroën': 'VR7BCZKX', Kia: 'U5YPU81A'};
const genVin = (marca, seed) => (VINP[marca] || 'VF1XXXXX') + Array.from({length: 9}, (_, i) => '0123456789ABCDEFGHJKLMNPRSTUVWXYZ'[hash(seed + i) % 33]).join('');

const EQUIP = ['Aire acondicionado', 'Climatizador bizona', 'Bluetooth', 'Apple CarPlay y Android Auto', 'Navegador', 'Control de crucero', 'Control de crucero adaptativo', 'Sensores de aparcamiento traseros', 'Cámara de visión trasera', 'Faros LED', 'Llantas de aleación', 'Arranque sin llave', 'Asientos calefactables', 'Carga inalámbrica', 'Detector de ángulo muerto', 'Asistente de mantenimiento de carril', 'Techo panorámico', 'Portón eléctrico', 'Cuadro digital'];
const COLORES = [['Blanco', '#F5F6F8'], ['Negro', '#111827'], ['Gris', '#8A919C'], ['Plata', '#C9CED6'], ['Azul', '#1D4ED8'], ['Rojo', '#DC2626'], ['Verde', '#15803D'], ['Beige', '#D6C6A5'], ['Marrón', '#7C4A21'], ['Amarillo', '#FACC15'], ['Naranja', '#EA580C']];

/* exponemos piezas para Portales y Tasaciones */
App.stk = {hash, rnd, round, plate, etiqueta, etqDe, plantilla, genVin, fotos: fotosOr, textoIA, mercado};

/* ---------- estado de la vista (no se guarda) ---------- */
const F = {q: '', estado: 'todos', carroceria: '', combustible: '', cambio: '', precio: '', orden: 'recientes', abiertos: false};
const tabs = {}, gal = {}, sim = {}, uploads = {};
const keepXMap = {};
let lastHash = null, busy = false, visorClose = null;

const PRECIOS = [['', 'Cualquier precio'], ['0-15000', 'Hasta 15.000 €'], ['15000-20000', '15.000 – 20.000 €'], ['20000-30000', '20.000 – 30.000 €'], ['30000-9999999', 'Más de 30.000 €']];
const ORDENES = [['recientes', 'Más recientes'], ['dias', 'Más días en stock'], ['precio-asc', 'Precio más bajo'], ['precio-desc', 'Precio más alto'], ['km', 'Menos kilómetros'], ['margen', 'Más margen'], ['leads', 'Más leads']];
const ESTADOS = [['todos', 'Todos'], ['disponible', 'Disponibles'], ['reservado', 'Reservados'], ['preparacion', 'En preparación'], ['mas90', '+90 días']];
const matchEstado = (v, e) => e === 'todos' ? true : e === 'mas90' ? db.diasStock(v) > 90 : v.estado === e;

function filtrar() {
  const words = App.norm(F.q).trim().split(/\s+/).filter(Boolean);
  const list = db.stock().filter(v => {
    if (!matchEstado(v, F.estado)) return false;
    if (F.carroceria && v.carroceria !== F.carroceria) return false;
    if (F.combustible && v.combustible !== F.combustible) return false;
    if (F.cambio && v.cambio !== F.cambio) return false;
    if (F.precio) { const [a, b] = F.precio.split('-').map(Number); if (v.precio < a || v.precio > b) return false; }
    if (words.length) { const s = App.norm(`${v.marca} ${v.modelo} ${v.version} ${v.matricula} ${String(v.matricula).replace(/\s/g, '')} ${v.color} ${v.anio}`); if (!words.every(w => s.includes(w))) return false; }
    return true;
  });
  const by = {
    recientes: (a, b) => b.fechaEntrada.localeCompare(a.fechaEntrada),
    dias: (a, b) => db.diasStock(b) - db.diasStock(a),
    'precio-asc': (a, b) => a.precio - b.precio,
    'precio-desc': (a, b) => b.precio - a.precio,
    km: (a, b) => a.km - b.km,
    margen: (a, b) => db.margen(b) - db.margen(a),
    leads: (a, b) => nLeads(b) - nLeads(a) || db.visitas(b) - db.visitas(a)
  };
  return list.sort(by[F.orden] || by.recientes);
}

function keepX(root) {
  App.$$('[data-keep-x]', root).forEach(el => {
    const k = el.dataset.keepX;
    if (keepXMap[k] != null) el.scrollLeft = keepXMap[k];
    el.addEventListener('scroll', () => { keepXMap[k] = el.scrollLeft; }, {passive: true});
  });
}

/* =====================================================================
   LISTADO
   ===================================================================== */
function renderList() {
  const stock = db.stock();
  const total = stock.length;
  const expo = App.sum(stock, v => v.precio);
  const media = total ? Math.round(App.sum(stock, v => db.diasStock(v)) / total) : 0;
  const list = filtrar();
  const vista = S().prefs.vistaStock === 'table' ? 'table' : 'grid';
  const count = e => stock.filter(v => matchEstado(v, e)).length;
  const sumE = e => App.sum(stock.filter(v => matchEstado(v, e)), v => v.precio);
  const nFiltros = ['carroceria', 'combustible', 'cambio', 'precio'].filter(k => F[k]).length;
  const hayFiltros = nFiltros || F.q.trim() || F.estado !== 'todos';
  const opts = k => [...new Set(stock.map(v => v[k]))].sort((a, b) => a.localeCompare(b, 'es'));
  const sel = (k, todos, values) => html`<select class="select select--sm stk-sel ${F[k] ? 'is-on' : ''}" data-act-change="stk-f" data-k="${k}" aria-label="${todos}">
    <option value="">${todos}</option>${values.map(o => html`<option value="${o}" ${F[k] === o ? 'selected' : ''}>${o} (${stock.filter(v => v[k] === o).length})</option>`)}</select>`;
  const TILES = [
    {id: 'disponible', label: 'Disponibles', ic: 'circle-check', tone: 'green', sub: eur(sumE('disponible')) + ' a la venta'},
    {id: 'reservado', label: 'Reservados', ic: 'bookmark', tone: 'amber', sub: 'con señal · ' + eur(sumE('reservado'))},
    {id: 'preparacion', label: 'En preparación', ic: 'wrench', tone: 'blue', sub: 'en el taller'},
    {id: 'mas90', label: 'Más de 90 días', ic: 'hourglass', tone: 'red', sub: count('mas90') ? 'revisa su precio' : 'ninguno parado'}
  ];

  return html`
  <div class="page-head">
    <div><h1>Stock</h1><p>${plural(total, 'vehículo', 'vehículos')} · ${eur(expo)} en exposición · ${media} días de media</p></div>
    <div class="page-head__actions">
      <button class="btn" data-act="go" data-href="#/portales">${icon('globe', 16)}<span class="hide-m">Publicar en portales</span><span class="show-m">Portales</span></button>
      <button class="btn" data-act="stk-export">${icon('download', 16)}Exportar</button>
      <button class="btn btn--primary" data-act="stk-alta">${icon('plus', 16)}Dar de alta</button>
    </div>
  </div>

  <div class="stk-tiles">${TILES.map(t => html`
    <button class="stk-tile stk-tile--${t.tone} ${F.estado === t.id ? 'is-on' : ''}" data-act="stk-estado-f" data-estado="${t.id}">
      <span class="stk-tile__ico">${icon(t.ic, 17)}</span>
      <span class="stk-tile__txt"><b class="tnum">${count(t.id)}</b><span>${t.label}</span><small>${t.sub}</small></span>
    </button>`)}</div>

  <div class="card stk-filters" data-tour="stock-filtros">
    <div class="stk-filters__top">
      <div class="input-group stk-search">${icon('search', 16)}
        <input class="input" id="stkQ" type="search" placeholder="Marca, modelo o matrícula" value="${F.q}" data-act-input="stk-q" autocomplete="off" enterkeyhint="search">
      </div>
      <button class="btn show-m stk-ftoggle ${F.abiertos || nFiltros ? 'is-on' : ''}" data-act="stk-filtros" aria-expanded="${F.abiertos ? 'true' : 'false'}">${icon('sliders-horizontal', 16)}${nFiltros ? html`<span class="stk-count">${nFiltros}</span>` : ''}</button>
      <div class="seg stk-vista" role="group" aria-label="Vista">
        <button class="${vista === 'grid' ? 'is-on' : ''}" data-act="stk-vista" data-vista="grid" title="Rejilla">${icon('layout-grid', 16)}<span class="hide-m">Rejilla</span></button>
        <button class="${vista === 'table' ? 'is-on' : ''}" data-act="stk-vista" data-vista="table" title="Tabla">${icon('list', 16)}<span class="hide-m">Tabla</span></button>
      </div>
    </div>
    <div class="stk-chips" data-keep-x="stk-chips">${ESTADOS.map(([id, label]) => html`<button class="chip ${F.estado === id ? 'is-on' : ''}" data-act="stk-estado-f" data-estado="${id}">${label}<span class="chip__n">${count(id)}</span></button>`)}</div>
    <div class="stk-selects ${F.abiertos ? 'is-open' : ''}">
      ${sel('carroceria', 'Carrocería', opts('carroceria'))}
      ${sel('combustible', 'Combustible', opts('combustible'))}
      ${sel('cambio', 'Cambio', opts('cambio'))}
      <select class="select select--sm stk-sel ${F.precio ? 'is-on' : ''}" data-act-change="stk-f" data-k="precio" aria-label="Precio">${PRECIOS.map(([id, l]) => html`<option value="${id}" ${F.precio === id ? 'selected' : ''}>${l}</option>`)}</select>
      <span class="stk-selects__sp"></span>
      <label class="stk-orden"><span class="hide-m">${icon('arrow-down', 14)}Ordenar</span>
        <select class="select select--sm" data-act-change="stk-f" data-k="orden" aria-label="Ordenar">${ORDENES.map(([id, l]) => html`<option value="${id}" ${F.orden === id ? 'selected' : ''}>${l}</option>`)}</select></label>
    </div>
  </div>

  <div class="stk-results between">
    <span class="small muted">${list.length === total ? html`Mostrando los <b class="ink">${total}</b> coches` : html`<b class="ink">${list.length}</b> de ${total} coches`}</span>
    ${hayFiltros ? html`<button class="link-btn" data-act="stk-limpiar">${icon('x', 14)}Quitar filtros</button>` : ''}
  </div>

  ${!list.length ? html`<div class="card">${ui.empty('search', 'Ningún coche con esos filtros', 'Prueba a quitar algún filtro o a buscar por otra palabra.', html`<button class="btn" data-act="stk-limpiar">Quitar filtros</button>`)}</div>`
    : vista === 'grid' ? html`<div class="stk-grid" data-tour="stock-list">${list.map(card)}</div>`
    : tabla(list)}`;
}

function card(v) {
  const fs = fotosOr(v), m = db.margen(v), pa = activos(v);
  return html`<article class="stk-card" data-act="vehiculo" data-id="${v.id}">
    <div class="stk-card__media">
      <div class="stk-card__track">${fs.map((f, i) => html`<img src="${f.s}" srcset="${f.ph || f.local ? '' : `${f.s} 560w, ${f.l} 1280w`}" sizes="(max-width: 900px) 92vw, 380px" alt="${ui.vehNombre(v)}" loading="${i ? 'lazy' : 'eager'}" draggable="false">`)}</div>
      ${fs.length > 1 ? html`
        <button class="stk-card__nav stk-card__nav--prev" data-act="stk-foto" data-dir="-1" aria-label="Foto anterior">${icon('chevron-left', 18)}</button>
        <button class="stk-card__nav stk-card__nav--next" data-act="stk-foto" data-dir="1" aria-label="Foto siguiente">${icon('chevron-right', 18)}</button>
        <div class="stk-card__dots">${fs.map((f, i) => html`<i class="${i ? '' : 'is-on'}"></i>`)}</div>` : ''}
      <div class="stk-card__tags">${estadoPill(v)}${v.destacado ? html`<span class="stk-pill stk-pill--star">${icon('star', 12)}Destacado</span>` : ''}</div>
      <div class="stk-card__dias">${diasPill(v)}</div>
    </div>
    <div class="stk-card__body">
      <div class="stk-card__head">
        <div class="grow"><h3 class="ellipsis">${ui.vehNombre(v)}</h3><p class="ellipsis">${v.version}</p></div>
        <button class="icon-btn stk-card__more" data-act="stk-menu" data-id="${v.id}" aria-label="Más acciones">${icon('more-horizontal', 18)}</button>
      </div>
      <div class="stk-card__price">
        <div><b class="tnum">${eur(v.precio)}</b><span>desde ${App.num(db.cuota(v.precio))} €/mes</span></div>
        <div class="stk-card__margin ${m < 0 ? 'is-neg' : ''}"><span>Margen</span><b class="tnum">${eur(m)}</b></div>
      </div>
      <div class="stk-card__specs"><span>${v.anio}</span><span>${App.km(v.km)}</span><span>${v.combustible}</span><span>${v.cambio}</span></div>
      <div class="stk-card__foot">
        <div class="stk-stamps">${pa.length ? pa.map(p => ui.portal(p, 'sm')) : html`<span class="xs faint">Sin publicar</span>`}</div>
        <div class="stk-card__stats"><span title="Leads">${icon('message-circle', 14)}${nLeads(v)}</span><span title="Visitas">${icon('eye', 14)}${App.k(db.visitas(v))}</span></div>
      </div>
    </div>
  </article>`;
}

function tabla(list) {
  return html`<div class="card stk-tablecard" data-tour="stock-list"><div class="table-wrap"><table class="table stk-table">
    <thead><tr><th>Vehículo</th><th>Matrícula</th><th>Año · km</th><th class="r">Precio</th><th class="r">Margen</th><th>Días</th><th class="c">Leads</th><th class="r">Visitas</th><th>Portales</th><th>Estado</th></tr></thead>
    <tbody>${list.map(v => { const m = db.margen(v); const pa = activos(v); return html`<tr class="is-link" data-act="vehiculo" data-id="${v.id}">
      <td><div class="cell-main stk-table__car">${html`<img class="thumb" src="${fotosOr(v)[0].s}" alt="" loading="lazy">`}<span class="grow"><b>${ui.vehNombre(v)}${v.destacado ? html` <span class="stk-star">${icon('star', 12)}</span>` : ''}</b><span>${v.version}</span></span></div></td>
      <td>${plate(v.matricula, 'stk-plate--sm')}</td>
      <td class="nowrap">${v.anio}<span class="muted"> · ${App.km(v.km)}</span></td>
      <td class="r"><b class="tnum">${eur(v.precio)}</b><div class="xs muted nowrap">${App.num(db.cuota(v.precio))} €/mes</div></td>
      <td class="r tnum nowrap ${m < 0 ? 'red' : 'green'} semi">${eur(m)}<div class="xs muted">${App.pct(m / v.precio * 100, 1)}</div></td>
      <td>${ui.dias(v)}</td>
      <td class="c tnum">${nLeads(v)}</td>
      <td class="r tnum">${App.num(db.visitas(v))}</td>
      <td><div class="stk-stamps">${pa.length ? pa.map(p => ui.portal(p, 'sm')) : html`<span class="xs faint">—</span>`}</div></td>
      <td>${ui.vehEstado(v.estado)}</td>
    </tr>`; })}</tbody></table></div></div>`;
}

function exportar() {
  const list = filtrar();
  const cols = [
    ['Marca', v => v.marca], ['Modelo', v => v.modelo], ['Versión', v => v.version], ['Matrícula', v => v.matricula], ['Bastidor', v => v.bastidor],
    ['Año', v => v.anio], ['Km', v => v.km], ['Combustible', v => v.combustible], ['Cambio', v => v.cambio], ['CV', v => v.cv], ['Carrocería', v => v.carroceria],
    ['Color', v => v.color], ['Etiqueta', v => v.etiqueta], ['Precio', v => v.precio], ['Precio mínimo', v => v.precioMin], ['Precio compra', v => v.precioCompra],
    ['Gastos', v => App.sum(v.gastos || [], g => g.importe)], ['Coste total', v => db.costeTotal(v)], ['Margen', v => db.margen(v)],
    ['Estado', v => (C.ESTADOS_VEH[v.estado] || {}).label], ['Días en stock', v => db.diasStock(v)], ['Visitas', v => db.visitas(v)], ['Leads', v => nLeads(v)],
    ['Portales', v => activos(v).map(pLabel).join(', ')], ['Ubicación', v => v.ubicacion], ['Entrada', v => App.fechaNum(v.fechaEntrada)]
  ];
  const cell = x => { const s = String(x == null ? '' : x); return /[;"\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
  const csv = '﻿' + [cols.map(c => c[0]).join(';'), ...list.map(v => cols.map(c => cell(c[1](v))).join(';'))].join('\r\n');
  const url = URL.createObjectURL(new Blob([csv], {type: 'text/csv;charset=utf-8'}));
  const a = document.createElement('a');
  a.href = url; a.download = `stock-${App.norm(S().dealer.corto).replace(/[^a-z0-9]+/g, '-')}-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 3000);
  App.toast(`${plural(list.length, 'coche exportado', 'coches exportados')}`, {sub: 'Archivo CSV listo para abrir en Excel', icon: 'download'});
}

/* =====================================================================
   FICHA
   ===================================================================== */
const TABS = [
  {id: 'resumen', label: 'Resumen', ic: 'car-front'},
  {id: 'portales', label: 'Portales', ic: 'globe', n: v => activos(v).length, tour: 'veh-portales'},
  {id: 'interesados', label: 'Interesados', ic: 'users', n: v => db.leadsDe(v.id).length, tour: 'veh-leads'},
  {id: 'costes', label: 'Costes y margen', ic: 'calculator', tour: 'veh-margen'},
  {id: 'documentacion', label: 'Documentación', ic: 'files', n: v => { const d = docsOf(v); return `${DOCS.filter(x => d[x.id]).length}/${DOCS.length}`; }},
  {id: 'historial', label: 'Historial', ic: 'history'}
];
const TAB_ALIAS = {leads: 'interesados', margen: 'costes', docs: 'documentacion'};

function renderFicha(route) {
  const v = db.veh(route.id);
  if (!v) return html`<div class="card mt-24">${ui.empty('car', 'No encontramos este coche', 'Puede que se haya borrado o que el enlace no sea correcto.', html`<a class="btn" href="#/stock">Volver al stock</a>`)}</div>`;
  const tab = tabs[v.id] || 'resumen';
  const P = {resumen: tabResumen, portales: tabPortales, interesados: tabInteresados, costes: tabCostes, documentacion: tabDocs, historial: tabHistorial}[tab] || tabResumen;
  return html`
  ${v.estado === 'vendido' ? soldBanner(v) : ''}
  <div class="stk-hero">
    ${gallery(v)}
    ${infoPanel(v)}
  </div>
  <div class="tabs stk-tabs" role="tablist" data-keep-x="tabs">${TABS.map(t => { const on = t.id === tab; const n = t.n ? t.n(v) : null; return html`
    <button class="tab ${on ? 'is-on' : ''}" role="tab" aria-selected="${on ? 'true' : 'false'}" data-act="stk-tab" data-tab="${t.id}" ${!on && t.tour ? App.raw(`data-tour="${t.tour}"`) : ''}>${icon(t.ic, 16)}${t.label}${n != null && n !== 0 ? html`<span class="chip__n">${n}</span>` : ''}</button>`; })}</div>
  <div class="stk-panel fade-in">${P(v)}</div>`;
}

function soldBanner(v) {
  const c = db.contact(v.cliente), u = db.user(v.vendedor);
  return html`<div class="stk-sold">
    <span class="stk-sold__ico">${icon('badge-euro', 20)}</span>
    <div class="grow"><b>Vendido ${App.rel(v.fechaVenta)}${c ? html` a <a href="#/leads/${c.id}">${c.nombre}</a>` : ''}</b>
    <span>${eur(v.precioVenta)} · margen ${eur(db.margen(v))} · ${db.diasStock(v)} días en stock${v.financiado ? ' · financiado' : ''}${u ? ` · lo vendió ${first(u.nombre)}` : ''}</span></div>
    <span class="badge badge--dark">${icon('eye-off', 12)}Retirado de los portales</span>
  </div>`;
}

function gallery(v) {
  const fs = fotosOr(v); const i = App.clamp(gal[v.id] || 0, 0, fs.length - 1);
  return html`<div class="stk-gal">
    <div class="stk-gal__main" data-act="stk-visor">
      <img src="${fs[i].l}" alt="${ui.vehNombre(v)}" id="stkGalImg">
      ${fs.length > 1 ? html`<button class="stk-gal__nav stk-gal__nav--prev" data-act="stk-gal" data-dir="-1" aria-label="Foto anterior">${icon('chevron-left', 22)}</button>
      <button class="stk-gal__nav stk-gal__nav--next" data-act="stk-gal" data-dir="1" aria-label="Foto siguiente">${icon('chevron-right', 22)}</button>` : ''}
      <div class="stk-gal__tl">${v.fotosMejoradas && !fs[0].ph ? html`<span class="stk-pill stk-pill--ia">${icon('sparkles', 12)}Retocadas con IA</span>` : ''}${estadoPill(v)}</div>
      <div class="stk-gal__br"><span class="stk-pill" id="stkGalN">${icon('camera', 12)}${i + 1} / ${fs.length}</span><span class="stk-pill stk-pill--btn hide-m">${icon('maximize-2', 12)}Pantalla completa</span></div>
    </div>
    <div class="stk-gal__thumbs" data-keep-x="thumbs-${v.id}">${fs.map((f, k) => html`<button class="stk-gal__th ${k === i ? 'is-on' : ''}" data-act="stk-gal-go" data-i="${k}" aria-label="Foto ${k + 1}"><img src="${f.s}" alt="" loading="lazy"></button>`)}
      ${v.estado !== 'vendido' ? html`<label class="stk-gal__add" title="Añadir fotos">${icon('camera', 18)}<span>Añadir</span><input type="file" accept="image/*" multiple class="stk-hidden-input" id="stkAddFotos"></label>` : ''}
    </div>
  </div>`;
}

function galGo(v, i) {
  const fs = fotosOr(v); i = (i + fs.length) % fs.length; gal[v.id] = i;
  const img = App.$('#stkGalImg'); if (img) img.src = fs[i].l;
  const n = App.$('#stkGalN'); if (n) n.innerHTML = App.str(html`${icon('camera', 12)}${i + 1} / ${fs.length}`);
  App.$$('.stk-gal__th').forEach((b, k) => { b.classList.toggle('is-on', k === i); if (k === i) b.scrollIntoView({block: 'nearest', inline: 'nearest'}); });
}

function infoPanel(v) {
  const est = C.ESTADOS_VEH[v.estado] || C.ESTADOS_VEH.disponible;
  const pa = activos(v), vendido = v.estado === 'vendido';
  const orig = precioOriginal(v), m = db.margen(v);
  const fact = (ic, k, val) => html`<div class="stk-fact" title="${k}: ${val}">${icon(ic, 16)}<span>${k}</span><b>${val}</b></div>`;
  return html`<aside class="card stk-info">
    <div class="stk-info__top">
      ${vendido ? ui.vehEstado('vendido') : html`<button class="badge badge--lg badge--${est.badge} badge--dot stk-estado" data-act="stk-estado" data-id="${v.id}" title="Cambiar estado">${est.label}${icon('chevron-down', 13)}</button>`}
      ${ui.dias(v)}
      <span class="grow"></span>
      ${vendido ? '' : html`<button class="icon-btn stk-fav ${v.destacado ? 'is-on' : ''}" data-act="stk-destacar" data-id="${v.id}" title="${v.destacado ? 'Quitar de destacados' : 'Destacar en los portales'}" aria-label="Destacar">${icon('star', 18)}</button>
      <button class="icon-btn" data-act="stk-mas" data-id="${v.id}" aria-label="Más acciones">${icon('more-horizontal', 18)}</button>`}
    </div>
    <h1 class="stk-info__name">${ui.vehNombre(v)}</h1>
    <p class="stk-info__ver">${v.version}</p>
    <div class="stk-info__ids">${plate(v.matricula)}${etiqueta(v.etiqueta)}<span class="small muted row-sm">${icon('map-pin', 14)}${v.ubicacion}</span></div>
    <div class="stk-info__price">
      <div class="row wrap"><b class="tnum">${eur(vendido ? v.precioVenta : v.precio)}</b>${orig && !vendido ? html`<s class="tnum">${eur(orig)}</s><span class="badge badge--green">${icon('trending-down', 12)}${eur(orig - v.precio)}</span>` : ''}</div>
      <span>${vendido ? `Vendido el ${App.fechaNum(v.fechaVenta)}` : html`o desde <b class="ink">${App.num(db.cuota(v.precio))} €/mes</b> · 96 meses sin entrada`}</span>
    </div>
    <div class="stk-facts">
      ${fact('calendar', 'Año', v.anio)}${fact('gauge', 'Kilómetros', App.num(v.km))}${fact('fuel', 'Combustible', v.combustible)}
      ${fact('settings', 'Cambio', v.cambio)}${fact('zap', 'Potencia', v.cv + ' CV')}${fact('shield-check', 'Garantía', v.garantia + ' meses')}
    </div>
    ${vendido ? '' : html`<div class="stk-info__actions">
      <button class="btn btn--primary" data-act="stk-presupuesto" data-id="${v.id}">${icon('file-text', 16)}Presupuesto</button>
      <button class="btn" data-act="stk-cita" data-id="${v.id}">${icon('calendar-plus', 16)}Cita</button>
    </div>
    <div class="stk-info__more">
      <button class="btn btn--sm btn--ghost" data-act="stk-editar" data-id="${v.id}">${icon('pencil', 15)}Editar</button>
      <button class="btn btn--sm btn--ghost" data-act="stk-cartel" data-id="${v.id}">${icon('printer', 15)}Cartel</button>
      <button class="btn btn--sm btn--ghost" data-act="stk-vender" data-id="${v.id}">${icon('badge-euro', 15)}Vendido</button>
    </div>`}
    <div class="stk-info__stats">
      <div><span>Visitas</span><b class="tnum">${App.num(db.visitas(v))}</b></div>
      <div><span>Leads</span><b class="tnum">${nLeads(v)}</b></div>
      <div><span>Portales</span><b class="tnum">${vendido ? '0' : pa.length}/6</b></div>
      <div><span>Margen</span><b class="tnum ${m < 0 ? 'red' : 'green'}">${eur(m)}</b></div>
    </div>
  </aside>`;
}

/* ---------- pestaña Resumen ---------- */
function tabResumen(v) {
  const eqs = v.equipamiento || [];
  const specs = [
    ['Marca', v.marca], ['Modelo', v.modelo], ['Año', v.anio], ['1.ª matriculación', v.fechaMatriculacion ? App.fechaNum(v.fechaMatriculacion) : '—'],
    ['Kilómetros', App.km(v.km)], ['Combustible', v.combustible], ['Cambio', v.cambio], ['Potencia', v.cv + ' CV'],
    ['Carrocería', v.carroceria], ['Color', v.color], ['Puertas', v.puertas || 5], ['Plazas', v.plazas || 5],
    ['Etiqueta DGT', v.etiqueta], ['Garantía', v.garantia + ' meses'], ['Propietarios', v.duenos || 1], ['ITV hasta', mesAnio(v.itv)],
    ['Estado general', v.estadoGeneral || '—'], ['Ubicación', v.ubicacion]
  ];
  return html`<div class="stk-cols stk-cols--resumen">
    <div class="stack">
      <section class="card">
        <div class="card__head"><h3>${icon('clipboard-list', 17)}Ficha técnica</h3>${v.estado !== 'vendido' ? html`<button class="btn btn--sm btn--ghost" data-act="stk-editar" data-id="${v.id}">${icon('pencil', 14)}Editar</button>` : ''}</div>
        <div class="card__body">
          <div class="spec stk-spec">${specs.map(([k, val]) => html`<div class="spec__item"><span>${k}</span><b>${val}</b></div>`)}</div>
          <div class="stk-vin"><span>Bastidor</span><b class="mono">${v.bastidor || '—'}</b><button class="link-btn" data-act="stk-copiar" data-txt="${v.bastidor}">${icon('copy', 13)}Copiar</button></div>
        </div>
      </section>
      <section class="card">
        <div class="card__head"><h3>${icon('list-checks', 17)}Equipamiento <span class="chip__n">${eqs.length}</span></h3></div>
        <div class="card__body">${eqs.length ? html`<div class="stk-eq">${eqs.map(e => html`<span class="stk-eq__item">${icon('check', 14)}${e}</span>`)}</div>` : html`<p class="small muted">Sin equipamiento anotado. Añádelo desde «Editar».</p>`}</div>
      </section>
      <section class="card stk-desc">
        <div class="card__head"><div><h3>${icon('message-square-text', 17)}Descripción del anuncio</h3><p>La misma en tu web y en todos los portales</p></div>
          ${v.estado !== 'vendido' ? html`<button class="btn btn--sm stk-ia-btn" data-act="stk-ia-desc" data-id="${v.id}">${icon('sparkles', 15)}Mejorar con IA</button>` : ''}</div>
        <div class="card__body"><div class="stk-desc__txt" id="stkDesc">${v.descripcion || 'Sin descripción todavía.'}</div></div>
        <div class="card__foot"><span class="xs muted">${App.num((v.descripcion || '').length)} caracteres</span><button class="link-btn" data-act="stk-copiar" data-txt="${v.descripcion || ''}">${icon('copy', 14)}Copiar texto</button></div>
      </section>
    </div>
    <div class="stack">
      ${v.estado === 'vendido' ? '' : mercadoCard(v)}
      ${fotosIACard(v)}
      ${citasCard(v)}
    </div>
  </div>`;
}

function mercadoCard(v) {
  const m = mercado(v), dias = db.diasStock(v);
  const tone = m.estado === 'alto' ? (dias > 60 ? 'red' : 'amber') : m.estado === 'bajo' ? 'green' : 'blue';
  const label = {alto: 'Por encima de la media', medio: 'En precio de mercado', bajo: 'Por debajo de la media'}[m.estado];
  const coste = db.costeTotal(v);
  let rec, btn = '';
  if (m.estado === 'alto' && dias > 45) {
    rec = html`Lleva <b>${dias} días</b> y está ${eur(m.diff)} por encima de la media. Si lo dejas en <b>${eur(m.sugerido)}</b> queda por debajo de la media y sigues ganando ${eur(m.sugerido - coste)}.`;
    btn = html`<button class="btn btn--sm btn--block mt-12" data-act="stk-precio" data-id="${v.id}" data-precio="${m.sugerido}">${icon('trending-down', 15)}Bajar a ${eur(m.sugerido)}</button>`;
  } else if (m.estado === 'alto') {
    rec = html`Está algo por encima de la media: normal si tiene menos kilómetros o más equipamiento. Vigílalo a partir de los 45 días.`;
  } else if (m.estado === 'bajo') {
    rec = html`Está ${eur(-m.diff)} por debajo de la media. Podrías subirlo hasta <b>${eur(m.media)}</b> sin salir del precio de mercado.`;
    btn = html`<button class="btn btn--sm btn--block mt-12" data-act="stk-precio" data-id="${v.id}" data-precio="${m.media}">${icon('trending-up', 15)}Subir a ${eur(m.media)}</button>`;
  } else {
    rec = html`Precio competitivo: está en la media de ${m.n} anuncios parecidos. No hace falta tocarlo.`;
  }
  return html`<section class="card stk-mkt">
    <div class="card__head"><div><h3>${icon('scale', 17)}Precio frente al mercado</h3><p>${m.n} anuncios parecidos en portales</p><span class="badge badge--${tone}">${label}</span></div></div>
    <div class="card__body">
      <div class="stk-mkt__nums">
        <div><span>Tu precio</span><b class="tnum">${eur(v.precio)}</b></div>
        <div><span>Media</span><b class="tnum">${eur(m.media)}</b></div>
        <div><span>Diferencia</span><b class="tnum ${tone}">${m.diff > 0 ? '+' : m.diff < 0 ? '−' : ''}${eur(Math.abs(m.diff))}</b></div>
      </div>
      <div class="stk-mkt__bar">
        <div class="stk-mkt__track"></div>
        <i class="stk-mkt__avg" style="left:${(m.posMedia * 100).toFixed(1)}%"><span>Media</span></i>
        <i class="stk-mkt__you stk-mkt__you--${tone}" style="left:${(m.pos * 100).toFixed(1)}%"><span>Tú</span></i>
      </div>
      <div class="between xs muted tnum"><span>${eur(m.min)}</span><span>${eur(m.max)}</span></div>
      <div class="stk-mkt__rec">${icon('lightbulb', 16)}<p>${rec}</p></div>
      ${btn}
    </div>
  </section>`;
}

function fotosIACard(v) {
  const fs = fotosOr(v);
  if (fs[0].ph) return html`<section class="card card--pad stk-fotosia"><div class="stk-fotosia__row"><span class="stk-ia-ico">${icon('camera', 18)}</span><div class="grow"><b>Sin fotos todavía</b><p class="small muted">Añade fotos y la IA las deja listas para los portales.</p></div></div>
    <label class="btn btn--block mt-12">${icon('upload', 16)}Subir fotos<input type="file" accept="image/*" multiple class="stk-hidden-input" data-stk-upload="fotos"></label></section>`;
  if (v.fotosMejoradas) return html`<section class="card card--pad stk-fotosia is-done">
    <div class="stk-fotosia__row"><span class="stk-ia-ico">${icon('sparkles', 18)}</span><div class="grow"><b>Fotos retocadas con IA</b><p class="small muted">Fondo limpio, luz corregida y matrícula tapada en ${plural(fs.length, 'foto', 'fotos')}.</p></div>${icon('badge-check', 22, 'green')}</div>
    <div class="stk-ba"><figure><img src="${fs[0].s}" alt="" class="stk-ba__antes"><figcaption>Antes</figcaption></figure><figure><img src="${fs[0].s}" alt=""><figcaption>Después</figcaption></figure></div>
  </section>`;
  return html`<section class="card card--pad stk-fotosia" id="stkFotosIA">
    <div class="stk-fotosia__row"><span class="stk-ia-ico">${icon('sparkles', 18)}</span><div class="grow"><b>Mejora las fotos con IA</b><p class="small muted">Fondo de exposición, luz corregida y matrícula tapada en segundos.</p></div></div>
    <div class="stk-fotosia__prog hidden" id="stkIAProg"><div class="between small"><span id="stkIAStep" class="semi">Preparando…</span><span class="muted tnum" id="stkIAPct">0 %</span></div><div class="progress mt-8"><i style="width:0%"></i></div></div>
    <button class="btn btn--accent btn--block mt-12" data-act="stk-retocar" data-id="${v.id}">${icon('sparkles', 16)}Retocar ${plural(fs.length, 'foto', 'fotos')} con IA</button>
  </section>`;
}

function citasCard(v) {
  const now = nowISO();
  const evs = S().events.filter(e => e.vehicleId === v.id && e.inicio >= App.today().toISOString() && e.estado !== 'cancelada').slice(0, 4);
  return html`<section class="card">
    <div class="card__head"><h3>${icon('calendar-check', 17)}Próximas citas</h3>${v.estado !== 'vendido' ? html`<button class="btn btn--xs" data-act="stk-cita" data-id="${v.id}">${icon('plus', 13)}Cita</button>` : ''}</div>
    ${evs.length ? html`<div class="list">${evs.map(e => { const c = db.contact(e.contactId); return html`<div class="list__item ${c ? 'is-link' : ''}" ${c ? App.raw(`data-act="contacto" data-id="${App.esc(c.id)}"`) : ''}>
      ${ui.evTipo(e.tipo)}<div class="list__main"><b>${c ? c.nombre : e.titulo}</b><span>${e.inicio < now ? 'Hoy ' + App.hora(e.inicio) : App.relFuture(e.inicio)} · ${first((db.user(e.userId) || {}).nombre)}</span></div>${ui.estado('ESTADOS_EV', e.estado)}</div>`; })}</div>`
    : html`<div class="card__body"><p class="small muted">Nadie tiene cita para ver este coche.</p></div>`}
  </section>`;
}

/* ---------- pestaña Portales ---------- */
function tabPortales(v) {
  const pa = activos(v), vendido = v.estado === 'vendido';
  const data = C.PORTALES.map(p => ({p, x: v.portales[p] || {}})).filter(o => o.x.visitas > 0);
  return html`<div class="stk-cols" data-tour="veh-portales">
    <section class="card">
      <div class="card__head">
        <div><h3>${icon('globe', 17)}Publicación en portales</h3><p>${vendido ? 'Retirado de todos al venderse' : `${pa.length} de ${C.PORTALES.length} activos · un cambio aquí se aplica en todos`}</p></div>
        ${vendido ? '' : pa.length < C.PORTALES.length ? html`<button class="btn btn--accent btn--sm" data-act="stk-pub-todos" data-id="${v.id}" id="stkPubTodos">${icon('send', 15)}Publicar en todos</button>` : html`<span class="badge badge--green">${icon('check', 12)}En todos</span>`}
      </div>
      <div class="stk-prows">${C.PORTALES.map(p => { const x = v.portales[p] || {}; const on = !!x.on; return html`
        <div class="stk-prow ${on ? 'is-on' : ''}" data-portal="${p}">
          ${ui.portal(p, 'lg')}
          <div class="stk-prow__main"><b>${pLabel(p)}</b><span class="stk-prow__st">${on ? html`<i class="status-dot status-dot--green"></i>Publicado desde el ${App.fecha(x.desde)}` : 'Sin publicar'}</span></div>
          <div class="stk-prow__stats">
            <span><b class="tnum">${App.num(x.visitas || 0)}</b>visitas</span>
            <span><b class="tnum">${x.favoritos || 0}</b>favoritos</span>
            <span><b class="tnum">${x.leads || 0}</b>leads</span>
          </div>
          <button class="btn btn--xs btn--ghost stk-prow__ver" data-act="stk-ver-anuncio" data-id="${v.id}" data-portal="${p}" ${on ? '' : 'disabled'}>${icon('external-link', 13)}<span class="hide-m">Ver anuncio</span></button>
          ${vendido ? '' : html`<button class="switch ${on ? 'is-on' : ''}" data-act="stk-portal" data-id="${v.id}" data-portal="${p}" aria-label="${on ? 'Retirar de' : 'Publicar en'} ${pLabel(p)}"></button>`}
        </div>`; })}
      </div>
    </section>
    <div class="stack">
      <section class="card">
        <div class="card__head"><div><h3>${icon('bar-chart-3', 17)}Visitas por portal</h3><p>${App.num(db.visitas(v))} visitas · ${App.num(db.leadsPortales(v))} leads desde que se publicó</p></div></div>
        <div class="card__body">${data.length ? App.chart.hbars(data.map(({p, x}) => ({label: pLabel(p), value: x.visitas, color: p === 'web' ? 'var(--ink-2)' : C.origen(p).color, sub: `${App.num(x.visitas)} · ${x.leads} leads`}))) : html`<p class="small muted">Todavía sin visitas. Publícalo y aquí verás qué portal le trae más interesados.</p>`}</div>
      </section>
      <section class="card card--pad stk-note">
        <span class="stk-note__ico">${icon('refresh-cw', 18)}</span>
        <div><b>Todo sincronizado</b><p class="small muted">Si cambias el precio, las fotos o la descripción, se actualiza en todos los portales. Al venderlo se retira solo de todos.</p></div>
      </section>
    </div>
  </div>`;
}

/* ---------- pestaña Interesados ---------- */
function tabInteresados(v) {
  const list = db.leadsDe(v.id).sort(porEtapa);
  if (!list.length) return html`<section class="card" data-tour="veh-leads">${ui.empty('users', 'Nadie ha preguntado todavía por este coche', 'Cuando entre un lead de un portal, de la web o de WhatsApp, aparecerá aquí.', v.estado !== 'vendido' ? html`<button class="btn" data-act="stk-tab" data-tab="portales">${icon('globe', 16)}Ver portales</button>` : '')}</section>`;
  const calientes = list.filter(c => c.temperatura === 'caliente').length;
  const act = interesadosActivos(v);
  return html`<section class="card" data-tour="veh-leads">
    <div class="card__head">
      <div><h3>${icon('users', 17)}Interesados en este coche</h3><p>${plural(list.length, 'contacto', 'contactos')}${calientes ? ` · ${calientes} ${calientes === 1 ? 'caliente' : 'calientes'}` : ''}</p></div>
      ${act.length && v.estado !== 'vendido' ? html`<button class="btn btn--sm" data-act="stk-precio" data-id="${v.id}">${icon('trending-down', 15)}<span class="hide-m">Bajar precio y avisar</span><span class="show-m">Avisar</span></button>` : ''}
    </div>
    <div class="stk-leads">
      <div class="stk-lead stk-lead--head hide-m"><span>Contacto</span><span>Etapa</span><span>Temperatura</span><span>Origen</span><span>Último contacto</span><span></span></div>
      ${list.map(c => html`<div class="stk-lead" data-act="contacto" data-id="${c.id}">
        <div class="stk-lead__who">${App.avatar(c.nombre)}<div class="grow"><b class="ellipsis">${c.nombre}${v.reservadoPor === c.id ? html` <span class="badge badge--amber">${icon('bookmark', 11)}Reserva</span>` : ''}</b><span class="ellipsis">${c.tel}${c.financiar ? ' · quiere financiar' : ''}${c.cocheACuenta ? ' · coche a cuenta' : ''}</span></div></div>
        <div class="stk-lead__cell">${ui.etapa(c.etapa)}</div>
        <div class="stk-lead__cell">${ui.temp(c.temperatura)}</div>
        <div class="stk-lead__cell">${ui.origen(c.origen)}</div>
        <div class="stk-lead__cell small muted">${App.rel(c.ultimoContacto)}</div>
        <div class="stk-lead__acts">
          <button class="btn btn--sm btn--wa" data-act="whatsapp" data-id="${c.id}">${icon('message-circle', 15)}<span class="hide-m">WhatsApp</span></button>
          <button class="btn btn--sm btn--icon" data-act="llamar" data-id="${c.id}" aria-label="Llamar" title="Llamar">${icon('phone', 15)}</button>
        </div>
      </div>`)}
    </div>
  </section>`;
}

/* ---------- pestaña Costes y margen ---------- */
function tabCostes(v) {
  const gastos = v.gastos || [];
  const vendido = v.estado === 'vendido';
  const coste = db.costeTotal(v), tg = App.sum(gastos, g => g.importe);
  const precio = vendido ? v.precioVenta : v.precio;
  const m = precio - coste, pct = precio ? m / precio * 100 : 0;
  const w = x => Math.max(0, x / Math.max(precio, coste) * 100).toFixed(2);
  const lo = round(Math.min(coste, v.precioMin || coste) * .96), hi = round(precio * 1.06);
  const s = App.clamp(sim[v.id] != null ? sim[v.id] : precio, lo, hi);
  const hist = cambiosPrecio(v);
  return html`<div class="stk-cols stk-cols--even" data-tour="veh-margen">
    <div class="stack">
      <section class="card">
        <div class="card__head"><div><h3>${icon('receipt', 17)}Costes</h3><p>Todo lo que ha costado dejarlo listo para vender</p></div></div>
        <div class="stk-costs">
          <div class="stk-cost stk-cost--main"><span class="stk-cost__k">${icon('handshake', 16)}Precio de compra</span>
            <div class="stk-cost__val">${vendido ? html`<b class="tnum">${eur(v.precioCompra)}</b>` : html`<input class="stk-inline tnum" type="number" inputmode="numeric" step="50" value="${v.precioCompra}" data-act-change="stk-compra" data-id="${v.id}" aria-label="Precio de compra"><span class="muted">€</span>`}</div></div>
          ${gastos.map((g, i) => html`<div class="stk-cost"><span class="stk-cost__k">${icon(gastoIcon(g.concepto), 16)}${g.concepto}</span>
            <div class="stk-cost__val"><b class="tnum">${eur(g.importe)}</b>${vendido ? '' : html`<button class="icon-btn stk-cost__del" data-act="stk-gasto-del" data-id="${v.id}" data-i="${i}" aria-label="Quitar gasto" title="Quitar gasto">${icon('trash-2', 15)}</button>`}</div></div>`)}
          ${vendido ? '' : html`<form class="stk-cost-add" id="stkGastoForm" data-id="${v.id}" autocomplete="off">
            <input class="input input--sm" id="stkGConcepto" placeholder="Nuevo gasto (p. ej. Lunas tintadas)" list="stkGastosSug" aria-label="Concepto">
            <div class="input-group stk-suf"><input class="input input--sm" id="stkGImporte" type="number" inputmode="numeric" placeholder="Importe" aria-label="Importe"><span class="input-group__suffix">€</span></div>
            <button class="btn btn--sm" type="submit">${icon('plus', 15)}Añadir</button>
            <datalist id="stkGastosSug"><option value="Transporte"><option value="Chapa y pintura"><option value="Neumáticos"><option value="Pastillas y discos"><option value="Cambio de aceite y filtros"><option value="Lunas tintadas"><option value="Gestoría y transferencia"><option value="Pulido de faros"></datalist>
          </form>`}
          <div class="stk-cost stk-cost--sub"><span class="stk-cost__k">Gastos de preparación</span><b class="tnum">${eur(tg)}</b></div>
          <div class="stk-cost stk-cost--total"><span class="stk-cost__k">Coste total</span><b class="tnum">${eur(coste)}</b></div>
        </div>
      </section>
      <section class="card">
        <div class="card__head"><div><h3>${icon('history', 17)}Historial de precio</h3><p>${hist.length ? plural(hist.length, 'cambio', 'cambios') : 'Sin cambios desde que entró'}</p></div></div>
        <div class="card__body">
          <div class="stk-ph">
            <div class="stk-ph__it"><i></i><div class="grow"><b>Entró a ${eur(hist.length ? hist[0].de : v.precio)}</b><span>${App.fechaNum(v.fechaEntrada)}</span></div></div>
            ${hist.map(h => html`<div class="stk-ph__it ${h.a < h.de ? 'is-down' : 'is-up'}"><i></i><div class="grow"><b>${h.a < h.de ? 'Bajada' : 'Subida'} a ${eur(h.a)}</b><span>${App.fechaNum(h.fecha)}</span></div><span class="badge badge--${h.a < h.de ? 'green' : 'amber'} tnum">${h.a < h.de ? '−' : '+'}${eur(Math.abs(h.a - h.de))}</span></div>`)}
          </div>
        </div>
      </section>
    </div>
    <section class="card stk-margin">
      <div class="card__head"><div><h3>${icon('badge-euro', 17)}Margen</h3><p>${vendido ? 'Resultado final de la venta' : 'Lo que ganas si se vende a este precio'}</p></div>${vendido ? '' : html`<button class="btn btn--sm" data-act="stk-precio" data-id="${v.id}">${icon('tag', 15)}Cambiar precio</button>`}</div>
      <div class="card__body">
        <div class="stk-margin__hero">
          <div><span>Margen</span><b class="tnum ${m < 0 ? 'red' : 'green'}">${eur(m)}</b></div>
          <div><span>Sobre el precio</span><b class="tnum">${App.pct(pct, 1)}</b></div>
          <div><span>${vendido ? 'Precio final' : 'Precio de venta'}</span><b class="tnum">${eur(precio)}</b></div>
        </div>
        <div class="stk-split" aria-hidden="true"><i class="stk-split__compra" style="width:${w(v.precioCompra)}%"></i><i class="stk-split__gastos" style="width:${w(tg)}%"></i><i class="stk-split__margen" style="width:${w(Math.max(m, 0))}%"></i></div>
        <div class="legend mt-8"><span><i class="stk-lg--compra"></i>Compra ${eur(v.precioCompra)}</span><span><i class="stk-lg--gastos"></i>Gastos ${eur(tg)}</span><span><i class="stk-lg--margen"></i>Margen ${eur(Math.max(m, 0))}</span></div>
        <dl class="dl stk-dl mt-16">
          <dt>Precio de venta</dt><dd class="tnum">${eur(precio)}</dd>
          <dt>Coste total</dt><dd class="tnum">− ${eur(coste)}</dd>
          ${vendido ? '' : html`<dt>Precio mínimo</dt><dd class="tnum">${eur(v.precioMin)} <span class="muted small">· margen ${eur(v.precioMin - coste)}</span></dd>`}
          <dt>Comisión si financia</dt><dd class="tnum green">+ ${eur(round(precio * .025, 10))} <span class="muted small">aprox.</span></dd>
        </dl>
        ${vendido ? '' : html`<div class="stk-sim" data-id="${v.id}" data-coste="${coste}" data-min="${v.precioMin}" data-precio="${precio}">
          <div class="stk-sim__txt" id="stkSimTxt">${simTxt(s, coste, v.precioMin, precio)}</div>
          <input type="range" class="range" id="stkSim" min="${lo}" max="${hi}" step="50" value="${s}" aria-label="Simular precio">
          <div class="between xs muted tnum"><span>${eur(lo)}</span><span>${eur(hi)}</span></div>
          <button class="btn btn--sm btn--block mt-12 ${s === precio ? 'hidden' : ''}" id="stkSimApply" data-act="stk-precio" data-id="${v.id}" data-precio="${s}">${icon('check', 15)}Poner a ${eur(s)}</button>
        </div>`}
      </div>
    </section>
  </div>`;
}
function simTxt(s, coste, min, precio) {
  const g = s - coste;
  const note = g < 0 ? html`<small class="red">${icon('alert-triangle', 13)}Perderías dinero</small>` : s < min ? html`<small class="amber">${icon('alert-triangle', 13)}Por debajo de tu precio mínimo</small>` : s === precio ? html`<small class="muted">Precio actual</small>` : html`<small class="muted">${s < precio ? '−' : '+'}${eur(Math.abs(s - precio))} sobre el precio actual</small>`;
  return html`<span>Si lo dejas en <b class="tnum">${eur(s)}</b>, ganas <b class="tnum ${g < 0 ? 'red' : 'green'}">${eur(g)}</b></span>${note}`;
}

/* ---------- pestaña Documentación ---------- */
function tabDocs(v) {
  const d = docsOf(v), done = DOCS.filter(x => d[x.id]).length;
  const files = DOCS.filter(x => d[x.id] && ['permiso', 'ficha', 'dgt', 'contrato'].includes(x.id)).map(x => ({name: x.label + '.pdf', size: 180 + hash(v.id + x.id) % 900, fecha: x.id === 'dgt' && v.dgt ? v.dgt.fecha : v.fechaEntrada}))
    .concat(uploads[v.id] || []);
  return html`<div class="stk-cols">
    <section class="card">
      <div class="card__head"><div><h3>${icon('files', 17)}Documentación del coche</h3><p>${done === DOCS.length ? 'Todo en regla para vender' : `${done} de ${DOCS.length} en regla · faltan ${DOCS.length - done}`}</p></div>
        <span class="badge badge--lg ${done === DOCS.length ? 'badge--green' : 'badge--amber'} tnum">${Math.round(done / DOCS.length * 100)} %</span></div>
      <div class="stk-docs__bar"><div class="progress ${done === DOCS.length ? 'progress--green' : 'progress--amber'}"><i style="width:${(done / DOCS.length * 100).toFixed(1)}%"></i></div></div>
      <div class="stk-docs">${DOCS.map(x => html`<button class="stk-doc ${d[x.id] ? 'is-ok' : ''}" data-act="stk-doc" data-id="${v.id}" data-doc="${x.id}" ${v.estado === 'vendido' ? 'disabled' : ''}>
        <span class="stk-doc__check">${icon('check', 14)}</span>
        <span class="stk-doc__ico">${icon(x.icon, 17)}</span>
        <span class="stk-doc__txt"><b>${x.label}</b><small>${x.sub(v)}</small></span>
        <span class="badge ${d[x.id] ? 'badge--green' : 'badge--amber'}">${d[x.id] ? 'OK' : 'Falta'}</span>
      </button>`)}</div>
    </section>
    <div class="stack">
      <section class="card stk-dgt">
        <div class="card__head"><div><h3>${icon('landmark', 17)}Informe de la DGT</h3><p>Cargas, embargos, titulares e ITV</p></div>${v.dgt ? html`<span class="badge badge--green">${icon('check', 12)}Limpio</span>` : ''}</div>
        <div class="card__body" id="stkDgtBody">${v.dgt ? dgtResult(v) : html`<p class="small muted">Comprueba en segundos que no tiene cargas, embargos ni reserva de dominio antes de venderlo.</p>
          <button class="btn btn--primary btn--block mt-12" data-act="stk-dgt" data-id="${v.id}">${icon('search', 16)}Consultar DGT</button>`}</div>
      </section>
      <section class="card">
        <div class="card__head"><div><h3>${icon('paperclip', 17)}Archivos</h3><p>${plural(files.length, 'documento', 'documentos')}</p></div>
          <label class="btn btn--sm">${icon('upload', 15)}Subir<input type="file" multiple class="stk-hidden-input" data-stk-upload="docs"></label></div>
        ${files.length ? html`<div class="list">${files.map(f => html`<div class="list__item is-link" data-act="stk-archivo" data-name="${f.name}">
          <span class="stk-file">${icon('file-text', 16)}</span><div class="list__main"><b>${f.name}</b><span>${App.num(f.size)} KB · ${App.fecha(f.fecha)}</span></div>${icon('download', 16, 'faint')}</div>`)}</div>`
          : html`<div class="card__body"><p class="small muted">Sube el permiso, la ficha técnica o el contrato para tenerlo todo a mano.</p></div>`}
      </section>
    </div>
  </div>`;
}
function dgtResult(v) {
  const t = v.duenos || 1;
  return html`<div class="stk-dgt__ok">${icon('shield-check', 24)}<div><b>Sin cargas ni embargos</b><span>${t} ${t === 1 ? 'titular' : 'titulares'} · ITV favorable</span></div></div>
    <dl class="dl stk-dl mt-12">
      <dt>Reserva de dominio</dt><dd>No</dd>
      <dt>Titulares anteriores</dt><dd>${t}</dd>
      <dt>1.ª matriculación</dt><dd>${v.fechaMatriculacion ? App.fechaNum(v.fechaMatriculacion) : v.anio}</dd>
      <dt>Última ITV</dt><dd>Favorable · ${App.km(round(v.km * .86, 1000))}</dd>
      <dt>Etiqueta ambiental</dt><dd>${v.etiqueta}</dd>
      <dt>Baja o precinto</dt><dd>No consta</dd>
    </dl>
    <div class="between mt-12"><span class="xs muted">Consultado ${App.rel(v.dgt.fecha)}</span><button class="link-btn" data-act="stk-archivo" data-name="Informe DGT ${v.matricula}.pdf">${icon('download', 14)}Descargar informe</button></div>`;
}

/* ---------- pestaña Historial ---------- */
function tabHistorial(v) {
  const it = [];
  const now = nowISO();
  it.push({fecha: v.fechaEntrada, ic: 'car', tone: 'blue', t: 'Entró en stock', d: `Comprado por ${eur(v.precioCompra)} · ${v.ubicacion === 'Entregado' ? 'Exposición' : v.ubicacion}`});
  cambiosPrecio(v).forEach(h => it.push({fecha: h.fecha, ic: h.a < h.de ? 'trending-down' : 'trending-up', tone: h.a < h.de ? 'green' : 'amber', t: `${h.a < h.de ? 'Bajada' : 'Subida'} de precio a ${eur(h.a)}`, d: `Antes ${eur(h.de)}`}));
  const pubs = App.groupBy(activos(v).filter(p => v.portales[p].desde), p => v.portales[p].desde.slice(0, 10));
  Object.values(pubs).forEach(ps => it.push({fecha: v.portales[ps[0]].desde, ic: 'globe', tone: 'cyan', t: `Publicado en ${ps.map(pLabel).join(', ').replace(/, ([^,]*)$/, ' y $1')}`, d: 'Anuncio sincronizado desde el CRM'}));
  db.leadsDe(v.id).forEach(c => it.push({fecha: c.creado, ic: 'zap', tone: 'violet', t: `Lead de ${c.nombre}`, d: `Desde ${C.origen(c.origen).label}`, link: '#/leads/' + c.id}));
  S().events.filter(e => e.vehicleId === v.id).forEach(e => { const c = db.contact(e.contactId); const tp = C.TIPOS_EV[e.tipo] || C.TIPOS_EV.visita; it.push({fecha: e.inicio, ic: tp.icon, tone: 'amber', t: `${tp.label}${c ? ' con ' + c.nombre.split(' ').slice(0, 2).join(' ') : ''}`, d: `${(C.ESTADOS_EV[e.estado] || {}).label} · ${App.fechaHora(e.inicio)}`, futuro: e.inicio > now}); });
  S().quotes.filter(q => q.vehicleId === v.id).forEach(q => { const c = db.contact(q.contactId); it.push({fecha: q.fecha, ic: 'file-text', tone: 'pink', t: `Presupuesto ${q.numero}${c ? ' para ' + c.nombre.split(' ').slice(0, 2).join(' ') : ''}`, d: `${(C.ESTADOS_Q[q.estado] || {}).label} · ${eur(db.totalQuote(q).total)}`}); });
  if (v.dgt) it.push({fecha: v.dgt.fecha, ic: 'landmark', tone: 'green', t: 'Informe DGT consultado', d: 'Sin cargas ni embargos'});
  if (v.fechaVenta) it.push({fecha: v.fechaVenta, ic: 'badge-euro', tone: 'green', t: `Vendido por ${eur(v.precioVenta)}`, d: `Margen ${eur(db.margen(v))} · retirado de todos los portales`});
  it.sort((a, b) => b.fecha.localeCompare(a.fecha));
  return html`<section class="card">
    <div class="card__head"><div><h3>${icon('history', 17)}Historial del coche</h3><p>${plural(it.length, 'movimiento', 'movimientos')} desde que entró hace ${db.diasStock(v)} días</p></div></div>
    <div class="card__body"><div class="tl stk-tl">${it.map(x => html`<div class="tl__item stk-tl--${x.tone} ${x.link ? 'is-link' : ''}" ${x.link ? App.raw(`data-act="go" data-href="${App.esc(x.link)}"`) : ''}>
      <div class="tl__ico">${icon(x.ic, 15)}</div>
      <div class="tl__body"><div class="between"><b>${x.t}</b><span class="tl__time nowrap">${x.futuro ? html`<span class="badge badge--violet">Próxima</span> ` : ''}${App.fecha(x.fecha)}</span></div><div class="small muted">${x.d}</div></div>
    </div>`)}</div></div>
  </section>`;
}

/* =====================================================================
   MODALES Y ACCIONES DE LA FICHA
   ===================================================================== */
function publicarRapido(v, on) {
  const n = on ? C.PORTALES.filter(p => !v.portales[p].on).length : activos(v).length;
  App.store.update(() => C.PORTALES.forEach(p => { const x = v.portales[p]; if (x.on !== on) { x.on = on; x.desde = on ? nowISO() : null; } }), 'vehicles');
  db.log(`${on ? 'Publicado' : 'Retirado'}: ${ui.vehNombre(v)} ${on ? 'en' : 'de'} todos los portales`, {icon: 'globe', link: '#/stock/' + v.id});
  App.toast(on ? `Publicado en ${C.PORTALES.length} portales` : 'Retirado de todos los portales', {sub: `${ui.vehNombre(v)}${n ? ` · ${plural(n, 'cambio', 'cambios')}` : ''}`, icon: on ? 'globe' : 'eye-off'});
}

function setEstado(v, estado) {
  if (v.estado === estado) return;
  const patch = {estado};
  if (estado === 'preparacion') patch.ubicacion = 'Taller';
  if (estado !== 'preparacion' && v.ubicacion === 'Taller') patch.ubicacion = 'Exposición';
  if (v.estado === 'reservado') patch.reservadoPor = null;
  db.updateVehicle(v.id, patch);
  db.log(`${ui.vehNombre(v)} → ${C.ESTADOS_VEH[estado].label}`, {icon: 'car', link: '#/stock/' + v.id});
  const sinPortales = estado === 'disponible' && !activos(v).length;
  App.toast(`${ui.vehNombre(v)} · ${C.ESTADOS_VEH[estado].label}`, sinPortales ? {sub: 'Todavía no está en ningún portal', accion: 'Publicar', onAccion: () => publicarRapido(v, true), icon: 'car'} : {icon: 'car'});
}

function menuCoche(v, extra = false) {
  const on = activos(v).length;
  return [
    {header: ui.vehNombre(v)},
    extra ? {label: 'Editar ficha', icon: 'pencil', onClick: () => modalEditar(v)} : null,
    {label: 'Cambiar precio', icon: 'tag', onClick: () => modalPrecio(v)},
    on ? {label: 'Retirar de todos los portales', icon: 'eye-off', onClick: () => publicarRapido(v, false)} : {label: 'Publicar en todos los portales', icon: 'globe', onClick: () => publicarRapido(v, true)},
    v.estado === 'reservado' ? {label: 'Quitar reserva', icon: 'bookmark', onClick: () => setEstado(v, 'disponible')} : {label: 'Reservar', icon: 'bookmark', onClick: () => modalReservar(v)},
    {label: 'Marcar como vendido', icon: 'badge-euro', onClick: () => modalVender(v)},
    {label: 'Imprimir cartel', icon: 'printer', onClick: () => modalCartel(v)},
    extra ? {label: 'Crear tarea', icon: 'list-checks', onClick: () => App.nuevo('tarea', {vehicle: v.id})} : null,
    {sep: true},
    extra ? {label: 'Copiar enlace del anuncio', icon: 'link', onClick: () => copiar(`https://${S().dealer.web}/coches/${App.norm(v.marca + '-' + v.modelo).replace(/[^a-z0-9]+/g, '-')}-${v.id}`, 'Enlace del anuncio copiado')}
      : {label: 'Abrir ficha', icon: 'arrow-up-right', onClick: () => App.open.vehiculo(v.id)}
  ].filter(Boolean);
}

function copiar(txt, msg = 'Copiado') {
  try { navigator.clipboard && navigator.clipboard.writeText(txt).catch(() => {}); } catch (e) {}
  App.toast(msg, {icon: 'copy', sub: txt.length > 60 ? txt.slice(0, 57) + '…' : txt});
}

function modalPrecio(v, {precio} = {}) {
  const old = v.precio;
  const inter = interesadosActivos(v);
  const coste = db.costeTotal(v);
  const nombres = inter.slice(0, 3).map(c => first(c.nombre)).join(', ') + (inter.length > 3 ? ` y ${inter.length - 3} más` : '');
  App.modal({title: 'Cambiar precio', sub: `${ui.vehNombre(v)} · ${v.version}`, size: 'sm',
    body: html`<div class="stack">
      <div class="field"><label for="stkPNew">Nuevo precio de venta</label>
        <div class="input-group stk-suf stk-bigin"><input class="input tnum" id="stkPNew" type="number" inputmode="numeric" step="100" value="${precio || old}"><span class="input-group__suffix">€</span></div>
        <div class="stk-quick">${[-1000, -500, -300, 300].map(d => html`<button class="chip" type="button" data-d="${d}">${d > 0 ? '+' : '−'}${App.num(Math.abs(d))} €</button>`)}</div>
      </div>
      <div class="stk-pinfo" id="stkPInfo"></div>
      ${inter.length ? html`<label class="stk-notify" id="stkPNotify"><input type="checkbox" id="stkPAvisar" checked>
        <span class="stk-notify__ico">${icon('message-circle', 16)}</span>
        <span class="grow"><b>Avisar por WhatsApp a ${inter.length === 1 ? 'la persona interesada' : `los ${inter.length} interesados`}</b><small>${nombres} · la IA les escribe con el precio nuevo</small></span></label>`
      : html`<p class="small muted row-sm">${icon('info', 14)}Nadie ha preguntado todavía por este coche.</p>`}
    </div>`,
    foot: html`<button class="btn" data-close>Cancelar</button><button class="btn btn--primary" id="stkPOk">${icon('check', 16)}Guardar precio</button>`,
    onMount(n, close) {
      const inp = n.querySelector('#stkPNew');
      const draw = () => {
        const p = Math.round(+inp.value || 0), d = p - old, g = p - coste;
        n.querySelector('#stkPInfo').innerHTML = App.str(html`
          <div><span>Cambio</span><b class="tnum ${d < 0 ? 'green' : d > 0 ? 'amber' : ''}">${d > 0 ? '+' : d < 0 ? '−' : ''}${eur(Math.abs(d))}</b></div>
          <div><span>Margen</span><b class="tnum ${g < 0 ? 'red' : ''}">${eur(g)}</b></div>
          <div><span>Cuota</span><b class="tnum">${App.num(db.cuota(p))} €/mes</b></div>
          ${p && p < v.precioMin ? html`<p class="stk-pinfo__warn">${icon('alert-triangle', 14)}Por debajo de tu precio mínimo (${eur(v.precioMin)})</p>` : ''}`);
        const nt = n.querySelector('#stkPNotify');
        if (nt) { nt.classList.toggle('is-off', !(p < old)); nt.querySelector('input').disabled = !(p < old); }
      };
      inp.addEventListener('input', draw);
      n.querySelectorAll('.stk-quick [data-d]').forEach(b => b.onclick = () => { inp.value = Math.max(0, (+inp.value || old) + +b.dataset.d); draw(); });
      draw(); setTimeout(() => { inp.focus(); inp.select(); }, 80);
      const ok = () => {
        const nuevo = Math.round(+inp.value || 0);
        if (nuevo < 500) { inp.focus(); return App.toast('Pon un precio válido', {tipo: 'warn'}); }
        if (nuevo === old) return close();
        const avisar = !!(n.querySelector('#stkPAvisar') && n.querySelector('#stkPAvisar').checked && nuevo < old);
        const media = mercado(v).media;
        const d = S().dealer, cuota = db.cuota(nuevo), fecha = nowISO();
        App.store.update(s => {
          v.mercadoMedia = v.mercadoMedia || media;
          v.precioHistorial = (v.precioHistorial || []).concat({fecha, precio: old, nuevo});
          v.precio = nuevo;
          if (v.precioMin > nuevo || nuevo < old) v.precioMin = round(nuevo * .955);
          db.log(`${nuevo < old ? 'Rebaja' : 'Subida'}: ${ui.vehNombre(v)} de ${eur(old)} a ${eur(nuevo)}`, {icon: nuevo < old ? 'trending-down' : 'trending-up', link: '#/stock/' + v.id});
          if (avisar) inter.forEach(c => {
            s.messages.push({id: App.uid('m'), contactId: c.id, from: 'ia', texto: `Hola ${first(c.nombre)} 👋 Te escribo de ${d.corto}: el ${ui.vehNombre(v)} por el que preguntaste ha bajado de precio. Ahora está a ${eur(nuevo)} (antes ${eur(old)}), o desde ${App.num(cuota)} €/mes. ¿Te viene bien venir a verlo esta semana?`, fecha, leido: true, ia: true, auto: 'bajada'});
            c.timeline.unshift({id: App.uid('t'), tipo: 'automatizacion', texto: `Aviso de bajada de precio · ${ui.vehNombre(v)} a ${eur(nuevo)}`, fecha, autor: 'ia'});
            c.ultimoContacto = fecha;
          });
        }, 'vehicles');
        if (avisar) { App.emit('change', 'messages'); db.notify({titulo: 'Aviso de bajada enviado', texto: `${plural(inter.length, 'interesado', 'interesados')} · ${ui.vehNombre(v)} a ${eur(nuevo)}`, link: '#/stock/' + v.id, tipo: 'ia', icon: 'trending-down'}); }
        close();
        App.toast(`Precio actualizado a ${eur(nuevo)}`, {icon: nuevo < old ? 'trending-down' : 'trending-up', tipo: avisar ? 'wa' : 'ok', sub: avisar ? `Aviso por WhatsApp a ${plural(inter.length, 'interesado', 'interesados')} · portales al día` : 'Actualizado en la web y en los portales'});
      };
      n.querySelector('#stkPOk').onclick = ok;
      inp.onkeydown = e => { if (e.key === 'Enter') ok(); };
    }});
}

function clienteOpts(v, selected) {
  const inter = interesadosActivos(v).sort(porEtapa);
  const otros = db.activos().filter(c => !inter.includes(c)).sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
  const opt = c => html`<option value="${c.id}" ${c.id === selected ? 'selected' : ''}>${c.nombre} · ${C.etapa(c.etapa).label}</option>`;
  return html`${inter.length ? html`<optgroup label="Interesados en este coche">${inter.map(opt)}</optgroup>` : ''}<optgroup label="Otros clientes">${otros.map(opt)}</optgroup>`;
}

function modalReservar(v) {
  const inter = interesadosActivos(v).sort(porEtapa);
  const def = v.reservadoPor || (inter[0] && inter[0].id) || '';
  App.modal({title: 'Reservar coche', sub: `${ui.vehNombre(v)} · ${eur(v.precio)}`, size: 'sm',
    body: html`<div class="stack">
      <div class="field"><label for="stkRC">Cliente</label><select class="select" id="stkRC">${clienteOpts(v, def)}</select></div>
      <div class="field"><label for="stkRS">Señal</label><div class="input-group stk-suf"><input class="input tnum" id="stkRS" type="number" inputmode="numeric" step="50" value="300"><span class="input-group__suffix">€</span></div><span class="field__hint">Se descuenta del precio final</span></div>
      <div class="stk-callout">${icon('info', 16)}<span>En los portales aparecerá como «Reservado» y dejará de recibir leads nuevos.</span></div>
    </div>`,
    foot: html`<button class="btn" data-close>Cancelar</button><button class="btn btn--primary" id="stkROk">${icon('bookmark', 16)}Reservar</button>`,
    onMount(n, close) {
      n.querySelector('#stkROk').onclick = () => {
        const cid = n.querySelector('#stkRC').value, senal = Math.round(+n.querySelector('#stkRS').value || 0);
        const c = db.contact(cid);
        db.updateVehicle(v.id, {estado: 'reservado', reservadoPor: cid || null, senal, ubicacion: v.ubicacion === 'Taller' ? 'Exposición' : v.ubicacion});
        if (c) db.setEtapa(c.id, 'reservado', {silencioso: true});
        db.log(`Reserva: ${ui.vehNombre(v)}${c ? ' para ' + c.nombre : ''} · ${eur(senal)} de señal`, {icon: 'bookmark', link: '#/stock/' + v.id});
        close();
        App.toast(`Reservado${c ? ' para ' + first(c.nombre) : ''}`, {sub: `${ui.vehNombre(v)} · ${eur(senal)} de señal`, icon: 'bookmark'});
      };
    }});
}

function modalVender(v) {
  const inter = interesadosActivos(v).sort(porEtapa);
  const def = v.reservadoPor || (inter[0] && inter[0].id) || '';
  const pa = activos(v).length;
  const coste = db.costeTotal(v);
  const vendedores = S().users.filter(u => ['Comercial', 'Gerente'].includes(u.rol));
  const c0 = db.contact(def);
  App.modal({title: 'Marcar como vendido', sub: `${ui.vehNombre(v)} · ${v.matricula}`, size: 'sm',
    body: html`<div class="stack">
      <div class="field"><label for="stkVC">Cliente</label><select class="select" id="stkVC">${clienteOpts(v, def)}<option value="" ${def ? '' : 'selected'}>Cliente sin ficha en el CRM</option></select></div>
      <div class="form-grid">
        <div class="field"><label for="stkVP">Precio final</label><div class="input-group stk-suf"><input class="input tnum" id="stkVP" type="number" inputmode="numeric" step="50" value="${v.precio}"><span class="input-group__suffix">€</span></div></div>
        <div class="field"><label for="stkVU">Vendedor</label><select class="select" id="stkVU">${vendedores.map(u => html`<option value="${u.id}" ${u.id === ((c0 && c0.asignado) || S().me) ? 'selected' : ''}>${u.nombre}</option>`)}</select></div>
      </div>
      <label class="check"><input type="checkbox" id="stkVF" ${c0 && c0.financiar ? 'checked' : ''}>Lo financia con nosotros</label>
      <div class="stk-vres" id="stkVRes"></div>
    </div>`,
    foot: html`<button class="btn" data-close>Cancelar</button><button class="btn btn--primary" id="stkVOk">${icon('badge-euro', 16)}Confirmar venta</button>`,
    onMount(n, close) {
      const draw = () => {
        const p = Math.round(+n.querySelector('#stkVP').value || 0), m = p - coste;
        n.querySelector('#stkVRes').innerHTML = App.str(html`<div class="between"><span>Margen final</span><b class="tnum ${m < 0 ? 'red' : 'green'}">${eur(m)}</b></div>
          <div class="between small muted"><span>${pa ? `Se retira de ${plural(pa, 'portal', 'portales')} al momento` : 'No está publicado en ningún portal'}</span><span>${db.diasStock(v)} días en stock</span></div>`);
      };
      n.querySelector('#stkVP').addEventListener('input', draw); draw();
      n.querySelector('#stkVOk').onclick = () => {
        const precio = Math.round(+n.querySelector('#stkVP').value || 0);
        if (precio < 500) return App.toast('Pon el precio final de la venta', {tipo: 'warn'});
        const contactId = n.querySelector('#stkVC').value || null;
        db.venderVehiculo(v.id, {contactId, precio, userId: n.querySelector('#stkVU').value, financiado: n.querySelector('#stkVF').checked});
        close();
        App.toast('¡Coche vendido!', {icon: 'badge-euro', sub: `${ui.vehNombre(v)} · margen ${eur(precio - coste)}${pa ? ` · retirado de ${plural(pa, 'portal', 'portales')}` : ''}`});
      };
    }});
}

function modalEditar(v) {
  const f = (id, label, val, {type = 'text', span = '', suffix = '', step = ''} = {}) => html`<div class="field ${span}"><label for="stkE_${id}">${label}</label>${suffix
    ? html`<div class="input-group stk-suf"><input class="input" id="stkE_${id}" type="${type}" value="${val == null ? '' : val}" ${step ? App.raw(`step="${step}"`) : ''}><span class="input-group__suffix">${suffix}</span></div>`
    : html`<input class="input" id="stkE_${id}" type="${type}" value="${val == null ? '' : val}">`}</div>`;
  const sel = (id, label, opts, val) => html`<div class="field"><label for="stkE_${id}">${label}</label><select class="select" id="stkE_${id}">${opts.map(o => html`<option ${String(o) === String(val) ? 'selected' : ''}>${o}</option>`)}</select></div>`;
  App.modal({title: 'Editar vehículo', sub: `${ui.vehNombre(v)} · ${v.matricula}`, size: 'lg',
    body: html`<div class="form-grid form-grid--3">
      ${f('marca', 'Marca', v.marca)}${f('modelo', 'Modelo', v.modelo)}${f('anio', 'Año', v.anio, {type: 'number'})}
      ${f('version', 'Versión', v.version, {span: 'span-2'})}${f('km', 'Kilómetros', v.km, {type: 'number', suffix: 'km'})}
      ${sel('combustible', 'Combustible', C.COMBUSTIBLES, v.combustible)}${sel('cambio', 'Cambio', ['Manual', 'Automático'], v.cambio)}${f('cv', 'Potencia', v.cv, {type: 'number', suffix: 'CV'})}
      ${sel('carroceria', 'Carrocería', C.CARROCERIAS, v.carroceria)}${f('color', 'Color', v.color)}${sel('etiqueta', 'Etiqueta DGT', C.ETIQUETAS, v.etiqueta)}
      ${f('matricula', 'Matrícula', v.matricula)}${f('bastidor', 'Bastidor', v.bastidor, {span: 'span-2'})}
      ${sel('garantia', 'Garantía (meses)', [12, 24, 36, 48, 60, 84], v.garantia)}${f('itv', 'ITV hasta', v.itv, {type: 'month'})}${sel('duenos', 'Propietarios', [1, 2, 3, 4], v.duenos || 1)}
      ${sel('estadoGeneral', 'Estado general', ['Excelente', 'Muy bueno', 'Bueno', 'Normal'], v.estadoGeneral)}${sel('ubicacion', 'Ubicación', ['Exposición', 'Campa', 'Taller'], v.ubicacion)}${f('precioMin', 'Precio mínimo', v.precioMin, {type: 'number', suffix: '€', step: 100})}
      <div class="field span-all"><label>Equipamiento</label><div class="chips stk-eqpick">${[...new Set(EQUIP.concat(v.equipamiento || []))].map(e => html`<button type="button" class="chip ${(v.equipamiento || []).includes(e) ? 'is-on' : ''}" data-eq="${e}">${e}</button>`)}</div></div>
      <label class="check span-all"><input type="checkbox" id="stkE_destacado" ${v.destacado ? 'checked' : ''}>Destacar en los portales (sale arriba en los listados)</label>
    </div>`,
    foot: html`<span class="spacer small muted hide-m">El precio se cambia desde «Cambiar precio» para guardar el historial</span><button class="btn" data-close>Cancelar</button><button class="btn btn--primary" id="stkEOk">Guardar cambios</button>`,
    onMount(n, close) {
      n.querySelectorAll('[data-eq]').forEach(b => b.onclick = () => b.classList.toggle('is-on'));
      n.querySelector('#stkEOk').onclick = () => {
        const g = id => n.querySelector('#stkE_' + id).value.trim();
        const num = id => Math.round(+g(id) || 0);
        if (!g('marca') || !g('modelo')) return App.toast('La marca y el modelo no pueden quedar vacíos', {tipo: 'warn'});
        db.updateVehicle(v.id, {marca: g('marca'), modelo: g('modelo'), version: g('version'), anio: num('anio'), km: num('km'), combustible: g('combustible'), cambio: g('cambio'), cv: num('cv'),
          carroceria: g('carroceria'), color: g('color'), etiqueta: g('etiqueta'), matricula: g('matricula').toUpperCase(), bastidor: g('bastidor').toUpperCase(), garantia: num('garantia'), itv: g('itv') || v.itv,
          duenos: num('duenos'), estadoGeneral: g('estadoGeneral'), ubicacion: g('ubicacion'), precioMin: num('precioMin') || v.precioMin, destacado: n.querySelector('#stkE_destacado').checked,
          equipamiento: [...n.querySelectorAll('[data-eq].is-on')].map(b => b.dataset.eq)});
        close();
        App.toast('Ficha actualizada', {sub: activos(v).length ? `Cambios enviados a ${plural(activos(v).length, 'portal', 'portales')}` : ui.vehNombre(v)});
      };
    }});
}

/* ---------- cartel de parabrisas (A4) ---------- */
function cartelHTML(v) {
  const d = S().dealer;
  const facts = [['Año', v.anio], ['Kilómetros', App.num(v.km)], ['Combustible', v.combustible], ['Cambio', v.cambio], ['Potencia', v.cv + ' CV'], ['Color', v.color]];
  return App.str(html`<div class="stk-cartel" style="--brand:${d.color || '#1A56DB'}">
    <header class="stk-cartel__head">
      <div class="stk-cartel__logo">${d.siglas || App.initials(d.nombre)}</div>
      <div class="stk-cartel__dealer"><b>${d.nombre}</b><span>Vehículos de ocasión revisados · ${d.ciudad}</span></div>
      <div class="stk-cartel__etq">${etiqueta(v.etiqueta)}</div>
    </header>
    <div class="stk-cartel__model">
      <span class="stk-cartel__marca">${v.marca}</span>
      <h1 style="font-size:${Math.min(108, Math.round(690 / (String(v.modelo).length * .6)))}px">${v.modelo}</h1>
      <p>${v.version}</p>
    </div>
    <div class="stk-cartel__price">
      <div class="stk-cartel__big">${App.num(v.precio)}<small>€</small></div>
      <div class="stk-cartel__cuota">o desde <b>${App.num(db.cuota(v.precio))} €/mes*</b></div>
    </div>
    <div class="stk-cartel__facts">${facts.map(([k, val]) => html`<div><span>${k}</span><b>${val}</b></div>`)}</div>
    <div class="stk-cartel__perks">
      <div class="stk-cartel__gar">${icon('shield-check', 54)}<div><b>${v.garantia} meses</b><span>de garantía</span></div></div>
      <ul>
        <li>${icon('check', 20)}Revisado y preparado en nuestro taller</li>
        <li>${icon('check', 20)}Financiación a tu medida</li>
        <li>${icon('check', 20)}Aceptamos tu coche a cuenta</li>
        <li>${icon('check', 20)}${v.duenos === 1 ? 'Un solo propietario' : 'Libro de revisiones al día'}</li>
      </ul>
    </div>
    <footer class="stk-cartel__foot">
      <div><span>Pregunta por este coche</span><b>${d.tel}</b><em>WhatsApp ${d.whatsapp} · ${d.web}</em></div>
      <div class="stk-cartel__ref"><span>Ref.</span><b>${v.matricula}</b></div>
    </footer>
    <p class="stk-cartel__legal">*Cuota orientativa a 96 meses sin entrada con TIN ${App.dec(d.tin)} %, sujeta a la aprobación de la entidad financiera. ${d.razon} · ${d.direccion}.</p>
  </div>`);
}
function modalCartel(v) {
  const htmlStr = cartelHTML(v);
  App.modal({title: 'Cartel de parabrisas', sub: `${ui.vehNombre(v)} · A4 vertical`, size: 'lg', cls: 'stk-cartel-modal',
    body: html`<div class="stk-cartel-prev" id="stkCartelPrev"><div class="stk-cartel-prev__in">${App.raw(htmlStr)}</div></div>`,
    foot: html`<span class="spacer small muted hide-m">${icon('info', 14)} En el diálogo de impresión puedes elegir «Guardar como PDF»</span><button class="btn" data-close>Cerrar</button><button class="btn btn--primary" id="stkCartelOk">${icon('printer', 16)}Imprimir</button>`,
    onMount(n, close) {
      const box = n.querySelector('#stkCartelPrev'), inner = box.firstElementChild;
      const fit = () => { const s = box.clientWidth / 794; inner.style.transform = `scale(${s})`; box.style.height = Math.round(1123 * s) + 'px'; };
      requestAnimationFrame(fit); setTimeout(fit, 250);
      n.querySelector('#stkCartelOk').onclick = () => { close(); App.printHTML(htmlStr, {title: `Cartel ${ui.vehNombre(v)} ${v.matricula}`}); };
    }});
}

/* ---------- visor a pantalla completa ---------- */
function visor(v, start = 0) {
  if (visorClose) visorClose();
  const fs = fotosOr(v); let i = start;
  const node = App.el(App.str(html`<div class="stk-visor" role="dialog" aria-modal="true" aria-label="Fotos de ${ui.vehNombre(v)}">
    <div class="stk-visor__top"><div class="grow"><b>${ui.vehNombre(v)}</b><span>${v.version} · ${eur(v.precio)}</span></div><span class="stk-visor__n tnum" data-n></span><button class="stk-visor__btn" data-v="close" aria-label="Cerrar">${icon('x', 22)}</button></div>
    <div class="stk-visor__stage">
      ${fs.length > 1 ? html`<button class="stk-visor__btn stk-visor__nav" data-v="prev" aria-label="Anterior">${icon('chevron-left', 28)}</button>` : ''}
      <img data-img alt="">
      ${fs.length > 1 ? html`<button class="stk-visor__btn stk-visor__nav stk-visor__nav--r" data-v="next" aria-label="Siguiente">${icon('chevron-right', 28)}</button>` : ''}
    </div>
    <div class="stk-visor__thumbs">${fs.map((f, k) => html`<button data-v="go" data-i="${k}" aria-label="Foto ${k + 1}"><img src="${f.s}" alt=""></button>`)}</div>
    <div class="stk-visor__hint hide-m"><span class="kbd">←</span><span class="kbd">→</span> cambiar foto · <span class="kbd">esc</span> cerrar</div>
  </div>`));
  document.body.appendChild(node);
  const draw = () => {
    node.querySelector('[data-img]').src = fs[i].l;
    node.querySelector('[data-n]').textContent = `${i + 1} / ${fs.length}`;
    node.querySelectorAll('[data-v="go"]').forEach((b, k) => b.classList.toggle('is-on', k === i));
  };
  const go = k => { i = (k + fs.length) % fs.length; draw(); };
  const close = () => { document.removeEventListener('keydown', key, true); node.classList.remove('is-in'); setTimeout(() => node.remove(), 200); visorClose = null; galGo(v, i); };
  const key = e => {
    if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close(); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); go(i + 1); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); go(i - 1); }
  };
  document.addEventListener('keydown', key, true);
  node.addEventListener('click', e => {
    const b = e.target.closest('[data-v]');
    if (!b) { if (e.target === node || e.target.classList.contains('stk-visor__stage')) close(); return; }
    const a = b.dataset.v; if (a === 'close') close(); else if (a === 'prev') go(i - 1); else if (a === 'next') go(i + 1); else if (a === 'go') go(+b.dataset.i);
  });
  let x0 = null;
  node.addEventListener('touchstart', e => { x0 = e.touches[0].clientX; }, {passive: true});
  node.addEventListener('touchend', e => { if (x0 == null) return; const dx = e.changedTouches[0].clientX - x0; if (Math.abs(dx) > 40) go(i + (dx < 0 ? 1 : -1)); x0 = null; });
  draw();
  requestAnimationFrame(() => node.classList.add('is-in'));
  visorClose = close;
}

/* =====================================================================
   ALTA · asistente por pasos
   ===================================================================== */
const WZ0 = () => ({step: 1, max: 1, modo: 'matricula', matricula: '', bastidor: '', buscando: false, traido: false, manual: false, err: '',
  d: {marca: '', modelo: '', version: '', anio: '', combustible: 'Gasolina', cv: '', cambio: 'Manual', carroceria: 'Compacto'},
  km: '', precio: '', precioCompra: '', color: 'Blanco', garantia: 12, estadoGeneral: 'Muy bueno', ubicacion: 'Exposición', equipamiento: [], descripcion: '',
  fotos: [], ejemplo: false, retocar: true, estado: 'disponible', escribiendo: false,
  portales: {web: true, cochesnet: true, wallapop: true, milanuncios: true, autoscout: !!(S().integraciones || {}).autoscout, fbmarket: true}});
let wz = null;
const wzOk1 = () => wz.d.marca.trim() && wz.d.modelo.trim() && +wz.d.anio > 1990;
const wzOk2 = () => +wz.km >= 0 && wz.km !== '' && +wz.precio > 0;
const wzEtq = () => etqDe(wz.d.combustible, +wz.d.anio);

function renderWizard() {
  if (!wz) wz = WZ0();
  const steps = [['Matrícula', 'Ficha técnica'], ['Datos', 'Km, precio y extras'], ['Fotos', 'Con retoque IA'], ['Publicar', 'En los portales']];
  const body = [wzStep1, wzStep2, wzStep3, wzStep4][wz.step - 1]();
  return html`<div class="stk-wz">
    <div class="page-head">
      <div><h1>Dar de alta un coche</h1><p>Cuatro pasos y sin teclear la ficha técnica.</p></div>
      <div class="page-head__actions hide-m"><a class="btn btn--ghost" href="#/stock">${icon('x', 16)}Cancelar</a></div>
    </div>
    <ol class="stk-steps">${steps.map(([l, s], k) => { const n = k + 1; return html`<li class="stk-step ${wz.step === n ? 'is-on' : ''} ${wz.step > n ? 'is-done' : ''}">
      <button data-act="wz-go" data-step="${n}" ${n > wz.max ? 'disabled' : ''}><i>${wz.step > n ? icon('check', 14) : n}</i><span><b>${l}</b><small>${s}</small></span></button></li>`; })}</ol>
    <div class="stk-wz__grid">
      <section class="card stk-wz__card">
        <div class="stk-wz__body fade-in">${body}</div>
        <div class="stk-wz__foot">
          ${wz.step > 1 ? html`<button class="btn" data-act="wz-back">${icon('arrow-left', 16)}Atrás</button>` : html`<span></span>`}
          <span class="xs muted hide-m">Paso ${wz.step} de 4</span>
          ${wz.step < 4 ? html`<button class="btn btn--primary" data-act="wz-next">Siguiente${icon('arrow-right', 16)}</button>`
            : html`<button class="btn btn--accent" data-act="wz-guardar">${icon('check', 16)}${wz.estado === 'disponible' && wzNPortales() ? `Guardar y publicar` : 'Guardar coche'}</button>`}
        </div>
      </section>
      <aside class="stk-wz__aside" id="wzPreview">${wzPreview()}</aside>
    </div>
  </div>`;
}
const wzNPortales = () => C.PORTALES.filter(p => wz.portales[p]).length;

function wzStep1() {
  const d = wz.d;
  const inp = (k, label, {type = 'text', span = '', ph = ''} = {}) => html`<div class="field ${span}"><label for="wz_${k}">${label}</label><input class="input" id="wz_${k}" type="${type}" value="${d[k]}" placeholder="${ph}" data-act-input="wz-d" data-k="${k}"></div>`;
  const sel = (k, label, opts) => html`<div class="field"><label for="wz_${k}">${label}</label><select class="select" id="wz_${k}" data-act-change="wz-d" data-k="${k}">${opts.map(o => html`<option ${o === d[k] ? 'selected' : ''}>${o}</option>`)}</select></div>`;
  return html`
    <div class="stk-wz__title"><span class="stk-wz__n">1</span><div><h2>¿Qué coche es?</h2><p>Escribe la matrícula o el bastidor y traemos la ficha técnica.</p></div></div>
    <div class="seg stk-wz__modo"><button class="${wz.modo === 'matricula' ? 'is-on' : ''}" data-act="wz-modo" data-modo="matricula">Matrícula</button><button class="${wz.modo === 'bastidor' ? 'is-on' : ''}" data-act="wz-modo" data-modo="bastidor">Bastidor</button></div>
    <div class="stk-lookup">
      ${wz.modo === 'matricula'
        ? html`<label class="stk-plate stk-plate--input"><i>E</i><input id="wzMat" value="${wz.matricula}" placeholder="0000 XXX" maxlength="9" autocomplete="off" autocapitalize="characters" spellcheck="false" data-act-input="wz-set" data-k="matricula" aria-label="Matrícula"></label>`
        : html`<input class="input stk-vinin mono" id="wzVin" value="${wz.bastidor}" placeholder="VSSZZZKJZMR012345" maxlength="17" autocomplete="off" autocapitalize="characters" spellcheck="false" data-act-input="wz-set" data-k="bastidor" aria-label="Bastidor">`}
      <button class="btn btn--primary btn--lg" data-act="wz-buscar" ${wz.buscando ? 'disabled' : ''}>${wz.buscando ? html`${icon('refresh-cw', 17, 'spin')}Buscando…` : html`${icon('search', 17)}Buscar datos`}</button>
    </div>
    ${wz.err ? html`<p class="small red mt-8 row-sm">${icon('circle-alert', 14)}${wz.err}</p>` : html`<p class="xs muted mt-8">¿No tienes una a mano? Prueba con <button class="link-btn" data-act="wz-ejemplo">2841 LKS</button></p>`}
    ${wz.buscando ? html`<div class="stk-wz__skel"><div class="skel"></div><div class="skel"></div><div class="skel"></div><div class="skel"></div><div class="skel"></div><div class="skel"></div></div>` : ''}
    ${!wz.buscando && (wz.traido || wz.manual) ? html`
      ${wz.traido ? html`<div class="stk-found slide-in">${icon('circle-check', 20)}<div><b>Datos traídos de la ficha técnica</b><span>Revisa que todo esté bien: puedes cambiar cualquier campo.</span></div></div>` : ''}
      <div class="form-grid form-grid--3 mt-16">
        ${inp('marca', 'Marca', {ph: 'Volkswagen'})}${inp('modelo', 'Modelo', {ph: 'Golf'})}${inp('anio', 'Año', {type: 'number', ph: '2021'})}
        ${inp('version', 'Versión', {span: 'span-2', ph: 'Life 1.5 TSI 130 CV'})}${inp('cv', 'Potencia (CV)', {type: 'number', ph: '130'})}
        ${sel('combustible', 'Combustible', C.COMBUSTIBLES)}${sel('cambio', 'Cambio', ['Manual', 'Automático'])}${sel('carroceria', 'Carrocería', C.CARROCERIAS)}
      </div>`
    : !wz.buscando ? html`<button class="link-btn mt-16" data-act="wz-manual">${icon('pencil', 14)}Prefiero rellenarlo a mano</button>` : ''}`;
}
function wzMargen() {
  const p = +wz.precio || 0, c = +wz.precioCompra || 0;
  if (!p) return html`<span class="muted">${icon('calculator', 15)}Pon el precio y verás la cuota y el margen al momento</span>`;
  const coste = c ? c + 120 : 0, m = p - coste;
  return html`<span>${icon('wallet', 15)}Cuota desde <b class="tnum">${App.num(db.cuota(p))} €/mes</b></span>${c ? html`<span>Margen previsto <b class="tnum ${m < 0 ? 'red' : 'green'}">${eur(m)}</b> <span class="muted">(${App.pct(m / p * 100, 1)})</span></span>` : html`<span class="muted">Añade el precio de compra para ver el margen</span>`}`;
}
function wzStep2() {
  const seg = (k, opts, fmt = x => x) => html`<div class="seg">${opts.map(o => html`<button class="${String(wz[k]) === String(o) ? 'is-on' : ''}" data-act="wz-opt" data-k="${k}" data-val="${o}">${fmt(o)}</button>`)}</div>`;
  return html`
    <div class="stk-wz__title"><span class="stk-wz__n">2</span><div><h2>Datos y precio</h2><p>${wz.d.marca} ${wz.d.modelo} · ${wz.d.anio}</p></div></div>
    <div class="form-grid form-grid--3">
      <div class="field"><label for="wzKm">Kilómetros</label><div class="input-group stk-suf"><input class="input tnum" id="wzKm" type="number" inputmode="numeric" value="${wz.km}" placeholder="45000" data-act-input="wz-set" data-k="km"><span class="input-group__suffix">km</span></div></div>
      <div class="field"><label for="wzPrecio">Precio de venta</label><div class="input-group stk-suf"><input class="input tnum" id="wzPrecio" type="number" inputmode="numeric" step="100" value="${wz.precio}" placeholder="18900" data-act-input="wz-set" data-k="precio"><span class="input-group__suffix">€</span></div></div>
      <div class="field"><label for="wzCompra">Precio de compra</label><div class="input-group stk-suf"><input class="input tnum" id="wzCompra" type="number" inputmode="numeric" step="100" value="${wz.precioCompra}" placeholder="15400" data-act-input="wz-set" data-k="precioCompra"><span class="input-group__suffix">€</span></div></div>
    </div>
    <div class="stk-wz__margin" id="wzMargen">${wzMargen()}</div>
    ${wz.err ? html`<p class="small red mt-8 row-sm">${icon('circle-alert', 14)}${wz.err}</p>` : ''}
    <div class="field mt-16"><label>Color</label><div class="stk-colors">${COLORES.map(([n, hex]) => html`<button class="stk-color ${wz.color === n ? 'is-on' : ''}" data-act="wz-opt" data-k="color" data-val="${n}" title="${n}"><i style="background:${hex}"></i><span>${n}</span></button>`)}</div></div>
    <div class="stk-wz__opts">
      <div class="stk-wz__opt"><label>Garantía</label>${seg('garantia', [12, 24, 36], x => x + ' meses')}</div>
      <div class="stk-wz__opt"><label>Estado general</label>${seg('estadoGeneral', ['Excelente', 'Muy bueno', 'Bueno'])}</div>
      <div class="stk-wz__opt"><label>Ubicación</label>${seg('ubicacion', ['Exposición', 'Campa', 'Taller'])}</div>
    </div>
    <div class="field mt-16"><div class="between"><label>Equipamiento</label><span class="xs muted">${wz.equipamiento.length} elegidos</span></div>
      <div class="chips">${EQUIP.map(e => html`<button class="chip ${wz.equipamiento.includes(e) ? 'is-on' : ''}" data-act="wz-eq" data-eq="${e}">${wz.equipamiento.includes(e) ? icon('check', 13) : ''}${e}</button>`)}</div></div>
    <div class="field mt-16"><div class="between"><label for="wzDesc">Descripción del anuncio</label>
      <button class="btn btn--sm stk-ia-btn" data-act="wz-ia" ${wz.escribiendo ? 'disabled' : ''}>${icon('sparkles', 15)}${wz.escribiendo ? 'Escribiendo…' : 'Generar con IA'}</button></div>
      <textarea class="textarea stk-wz__desc" id="wzDesc" rows="7" placeholder="Pulsa «Generar con IA» y te la escribe con los datos del coche." data-act-input="wz-set" data-k="descripcion">${wz.descripcion}</textarea></div>`;
}
function wzStep3() {
  return html`
    <div class="stk-wz__title"><span class="stk-wz__n">3</span><div><h2>Fotos</h2><p>La primera es la portada en tu web y en todos los portales.</p></div></div>
    <label class="stk-drop" id="wzDrop">
      <input type="file" accept="image/*" multiple class="stk-hidden-input" id="wzFiles">
      <span class="stk-drop__ico">${icon('upload', 22)}</span>
      <b>Arrastra aquí las fotos o toca para elegirlas</b>
      <span class="small muted">Desde el ordenador o directamente desde la cámara del móvil</span>
    </label>
    <div class="between mt-12"><span class="small muted">${wz.fotos.length ? plural(wz.fotos.length, 'foto', 'fotos') : 'Sin fotos todavía'}</span><button class="link-btn" data-act="wz-fotos-ejemplo">${icon('image', 14)}Usar fotos de ejemplo</button></div>
    ${wz.fotos.length ? html`<div class="stk-thumbs">${wz.fotos.map((f, i) => html`<div class="stk-thumbs__it ${i === 0 ? 'is-cover' : ''}">
      <img src="${f.url}" alt="">
      ${i === 0 ? html`<span class="stk-pill stk-thumbs__tag">${icon('star', 11)}Portada</span>` : html`<button class="stk-thumbs__cover" data-act="wz-portada" data-i="${i}">Hacer portada</button>`}
      <button class="stk-thumbs__del" data-act="wz-foto-del" data-i="${i}" aria-label="Quitar foto">${icon('x', 14)}</button>
      ${wz.retocar ? html`<span class="stk-thumbs__ia">${icon('sparkles', 11)}</span>` : ''}
    </div>`)}</div>` : ''}
    <div class="stk-ia-row mt-16">
      <span class="stk-ia-ico">${icon('sparkles', 18)}</span>
      <div class="grow"><b>Retocar con IA</b><span class="small muted">Fondo de exposición, luz corregida y matrícula tapada.</span></div>
      <button class="switch ${wz.retocar ? 'is-on' : ''}" data-act="wz-retocar" aria-label="Retocar con IA"></button>
    </div>`;
}
function wzStep4() {
  const integ = S().integraciones || {};
  const prep = wz.estado === 'preparacion';
  return html`
    <div class="stk-wz__title"><span class="stk-wz__n">4</span><div><h2>Publicación</h2><p>Elige dónde se anuncia. Al guardar se publica en todos a la vez.</p></div></div>
    <div class="stk-wz__opt"><label>¿Cómo queda?</label><div class="seg">
      <button class="${!prep ? 'is-on' : ''}" data-act="wz-opt" data-k="estado" data-val="disponible">${icon('circle-check', 14)}Disponible</button>
      <button class="${prep ? 'is-on' : ''}" data-act="wz-opt" data-k="estado" data-val="preparacion">${icon('wrench', 14)}En preparación</button></div></div>
    ${prep ? html`<div class="stk-callout mt-12">${icon('info', 16)}<span>Se guarda sin publicar. Cuando lo pases a «Disponible» lo publicas con un toque.</span></div>` : ''}
    <div class="stk-prows stk-prows--wz ${prep ? 'is-off' : ''}">${C.PORTALES.map(p => { const on = !!wz.portales[p] && !prep; return html`
      <div class="stk-prow ${on ? 'is-on' : ''}">${ui.portal(p, 'lg')}
        <div class="stk-prow__main"><b>${pLabel(p)}</b><span>${p === 'autoscout' && !integ.autoscout ? 'Se sube por fichero una vez al día' : PORTAL[p].ficha}</span></div>
        <button class="switch ${on ? 'is-on' : ''}" data-act="wz-portal" data-portal="${p}" ${prep ? 'disabled' : ''} aria-label="${pLabel(p)}"></button>
      </div>`; })}</div>
    ${wzResumen()}`;
}
function wzResumen() {
  const d = wz.d, p = +wz.precio || 0, c = +wz.precioCompra || 0;
  const cover = wz.fotos[0] ? wz.fotos[0].url : 'img/placeholder.svg';
  return html`<div class="stk-sum">
    <img src="${cover}" alt="">
    <div class="grow">
      <b>${d.marca} ${d.modelo}</b><span class="ellipsis">${d.version || '—'}</span>
      <div class="stk-sum__row"><span>${d.anio}</span><span>${App.km(+wz.km || 0)}</span><span>${d.combustible}</span><span>${d.cambio}</span></div>
    </div>
    <div class="stk-sum__price"><b class="tnum">${eur(p)}</b><span>${App.num(db.cuota(p))} €/mes</span>${c ? html`<em class="${p - c - 120 < 0 ? 'red' : 'green'}">Margen ${eur(p - c - 120)}</em>` : ''}</div>
  </div>
  <div class="stk-sum__checks">
    <span class="${wzOk1() ? 'is-ok' : ''}">${icon('check', 13)}Ficha técnica</span>
    <span class="${wz.equipamiento.length ? 'is-ok' : ''}">${icon('check', 13)}${plural(wz.equipamiento.length, 'extra', 'extras')}</span>
    <span class="${wz.descripcion ? 'is-ok' : ''}">${icon('check', 13)}Descripción</span>
    <span class="${wz.fotos.length ? 'is-ok' : ''}">${icon('check', 13)}${plural(wz.fotos.length, 'foto', 'fotos')}${wz.fotos.length && wz.retocar ? ' con IA' : ''}</span>
  </div>`;
}
function wzPreview() {
  const d = wz.d, p = +wz.precio || 0;
  const cover = wz.fotos[0] ? wz.fotos[0].url : 'img/placeholder.svg';
  const pa = wz.estado === 'disponible' ? C.PORTALES.filter(x => wz.portales[x]) : [];
  const checks = [[wzOk1(), 'Ficha técnica'], [wzOk2(), 'Kilómetros y precio'], [wz.fotos.length > 0, 'Fotos'], [!!wz.descripcion, 'Descripción']];
  return html`<div class="up mb-8">Vista previa del anuncio</div>
    <div class="stk-card stk-card--static">
      <div class="stk-card__media"><div class="stk-card__track"><img src="${cover}" alt=""></div>
        <div class="stk-card__tags">${wz.fotos.length && wz.retocar ? html`<span class="stk-pill stk-pill--ia">${icon('sparkles', 12)}IA</span>` : ''}</div>
        <div class="stk-card__dias"><span class="stk-pill stk-pill--green">${icon('sparkles', 12)}Nuevo</span></div></div>
      <div class="stk-card__body">
        <div class="stk-card__head"><div class="grow"><h3 class="ellipsis">${d.marca || 'Marca'} ${d.modelo || 'y modelo'}</h3><p class="ellipsis">${d.version || 'Versión'}</p></div></div>
        <div class="stk-card__price"><div><b class="tnum">${p ? eur(p) : '— €'}</b><span>${p ? `desde ${App.num(db.cuota(p))} €/mes` : 'Precio en el paso 2'}</span></div></div>
        <div class="stk-card__specs">${d.anio ? html`<span>${d.anio}</span>` : ''}${wz.km !== '' ? html`<span>${App.km(+wz.km)}</span>` : ''}<span>${d.combustible}</span><span>${d.cambio}</span></div>
        <div class="stk-card__foot"><div class="stk-stamps">${pa.length ? pa.map(x => ui.portal(x, 'sm')) : html`<span class="xs faint">Sin publicar</span>`}</div></div>
      </div>
    </div>
    <div class="stk-wz__checks">${checks.map(([ok, l]) => html`<span class="${ok ? 'is-ok' : ''}">${icon(ok ? 'circle-check' : 'circle', 15)}${l}</span>`)}</div>`;
}
function wzUpd() {
  const pv = App.$('#wzPreview'); if (pv) pv.innerHTML = App.str(wzPreview());
  const mg = App.$('#wzMargen'); if (mg) mg.innerHTML = App.str(wzMargen());
}
function wzAddFiles(files) {
  const imgs = [...(files || [])].filter(f => /^image\//.test(f.type));
  if (!imgs.length) return App.toast('Elige archivos de imagen', {tipo: 'warn'});
  if (wz.ejemplo) { wz.fotos = []; wz.ejemplo = false; }
  imgs.forEach(f => wz.fotos.push({url: URL.createObjectURL(f), name: f.name}));
  rerender();
  App.toast(`${plural(imgs.length, 'foto añadida', 'fotos añadidas')}`, {icon: 'image', sub: wz.retocar ? 'Se retocan con IA al guardar' : ''});
}
function wzGuardar() {
  if (!wzOk1()) { wz.step = 1; wz.err = 'Faltan la marca, el modelo o el año'; return rerender(); }
  if (!wzOk2()) { wz.step = 2; wz.err = 'Faltan los kilómetros o el precio de venta'; return rerender(); }
  const d = wz.d, anio = +d.anio, precio = Math.round(+wz.precio), fecha = nowISO();
  const prep = wz.estado === 'preparacion';
  const portales = Object.fromEntries(C.PORTALES.map(p => { const on = !prep && !!wz.portales[p]; return [p, {on, visitas: 0, leads: 0, favoritos: 0, desde: on ? fecha : null}]; }));
  const compra = Math.round(+wz.precioCompra) || round(precio * .83, 50);
  const mat = (wz.matricula || '').toUpperCase().replace(/^(\d{4})\s*([A-Z]{3})$/, '$1 $2');
  const v = db.addVehicle({
    marca: d.marca.trim(), modelo: d.modelo.trim(), version: d.version.trim(), anio, km: Math.round(+wz.km), precio, precioMin: round(precio * .955), precioCompra: compra,
    gastos: [{concepto: 'Preparación y limpieza', importe: 120}], combustible: d.combustible, cambio: d.cambio, cv: Math.round(+d.cv) || 100, carroceria: d.carroceria,
    color: wz.color, etiqueta: wzEtq(), garantia: +wz.garantia, puertas: 5, plazas: 5, matricula: mat || '—', bastidor: (wz.bastidor || '').toUpperCase() || genVin(d.marca, mat + anio),
    fechaMatriculacion: `${anio}-06-15`, itv: anio >= CUR_YEAR - 3 ? `${anio + 4}-06` : `${CUR_YEAR + 1}-06`, duenos: 1, libroRevisiones: true, estadoGeneral: wz.estadoGeneral,
    estado: prep ? 'preparacion' : 'disponible', ubicacion: prep ? 'Taller' : wz.ubicacion, fotos: wz.ejemplo ? wz.fotos.map(f => f.id) : [], equipamiento: wz.equipamiento.slice(),
    portales, descripcion: wz.descripcion || textoIA(Object.assign({}, d, {km: +wz.km, precio, garantia: wz.garantia, equipamiento: wz.equipamiento})), destacado: false,
    fotosMejoradas: wz.retocar && wz.fotos.length > 0, docs: {permiso: true, ficha: true, itv: true, dgt: false, libro: true, contrato: true, llaves: false}
  });
  if (!wz.ejemplo && wz.fotos.length) localFotos[v.id] = wz.fotos.map(f => f.url);
  const n = C.PORTALES.filter(p => portales[p].on).length;
  wz = null;
  tabs[v.id] = 'resumen';
  App.go('#/stock/' + v.id);
  App.toast(n ? `Publicado en ${n} portales` : 'Coche dado de alta', {sub: `${ui.vehNombre(v)} · ${eur(precio)}`, icon: n ? 'globe' : 'car'});
}

/* ---------- registro de modales ---------- */
App.modals.nuevoVehiculo = () => App.go('#/stock/nuevo');

/* =====================================================================
   VISTA
   ===================================================================== */
App.views.stock = {
  title: route => route.id === 'nuevo' ? 'Dar de alta' : route.id ? (db.veh(route.id) ? ui.vehNombre(db.veh(route.id)) : 'Ficha') : 'Stock',
  crumbs: route => route.id ? [{label: 'Stock', href: '#/stock'}] : null,
  deps: ['vehicles', 'contacts', 'events', 'quotes'],
  onChange(what, route) {
    if (route && route.id === 'nuevo') return true;
    if (busy) return true;
    return false;
  },
  render(route) {
    if (route.hash !== lastHash) {
      lastHash = route.hash;
      if (route.id === 'nuevo') wz = WZ0();
      else if (route.id) { const t = TAB_ALIAS[route.sub] || route.sub; tabs[route.id] = TABS.some(x => x.id === t) ? t : 'resumen'; }
      else {
        const q = route.query || {};
        if (q.estado && ESTADOS.some(e => e[0] === q.estado)) F.estado = q.estado;
        if (q.q != null) F.q = q.q;
      }
    }
    if (route.id === 'nuevo') return renderWizard();
    if (route.id) return renderFicha(route);
    return renderList();
  },
  mount(root, route) {
    keepX(root);
    if (!route.id) {
      App.$$('.stk-card__track', root).forEach(tr => {
        const dots = tr.parentElement.querySelectorAll('.stk-card__dots i');
        if (!dots.length) return;
        tr.addEventListener('scroll', () => { const k = Math.round(tr.scrollLeft / Math.max(tr.clientWidth, 1)); dots.forEach((d, j) => d.classList.toggle('is-on', j === k)); }, {passive: true});
      });
      return;
    }
    if (route.id === 'nuevo') {
      if (wz && wz.step === 1 && !wz.traido && !isMobile() && !document.activeElement.closest('.stk-wz')) setTimeout(() => { const m = App.$('#wzMat'); m && m.focus(); }, 60);
      const files = App.$('#wzFiles', root);
      if (files) files.addEventListener('change', () => { wzAddFiles(files.files); files.value = ''; });
      const drop = App.$('#wzDrop', root);
      if (drop) {
        ['dragenter', 'dragover'].forEach(ev => drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.add('is-over'); }));
        ['dragleave', 'drop'].forEach(ev => drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.remove('is-over'); }));
        drop.addEventListener('drop', e => wzAddFiles(e.dataTransfer && e.dataTransfer.files));
      }
      const mat = App.$('#wzMat', root);
      if (mat) mat.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); App.runAct(App.$('[data-act="wz-buscar"]', root), e); } });
      return;
    }
    const v = db.veh(route.id); if (!v) return;
    // fotos nuevas desde la galería o la tarjeta de IA
    App.$$('#stkAddFotos, [data-stk-upload="fotos"]', root).forEach(inp => inp.addEventListener('change', () => {
      const imgs = [...inp.files].filter(f => /^image\//.test(f.type)); if (!imgs.length) return;
      localFotos[v.id] = fotosDe(v).map(f => f.l).concat(imgs.map(f => URL.createObjectURL(f)));
      gal[v.id] = localFotos[v.id].length - imgs.length;
      db.updateVehicle(v.id, {fotosMejoradas: false});
      App.toast(`${plural(imgs.length, 'foto añadida', 'fotos añadidas')}`, {icon: 'image', sub: 'Pulsa «Retocar con IA» para dejarlas listas', accion: 'Retocar', onAccion: () => { tabs[v.id] = 'resumen'; rerender(); setTimeout(() => { const b = App.$('[data-act="stk-retocar"]'); b && App.runAct(b); }, 120); }});
    }));
    App.$$('[data-stk-upload="docs"]', root).forEach(inp => inp.addEventListener('change', () => {
      const fs = [...inp.files]; if (!fs.length) return;
      uploads[v.id] = (uploads[v.id] || []).concat(fs.map(f => ({name: f.name, size: Math.max(1, Math.round(f.size / 1024)), fecha: nowISO()})));
      rerender();
      App.toast(`${plural(fs.length, 'documento subido', 'documentos subidos')}`, {icon: 'paperclip', sub: fs.map(f => f.name).join(', ')});
    }));
    const form = App.$('#stkGastoForm', root);
    if (form) form.addEventListener('submit', e => {
      e.preventDefault();
      const concepto = App.$('#stkGConcepto', form).value.trim(), importe = Math.round(+App.$('#stkGImporte', form).value || 0);
      if (!concepto) return App.$('#stkGConcepto', form).focus();
      if (importe <= 0) return App.$('#stkGImporte', form).focus();
      db.updateVehicle(v.id, {gastos: (v.gastos || []).concat({concepto, importe})});
      App.toast('Gasto añadido', {icon: 'receipt', sub: `${concepto} · ${eur(importe)} · margen ${eur(db.margen(v))}`});
      setTimeout(() => { const c = App.$('#stkGConcepto'); c && c.focus(); }, 30);
    });
    const range = App.$('#stkSim', root);
    if (range) {
      const box = range.closest('.stk-sim');
      range.addEventListener('input', () => {
        const s = +range.value; sim[v.id] = s;
        App.$('#stkSimTxt', box).innerHTML = App.str(simTxt(s, +box.dataset.coste, +box.dataset.min, +box.dataset.precio));
        const ap = App.$('#stkSimApply', box);
        ap.classList.toggle('hidden', s === +box.dataset.precio); ap.dataset.precio = s;
        ap.innerHTML = App.str(html`${icon('check', 15)}Poner a ${eur(s)}`);
      });
    }
  },
  unmount() {
    lastHash = null;
    if (visorClose) visorClose();
  },
  actions: {
    /* listado */
    'stk-alta': () => App.go('#/stock/nuevo'),
    'stk-export': () => exportar(),
    'stk-q'(el) { F.q = el.value; rerender(); },
    'stk-f'(el) { F[el.dataset.k] = el.value; rerender(); },
    'stk-estado-f'(el) { const e = el.dataset.estado; F.estado = F.estado === e && e !== 'todos' ? 'todos' : e; rerender(); },
    'stk-filtros'() { F.abiertos = !F.abiertos; rerender(); },
    'stk-limpiar'() { Object.assign(F, {q: '', estado: 'todos', carroceria: '', combustible: '', cambio: '', precio: ''}); rerender(); },
    'stk-vista'(el) { S().prefs.vistaStock = el.dataset.vista; App.store.save(); rerender(); },
    'stk-foto'(el) { const tr = el.closest('.stk-card__media').querySelector('.stk-card__track'); tr.scrollBy({left: +el.dataset.dir * tr.clientWidth, behavior: 'smooth'}); },
    'stk-menu'(el) { const v = db.veh(el.dataset.id); if (v) App.menu(el, menuCoche(v), {align: 'right'}); },

    /* ficha */
    'stk-tab'(el) { const v = db.veh(App.route.id); if (!v) return; tabs[v.id] = el.dataset.tab; rerender(); const t = App.$('.stk-tabs'); if (t && t.getBoundingClientRect().top < 64) t.scrollIntoView({block: 'start', behavior: 'smooth'}); },
    'stk-gal'(el) { const v = db.veh(App.route.id); if (v) galGo(v, (gal[v.id] || 0) + +el.dataset.dir); },
    'stk-gal-go'(el) { const v = db.veh(App.route.id); if (v) galGo(v, +el.dataset.i); },
    'stk-visor'() { const v = db.veh(App.route.id); if (v) visor(v, gal[v.id] || 0); },
    'stk-estado'(el) {
      const v = db.veh(el.dataset.id); if (!v) return;
      App.menu(el, [
        {header: 'Cambiar estado'},
        {label: 'Disponible', icon: 'circle-check', onClick: () => setEstado(v, 'disponible')},
        v.estado === 'reservado' ? {label: 'Quitar reserva', icon: 'bookmark', onClick: () => setEstado(v, 'disponible')} : {label: 'Reservar…', icon: 'bookmark', onClick: () => modalReservar(v)},
        {label: 'En preparación', icon: 'wrench', onClick: () => setEstado(v, 'preparacion')},
        {sep: true},
        {label: 'Vendido…', icon: 'badge-euro', onClick: () => modalVender(v)}
      ]);
    },
    'stk-destacar'(el) { const v = db.veh(el.dataset.id); if (!v) return; db.updateVehicle(v.id, {destacado: !v.destacado}); App.toast(v.destacado ? 'Destacado en los portales' : 'Ya no está destacado', {icon: 'star', sub: v.destacado ? 'Sale arriba en los listados de coches.net y Wallapop' : ui.vehNombre(v)}); },
    'stk-mas'(el) { const v = db.veh(el.dataset.id); if (v) App.menu(el, menuCoche(v, true), {align: 'right'}); },
    'stk-presupuesto'(el) { App.nuevo('presupuesto', {vehicle: el.dataset.id}); },
    'stk-cita'(el) { App.nuevo('cita', {vehicle: el.dataset.id}); },
    'stk-editar'(el) { const v = db.veh(el.dataset.id || App.route.id); if (v) modalEditar(v); },
    'stk-cartel'(el) { const v = db.veh(el.dataset.id); if (v) modalCartel(v); },
    'stk-vender'(el) { const v = db.veh(el.dataset.id); if (v) modalVender(v); },
    'stk-precio'(el) { const v = db.veh(el.dataset.id || App.route.id); if (v) modalPrecio(v, {precio: el.dataset.precio ? +el.dataset.precio : null}); },
    'stk-copiar'(el) { if (el.dataset.txt) copiar(el.dataset.txt, 'Copiado al portapapeles'); },
    'stk-ia-desc'(el) {
      const v = db.veh(el.dataset.id); const box = App.$('#stkDesc'); if (!v || !box || busy) return;
      const texto = textoIA(v);
      busy = true; el.disabled = true; el.innerHTML = App.str(html`<span class="typing"><i></i><i></i><i></i></span>Escribiendo…`);
      box.classList.add('stk-desc__txt--ia');
      escribir(box, texto, () => {
        busy = false;
        db.updateVehicle(v.id, {descripcion: texto});
        const n = activos(v).length;
        App.toast('Descripción mejorada con IA', {icon: 'sparkles', sub: n ? `Actualizada en ${plural(n, 'portal', 'portales')}` : 'Lista para publicar'});
      });
    },
    'stk-retocar'(el) {
      const v = db.veh(el.dataset.id); if (!v || busy) return;
      const fs = fotosOr(v), prog = App.$('#stkIAProg'); if (!prog) return;
      busy = true; el.classList.add('hidden'); prog.classList.remove('hidden');
      const pasos = ['Quitando el fondo', 'Corrigiendo la luz', 'Tapando la matrícula'];
      const total = fs.length * pasos.length; let k = 0;
      const tick = () => {
        if (!prog.isConnected || k >= total) {
          busy = false;
          db.updateVehicle(v.id, {fotosMejoradas: true});
          App.toast('Fotos retocadas con IA', {icon: 'sparkles', sub: `${plural(fs.length, 'foto lista', 'fotos listas')}${activos(v).length ? ' y actualizadas en los portales' : ''}`});
          return;
        }
        const f = Math.floor(k / pasos.length) + 1;
        App.$('#stkIAStep', prog).textContent = `Foto ${f} de ${fs.length} · ${pasos[k % pasos.length]}…`;
        k++;
        const pct = Math.round(k / total * 100);
        App.$('#stkIAPct', prog).textContent = pct + ' %';
        App.$('.progress > i', prog).style.width = pct + '%';
        setTimeout(tick, 380);
      };
      tick();
    },
    'stk-portal'(el) {
      const v = db.veh(el.dataset.id), p = el.dataset.portal; if (!v) return;
      const on = !v.portales[p].on;
      db.setPortal(v.id, p, on);
      App.toast(on ? `Publicado en ${pLabel(p)}` : `Retirado de ${pLabel(p)}`, {icon: on ? 'globe' : 'eye-off', sub: ui.vehNombre(v)});
    },
    'stk-pub-todos'(el) {
      const v = db.veh(el.dataset.id); if (!v || busy) return;
      const faltan = C.PORTALES.filter(p => !v.portales[p].on); if (!faltan.length) return;
      busy = true; el.disabled = true; el.innerHTML = App.str(html`${icon('refresh-cw', 15, 'spin')}Publicando…`);
      let k = 0;
      const step = () => {
        if (k > 0) {
          const row = App.$(`.stk-prow[data-portal="${faltan[k - 1]}"]`);
          if (row) { row.classList.remove('is-pub'); row.classList.add('is-on', 'is-just'); const sw = row.querySelector('.switch'); sw && sw.classList.add('is-on'); row.querySelector('.stk-prow__st').innerHTML = App.str(html`<i class="status-dot status-dot--green"></i>Publicado ahora`); }
        }
        if (k >= faltan.length) {
          setTimeout(() => {
            busy = false;
            App.store.update(() => faltan.forEach(p => { v.portales[p].on = true; v.portales[p].desde = nowISO(); }), 'vehicles');
            db.log(`Publicado: ${ui.vehNombre(v)} en todos los portales`, {icon: 'globe', link: '#/stock/' + v.id});
            App.toast(`Publicado en ${C.PORTALES.length} portales`, {icon: 'globe', sub: `${ui.vehNombre(v)} · ${faltan.map(pLabel).join(', ')}`});
          }, 350);
          return;
        }
        const row = App.$(`.stk-prow[data-portal="${faltan[k]}"]`);
        if (row) { row.classList.add('is-pub'); row.querySelector('.stk-prow__st').innerHTML = App.str(html`${icon('refresh-cw', 12, 'spin')}Publicando en ${pLabel(faltan[k])}…`); }
        k++;
        setTimeout(step, 520);
      };
      step();
    },
    'stk-ver-anuncio'(el) {
      const v = db.veh(el.dataset.id), p = el.dataset.portal; if (!v) return;
      const slug = App.norm(`${v.marca}-${v.modelo}-${v.anio}`).replace(/[^a-z0-9]+/g, '-');
      const url = {web: `${S().dealer.web}/coches/${slug}`, cochesnet: `coches.net/${slug}-${hash(v.id) % 90000000 + 10000000}-covo.aspx`, wallapop: `es.wallapop.com/item/${slug}-${hash(v.id) % 900000000}`, milanuncios: `milanuncios.com/coches-de-segunda-mano/${slug}-${hash(v.id) % 900000000}.htm`, autoscout: `autoscout24.es/anuncios/${slug}`, fbmarket: `facebook.com/marketplace/item/${hash(v.id)}`}[p];
      App.toast(`Abriendo el anuncio en ${pLabel(p)}…`, {icon: 'external-link', tipo: 'info', sub: url});
    },
    'stk-compra'(el) {
      const v = db.veh(el.dataset.id); const val = Math.round(+el.value || 0); if (!v) return;
      if (val <= 0) { el.value = v.precioCompra; return; }
      if (val === v.precioCompra) return;
      db.updateVehicle(v.id, {precioCompra: val});
      App.toast('Precio de compra actualizado', {icon: 'handshake', sub: `${eur(val)} · margen ${eur(db.margen(v))}`});
    },
    'stk-gasto-del'(el) {
      const v = db.veh(el.dataset.id); if (!v) return;
      const i = +el.dataset.i, g = v.gastos[i]; if (!g) return;
      const antes = v.gastos.slice();
      db.updateVehicle(v.id, {gastos: v.gastos.filter((_, k) => k !== i)});
      App.toast('Gasto quitado', {icon: 'trash-2', sub: `${g.concepto} · ${eur(g.importe)}`, accion: 'Deshacer', onAccion: () => db.updateVehicle(v.id, {gastos: antes})});
    },
    'stk-doc'(el) {
      const v = db.veh(el.dataset.id); if (!v) return;
      const docs = Object.assign({}, docsOf(v)); const k = el.dataset.doc; docs[k] = !docs[k];
      db.updateVehicle(v.id, {docs});
      const x = DOCS.find(d => d.id === k);
      App.toast(docs[k] ? `${x.label}: en regla` : `${x.label}: marcado como pendiente`, {icon: docs[k] ? 'circle-check' : 'circle-alert', tipo: docs[k] ? 'ok' : 'warn'});
    },
    'stk-dgt'(el) {
      const v = db.veh(el.dataset.id); const body = App.$('#stkDgtBody'); if (!v || !body || busy) return;
      busy = true;
      const pasos = ['Conectando con la DGT', 'Buscando cargas y embargos', 'Revisando titulares e ITV'];
      const draw = k => { body.innerHTML = App.str(html`<div class="stk-dgt__steps">${pasos.map((p, j) => html`<div class="${j < k ? 'is-ok' : j === k ? 'is-now' : ''}">${j < k ? icon('circle-check', 16) : j === k ? icon('refresh-cw', 16, 'spin') : icon('circle', 16)}<span>${p}${j === k ? '…' : ''}</span></div>`)}</div>`); };
      let k = 0; draw(0);
      const t = setInterval(() => {
        k++;
        if (!body.isConnected || k > pasos.length) {
          clearInterval(t); busy = false;
          db.updateVehicle(v.id, {dgt: {fecha: nowISO(), cargas: false, titulares: v.duenos || 1}, docs: Object.assign({}, docsOf(v), {dgt: true})});
          App.toast('Informe DGT listo', {icon: 'shield-check', sub: `Sin cargas ni embargos · ${v.duenos > 1 ? v.duenos + ' titulares' : '1 titular'} · ITV favorable`});
          return;
        }
        draw(k);
      }, 560);
    },
    'stk-archivo'(el) { App.toast(`Descargando «${el.dataset.name}»`, {icon: 'download', tipo: 'info'}); },

    /* asistente */
    'wz-go'(el) { const n = +el.dataset.step; if (n <= wz.max) { wz.step = n; wz.err = ''; rerender(); } },
    'wz-back'() { wz.step = Math.max(1, wz.step - 1); wz.err = ''; rerender(); window.scrollTo({top: 0, behavior: 'smooth'}); },
    'wz-next'() {
      if (wz.step === 1 && !wzOk1()) { wz.err = wz.traido || wz.manual ? 'Completa la marca, el modelo y el año' : 'Busca los datos por matrícula o rellénalos a mano'; return rerender(); }
      if (wz.step === 2 && !wzOk2()) { wz.err = 'Pon los kilómetros y el precio de venta'; return rerender(); }
      wz.err = ''; wz.step = Math.min(4, wz.step + 1); wz.max = Math.max(wz.max, wz.step); rerender(); window.scrollTo({top: 0, behavior: 'smooth'});
    },
    'wz-modo'(el) { wz.modo = el.dataset.modo; wz.err = ''; rerender(); },
    'wz-set'(el) {
      let val = el.value;
      if (el.dataset.k === 'matricula' || el.dataset.k === 'bastidor') { val = val.toUpperCase(); if (el.value !== val) { const p = el.selectionStart; el.value = val; el.setSelectionRange(p, p); } }
      wz[el.dataset.k] = val; if (wz.err && el.dataset.k !== 'descripcion') { wz.err = ''; }
      wzUpd();
    },
    'wz-d'(el) { wz.d[el.dataset.k] = el.value; wzUpd(); },
    'wz-opt'(el) { const k = el.dataset.k; wz[k] = k === 'garantia' ? +el.dataset.val : el.dataset.val; rerender(); },
    'wz-eq'(el) { const e = el.dataset.eq; wz.equipamiento = wz.equipamiento.includes(e) ? wz.equipamiento.filter(x => x !== e) : wz.equipamiento.concat(e); rerender(); },
    'wz-manual'() { wz.manual = true; wz.err = ''; rerender(); setTimeout(() => { const m = App.$('#wz_marca'); m && m.focus(); }, 50); },
    'wz-ejemplo'() { wz.modo = 'matricula'; wz.matricula = '2841 LKS'; wz.err = ''; rerender(); App.runAct(App.$('[data-act="wz-buscar"]')); },
    'wz-buscar'() {
      const val = (wz.modo === 'matricula' ? wz.matricula : wz.bastidor).trim();
      if (wz.modo === 'matricula' && val.replace(/\s/g, '').length < 5) { wz.err = 'Escribe la matrícula completa (por ejemplo 2841 LKS)'; return rerender(); }
      if (wz.modo === 'bastidor' && val.length < 11) { wz.err = 'El bastidor tiene 17 caracteres'; return rerender(); }
      wz.err = ''; wz.buscando = true; wz.traido = false; rerender();
      setTimeout(() => {
        if (!wz || !App.route || App.route.id !== 'nuevo') return;
        const p = plantilla(val);
        Object.assign(wz.d, {marca: p.marca, modelo: p.modelo, version: p.version, anio: p.anio, combustible: p.combustible, cv: p.cv, cambio: p.cambio, carroceria: p.carroceria});
        if (wz.modo === 'bastidor') wz.bastidor = val; else if (/^\d{4}\s?[A-Z]{3}$/.test(val)) wz.matricula = val.replace(/^(\d{4})\s?([A-Z]{3})$/, '$1 $2');
        wz.buscando = false; wz.traido = true; wz.max = Math.max(wz.max, 2);
        rerender();
      }, 1200);
    },
    'wz-ia'() {
      if (wz.escribiendo) return;
      const d = wz.d;
      const texto = textoIA({marca: d.marca || 'Coche', modelo: d.modelo, version: d.version, anio: d.anio || CUR_YEAR, km: +wz.km || 0, combustible: d.combustible, cambio: d.cambio, cv: d.cv || 100, carroceria: d.carroceria, garantia: wz.garantia, equipamiento: wz.equipamiento, duenos: 1, precio: +wz.precio || 0, itv: ''});
      wz.escribiendo = true;
      const b = App.$('[data-act="wz-ia"]'); if (b) { b.disabled = true; b.innerHTML = App.str(html`<span class="typing"><i></i><i></i><i></i></span>Escribiendo…`); }
      const ta = App.$('#wzDesc');
      const done = () => { if (!wz) return; wz.escribiendo = false; wz.descripcion = texto; rerender(); wzUpd(); };
      if (!ta) return done();
      escribir(ta, texto, done);
    },
    'wz-fotos-ejemplo'() {
      const pool = db.stock().filter(v => v.fotos && v.fotos.length >= 3);
      const v = pool.find(x => x.carroceria === wz.d.carroceria && x.marca === wz.d.marca) || pool.find(x => x.carroceria === wz.d.carroceria) || pool[0];
      if (!v) return;
      wz.fotos = v.fotos.map(f => ({url: `img/v/${f}-s.webp`, id: f, name: f}));
      wz.ejemplo = true; rerender();
      App.toast('Fotos de ejemplo cargadas', {icon: 'image', sub: 'En la demo usamos fotos del catálogo'});
    },
    'wz-portada'(el) { const i = +el.dataset.i; const [f] = wz.fotos.splice(i, 1); wz.fotos.unshift(f); rerender(); },
    'wz-foto-del'(el) { wz.fotos.splice(+el.dataset.i, 1); if (!wz.fotos.length) wz.ejemplo = false; rerender(); },
    'wz-retocar'() { wz.retocar = !wz.retocar; rerender(); },
    'wz-portal'(el) { const p = el.dataset.portal; wz.portales[p] = !wz.portales[p]; rerender(); },
    'wz-guardar'() { wzGuardar(); }
  }
};
})();
