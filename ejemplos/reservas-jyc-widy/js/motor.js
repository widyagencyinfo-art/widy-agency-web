/* Widy · motor de huecos — el MISMO cálculo en el navegador (web y panel) y en el servidor (api/),
   para que el servidor compruebe cada reserva con las mismas reglas que ve el cliente.
   No guarda nada: recibe el negocio (B) y el estado (agenda + reservas) y responde. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.Motor = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var DIAS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  var DIAS_C = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  var MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  var MESES_C = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function ymd(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function fromYmd(s) { var p = s.split('-'); return new Date(+p[0], +p[1] - 1, +p[2]); }
  function toMin(hm) { var p = hm.split(':'); return (+p[0]) * 60 + (+p[1]); }
  function toHM(m) { return pad(Math.floor(m / 60)) + ':' + pad(m % 60); }
  function clone(o) { return JSON.parse(JSON.stringify(o)); }

  /* la hora que manda es la de la peluquería (Madrid), esté donde esté el servidor o el móvil */
  function ahoraMadrid() {
    try {
      var p = {};
      new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Europe/Madrid', year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', hourCycle: 'h23'
      }).formatToParts(new Date()).forEach(function (x) { p[x.type] = x.value; });
      return { fecha: p.year + '-' + p.month + '-' + p.day, min: (+p.hour) * 60 + (+p.minute) };
    } catch (e) {
      var d = new Date();
      return { fecha: ymd(d), min: d.getHours() * 60 + d.getMinutes() };
    }
  }
  function today() { return ahoraMadrid().fecha; }
  function nowMin() { return ahoraMadrid().min; }

  /* estado vacío de la agenda, partiendo del horario del negocio */
  function agendaBase(B) {
    return { blocked: {}, closed: [], hours: clone(B.hours || {}), staffBlocked: {}, staffClosed: {}, staffHours: {} };
  }
  function normalizar(state, B) {
    if (!state.hours) state.hours = clone(B.hours || {});
    if (!state.blocked) state.blocked = {};
    if (!state.closed) state.closed = [];
    if (!state.bookings) state.bookings = [];
    if (!state.staffBlocked) state.staffBlocked = {};
    if (!state.staffClosed) state.staffClosed = {};
    if (!state.staffHours) state.staffHours = {};
    return state;
  }

  function crear(getB, getState) {
    function B() { return getB(); }
    function st() { return getState(); }

    function service(id) {
      var s = B().services || [];
      for (var i = 0; i < s.length; i++) if (s[i].id === id) return s[i];
      return null;
    }
    function staffMember(id) {
      var list = B().staff || [];
      for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i];
      return null;
    }
    /* quién atiende una categoría; si no se ha dicho a nadie, cualquiera del equipo */
    function staffForCat(cat) {
      var ids = ((B().staffByCat && B().staffByCat[cat]) || []).filter(function (id) { return !!staffMember(id); });
      return ids.length ? ids : (B().staff || []).map(function (s) { return s.id; });
    }
    /* quién puede hacer TODA la cita: intersección de las categorías elegidas */
    function staffForServices(serviceIds) {
      var cats = [], seenCat = {};
      (serviceIds || []).forEach(function (sid) {
        var sv = service(sid);
        if (sv && !seenCat[sv.cat]) { seenCat[sv.cat] = 1; cats.push(sv.cat); }
      });
      if (!cats.length) return [];
      var result = staffForCat(cats[0]).slice();
      for (var i = 1; i < cats.length && result.length; i++) {
        var setB = staffForCat(cats[i]);
        result = result.filter(function (id) { return setB.indexOf(id) >= 0; });
      }
      return result;
    }

    function intersectRanges(a, b) {
      var out = [];
      (a || []).forEach(function (ra) {
        (b || []).forEach(function (rb) {
          var s = Math.max(toMin(ra[0]), toMin(rb[0])), e = Math.min(toMin(ra[1]), toMin(rb[1]));
          if (e > s) out.push([toHM(s), toHM(e)]);
        });
      });
      return out;
    }
    function ranges(dateStr, staffId) {
      var S = st();
      if (S.closed.indexOf(dateStr) >= 0) return [];
      var wd = fromYmd(dateStr).getDay();
      var biz = S.hours[wd] || [];
      if (!staffId) return biz;
      if ((S.staffClosed[staffId] || []).indexOf(dateStr) >= 0) return [];
      var custom = S.staffHours[staffId] && S.staffHours[staffId][wd];
      var m = staffMember(staffId);
      var own = custom !== undefined ? custom : ((m && m.hours && m.hours[wd]) || biz);
      return intersectRanges(biz, own);
    }
    function slotList(dateStr, staffId) {
      var out = [], rs = ranges(dateStr, staffId), step = B().slotMin || 15;
      rs.forEach(function (r, ri) {
        for (var m = toMin(r[0]); m + step <= toMin(r[1]); m += step) out.push({ t: toHM(m), r: ri });
      });
      return out;
    }
    function bookingsOf(dateStr, staffId) {
      return st().bookings.filter(function (b) {
        return b.date === dateStr && b.status !== 'cancelada' && (!staffId || b.staffId === staffId);
      });
    }
    /* tramos realmente ocupados (el color actuando solo deja un hueco libre dentro de la cita).
       Si un servicio ya no existe en la carta, la cita entera cuenta como ocupada. */
    function busyRanges(b) {
      var offset = 0, out = [], missing = false;
      (b.services || []).forEach(function (sid) {
        var sv = service(sid);
        if (!sv) { missing = true; return; }
        var du = sv.du;
        if (sv.gap) {
          var gs = offset + sv.gap[0], ge = gs + sv.gap[1];
          if (gs > offset) out.push([offset, gs]);
          if (offset + du > ge) out.push([ge, offset + du]);
        } else if (du > 0) {
          out.push([offset, offset + du]);
        }
        offset += du;
      });
      if (missing || !out.length) return [[0, Math.max(b.dur || 0, B().slotMin || 15)]];
      return out;
    }
    function occupancy(dateStr, staffId) {
      var map = {}, slots = slotList(dateStr, staffId), step = B().slotMin || 15;
      bookingsOf(dateStr, staffId).forEach(function (b) {
        var i = -1;
        for (var k = 0; k < slots.length; k++) if (slots[k].t === b.time) { i = k; break; }
        if (i < 0) { map[b.time] = b; return; }
        var rgs = busyRanges(b);
        var need = Math.max(1, Math.ceil(b.dur / step));
        for (var j = 0; j < need && i + j < slots.length; j++) {
          if (slots[i + j].r !== slots[i].r) break;
          var relMin = j * step;
          var busy = rgs.some(function (r) { return relMin >= r[0] && relMin < r[1]; });
          if (busy) map[slots[i + j].t] = b;
        }
      });
      return map;
    }
    function blockedFor(dateStr, staffId) {
      var S = st();
      return staffId ? ((S.staffBlocked[staffId] || {})[dateStr] || []) : (S.blocked[dateStr] || []);
    }
    function slots(dateStr, staffSpec) {
      if (Array.isArray(staffSpec)) {
        if (staffSpec.length === 1) return slots(dateStr, staffSpec[0]);
        if (!staffSpec.length) {
          return slotList(dateStr, null).map(function (s) { return { t: s.t, r: s.r, state: 'busy', booking: null }; });
        }
        var byTime = {}, order = [];
        staffSpec.forEach(function (id) {
          slots(dateStr, id).forEach(function (s) {
            if (!byTime[s.t]) { byTime[s.t] = s; order.push(s.t); }
            else if (s.state === 'free' && byTime[s.t].state !== 'free') byTime[s.t] = s;
          });
        });
        order.sort();
        return order.map(function (t) { return byTime[t]; });
      }
      var occ = occupancy(dateStr, staffSpec);
      var blocked = blockedFor(dateStr, staffSpec);
      var now = ahoraMadrid(), isToday = dateStr === now.fecha, isPast = dateStr < now.fecha;
      return slotList(dateStr, staffSpec).map(function (s) {
        var state = 'free';
        if (isPast || (isToday && toMin(s.t) <= now.min)) state = 'past';
        else if (occ[s.t]) state = 'busy';
        else if (blocked.indexOf(s.t) >= 0) state = 'blocked';
        return { t: s.t, r: s.r, state: state, booking: occ[s.t] || null };
      });
    }
    function canFit(dateStr, time, dur, staffSpec) {
      if (Array.isArray(staffSpec)) return staffSpec.some(function (id) { return canFit(dateStr, time, dur, id); });
      var list = slots(dateStr, staffSpec), i = -1;
      for (var k = 0; k < list.length; k++) if (list[k].t === time) { i = k; break; }
      if (i < 0) return false;
      var need = Math.max(1, Math.ceil(dur / (B().slotMin || 15)));
      for (var j = 0; j < need; j++) {
        var s = list[i + j];
        if (!s || s.state !== 'free' || s.r !== list[i].r) return false;
      }
      return true;
    }
    function resolveStaff(dateStr, time, dur, staffSpec) {
      if (!staffSpec) return null;
      if (!Array.isArray(staffSpec)) return canFit(dateStr, time, dur, staffSpec) ? staffSpec : null;
      for (var i = 0; i < staffSpec.length; i++) if (canFit(dateStr, time, dur, staffSpec[i])) return staffSpec[i];
      return null;
    }
    function freeCount(dateStr, dur, staffSpec) {
      return slots(dateStr, staffSpec).filter(function (s) {
        return s.state === 'free' && (!dur || canFit(dateStr, s.t, dur, staffSpec));
      }).length;
    }
    function nextSlots(dur, n, staffSpec) {
      var out = [], d = fromYmd(today()), guard = 0;
      while (out.length < n && guard < 45) {
        var ds = ymd(d), added = 0, list = slots(ds, staffSpec);
        for (var i = 0; i < list.length && out.length < n && added < 2; i++) {
          var s = list[i];
          if (s.state === 'free' && (!dur || canFit(ds, s.t, dur, staffSpec))) { out.push({ date: ds, time: s.t }); added++; }
        }
        d.setDate(d.getDate() + 1); guard++;
      }
      return out;
    }
    function dayInfo(dateStr, dur, staffSpec) {
      var past = dateStr < today();
      var closed = ranges(dateStr, Array.isArray(staffSpec) ? null : staffSpec).length === 0 &&
        (!Array.isArray(staffSpec) || !staffSpec.some(function (id) { return ranges(dateStr, id).length > 0; }));
      return { date: dateStr, past: past, closed: closed, free: (past || closed) ? 0 : freeCount(dateStr, dur, staffSpec) };
    }
    function monthMatrix(y, m, dur, staffSpec) {
      var first = new Date(y, m, 1), start = (first.getDay() + 6) % 7;
      var days = new Date(y, m + 1, 0).getDate(), cells = [];
      for (var i = 0; i < start; i++) cells.push(null);
      for (var d = 1; d <= days; d++) cells.push(dayInfo(ymd(new Date(y, m, d)), dur, staffSpec));
      while (cells.length % 7) cells.push(null);
      return cells;
    }

    return {
      service: service, staffMember: staffMember, staffForCat: staffForCat, staffForServices: staffForServices,
      ranges: ranges, slots: slots, canFit: canFit, resolveStaff: resolveStaff, freeCount: freeCount,
      nextSlots: nextSlots, dayInfo: dayInfo, monthMatrix: monthMatrix, bookingsOf: bookingsOf
    };
  }

  /* cambios de agenda que puede pedir el panel — se aplican igual en el móvil (al momento)
     y en el servidor (sobre la copia buena de la base de datos) */
  function aplicarAgenda(state, op) {
    var a = op || {}, sid = a.staffId || null;
    function bucketBlocked() {
      return sid ? (state.staffBlocked[sid] || (state.staffBlocked[sid] = {})) : state.blocked;
    }
    if (a.op === 'toggleBlock') {
      var arr = bucketBlocked()[a.date] || (bucketBlocked()[a.date] = []);
      var i = arr.indexOf(a.time);
      if (i >= 0) arr.splice(i, 1); else arr.push(a.time);
    } else if (a.op === 'setBlockRange') {
      var arr2 = bucketBlocked()[a.date] || (bucketBlocked()[a.date] = []);
      (a.times || []).forEach(function (t) {
        var j = arr2.indexOf(t);
        if (a.blocked && j < 0) arr2.push(t);
        if (!a.blocked && j >= 0) arr2.splice(j, 1);
      });
    } else if (a.op === 'setClosed') {
      var list = sid ? (state.staffClosed[sid] || (state.staffClosed[sid] = [])) : state.closed;
      var k = list.indexOf(a.date);
      if (a.closed && k < 0) list.push(a.date);
      if (!a.closed && k >= 0) list.splice(k, 1);
    } else if (a.op === 'setHours') {
      if (sid) (state.staffHours[sid] || (state.staffHours[sid] = {}))[a.wd] = a.ranges;
      else state.hours[a.wd] = a.ranges;
    } else {
      return false;
    }
    return true;
  }

  function fmtDate(ds) {
    var d = fromYmd(ds);
    return DIAS[d.getDay()] + ', ' + d.getDate() + ' de ' + MESES[d.getMonth()].toLowerCase();
  }
  function fmtDateShort(ds) {
    var d = fromYmd(ds);
    return DIAS_C[d.getDay()] + ' ' + d.getDate() + ' ' + MESES_C[d.getMonth()];
  }
  function money(n) { return (Math.round(n * 100) / 100).toString().replace('.', ',') + '€'; }
  function dur(m) {
    var h = Math.floor(m / 60), mm = m % 60;
    return (h ? h + ' h' : '') + (h && mm ? ' ' : '') + (mm ? mm + ' min' : '');
  }

  return {
    crear: crear, aplicarAgenda: aplicarAgenda, agendaBase: agendaBase, normalizar: normalizar,
    ahoraMadrid: ahoraMadrid, today: today, nowMin: nowMin,
    ymd: ymd, fromYmd: fromYmd, toMin: toMin, toHM: toHM, clone: clone,
    fmtDate: fmtDate, fmtDateShort: fmtDateShort, money: money, dur: dur,
    DIAS: DIAS, DIAS_C: DIAS_C, MESES: MESES, MESES_C: MESES_C
  };
});
