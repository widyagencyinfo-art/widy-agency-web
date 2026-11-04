/* Portada v2 (15-oct-2026): la bandeja de ejemplo del principio («Antes» / «Con Widy»).
   Al verse por primera vez pasa sola a «Con Widy» y los mensajes van entrando; luego se cambia a mano. */
(function () {
  var box = document.getElementById('pvShow');
  if (!box) return;
  var inbox = box.querySelector('.pv-inbox');
  var botones = box.querySelectorAll('.pv-seg button');
  var cuenta = box.querySelector('.pv-count');
  var total = box.querySelectorAll('.pv-inbox-list li').length;
  var tocado = false;

  function ver(v) {
    inbox.setAttribute('data-v', v);
    Array.prototype.forEach.call(botones, function (b) { b.setAttribute('aria-pressed', b.dataset.v === v ? 'true' : 'false'); });
    cuenta.textContent = v === 'despues' ? total + ' mensajes nuevos' : '0 mensajes nuevos';
  }
  Array.prototype.forEach.call(botones, function (b) {
    b.addEventListener('click', function () { tocado = true; ver(b.dataset.v); });
  });
  function solo() { if (!tocado) ver('despues'); }
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) {
      if (es[0].isIntersecting) { io.disconnect(); setTimeout(solo, 2200); }
    }, { threshold: 0.4 });
    io.observe(box);
  } else {
    setTimeout(solo, 2200);
  }
})();
