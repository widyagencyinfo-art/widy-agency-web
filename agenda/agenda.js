/* widy.agency/agenda v3 — ?s=conce|gestoria &n=<empresa> &c=<correo en base64url> (lo pone el correo) */
(function () {
  'use strict';
  var q = new URLSearchParams(location.search);
  var S = q.get('s') === 'gestoria' ? 'gestoria' : 'conce';
  var N = (q.get('n') || '').slice(0, 120);
  var C = (q.get('c') || '').slice(0, 400);
  var $ = function (id) { return document.getElementById(id); };
  var WA = 'https://wa.me/34624869847';

  var T = {
    conce: {
      t1: 'Ningún comprador', t2: 'se queda <em>sin respuesta</em>.', para: 'Para compraventas de coches',
      paso1: 'Cómo os llegan los compradores y quién les contesta.',
      video: '/agenda/media/conce.mp4', poster: '/agenda/media/conce.jpg', regalo: true, trabajos: true,
    },
    gestoria: {
      t1: 'Las preguntas de siempre,', t2: 'contestadas <em>solas</em>.', para: 'Para gestorías y asesorías',
      paso1: 'Cómo os llegan las consultas de los clientes y quién las contesta.',
      video: '/agenda/media/gestoria.mp4', poster: '/agenda/media/gestoria.jpg', regalo: false, trabajos: false,
    },
  }[S];
  // ?o=resumen → misma reserva que gestoría (s=gestoria), pero con la oferta del «resumen de las 8» (22-oct-2026)
  if (q.get('o') === 'resumen') {
    T = Object.assign({}, T, {
      t1: 'Cada mañana a las 8,', t2: 'lo <em>importante</em> del correo.',
      paso1: 'Cómo os llega el correo y quién lo revisa cada mañana.',
      video: '/agenda/media/resumen.mp4', poster: '/agenda/media/resumen.jpg',
      sub: 'Mira el vídeo (20 segundos) y elige hora. <strong>En una llamada de 10 minutos lo dejamos conectado</strong> y lo probáis gratis.',
      win: 'Demo · resumen de las 8',
    });
  }

  // ---- textos y vídeo ----
  $('titulo').innerHTML = '<span class="t1">' + T.t1 + '</span> <span class="t2">' + T.t2 + '</span>';
  $('para').textContent = N ? 'Para el equipo de ' + N : T.para;
  $('paso1').textContent = T.paso1;
  if (T.sub) $('sub').innerHTML = T.sub;
  if (T.win) $('win-t').textContent = T.win;
  if (!T.trabajos) $('trabajos').hidden = true;
  if (T.regalo) $('regalo').hidden = false;
  var v = $('video');
  v.poster = T.poster; $('video-src').src = T.video; v.load();
  var p = v.play(); if (p && p.catch) p.catch(function () {});
  $('replay').addEventListener('click', function () { v.currentTime = 0; v.play(); });

  if (N) $('cita-empresa').value = N;
  var correoEnlace = '';
  try {
    if (C) {
      correoEnlace = decodeURIComponent(escape(atob(C.replace(/-/g, '+').replace(/_/g, '/'))));
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(correoEnlace)) correoEnlace = '';
    }
  } catch (e) { correoEnlace = ''; }
  if (correoEnlace) { $('cita-email').value = correoEnlace; $('regalo-email').value = correoEnlace; }

  // ---- aparecer al bajar + botón fijo ----
  var revelas = document.querySelectorAll('.pasos li, .persona, .trab');
  var flot = $('flotante');
  var reservado = false;
  if ('IntersectionObserver' in window) {
    revelas.forEach(function (el) { el.classList.add('revela'); });
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('visto'); io.unobserve(e.target); } });
    }, { threshold: 0.12 });
    revelas.forEach(function (el) { io.observe(el); });

    var vistos = { cta: true, agenda: false };
    var pintarFlot = function () { flot.classList.toggle('fuera', reservado || vistos.cta || vistos.agenda); };
    var io2 = new IntersectionObserver(function (es) {
      es.forEach(function (e) { vistos[e.target.id === 'agenda' ? 'agenda' : 'cta'] = e.isIntersecting; });
      pintarFlot();
    }, { threshold: 0.05 });
    io2.observe(document.querySelector('.cta'));
    io2.observe($('agenda'));
    pintarFlot();
  } else {
    flot.classList.add('fuera');
  }

  function api(datos) {
    datos.s = S; datos.n = N; datos.c = C;
    return fetch('https://widy-api.widyagency-info.workers.dev/api/agenda', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(datos),
    }).then(function (r) { return r.json().catch(function () { return { ok: false }; }); });
  }

  // ---- visita (una vez por navegador y día) ----
  try {
    var k = 'widy-agenda-visita-' + C + '-' + new Date().toISOString().slice(0, 10);
    if (C && !localStorage.getItem(k)) { localStorage.setItem(k, '1'); api({ accion: 'visita' }); }
  } catch (e) { if (C) api({ accion: 'visita' }); }

  // ---- días y horas ----
  var libres = {};            // 'YYYY-MM-DD' → ['10:00', …]
  var orden = [];             // fechas que da el servidor, en orden
  var hoy = '';
  var MANANA = [], TARDE = [];
  var elegido = { fecha: null, hora: null };
  var D = function (f) { return new Date(f + 'T12:00:00Z'); };
  var ISO = function (d) { return d.toISOString().slice(0, 10); };
  var fmt = function (o) { return new Intl.DateTimeFormat('es-ES', Object.assign({ timeZone: 'UTC' }, o)); };
  var fLargo = fmt({ weekday: 'long', day: 'numeric', month: 'long' });
  var fDiaSem = fmt({ weekday: 'long', day: 'numeric' });
  var fMes = fmt({ month: 'short' });
  var mayus = function (s) { return s.charAt(0).toUpperCase() + s.slice(1); };
  var sumar = function (f, n) { var d = D(f); d.setUTCDate(d.getUTCDate() + n); return ISO(d); };

  function etiqueta(f) {
    if (f === hoy) return 'Hoy';
    if (f === sumar(hoy, 1)) return 'Mañana';
    return '';
  }

  function pintarDias() {
    var cont = $('dias'); cont.innerHTML = '';
    var hayLibre = orden.some(function (f) { return (libres[f] || []).length; });
    if (!hayLibre) {
      cont.innerHTML = '<p class="cargando">Ahora mismo no quedan huecos. Escribidnos al <a href="' + WA + '">WhatsApp 624 86 98 47</a>.</p>';
      return;
    }
    // desde el lunes de la semana de hoy hasta el último día que se ofrece
    var ini = D(hoy); ini.setUTCDate(ini.getUTCDate() - ((ini.getUTCDay() + 6) % 7));
    var fin = orden[orden.length - 1];
    for (var f = ISO(ini); f <= fin; f = sumar(f, 1)) {
      var dow = D(f).getUTCDay();
      if (dow === 0 || dow === 6) continue;
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'dia';
      var et = etiqueta(f);
      b.innerHTML = (et ? '<span class="etq">' + et + '</span>' : '') + '<b>' + Number(f.slice(8)) + '</b><small>' + fMes.format(D(f)).replace('.', '') + '</small>';
      if (f < hoy) { b.classList.add('pasado'); b.disabled = true; b.setAttribute('aria-hidden', 'true'); }
      else if ((libres[f] || []).length) {
        b.setAttribute('aria-pressed', String(elegido.fecha === f));
        b.setAttribute('aria-label', mayus(fLargo.format(D(f))) + ', ' + libres[f].length + ' huecos libres');
        b.addEventListener('click', (function (ff) { return function () { elegirDia(ff); }; })(f));
      } else {
        b.disabled = true;
        b.setAttribute('aria-label', mayus(fLargo.format(D(f))) + ', sin huecos');
      }
      cont.appendChild(b);
    }
  }

  function elegirDia(f) {
    elegido.fecha = f;
    if ((libres[f] || []).indexOf(elegido.hora) === -1) elegido.hora = null;
    pintarDias(); pintarHoras(); mostrarForm();
  }

  function grupo(nombre, horas) {
    var libresDia = libres[elegido.fecha] || [];
    var visibles = horas.filter(function (h) { return elegido.fecha !== hoy || libresDia.indexOf(h) !== -1; });
    if (!visibles.length) return null;
    var frag = document.createDocumentFragment();
    var t = document.createElement('p'); t.className = 'franja'; t.textContent = nombre; frag.appendChild(t);
    var g = document.createElement('div'); g.className = 'horas-g';
    visibles.forEach(function (h) {
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'hora'; b.textContent = h;
      b.setAttribute('aria-pressed', String(elegido.hora === h));
      b.disabled = libresDia.indexOf(h) === -1;
      if (b.disabled) b.setAttribute('aria-label', h + ', ocupado');
      b.addEventListener('click', function () { elegido.hora = h; pintarHoras(); mostrarForm(true); });
      g.appendChild(b);
    });
    frag.appendChild(g);
    return frag;
  }

  function pintarHoras() {
    var paso = $('paso-hora'), cont = $('horas');
    cont.innerHTML = '';
    paso.hidden = !elegido.fecha;
    if (!elegido.fecha) return;
    $('paso-dia-txt').textContent = '· ' + fDiaSem.format(D(elegido.fecha));
    [grupo('Por la mañana', MANANA), grupo('Por la tarde', TARDE)].forEach(function (x) { if (x) cont.appendChild(x); });
  }

  function cuandoTxt() { return mayus(fLargo.format(D(elegido.fecha))) + ' a las ' + elegido.hora; }

  function mostrarForm(bajar) {
    var f = $('form-cita');
    if (!elegido.fecha || !elegido.hora) { f.hidden = true; return; }
    f.hidden = false;
    $('elegido-txt').textContent = cuandoTxt();
    $('btn-reservar').textContent = 'Reservar · ' + fDiaSem.format(D(elegido.fecha)) + ', ' + elegido.hora;
    if (bajar) setTimeout(function () { f.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 60);
  }
  $('cambiar').addEventListener('click', function () {
    elegido.hora = null; pintarHoras(); mostrarForm();
    $('paso-dia').scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  function cargarHuecos() {
    fetch('https://widy-api.widyagency-info.workers.dev/api/agenda', { cache: 'no-store' }).then(function (r) { return r.json(); }).then(function (r) {
      if (!r || !r.ok) throw new Error('api');
      libres = {}; orden = [];
      hoy = r.hoy || ISO(new Date());
      MANANA = r.manana || []; TARDE = r.tarde || [];
      (r.dias || []).forEach(function (x) { libres[x.fecha] = x.horas; orden.push(x.fecha); });
      if (!elegido.fecha || !(libres[elegido.fecha] || []).length) {
        elegido.fecha = null;
        for (var i = 0; i < orden.length; i++) if (libres[orden[i]].length) { elegido.fecha = orden[i]; break; }
      }
      if (elegido.hora && (libres[elegido.fecha] || []).indexOf(elegido.hora) === -1) elegido.hora = null;
      pintarDias(); pintarHoras(); mostrarForm();
    }).catch(function () {
      $('dias').innerHTML = '<p class="cargando">No se han podido cargar los huecos. Escribidnos al <a href="' + WA + '">WhatsApp 624 86 98 47</a>.</p>';
    });
  }
  cargarHuecos();

  // ---- archivo de calendario (.ics) ----
  function ics(fecha, hora, tel) {
    var a = fecha.replace(/-/g, ''), h = hora.replace(':', '');
    var finMin = Number(hora.slice(0, 2)) * 60 + Number(hora.slice(3)) + 15;
    var hf = String(Math.floor(finMin / 60)).padStart(2, '0') + String(finMin % 60).padStart(2, '0');
    var txt = [
      'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Widy//Agenda//ES', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      'UID:' + a + h + '-' + Date.now() + '@widy.agency',
      'DTSTAMP:' + new Date().toISOString().replace(/[-:]/g, '').slice(0, 15) + 'Z',
      'DTSTART;TZID=Europe/Madrid:' + a + 'T' + h + '00',
      'DTEND;TZID=Europe/Madrid:' + a + 'T' + hf + '00',
      'SUMMARY:Llamada con Widy (10 min)',
      'DESCRIPTION:Os llama Darío\\, de Widy\\, al ' + tel + '. Si os surge algo: WhatsApp 624 86 98 47.',
      'BEGIN:VALARM', 'TRIGGER:-PT15M', 'ACTION:DISPLAY', 'DESCRIPTION:Llamada con Widy', 'END:VALARM',
      'END:VEVENT', 'END:VCALENDAR',
    ].join('\r\n');
    return URL.createObjectURL(new Blob([txt], { type: 'text/calendar;charset=utf-8' }));
  }

  // ---- reservar ----
  var fc = $('form-cita');
  fc.addEventListener('submit', function (ev) {
    ev.preventDefault();
    var aviso = fc.querySelector('.aviso'), btn = $('btn-reservar');
    aviso.textContent = '';
    if (!fc.nombre.value.trim()) { aviso.textContent = 'Dinos tu nombre.'; fc.nombre.focus(); return; }
    if (fc.telefono.value.replace(/\D/g, '').length < 9) { aviso.textContent = 'Pon un teléfono para llamarte.'; fc.telefono.focus(); return; }
    if (!fc.acepto.checked) { aviso.textContent = 'Marca la casilla de privacidad.'; return; }
    var txtBtn = btn.textContent;
    btn.disabled = true; btn.textContent = 'Reservando…';
    api({
      accion: 'reservar', nombre: fc.nombre.value, empresa: fc.empresa.value, telefono: fc.telefono.value,
      email: fc.email.value, fecha: elegido.fecha, hora: elegido.hora, acepto: true,
      newsletter: fc.newsletter.checked, web: fc.web.value,
    }).then(function (r) {
      btn.disabled = false; btn.textContent = txtBtn;
      if (!r.ok) {
        aviso.textContent = r.error || 'No se ha podido reservar. Prueba otra vez.';
        if (/ocupado/.test(r.error || '')) { elegido.hora = null; cargarHuecos(); }
        return;
      }
      reservado = true; flot.classList.add('fuera');
      ['paso-dia', 'paso-hora', 'form-cita'].forEach(function (id) { $(id).hidden = true; });
      $('cita-ok').hidden = false;
      $('cita-ok-cuando').textContent = cuandoTxt();
      $('cita-ok-texto').textContent = 'Os llamamos al ' + fc.telefono.value.trim() + '. El día antes os escribimos para confirmar.';
      try { $('ics').href = ics(elegido.fecha, elegido.hora, fc.telefono.value.trim()); } catch (e) { $('ics').hidden = true; }
      $('book').scrollIntoView({ behavior: 'smooth', block: 'center' });
    }).catch(function () {
      btn.disabled = false; btn.textContent = txtBtn;
      aviso.textContent = 'Sin conexión. Prueba otra vez o escríbenos al WhatsApp 624 86 98 47.';
    });
  });

  // ---- regalo ----
  var fr = $('form-regalo');
  fr.addEventListener('submit', function (ev) {
    ev.preventDefault();
    var aviso = fr.querySelector('.aviso'), btn = fr.querySelector('button');
    aviso.textContent = '';
    if (!fr.acepto.checked) { aviso.textContent = 'Marca la casilla de privacidad para recibir la guía.'; return; }
    btn.disabled = true;
    api({ accion: 'regalo', email: fr.email.value, acepto: true, web: fr.web.value }).then(function (r) {
      btn.disabled = false;
      if (!r.ok) { aviso.textContent = r.error || 'No se ha podido. Prueba otra vez.'; return; }
      fr.hidden = true;
      document.querySelector('.regalo-ok').hidden = false;
      if (r.regalo) { $('regalo-link').href = r.regalo; window.open(r.regalo, '_blank', 'noopener'); }
    });
  });
})();
