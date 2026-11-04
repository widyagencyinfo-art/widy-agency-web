/* ===================================================
   Widy — Generador de enlace de WhatsApp con mensaje y QR
   Todo ocurre en el navegador: no se envía ni se guarda nada.
   QR: qrcode-generator (Kazuhiko Arase, MIT) desde cdnjs.
   =================================================== */
(function () {
  'use strict';

  function $(id) { return document.getElementById(id); }
  var pais = $('wg-pais'), tel = $('wg-tel'), msg = $('wg-msg');
  if (!pais || !tel) { return; }
  var out = $('wg-link'), copy = $('wg-copy'), test = $('wg-test'), dl = $('wg-dl');
  var html = $('wg-html'), copyHtml = $('wg-copyhtml'), help = $('wg-telmsg'), canvas = $('wg-qr');
  var enlace = '';
  var AYUDA = help ? help.textContent : '';

  function numero() {
    var d = (tel.value || '').replace(/\D/g, '');
    if (pais.value === '34') { d = d.replace(/^0034/, '').replace(/^34(?=\d{9}$)/, ''); }
    d = d.replace(/^00/, '').replace(/^0+/, '');
    return d;
  }

  function valido(d) {
    if (pais.value === '34') { return /^[6789]\d{8}$/.test(d); }
    return d.length >= 6 && d.length <= 14;
  }

  function dibujarQR(texto) {
    var ctx = canvas.getContext('2d');
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    if (!texto || typeof window.qrcode !== 'function') { return false; }
    var qr = window.qrcode(0, 'M');
    qr.addData(texto);
    qr.make();
    var n = qr.getModuleCount(), margen = 4;
    var celda = Math.floor(canvas.width / (n + margen * 2));
    var off = Math.floor((canvas.width - celda * n) / 2);
    ctx.fillStyle = '#0e0e10';
    for (var r = 0; r < n; r++) {
      for (var c = 0; c < n; c++) {
        if (qr.isDark(r, c)) { ctx.fillRect(off + c * celda, off + r * celda, celda, celda); }
      }
    }
    return true;
  }

  function activar(on) {
    [copy, dl, copyHtml].forEach(function (b) { if (b) { b.disabled = !on; } });
    if (test) {
      test.setAttribute('aria-disabled', on ? 'false' : 'true');
      test.href = on ? enlace : '#';
    }
  }

  function actualizar() {
    var d = numero();
    if (!d) {
      enlace = '';
      out.textContent = 'Escribe tu número para crearlo';
      if (help) { help.textContent = AYUDA; help.classList.remove('error'); }
      html.value = '';
      dibujarQR('');
      activar(false);
      return;
    }
    if (!valido(d)) {
      if (help) { help.textContent = pais.value === '34' ? 'En España son 9 cifras y empiezan por 6, 7, 8 o 9.' : 'Revisa el número: solo cifras, sin el prefijo del país.'; help.classList.add('error'); }
    } else if (help) { help.textContent = AYUDA; help.classList.remove('error'); }
    var texto = (msg.value || '').trim();
    enlace = 'https://wa.me/' + pais.value + d + (texto ? '?text=' + encodeURIComponent(texto) : '');
    out.textContent = enlace;
    html.value = '<a href="' + enlace + '" target="_blank" rel="noopener" ' +
      'style="display:inline-block;background:#25d366;color:#fff;font-weight:700;padding:14px 22px;border-radius:999px;text-decoration:none">' +
      'Escríbenos por WhatsApp</a>';
    dibujarQR(enlace);
    activar(valido(d));
  }

  function copiar(texto, boton) {
    var ok = function () {
      var antes = boton.textContent;
      boton.textContent = '¡Copiado!';
      setTimeout(function () { boton.textContent = antes; }, 1600);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(texto).then(ok, function () { fallback(texto); ok(); });
    } else { fallback(texto); ok(); }
  }
  function fallback(texto) {
    var t = document.createElement('textarea');
    t.value = texto; t.setAttribute('readonly', ''); t.style.position = 'absolute'; t.style.left = '-9999px';
    document.body.appendChild(t); t.select();
    try { document.execCommand('copy'); } catch (e) {}
    document.body.removeChild(t);
  }

  [pais, tel, msg].forEach(function (el) { el.addEventListener('input', actualizar); el.addEventListener('change', actualizar); });
  Array.prototype.forEach.call(document.querySelectorAll('.chip[data-msg]'), function (b) {
    b.addEventListener('click', function () { msg.value = b.getAttribute('data-msg'); actualizar(); msg.focus(); });
  });
  copy.addEventListener('click', function () { if (enlace) { copiar(enlace, copy); } });
  copyHtml.addEventListener('click', function () { if (html.value) { copiar(html.value, copyHtml); } });
  test.addEventListener('click', function (e) { if (!enlace || test.getAttribute('aria-disabled') === 'true') { e.preventDefault(); } });
  dl.addEventListener('click', function () {
    if (!enlace) { return; }
    // PNG grande para imprimir
    var big = document.createElement('canvas');
    big.width = big.height = 1024;
    var tmp = canvas; canvas = big; dibujarQR(enlace); canvas = tmp;
    var a = document.createElement('a');
    a.download = 'whatsapp-qr-' + pais.value + numero() + '.png';
    a.href = big.toDataURL('image/png');
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  });
  document.getElementById('waGen').addEventListener('submit', function (e) { e.preventDefault(); });

  // La librería del QR carga con defer: esperar a que esté
  if (typeof window.qrcode === 'function') { actualizar(); }
  else { window.addEventListener('load', actualizar); }
})();
