/* ===================================================
   Widy · Inmobiliarias — interacciones
   =================================================== */
(function () {
  'use strict';

  var WA_NUMBER = '34624869847';
  var prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Año dinámico ---------- */
  var yearEl = document.getElementById('year');
  if (yearEl) { yearEl.textContent = new Date().getFullYear(); }

  /* ---------- Enlaces de WhatsApp ---------- */
  var waBase = 'https://wa.me/' + WA_NUMBER +
    '?text=' + encodeURIComponent('Hola Widy, te escribo desde widy.agency/inmobiliaria. Tengo una inmobiliaria y quiero información sobre el sistema de captación.');
  ['waLink', 'waLinkFoot', 'waFab'].forEach(function (id) {
    var el = document.getElementById(id);
    if (el) { el.href = waBase; el.target = '_blank'; el.rel = 'noopener'; }
  });

  /* ---------- Menú móvil ---------- */
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

  /* ---------- Aparición al hacer scroll ---------- */
  var reveals = document.querySelectorAll('.reveal');
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

  /* ---------- Barra de progreso de lectura ---------- */
  var bar = document.querySelector('#progress > span');
  if (bar) {
    var ticking = false;
    var updateBar = function () {
      var h = document.documentElement;
      var max = h.scrollHeight - h.clientHeight;
      var pct = max > 0 ? (h.scrollTop / max) * 100 : 0;
      bar.style.width = pct.toFixed(2) + '%';
      ticking = false;
    };
    window.addEventListener('scroll', function () {
      if (!ticking) { ticking = true; window.requestAnimationFrame(updateBar); }
    }, { passive: true });
    updateBar();
  }

  /* ---------- Sección activa en el menú ---------- */
  var navLinks = Array.prototype.slice.call(document.querySelectorAll('.nav a[href^="#"]'));
  var sections = navLinks.map(function (a) {
    return document.querySelector(a.getAttribute('href'));
  });
  if ('IntersectionObserver' in window && sections.filter(Boolean).length) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) { return; }
        navLinks.forEach(function (a, i) {
          a.classList.toggle('is-active', sections[i] === entry.target);
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    sections.forEach(function (s) { if (s) { spy.observe(s); } });
  }

  /* ---------- Conversación del hero ---------- */
  var chat = document.getElementById('chat');
  var phone = document.getElementById('phone');
  var status = document.getElementById('phoneStatus');

  var GUION = [
    { t: 'in',  txt: 'Hola, he visto el piso de Nervión. ¿Sigue disponible?', hora: '22:40', wait: 900 },
    { t: 'typing', wait: 900 },
    { t: 'out', txt: '¡Hola! Sí, sigue disponible 👋 ¿Sería para comprar o para alquilar?', hora: '22:40', wait: 1500 },
    { t: 'in',  txt: 'Para comprar. Tengo hasta 180.000', hora: '22:41', wait: 800 },
    { t: 'typing', wait: 800 },
    { t: 'out', txt: 'Perfecto, entra de sobra. ¿Te viene bien verlo el martes a las 18:00?', hora: '22:41', wait: 1500 },
    { t: 'in',  txt: 'Sí, me viene bien', hora: '22:42', wait: 900 },
    { t: 'chip', txt: 'Visita agendada · Lead ya en tu base', wait: 3600 }
  ];

  function burbuja(paso) {
    var el = document.createElement('div');
    if (paso.t === 'typing') {
      el.className = 'i-typing';
      el.innerHTML = '<i></i><i></i><i></i>';
      return el;
    }
    if (paso.t === 'chip') {
      el.className = 'i-chip';
      el.textContent = '✓ ' + paso.txt;
      return el;
    }
    el.className = 'i-msg i-msg--' + paso.t;
    el.textContent = paso.txt;
    if (paso.hora) {
      var hora = document.createElement('small');
      hora.textContent = paso.hora;
      el.appendChild(hora);
    }
    return el;
  }

  if (chat) {
    if (prefersReduced) {
      GUION.forEach(function (paso) {
        if (paso.t !== 'typing') { chat.appendChild(burbuja(paso)); }
      });
    } else {
      var i = 0;
      var timer = null;
      var corriendo = false;

      function paso() {
        if (i >= GUION.length) {
          timer = setTimeout(function () {
            chat.innerHTML = '';
            i = 0;
            paso();
          }, 4200);
          return;
        }
        var actual = GUION[i];
        var anterior = chat.lastElementChild;
        if (anterior && anterior.classList.contains('i-typing')) { anterior.remove(); }

        chat.appendChild(burbuja(actual));
        if (status) {
          status.textContent = actual.t === 'typing' ? 'escribiendo…' : 'responde en segundos';
        }
        i++;
        timer = setTimeout(paso, actual.wait);
      }

      function arrancar() {
        if (corriendo) { return; }
        corriendo = true;
        paso();
      }
      function parar() {
        corriendo = false;
        if (timer) { clearTimeout(timer); timer = null; }
      }

      if ('IntersectionObserver' in window && phone) {
        var vista = new IntersectionObserver(function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) { arrancar(); } else { parar(); }
          });
        }, { threshold: 0.25 });
        vista.observe(phone);
      } else {
        arrancar();
      }
    }
  }

  /* ---------- Formulario → WhatsApp ---------- */
  var form = document.getElementById('leadForm');
  if (form) {
    var msg = document.getElementById('lf-msg');
    var button = form.querySelector('button[type="submit"]');

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      var nombre  = val('lf-nombre');
      var negocio = val('lf-negocio');
      var zona    = val('lf-zona');
      var tel     = val('lf-tel');

      if (!nombre || !negocio || !tel) {
        setMsg('Rellena tu nombre, tu inmobiliaria y tu teléfono para continuar.', 'error');
        return;
      }

      var texto =
        'Hola Widy 👋 Quiero ver el sistema para inmobiliarias con un piso mío.\n\n' +
        '• Nombre: ' + nombre + '\n' +
        '• Inmobiliaria: ' + negocio + '\n' +
        (zona ? '• Zona: ' + zona + '\n' : '') +
        '• Teléfono: ' + tel;

      var url = 'https://wa.me/' + WA_NUMBER + '?text=' + encodeURIComponent(texto);

      button.disabled = true;
      button.textContent = 'Abriendo WhatsApp…';
      setMsg('Te llevamos a WhatsApp con tus datos listos. Solo dale a enviar 👇', 'ok');

      window.open(url, '_blank', 'noopener');

      setTimeout(function () {
        button.disabled = false;
        button.textContent = 'Quiero verlo con un piso mío';
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
