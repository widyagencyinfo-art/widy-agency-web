/* Widy · motor de reservas — estado compartido entre la web del cliente y el panel del dueño.
   En la demo sincroniza en vivo entre pestañas/ventanas del mismo dispositivo
   (BroadcastChannel + localStorage). En producción se cambia SOLO este archivo por la API real. */
(function () {
  'use strict';
  var B = window.BIZ;
  var KEY = 'widy:' + B.id + ':v3';
  var bc = ('BroadcastChannel' in window) ? new BroadcastChannel('widy-' + B.id) : null;
  var subs = [];
  var state;

  /* ---------- utilidades de fecha ---------- */
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function ymd(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function fromYmd(s) { var p = s.split('-'); return new Date(+p[0], +p[1] - 1, +p[2]); }
  function toMin(hm) { var p = hm.split(':'); return (+p[0]) * 60 + (+p[1]); }
  function toHM(m) { return pad(Math.floor(m / 60)) + ':' + pad(m % 60); }
  function today() { return ymd(new Date()); }
  function nowMin() { var d = new Date(); return d.getHours() * 60 + d.getMinutes(); }
  function clone(o) { return JSON.parse(JSON.stringify(o)); }

  var DIAS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  var DIAS_C = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  var MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  var MESES_C = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

  /* ---------- persistencia ---------- */
  function base() {
    return { bookings: [], blocked: {}, closed: [], hours: clone(B.hours), seeded: false };
  }
  function load() {
    try { state = JSON.parse(localStorage.getItem(KEY)) || base(); }
    catch (e) { state = base(); }
    if (!state.hours) state.hours = clone(B.hours);
    if (!state.blocked) state.blocked = {};
    if (!state.closed) state.closed = [];
    if (!state.bookings) state.bookings = [];
  }
  function persist(broadcast) {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {}
    if (broadcast !== false && bc) bc.postMessage({ t: 'sync' });
    emit();
  }
  function emit() { subs.forEach(function (f) { try { f(state); } catch (e) {} }); }

  if (bc) bc.onmessage = function () { load(); emit(); };
  window.addEventListener('storage', function (e) { if (e.key === KEY) { load(); emit(); } });

  /* ---------- horario y huecos ---------- */
  function ranges(dateStr) {
    if (state.closed.indexOf(dateStr) >= 0) return [];
    return state.hours[fromYmd(dateStr).getDay()] || [];
  }
  function slotList(dateStr) {
    var out = [], rs = ranges(dateStr), step = B.slotMin;
    rs.forEach(function (r, ri) {
      for (var m = toMin(r[0]); m + step <= toMin(r[1]); m += step) out.push({ t: toHM(m), r: ri });
    });
    return out;
  }
  function bookingsOf(dateStr) {
    return state.bookings.filter(function (b) { return b.date === dateStr && b.status !== 'cancelada'; });
  }
  /* mapa hora -> reserva, teniendo en cuenta la duración real (una reserva ocupa varios huecos) */
  function occupancy(dateStr) {
    var map = {}, slots = slotList(dateStr);
    bookingsOf(dateStr).forEach(function (b) {
      var i = -1;
      for (var k = 0; k < slots.length; k++) if (slots[k].t === b.time) { i = k; break; }
      if (i < 0) { map[b.time] = b; return; }
      var need = Math.max(1, Math.ceil(b.dur / B.slotMin));
      for (var j = 0; j < need && i + j < slots.length; j++) {
        if (slots[i + j].r !== slots[i].r) break;      // no cruzar el descanso del mediodía
        map[slots[i + j].t] = b;
      }
    });
    return map;
  }
  /* estado de cada hueco del día: free | busy | blocked | past */
  function slots(dateStr) {
    var occ = occupancy(dateStr);
    var blocked = state.blocked[dateStr] || [];
    var isToday = dateStr === today(), n = nowMin();
    return slotList(dateStr).map(function (s) {
      var st = 'free';
      if (isToday && toMin(s.t) <= n) st = 'past';
      else if (occ[s.t]) st = 'busy';
      else if (blocked.indexOf(s.t) >= 0) st = 'blocked';
      return { t: s.t, r: s.r, state: st, booking: occ[s.t] || null };
    });
  }
  /* ¿caben `dur` minutos empezando a las `time`? */
  function canFit(dateStr, time, dur) {
    var list = slots(dateStr), i = -1;
    for (var k = 0; k < list.length; k++) if (list[k].t === time) { i = k; break; }
    if (i < 0) return false;
    var need = Math.max(1, Math.ceil(dur / B.slotMin));
    for (var j = 0; j < need; j++) {
      var s = list[i + j];
      if (!s || s.state !== 'free' || s.r !== list[i].r) return false;
    }
    return true;
  }
  function freeCount(dateStr, dur) {
    return slots(dateStr).filter(function (s) {
      return s.state === 'free' && (!dur || canFit(dateStr, s.t, dur));
    }).length;
  }
  /* los primeros huecos disponibles, como mucho 2 por día para que haya variedad */
  function nextSlots(dur, n) {
    var out = [], d = fromYmd(today()), guard = 0;
    while (out.length < n && guard < 45) {
      var ds = ymd(d), added = 0, list = slots(ds);
      for (var i = 0; i < list.length && out.length < n && added < 2; i++) {
        var s = list[i];
        if (s.state === 'free' && (!dur || canFit(ds, s.t, dur))) { out.push({ date: ds, time: s.t }); added++; }
      }
      d.setDate(d.getDate() + 1); guard++;
    }
    return out;
  }
  function dayInfo(dateStr, dur) {
    var d = fromYmd(dateStr), t = fromYmd(today());
    var past = d < t;
    var closed = ranges(dateStr).length === 0;
    return { date: dateStr, past: past, closed: closed, free: (past || closed) ? 0 : freeCount(dateStr, dur) };
  }
  function monthMatrix(y, m, dur) {
    var first = new Date(y, m, 1), start = (first.getDay() + 6) % 7; // semana empieza en lunes
    var days = new Date(y, m + 1, 0).getDate(), cells = [];
    for (var i = 0; i < start; i++) cells.push(null);
    for (var d = 1; d <= days; d++) cells.push(dayInfo(ymd(new Date(y, m, d)), dur));
    while (cells.length % 7) cells.push(null);
    return cells;
  }

  /* ---------- acciones ---------- */
  function uid() { return 'b' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }

  function book(data) {
    var b = {
      id: uid(), ts: Date.now(), date: data.date, time: data.time,
      services: data.services, dur: data.dur, total: data.total, deposit: data.deposit || 0,
      name: data.name, phone: data.phone, email: data.email || '', notes: data.notes || '',
      source: data.source || 'web', status: 'nueva', seen: data.source === 'panel'
    };
    state.bookings.push(b);
    persist();
    return b;
  }
  function setStatus(id, st) {
    state.bookings.forEach(function (b) { if (b.id === id) b.status = st; });
    persist();
  }
  function markSeen() {
    var ch = false;
    state.bookings.forEach(function (b) { if (!b.seen) { b.seen = true; ch = true; } });
    if (ch) persist();
  }
  function toggleBlock(dateStr, time) {
    var arr = state.blocked[dateStr] || (state.blocked[dateStr] = []);
    var i = arr.indexOf(time);
    if (i >= 0) arr.splice(i, 1); else arr.push(time);
    persist();
  }
  /* bloquear o liberar un tramo entero de una vez */
  function setBlockRange(dateStr, times, blocked) {
    var arr = state.blocked[dateStr] || (state.blocked[dateStr] = []);
    times.forEach(function (t) {
      var i = arr.indexOf(t);
      if (blocked && i < 0) arr.push(t);
      if (!blocked && i >= 0) arr.splice(i, 1);
    });
    persist();
  }
  function setClosed(dateStr, closed) {
    var i = state.closed.indexOf(dateStr);
    if (closed && i < 0) state.closed.push(dateStr);
    if (!closed && i >= 0) state.closed.splice(i, 1);
    persist();
  }
  function setHours(wd, rs) { state.hours[wd] = rs; persist(); }
  function reset() { state = base(); seedIfNeeded(); persist(); }

  /* ---------- datos de ejemplo para que la agenda parezca viva ---------- */
  function lcg(s) { var x = s; return function () { x = (x * 1103515245 + 12345) % 2147483648; return x / 2147483648; }; }
  function seedIfNeeded() {
    if (state.seeded) return;
    var names = ['María G.', 'Antonio R.', 'Lucía P.', 'Javier M.', 'Carmen S.', 'Rocío D.',
      'Manuel A.', 'Alba C.', 'Sergio L.', 'Paula V.', 'Fran J.', 'Marta B.'];
    var rnd = lcg(87433), start = new Date();
    for (var i = 0; i < 14; i++) {
      var d = new Date(start); d.setDate(start.getDate() + i);
      var ds = ymd(d), list = slotList(ds);
      if (!list.length) continue;
      var n = Math.floor(rnd() * 4) + 2;
      for (var k = 0; k < n; k++) {
        var s = list[Math.floor(rnd() * list.length)];
        if (!s) continue;
        var sv = B.services[Math.floor(rnd() * B.services.length)];
        if (!canFit(ds, s.t, sv.du)) continue;
        state.bookings.push({
          id: uid(), ts: Date.now() - (i * 8600000), date: ds, time: s.t,
          services: [sv.id], dur: sv.du, total: sv.pr || 0, deposit: sv.dep || 0,
          name: names[Math.floor(rnd() * names.length)], phone: '6' + Math.floor(10000000 + rnd() * 89999999),
          email: '', notes: '', source: 'web', status: 'confirmada', seen: true
        });
      }
    }
    state.seeded = true;
  }

  /* ---------- API ---------- */
  load();
  if (!state.seeded) { seedIfNeeded(); persist(false); }

  window.Store = {
    get: function () { return state; },
    on: function (f) { subs.push(f); return f; },
    slots: slots, canFit: canFit, dayInfo: dayInfo, monthMatrix: monthMatrix, nextSlots: nextSlots,
    freeCount: freeCount, bookingsOf: bookingsOf, ranges: ranges,
    book: book, setStatus: setStatus, markSeen: markSeen,
    toggleBlock: toggleBlock, setBlockRange: setBlockRange, setClosed: setClosed, setHours: setHours, reset: reset,
    ymd: ymd, fromYmd: fromYmd, today: today, toMin: toMin, toHM: toHM,
    DIAS: DIAS, DIAS_C: DIAS_C, MESES: MESES, MESES_C: MESES_C,
    service: function (id) {
      for (var i = 0; i < B.services.length; i++) if (B.services[i].id === id) return B.services[i];
      return null;
    },
    fmtDate: function (ds) {
      var d = fromYmd(ds);
      return DIAS[d.getDay()] + ', ' + d.getDate() + ' de ' + MESES[d.getMonth()].toLowerCase();
    },
    fmtDateShort: function (ds) {
      var d = fromYmd(ds);
      return DIAS_C[d.getDay()] + ' ' + d.getDate() + ' ' + MESES_C[d.getMonth()];
    },
    money: function (n) { return (Math.round(n * 100) / 100).toString().replace('.', ',') + '€'; },
    dur: function (m) {
      var h = Math.floor(m / 60), mm = m % 60;
      return (h ? h + ' h' : '') + (h && mm ? ' ' : '') + (mm ? mm + ' min' : '');
    }
  };
})();
