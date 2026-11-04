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
