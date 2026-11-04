/* ===================================================
   Widy — Calculadora del precio de una página web
   Todo se calcula en el navegador; no se envía nada.
   Rangos: mercado español 2026 para webs de negocio pequeño
   (los mismos que en /cuanto-cuesta-una-pagina-web).
   =================================================== */
(function () {
  'use strict';

  var WA_NUMBER = '34624869847';
  var form = document.getElementById('calc');
  if (!form) { return; }

  // [freelance mín, freelance máx, agencia mín, agencia máx]
  var BASE = {
    web:      [500, 1500, 1500, 5000],
    tienda:   [800, 2500, 1500, 6500],
    reservas: [700, 1800, 2000, 5500]
  };
  var PAGINAS = { '1': 0.8, '5': 1, '10': 1.3, '20': 1.7 };
  // subir productos (3-10 € por producto) según el tramo
  var PRODUCTOS = { '20': [0, 0, 0, 0], '100': [180, 600, 300, 800], '300': [600, 2000, 900, 2500], '1000': [1500, 4000, 2500, 6000] };
  var TIPO_TXT = { web: 'página web', tienda: 'tienda online', reservas: 'web con citas' };
  var PAG_TXT = { '1': 'una sola página', '5': 'de 2 a 5 páginas', '10': 'de 6 a 10 páginas', '20': 'más de 10 páginas' };
  var PROD_TXT = { '20': 'hasta 20 productos', '100': 'de 21 a 100 productos', '300': 'de 101 a 300 productos', '1000': 'más de 300 productos' };
  var FOTOS_TXT = { si: 'tengo fotos buenas', movil: 'fotos del móvil a mejorar', no: 'sin fotos (o quiero fotos sobre modelo)' };
  var EXTRA_TXT = { blog: 'blog', form: 'formulario de presupuesto', pagos: 'cobrar online', area: 'zona privada de clientes' };

  function $(id) { return document.getElementById(id); }
  function radio(name) {
    var el = form.querySelector('input[name="' + name + '"]:checked');
    return el ? el.value : '';
  }
  function extras() {
    return Array.prototype.map.call(form.querySelectorAll('input[name="extra"]:checked'), function (el) { return el.value; });
  }
  function redondear(n) { return n < 1000 ? Math.round(n / 50) * 50 : Math.round(n / 100) * 100; }
  function euros(n) { return String(redondear(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '.') + ' €'; }
  function rango(a, b) { return euros(a) + ' – ' + euros(b); }

  function calcular() {
    var tipo = radio('tipo') || 'web';
    var pag = radio('paginas') || '5';
    var prod = tipo === 'tienda' ? (radio('productos') || '20') : '20';
    var fotos = radio('fotos') || 'si';
    var textos = radio('textos') || 'no';
    var idiomas = parseInt(radio('idiomas') || '1', 10);
    var ex = extras().filter(function (x) { return !(x === 'pagos' && tipo === 'tienda'); });

    var b = BASE[tipo], f = PAGINAS[pag];
    var r = [b[0] * f, b[1] * f, b[2] * f, b[3] * f];
    var partes = []; // [nombre, peso en agencia máx]
    function sumar(nombre, v) { for (var i = 0; i < 4; i++) { r[i] += v[i]; } partes.push([nombre, v[3]]); }

    if (f > 1) { partes.push(['el número de páginas', b[3] * (f - 1)]); }
    if (tipo === 'tienda' && prod !== '20') { sumar('subir tantos productos', PRODUCTOS[prod]); }
    if (fotos === 'movil') { sumar('mejorar las fotos', [150, 400, 300, 800]); }
    if (fotos === 'no') {
      var n = tipo === 'tienda' ? { '20': 20, '100': 60, '300': 200, '1000': 400 }[prod] : 0;
      sumar('hacer las fotos', n ? [n * 10, n * 20, n * 15, n * 30] : [300, 700, 500, 1200]);
    }
    if (textos === 'no') { sumar('escribir los textos', [150, 500, 400, 1200]); }
    if (idiomas > 1) {
      var extra = (idiomas - 1) * 0.25;
      sumar(idiomas === 2 ? 'el segundo idioma' : 'los idiomas', [r[0] * extra, r[1] * extra, r[2] * extra, r[3] * extra]);
    }
    if (ex.indexOf('blog') > -1) { sumar('el blog', [150, 400, 400, 1000]); }
    if (ex.indexOf('form') > -1) { sumar('el formulario', [50, 150, 100, 300]); }
    if (ex.indexOf('pagos') > -1) { sumar('los cobros online', [200, 600, 500, 1500]); }
    if (ex.indexOf('area') > -1) { sumar('la zona de clientes', [800, 2500, 2000, 6000]); }

    $('r-free').textContent = rango(r[0], r[1]);
    $('r-agen').textContent = rango(r[2], r[3]);
    $('r-diy').textContent = tipo === 'tienda' ? '24-40 €/mes + unas 40-80 h tuyas' : '15-30 €/mes + unas 20-40 h tuyas';

    // Conmigo: sin cifra (en la web no se publican precios de Widy); el precio se da por escrito tras el boceto
    var complejo = pag === '20' || idiomas === 3 || prod === '1000' || ex.indexOf('area') > -1;
    var precio = 'Precio cerrado por escrito';
    var txt = 'Con dominio, alojamiento, legales y cambios dentro. Y el boceto lo ves gratis antes de pagar.';
    if (tipo === 'tienda') {
      txt = 'La tienda montada entera, con pagos con tarjeta y Bizum y envíos. Con tu catálogo (' + PROD_TXT[prod] + ') te doy el cierre por escrito antes de empezar.';
    } else if (tipo === 'reservas') {
      txt = 'Con botón de cita por WhatsApp en todas las páginas. Si quieres reservas con tus huecos y avisos, te lo doy por escrito.';
    }
    if (fotos === 'no' || fotos === 'movil') {
      txt += ' Si prefieres que haga yo las fotos cada mes, está el plan con contenido.';
    }
    if (complejo) {
      txt = 'Lo que has marcado es más que una web estándar: te doy el precio cerrado por escrito antes de empezar. El boceto sigue siendo gratis.';
    }
    $('r-widy').textContent = precio;
    $('r-widy-txt').textContent = txt;

    partes.sort(function (a, c) { return c[1] - a[1]; });
    var top = partes.slice(0, 2).map(function (p) { return p[0]; });
    $('r-sube').textContent = top.length ? 'Lo que más sube el precio en tu caso: ' + top.join(' y ') + '.' : '';

    // Numeración de las preguntas (la de productos solo sale en tienda)
    var esTienda = tipo === 'tienda';
    $('tq-productos').hidden = !esTienda;
    var nums = form.querySelectorAll('.tq:not([hidden]) .tq-n');
    Array.prototype.forEach.call(nums, function (el, i) { el.textContent = i + 1; });
    var optPagos = $('opt-pagos');
    if (optPagos) { optPagos.hidden = esTienda; }

    // Resumen para WhatsApp
    var resumen = [TIPO_TXT[tipo], PAG_TXT[pag]];
    if (esTienda) { resumen.push(PROD_TXT[prod]); }
    resumen.push(FOTOS_TXT[fotos]);
    resumen.push(textos === 'no' ? 'necesito los textos' : 'tengo los textos');
    resumen.push(idiomas === 1 ? 'solo en español' : (idiomas === 2 ? 'en dos idiomas' : 'en tres o más idiomas'));
    if (ex.length) { resumen.push('además: ' + ex.map(function (x) { return EXTRA_TXT[x]; }).join(', ')); }
    var msg = 'Hola Widy, he usado la calculadora de widy.agency. Necesito: ' + resumen.join('; ') +
      '. ¿Me haces el boceto gratis? Mi negocio es ';
    $('calcWa').href = 'https://wa.me/' + WA_NUMBER + '?text=' + encodeURIComponent(msg);
  }

  form.addEventListener('change', calcular);
  form.addEventListener('submit', function (e) { e.preventDefault(); });
  calcular();
})();
