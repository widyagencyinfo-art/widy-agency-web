/* ===================================================
   Widy · Portada
   · Botón para parar el carrusel de trabajos
   · Archivo de trabajos con filtros
   · Comparador antes / después de las fotos con IA
   · Demo de WhatsApp con IA (peluquería, concesionario, tienda)
   =================================================== */
(function () {
  'use strict';

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- 1) Carrusel de trabajos ---------- */
  var reel = document.getElementById('reel');
  var reelBtn = document.getElementById('reelToggle');
  if (reel && reelBtn) {
    reelBtn.addEventListener('click', function () {
      var parado = reel.classList.toggle('is-paused');
      reelBtn.setAttribute('aria-pressed', parado ? 'true' : 'false');
      reelBtn.querySelector('span').textContent = parado ? 'Reanudar' : 'Pausar';
    });
  }

  /* ---------- 2) Archivo con filtros ---------- */
  var grid = document.getElementById('arcGrid');
  var more = document.getElementById('arcMore');
  var live = document.getElementById('arcLive');
  if (grid) {
    var items = Array.prototype.slice.call(grid.querySelectorAll('.arc-item'));
    var botones = Array.prototype.slice.call(document.querySelectorAll('.arc-filter'));
    var VISIBLES = parseInt(grid.getAttribute('data-visibles') || '9', 10);
    var filtro = 'todos';
    var todos = false;

    var pintar = function (animar) {
      var n = 0;
      items.forEach(function (li, i) {
        var ver = filtro === 'todos' ? (todos || i < VISIBLES) : li.getAttribute('data-g') === filtro;
        var estaba = !li.hidden;
        li.hidden = !ver;
        li.classList.remove('is-in');
        if (ver) {
          n++;
          if (animar && !reduce && !estaba) { void li.offsetWidth; li.classList.add('is-in'); }
        }
      });
      if (more) { more.hidden = filtro !== 'todos' || todos; }
      return n;
    };

    botones.forEach(function (b) {
      b.addEventListener('click', function () {
        filtro = b.getAttribute('data-f');
        botones.forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
        var n = pintar(true);
        if (live) { live.textContent = n + (n === 1 ? ' trabajo' : ' trabajos') + ' a la vista.'; }
      });
    });
    if (more) {
      more.addEventListener('click', function () {
        todos = true;
        pintar(true);
        var primero = items[VISIBLES] && items[VISIBLES].querySelector('a');
        if (primero) { primero.focus({ preventScroll: true }); }
        if (live) { live.textContent = 'Todos los trabajos a la vista.'; }
      });
    }
    pintar(false);
  }

  /* ---------- 3) Antes / después ---------- */
  var ba = document.getElementById('ba');
  var range = document.getElementById('baRange');
  if (ba && range) {
    var KNOB = 54;
    var colocar = function () {
      var w = ba.clientWidth;
      var v = Number(range.value) / 100;
      // El centro de la raya coincide con el del «pulgar» nativo del deslizador
      ba.style.setProperty('--pos', (KNOB / 2 + v * (w - KNOB)).toFixed(1) + 'px');
    };
    var desdePuntero = function (clientX) {
      var r = ba.getBoundingClientRect();
      var v = (clientX - r.left - KNOB / 2) / (r.width - KNOB);
      range.value = Math.round(Math.max(0, Math.min(1, v)) * 100);
      colocar();
    };
    range.addEventListener('input', colocar);
    window.addEventListener('resize', colocar);
    // Ratón: salta al punto y arrastra. Dedo: solo arrastra si el gesto es horizontal (si no, deja hacer scroll).
    var arrastrando = false;
    var toque = null;
    ba.addEventListener('pointerdown', function (e) {
      if (e.pointerType === 'mouse') {
        if (e.button !== 0) { return; }
        arrastrando = true;
        desdePuntero(e.clientX);
      } else {
        toque = { x: e.clientX, y: e.clientY };
      }
    });
    window.addEventListener('pointermove', function (e) {
      if (toque && !arrastrando) {
        var dx = Math.abs(e.clientX - toque.x);
        var dy = Math.abs(e.clientY - toque.y);
        if (dx > 6 && dx > dy) { arrastrando = true; } else if (dy > 10) { toque = null; }
      }
      if (arrastrando) { desdePuntero(e.clientX); }
    });
    var soltar = function () { arrastrando = false; toque = null; };
    window.addEventListener('pointerup', soltar);
    window.addEventListener('pointercancel', soltar);
    colocar();

    // Una pista suave la primera vez que se ve, para que se entienda que se puede mover
    if (!reduce && 'IntersectionObserver' in window) {
      var pista = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (!en.isIntersecting) { return; }
          pista.disconnect();
          var pasos = [50, 30, 70, 50];
          var i = 0;
          var t0 = null;
          var DUR = 650;
          var paso = function (t) {
            if (arrastrando) { return; }
            if (t0 === null) { t0 = t; }
            var k = Math.min(1, (t - t0) / DUR);
            var ease = 1 - Math.pow(1 - k, 3);
            range.value = pasos[i] + (pasos[i + 1] - pasos[i]) * ease;
            colocar();
            if (k === 1) { i++; t0 = null; }
            if (i < pasos.length - 1) { requestAnimationFrame(paso); }
          };
          setTimeout(function () { requestAnimationFrame(paso); }, 500);
        });
      }, { threshold: 0.6 });
      pista.observe(ba);
    }
  }

  /* ---------- 4) Demo de WhatsApp con IA ---------- */
  var chatBody = document.getElementById('chatBody');
  var chatQuick = document.getElementById('chatQuick');
  var chatDemo = document.getElementById('chatDemo');
  if (!chatBody || !chatQuick || !chatDemo) { return; }

  var FLUJOS = {
    peluqueria: {
      nombre: 'Tu peluquería', inicial: 'P',
      pasos: {
        start: { bot: '¡Hola! Soy el asistente de la peluquería. ¿Te busco hueco?', opts: [
          { t: 'Quiero cita para cortarme el pelo', next: 'corte' },
          { t: '¿Cuánto cuesta un tinte?', next: 'tinte' },
          { t: '¿Abrís el sábado?', next: 'sabado' }] },
        corte: { bot: 'Claro. Mañana tengo hueco a las 11:00 y a las 17:30. ¿Cuál te viene mejor?', opts: [
          { t: 'A las 11:00', next: 'hecho' }, { t: 'A las 17:30', next: 'hecho' }] },
        tinte: { bot: 'El tinte va según el largo del pelo; te lo cierran en el salón antes de empezar. ¿Te reservo y lo veis allí?', opts: [
          { t: 'Sí, resérvame', next: 'corte' }] },
        sabado: { bot: 'Sí, el sábado por la mañana. Me quedan las 10:00 y las 12:30. ¿Te guardo una?', opts: [
          { t: 'Las 10:00', next: 'hecho' }, { t: 'Las 12:30', next: 'hecho' }] },
        hecho: { bot: 'Hecho: tu cita está reservada. Te mando un recordatorio el día antes.',
          nota: 'La cita queda apuntada en la agenda de la peluquería, sin que nadie haya cogido el móvil.' }
      }
    },
    concesionario: {
      nombre: 'Tu concesionario', inicial: 'C',
      pasos: {
        start: { bot: '¡Hola! Soy el asistente del concesionario. ¿En qué te ayudo?', opts: [
          { t: '¿Sigue disponible el coche del anuncio?', next: 'disp' },
          { t: '¿Cuánto me dais por el mío?', next: 'tasa' },
          { t: 'Quiero probarlo', next: 'prueba' }] },
        disp: { bot: 'Sí, sigue disponible. ¿Quieres verlo en persona y hacer una prueba sin compromiso?', opts: [
          { t: 'Sí, quiero probarlo', next: 'prueba' }, { t: 'Mándame más fotos', next: 'fotos' }] },
        fotos: { bot: 'Ahora mismo te las pasa el comercial por aquí. Mientras, ¿te reservo una prueba?', opts: [
          { t: 'Vale, resérvala', next: 'prueba' }] },
        tasa: { bot: 'Dime marca, modelo, año y kilómetros, y el tasador te da una cifra orientativa. Si te encaja, lo vemos el día de la prueba.', opts: [
          { t: 'Perfecto, reservo la prueba', next: 'prueba' }] },
        prueba: { bot: 'Genial. Tengo hueco mañana a las 18:00 o el jueves a las 11:00. ¿Cuál te va mejor?', opts: [
          { t: 'Mañana a las 18:00', next: 'hecho' }, { t: 'El jueves a las 11:00', next: 'hecho' }] },
        hecho: { bot: 'Reservado. Te mando la ubicación y un recordatorio el día antes.',
          nota: 'El comercial recibe la prueba con los datos del cliente. El lead no se ha enfriado.' }
      }
    },
    tienda: {
      nombre: 'Tu tienda de ropa', inicial: 'T',
      pasos: {
        start: { bot: '¡Hola! ¿Buscas algo en concreto?', opts: [
          { t: '¿Tenéis el vestido de rayas en la M?', next: 'talla' },
          { t: '¿Cuánto tarda el envío?', next: 'envio' },
          { t: '¿Puedo devolverlo si no me queda bien?', next: 'devol' }] },
        talla: { bot: 'Sí, queda en la M. ¿Te paso el enlace para comprarlo o prefieres que te lo guardemos en la tienda?', opts: [
          { t: 'Pásame el enlace', next: 'hecho' }, { t: 'Guárdamelo', next: 'guardar' }] },
        envio: { bot: 'Te llega en 24-48 h laborables. ¿Te ayudo a encontrar tu talla?', opts: [
          { t: 'Busco el vestido de rayas en la M', next: 'talla' }] },
        devol: { bot: 'Sí, tienes 14 días para devolverlo. ¿Qué prenda te gusta?', opts: [
          { t: 'El vestido de rayas, en la M', next: 'talla' }] },
        guardar: { bot: 'Guardado a tu nombre hasta mañana por la tarde. ¡Te esperamos!',
          nota: 'La venta no se ha perdido a las once de la noche.' },
        hecho: { bot: 'Aquí lo tienes: el enlace te lleva directo a tu talla. Pagas con tarjeta o Bizum.',
          nota: 'La venta no se ha perdido a las once de la noche.' }
      }
    }
  };

  var chatName = document.getElementById('chatName');
  var chatAv = document.getElementById('chatAv');
  var flujo = FLUJOS.peluqueria;
  var sesion = 0;           // si se cambia de negocio a mitad, los mensajes pendientes se descartan
  var ocupado = false;
  var RETRASO = reduce ? 250 : 950;

  // El reloj del chat va por la noche, como cuenta el texto: empieza a las 23:47 y avanza un minuto por respuesta
  var minuto = 0;
  var hora = function () {
    var m = 47 + minuto;
    return (m >= 60 ? '00:' + String(m - 60).padStart(2, '0') : '23:' + String(m).padStart(2, '0'));
  };
  var bajar = function () { chatBody.scrollTop = chatBody.scrollHeight; };
  var mensaje = function (texto, quien) {
    var m = document.createElement('div');
    m.className = 'msg ' + quien;
    m.appendChild(document.createTextNode(texto));
    var s = document.createElement('small');
    s.textContent = hora() + (quien === 'me' ? ' ✓✓' : '');
    s.setAttribute('aria-hidden', 'true');
    m.appendChild(s);
    chatBody.appendChild(m);
    bajar();
  };
  var escribiendo = function () {
    var t = document.createElement('div');
    t.className = 'typing';
    t.setAttribute('aria-label', 'Escribiendo');
    t.innerHTML = '<i></i><i></i><i></i>';
    chatBody.appendChild(t);
    bajar();
    return t;
  };
  var opciones = function (lista) {
    chatQuick.innerHTML = '';
    lista.forEach(function (o) {
      var c = document.createElement('button');
      c.type = 'button';
      c.className = 'chip';
      c.textContent = o.t;
      c.addEventListener('click', function () { elegir(o); });
      chatQuick.appendChild(c);
    });
  };
  var ir = function (clave) {
    var p = flujo.pasos[clave];
    mensaje(p.bot, 'bot');
    if (p.nota) {
      var n = document.createElement('div');
      n.className = 'chat-note';
      n.textContent = p.nota;
      chatBody.appendChild(n);
      bajar();
      opciones([{ t: 'Volver a empezar', reiniciar: true }]);
    } else {
      opciones(p.opts);
    }
  };
  var arrancar = function () {
    var yo = ++sesion;
    ocupado = false;
    minuto = 0;
    chatBody.innerHTML = '';
    chatQuick.innerHTML = '';
    var t = escribiendo();
    setTimeout(function () { if (yo !== sesion) { return; } t.remove(); ir('start'); }, RETRASO * 0.8);
  };
  var elegir = function (o) {
    if (ocupado) { return; }
    if (o.reiniciar) { arrancar(); return; }
    ocupado = true;
    var yo = sesion;
    chatQuick.innerHTML = '';
    minuto++;
    mensaje(o.t, 'me');
    var t = escribiendo();
    setTimeout(function () {
      if (yo !== sesion) { return; }
      t.remove();
      ocupado = false;
      ir(o.next);
    }, RETRASO + (reduce ? 0 : Math.random() * 400));
  };

  Array.prototype.forEach.call(document.querySelectorAll('.demo-switch button'), function (b, _, todosB) {
    b.addEventListener('click', function () {
      var clave = b.getAttribute('data-flow');
      if (!FLUJOS[clave]) { return; }
      Array.prototype.forEach.call(document.querySelectorAll('.demo-switch button'), function (x) {
        x.setAttribute('aria-pressed', x === b ? 'true' : 'false');
      });
      flujo = FLUJOS[clave];
      chatName.textContent = flujo.nombre;
      chatAv.textContent = flujo.inicial;
      arrancar();
    });
  });

  var empezado = false;
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting && !empezado) { empezado = true; arrancar(); io.disconnect(); }
      });
    }, { threshold: 0.35 });
    io.observe(chatDemo);
  } else {
    arrancar();
  }
})();

/* Carrusel de trabajos (#trabajos): flechas, contador y teclado. Sin movimiento automático. */
(function () {
  var track = document.getElementById('wkTrack');
  if (!track) return;
  var root = track.closest('[data-carrusel]');
  var prev = root.querySelector('.wk-arrow[data-dir="-1"]');
  var next = root.querySelector('.wk-arrow[data-dir="1"]');
  var now = document.getElementById('wkNow');
  var slides = track.querySelectorAll('.wk-slide');
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function paso() { var s = slides[0]; return s ? s.getBoundingClientRect().width + parseFloat(getComputedStyle(track).columnGap || getComputedStyle(track).gap || 0) : track.clientWidth; }
  function mover(dir) { track.scrollBy({ left: dir * paso(), behavior: reduce ? 'auto' : 'smooth' }); }
  function estado() {
    var max = track.scrollWidth - track.clientWidth - 2;
    prev.disabled = track.scrollLeft <= 2;
    next.disabled = track.scrollLeft >= max;
    var i = Math.round(track.scrollLeft / paso());
    if (track.scrollLeft >= max) i = slides.length - 1;
    if (now) now.textContent = Math.min(slides.length, i + 1);
  }
  prev.addEventListener('click', function () { mover(-1); });
  next.addEventListener('click', function () { mover(1); });
  track.addEventListener('keydown', function (e) {
    if (e.target !== track) return;
    if (e.key === 'ArrowRight') { e.preventDefault(); mover(1); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); mover(-1); }
  });
  var t; track.addEventListener('scroll', function () { clearTimeout(t); t = setTimeout(estado, 60); }, { passive: true });
  window.addEventListener('resize', estado);
  estado();
})();

/* Portada visual (25-sept-2026): escaparate del hero, pestañas «¿Qué necesita tu negocio?» y cifras que cuentan */
(function () {
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* --- Escaparate: al tocar un sector cambian el portátil y el móvil. Pasa solo cada 4,5 s hasta que tocas algo --- */
  var show = document.getElementById('show');
  if (show) {
    var tabs = Array.prototype.slice.call(show.querySelectorAll('.show-tab'));
    var laps = show.querySelectorAll('.show-laptop .sw-img');
    var movs = show.querySelectorAll('.show-phone .sw-img');
    var host = show.querySelector('.show-host');
    var nombre = show.querySelector('.show-name');
    var tag = show.querySelector('.show-tag');
    var link = show.querySelector('.show-link');
    var actual = 0, timer = null, parado = reduce, visible = true;
    var poner = function (i) {
      actual = i;
      tabs.forEach(function (t, k) { t.setAttribute('aria-selected', k === i ? 'true' : 'false'); t.tabIndex = k === i ? 0 : -1; });
      [laps, movs].forEach(function (lista) { Array.prototype.forEach.call(lista, function (im, k) { im.classList.toggle('on', k === i); }); });
      var t = tabs[i];
      host.textContent = t.dataset.host; nombre.textContent = t.dataset.nombre; tag.textContent = t.dataset.tag; link.href = t.dataset.url;
    };
    var siguiente = function () { if (!parado && visible && !document.hidden) { poner((actual + 1) % tabs.length); } };
    var parar = function () { parado = true; clearInterval(timer); };
    tabs.forEach(function (t, k) {
      t.addEventListener('click', function () { parar(); poner(k); });
      t.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
          e.preventDefault(); parar();
          var n = (k + (e.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length; poner(n); tabs[n].focus();
        }
      });
    });
    show.addEventListener('mouseenter', function () { clearInterval(timer); });
    show.addEventListener('mouseleave', function () { if (!parado) { clearInterval(timer); timer = setInterval(siguiente, 4500); } });
    show.addEventListener('focusin', parar);
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) { visible = es[0].isIntersecting; }, { threshold: 0.2 }).observe(show);
    }
    if (!parado) { timer = setInterval(siguiente, 4500); }
  }

  /* --- ¿Qué necesita tu negocio?: pestañas accesibles (flechas, Inicio, Fin). Los paneles ya están en el HTML --- */
  var ntabs = Array.prototype.slice.call(document.querySelectorAll('.need-tab'));
  if (ntabs.length) {
    var abrir = function (t, foco) {
      ntabs.forEach(function (x) {
        var on = x === t;
        x.setAttribute('aria-selected', on ? 'true' : 'false'); x.tabIndex = on ? 0 : -1;
        document.getElementById(x.getAttribute('aria-controls')).hidden = !on;
      });
      if (foco) { t.focus(); }
      window.dispatchEvent(new Event('resize'));   // el comparador antes/después mide su ancho al verse
    };
    ntabs.forEach(function (t, k) {
      t.addEventListener('click', function () { abrir(t, false); });
      t.addEventListener('keydown', function (e) {
        var n = null;
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { n = (k + 1) % ntabs.length; }
        if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { n = (k + ntabs.length - 1) % ntabs.length; }
        if (e.key === 'Home') { n = 0; }
        if (e.key === 'End') { n = ntabs.length - 1; }
        if (n !== null) { e.preventDefault(); abrir(ntabs[n], true); }
      });
    });
  }

  /* --- Cifras que cuentan al aparecer (el HTML ya trae el número final) --- */
  var cifras = document.querySelectorAll('[data-count]');
  if (cifras.length && !reduce && 'IntersectionObserver' in window) {
    var contar = function (el) {
      var txt = el.getAttribute('data-count'); var m = txt.match(/^(\d+)(.*)$/); if (!m) { return; }
      var fin = parseInt(m[1], 10), resto = m[2], t0 = null, DUR = 1100;
      var paso = function (t) {
        if (t0 === null) { t0 = t; }
        var k = Math.min(1, (t - t0) / DUR), v = Math.round(fin * (1 - Math.pow(1 - k, 3)));
        el.textContent = v + resto;
        if (k < 1) { requestAnimationFrame(paso); }
      };
      requestAnimationFrame(paso);
    };
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (en) { if (en.isIntersecting) { contar(en.target); io.unobserve(en.target); } });
    }, { threshold: 0.6 });
    Array.prototype.forEach.call(cifras, function (el) { io.observe(el); });
  }
})();

/* ---------- Estilo pro (15-oct-2026): cabecera transparente sobre el azul noche y línea de progreso ---------- */
(function () {
  var hdr = document.querySelector('.hdr');
  if (!hdr) return;
  var portada = document.body.classList.contains('portada');
  var barra = document.createElement('span');
  barra.className = 'hdr-progress';
  barra.setAttribute('aria-hidden', 'true');
  hdr.appendChild(barra);
  var pend = false;
  function pinta() {
    pend = false;
    var y = window.scrollY || 0, alto = document.documentElement.scrollHeight - window.innerHeight;
    barra.style.setProperty('--p', alto > 0 ? Math.min(1, y / alto).toFixed(4) : 0);
    if (portada) hdr.classList.toggle('is-scrolled', y > 24);
  }
  window.addEventListener('scroll', function () { if (!pend) { pend = true; requestAnimationFrame(pinta); } }, { passive: true });
  pinta();
})();
