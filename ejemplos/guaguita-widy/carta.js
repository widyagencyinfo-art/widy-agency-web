/* =====================================================================
   Carta digital · Nuevo Guagüita (Valladolid)
   ---------------------------------------------------------------------
   Los precios salen de la carta de RACIONES de la casa.
   Para cambiar un precio, edita solo el array MENU de este archivo.
   Etiquetas: top = lo más pedido · veg = sin carne ni pescado
   Familias:  mar | tierra | sarten | verde
   ===================================================================== */

var MENU = [
  {
    grupo: 'Del mar',
    nota: 'Fritura y plancha',
    fam: 'mar',
    items: [
      { n: 'Calamares fritos',   d: 'Rebozados y a la freidora, como toda la vida.',        p: 9.00,  top: true },
      { n: 'Gambón al ajillo',   d: 'Gambón grande, hecho al momento.',                      p: 14.00, top: true },
      { n: 'Langostinos al ajillo', d: 'A la plancha, con su ajo y su limón.',               p: 9.00,  top: true },
      { n: 'Patas de rejo fritas', d: 'Pulpo frito, crujiente por fuera.',                   p: 9.00 }
    ]
  },
  {
    grupo: 'De la tierra',
    nota: 'Castilla en el centro de la mesa',
    fam: 'tierra',
    items: [
      { n: 'Torreznos',            d: 'Crujientes por fuera, tiernos por dentro.',           p: 6.50, top: true },
      { n: 'Oreja a la gallega',   d: 'Con su pimentón y su aceite.',                         p: 8.00, top: true },
      { n: 'Mollejas de lechazo',  d: 'La ración de la casa para los que saben.',             p: 18.00 },
      { n: 'Cecina de Pajariel',   d: 'Cortada fina, del Bierzo.',                            p: 10.00 },
      { n: 'Lacón con pimientos de Padrón', d: 'Lacón templado sobre pimientos.',             p: 8.00 },
      { n: 'Morcilla frita',       d: 'De Burgos, a la sartén.',                              p: 7.00 },
      { n: 'Croquetas de jamón',   d: 'Cremosas por dentro.',                                 p: 7.50 },
      { n: 'Alitas de pollo',      d: 'Doradas y para mojar pan.',                            p: 6.00 }
    ]
  },
  {
    grupo: 'De sartén',
    nota: 'Revueltos y setas',
    fam: 'sarten',
    items: [
      { n: 'Revuelto de gulas y langostinos', d: 'Huevo cremoso, gulas y langostinos.',       p: 12.00, top: true },
      { n: 'Revuelto de ajetes y langostinos', d: 'Ajetes tiernos y langostinos.',            p: 12.00 },
      { n: 'Revuelto de morcilla', d: 'Morcilla desmenuzada y huevo.',                        p: 12.00 },
      { n: 'Setas a la plancha',   d: 'Con ajo y perejil.',                                   p: 10.00, veg: true }
    ]
  },
  {
    grupo: 'Verduras y patatas',
    nota: 'Para acompañar o para picar',
    fam: 'verde',
    items: [
      { n: 'Pimientos de Padrón',       d: 'Unos pican y otros no.',                          p: 6.00, veg: true },
      { n: 'Ensalada de la casa',       d: 'La completa, con todo.',                          p: 9.50 },
      { n: 'Ensalada de tomate',        d: 'Tomate, cebolla y buen aceite.',                  p: 7.00, veg: true },
      { n: 'Ensalada normal',           d: 'Lechuga, tomate y cebolla.',                      p: 7.00, veg: true },
      { n: 'Patatas fritas 3 salsas',   d: 'Con brava, alioli y de la casa.',                 p: 5.50, veg: true },
      { n: 'Patatas fritas con tomate', d: 'Con salsa de tomate por encima.',                 p: 5.50, veg: true },
      { n: 'Patatas roquefort',         d: 'Bañadas en crema de roquefort.',                  p: 5.00, veg: true }
    ]
  },
  {
    grupo: 'Y además',
    nota: 'Pregunta en barra',
    fam: 'tierra',
    items: [
      { n: 'Sugerencias del día',   d: 'Lo que ha entrado hoy: chopitos, sepia, cazón, navajas, mejillones…', ask: 'Según mercado' },
      { n: 'Carne a la plancha',    d: 'Con sus patatas y su pimiento.',                       ask: 'Consultar' },
      { n: 'Postres caseros',       d: 'Pregunta por los del día.',                            ask: 'Consultar' },
      { n: 'Sidra, vino y caña',    d: 'Ofertas de raciones con botella de sidra.',            ask: 'Consultar' },
      { n: 'Montadito',             d: 'Gratis con tu consumición, de martes a viernes y sábados y domingos por la mañana.', ask: 'Invita la casa' }
    ]
  }
];

(function () {
  'use strict';

  var menuEl  = document.getElementById('menu');
  var emptyEl = document.getElementById('empty');
  var qEl     = document.getElementById('q');
  var clearEl = document.getElementById('clear');
  var chipsEl = document.getElementById('chips');
  var filtro  = 'all';

  function eur(n) {
    return n.toFixed(2).replace('.', ',') + ' €';
  }

  function norm(s) {
    return (s || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '');
  }

  function pasa(item, fam, texto) {
    if (filtro === 'top' && !item.top) return false;
    if (filtro === 'veg' && !item.veg) return false;
    if (['mar', 'tierra', 'sarten', 'verde'].indexOf(filtro) !== -1 && fam !== filtro) return false;
    if (!texto) return true;
    return norm(item.n + ' ' + (item.d || '')).indexOf(texto) !== -1;
  }

  function render() {
    var texto = norm(qEl.value.trim());
    var html = '';
    var total = 0;

    MENU.forEach(function (g) {
      var visibles = g.items.filter(function (it) { return pasa(it, g.fam, texto); });
      if (!visibles.length) return;
      total += visibles.length;

      html += '<section class="cgroup">' +
              '<div class="cgroup__head"><h2>' + g.grupo + '</h2><i></i><em>' + g.nota + '</em></div>';

      visibles.forEach(function (it) {
        var tags = '';
        if (it.top) tags += '<span class="tag tag--top">Más pedido</span>';
        if (it.veg) tags += '<span class="tag tag--veg">Sin carne ni pescado</span>';
        var precio = (typeof it.p === 'number')
          ? '<span class="citem__p">' + eur(it.p) + '</span>'
          : '<span class="citem__p citem__p--ask">' + (it.ask || 'Consultar') + '</span>';

        html += '<div class="citem"><div>' +
                '<span class="citem__n">' + it.n + tags + '</span>' +
                (it.d ? '<span class="citem__d">' + it.d + '</span>' : '') +
                '</div><i class="citem__dots"></i>' + precio + '</div>';
      });

      html += '</section>';
    });

    menuEl.innerHTML = html;
    emptyEl.hidden = total > 0;
    clearEl.hidden = !qEl.value;
  }

  qEl.addEventListener('input', render);
  clearEl.addEventListener('click', function () {
    qEl.value = '';
    qEl.focus();
    render();
  });

  chipsEl.addEventListener('click', function (e) {
    var b = e.target.closest('.chip');
    if (!b) return;
    chipsEl.querySelectorAll('.chip').forEach(function (c) { c.classList.remove('is-on'); });
    b.classList.add('is-on');
    filtro = b.dataset.f;
    render();
  });

  render();

  // QR de esta misma carta
  var qr = document.getElementById('qr');
  if (qr) {
    var img = new Image();
    img.src = 'img/qr.svg';
    img.alt = 'Código QR de la carta del Nuevo Guagüita';
    img.style.width = '100%';
    img.style.height = '100%';
    qr.appendChild(img);
  }
})();
