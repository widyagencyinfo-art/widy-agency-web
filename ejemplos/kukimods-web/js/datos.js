/* Catálogo, colecciones y looks.
   Las fotos son suyas (Instagram @kuki_modas y su escaparate).
   ⚠️ Los precios son de ejemplo: se cambian aquí, en una línea por prenda. */

window.COLECCIONES = [
  { id: 'nueva',      nombre: 'Nueva temporada', det: 'Otoño / invierno',   foto: 'img/col-oficina.jpg' },
  { id: 'fiesta',     nombre: 'Fiesta',          det: 'Eventos y noche',    foto: 'img/col-fiesta.jpg' },
  { id: 'denim',      nombre: 'Denim',           det: 'Vaquero de diario',  foto: 'img/col-denim.jpg' },
  { id: 'accesorios', nombre: 'Accesorios',      det: 'El toque final',     foto: 'img/col-accesorios.jpg' }
];

window.PRODUCTOS = [
  {
    id: 'blazer-cuadros', nombre: 'Blazer de cuadros', cat: 'Chaquetas', coleccion: 'nueva',
    precio: 59.95, tallas: ['S', 'M', 'L'], agotadas: [], foto: 'img/p/blazer-cuadros.jpg',
    etiqueta: 'Total look',
    desc: 'Blazer masculino de cuadros, hombro marcado y caída recta. El que sostiene el look de oficina y también rescata un vaquero.'
  },
  {
    id: 'camisa-basica', nombre: 'Camisa básica blanca', cat: 'Camisas', coleccion: 'nueva',
    precio: 29.95, tallas: ['S', 'M', 'L', 'XL'], agotadas: [], foto: 'img/p/camisa-basica.jpg',
    desc: 'La camisa blanca de siempre, en tejido con cuerpo. La que va debajo de todo lo demás.'
  },
  {
    id: 'falda-pantalon', nombre: 'Falda pantalón de cuadros', cat: 'Faldas', coleccion: 'nueva',
    precio: 39.95, tallas: ['S', 'M', 'L'], agotadas: [], foto: 'img/p/falda-pantalon.jpg',
    desc: 'Falda pantalón a juego con el blazer. Cómoda como un pantalón, vestida como una falda.'
  },
  {
    id: 'bolso-acolchado', nombre: 'Bolso acolchado con cadena', cat: 'Bolsos', coleccion: 'accesorios',
    precio: 34.95, tallas: ['Única'], agotadas: [], foto: 'img/p/bolso-acolchado.jpg',
    desc: 'Acolchado en marrón chocolate con cadena dorada. Sube de categoría cualquier conjunto sencillo.'
  },
  {
    id: 'pendientes-aro', nombre: 'Pendientes aro dorado', cat: 'Bisutería', coleccion: 'accesorios',
    precio: 12.95, tallas: ['Única'], agotadas: [], foto: 'img/p/pendientes.jpg',
    desc: 'Aro dorado de tamaño medio. El detalle que remata el look sin quitarle protagonismo.'
  },
  {
    id: 'vestido-leonor', nombre: 'Vestido Leonor', cat: 'Vestidos', coleccion: 'fiesta',
    precio: 69.95, tallas: ['S', 'M', 'L'], agotadas: ['S'], foto: 'img/p/vestido-leonor.jpg',
    foto2: 'img/p/vestido-leonor-detalle.jpg', etiqueta: 'Fiesta',
    desc: 'Largo, de lentejuelas en chocolate, con abertura en la cintura y escote drapeado. El de las bodas de invierno.'
  },
  {
    id: 'camisa-denim', nombre: 'Camisa vaquera entallada', cat: 'Camisas', coleccion: 'denim',
    precio: 44.95, tallas: ['S', 'M', 'L'], agotadas: [], foto: 'img/p/camisa-denim.jpg',
    desc: 'Vaquero oscuro, entallada y con botonadura vista. Se lleva por dentro y por fuera.'
  },
  {
    id: 'pantalon-denim', nombre: 'Pantalón vaquero tiro alto', cat: 'Pantalones', coleccion: 'denim',
    precio: 39.95, tallas: ['36', '38', '40', '42'], agotadas: [], foto: 'img/p/conjunto-denim.jpg',
    desc: 'Tiro alto y pernera holgada en el mismo tono que la camisa: juntos son conjunto, sueltos son fondo de armario.'
  },
  {
    id: 'blazer-satinado', nombre: 'Blazer satinado de rayas', cat: 'Chaquetas', coleccion: 'nueva',
    precio: 49.95, tallas: ['S', 'M', 'L'], agotadas: [], foto: 'img/p/blazer-satinado.jpg',
    desc: 'Satinado con raya fina y lazada en la cintura. De la oficina a la cena sin pasar por casa.'
  },
  {
    id: 'vaquero-ancho', nombre: 'Vaquero ancho', cat: 'Pantalones', coleccion: 'denim',
    precio: 39.95, tallas: ['36', '38', '40', '42'], agotadas: ['42'], foto: 'img/p/vaquero-ancho.jpg',
    desc: 'Pernera ancha con caída, en azul medio. El que se pone con todo lo de arriba.'
  }
];

/* Los looks: la foto y dónde cae cada prenda dentro de ella (en %). */
window.LOOKS = [
  {
    id: 'oficina',
    nombre: 'Total look cuadros',
    det: 'Lo que más se vende en tienda',
    foto: 'img/col-oficina.jpg',
    piezas: [
      { id: 'blazer-cuadros', x: 35, y: 42 },
      { id: 'camisa-basica', x: 52, y: 29 },
      { id: 'falda-pantalon', x: 50, y: 58 },
      { id: 'bolso-acolchado', x: 31, y: 76 },
      { id: 'pendientes-aro', x: 56, y: 16 }
    ]
  },
  {
    id: 'fiesta',
    nombre: 'Vestido Leonor',
    det: 'Colección fiesta',
    foto: 'img/col-fiesta.jpg',
    piezas: [
      { id: 'vestido-leonor', x: 50, y: 52 },
      { id: 'pendientes-aro', x: 52, y: 14 },
      { id: 'bolso-acolchado', x: 30, y: 72 }
    ]
  },
  {
    id: 'denim',
    nombre: 'Todo vaquero',
    det: 'Diario',
    foto: 'img/col-denim.jpg',
    piezas: [
      { id: 'camisa-denim', x: 52, y: 34 },
      { id: 'pantalon-denim', x: 50, y: 74 }
    ]
  }
];

/* Reseñas reales de su ficha de Google (5,0 con 13 opiniones). */
window.OPINIONES = [
  { texto: 'Ropa de muchísima calidad y con muy buenos precios. Te ayuda a encontrar tu prenda ideal.', quien: 'Reseña en Google' },
  { texto: 'Prendas únicas y trato aún mejor. Toda una experta en imagen y moda para cualquier ocasión.', quien: 'Reseña en Google' },
  { texto: 'Chica súper amable, te aconseja y te da varias elecciones de combinación.', quien: 'Reseña en Google' }
];
