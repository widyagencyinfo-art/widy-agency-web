/* ============================================================
   CUORE · CATÁLOGO
   Cada prenda: id · n (nombre) · cat · p (precio) · tallas · d (descripción)
                fotos: rutas dentro de img/ sin «.jpg» (cada una tiene su «-s.jpg» pequeña)
                  ia/…     foto de estudio o de campaña hecha con IA a partir de la prenda real
                  fotos/…  foto REAL de su Instagram (en la web sale marcada «Foto real»)
                nuevo: 1 → etiqueta «Nuevo» y sale en «Llegó esta semana»

   ⚠️ PRECIOS ORIENTATIVOS: faltan los reales de Luz.
   ⚠️ Las fotos de modelo son de IA (la modelo no existe); la prenda es la suya.
      Generadas con _gemini/ (jobs.py → tanda.py → web.py).
   ============================================================ */
window.TALLAS = ["S", "M", "L", "XL", "Única"];

window.CATEGORIAS = [
  { id: "vestidos",  n: "Vestidos",        portada: "ia/vestidos" },
  { id: "faldas",    n: "Faldas y tops",   portada: "ia/faldas" },
  { id: "chaquetas", n: "Chaquetas",       portada: "ia/chaquetas" },
  { id: "bolsos",    n: "Bolsos",          portada: "ia/bolsos" },
];

(function () {
  var T = function (a, b) { var t = window.TALLAS; return t.slice(t.indexOf(a), t.indexOf(b) + 1); };
  var UNICA = ["Única"];

  window.PRENDAS = [
    /* ---------- Vestidos ---------- */
    { id: "vestido-rojo", n: "Vestido largo rojo y verde", cat: "vestidos", p: 42.95, tallas: T("S", "XL"), nuevo: 1,
      fotos: ["ia/vestido-rojo", "ia/hero-rojo", "fotos/vestido-rojo"],
      d: "Estampado grande en rojo y verde sobre fondo oscuro, como un bordado mexicano. Manga corta, escote en pico con botones y caída larga hasta el tobillo. El vestido de las bodas de día y de las comuniones de la Costa." },

    { id: "vestido-hojas", n: "Vestido largo de hojas", cat: "vestidos", p: 42.95, tallas: T("S", "XL"), nuevo: 1,
      fotos: ["ia/vestido-hojas", "ia/hero-hojas", "fotos/vestido-hojas"],
      d: "Fondo verde petróleo con flores turquesa y ramitas amarillo lima. Sin mangas, corte recto que cae solo y abertura lateral. Con botas camperas de día y con sandalia por la noche: llena la foto sin que tengas que hacer nada." },

    { id: "vestido-azul", n: "Vestido cruzado azul de flores", cat: "vestidos", p: 45.95, tallas: T("S", "XL"), nuevo: 1,
      fotos: ["ia/vestido-azul", "ia/hero-azul", "fotos/vestido-azul"],
      d: "Azul cobalto con flores grandes en rosa y lila. Cruzado en el pecho, manga corta con volante, lazo en la cintura y falda larga con vuelo. Favorece muchísimo y no pide más que unas botas camperas." },

    { id: "vestido-negro", n: "Vestido de tirantes negro de flores", cat: "vestidos", p: 38.95, tallas: T("S", "XL"),
      fotos: ["ia/vestido-negro", "fotos/vestido-negro"],
      d: "Fondo negro con ramitas finas en mostaza y verde azulado. Tirantes finos, escote en pico y tejido fresco. El más cómodo de todos: vale igual con zapatilla que con sandalia." },

    { id: "vestido-rosa", n: "Vestido corto rosa de flores", cat: "vestidos", p: 34.95, tallas: T("S", "L"),
      fotos: ["ia/vestido-rosa", "ia/vestidos", "fotos/vestido-rosa"],
      d: "Rosa empolvado con florecitas lila. Cuerpo fruncido de nido de abeja, tirantes finos y falda corta con vuelo. Para la terraza, la feria y para salir sin pensarlo mucho." },

    /* ---------- Faldas y tops ---------- */
    { id: "falda-verde", n: "Falda larga verde agua de volantes", cat: "faldas", p: 32.95, tallas: UNICA, nuevo: 1,
      fotos: ["ia/falda-verde", "ia/faldas", "fotos/falda-verde"],
      d: "Verde agua, cinturilla fruncida con elástico, cordón con borlas y dos volantes en el bajo. Ligera, fresca y con vuelo: la falda que lo tiene todo, porque va con camiseta blanca y con blusa de fiesta." },

    { id: "top-cebra", n: "Top de cebra y rosas", cat: "faldas", p: 29.95, tallas: T("S", "L"), nuevo: 1,
      fotos: ["ia/conjunto", "ia/faldas", "fotos/maniqui-conjunto"],
      d: "Rayas de cebra y parches de rosas en el mismo top: así de divertido. Corto, con escote cuadrado y mangas abullonadas. Con la falda verde agua es un conjunto de los que paran por la calle." },

    { id: "blusa-hojas", n: "Blusa verde de hojas", cat: "faldas", p: 29.95, tallas: T("S", "XL"),
      fotos: ["ia/blusa-hojas", "fotos/blusa-hojas"],
      d: "Hojas de palmera en verde lima sobre verde bosque. Escote cruzado y manga corta ancha. Con vaquero blanco de día o metida en una falda larga para la noche." },

    /* ---------- Chaquetas ---------- */
    { id: "chaqueta", n: "Chaqueta bordada de flores", cat: "chaquetas", p: 59.95, tallas: T("S", "XL"), nuevo: 1,
      fotos: ["ia/chaqueta", "ia/chaquetas", "fotos/chaqueta"],
      d: "Fondo crudo con flores bordadas en azul, mostaza y granate, cuello mao y ribete bordado en todo el frente. Convierte un vaquero y una camiseta en un look: las tardes de otoño son suyas." },

    /* ---------- Bolsos ---------- */
    { id: "bolso-rojo", n: "Bolso de ante rojo con flecos", cat: "bolsos", p: 49.95, tallas: UNICA, nuevo: 1,
      fotos: ["ia/bolso-rojo", "ia/bolsos", "fotos/vestido-rojo"],
      d: "Ante rojo intenso en forma de media luna, tachuelas doradas siguiendo la solapa y flecos largos. Asa corta y bandolera. El toque que convierte un vestido en un look." },

    { id: "bolso-mostaza", n: "Shopper de piel mostaza", cat: "bolsos", p: 59.95, tallas: UNICA,
      fotos: ["ia/bolso-mostaza", "ia/bolsos", "fotos/vestido-negro"],
      d: "Piel lisa color mostaza, grande y con asas largas de hombro. Cabe todo: el neceser, la agenda y las gafas. Con negro o con vaquero, levanta cualquier básico." },

    { id: "cartera-mostaza", n: "Cartera de ante con tachuelas", cat: "bolsos", p: 29.95, tallas: UNICA,
      fotos: ["ia/cartera-mostaza", "ia/bolsos", "fotos/vestido-hojas"],
      d: "Cartera plana de ante mostaza claro con tachuelas en todo el borde y muñequera. Para las bodas, las cenas y los días en que solo llevas lo justo." },
  ];

  window.PRENDAS.forEach(function (p, i) { p.foto = p.fotos[0]; p.orden = i; });
})();
