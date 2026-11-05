/* Widy · el dueño edita su negocio desde el panel:
   pestaña «Servicios» (carta, precios y equipo) y pestaña «Mi web» (textos y fotos).
   Las dos comparten el mismo borrador y se guardan solas. */
(function () {
  'use strict';
  var S = window.Store;
  if (!S || !S.panel) return;

  var $ = function (s, c) { return (c || document).querySelector(s); };
  var el = function (t, c, h) { var e = document.createElement(t); if (c) e.className = c; if (h != null) e.innerHTML = h; return e; };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (x) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[x]; }); };
  var clone = function (o) { return JSON.parse(JSON.stringify(o)); };
  var uid = function (p) { return (p || 's') + Math.random().toString(36).slice(2, 8); };
  var normal = function (s) { return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); };

  var draft = null, sucio = false, guardando = false, tempo = null;
  var abiertas = {}, svcAbierto = null, busca = '';

  /* ---------------- borrador ---------------- */
  function preparar(B) {
    var d = clone(B);
    var w = d.web = d.web || {};
    w.chips = w.chips || [];
    w.heroFotos = w.heroFotos || [];
    w.galeria = w.galeria || { titulo: '', fotos: [] }; w.galeria.fotos = w.galeria.fotos || [];
    w.pasos = w.pasos || { titulo: '', texto: '', items: [] }; w.pasos.items = w.pasos.items || [];
    while (w.pasos.items.length < 3) w.pasos.items.push({ t: '', p: '' });
    w.carta = w.carta || { titulo: '', texto: '', nota: '' };
    w.porque = w.porque || { titulo: '', items: [] }; w.porque.items = w.porque.items || [];
    w.opiniones = w.opiniones || { titulo: '', items: [] }; w.opiniones.items = w.opiniones.items || [];
    w.cierre = w.cierre || { titulo: '', texto: '' };
    w.contacto = w.contacto || {};
    w.seo = w.seo || { titulo: '', descripcion: '' };
    d.staff = d.staff || [];
    d.staffByCat = d.staffByCat || {};
    d.services = d.services || [];
    return d;
  }
  function categorias() {
    var cats = [];
    draft.services.forEach(function (s) { if (cats.indexOf(s.cat) < 0) cats.push(s.cat); });
    return cats;
  }
  function aviso(txt) { if (window.Panel) window.Panel.pop(txt); }

  /* ---------------- guardado automático ---------------- */
  function problema() {
    if (!String(draft.name).trim()) return 'El negocio necesita un nombre.';
    if (!draft.services.length) return 'La carta necesita al menos un servicio.';
    var malo = draft.services.filter(function (s) { return !String(s.nm).trim() || !(+s.du > 0); })[0];
    if (malo) return 'Hay un servicio sin nombre o sin duración: se guardará cuando lo rellenes.';
    var sinNombre = draft.staff.filter(function (m) { return !String(m.nm).trim(); })[0];
    if (sinNombre) return 'Hay alguien del equipo sin nombre.';
    return null;
  }
  function marcar() {
    sucio = true;
    barra();
    clearTimeout(tempo);
    tempo = setTimeout(function () { guardar(true); }, 1600);
  }
  function barra(estado, texto) {
    var b = $('#edBar'); if (!b) return;
    var txt = $('#edTxt'), btn = $('#edGuardar'), des = $('#edDescartar');
    b.classList.remove('ok', 'aviso');
    if (estado === 'guardando') {
      txt.textContent = 'Guardando…'; btn.style.display = 'none'; des.style.display = 'none';
      b.classList.add('show');
    } else if (estado === 'guardado') {
      txt.textContent = '✓ Guardado. Ya está en tu web.'; btn.style.display = 'none'; des.style.display = 'none';
      b.classList.add('show', 'ok');
      clearTimeout(barra.t); barra.t = setTimeout(function () { if (!sucio) b.classList.remove('show'); }, 2800);
    } else if (estado === 'aviso') {
      txt.textContent = '⚠️ ' + texto; btn.style.display = ''; btn.disabled = true; des.style.display = '';
      b.classList.add('show', 'aviso');
    } else {
      btn.style.display = ''; btn.disabled = false; des.style.display = sucio ? '' : 'none';
      txt.textContent = sucio ? 'Cambios sin guardar' : '';
      b.classList.toggle('show', sucio);
    }
  }
  function guardar(auto) {
    clearTimeout(tempo);
    if (!sucio || guardando) return;
    var p = problema();
    if (p) { barra('aviso', p); if (!auto) aviso('⚠️ ' + p); return; }
    guardando = true;
    barra('guardando');
    draft.web.chips = draft.web.chips.filter(function (c) { return String(c).trim(); });
    S.guardarContenido(draft).then(function () {
      sucio = false; guardando = false;
      draft = preparar(S.biz());
      pintarTodo();
      barra('guardado');
    }).catch(function (e) {
      guardando = false;
      barra('aviso', e.message || 'No se ha podido guardar.');
      aviso('⚠️ ' + esc(e.message || 'No se ha podido guardar.'));
    });
  }

  /* ---------------- piezas de formulario ---------------- */
  function campo(label, obj, key, o) {
    o = o || {};
    var box = el('label', 'ef' + (o.cls ? ' ' + o.cls : ''));
    if (label) box.appendChild(el('span', 'ef-l', esc(label)));
    var inp;
    if (o.tipo === 'textarea') {
      inp = el('textarea'); inp.rows = o.filas || 3;
    } else {
      inp = el('input'); inp.type = o.tipo || 'text';
      if (o.tipo === 'number') { inp.inputMode = 'decimal'; if (o.step) inp.step = o.step; if (o.min != null) inp.min = o.min; }
      if (o.tipo === 'tel') inp.inputMode = 'tel';
    }
    if (o.max) inp.maxLength = o.max;
    if (o.ph) inp.placeholder = o.ph;
    inp.value = obj[key] == null ? '' : obj[key];
    inp.addEventListener('input', function () {
      obj[key] = o.tipo === 'number' ? (inp.value === '' ? 0 : Number(inp.value)) : inp.value;
      if (o.onInput) o.onInput(inp.value);
      marcar();
    });
    box.appendChild(inp);
    if (o.ayuda) box.appendChild(el('span', 'ef-a', o.ayuda));
    return box;
  }
  function boton(txt, cls, fn) {
    var b = el('button', 'eb' + (cls ? ' ' + cls : ''), txt); b.type = 'button';
    b.onclick = fn;
    return b;
  }
  function mover(arr, i, delta) {
    var j = i + delta;
    if (j < 0 || j >= arr.length) return false;
    var x = arr[i]; arr[i] = arr[j]; arr[j] = x;
    return true;
  }

  var pintores = {};
  function seccion(id, icono, titulo, sub, pintar) {
    var d = el('details', 'ed-sec'); d.id = 'sec-' + id;
    if (abiertas[id]) d.open = true;
    d.innerHTML = '<summary><span class="es-ic">' + icono + '</span><span class="es-t"><b>' + esc(titulo) + '</b><small>' + esc(sub) + '</small></span><i class="es-ch"></i></summary>';
    var body = el('div', 'ed-body');
    d.appendChild(body);
    pintores[id] = function () { body.innerHTML = ''; pintar(body); };
    if (d.open) pintores[id]();
    d.addEventListener('toggle', function () {
      abiertas[id] = d.open;
      if (d.open) pintores[id]();
    });
    return d;
  }
  function repintar(id) { if (pintores[id] && abiertas[id]) pintores[id](); }

  /* ---------------- fotos ---------------- */
  function reducir(file) {
    return new Promise(function (ok, ko) {
      var img = new Image(), url = URL.createObjectURL(file);
      img.onload = function () {
        var max = 1600, w = img.naturalWidth, h = img.naturalHeight, k = Math.min(1, max / Math.max(w, h));
        var c = document.createElement('canvas');
        c.width = Math.round(w * k); c.height = Math.round(h * k);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        URL.revokeObjectURL(url);
        c.toBlob(function (b) { b ? ok(b) : ko(new Error('No se pudo leer la foto.')); }, 'image/jpeg', 0.84);
      };
      img.onerror = function () { URL.revokeObjectURL(url); ko(new Error('Ese archivo no es una foto que podamos leer.')); };
      img.src = url;
    });
  }
  function subir(file) {
    return reducir(file).then(function (blob) {
      return fetch('/ejemplos/reservas-jyc-widy/api/foto', { method: 'POST', headers: { 'Content-Type': 'application/octet-stream', 'X-Foto-Tipo': 'image/jpeg' }, body: blob, credentials: 'same-origin' });
    }).then(function (r) {
      return r.json().then(function (j) { if (!r.ok) throw new Error(j.error || 'No se pudo subir.'); return j.url; });
    });
  }
  function elegirFotos(multiple, alElegir) {
    var inp = el('input'); inp.type = 'file'; inp.accept = 'image/*'; inp.multiple = !!multiple;
    inp.onchange = function () { if (inp.files && inp.files.length) alElegir([].slice.call(inp.files)); };
    inp.click();
  }
  function fotoSlot(url, texto, alCambiar) {
    var box = el('div', 'fslot');
    function pintar(u) {
      box.innerHTML = u ? '<img src="' + esc(u) + '" alt="">' : '<div class="fvacia">Sin foto</div>';
      var acts = el('div', 'fslot-a');
      acts.appendChild(boton(u ? 'Cambiar' : '+ Poner foto', 'sm', function () {
        elegirFotos(false, function (files) {
          box.classList.add('subiendo');
          subir(files[0]).then(function (nu) { alCambiar(nu); pintar(nu); marcar(); })
            .catch(function (e) { aviso('⚠️ ' + esc(e.message)); })
            .then(function () { box.classList.remove('subiendo'); });
        });
      }));
      if (u) acts.appendChild(boton('Quitar', 'sm no', function () { alCambiar(''); pintar(''); marcar(); }));
      box.appendChild(acts);
      if (texto) box.appendChild(el('span', 'fslot-l', esc(texto)));
    }
    pintar(url);
    return box;
  }

  /* ================= PESTAÑA SERVICIOS ================= */
  function nuevoServicio(cat, ic) {
    var ultimo = draft.services.map(function (x) { return x.cat; }).lastIndexOf(cat);
    var s = { id: uid('s'), ic: ic || '✂️', nm: '', du: 30, pr: 0, cat: cat };
    draft.services.splice(ultimo + 1, 0, s);
    svcAbierto = s.id;
    marcar();
    return s;
  }
  function nuevaCategoria() {
    var nombre = (prompt('¿Cómo se llama la categoría? (por ejemplo: Tratamientos)') || '').trim();
    if (!nombre) return;
    if (categorias().indexOf(nombre) >= 0) { aviso('Ya existe esa categoría.'); return; }
    var s = { id: uid('s'), ic: '✨', nm: '', du: 30, pr: 0, cat: nombre };
    draft.services.push(s);
    draft.staffByCat[nombre] = draft.staff.map(function (m) { return m.id; });
    svcAbierto = s.id; busca = ''; marcar(); pintarServicios();
  }

  function pintarServicios() {
    var box = $('#servicios'); if (!box) return;
    box.innerHTML = '';

    var head = el('div', 'p-card');
    var total = draft.services.length;
    head.innerHTML = '<div class="p-h"><b>Tu carta de servicios</b><span class="cnt">' + total + (total === 1 ? ' servicio' : ' servicios') + '</span></div>' +
      '<p class="ef-a top">Lo que cambies aquí sale en tu web y en la página de reservar. <b>Se guarda solo.</b></p>';
    var bsc = el('input', 'cl-busca'); bsc.type = 'search'; bsc.placeholder = 'Buscar un servicio'; bsc.value = busca;
    bsc.addEventListener('input', function () { busca = bsc.value; pintarLista(); });
    head.appendChild(bsc);
    var acts = el('div', 'aj-acts');
    acts.appendChild(boton('+ Añadir servicio', 'sm prim', function () {
      var cats = categorias();
      if (!cats.length) { nuevaCategoria(); return; }
      nuevoServicio(cats[0]);
      busca = ''; pintarLista();
      setTimeout(function () { var x = $('.svc-ed.open'); if (x) x.scrollIntoView({ block: 'center' }); }, 60);
    }));
    acts.appendChild(boton('+ Nueva categoría', 'sm', nuevaCategoria));
    head.appendChild(acts);
    box.appendChild(head);

    var lista = el('div'); lista.id = 'svcLista';
    box.appendChild(lista);
    pintarLista();

    box.appendChild(seccion('equipo', '👥', 'Equipo', 'Quién trabaja y qué hace cada uno', secEquipo));
    box.appendChild(seccion('reglas', '⏱️', 'Cómo se reparte la agenda', 'Duración de los huecos', secReglas));
  }

  function pintarLista() {
    var cont = $('#svcLista'); if (!cont) return;
    cont.innerHTML = '';
    var q = normal(busca);
    var cats = categorias();
    if (!cats.length) { cont.appendChild(el('p', 'ed-vacio', 'Todavía no hay servicios. Empieza por «+ Nueva categoría».')); return; }

    var algo = false;
    cats.forEach(function (cat, ci) {
      var svs = draft.services.filter(function (s) { return s.cat === cat; });
      var vis = q ? svs.filter(function (s) { return normal(s.nm).indexOf(q) >= 0 || normal(cat).indexOf(q) >= 0; }) : svs;
      if (q && !vis.length) return;
      algo = true;

      var card = el('div', 'cat-ed');
      var h = el('div', 'cat-ed-h');
      var nm = el('input', 'cat-nm'); nm.value = cat; nm.maxLength = 40;
      nm.addEventListener('change', function () {
        var nuevo = nm.value.trim();
        if (!nuevo || nuevo === cat) { nm.value = cat; return; }
        if (categorias().indexOf(nuevo) >= 0) { aviso('Ya hay una categoría con ese nombre.'); nm.value = cat; return; }
        draft.services.forEach(function (s) { if (s.cat === cat) s.cat = nuevo; });
        if (draft.staffByCat[cat]) { draft.staffByCat[nuevo] = draft.staffByCat[cat]; delete draft.staffByCat[cat]; }
        marcar(); pintarLista();
      });
      h.appendChild(nm);
      h.appendChild(el('span', 'cat-n', svs.length + (svs.length === 1 ? ' servicio' : ' servicios')));
      card.appendChild(h);

      if (draft.staff.length) {
        var quien = (draft.staffByCat[cat] || []).map(function (id) {
          return (draft.staff.filter(function (m) { return m.id === id; })[0] || {}).nm;
        }).filter(Boolean);
        card.appendChild(el('p', 'cat-quien', quien.length
          ? 'La atienden: ' + esc(quien.join(', '))
          : 'Sin nadie asignado: la puede atender cualquiera del equipo.'));
      }

      vis.forEach(function (s) { card.appendChild(filaServicio(s, cat)); });

      var pie = el('div', 'cat-pie');
      pie.appendChild(boton('+ Añadir aquí', 'sm', function () {
        nuevoServicio(cat, svs[0] ? svs[0].ic : '✂️');
        busca = ''; pintarLista();
      }));
      if (ci > 0) pie.appendChild(boton('↑ Subir', 'sm', function () { moverCategoria(cat, -1); }));
      if (ci < cats.length - 1) pie.appendChild(boton('↓ Bajar', 'sm', function () { moverCategoria(cat, 1); }));
      pie.appendChild(boton('Borrar categoría', 'sm no', function () {
        if (!confirm('¿Borrar la categoría «' + cat + '» y sus ' + svs.length + ' servicios?\n\nLas citas ya reservadas se quedan en la agenda.')) return;
        draft.services = draft.services.filter(function (s) { return s.cat !== cat; });
        delete draft.staffByCat[cat];
        marcar(); pintarLista();
      }));
      card.appendChild(pie);
      cont.appendChild(card);
    });
    if (!algo) cont.appendChild(el('p', 'empty', 'Ningún servicio con esa búsqueda.'));
  }

  function moverCategoria(cat, delta) {
    var cats = categorias(), i = cats.indexOf(cat), j = i + delta;
    if (j < 0 || j >= cats.length) return;
    var orden = cats.slice();
    orden[i] = cats[j]; orden[j] = cat;
    var nuevo = [];
    orden.forEach(function (c) {
      draft.services.forEach(function (s) { if (s.cat === c) nuevo.push(s); });
    });
    draft.services = nuevo;
    marcar(); pintarLista();
  }

  var DURACIONES = [5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 75, 90, 105, 120, 150, 180, 210, 240, 300];
  function filaServicio(s, cat) {
    var abierto = svcAbierto === s.id;
    var row = el('div', 'svc-ed' + (abierto ? ' open' : ''));
    var top = el('button', 'svc-ed-top'); top.type = 'button';
    function cabecera() {
      top.innerHTML = '<span class="se-ic">' + esc(s.ic) + '</span><span class="se-nm' + (String(s.nm).trim() ? '' : ' falta') + '">' +
        esc(String(s.nm).trim() || 'Sin nombre') + (s.home ? ' <i>⭐</i>' : '') +
        '</span><span class="se-meta">' + S.dur(+s.du || 0) + ' · <b>' + (+s.pr > 0 ? S.money(+s.pr) : 'gratis') + '</b></span><span class="se-ch"></span>';
    }
    cabecera();
    top.onclick = function () { svcAbierto = abierto ? null : s.id; pintarLista(); };
    row.appendChild(top);
    if (!abierto) return row;

    var body = el('div', 'svc-ed-b');
    var f1 = el('div', 'ef-row ic');
    f1.appendChild(campo('Icono', s, 'ic', { max: 8, cls: 'corto', onInput: cabecera }));
    f1.appendChild(campo('Nombre', s, 'nm', { max: 70, ph: 'Corte y peinado', onInput: cabecera }));
    body.appendChild(f1);

    var f2 = el('div', 'ef-row');
    var dur = el('label', 'ef');
    dur.appendChild(el('span', 'ef-l', 'Cuánto dura'));
    var sel = el('select');
    DURACIONES.forEach(function (m) { var o = el('option', null, S.dur(m)); o.value = m; sel.appendChild(o); });
    if (DURACIONES.indexOf(+s.du) < 0) { var extra = el('option', null, S.dur(+s.du)); extra.value = s.du; sel.appendChild(extra); }
    sel.value = s.du;
    sel.onchange = function () { s.du = +sel.value; cabecera(); marcar(); };
    dur.appendChild(sel);
    f2.appendChild(dur);
    f2.appendChild(campo('Precio (€)', s, 'pr', { tipo: 'number', step: 0.5, min: 0, onInput: cabecera }));
    body.appendChild(f2);
    body.appendChild(el('p', 'ef-a', 'Si el precio es orientativo, pon «(desde)» al final del nombre: en la web saldrá como «desde».'));

    var chk = el('label', 'ek');
    chk.innerHTML = '<input type="checkbox"' + (s.home ? ' checked' : '') + '><span>⭐ Enseñarlo en la portada de la web</span>';
    chk.querySelector('input').onchange = function () { if (this.checked) s.home = true; else delete s.home; cabecera(); marcar(); };
    body.appendChild(chk);

    var gap = el('label', 'ek');
    gap.innerHTML = '<input type="checkbox"' + (s.gap ? ' checked' : '') + '><span>Tiene un rato de espera (el tinte o las mechas actúan solos y se puede atender a otra persona)</span>';
    gap.querySelector('input').onchange = function () {
      if (this.checked) s.gap = [Math.min(20, Math.max(0, (+s.du || 30) - 20)), 15]; else delete s.gap;
      marcar(); pintarLista();
    };
    body.appendChild(gap);
    if (s.gap) {
      var g = { a: s.gap[0], b: s.gap[1] };
      var f3 = el('div', 'ef-row');
      f3.appendChild(campo('La espera empieza a los (min)', g, 'a', { tipo: 'number', step: 5, min: 0, onInput: function () { s.gap[0] = +g.a || 0; } }));
      f3.appendChild(campo('Y dura (min)', g, 'b', { tipo: 'number', step: 5, min: 5, onInput: function () { s.gap[1] = +g.b || 0; } }));
      body.appendChild(f3);
      body.appendChild(el('p', 'ef-a', 'Durante esos minutos la agenda deja el hueco libre para otra clienta.'));
    }

    var acts = el('div', 'svc-ed-a');
    function vecino(delta) {
      var idx = draft.services.indexOf(s), j = idx + delta;
      while (j >= 0 && j < draft.services.length && draft.services[j].cat !== cat) j += delta;
      if (j < 0 || j >= draft.services.length) return;
      draft.services[idx] = draft.services[j]; draft.services[j] = s;
      marcar(); pintarLista();
    }
    acts.appendChild(boton('↑', 'ic', function () { vecino(-1); }));
    acts.appendChild(boton('↓', 'ic', function () { vecino(1); }));
    acts.appendChild(boton('Duplicar', 'sm', function () {
      var copia = clone(s);
      copia.id = uid('s'); copia.nm = (s.nm || 'Servicio') + ' (copia)';
      draft.services.splice(draft.services.indexOf(s) + 1, 0, copia);
      svcAbierto = copia.id; marcar(); pintarLista();
    }));
    acts.appendChild(boton('Borrar', 'sm no', function () {
      if (!confirm('¿Borrar «' + (s.nm || 'este servicio') + '»? Las citas ya reservadas se quedan en la agenda.')) return;
      draft.services.splice(draft.services.indexOf(s), 1);
      svcAbierto = null; marcar(); pintarLista();
    }));
    acts.appendChild(boton('Listo', 'sm prim', function () { svcAbierto = null; pintarLista(); }));
    body.appendChild(acts);
    row.appendChild(body);
    return row;
  }

  function secReglas(b) {
    var sm = el('label', 'ef');
    sm.appendChild(el('span', 'ef-l', 'Los huecos de la agenda van cada'));
    var sel = el('select');
    [10, 15, 20, 30].forEach(function (m) { var o = el('option', null, m + ' minutos'); o.value = m; sel.appendChild(o); });
    sel.value = draft.slotMin || 15;
    sel.onchange = function () { draft.slotMin = +sel.value; marcar(); };
    sm.appendChild(sel);
    b.appendChild(sm);
    b.appendChild(el('p', 'ef-a', 'Cuanto más pequeño, más ajustada va la agenda. Con 15 minutos suele ir bien.'));
    b.appendChild(el('p', 'ef-a', 'El horario de apertura y los días de fiesta se cambian en la pestaña «Disponibilidad».'));
  }

  function secEquipo(b) {
    b.appendChild(el('p', 'ef-a top', 'El cliente elige con quién quiere venir (o «cualquiera»). Los horarios de cada uno se cambian en «Disponibilidad».'));
    var cats = categorias();
    draft.staff.forEach(function (m, i) {
      var card = el('div', 'stf-ed');
      var f = el('div', 'ef-row');
      f.appendChild(campo('Nombre', m, 'nm', { max: 40 }));
      f.appendChild(campo('Qué hace (se ve al reservar)', m, 'role', { max: 60, ph: 'Peluquería señoras' }));
      card.appendChild(f);
      if (cats.length) {
        card.appendChild(el('span', 'ef-l', 'Atiende:'));
        var chips = el('div', 'stf-cats');
        cats.forEach(function (cat) {
          var lista = draft.staffByCat[cat] || (draft.staffByCat[cat] = []);
          var on = lista.indexOf(m.id) >= 0;
          var c = boton(esc(cat), 'chip' + (on ? ' on' : ''), function () {
            var k = lista.indexOf(m.id);
            if (k >= 0) lista.splice(k, 1); else lista.push(m.id);
            c.classList.toggle('on', k < 0);
            marcar();
          });
          chips.appendChild(c);
        });
        card.appendChild(chips);
      }
      var a = el('div', 'svc-ed-a');
      a.appendChild(boton('↑', 'ic', function () { if (mover(draft.staff, i, -1)) { marcar(); repintar('equipo'); } }));
      a.appendChild(boton('↓', 'ic', function () { if (mover(draft.staff, i, 1)) { marcar(); repintar('equipo'); } }));
      a.appendChild(boton('Quitar del equipo', 'sm no', function () {
        if (!confirm('¿Quitar a ' + (m.nm || 'esta persona') + '? Sus citas ya apuntadas se quedan en la agenda.')) return;
        draft.staff.splice(i, 1);
        Object.keys(draft.staffByCat).forEach(function (k) {
          draft.staffByCat[k] = draft.staffByCat[k].filter(function (id) { return id !== m.id; });
        });
        marcar(); repintar('equipo');
      }));
      card.appendChild(a);
      b.appendChild(card);
    });
    if (!draft.staff.length) b.appendChild(el('p', 'ed-vacio', 'No hay nadie en el equipo: el cliente reserva sin elegir persona.'));
    b.appendChild(boton('+ Añadir persona', 'add fuerte', function () {
      var nombre = (prompt('Nombre de la persona') || '').trim();
      if (!nombre) return;
      var id = normal(nombre).replace(/[^a-z0-9]+/g, '').slice(0, 12) + Math.random().toString(36).slice(2, 5);
      draft.staff.push({ id: id, nm: nombre, role: '' });
      categorias().forEach(function (cat) { (draft.staffByCat[cat] || (draft.staffByCat[cat] = [])).push(id); });
      marcar(); repintar('equipo');
    }));
  }

  /* ================= PESTAÑA MI WEB ================= */
  function secDatos(b) {
    var c = draft.web.contacto;
    b.appendChild(campo('Nombre del negocio', draft, 'name', { max: 60 }));
    var fila = el('div', 'ef-row');
    fila.appendChild(campo('Teléfono', draft, 'phone', { tipo: 'tel', max: 15 }));
    fila.appendChild(campo('WhatsApp', draft, 'whatsapp', { tipo: 'tel', max: 15, ayuda: 'Con 34 delante. Igual que el teléfono si es el mismo.' }));
    b.appendChild(fila);
    b.appendChild(campo('Calle y número', c, 'calle', { max: 80, ph: 'C. Agricultores, 11' }));
    var f2 = el('div', 'ef-row');
    f2.appendChild(campo('Código postal', c, 'cp', { max: 10 }));
    f2.appendChild(campo('Ciudad o barrio', c, 'ciudad', { max: 60 }));
    b.appendChild(f2);
    b.appendChild(campo('Dirección corta', draft, 'address', { max: 120, ayuda: 'Es la que sale arriba al reservar y en el calendario del cliente.' }));
    b.appendChild(campo('Enlace de Google Maps', c, 'maps', { max: 400, ph: 'https://maps.app.goo.gl/…', ayuda: 'Opcional. En Google Maps: Compartir → Copiar enlace.' }));
    b.appendChild(campo('Instagram', c, 'instagram', { max: 60, ph: '@tu_peluqueria' }));
    var f3 = el('div', 'ef-row');
    f3.appendChild(campo('Nota en Google', draft, 'rating', { max: 4, ph: '4,3' }));
    f3.appendChild(campo('Nº de opiniones', draft, 'reviews', { tipo: 'number', min: 0, step: 1 }));
    b.appendChild(f3);

    var col = el('div', 'ef');
    col.appendChild(el('span', 'ef-l', 'Color de la web'));
    var fila4 = el('div', 'ef-color');
    var inp = el('input'); inp.type = 'color'; inp.value = draft.color || '#D9A85C';
    inp.addEventListener('input', function () { draft.color = inp.value; marcar(); });
    fila4.appendChild(inp);
    fila4.appendChild(boton('Volver al dorado', 'sm', function () { draft.color = ''; inp.value = '#D9A85C'; marcar(); }));
    col.appendChild(fila4);
    b.appendChild(col);
  }

  function secPortada(b) {
    var w = draft.web;
    b.appendChild(campo('Zona (encima del título)', w, 'zona', { max: 60, ph: 'Pino Montano · Sevilla' }));
    b.appendChild(campo('Título grande', w, 'heroTitulo', { tipo: 'textarea', filas: 2, max: 90, ayuda: 'Pulsa Intro para partirlo en dos líneas.' }));
    b.appendChild(campo('Texto de debajo', w, 'heroTexto', { tipo: 'textarea', filas: 3, max: 320 }));

    b.appendChild(el('p', 'ed-h', 'Etiquetas <small>(las cajitas bajo los botones)</small>'));
    var chips = el('div', 'ed-list');
    w.chips.forEach(function (ch, i) {
      var r = el('div', 'ed-li');
      var inp = el('input'); inp.value = ch; inp.maxLength = 40;
      inp.addEventListener('input', function () { w.chips[i] = inp.value; marcar(); });
      r.appendChild(inp);
      r.appendChild(boton('✕', 'ic no', function () { w.chips.splice(i, 1); marcar(); repintar('portada'); }));
      chips.appendChild(r);
    });
    b.appendChild(chips);
    if (w.chips.length < 6) b.appendChild(boton('+ Añadir etiqueta', 'add', function () { w.chips.push(''); marcar(); repintar('portada'); }));

    b.appendChild(el('p', 'ed-h', 'Fotos de la portada'));
    var fs = el('div', 'fslots');
    [0, 1].forEach(function (i) {
      fs.appendChild(fotoSlot(w.heroFotos[i] || '', i ? 'Foto pequeña' : 'Foto grande', function (u) {
        if (u) w.heroFotos[i] = u;
        else w.heroFotos.splice(i, 1);
        w.heroFotos = w.heroFotos.filter(Boolean);
        setTimeout(function () { repintar('portada'); }, 0);
      }));
    });
    b.appendChild(fs);
  }

  function secGaleria(b) {
    var g = draft.web.galeria;
    b.appendChild(campo('Título de la sección', g, 'titulo', { max: 70 }));
    var grid = el('div', 'gal-ed');
    g.fotos.forEach(function (f, i) {
      var it = el('div', 'gi');
      it.innerHTML = '<img src="' + esc(f.src) + '" alt="">';
      var inp = el('input'); inp.value = f.txt || ''; inp.placeholder = 'Texto de la foto'; inp.maxLength = 50;
      inp.addEventListener('input', function () { f.txt = inp.value; marcar(); });
      it.appendChild(inp);
      var a = el('div', 'gi-a');
      a.appendChild(boton('←', 'ic', function () { if (mover(g.fotos, i, -1)) { marcar(); repintar('galeria'); } }));
      a.appendChild(boton('→', 'ic', function () { if (mover(g.fotos, i, 1)) { marcar(); repintar('galeria'); } }));
      a.appendChild(boton('Quitar', 'sm no', function () { g.fotos.splice(i, 1); marcar(); repintar('galeria'); }));
      it.appendChild(a);
      grid.appendChild(it);
    });
    b.appendChild(grid);
    if (!g.fotos.length) b.appendChild(el('p', 'ed-vacio', 'Sin fotos: la sección no sale en la web.'));
    var est = el('p', 'ed-sube');
    if (g.fotos.length < 12) {
      b.appendChild(boton('+ Subir fotos', 'add', function () {
        elegirFotos(true, function (files) {
          files = files.slice(0, 12 - g.fotos.length);
          var n = 0;
          (function sig() {
            if (n >= files.length) { est.textContent = ''; repintar('galeria'); return; }
            est.textContent = 'Subiendo ' + (n + 1) + ' de ' + files.length + '…';
            subir(files[n]).then(function (u) { g.fotos.push({ src: u, txt: '' }); marcar(); })
              .catch(function (e) { aviso('⚠️ ' + esc(e.message)); })
              .then(function () { n++; sig(); });
          })();
        });
      }));
    }
    b.appendChild(est);
    b.appendChild(el('p', 'ef-a', 'Consejo: 5 fotos quedan perfectas (una grande y el resto en mosaico). Máximo 12.'));
  }

  function secTextos(b) {
    var w = draft.web;
    function bloque(t) { var d = el('div', 'txt-bl'); d.appendChild(el('p', 'ed-h', t)); b.appendChild(d); return d; }

    var p = bloque('«Así de fácil» · los 3 pasos');
    p.appendChild(campo('Título', w.pasos, 'titulo', { max: 70 }));
    p.appendChild(campo('Texto', w.pasos, 'texto', { tipo: 'textarea', filas: 2, max: 200 }));
    w.pasos.items.forEach(function (it, i) {
      var f = el('div', 'ef-sub');
      f.appendChild(campo('Paso ' + (i + 1), it, 't', { max: 50 }));
      f.appendChild(campo('Explicación', it, 'p', { tipo: 'textarea', filas: 2, max: 160 }));
      p.appendChild(f);
    });

    var c = bloque('Carta de servicios (los textos, no los precios)');
    c.appendChild(campo('Título', w.carta, 'titulo', { max: 70 }));
    c.appendChild(campo('Texto', w.carta, 'texto', { tipo: 'textarea', filas: 2, max: 200 }));
    c.appendChild(campo('Nota de debajo', w.carta, 'nota', { tipo: 'textarea', filas: 2, max: 240 }));

    var q = bloque('«Por qué volver»');
    q.appendChild(campo('Título', w.porque, 'titulo', { max: 70 }));
    w.porque.items.forEach(function (it, i) {
      var f = el('div', 'ef-sub');
      var r = el('div', 'ef-row ic');
      r.appendChild(campo('Icono', it, 'ic', { max: 8, cls: 'corto' }));
      r.appendChild(campo('Título', it, 't', { max: 50 }));
      f.appendChild(r);
      f.appendChild(campo('Texto', it, 'p', { tipo: 'textarea', filas: 2, max: 180 }));
      f.appendChild(boton('Quitar', 'sm no', function () { w.porque.items.splice(i, 1); marcar(); repintar('textos'); }));
      q.appendChild(f);
    });
    if (w.porque.items.length < 6) q.appendChild(boton('+ Añadir motivo', 'add', function () { w.porque.items.push({ ic: '✨', t: '', p: '' }); marcar(); repintar('textos'); }));

    var o = bloque('Opiniones de clientes');
    o.appendChild(campo('Título', w.opiniones, 'titulo', { max: 70 }));
    w.opiniones.items.forEach(function (it, i) {
      var f = el('div', 'ef-sub');
      f.appendChild(campo('Lo que dijo', it, 'txt', { tipo: 'textarea', filas: 3, max: 300 }));
      f.appendChild(campo('Quién (opcional)', it, 'autor', { max: 50, ph: 'Clienta habitual' }));
      f.appendChild(boton('Quitar', 'sm no', function () { w.opiniones.items.splice(i, 1); marcar(); repintar('textos'); }));
      o.appendChild(f);
    });
    if (w.opiniones.items.length < 8) o.appendChild(boton('+ Añadir opinión', 'add', function () { w.opiniones.items.push({ txt: '', autor: '' }); marcar(); repintar('textos'); }));
    o.appendChild(el('p', 'ef-a', 'Copia opiniones reales de Google: son las que más convencen.'));

    var z = bloque('Final de la página');
    z.appendChild(campo('Título', w.cierre, 'titulo', { tipo: 'textarea', filas: 2, max: 70 }));
    z.appendChild(campo('Texto', w.cierre, 'texto', { tipo: 'textarea', filas: 2, max: 200 }));

    var g = bloque('Cómo sale en Google');
    g.appendChild(campo('Título de la pestaña', w.seo, 'titulo', { max: 90 }));
    g.appendChild(campo('Descripción', w.seo, 'descripcion', { tipo: 'textarea', filas: 3, max: 200 }));

    var l = bloque('Datos legales (página de privacidad)');
    l.appendChild(campo('Titular del negocio', w.contacto, 'titular', { max: 100, ph: 'Nombre y apellidos o razón social' }));
    l.appendChild(campo('NIF / CIF', w.contacto, 'nif', { max: 20 }));
  }

  function pintarWeb() {
    var box = $('#editor'); if (!box) return;
    box.innerHTML = '';
    var intro = el('div', 'p-card ed-intro');
    intro.innerHTML = '<div class="p-h"><b>Tu web</b><a class="mini" href="/ejemplos/reservas-jyc-widy/?v=' + Date.now() + '" target="_blank" rel="noopener">Ver web ↗</a></div>' +
      '<p>Toca una sección y cambia lo que quieras: <b>se guarda solo</b> y en unos segundos sale en tu web. ' +
      'Los servicios y los precios están en la pestaña <b>Servicios</b>.</p>';
    box.appendChild(intro);
    box.appendChild(seccion('datos', '🏪', 'Datos del negocio', 'Nombre, teléfono, dirección, color', secDatos));
    box.appendChild(seccion('portada', '🖼️', 'Portada', 'Título, texto y fotos de arriba', secPortada));
    box.appendChild(seccion('galeria', '📸', 'Fotos de trabajos', 'Subir, ordenar y quitar fotos', secGaleria));
    box.appendChild(seccion('textos', '📝', 'Resto de textos', 'Pasos, opiniones, Google y datos legales', secTextos));
  }

  function pintarTodo() {
    pintarWeb();
    pintarServicios();
    barra();
  }

  /* una sola barra de guardado para las dos pestañas */
  function crearBarra() {
    if ($('#edBar')) return;
    var bar = el('div', 'ed-bar'); bar.id = 'edBar';
    var txt = el('span'); txt.id = 'edTxt';
    bar.appendChild(txt);
    var des = boton('Descartar', 'sm', function () {
      if (!confirm('¿Deshacer los cambios que todavía no se han guardado?')) return;
      clearTimeout(tempo);
      draft = preparar(S.biz()); sucio = false; svcAbierto = null;
      pintarTodo();
    });
    des.id = 'edDescartar';
    bar.appendChild(des);
    var g = boton('Guardar', 'sm prim', function () { guardar(false); });
    g.id = 'edGuardar';
    bar.appendChild(g);
    document.body.appendChild(bar);
  }

  window.addEventListener('beforeunload', function (e) {
    if (sucio) { guardar(true); e.preventDefault(); e.returnValue = ''; }
  });

  window.Editor = {
    abrir: function () {
      crearBarra();
      if (!sucio || !draft) draft = preparar(S.biz());
      pintarTodo();
    },
    /* al irse a otra pestaña se guarda lo pendiente sin dar la lata */
    puedeSalir: function () {
      var b = $('#edBar');
      if (!sucio) { if (b) b.classList.remove('show'); return true; }
      var p = problema();
      if (p) {
        if (!confirm('⚠️ ' + p + '\n\n¿Salir de todas formas y perder ese cambio?')) return false;
        sucio = false; draft = null;
        if (b) b.classList.remove('show');
        return true;
      }
      guardar(false);
      return true;
    }
  };
})();
