/* Widy · estado compartido entre la web del cliente y el panel del dueño.
   Todo vive en el servidor (api/): esta capa lo carga, calcula los huecos con el motor
   y manda cada cambio. Se refresca sola para ver las citas nuevas y los huecos que se ocupan. */
(function () {
  'use strict';
  var D = window.__DATOS || {};
  var PANEL = D.sesion !== undefined;          // cargado con ?panel=1
  var B = window.BIZ || null;
  var state = window.__ESTADO || null;
  var subs = [], errSubs = [], sesionSubs = [];
  var M = window.Motor;

  function emit() { subs.forEach(function (f) { try { f(state); } catch (e) { console.error(e); } }); }
  function emitError(msg) { errSubs.forEach(function (f) { try { f(msg); } catch (e) {} }); }

  /* el panel puede cambiar el contenido: se actualiza el mismo objeto BIZ que usan los demás scripts */
  function ponerBiz(nuevo) {
    if (!nuevo) return;
    if (!B) { B = window.BIZ = nuevo; aplicarColor(); return; }
    Object.keys(B).forEach(function (k) { delete B[k]; });
    Object.keys(nuevo).forEach(function (k) { B[k] = nuevo[k]; });
    aplicarColor();
  }
  function ponerEstado(nuevo) {
    if (!nuevo) return;
    state = M.normalizar(nuevo, B);
  }
  function aplicarColor() {
    if (!B || !B.color) return;
    var r = document.documentElement.style, c = B.color;
    r.setProperty('--accent', c);
    r.setProperty('--accent2', 'color-mix(in srgb,' + c + ' 70%,#fff)');
    r.setProperty('--accent-soft', 'color-mix(in srgb,' + c + ' 40%,var(--bg))');
    r.setProperty('--accent-bg', 'color-mix(in srgb,' + c + ' 12%,var(--bg))');
  }
  if (state) state = M.normalizar(state, B);
  aplicarColor();

  var motor = M.crear(function () { return B; }, function () { return state; });

  /* ---------------- servidor ---------------- */
  function pedir(url, body) {
    return fetch(url, {
      method: body ? 'POST' : 'GET',
      headers: body ? { 'Content-Type': 'application/json' } : {},
      body: body ? JSON.stringify(body) : undefined,
      credentials: 'same-origin', cache: 'no-store'
    }).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (j) {
        if (r.status === 401 && PANEL) sesionSubs.forEach(function (f) { f(); });
        if (!r.ok) { var e = new Error(j.error || 'Error ' + r.status); e.status = r.status; throw e; }
        return j;
      });
    });
  }
  function recibir(j) {
    if (j && j.biz) ponerBiz(j.biz);
    if (j && j.estado) ponerEstado(j.estado);
    emit();
    return j;
  }
  var cargando = null;
  function refrescar() {
    if (cargando) return cargando;
    cargando = pedir('/ejemplos/reservas-jyc-widy/api/datos' + (PANEL ? '?panel=1' : ''))
      .then(function (j) { if (PANEL && !j.sesion) { sesionSubs.forEach(function (f) { f(); }); return j; } return recibir(j); })
      .catch(function () { /* sin conexión: se reintenta en la siguiente vuelta */ })
      .then(function (j) { cargando = null; return j; });
    return cargando;
  }
  var timer = null;
  function vigilar(ms) {
    clearInterval(timer);
    timer = setInterval(function () { if (!document.hidden) refrescar(); }, ms);
    document.addEventListener('visibilitychange', function () { if (!document.hidden) refrescar(); });
    window.addEventListener('online', refrescar);
  }

  /* cambio del panel: se ve al momento en pantalla y se confirma con lo que devuelve el servidor */
  function cambioPanel(body, local) {
    if (local) { try { local(); emit(); } catch (e) {} }
    return pedir('/ejemplos/reservas-jyc-widy/api/panel', body).then(recibir).catch(function (e) {
      emitError(e.message || 'No se ha podido guardar.');
      refrescar();
      throw e;
    });
  }
  function opAgenda(op) {
    return cambioPanel({ accion: 'agenda', op: op }, function () { M.aplicarAgenda(state, op); });
  }

  /* ---------------- acciones ---------------- */
  function book(data) {
    if (data.source === 'panel') {
      return pedir('/ejemplos/reservas-jyc-widy/api/panel', { accion: 'apuntar', cita: data }).then(function (j) { recibir(j); return j.reserva; });
    }
    return pedir('/ejemplos/reservas-jyc-widy/api/reserva', Object.assign({ accion: 'crear' }, data)).then(function (j) {
      refrescar();
      j.reserva.token = j.token;
      return j.reserva;
    });
  }
  function setStatus(id, st) {
    return cambioPanel({ accion: 'estadoCita', id: id, estado: st }, function () {
      state.bookings.forEach(function (b) { if (b.id === id) { b.status = st; b.seen = true; } });
      if (st === 'cancelada') state.bookings = state.bookings.filter(function (b) { return b.id !== id; });
    });
  }
  function markSeen() {
    var ch = false;
    state.bookings.forEach(function (b) { if (!b.seen) { b.seen = true; ch = true; } });
    if (ch) { emit(); pedir('/ejemplos/reservas-jyc-widy/api/panel', { accion: 'vistas' }).catch(function () {}); }
  }
  function toggleBlock(date, time, staffId) { return opAgenda({ op: 'toggleBlock', date: date, time: time, staffId: staffId || null }); }
  function setBlockRange(date, times, blocked, staffId) { return opAgenda({ op: 'setBlockRange', date: date, times: times, blocked: blocked, staffId: staffId || null }); }
  function setClosed(date, closed, staffId) { return opAgenda({ op: 'setClosed', date: date, closed: closed, staffId: staffId || null }); }
  function setHours(wd, ranges, staffId) { return opAgenda({ op: 'setHours', wd: wd, ranges: ranges, staffId: staffId || null }); }
  function guardarContenido(c) { return pedir('/ejemplos/reservas-jyc-widy/api/panel', { accion: 'contenido', contenido: c }).then(recibir); }

  window.Store = {
    ok: !!(B && state),
    panel: PANEL,
    datos: D,
    get: function () { return state; },
    biz: function () { return B; },
    on: function (f) { subs.push(f); return f; },
    onError: function (f) { errSubs.push(f); },
    onSesion: function (f) { sesionSubs.push(f); },
    refrescar: refrescar, vigilar: vigilar, pedir: pedir, recibir: recibir,
    slots: motor.slots, canFit: motor.canFit, dayInfo: motor.dayInfo, monthMatrix: motor.monthMatrix,
    nextSlots: motor.nextSlots, freeCount: motor.freeCount, bookingsOf: motor.bookingsOf, ranges: motor.ranges,
    resolveStaff: motor.resolveStaff, service: motor.service, staffMember: motor.staffMember,
    staffForCat: motor.staffForCat, staffForServices: motor.staffForServices,
    staff: function () { return (B && B.staff) || []; },
    book: book, setStatus: setStatus, markSeen: markSeen, guardarContenido: guardarContenido,
    toggleBlock: toggleBlock, setBlockRange: setBlockRange, setClosed: setClosed, setHours: setHours,
    ymd: M.ymd, fromYmd: M.fromYmd, today: M.today, toMin: M.toMin, toHM: M.toHM,
    DIAS: M.DIAS, DIAS_C: M.DIAS_C, MESES: M.MESES, MESES_C: M.MESES_C,
    fmtDate: M.fmtDate, fmtDateShort: M.fmtDateShort, money: M.money, dur: M.dur
  };
})();
