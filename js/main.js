/* ===================================================
   Widy — web pública · interacciones
   =================================================== */
(function () {
  'use strict';

  /* WhatsApp de Widy (cámbialo aquí si hace falta) */
  var WA_NUMBER = '34624869847';

  /* Año dinámico */
  var yearEl = document.getElementById('year');
  if (yearEl) { yearEl.textContent = new Date().getFullYear(); }

  /* Enlaces directos de WhatsApp */
  var waBase = 'https://wa.me/' + WA_NUMBER +
    '?text=' + encodeURIComponent('Hola Widy, te escribo desde widy.agency' + (location.pathname === '/' ? '' : location.pathname.replace(/\/$/, '')) + '. Quiero información.');
  ['waLink', 'waLinkFoot', 'waFab'].forEach(function (id) {
    var el = document.getElementById(id);
    if (el) { el.href = waBase; el.target = '_blank'; el.rel = 'noopener'; }
  });

  /* Botones de boceto: directos a WhatsApp (26-nov). En la portada nueva ya vienen así en el HTML. */
  var titulo = (document.querySelector('h1') || {}).textContent || '';
  titulo = titulo.replace(/\s+/g, ' ').trim().slice(0, 70);
  var waBoceto = 'https://wa.me/' + WA_NUMBER + '?text=' + encodeURIComponent(
    'Hola Widy, te escribo desde widy.agency' + (location.pathname === '/' ? '' : location.pathname.replace(/\/$/, '').replace(/\.html$/, '')) +
    '. Quiero el boceto gratis' + (titulo && location.pathname !== '/' ? ' (' + titulo + ')' : '') + '.');
  Array.prototype.forEach.call(document.querySelectorAll('a.btn-primary[href="#boceto"], a.btn-primary[href="/#boceto"]'), function (a) {
    a.href = waBoceto; a.target = '_blank'; a.rel = 'noopener';
  });

  /* Páginas interiores: el menú flota transparente sobre la cabecera noche y se vuelve blanco al bajar (26-nov) */
  (function () {
    var b = document.body, hdr = document.querySelector('.hdr');
    if (!hdr || !b.classList.contains('web') || b.classList.contains('portada')) return;
    if (!document.querySelector('main > .hero, main > .h-casos-hero, main > .cs-hero')) return;
    b.classList.add('tp-int');
    function alBajar() { hdr.classList.toggle('is-scrolled', (window.scrollY || 0) > 24); }
    alBajar();
    window.addEventListener('scroll', alBajar, { passive: true });
  })();

  /* Menú móvil */
  var toggle = document.getElementById('navToggle');
  var nav = document.getElementById('nav');
  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      toggle.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
    });
    nav.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') {
        nav.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  /* Aparición al hacer scroll */
  var reveals = document.querySelectorAll('.reveal');
  var prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced || !('IntersectionObserver' in window)) {
    reveals.forEach(function (el) { el.classList.add('in'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    reveals.forEach(function (el) { io.observe(el); });
  }

  /* Formulario → WhatsApp con datos pre-escritos */
  var form = document.getElementById('leadForm');
  if (form) {
    var msg = document.getElementById('lf-msg');
    var button = form.querySelector('button[type="submit"]');

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      var nombre  = val('lf-nombre');
      var negocio = val('lf-negocio');
      var tel     = val('lf-tel');
      var email   = val('lf-email');

      if (!nombre || !negocio || !tel) {
        setMsg('Rellena tu nombre, negocio y teléfono para continuar.', 'error');
        return;
      }

      var texto =
        'Hola Widy 👋 Quiero reservar un diagnóstico gratis.\n\n' +
        '• Nombre: ' + nombre + '\n' +
        '• Negocio: ' + negocio + '\n' +
        '• Teléfono: ' + tel +
        (email ? '\n• Email: ' + email : '');

      var url = 'https://wa.me/' + WA_NUMBER + '?text=' + encodeURIComponent(texto);

      button.disabled = true;
      button.textContent = 'Abriendo WhatsApp…';
      setMsg('Te llevamos a WhatsApp con tus datos listos. Solo dale a enviar 👇', 'ok');

      window.open(url, '_blank', 'noopener');

      setTimeout(function () {
        button.disabled = false;
        button.textContent = 'Reservar mi diagnóstico';
      }, 2500);
    });
  }

  function val(id) {
    var el = document.getElementById(id);
    return el ? (el.value || '').trim() : '';
  }
  function setMsg(text, type) {
    if (!msg) { return; }
    msg.textContent = text;
    msg.className = 'form-msg' + (type ? ' ' + type : '');
  }
})();
