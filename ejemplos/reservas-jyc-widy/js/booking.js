/* Widy · asistente de reserva del cliente */
(function () {
  'use strict';
  var B = window.BIZ, S = window.Store;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var el = function (t, c, h) { var e = document.createElement(t); if (c) e.className = c; if (h != null) e.innerHTML = h; return e; };

  var sel = { services: [], date: null, time: null, staff: null };
  var step = 1, cal = new Date(), lastBooking = null, comboImpossible = false;
  /* con quién trabajamos ahora mismo: la elegida a mano, o "cualquiera apta" para lo escogido */
  function eligibleStaff() { return S.staffForServices(sel.services); }
  function staffSpec() { return sel.staff || eligibleStaff(); }
  var slug = function (s) { return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-'); };

  /* ---------------- totales ---------------- */
  function chosen() { return sel.services.map(function (id) { return S.service(id); }).filter(Boolean); }
  function totals() {
    var t = { dur: 0, price: 0, dep: 0, custom: false };
    chosen().forEach(function (s) {
      t.dur += s.du; t.price += (s.pr || 0); t.dep += (s.dep || 0);
      if (s.custom) t.custom = true;
    });
    return t;
  }
  function priceLabel(t) {
    if (t.custom) return t.price > 0 ? 'desde ' + S.money(t.price) : 'a presupuesto';
    return t.price > 0 ? S.money(t.price) : 'Gratis';
  }

  /* ---------------- paso 1 · servicios ---------------- */
  function renderServices() {
    var box = $('#svcList'); box.innerHTML = '';
    var cats = {};
    B.services.forEach(function (s) { (cats[s.cat] || (cats[s.cat] = [])).push(s); });
    var catKeys = Object.keys(cats);
    if (catKeys.length > 1) {
      var nav = el('div', 'cat-nav');
      catKeys.forEach(function (c) {
        var b = el('button', 'cat-pill'); b.type = 'button'; b.textContent = c;
        b.onclick = function () {
          var t = $('#cat-' + slug(c));
          if (t) t.scrollIntoView({ behavior: 'smooth', block: 'start' });
        };
        nav.appendChild(b);
      });
      box.appendChild(nav);
    }
    catKeys.forEach(function (c) {
      var h = el('div', 'cat-h', c); h.id = 'cat-' + slug(c);
      box.appendChild(h);
      cats[c].forEach(function (s) {
        var on = sel.services.indexOf(s.id) >= 0;
        var it = el('button', 'svc' + (on ? ' on' : ''));
        it.type = 'button';
        it.innerHTML =
          '<span class="svc-ic">' + s.ic + '</span>' +
          '<span class="svc-mid"><span class="svc-nm">' + s.nm + '</span>' +
          '<span class="svc-du">' + S.dur(s.du) + (s.dep ? ' · señal ' + S.money(s.dep) : '') + '</span></span>' +
          '<span class="svc-pr">' + (s.custom ? 'presupuesto' : (s.pr > 0 ? S.money(s.pr) : 'Gratis')) + '</span>' +
          '<span class="tick"><svg viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg></span>';
        it.onclick = function () {
          var i = sel.services.indexOf(s.id);
          if (i >= 0) sel.services.splice(i, 1); else sel.services.push(s.id);
          sel.time = null;
          renderServices(); renderSummary(); renderStaffPick(); renderQuick(); renderCalendar(); renderSlots(); syncBar();
        };
        box.appendChild(it);
      });
    });
  }
  function renderSummary() {
    var b = $('#svcSum'), t = totals();
    if (!sel.services.length) { b.classList.remove('show'); b.innerHTML = ''; return; }
    b.classList.add('show');
    b.innerHTML = '<div class="sum-l"><b>' + sel.services.length + '</b> ' +
      (sel.services.length === 1 ? 'servicio' : 'servicios') + ' · ' + S.dur(t.dur) + '</div>' +
      '<div class="sum-r">' + priceLabel(t) + '</div>';
  }
  /* con quién: solo aparece cuando ya hay servicios elegidos, y solo si hay de verdad donde elegir */
  function renderStaffPick() {
    var box = $('#staffPick');
    var elig = eligibleStaff();
    comboImpossible = sel.services.length > 1 && !elig.length;
    if (!sel.services.length) {
      box.classList.remove('show'); box.innerHTML = ''; sel.staff = null;
      return;
    }
    if (sel.staff && elig.indexOf(sel.staff) < 0) sel.staff = null;   // cambió el servicio: ya no aplica
    box.classList.add('show');

    if (comboImpossible) {
      box.innerHTML = '<p class="stf-lbl">¿Con quién?</p><div class="stf-warn">' +
        'Estos servicios los hace cada uno una persona distinta de la casa: no caben en la misma cita. ' +
        'Quita alguno o resérvalos en dos citas separadas.</div>';
      return;
    }

    /* solo hay una persona posible: no hace falta elegir, pero se dice siempre quién es */
    if (elig.length === 1) {
      sel.staff = elig[0];
      var only = S.staffMember(elig[0]);
      box.innerHTML = '<p class="stf-lbl">Te atiende</p><div class="stf-row">' +
        '<button type="button" class="stf on" disabled><span class="stf-av">' + only.nm.charAt(0) +
        '</span><span class="stf-nm">' + only.nm + '</span><span class="stf-rl">' + only.role + '</span></button></div>';
      return;
    }

    box.innerHTML = '<p class="stf-lbl">¿Con quién?</p>';
    var row = el('div', 'stf-row');
    var any = el('button', 'stf' + (!sel.staff ? ' on' : '')); any.type = 'button';
    any.innerHTML = '<span class="stf-av">🤝</span><span class="stf-nm">Cualquiera</span><span class="stf-rl">la primera libre</span>';
    any.onclick = function () { sel.staff = null; pickStaff(); };
    row.appendChild(any);
    elig.forEach(function (id) {
      var m = S.staffMember(id); if (!m) return;
      var on = sel.staff === id;
      var b = el('button', 'stf' + (on ? ' on' : '')); b.type = 'button';
      b.innerHTML = '<span class="stf-av">' + m.nm.charAt(0) + '</span><span class="stf-nm">' + m.nm + '</span><span class="stf-rl">' + m.role + '</span>';
      b.onclick = function () { sel.staff = id; pickStaff(); };
      row.appendChild(b);
    });
    box.appendChild(row);
  }
  function pickStaff() {
    sel.time = null;
    renderStaffPick(); renderQuick(); renderCalendar(); renderSlots(); syncBar();
  }

  /* ---------------- paso 2 · huecos inmediatos ---------------- */
  function dayLabel(ds) {
    var t = S.today(), d = S.fromYmd(t); d.setDate(d.getDate() + 1);
    if (ds === t) return 'Hoy';
    if (ds === S.ymd(d)) return 'Mañana';
    var x = S.fromYmd(ds);
    return S.DIAS_C[x.getDay()] + ' ' + x.getDate();
  }
  function renderQuick() {
    var box = $('#quick'); box.innerHTML = '';
    var t = totals(), list = S.nextSlots(t.dur, 4, staffSpec());
    if (!list.length) {
      box.innerHTML = '<p class="hint">Ahora mismo no quedan huecos para lo que has elegido. Mira otros días abajo.</p>';
      openCal(true); return;
    }
    list.forEach(function (q, i) {
      var b = el('button', 'qk' + (sel.date === q.date && sel.time === q.time ? ' on' : ''));
      b.type = 'button';
      b.innerHTML = '<span class="qk-d">' + dayLabel(q.date) + '</span><span class="qk-t">' + q.time + '</span>' +
        (i === 0 ? '<span class="qk-tag">lo antes posible</span>' : '');
      b.onclick = function () {
        sel.date = q.date; sel.time = q.time;
        renderQuick(); renderCalendar(); renderSlots(); syncBar();
        go(3);                                   // directo a confirmar: dos toques y fuera
      };
      box.appendChild(b);
    });
  }
  function openCal(show) {
    var box = $('#calBox'), btn = $('#moreDays');
    box.classList.toggle('open', show);
    btn.classList.toggle('open', show);
    btn.querySelector('span').textContent = show ? 'Ocultar el calendario' : 'Prefiero otro día';
  }

  /* ---------------- calendario ---------------- */
  function renderCalendar() {
    var t = totals();
    $('#calTitle').textContent = S.MESES[cal.getMonth()] + ' ' + cal.getFullYear();
    var grid = $('#calGrid'); grid.innerHTML = '';
    ['L', 'M', 'X', 'J', 'V', 'S', 'D'].forEach(function (d) { grid.appendChild(el('div', 'cal-dow', d)); });
    S.monthMatrix(cal.getFullYear(), cal.getMonth(), t.dur, staffSpec()).forEach(function (d) {
      if (!d) { grid.appendChild(el('div', 'cal-x')); return; }
      var n = S.fromYmd(d.date).getDate();
      var c = el('button', 'cal-d'); c.type = 'button';
      c.innerHTML = '<span>' + n + '</span>' + (d.free ? '<i class="dot"></i>' : '');
      if (d.past || d.closed || !d.free) { c.classList.add('off'); c.disabled = true; }
      if (d.date === S.today()) c.classList.add('now');
      if (d.date === sel.date) c.classList.add('on');
      if (d.free && d.free <= 3) c.classList.add('few');
      c.onclick = function () { sel.date = d.date; sel.time = null; renderCalendar(); renderQuick(); renderSlots(); syncBar(); };
      grid.appendChild(c);
    });
    var prev = $('#calPrev');
    var m0 = new Date(); m0.setDate(1);
    prev.disabled = (cal.getFullYear() === m0.getFullYear() && cal.getMonth() === m0.getMonth());
  }

  function renderSlots() {
    var w = $('#slotWrap'), t = totals();
    if (!sel.date) {
      w.innerHTML = '<p class="hint">Elige un día en el calendario para ver las horas libres.</p>';
      return;
    }
    var spec = staffSpec();
    var list = S.slots(sel.date, spec);
    if (!list.length) { w.innerHTML = '<p class="hint">Ese día está cerrado.</p>'; return; }
    w.innerHTML = '<p class="slot-date">' + S.fmtDate(sel.date) + '</p>';
    var groups = {};
    list.forEach(function (s) { (groups[s.r] || (groups[s.r] = [])).push(s); });
    var free = 0;
    Object.keys(groups).forEach(function (k) {
      var arr = groups[k];
      w.appendChild(el('div', 'slot-lbl', S.toMin(arr[0].t) < 840 ? 'Mañana' : 'Tarde'));
      var g = el('div', 'slots');
      arr.forEach(function (s) {
        var fits = s.state === 'free' && (!t.dur || S.canFit(sel.date, s.t, t.dur, spec));
        var c = el('button', 'slot'); c.type = 'button'; c.textContent = s.t;
        if (!fits) {
          c.classList.add('busy'); c.disabled = true;
          c.title = s.state === 'busy' ? 'Ya reservado' : s.state === 'blocked' ? 'No disponible' :
            s.state === 'past' ? 'Hora pasada' : 'No hay tiempo suficiente para los servicios elegidos';
        } else {
          free++;
          if (sel.time === s.t) c.classList.add('on');
          c.onclick = function () { sel.time = s.t; renderSlots(); renderQuick(); syncBar(); go(3); };
        }
        g.appendChild(c);
      });
      w.appendChild(g);
    });
    if (!free) w.appendChild(el('p', 'hint', 'No quedan huecos ese día para lo que has elegido. Prueba otro día.'));
  }

  /* ---------------- paso 3 · datos ---------------- */
  function validate(show) {
    var ok = true;
    [['fName', function (v) { return v.trim().length >= 2; }],
     ['fPhone', function (v) { return /^\+?\d{9,15}$/.test(v.replace(/[\s.-]/g, '')); }]
    ].forEach(function (p) {
      var f = $('#' + p[0]), good = p[1](f.value);
      if (!good) ok = false;
      if (show) f.parentNode.classList.toggle('bad', !good);
    });
    return ok;
  }

  /* ---------------- navegación ---------------- */
  function go(n) {
    step = n;
    ['1', '2', '3'].forEach(function (i) {
      $('#step' + i).classList.toggle('show', i === String(n));
      var d = $('#dot' + i);
      d.classList.toggle('on', +i === n);
      d.classList.toggle('done', +i < n);
    });
    syncBar();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  function syncBar() {
    var btn = $('#cta'), back = $('#back'), t = totals();
    back.style.display = step > 1 ? 'flex' : 'none';
    if (step === 1) {
      btn.disabled = !sel.services.length || comboImpossible;
      btn.innerHTML = comboImpossible ? 'Quita alguno para poder reservar'
        : sel.services.length
        ? 'Continuar · ' + S.dur(t.dur) + ' <small>' + priceLabel(t) + '</small>'
        : 'Elige al menos un servicio';
    } else if (step === 2) {
      btn.disabled = !(sel.date && sel.time);
      btn.innerHTML = (sel.date && sel.time)
        ? 'Continuar · ' + S.fmtDateShort(sel.date) + ' a las ' + sel.time
        : (sel.date ? 'Elige una hora' : 'Toca uno de los huecos de arriba');
    } else {
      btn.disabled = false;
      btn.innerHTML = 'Confirmar mi cita';
    }
  }

  /* ---------------- confirmar ---------------- */
  var enviando = false;
  function confirmBooking() {
    if (enviando) return;
    if (!validate(true)) {
      var bad = $('.field.bad');
      if (bad) bad.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    var t = totals(), spec = staffSpec();
    if (!S.canFit(sel.date, sel.time, t.dur, spec)) {   // alguien lo cogió mientras rellenaba
      toast('Vaya, ese hueco se acaba de ocupar. Elige otra hora.', 'warn');
      sel.time = null; go(2); renderSlots(); return;
    }
    var btn = $('#cta');
    enviando = true; btn.disabled = true; btn.innerHTML = 'Guardando tu cita…';
    S.book({
      date: sel.date, time: sel.time, services: sel.services.slice(), staffId: sel.staff || null,
      name: $('#fName').value.trim(), phone: $('#fPhone').value.replace(/[\s.-]/g, ''),
      notes: $('#fNotes').value.trim(), web: $('#fWeb').value, source: 'web'
    }).then(function (b) {
      lastBooking = b;
      /* la próxima vez no tendrá que volver a escribirlo, y puede volver a ver o anular su cita */
      try {
        localStorage.setItem('widy:cliente', JSON.stringify({ name: b.name, phone: b.phone }));
        var mias = JSON.parse(localStorage.getItem('widy:citas:' + B.id) || '[]')
          .filter(function (c) { return c.date >= S.today(); });
        mias.push({ c: b.id, t: b.token, date: b.date, time: b.time, nombres: b.nombres });
        localStorage.setItem('widy:citas:' + B.id, JSON.stringify(mias.slice(-5)));
      } catch (e) {}
      enviando = false;
      renderDone();
    }).catch(function (e) {
      enviando = false; syncBar();
      if (e.status === 409) {
        toast(e.message || 'Ese hueco se acaba de ocupar. Elige otra hora.', 'warn');
        sel.time = null; S.refrescar().then(function () { go(2); renderQuick(); renderCalendar(); renderSlots(); });
      } else {
        toast(e.message && e.status ? e.message : 'No hay conexión. Revisa internet y vuelve a darle.', 'warn');
      }
    });
  }

  function citaUrl(b) { return '/ejemplos/reservas-jyc-widy/cita?c=' + encodeURIComponent(b.id) + '&t=' + encodeURIComponent(b.token); }

  function renderDone() {
    var b = lastBooking, t = totals();
    var stf = b.staffId ? S.staffMember(b.staffId) : null;
    $('#wizard').style.display = 'none';
    $('#bar').style.display = 'none';
    $('#done').classList.add('show');
    $('#recap').innerHTML =
      chosen().map(function (s) {
        return '<div class="r-row"><span>' + s.ic + ' ' + s.nm + '</span><b>' +
          (s.custom ? 'presupuesto' : (s.pr > 0 ? S.money(s.pr) : 'Gratis')) + '</b></div>';
      }).join('') +
      '<div class="r-row"><span>Fecha</span><b>' + S.fmtDate(b.date) + '</b></div>' +
      '<div class="r-row"><span>Hora</span><b>' + b.time + ' · ' + S.dur(b.dur) + '</b></div>' +
      (stf ? '<div class="r-row"><span>Te atiende</span><b>' + stf.nm + '</b></div>' : '') +
      '<div class="r-row tot"><span>Total</span><b>' + priceLabel(t) + '</b></div>' +
      (b.deposit ? '<div class="r-row"><span>Señal para bloquear el hueco</span><b>' + S.money(b.deposit) + '</b></div>' : '');
    $('#doneTxt').textContent = 'Ya está en la agenda de ' + B.name + '. Te esperamos' + (stf ? ', te atiende ' + stf.nm : '') + '.';
    $('#icsBtn').href = '/ejemplos/reservas-jyc-widy/api/reserva?c=' + encodeURIComponent(b.id) + '&t=' + encodeURIComponent(b.token) + '&ics=1';
    $('#citaBtn').href = citaUrl(b);
    var wa = $('#waSalon');
    if (B.whatsapp) {
      wa.style.display = '';
      wa.href = 'https://wa.me/' + B.whatsapp + '?text=' + encodeURIComponent('Hola, soy ' + b.name + '. Tengo cita el ' +
        S.fmtDateShort(b.date) + ' a las ' + b.time + ' (' + b.nombres + ').');
    } else wa.style.display = 'none';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /* si ya tiene cita pendiente reservada desde este móvil, se la recordamos arriba */
  function renderMias() {
    var box = $('#mias'); if (!box) return;
    var mias = [];
    try { mias = JSON.parse(localStorage.getItem('widy:citas:' + B.id) || '[]').filter(function (c) { return c.date >= S.today(); }); } catch (e) {}
    if (!mias.length) { box.innerHTML = ''; return; }
    box.innerHTML = mias.map(function (c) {
      return '<a class="mia" href="/ejemplos/reservas-jyc-widy/cita?c=' + encodeURIComponent(c.c) + '&t=' + encodeURIComponent(c.t) + '">' +
        '<span>📅 Tienes cita el <b>' + S.fmtDateShort(c.date) + '</b> a las <b>' + c.time + '</b></span><i>Ver o anular →</i></a>';
    }).join('');
  }

  /* ---------------- avisos ---------------- */
  var tt;
  function toast(msg, kind) {
    var t = $('#toast');
    t.textContent = msg; t.className = 'toast show ' + (kind || '');
    clearTimeout(tt); tt = setTimeout(function () { t.className = 'toast'; }, 4200);
  }

  /* ---------------- arranque ---------------- */
  function init() {
    if (!S.ok) {
      $('#wizard').innerHTML = '<section class="card"><h2>No hemos podido cargar la agenda</h2>' +
        '<p class="sub">Revisa la conexión y recarga la página.</p></section>';
      $('#bar').style.display = 'none';
      return;
    }
    document.title = 'Reservar cita · ' + B.name;
    $('#bizName').textContent = B.name;
    $('#bizAddr').textContent = B.address;
    document.querySelectorAll('.js-tel').forEach(function (a) { a.href = 'tel:+' + (String(B.phone).length === 9 ? '34' : '') + B.phone; });
    renderMias();

    renderServices(); renderSummary(); renderStaffPick(); renderQuick(); renderCalendar(); renderSlots(); go(1);

    /* si ya reservó antes, no le hacemos escribirlo otra vez */
    try {
      var c = JSON.parse(localStorage.getItem('widy:cliente') || 'null');
      if (c && c.name) {
        $('#fName').value = c.name; $('#fPhone').value = c.phone || '';
        $('#saved').classList.add('show');
      }
    } catch (e) {}

    $('#moreDays').onclick = function () { openCal(!$('#calBox').classList.contains('open')); };
    $('#calPrev').onclick = function () { cal.setMonth(cal.getMonth() - 1); renderCalendar(); };
    $('#calNext').onclick = function () { cal.setMonth(cal.getMonth() + 1); renderCalendar(); };
    $('#cta').onclick = function () { step < 3 ? go(step + 1) : confirmBooking(); };
    $('#back').onclick = function () { go(step - 1); };
    $('#again').onclick = function () {
      sel = { services: [], date: null, time: null, staff: null }; lastBooking = null;
      $('#done').classList.remove('show'); $('#wizard').style.display = '';
      $('#bar').style.display = ''; $('#fNotes').value = '';
      document.querySelectorAll('.field').forEach(function (f) { f.classList.remove('bad'); });
      openCal(false);
      renderServices(); renderSummary(); renderStaffPick(); renderQuick(); renderCalendar(); renderSlots(); go(1);
    };
    ['fName', 'fPhone'].forEach(function (i) {
      $('#' + i).addEventListener('input', function () {
        if (this.parentNode.classList.contains('bad')) validate(true);
      });
    });

    /* el dueño toca la agenda desde el panel -> se actualiza aquí al instante */
    S.vigilar(30000);
    S.on(function () {
      if ($('#done').classList.contains('show') || enviando) return;
      renderMias();
      renderCalendar(); renderQuick();
      if (sel.date) {
        var t = totals();
        if (sel.time && !S.canFit(sel.date, sel.time, t.dur, staffSpec())) {
          sel.time = null;
          toast('Ese hueco se acaba de ocupar. Elige otra hora.', 'warn');
        }
        renderSlots(); syncBar();
      }
    });
  }
  document.addEventListener('DOMContentLoaded', init);
})();
