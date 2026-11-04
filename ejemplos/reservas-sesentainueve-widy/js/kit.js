/* Widy · kit de captación: carteles imprimibles, sitios donde poner el enlace y textos para copiar */
(function () {
  'use strict';
  var B = window.BIZ, P = B.poster;
  var URL_ = B.url, HOST = URL_.replace(/^https?:\/\//, '');
  var $ = function (s) { return document.querySelector(s); };

  /* A4 a 96 ppp */
  var SHEET_W = 794, SHEET_H = 1123;

  var FORMATS = [
    { id: 'a4',   nm: 'Escaparate',  sz: 'A4',           cols: 1, rows: 1, help: 'Un folio entero para el escaparate o la pared. Se lee desde la calle.' },
    { id: 'a5',   nm: 'Mostrador',   sz: '2 por folio',  cols: 1, rows: 2, help: 'Dos por folio. Para el mostrador y donde la gente espera.' },
    { id: 'sq',   nm: 'Espejo',      sz: '4 por folio',  cols: 2, rows: 2, help: 'Cuatro por folio. Uno en cada espejo o puesto de trabajo.' },
    { id: 'card', nm: 'Tarjeta',     sz: '10 por folio', cols: 2, rows: 5, help: 'Diez por folio. Para darla en mano al cobrar, y que reserven la siguiente.' }
  ];
  var current = 'a4';

  var CHECK = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>';

  function qr(cls) {
    return '<div class="qrf ' + cls + '">' +
      '<img src="/ejemplos/reservas-sesentainueve-widy/img/qr.png" alt="Código QR para reservar cita en ' + B.name + '">' +
      '<i class="c tl"></i><i class="c tr"></i><i class="c bl"></i><i class="c br"></i></div>';
  }

  function piece(id) {
    var head = '<h1 class="pc-head">' + P.head + '</h1>';
    var headS = '<h1 class="pc-head">' + P.headShort + '</h1>';

    if (id === 'a4') {
      return '<article class="pc a4">' +
        '<header class="pc-top"><p class="pc-kick">' + P.kicker + '</p>' + head +
        '<p class="pc-sub">' + P.sub + '</p></header>' +
        '<div class="pc-mid">' + qr('big') +
        '<p class="qr-cta">Apunta con la cámara del móvil</p>' +
        '<p class="qr-url">' + HOST + '</p></div>' +
        '<ul class="pc-bul">' + P.bullets.map(function (b) {
          return '<li>' + CHECK + '<span>' + b + '</span></li>';
        }).join('') + '</ul>' +
        '<footer class="pc-foot"><b>' + B.name + '</b><span>' + B.address + ' · ' + B.phonePretty + '</span></footer>' +
        '</article>';
    }
    if (id === 'a5') {
      return '<article class="pc a5">' +
        '<div class="pc-l"><p class="pc-kick">' + P.kicker + '</p>' + head +
        '<p class="pc-sub">' + P.subShort + '</p>' +
        '<ul class="pc-bul">' + P.bullets.slice(0, 3).map(function (b) {
          return '<li>' + CHECK + '<span>' + b + '</span></li>';
        }).join('') + '</ul>' +
        '<p class="pc-foot2"><b>' + B.name + '</b> · ' + B.phonePretty + '</p></div>' +
        '<div class="pc-r">' + qr('med') +
        '<p class="qr-cta">Apunta la cámara</p><p class="qr-url">' + HOST + '</p></div>' +
        '</article>';
    }
    if (id === 'sq') {
      return '<article class="pc sq">' + headS +
        '<div class="pc-mid">' + qr('a6') + '</div>' +
        '<p class="qr-cta">Apunta la cámara del móvil</p>' +
        '<p class="qr-url">' + HOST + '</p>' +
        '<p class="pc-foot2"><b>' + B.name + '</b></p></article>';
    }
    return '<article class="pc card">' +
      '<div class="pc-l"><p class="pc-kick">' + B.name + '</p>' +
      '<h1 class="pc-head">Reserva tu próxima cita</h1>' +
      '<p class="qr-url">' + HOST + '</p>' +
      '<p class="pc-foot2">' + B.phonePretty + '</p></div>' +
      '<div class="pc-r">' + qr('sm') + '</div></article>';
  }

  function renderSheet() {
    var f = FORMATS.filter(function (x) { return x.id === current; })[0];
    var sheet = $('#sheet');
    sheet.className = 'sheet fmt-' + f.id;
    sheet.style.setProperty('--cols', f.cols);
    sheet.style.setProperty('--rows', f.rows);
    var n = f.cols * f.rows, html = '';
    for (var i = 0; i < n; i++) html += '<div class="cell">' + piece(f.id) + '</div>';
    sheet.innerHTML = html;
    $('#fmtHelp').textContent = f.help;
    fit();
  }

  /* el folio se dibuja a tamaño real y se encoge para la vista previa */
  function fit() {
    var stage = $('#stage'), sheet = $('#sheet');
    var s = Math.min(1, stage.clientWidth / SHEET_W);
    sheet.style.transform = 'scale(' + s + ')';
    stage.style.height = (SHEET_H * s) + 'px';
  }

  function renderTabs() {
    var box = $('#fmt');
    FORMATS.forEach(function (f) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'fmt-b' + (f.id === current ? ' on' : '');
      b.setAttribute('role', 'tab');
      b.setAttribute('aria-selected', f.id === current ? 'true' : 'false');
      b.innerHTML = '<b>' + f.nm + '</b><span>' + f.sz + '</span>';
      b.onclick = function () {
        current = f.id;
        box.querySelectorAll('.fmt-b').forEach(function (x) {
          x.classList.remove('on'); x.setAttribute('aria-selected', 'false');
        });
        b.classList.add('on'); b.setAttribute('aria-selected', 'true');
        renderSheet();
      };
      box.appendChild(b);
    });
  }

  /* ---------------- dónde poner el enlace ---------------- */
  var PLACES = [
    ['Tu ficha de Google', 'En tu perfil de Google Business: <b>Editar perfil → Enlace de reservas</b>. Te aparece el botón «Reservar» en Google y en Maps, que es por donde más gente te busca.'],
    ['Instagram y Facebook', 'Pon <b>' + HOST + '</b> en el enlace de la biografía y crea una historia destacada que se llame «Reservar».'],
    ['Respuesta automática de WhatsApp', 'En WhatsApp Business: <b>Herramientas → Mensaje de ausencia</b>. Así contestas mientras trabajas o con el local cerrado.'],
    ['Los carteles con el QR', 'Escaparate, mostrador y espejos. Los que están esperando reservan la siguiente cita antes de irse.'],
    ['A tus clientes de siempre', 'Mándalo por WhatsApp a tu lista de contactos. Es lo que más citas trae el primer día.']
  ];

  var TEXTS = [
    { t: 'Respuesta automática de WhatsApp',
      x: '¡Hola! Gracias por escribir a ' + B.name + ' 👋\n\n' +
         'Ahora mismo estamos atendiendo. Si quieres cita, puedes cogerla tú en 30 segundos aquí:\n' + URL_ + '\n\n' +
         'Ahí ves los huecos libres de verdad y eliges el que mejor te venga. Te confirmamos al momento.' },
    { t: 'Biografía de Instagram',
      x: B.name + '\n📍 ' + B.address + '\n📅 Reserva tu cita aquí 👇\n' + URL_ },
    { t: 'Mensaje a tus clientes de siempre',
      x: '¡Hola! Somos ' + B.name + ' 😊\n\n' +
         'Ya puedes coger cita tú mismo, cuando quieras, sin llamar ni esperar a que abramos:\n' + URL_ + '\n\n' +
         'Eliges lo que te vas a hacer, ves los huecos que hay libres y reservas. Te llega la confirmación al WhatsApp y un recordatorio antes de tu cita.\n\n¡Te esperamos!' },
    { t: 'Publicación para Instagram',
      x: 'Se acabó el llamar y que no lo cojamos 📵\n\n' +
         'Ya puedes reservar tu cita en ' + B.name + ' desde el móvil, a la hora que sea — también a las 12 de la noche.\n\nEnlace en la bio 👆\n\n' +
         '#' + (B.id === 's69' ? 'tattoosevilla #tatuajesevilla #piercingsevilla' : 'peluqueriasevilla #pinomontano #sevilla') + ' #citaonline' },
    { t: 'Cuando preguntan el precio por mensaje',
      x: '¡Hola! Te paso el enlace donde tienes todos los precios y los huecos libres:\n' + URL_ +
         '\n\nSi te encaja alguno, resérvalo ahí mismo y queda confirmado 😊' }
  ];

  function init() {
    $('#bizName').textContent = B.name;
    document.documentElement.style.setProperty('--po-ink', P.ink);
    document.documentElement.style.setProperty('--po-accent', P.accent);
    document.documentElement.style.setProperty('--po-wash', P.wash);
    document.documentElement.style.setProperty('--po-line', P.line);

    renderTabs(); renderSheet();
    window.addEventListener('resize', fit);
    $('#printBtn').onclick = function () { window.print(); };

    var ol = $('#places');
    PLACES.forEach(function (p) {
      var li = document.createElement('li');
      li.innerHTML = '<b>' + p[0] + '</b><span>' + p[1] + '</span>';
      ol.appendChild(li);
    });

    var box = $('#texts');
    TEXTS.forEach(function (t) {
      var d = document.createElement('div');
      d.className = 'txt';
      d.innerHTML = '<div class="txt-h"><b>' + t.t + '</b><button class="k-btn sm" type="button">Copiar</button></div>' +
        '<pre>' + t.x.replace(/</g, '&lt;') + '</pre>';
      d.querySelector('button').onclick = function () { copy(t.x); };
      box.appendChild(d);
    });
  }

  var tt;
  function copy(s) {
    var done = function () {
      var t = $('#toast'); t.classList.add('show');
      clearTimeout(tt); tt = setTimeout(function () { t.classList.remove('show'); }, 1600);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(s).then(done, function () { fallback(s, done); });
    } else fallback(s, done);
  }
  function fallback(s, done) {
    var a = document.createElement('textarea');
    a.value = s; document.body.appendChild(a); a.select();
    try { document.execCommand('copy'); done(); } catch (e) {}
    document.body.removeChild(a);
  }

  document.addEventListener('DOMContentLoaded', init);
})();
