/* Widy · panel del dueño — agenda en vivo, disponibilidad y resumen */
(function () {
  'use strict';
  var B = window.BIZ, S = window.Store;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var el = function (t, c, h) { var e = document.createElement(t); if (c) e.className = c; if (h != null) e.innerHTML = h; return e; };

  var day = S.today(), tab = 'agenda', avDate = S.today(), known = {}, ready = false;

  /* ---------------- acceso ---------------- */
  function gate() {
    var g = $('#gate'), inp = $('#pin');
    if (sessionStorage.getItem('widy-panel-' + B.id) === 'ok') { g.remove(); start(); return; }
    $('#pinBtn').onclick = function () {
      if (inp.value.trim() === (B.pin || '1234')) {
        sessionStorage.setItem('widy-panel-' + B.id, 'ok');
        g.classList.add('out'); setTimeout(function () { g.remove(); }, 300); start();
      } else { g.classList.add('shake'); setTimeout(function () { g.classList.remove('shake'); }, 500); inp.value = ''; }
    };
    inp.addEventListener('keydown', function (e) { if (e.key === 'Enter') $('#pinBtn').click(); });
  }

  /* ---------------- agenda del día ----------------
     Las citas se ven grandes; los ratos libres se agrupan en una sola línea
     para que el día entero quepa de un vistazo. */
  function endOf(t) { return S.toHM(S.toMin(t) + B.slotMin); }

  function renderAgenda() {
    $('#agDate').textContent = S.fmtDate(day);
    var w = $('#agenda'); w.innerHTML = '';
    var list = S.slots(day);
    if (!list.length) {
      w.appendChild(el('p', 'empty', 'Cerrado este día.'));
      var ab = el('button', 'wide', 'Abrir este día');
      ab.onclick = function () { S.setClosed(day, false); };
      w.appendChild(ab);
      $('#agCount').textContent = 'cerrado';
      return;
    }

    /* agrupar: citas sueltas, y tramos seguidos de libre / bloqueado / pasado */
    var items = [], run = null, seen = {}, count = 0;
    list.forEach(function (s) {
      if (s.booking) {
        if (run) { items.push(run); run = null; }
        if (!seen[s.booking.id]) { seen[s.booking.id] = 1; items.push({ k: 'bk', b: s.booking }); count++; }
        return;
      }
      /* se corta también al cambiar de tramo, para no juntar mañana y tarde */
      if (run && run.k === s.state && run.r === s.r) run.times.push(s.t);
      else { if (run) items.push(run); run = { k: s.state, r: s.r, times: [s.t] }; }
    });
    if (run) items.push(run);

    items.forEach(function (it) {
      if (it.k === 'bk') { w.appendChild(bookingCard(it.b)); return; }
      var a = it.times[0], z = endOf(it.times[it.times.length - 1]);
      var row = el('div', 'gap ' + it.k);
      var lbl = '<span class="gap-t">' + a + ' – ' + z + '</span>';
      if (it.k === 'past') {
        row.innerHTML = lbl + '<span class="gap-l">ya pasó</span>';
      } else if (it.k === 'blocked') {
        row.innerHTML = lbl + '<span class="gap-l">no disponible</span>';
        var lib = el('button', 'mini', 'Liberar');
        lib.onclick = function () { S.setBlockRange(day, it.times, false); };
        row.appendChild(lib);
      } else {
        row.innerHTML = lbl + '<span class="gap-l">libre</span>';
        var ap = el('button', 'mini add', '+ Apuntar');
        ap.onclick = function () { openManual(day, it.times[0]); };
        var bl = el('button', 'mini', 'Bloquear');
        bl.onclick = function () { S.setBlockRange(day, it.times, true); };
        row.appendChild(ap); row.appendChild(bl);
      }
      w.appendChild(row);
    });
    $('#agCount').textContent = count + (count === 1 ? ' cita' : ' citas');
  }

  function bookingCard(b) {
    var svs = b.services.map(function (id) { var x = S.service(id); return x ? x.nm : ''; }).filter(Boolean).join(' + ');
    var c = el('div', 'bkc' + (b.status === 'hecha' ? ' ok' : ''));
    c.innerHTML =
      '<div class="bkc-h"><span class="bkc-t">' + b.time + '</span>' +
      '<span class="bkc-n">' + b.name + '</span>' +
      (b.status === 'nueva' ? '<span class="pill new">nueva</span>' : '') +
      (b.status === 'hecha' ? '<span class="pill done">hecha</span>' : '') +
      (b.source === 'panel' ? '<span class="pill src">a mano</span>' : '') + '</div>' +
      '<div class="bkc-s">' + (svs || 'Cita') + ' · ' + S.dur(b.dur) +
      (b.total > 0 ? ' · ' + S.money(b.total) : '') + '</div>';
    var cn = el('div', 'bkc-c');
    if (b.phone && b.phone !== '—') {
      cn.innerHTML = '<a class="mini" href="tel:+34' + b.phone + '">Llamar</a>' +
        '<a class="mini wa" href="https://wa.me/34' + b.phone + '" target="_blank" rel="noopener">WhatsApp</a>';
    }
    var ok = el('button', 'mini ok', b.status === 'hecha' ? 'Deshacer' : 'Hecha');
    ok.onclick = function () { S.setStatus(b.id, b.status === 'hecha' ? 'confirmada' : 'hecha'); };
    var no = el('button', 'mini no', 'Anular');
    no.onclick = function () {
      if (confirm('¿Anular la cita de ' + b.name + '? El hueco volverá a quedar libre en la web.')) S.setStatus(b.id, 'cancelada');
    };
    cn.appendChild(ok); cn.appendChild(no);
    c.appendChild(cn);
    return c;
  }

  /* ---------------- próximas reservas ---------------- */
  function renderList() {
    var w = $('#list'); w.innerHTML = '';
    var all = S.get().bookings.filter(function (b) { return b.status !== 'cancelada' && b.date >= S.today(); })
      .sort(function (a, b) { return (a.date + a.time) < (b.date + b.time) ? -1 : 1; });
    if (!all.length) { w.appendChild(el('p', 'empty', 'Todavía no hay reservas.')); return; }
    var cur = '';
    all.forEach(function (b) {
      if (b.date !== cur) { cur = b.date; w.appendChild(el('div', 'list-h', S.fmtDate(b.date))); }
      var svs = b.services.map(function (id) { var x = S.service(id); return x ? x.nm : ''; }).filter(Boolean).join(' + ');
      var c = el('div', 'lrow' + (b.seen ? '' : ' unseen'));
      c.innerHTML = '<div class="lt">' + b.time + '</div>' +
        '<div class="lm"><b>' + b.name + '</b><span>' + svs + '</span>' +
        '<span class="lsm">' + b.phone + (b.email ? ' · ' + b.email : '') + '</span></div>' +
        '<div class="lr">' + (b.total > 0 ? S.money(b.total) : '—') + '</div>';
      w.appendChild(c);
    });
  }

  /* ---------------- disponibilidad ---------------- */
  function renderAvail() {
    var st = S.get();
    $('#avDate').value = avDate;
    var closed = st.closed.indexOf(avDate) >= 0;
    $('#avClose').textContent = closed ? 'Abrir este día' : 'Cerrar todo el día';
    $('#avClose').classList.toggle('warn', !closed);

    var w = $('#avSlots'); w.innerHTML = '';
    var list = S.slots(avDate);
    if (!list.length) { w.appendChild(el('p', 'empty', 'Día cerrado: no se puede reservar en la web.')); }
    list.forEach(function (s) {
      var c = el('button', 'av ' + s.state); c.type = 'button';
      c.innerHTML = s.t + '<i>' + (s.state === 'busy' ? 'reservado' : s.state === 'blocked' ? 'bloqueado' : s.state === 'past' ? 'pasada' : 'libre') + '</i>';
      if (s.state === 'busy' || s.state === 'past') c.disabled = true;
      else c.onclick = function () { S.toggleBlock(avDate, s.t); };
      w.appendChild(c);
    });

    var h = $('#avHours'); h.innerHTML = '';
    [1, 2, 3, 4, 5, 6, 0].forEach(function (wd) {
      var rs = st.hours[wd] || [];
      var row = el('div', 'hrow');
      row.innerHTML = '<span class="hd">' + S.DIAS[wd] + '</span>';
      var box = el('div', 'hin');
      if (!rs.length) box.appendChild(el('span', 'hcl', 'Cerrado'));
      rs.forEach(function (r, i) {
        [0, 1].forEach(function (k) {
          var inp = el('input'); inp.type = 'time'; inp.value = r[k]; inp.step = 900;
          inp.onchange = function () {
            var copy = JSON.parse(JSON.stringify(rs)); copy[i][k] = inp.value; S.setHours(wd, copy);
          };
          box.appendChild(inp);
          if (k === 0) box.appendChild(el('span', 'hsep', '–'));
        });
        if (i === 0 && rs.length > 1) box.appendChild(el('span', 'hsep2', 'y'));
      });
      var t = el('button', 'hto' + (rs.length ? ' on' : '')); t.type = 'button';
      t.textContent = rs.length ? 'Abierto' : 'Cerrado';
      t.onclick = function () { S.setHours(wd, rs.length ? [] : (B.hours[wd] && B.hours[wd].length ? JSON.parse(JSON.stringify(B.hours[wd])) : [['10:00', '14:00']])); };
      row.appendChild(box); row.appendChild(t);
      h.appendChild(row);
    });
  }

  /* ---------------- resumen ---------------- */
  function renderStats() {
    var st = S.get(), t0 = S.today();
    var end = S.ymd(new Date(Date.now() + 7 * 864e5));
    var week = st.bookings.filter(function (b) { return b.status !== 'cancelada' && b.date >= t0 && b.date <= end; });
    var rev = week.reduce(function (a, b) { return a + (b.total || 0); }, 0);
    var web = week.filter(function (b) { return b.source === 'web'; }).length;
    var offh = week.filter(function (b) {
      var h = new Date(b.ts).getHours(); return b.source === 'web' && (h >= 21 || h < 9);
    }).length;
    $('#stats').innerHTML =
      stat(week.length, 'citas los próximos 7 días') +
      stat(S.money(rev), 'facturación prevista') +
      stat(web, 'reservadas solas por la web') +
      stat(offh, 'llegaron con el negocio cerrado');
  }
  function stat(v, l) { return '<div class="st"><b>' + v + '</b><span>' + l + '</span></div>'; }

  /* ---------------- apuntar una cita a mano (la que entra por teléfono) ---------------- */
  function openManual(date, time) {
    var m = $('#manual');
    m.classList.add('show');
    $('#mWhen').textContent = S.fmtDate(date);

    var free = S.slots(date).filter(function (s) { return s.state === 'free'; });
    var tsel = $('#mTime');
    tsel.innerHTML = free.map(function (s) { return '<option value="' + s.t + '">' + s.t + '</option>'; }).join('');
    if (time) tsel.value = time;

    var box = $('#mSvcs'); box.innerHTML = '';
    B.services.forEach(function (s) {
      var c = el('button', 'msv'); c.type = 'button'; c.dataset.id = s.id;
      c.textContent = s.nm;
      c.onclick = function () { c.classList.toggle('on'); };
      box.appendChild(c);
    });

    $('#mErr').textContent = free.length ? '' : 'No queda ningún hueco libre este día.';
    $('#mSave').disabled = !free.length;

    $('#mSave').onclick = function () {
      var nm = $('#mName').value.trim();
      if (!nm) { $('#mErr').textContent = 'Pon al menos el nombre.'; return; }
      var t = tsel.value;
      var ids = [].slice.call(box.querySelectorAll('.msv.on')).map(function (c) { return c.dataset.id; });
      var dur = 0, tot = 0, dep = 0;
      ids.forEach(function (id) { var s = S.service(id); dur += s.du; tot += (s.pr || 0); dep += (s.dep || 0); });
      if (!ids.length) dur = B.slotMin;                     // sin servicio: se reserva un hueco suelto
      if (!S.canFit(date, t, dur)) { $('#mErr').textContent = 'No cabe ahí: elige menos servicios u otra hora.'; return; }
      S.book({ date: date, time: t, services: ids, dur: dur, total: tot, deposit: dep,
        name: nm, phone: $('#mPhone').value.trim() || '—', email: '', source: 'panel' });
      closeManual();
    };
  }
  function closeManual() {
    $('#manual').classList.remove('show');
    $('#mName').value = ''; $('#mPhone').value = '';
  }

  /* ---------------- avisos de reserva nueva ---------------- */
  function checkNew() {
    var fresh = [];
    S.get().bookings.forEach(function (b) {
      if (!known[b.id]) { if (ready && b.source === 'web' && b.status !== 'cancelada') fresh.push(b); known[b.id] = 1; }
    });
    if (fresh.length) {
      var b = fresh[fresh.length - 1];
      var svs = b.services.map(function (id) { var x = S.service(id); return x ? x.nm : ''; }).filter(Boolean).join(' + ');
      pop('🔔 Nueva reserva · <b>' + b.name + '</b><br>' + svs + ' — ' + S.fmtDateShort(b.date) + ' a las ' + b.time);
      if (navigator.vibrate) try { navigator.vibrate([60, 40, 60]); } catch (e) {}
    }
    var unseen = S.get().bookings.filter(function (b) { return !b.seen && b.status !== 'cancelada'; }).length;
    var dot = $('#badge');
    dot.textContent = unseen; dot.classList.toggle('show', unseen > 0);
  }
  var pt;
  function pop(html) {
    var t = $('#pop'); t.innerHTML = html; t.classList.add('show');
    clearTimeout(pt); pt = setTimeout(function () { t.classList.remove('show'); }, 6000);
  }

  /* ---------------- render / arranque ---------------- */
  function renderAll() {
    if (tab === 'agenda') renderAgenda();
    if (tab === 'list') renderList();
    if (tab === 'avail') renderAvail();
    if (tab === 'stats') renderStats();
    checkNew();
  }
  function setTab(t) {
    tab = t;
    document.querySelectorAll('.tab').forEach(function (b) { b.classList.toggle('on', b.dataset.tab === t); });
    document.querySelectorAll('.pane').forEach(function (p) { p.classList.toggle('show', p.id === 'pane-' + t); });
    $('#fab').classList.toggle('hide', t !== 'agenda');
    if (t === 'list') S.markSeen();
    renderAll();
  }

  function start() {
    $('#bizName').textContent = B.name;
    S.get().bookings.forEach(function (b) { known[b.id] = 1; });

    document.querySelectorAll('.tab').forEach(function (b) { b.onclick = function () { setTab(b.dataset.tab); }; });
    $('#agPrev').onclick = function () { var d = S.fromYmd(day); d.setDate(d.getDate() - 1); day = S.ymd(d); renderAgenda(); };
    $('#agNext').onclick = function () { var d = S.fromYmd(day); d.setDate(d.getDate() + 1); day = S.ymd(d); renderAgenda(); };
    $('#agToday').onclick = function () { day = S.today(); renderAgenda(); };
    $('#avDate').onchange = function () { avDate = this.value; renderAvail(); };
    $('#avClose').onclick = function () { S.setClosed(avDate, S.get().closed.indexOf(avDate) < 0); };
    $('#mClose').onclick = closeManual;
    $('#fab').onclick = function () { openManual(day, null); };
    $('#resetBtn').onclick = function () {
      if (confirm('Reiniciar la demo con datos de ejemplo nuevos?')) { known = {}; S.reset(); S.get().bookings.forEach(function (b) { known[b.id] = 1; }); renderAll(); }
    };
    setTab('agenda');
    ready = true;
    S.on(renderAll);
    setInterval(function () { if (tab === 'agenda') renderAgenda(); }, 60000);
  }

  document.addEventListener('DOMContentLoaded', gate);
})();
