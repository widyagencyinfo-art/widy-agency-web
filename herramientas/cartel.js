/* ===================================================
   Widy — Cartel de reseñas de Google con QR
   Todo en el navegador. QR: qrcode-generator (MIT) desde cdnjs.
   =================================================== */
(function () {
  'use strict';
  function $(id) { return document.getElementById(id); }
  var link = $('ct-link'), nombre = $('ct-nombre'), frase = $('ct-frase');
  if (!link) { return; }
  var poster = $('ctPoster'), canvas = $('ct-qr'), help = $('ct-help'), AYUDA = help.innerHTML;
  var btnPrint = $('ct-print'), btnPng = $('ct-png');
  var VALIDOS = /^https:\/\/([a-z0-9-]+\.)*(g\.page|goo\.gl|google\.[a-z.]+)\//i;

  function radio(name) { var el = document.querySelector('input[name="' + name + '"]:checked'); return el ? el.value : ''; }

  function dibujar(cv, texto) {
    var ctx = cv.getContext('2d');
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, cv.width, cv.height);
    if (!texto || typeof window.qrcode !== 'function') { return; }
    var qr = window.qrcode(0, 'M'); qr.addData(texto); qr.make();
    var n = qr.getModuleCount(), cel = Math.floor(cv.width / (n + 8)), off = Math.floor((cv.width - cel * n) / 2);
    ctx.fillStyle = '#0e0e10';
    for (var r = 0; r < n; r++) { for (var c = 0; c < n; c++) { if (qr.isDark(r, c)) { ctx.fillRect(off + c * cel, off + r * cel, cel, cel); } } }
  }

  function actualizar() {
    var url = (link.value || '').trim();
    var ok = VALIDOS.test(url);
    if (url && !ok) {
      help.innerHTML = 'Ese enlace no parece de Google. Tiene que empezar por https:// y ser de g.page, google.com o goo.gl. <a href="/guias/conseguir-resenas-en-google">Cómo sacarlo</a>.';
      help.classList.add('error');
    } else { help.innerHTML = AYUDA; help.classList.remove('error'); }
    $('ctNombre').textContent = (nombre.value || '').trim() || 'Tu negocio';
    $('ctFrase').textContent = (frase.value || '').trim() || '¿Te ha gustado? Cuéntalo en Google';
    poster.setAttribute('data-tema', radio('ct-tema') || 'claro');
    poster.setAttribute('data-tam', radio('ct-tam') || 'A5');
    dibujar(canvas, ok ? url : '');
    btnPrint.disabled = btnPng.disabled = !ok;
  }

  ['input', 'change'].forEach(function (ev) { $('cartelForm').addEventListener(ev, actualizar); });
  $('cartelForm').addEventListener('submit', function (e) { e.preventDefault(); });

  btnPrint.addEventListener('click', function () {
    var st = $('ct-page') || document.createElement('style');
    st.id = 'ct-page';
    st.textContent = '@page { size: ' + (radio('ct-tam') || 'A5') + ' portrait; margin: 0; }';
    document.head.appendChild(st);
    document.body.classList.add('imprimiendo-cartel');
    window.print();
    setTimeout(function () { document.body.classList.remove('imprimiendo-cartel'); }, 500);
  });
  btnPng.addEventListener('click', function () {
    var big = document.createElement('canvas'); big.width = big.height = 1024;
    dibujar(big, (link.value || '').trim());
    var a = document.createElement('a'); a.download = 'qr-resenas-google.png'; a.href = big.toDataURL('image/png');
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  });

  if (typeof window.qrcode === 'function') { actualizar(); } else { window.addEventListener('load', actualizar); }
})();
