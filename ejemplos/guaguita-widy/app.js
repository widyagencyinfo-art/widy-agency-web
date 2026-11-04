/* ===== Nuevo Guagüita · interacciones ===== */
(function () {
  'use strict';

  // Loader
  window.addEventListener('load', function () {
    var l = document.getElementById('loader');
    if (l) setTimeout(function () { l.classList.add('is-out'); }, 350);
  });

  // Nav sticky
  var nav = document.getElementById('nav');
  function onScroll() {
    if (!nav) return;
    nav.classList.toggle('is-stuck', window.scrollY > 40);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Menú móvil
  var burger = document.getElementById('burger');
  var drawer = document.getElementById('drawer');
  function closeDrawer() {
    if (!drawer) return;
    drawer.classList.remove('is-open');
    nav.classList.remove('is-open');
    burger.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  }
  if (burger && drawer) {
    burger.addEventListener('click', function () {
      var open = drawer.classList.toggle('is-open');
      nav.classList.toggle('is-open', open);
      burger.setAttribute('aria-expanded', String(open));
      document.body.style.overflow = open ? 'hidden' : '';
    });
    drawer.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', closeDrawer);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeDrawer();
    });
  }

  // Reveal al hacer scroll
  var items = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add('is-in');
          io.unobserve(en.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    items.forEach(function (el) { io.observe(el); });
  } else {
    items.forEach(function (el) { el.classList.add('is-in'); });
  }

  // Año en el footer
  var y = document.getElementById('year');
  if (y) y.textContent = new Date().getFullYear();

  // Mensaje de WhatsApp con el día de hoy
  var wa = document.getElementById('waBtn');
  if (wa) {
    var dias = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
    var d = new Date().getDay();
    // los lunes está cerrado: proponemos el martes
    var cuando = (d === 1) ? 'mañana martes' : 'este ' + dias[d];
    var txt = 'Hola, quería reservar mesa en Nuevo Guagüita. ¿Tenéis sitio ' + cuando + '?';
    wa.href = 'https://wa.me/34633502306?text=' + encodeURIComponent(txt);
  }
})();
