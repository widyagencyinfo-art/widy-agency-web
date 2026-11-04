/* ===================================================
   Widy · Moda — interacciones (vertical tiendas de ropa)
   =================================================== */
(function () {
  'use strict';

  /* WhatsApp de Widy */
  var WA_NUMBER = '34624869847';


  var root = document.documentElement;
  /* ---------- Tamaño de letra: quitado (25-sept-2026). Se borra lo que hubiera guardado de visitas anteriores ---------- */
  root.classList.remove('fs-grande', 'fs-enorme');
  try { localStorage.removeItem('widy-fs'); localStorage.removeItem('widy-moda-fs'); } catch (e) {}

  /* Año dinámico */
  var yearEl = document.getElementById('year');
  if (yearEl) { yearEl.textContent = new Date().getFullYear(); }

  /* Enlaces directos de WhatsApp */
  var waBase = 'https://wa.me/' + WA_NUMBER +
    '?text=' + encodeURIComponent('Hola Widy, te escribo desde widy.agency/moda. Quiero información sobre mi tienda online.');
  ['waLink', 'waLinkFoot', 'waFab', 'waLinkTop'].forEach(function (id) {
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
        setMsg('Para poder contestarte necesito tu nombre, tu negocio y tu teléfono. Gracias 🙂', 'error');
        return;
      }

      var texto =
        'Hola Widy 👋 Te escribo desde vuestra página web.\n\n' +
        '• Nombre: ' + nombre + '\n' +
        '• Mi negocio: ' + negocio + '\n' +
        '• Teléfono: ' + tel +
        (email ? '\n• Email: ' + email : '');

      var url = 'https://wa.me/' + WA_NUMBER + '?text=' + encodeURIComponent(texto);

      button.disabled = true;
      button.textContent = 'Abriendo WhatsApp…';
      setMsg('Se ha abierto WhatsApp con tu mensaje ya escrito. Solo tienes que darle a ENVIAR 👇', 'ok');

      window.open(url, '_blank', 'noopener');

      setTimeout(function () {
        button.disabled = false;
        button.textContent = 'Enviar y hablar con Widy';
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


/* ===== Vídeo demo del portfolio =====
   Arranca solo (silenciado, en bucle) cuando entra en pantalla; se para al salir.
   El botón lo reinicia desde el principio con sonido y con controles. */
(function () {
  'use strict';
  var reel = document.querySelector('.reel');
  var video = document.getElementById('reel-video');
  var btn = document.getElementById('reel-play');
  if (!reel || !video || !btn) return;

  function intentar() {
    var p = video.play();
    if (p && p.catch) p.catch(function () {});
  }
  function modoSilencio() {
    video.muted = true; video.loop = true; video.controls = false;
    reel.classList.remove('is-playing');
  }

  modoSilencio();

  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { if (video.paused) intentar(); }
        else if (!video.paused) { video.pause(); }
      });
    }, { threshold: 0.35 });
    io.observe(reel);
  } else {
    intentar();
  }

  btn.addEventListener('click', function () {
    video.muted = false; video.loop = false; video.controls = true;
    try { video.currentTime = 0; } catch (e) {}
    reel.classList.add('is-playing');
    intentar();
  });

  video.addEventListener('ended', function () {
    modoSilencio();
    try { video.currentTime = 0; } catch (e) {}
    intentar();
  });
})();
