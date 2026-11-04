/* Es Mal Pas — landing */
(function () {
  'use strict';

  // loader
  window.addEventListener('load', function () {
    setTimeout(function () {
      var l = document.getElementById('loader');
      if (l) l.classList.add('is-out');
    }, 900);
  });

  // nav sticky
  var nav = document.getElementById('nav');
  function onScroll() {
    nav.classList.toggle('is-stuck', window.scrollY > 60);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // burger + drawer
  var burger = document.getElementById('burger');
  var drawer = document.getElementById('drawer');
  burger.addEventListener('click', function () {
    var open = drawer.classList.toggle('is-open');
    burger.classList.toggle('is-open', open);
    document.body.style.overflow = open ? 'hidden' : '';
  });
  drawer.querySelectorAll('a').forEach(function (a) {
    a.addEventListener('click', function () {
      drawer.classList.remove('is-open');
      burger.classList.remove('is-open');
      document.body.style.overflow = '';
    });
  });

  // reveal on scroll
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) {
        e.target.classList.add('is-in');
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });

  document.querySelectorAll('.reveal').forEach(function (el, i) {
    el.style.transitionDelay = (i % 4) * 90 + 'ms';
    io.observe(el);
  });

  // lightbox galería
  var lb = document.createElement('div');
  lb.className = 'lb';
  lb.innerHTML = '<img alt="">';
  document.body.appendChild(lb);
  var lbImg = lb.querySelector('img');

  document.querySelectorAll('.mosaic figure img').forEach(function (img) {
    img.addEventListener('click', function () {
      lbImg.src = img.src;
      lbImg.alt = img.alt;
      lb.classList.add('is-open');
      document.body.style.overflow = 'hidden';
    });
  });
  function closeLb() {
    lb.classList.remove('is-open');
    document.body.style.overflow = '';
  }
  lb.addEventListener('click', closeLb);
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeLb();
  });

  // fecha mínima = hoy
  var fecha = document.querySelector('input[name="fecha"]');
  if (fecha) {
    var hoy = new Date();
    var iso = hoy.getFullYear() + '-' +
      String(hoy.getMonth() + 1).padStart(2, '0') + '-' +
      String(hoy.getDate()).padStart(2, '0');
    fecha.min = iso;
    fecha.value = iso;
  }

  // formulario -> WhatsApp
  var form = document.getElementById('form');
  var note = document.getElementById('formNote');
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var d = new FormData(form);
    var txt =
      'Hola, quiero reservar en Es Mal Pas.\n\n' +
      'Nombre: ' + d.get('nombre') + '\n' +
      'Teléfono: ' + d.get('tel') + '\n' +
      'Fecha: ' + d.get('fecha') + '\n' +
      'Hora: ' + d.get('hora') + '\n' +
      'Personas: ' + d.get('pax') +
      (d.get('nota') ? '\nComentario: ' + d.get('nota') : '');

    window.open('https://wa.me/34971321670?text=' + encodeURIComponent(txt), '_blank');
    note.textContent = '¡Listo! Te hemos abierto WhatsApp para confirmar la reserva.';
    note.classList.add('is-ok');
  });
})();
