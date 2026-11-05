/* Widy · panel del dueño — agenda en vivo, disponibilidad y resumen */
(function () {
  'use strict';
  var S = window.Store, B = window.BIZ;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var el = function (t, c, h) { var e = document.createElement(t); if (c) e.className = c; if (h != null) e.innerHTML = h; return e; };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (x) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[x]; }); };

  var day = S.today(), tab = 'agenda', avDate = S.today(), known = {}, ready = false;
  var agStaff = null, avStaff = null;           // null = negocio entero / todas
  var agCal = new Date();

  /* ---------------- acceso ---------------- */
  function gate() {
    var g = $('#gate'), inp = $('#pin'), btn = $('#pinBtn'), err = $('#pinErr');
    if (S.panel && S.datos.sesion && S.ok) { g.remove(); start(); return; }
    if (S.datos.error) err.textContent = 'No hay conexión con el servidor. Recarga en un momento.';
    function entrar() {
      if (!inp.value) { inp.focus(); return; }
      btn.disabled = true; btn.textContent = 'Entrando…'; err.textContent = '';
      S.pedir('/ejemplos/reservas-jyc-widy/api/panel', { accion: 'entrar', clave: inp.value })
        .then(function () { location.reload(); })
        .catch(function (e) {
          btn.disabled = false; btn.textContent = 'Entrar';
          err.textContent = e.message || 'No se pudo entrar.';
          g.classList.add('shake'); setTimeout(function () { g.classList.remove('shake'); }, 500);
          inp.select();
        });
    }
    btn.onclick = entrar;
    inp.addEventListener('keydown', function (e) { if (e.key === 'Enter') entrar(); });
    $('#verClave').onclick = function () { inp.type = inp.type === 'password' ? 'text' : 'password'; inp.focus(); };
    setTimeout(function () { inp.focus(); }, 50);
  }

  function telHref(p) {
    var d = String(p || '').replace(/[^\d+]/g, '');
    if (!d) return '';
    if (d.charAt(0) === '+') return d;
    return '+' + (d.length === 9 ? '34' : '') + d;
  }
  function waHref(b, texto) {
    var d = telHref(b.phone).replace('+', '');
    return d ? 'https://wa.me/' + d + (texto ? '?text=' + encodeURIComponent(texto) : '') : '';
  }
  /* lo que el dueño tenga apuntado de esa persona en su ficha */
  function notaCliente(b) {
    return (window.Clientes && window.Clientes.notaDe) ? window.Clientes.notaDe(b.phone, b.name) : '';
  }
  function svsDe(b) {
    var n = b.services.map(function (id) { var x = S.service(id); return x ? x.nm : ''; }).filter(Boolean).join(' + ');
    return n || b.nombres || '';
  }

  /* ---------------- filtro de peluquera (se reutiliza en Agenda y Disponibilidad) ---------------- */
  function renderStaffFilter(box, current, withBiz, onPick) {
    box.innerHTML = '';
    var all = el('button', 'sf-pill' + (!current ? ' on' : ''), withBiz ? 'Negocio' : 'Todas'); all.type = 'button';
    all.onclick = function () { onPick(null); };
    box.appendChild(all);
    S.staff().forEach(function (m) {
      var b = el('button', 'sf-pill' + (current === m.id ? ' on' : ''), esc(m.nm)); b.type = 'button';
      b.onclick = function () { onPick(m.id); };
      box.appendChild(b);
    });
    box.style.display = S.staff().length ? '' : 'none';
  }

  /* ---------------- calendario mensual de la agenda ---------------- */
  function renderAgCal() {
    $('#agCalTitle').textContent = S.MESES[agCal.getMonth()] + ' ' + agCal.getFullYear();
    var grid = $('#agCalGrid'); grid.innerHTML = '';
    ['L', 'M', 'X', 'J', 'V', 'S', 'D'].forEach(function (d) { grid.appendChild(el('div', 'cal-dow', d)); });
    S.monthMatrix(agCal.getFullYear(), agCal.getMonth(), null, agStaff).forEach(function (d) {
      if (!d) { grid.appendChild(el('div', 'cal-x')); return; }
      var n = S.fromYmd(d.date).getDate();
      var c = el('button', 'cal-d'); c.type = 'button';
      var citas = S.bookingsOf(d.date, agStaff).length;
      c.innerHTML = '<span>' + n + '</span>' + (citas ? '<i class="dot"></i>' : '');
      if (d.closed) c.classList.add('off');
      if (!d.closed && !d.past && !d.free) c.classList.add('full');
      if (d.date === S.today()) c.classList.add('now');
      if (d.date === day) c.classList.add('on');
      c.onclick = function () { day = d.date; renderAgenda(); };
      grid.appendChild(c);
    });
  }

  /* ---------------- agenda del día ---------------- */
  function endOf(t, dur) { return S.toHM(S.toMin(t) + (dur || B.slotMin)); }

  function renderAgenda() {
    $('#agDate').textContent = S.fmtDate(day);
    renderAgCal();
    var w = $('#agenda'); w.innerHTML = '';

    if (!agStaff) { renderAgendaTodas(w); return; }

    var list = S.slots(day, agStaff);
    if (!list.length) {
      w.appendChild(el('p', 'empty', 'Cerrado este día.'));
      var ab = el('button', 'wide', 'Abrir este día');
      ab.onclick = function () { S.setClosed(day, false, agStaff); };
      w.appendChild(ab);
      $('#agCount').textContent = 'cerrado';
      return;
    }

    var items = [], run = null, seen = {}, count = 0;
    list.forEach(function (s) {
      if (s.booking) {
        if (run) { items.push(run); run = null; }
        if (!seen[s.booking.id]) { seen[s.booking.id] = 1; items.push({ k: 'bk', b: s.booking }); count++; }
        return;
      }
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
        lib.onclick = function () { S.setBlockRange(day, it.times, false, agStaff); };
        row.appendChild(lib);
      } else {
        row.innerHTML = lbl + '<span class="gap-l">libre</span>';
        var ap = el('button', 'mini add', '+ Apuntar');
        ap.onclick = function () { openManual(day, it.times[0]); };
        var bl = el('button', 'mini', 'Bloquear');
        bl.onclick = function () { S.setBlockRange(day, it.times, true, agStaff); };
        row.appendChild(ap); row.appendChild(bl);
      }
      w.appendChild(row);
    });
    $('#agCount').textContent = count + (count === 1 ? ' cita' : ' citas');
  }

  function renderAgendaTodas(w) {
    var all = S.get().bookings.filter(function (b) { return b.date === day && b.status !== 'cancelada'; })
      .sort(function (a, b) { return a.time < b.time ? -1 : 1; });
    if (!S.ranges(day, null).length && !all.length) {
      w.appendChild(el('p', 'empty', 'Cerrado este día.'));
      var ab = el('button', 'wide', 'Abrir este día');
      ab.onclick = function () { S.setClosed(day, false); };
      w.appendChild(ab);
      $('#agCount').textContent = 'cerrado';
      return;
    }
    if (!all.length) {
      w.appendChild(el('p', 'empty', 'Todavía no hay citas este día.'));
      $('#agCount').textContent = '0 citas';
      return;
    }
    var prevEnd = null;
    all.forEach(function (b) {
      if (prevEnd && prevEnd < b.time) {
        w.appendChild(el('div', 'gap free', '<span class="gap-l">sin citas hasta las ' + b.time + '</span>'));
      }
      w.appendChild(bookingCard(b));
      prevEnd = endOf(b.time, b.dur);
    });
    $('#agCount').textContent = all.length + (all.length === 1 ? ' cita' : ' citas');
  }

  function bookingCard(b) {
    var svs = svsDe(b);
    var stf = b.staffId ? S.staffMember(b.staffId) : null;
    var c = el('div', 'bkc' + (b.status === 'hecha' ? ' ok' : ''));
    c.innerHTML =
      '<div class="bkc-h"><span class="bkc-t">' + b.time + '</span>' +
      '<span class="bkc-n">' + esc(b.name) + (stf ? '<span class="sf-tag">' + esc(stf.nm) + '</span>' : '') + '</span>' +
      (b.status === 'nueva' ? '<span class="pill new">nueva</span>' : '') +
      (b.status === 'hecha' ? '<span class="pill done">hecha</span>' : '') +
      (b.status === 'noshow' ? '<span class="pill src">no vino</span>' : '') +
      (b.source === 'panel' ? '<span class="pill src">a mano</span>' : '') + '</div>' +
      '<div class="bkc-s">' + esc(svs || 'Cita') + ' · ' + S.dur(b.dur) +
      (b.total > 0 ? ' · ' + S.money(b.total) : '') + '</div>' +
      (b.notes ? '<div class="bkc-nota">📝 ' + esc(b.notes) + '</div>' : '') +
      (notaCliente(b) ? '<div class="bkc-nota ficha">📌 De su ficha: ' + esc(notaCliente(b)) + '</div>' : '');
    var cn = el('div', 'bkc-c');
    var tel = telHref(b.phone);
    if (tel) {
      var msg = 'Hola ' + String(b.name).split(' ')[0] + ', te confirmo tu cita en ' + B.name + ' el ' +
        S.fmtDateShort(b.date) + ' a las ' + b.time + (svs ? ' (' + svs + ')' : '') + '. ¡Te esperamos!';
      cn.innerHTML = '<a class="mini" href="tel:' + tel + '">Llamar</a>' +
        '<a class="mini wa" href="' + esc(waHref(b, msg)) + '" target="_blank" rel="noopener">WhatsApp</a>';
    }
    if (b.status === 'nueva') {
      var cf = el('button', 'mini ok', 'Vista ✓');
      cf.onclick = function () { S.setStatus(b.id, 'confirmada'); };
      cn.appendChild(cf);
    }
    var ok = el('button', 'mini ok', b.status === 'hecha' ? 'Deshacer' : 'Hecha');
    ok.onclick = function () { S.setStatus(b.id, b.status === 'hecha' ? 'confirmada' : 'hecha'); };
    var no = el('button', 'mini no', 'Anular');
    no.onclick = function () {
      if (!confirm('¿Anular la cita de ' + b.name + '? El hueco volverá a quedar libre en la web.')) return;
      S.setStatus(b.id, 'cancelada').then(function () { if (window.Clientes) window.Clientes.recargar(); });
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
    if (!all.length) { w.appendChild(el('p', 'empty', 'Todavía no hay reservas. En cuanto alguien reserve en la web, aparece aquí.')); return; }
    var cur = '';
    all.forEach(function (b) {
      if (b.date !== cur) { cur = b.date; w.appendChild(el('div', 'list-h', S.fmtDate(b.date))); }
      var stf = b.staffId ? S.staffMember(b.staffId) : null;
      var tel = telHref(b.phone);
      var c = el('div', 'lrow' + (b.seen ? '' : ' unseen'));
      c.innerHTML = '<div class="lt">' + b.time + '</div>' +
        '<div class="lm"><b>' + esc(b.name) + (stf ? '<span class="sf-tag">' + esc(stf.nm) + '</span>' : '') + '</b><span>' + esc(svsDe(b)) + '</span>' +
        '<span class="lsm">' + (tel ? '<a href="tel:' + tel + '">' + esc(b.phone) + '</a>' : '') +
        (b.notes ? ' · ' + esc(b.notes) : '') + '</span></div>' +
        '<div class="lr">' + (b.total > 0 ? S.money(b.total) : '—') + '</div>';
      c.onclick = function (e) {
        if (e.target.tagName === 'A') return;
        day = b.date; agCal = S.fromYmd(b.date); agStaff = null; setTab('agenda');
      };
      w.appendChild(c);
    });
  }

  /* ---------------- disponibilidad ---------------- */
  function renderAvail() {
    var st = S.get();
    $('#avDate').value = avDate;
    renderStaffFilter($('#avStaffFilter'), avStaff, true, function (id) { avStaff = id; renderAvail(); });
    $('#avStaffCard').style.display = S.staff().length ? '' : 'none';
    $('#avHoursTtl').textContent = avStaff ? 'Horario semanal de ' + S.staffMember(avStaff).nm : 'Horario del negocio';

    var closed = avStaff
      ? (st.staffClosed[avStaff] || []).indexOf(avDate) >= 0
      : st.closed.indexOf(avDate) >= 0;
    $('#avClose').textContent = closed ? 'Abrir este día' : 'Cerrar todo el día';
    $('#avClose').classList.toggle('warn', !closed);

    var w = $('#avSlots'); w.innerHTML = '';
    var list = S.slots(avDate, avStaff);
    if (!list.length) { w.appendChild(el('p', 'empty', 'Día cerrado: no se puede reservar en la web.')); }
    list.forEach(function (s) {
      var c = el('button', 'av ' + s.state); c.type = 'button';
      c.innerHTML = s.t + '<i>' + (s.state === 'busy' ? 'reservado' : s.state === 'blocked' ? 'bloqueado' : s.state === 'past' ? 'pasada' : 'libre') + '</i>';
      if (s.state === 'busy' || s.state === 'past') c.disabled = true;
      else c.onclick = function () { S.toggleBlock(avDate, s.t, avStaff); };
      w.appendChild(c);
    });

    var h = $('#avHours'); h.innerHTML = '';
    var stfDef = avStaff ? S.staffMember(avStaff) : null;
    [1, 2, 3, 4, 5, 6, 0].forEach(function (wd) {
      var rs = avStaff
        ? (st.staffHours[avStaff] && st.staffHours[avStaff][wd] !== undefined ? st.staffHours[avStaff][wd]
          : ((stfDef && stfDef.hours && stfDef.hours[wd]) || st.hours[wd] || []))
        : (st.hours[wd] || []);
      var row = el('div', 'hrow');
      row.innerHTML = '<span class="hd">' + S.DIAS[wd] + '</span>';
      var box = el('div', 'hin');
      if (!rs.length) box.appendChild(el('span', 'hcl', 'Cerrado'));
      rs.forEach(function (r, i) {
        [0, 1].forEach(function (k) {
          var inp = el('input'); inp.type = 'time'; inp.value = r[k]; inp.step = 900;
          inp.onchange = function () {
            var copy = JSON.parse(JSON.stringify(rs)); copy[i][k] = inp.value;
            if (copy[i][0] >= copy[i][1]) { pop('La hora de cierre tiene que ser después de la de apertura.'); renderAvail(); return; }
            S.setHours(wd, copy, avStaff);
          };
          box.appendChild(inp);
          if (k === 0) box.appendChild(el('span', 'hsep', '–'));
        });
        if (i === 0 && rs.length > 1) box.appendChild(el('span', 'hsep2', 'y'));
      });
      if (rs.length === 1) {
        var tarde = el('button', 'hadd', '+ tarde'); tarde.type = 'button';
        tarde.onclick = function () { S.setHours(wd, [rs[0], ['17:00', '20:00']], avStaff); };
        box.appendChild(tarde);
      } else if (rs.length === 2) {
        var quitar = el('button', 'hadd', 'solo mañana'); quitar.type = 'button';
        quitar.onclick = function () { S.setHours(wd, [rs[0]], avStaff); };
        box.appendChild(quitar);
      }
      var fallback = (B.hours && B.hours[wd] && B.hours[wd].length) ? B.hours[wd] : [['10:00', '14:00']];
      var t = el('button', 'hto' + (rs.length ? ' on' : '')); t.type = 'button';
      t.textContent = rs.length ? 'Abierto' : 'Cerrado';
      t.onclick = function () { S.setHours(wd, rs.length ? [] : JSON.parse(JSON.stringify(fallback)), avStaff); };
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
    var mesIni = t0.slice(0, 8) + '01';
    var mes = st.bookings.filter(function (b) { return b.source === 'web' && b.date >= mesIni && b.date <= t0.slice(0, 8) + '31'; }).length;
    $('#stats').innerHTML =
      stat(week.length, 'citas los próximos 7 días') +
      stat(S.money(rev), 'facturación prevista') +
      stat(web, 'reservadas solas por la web esta semana') +
      stat(offh, 'llegaron con el negocio cerrado') +
      stat(mes, 'reservas por la web este mes');
  }
  function stat(v, l) { return '<div class="st"><b>' + v + '</b><span>' + l + '</span></div>'; }

  /* ---------------- apuntar una cita a mano (la que entra por teléfono) ---------------- */
  function openManual(date, time, pre) {
    var m = $('#manual');
    m.classList.add('show');
    $('#mWhen').textContent = S.fmtDate(date);
    $('#mErr').textContent = '';
    if (pre) { $('#mName').value = pre.nombre || ''; $('#mPhone').value = pre.tel || ''; }
    listaClientes();

    var stfSel = $('#mStaff');
    stfSel.innerHTML = '<option value="">Cualquiera libre</option>' +
      S.staff().map(function (s) { return '<option value="' + esc(s.id) + '">' + esc(s.nm) + ' · ' + esc(s.role) + '</option>'; }).join('');
    stfSel.value = agStaff || '';
    $('#mStaffBox').style.display = S.staff().length ? '' : 'none';

    function refreshTimes() {
      var staffId = stfSel.value || (S.staff().length ? S.staff().map(function (s) { return s.id; }) : null);
      var free = S.slots(date, staffId).filter(function (s) { return s.state === 'free'; });
      var tsel = $('#mTime');
      var keep = tsel.value;
      tsel.innerHTML = free.map(function (s) { return '<option value="' + s.t + '">' + s.t + '</option>'; }).join('');
      if (time && free.some(function (s) { return s.t === time; })) tsel.value = time;
      else if (keep) tsel.value = keep;
      $('#mErr').textContent = free.length ? '' : 'No queda ningún hueco libre este día para quien has elegido.';
      $('#mSave').disabled = !free.length;
      return free;
    }
    stfSel.onchange = refreshTimes;
    refreshTimes();

    var box = $('#mSvcs'); box.innerHTML = '';
    B.services.forEach(function (s) {
      var c = el('button', 'msv'); c.type = 'button'; c.dataset.id = s.id;
      c.textContent = s.nm;
      c.onclick = function () { c.classList.toggle('on'); };
      box.appendChild(c);
    });

    $('#mSave').onclick = function () {
      var nm = $('#mName').value.trim();
      if (nm.length < 2) { $('#mErr').textContent = 'Pon al menos el nombre.'; return; }
      var t = $('#mTime').value;
      var staffId = stfSel.value || null;
      var ids = [].slice.call(box.querySelectorAll('.msv.on')).map(function (c) { return c.dataset.id; });
      var dur = 0;
      ids.forEach(function (id) { dur += S.service(id).du; });
      if (!ids.length) dur = B.slotMin;
      var spec = staffId || (ids.length ? S.staffForServices(ids) : (S.staff().length ? S.staff().map(function (s) { return s.id; }) : null));
      if (!S.canFit(date, t, dur, spec)) { $('#mErr').textContent = 'No cabe ahí: elige menos servicios, otra hora u otra persona.'; return; }
      var btn = $('#mSave'); btn.disabled = true; btn.textContent = 'Guardando…';
      S.book({ date: date, time: t, services: ids, staffId: staffId, name: nm, phone: $('#mPhone').value.trim(), source: 'panel' })
        .then(function () {
          closeManual(); pop('✓ Cita apuntada: ' + esc(nm) + ' a las ' + t);
          if (window.Clientes) window.Clientes.recargar();
        })
        .catch(function (e) { $('#mErr').textContent = e.message || 'No se pudo guardar.'; })
        .then(function () { btn.disabled = false; btn.textContent = 'Guardar cita'; });
    };
  }
  /* al apuntar a mano, el nombre se autocompleta con los clientes que ya han venido */
  var cacheClientes = null;
  function listaClientes() {
    var dl = $('#mClientes');
    function pinta() {
      if (!cacheClientes) return;
      dl.innerHTML = cacheClientes.slice(0, 400).map(function (c) {
        return '<option value="' + esc(c.nombre) + '">' + esc(c.telefono || '') + '</option>';
      }).join('');
    }
    if (cacheClientes) { pinta(); return; }
    S.pedir('/ejemplos/reservas-jyc-widy/api/panel', { accion: 'clientes' }).then(function (j) { cacheClientes = j.clientes || []; pinta(); }).catch(function () {});
  }
  /* si elige a uno de la lista, se rellena su móvil */
  function engancharAutocompletar() {
    $('#mName').addEventListener('input', function () {
      if (!cacheClientes) return;
      var v = this.value.trim().toLowerCase();
      var c = cacheClientes.filter(function (x) { return String(x.nombre).toLowerCase() === v; })[0];
      if (c && c.telefono && !$('#mPhone').value) $('#mPhone').value = c.telefono;
    });
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
      var stf = b.staffId ? S.staffMember(b.staffId) : null;
      pop('🔔 Nueva reserva · <b>' + esc(b.name) + '</b>' + (stf ? ' con ' + esc(stf.nm) : '') + '<br>' + esc(svsDe(b)) + ' — ' + S.fmtDateShort(b.date) + ' a las ' + b.time);
      if (navigator.vibrate) try { navigator.vibrate([60, 40, 60]); } catch (e) {}
    }
    var unseen = S.get().bookings.filter(function (b) { return !b.seen && b.status !== 'cancelada'; }).length;
    var dot = $('#badge');
    dot.textContent = unseen; dot.classList.toggle('show', unseen > 0);
  }
  var pt;
  function pop(html) {
    var t = $('#pop'); t.innerHTML = html; t.classList.add('show');
    clearTimeout(pt); pt = setTimeout(function () { t.classList.remove('show'); }, 5000);
  }

  /* ---------------- render / arranque ---------------- */
  function renderAll() {
    if (tab === 'agenda') { renderStaffFilter($('#agStaffFilter'), agStaff, false, function (id) { agStaff = id; renderAgenda(); }); renderAgenda(); }
    if (tab === 'list') renderList();
    if (tab === 'avail') renderAvail();
    if (tab === 'stats') renderStats();
    checkNew();
  }
  var ED = { web: 1, servicios: 1 };
  function setTab(t) {
    if (window.Editor && ED[tab] && !ED[t] && !window.Editor.puedeSalir()) return;
    tab = t;
    document.querySelectorAll('.tab').forEach(function (b) { b.classList.toggle('on', b.dataset.tab === t); });
    document.querySelectorAll('.pane').forEach(function (p) { p.classList.toggle('show', p.id === 'pane-' + t); });
    $('#fab').classList.toggle('hide', t !== 'agenda');
    if (t === 'list') S.markSeen();
    if (ED[t] && window.Editor) window.Editor.abrir(t);
    if (t === 'clientes' && window.Clientes) window.Clientes.abrir();
    if (t === 'ajustes' && window.Ajustes) window.Ajustes.abrir();
    renderAll();
    window.scrollTo(0, 0);
  }

  function start() {
    B = S.biz();
    $('#bizName').textContent = B.name;
    document.title = 'Panel · ' + B.name;
    S.get().bookings.forEach(function (b) { known[b.id] = 1; });

    document.querySelectorAll('.tab').forEach(function (b) { b.onclick = function () { setTab(b.dataset.tab); }; });
    $('#agPrev').onclick = function () { var d = S.fromYmd(day); d.setDate(d.getDate() - 1); day = S.ymd(d); agCal = S.fromYmd(day); renderAgenda(); };
    $('#agNext').onclick = function () { var d = S.fromYmd(day); d.setDate(d.getDate() + 1); day = S.ymd(d); agCal = S.fromYmd(day); renderAgenda(); };
    $('#agToday').onclick = function () { day = S.today(); agCal = new Date(); renderAgenda(); };
    $('#agCalPrev').onclick = function () { agCal.setMonth(agCal.getMonth() - 1); renderAgCal(); };
    $('#agCalNext').onclick = function () { agCal.setMonth(agCal.getMonth() + 1); renderAgCal(); };
    $('#avDate').onchange = function () { if (this.value) { avDate = this.value; renderAvail(); } };
    $('#avClose').onclick = function () { S.setClosed(avDate, (avStaff ? (S.get().staffClosed[avStaff] || []) : S.get().closed).indexOf(avDate) < 0, avStaff); };
    $('#mClose').onclick = closeManual;
    $('#manual').onclick = function (e) { if (e.target === this) closeManual(); };
    $('#fab').onclick = function () { openManual(day, null); };

    S.onError(function (msg) { pop('⚠️ ' + esc(msg)); });
    S.onSesion(function () {
      pop('Tu sesión ha caducado. Vuelve a entrar.');
      setTimeout(function () { location.reload(); }, 1600);
    });
    setTab('agenda');
    ready = true;
    S.on(function () { if (!ED[tab] && tab !== 'ajustes' && tab !== 'clientes') renderAll(); else checkNew(); });
    S.vigilar(15000);
    setInterval(function () { if (tab === 'agenda') renderAgenda(); }, 60000);
    engancharAutocompletar();
    if (window.Clientes) { window.Clientes.precargar(); setTimeout(renderAll, 1200); }
    window.Panel = {
      pop: pop, setTab: setTab,
      apuntarPara: function (nombre, tel) { setTab('agenda'); openManual(day, null, { nombre: nombre, tel: tel }); }
    };
  }

  document.addEventListener('DOMContentLoaded', gate);
})();
