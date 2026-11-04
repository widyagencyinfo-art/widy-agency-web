/* ===================================================
   Widy — páginas de diseño web
   · Selector de tamaño de letra (se recuerda)
   · Barra fija del móvil (se oculta cuando los botones de WhatsApp están a la vista)
   · Sin formularios (25-sept-2026): los botones de WhatsApp ya traen el mensaje escrito desde el HTML
   =================================================== */
(function () {
  'use strict';

  var WA_NUMBER = '34624869847';
  var root = document.documentElement;

  /* ---------- Tamaño de letra: quitado (25-sept-2026). Se borra lo que hubiera guardado de visitas anteriores ---------- */
  root.classList.remove('fs-grande', 'fs-enorme');
  try { localStorage.removeItem('widy-fs'); localStorage.removeItem('widy-moda-fs'); } catch (e) {}

  /* ---------- Barra fija del móvil ---------- */
  var DESDE = 'widy.agency' + (location.pathname === '/' ? '' : location.pathname.replace(/\/$/, ''));
  var waBar = document.getElementById('waBar');
  if (waBar && !/wa\.me\//.test(waBar.getAttribute('href') || '')) {
    waBar.href = 'https://wa.me/' + WA_NUMBER + '?text=' + encodeURIComponent('Hola Widy, te escribo desde ' + DESDE + '. Quiero el boceto gratis de mi web.');
  }
  var formSec = document.getElementById('boceto');
  if (formSec && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { document.body.classList.toggle('form-visible', en.isIntersecting); });
    }, { threshold: 0.15 }).observe(formSec);
  }

  /* ---------- Menús desplegables (escritorio) y cajón (móvil) ----------
     Cada botón .hdr-drop abre el panel que dice su aria-controls; solo uno abierto a la vez. */
  var drops = Array.prototype.slice.call(document.querySelectorAll('.hdr-drop'));
  var burger = document.querySelector('.hdr-burger');
  var drawer = document.getElementById('drawer');
  var hdr = document.querySelector('.hdr');
  var panel = function (b) { return document.getElementById(b.getAttribute('aria-controls')); };
  var abierto = null;

  function cerrarMega() {
    if (!abierto) { return; }
    var p = panel(abierto);
    if (p) { p.hidden = true; p.classList.remove('abierto'); }
    abierto.setAttribute('aria-expanded', 'false');
    abierto = null;
  }
  function abrirMega(b) {
    cerrarMega();
    var p = panel(b);
    if (!p) { return; }
    p.hidden = false;
    p.classList.add('abierto');
    b.setAttribute('aria-expanded', 'true');
    abierto = b;
  }
  function cerrarDrawer() {
    if (!drawer || drawer.hidden) { return; }
    drawer.hidden = true;
    burger.setAttribute('aria-expanded', 'false');
    burger.setAttribute('aria-label', 'Abrir menú');
    document.body.classList.remove('menu-abierto');
  }
  drops.forEach(function (b) {
    b.addEventListener('click', function (e) {
      e.stopPropagation();
      if (abierto === b) { cerrarMega(); } else { abrirMega(b); }
    });
    var p = panel(b);
    if (p) { p.addEventListener('click', function (e) { if (e.target.closest('a')) { cerrarMega(); } }); }
  });
  document.addEventListener('click', function (e) {
    if (abierto && !panel(abierto).contains(e.target)) { cerrarMega(); }
  });
  if (burger && drawer) {
    burger.addEventListener('click', function () {
      if (drawer.hidden) {
        drawer.style.top = Math.max(0, hdr.getBoundingClientRect().bottom) + 'px';
        drawer.hidden = false;
        burger.setAttribute('aria-expanded', 'true');
        burger.setAttribute('aria-label', 'Cerrar menú');
        document.body.classList.add('menu-abierto');
      } else { cerrarDrawer(); }
    });
    drawer.addEventListener('click', function (e) { if (e.target.closest('a')) { cerrarDrawer(); } });
  }
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      if (abierto) { var b = abierto; cerrarMega(); b.focus(); }
      if (drawer && !drawer.hidden) { cerrarDrawer(); burger.focus(); }
    }
  });
})();
