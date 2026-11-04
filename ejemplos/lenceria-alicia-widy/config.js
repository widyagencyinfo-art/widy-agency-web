/* ═══════════════════════════════════════════════════════════════
   ALICIA LENCERÍA · Betanzos
   ÚNICO archivo que se edita para personalizar la web.
   ───────────────────────────────────────────────────────────────
   ⚠️ PRECIOS: estimaciones de mercado para que el boceto se vea
   real. Sustituir por los precios reales antes de publicar.
   ═══════════════════════════════════════════════════════════════ */

const CONFIG = {

  /* ─────────── NEGOCIO ─────────── */
  negocio: {
    nombre: 'Alicia',
    apellido: 'lencería',
    claim: 'Lencería · Corsetería · Baño',
    ciudad: 'Betanzos',
    provincia: 'A Coruña',
    direccion: 'Rúa Nova, 7',
    cp: '15300',
    telefono: '981 77 24 60',
    telefonoRaw: '+34981772460',
    whatsapp: '623 355 412',
    whatsappRaw: '34623355412',
    email: 'lenceria-alicia@outlook.com',
    instagram: 'lenceriaalicia',
    instagramSeguidores: '4.760',
    facebook: 'https://www.facebook.com/lenceriaalicia',
    mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Lencer%C3%ADa+Alicia+R%C3%BAa+Nova+7+Betanzos',
    mapsEmbed: 'https://www.google.com/maps?q=R%C3%BAa%20Nova%207,%2015300%20Betanzos,%20A%20Coru%C3%B1a&output=embed'
  },

  /* ─────────── VALORACIÓN (real, Google) ─────────── */
  rating: { nota: '4,9', total: 55 },

  /* ─────────── HORARIO ─────────── */
  horario: [
    { dia: 'Lunes',     d: 1, texto: '10:00–13:30 · 17:00–20:00', tramos: [[600,810],[1020,1200]] },
    { dia: 'Martes',    d: 2, texto: '10:00–13:30 · 17:00–20:00', tramos: [[600,810],[1020,1200]] },
    { dia: 'Miércoles', d: 3, texto: '10:00–13:30 · 17:00–20:00', tramos: [[600,810],[1020,1200]] },
    { dia: 'Jueves',    d: 4, texto: '10:00–13:30 · 17:00–20:00', tramos: [[600,810],[1020,1200]] },
    { dia: 'Viernes',   d: 5, texto: '10:00–13:30 · 17:00–20:00', tramos: [[600,810],[1020,1200]] },
    { dia: 'Sábado',    d: 6, texto: '10:00–14:00',               tramos: [[600,840]] },
    { dia: 'Domingo',   d: 0, texto: 'Cerrado',                   tramos: [] }
  ],

  envio: { texto: 'Envío gratis a toda España', plazo: '24–48 h' },

  /* ─────────── AVISOS DE LA BARRA SUPERIOR ─────────── */
  avisos: [
    'Envío gratis a toda España · 24–48 h',
    'Braffitting sin cita: te decimos tu talla real',
    'Copas de la A a la H · contornos del 80 al 120',
    '4,9 ★ con 55 reseñas en Google'
  ],

  /* ─────────── CATEGORÍAS ─────────── */
  categorias: [
    { id:'lenceria', nombre:'Lencería',       sub:'Sujetadores y braguitas', img:'img/ig-13.jpg' },
    { id:'bano',     nombre:'Baño',           sub:'Bikinis y bañadores',     img:'img/ig-08.jpg' },
    { id:'noche',    nombre:'Pijamas y batas',sub:'Algodón y descanso',      img:'img/ig-16.jpg' },
    { id:'moda',     nombre:'Moda mujer',     sub:'Vestidos y blusas',       img:'img/ig-11.jpg' },
    { id:'ellos',    nombre:'Ellos',          sub:'Ropa interior de hombre', img:'img/ig-15.jpg' },
    { id:'comple',   nombre:'Complementos',   sub:'Playa y verano',          img:'img/ig-14.jpg' }
  ],

  /* ─────────── ESCAPARATE (landing: sin precios, todo va a WhatsApp) ───────────
     Cada prenda abre WhatsApp preguntando por ella.                            */
  escaparate: [
    { marca:'Rosa Faia',       nombre:'Sujetador Twin Plus',     img:'img/ig-29.webp', nota:'Copas hasta H' },
    { marca:'Anita Beachwear', nombre:'Bikini con copa y aro',   img:'img/ig-08.jpg',  nota:'Copas grandes' },
    { marca:'Señoretta',       nombre:'Vestido de verano',       img:'img/ig-11.jpg',  nota:'' },
    { marca:'Selmark',         nombre:'Conjunto New Collection', img:'img/ig-30.jpg',  nota:'Recién llegado' },
    { marca:'Red Point',       nombre:'Bañadores 2026',          img:'img/ig-03.jpg',  nota:'' },
    { marca:'Egatex',          nombre:'Camisones y pijamas',     img:'img/ig-19.jpg',  nota:'Algodón 100 %' },
    { marca:'Selmark',         nombre:'Corsetería de diario',    img:'img/ig-13.jpg',  nota:'Del 80 al 120' },
    { marca:'Joma',            nombre:'Ropa interior de hombre', img:'img/ig-15.jpg',  nota:'Ellos' }
  ],

  marcas: ['Selmark','Janira','Triumph','Playtex','Anita','Rosa Faia','Dolores Cortés','Red Point','Señoretta','Egatex','Avet','Felina','Joma','Playuki'],

  /* ─────────── RESEÑAS (reales, Google) ─────────── */
  resenas: [
    { nombre:'Marian Lozano', texto:'He comprado un lote de productos por su tienda de WhatsApp y me han llegado de un día para otro. La gestión súper rápida, atenta y eficiente. Gran variedad de género, marcas y tallas que me cuesta mucho encontrar en otros sitios.' },
    { nombre:'Genma Sánchez', texto:'Pocas tiendas con tallas grandes en ropa interior, y cuando conocí esta tienda se me abrió el cielo.' },
    { nombre:'Gemma', texto:'Alicia sabe orientar, asesorar y guiar para elegir bien una prenda. La calidad del producto es inigualable. Esmerada presentación y trato exquisito. Sobre el envío, me salió gratis.' },
    { nombre:'Sandra Juiz Rio', texto:'Mi experiencia ha sido fabulosa. Toda la ayuda para encontrar el diseño de sujetador que mejor me sienta.' },
    { nombre:'Moraida Colina', texto:'Me encanta ir a esta tienda, tiene de todo y marcas muy buenas. Gran variedad y además Marta es un encanto. Los sujetadores y bañadores son ideales.' },
    { nombre:'Rocío Marta', texto:'La atención de Marta fue una delicia, y la posibilidad del envío gratuito a Madrid fue de gran ayuda. Llegó enseguida.' }
  ],

  /* ─────────── TABLA DE TALLAS (braffitting) ─────────── */
  tallas: {
    contorno: [
      { min:63, max:67, talla:80 },  { min:68, max:72, talla:85 },
      { min:73, max:77, talla:90 },  { min:78, max:82, talla:95 },
      { min:83, max:87, talla:100 }, { min:88, max:92, talla:105 },
      { min:93, max:97, talla:110 }, { min:98, max:102, talla:115 },
      { min:103, max:107, talla:120 }
    ],
    copas: [
      { max:11, copa:'AA' }, { max:13, copa:'A' }, { max:15, copa:'B' },
      { max:17, copa:'C' },  { max:19, copa:'D' }, { max:21, copa:'E' },
      { max:23, copa:'F' },  { max:25, copa:'G' }, { max:27, copa:'H' },
      { max:99, copa:'I' }
    ]
  },

  /* ─────────── PREGUNTAS FRECUENTES ─────────── */
  faq: [
    { q:'¿Cuánto tarda el envío?', a:'Entre 24 y 48 horas laborables a cualquier punto de España, y es <strong>gratis</strong> siempre, sin pedido mínimo.' },
    { q:'¿Y si no me queda bien?', a:'Nos escribes y lo cambiamos. Antes de mandarte nada te preguntamos tus medidas, justo para que eso no pase.' },
    { q:'No sé mi talla de sujetador.', a:'Es lo normal: la mayoría de mujeres lleva una talla que no es la suya. Usa la calculadora de esta página o mándanos tus dos medidas por WhatsApp y te la decimos nosotras.' },
    { q:'¿Tenéis copas grandes de verdad?', a:'Sí. Trabajamos contornos del 80 al 120 y copas de la A a la H, con marcas especialistas como Rosa Faia, Anita o Selmark.' },
    { q:'¿Cómo se paga?', a:'Nos mandas el pedido por WhatsApp y lo cerramos contigo por ahí mismo: Bizum, transferencia o tarjeta. Sin registrarte en ningún sitio.' }
  ]
};
