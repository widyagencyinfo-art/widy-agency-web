/* Widy — plantilla de presupuesto de reforma.
   Todo se hace en el navegador. El borrador se guarda en localStorage de este equipo, nada más. */
(function () {
  'use strict';
  var KEY = 'widy-presupuesto-v1';
  var $ = function (id) { return document.getElementById(id); };
  var form = $('prForm');
  if (!form) return;

  var NOTAS = 'No incluye licencias, tasas municipales ni permisos, salvo que se indique. ' +
    'Cualquier trabajo que no esté en este presupuesto se presupuestará aparte y por escrito antes de hacerlo.';

  var EJEMPLO = [
    { k: 'cap', t: 'Demolición y retirada' },
    { k: 'lin', c: 'Desmontaje de sanitarios, bañera y mueble del baño', u: 'ud', q: '1', p: '', t: 'mo' },
    { k: 'lin', c: 'Picado de alicatado de paredes y de la solería', u: 'm²', q: '22', p: '', t: 'mo' },
    { k: 'lin', c: 'Retirada de escombros a vertedero autorizado, con saco o contenedor', u: 'PA', q: '1', p: '', t: 'mo' },
    { k: 'cap', t: 'Fontanería' },
    { k: 'lin', c: 'Instalación nueva de agua fría y caliente del baño', u: 'PA', q: '1', p: '', t: 'mix' },
    { k: 'lin', c: 'Plato de ducha de resina de 140 × 80 cm, colocado', u: 'ud', q: '1', p: '', t: 'mix' },
    { k: 'cap', t: 'Albañilería y alicatado' },
    { k: 'lin', c: 'Alicatado de paredes (azulejo elegido por el cliente)', u: 'm²', q: '18', p: '', t: 'mo' },
    { k: 'lin', c: 'Solería de porcelánico', u: 'm²', q: '4', p: '', t: 'mo' },
    { k: 'cap', t: 'Electricidad' },
    { k: 'lin', c: 'Puntos de luz y enchufes del baño, con mecanismos', u: 'ud', q: '4', p: '', t: 'mix' },
    { k: 'cap', t: 'Sanitarios y grifería' },
    { k: 'lin', c: 'Inodoro, lavabo con mueble y grifería termostática de ducha', u: 'ud', q: '1', p: '', t: 'mat' }
  ];

  function hoy() {
    var d = new Date();
    return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2);
  }
  function nuevoEstado() {
    return {
      emp: '', empNif: '', empTel: '', empMail: '', empDir: '', logo: '',
      cli: '', cliTel: '', obraDir: '', obra: '', num: new Date().getFullYear() + '-001', fecha: hoy(),
      lines: JSON.parse(JSON.stringify(EJEMPLO)), iva: '21', validez: '30', plazo: '',
      pago: '30 % al aceptar, 40 % a mitad de obra y 30 % al terminar', notas: NOTAS
    };
  }

  var st;
  try { st = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) { st = null; }
  if (!st || !Array.isArray(st.lines)) st = nuevoEstado();

  /* ---------- números ---------- */
  function num(v) {
    v = String(v == null ? '' : v).replace(/[\s€]/g, '');
    if (!v) return 0;
    if (v.indexOf(',') > -1) v = v.replace(/\./g, '').replace(',', '.');
    else if (/^\d{1,3}(\.\d{3})+$/.test(v)) v = v.replace(/\./g, '');
    var n = parseFloat(v);
    return isFinite(n) ? n : 0;
  }
  function eur(n) {
    var s = (Math.round(n * 100) / 100).toFixed(2).split('.');
    var ent = s[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return ent + ',' + s[1] + ' €';
  }
  function cant(n) {
    var s = String(Math.round(n * 100) / 100).split('.');
    return s[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.') + (s[1] ? ',' + s[1] : '');
  }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function fechaEs(iso, masDias) {
    if (!iso) return '';
    var p = iso.split('-');
    var d = new Date(+p[0], +p[1] - 1, +p[2]);
    if (isNaN(d)) return '';
    if (masDias) d.setDate(d.getDate() + masDias);
    return ('0' + d.getDate()).slice(-2) + '/' + ('0' + (d.getMonth() + 1)).slice(-2) + '/' + d.getFullYear();
  }

  /* ---------- campos simples ---------- */
  var CAMPOS = { 'pr-emp': 'emp', 'pr-emp-nif': 'empNif', 'pr-emp-tel': 'empTel', 'pr-emp-mail': 'empMail', 'pr-emp-dir': 'empDir',
    'pr-cli': 'cli', 'pr-cli-tel': 'cliTel', 'pr-obra-dir': 'obraDir', 'pr-obra': 'obra', 'pr-num': 'num', 'pr-fecha': 'fecha',
    'pr-validez': 'validez', 'pr-plazo': 'plazo', 'pr-pago': 'pago', 'pr-notas': 'notas' };
  function volcarCampos() {
    Object.keys(CAMPOS).forEach(function (id) { var el = $(id); if (el) el.value = st[CAMPOS[id]] || ''; });
    var pago = $('pr-pago');
    if (pago && st.pago && pago.value !== st.pago) {
      var o = document.createElement('option'); o.textContent = st.pago; pago.appendChild(o); pago.value = st.pago;
    }
    var r = form.querySelector('input[name="pr-iva"][value="' + st.iva + '"]');
    if (r) r.checked = true;
  }

  /* ---------- partidas ---------- */
  var cont = $('prLines');
  var tplCap = $('prTplCap'), tplLin = $('prTplLin');
  function pintarLineas() {
    cont.textContent = '';
    st.lines.forEach(function (l, i) {
      var node = (l.k === 'cap' ? tplCap : tplLin).content.firstElementChild.cloneNode(true);
      node.dataset.i = i;
      if (l.k === 'cap') {
        node.querySelector('.pr-t').value = l.t || '';
      } else {
        node.querySelector('.pr-c').value = l.c || '';
        node.querySelector('.pr-u').value = l.u || 'ud';
        node.querySelector('.pr-q').value = l.q || '';
        node.querySelector('.pr-p').value = l.p || '';
        node.querySelector('.pr-k').value = l.t || 'mo';
      }
      cont.appendChild(node);
    });
  }
  cont.addEventListener('input', lineaCambia);
  cont.addEventListener('change', lineaCambia);
  function lineaCambia(e) {
    var row = e.target.closest('.pr-line'); if (!row) return;
    var l = st.lines[+row.dataset.i]; if (!l) return;
    var c = e.target.classList;
    if (c.contains('pr-t')) l.t = e.target.value;
    else if (c.contains('pr-c')) l.c = e.target.value;
    else if (c.contains('pr-u')) l.u = e.target.value;
    else if (c.contains('pr-q')) l.q = e.target.value;
    else if (c.contains('pr-p')) l.p = e.target.value;
    else if (c.contains('pr-k')) l.t = e.target.value;
    calcular();
  }
  cont.addEventListener('click', function (e) {
    var b = e.target.closest('.pr-del'); if (!b) return;
    var row = b.closest('.pr-line');
    st.lines.splice(+row.dataset.i, 1);
    pintarLineas(); calcular();
  });
  function anadir(l) {
    st.lines.push(l); pintarLineas(); calcular();
    var last = cont.lastElementChild; if (last) { var f = last.querySelector('input'); if (f) f.focus(); }
  }
  $('pr-add-lin').addEventListener('click', function () { anadir({ k: 'lin', c: '', u: 'ud', q: '1', p: '', t: 'mo' }); });
  $('pr-add-cap').addEventListener('click', function () { anadir({ k: 'cap', t: '' }); });
  $('pr-ejemplo').addEventListener('click', function () {
    if (st.lines.some(function (l) { return l.k === 'lin' && (num(l.p) > 0); }) &&
        !window.confirm('Se cambian tus partidas por las del ejemplo. ¿Seguimos?')) return;
    st.lines = JSON.parse(JSON.stringify(EJEMPLO)); pintarLineas(); calcular();
  });

  /* ---------- logo ---------- */
  $('pr-logo').addEventListener('change', function () {
    var f = this.files && this.files[0]; if (!f) return;
    var rd = new FileReader();
    rd.onload = function () {
      if (f.type === 'image/svg+xml') { st.logo = rd.result; calcular(); return; }
      var img = new Image();
      img.onload = function () {
        var w = Math.min(480, img.naturalWidth), h = Math.round(img.naturalHeight * w / img.naturalWidth);
        var cv = document.createElement('canvas'); cv.width = w; cv.height = h;
        cv.getContext('2d').drawImage(img, 0, 0, w, h);
        st.logo = cv.toDataURL(f.type === 'image/jpeg' ? 'image/jpeg' : 'image/png', .9);
        calcular();
      };
      img.src = rd.result;
    };
    rd.readAsDataURL(f);
  });

  /* ---------- cálculo y vista previa ---------- */
  function totales() {
    var base = 0, mat = 0, mix = 0, caps = {}, capActual = -1;
    st.lines.forEach(function (l, i) {
      if (l.k === 'cap') { capActual = i; caps[i] = 0; return; }
      var imp = num(l.q) * num(l.p);
      base += imp;
      if (l.t === 'mat') mat += imp;
      if (l.t === 'mix') mix += imp;
      if (capActual > -1) caps[capActual] += imp;
    });
    var iva = base * (+st.iva) / 100;
    return { base: base, iva: iva, total: base + iva, mat: mat, mix: mix, caps: caps };
  }

  var tGuardar;
  function guardar() {
    clearTimeout(tGuardar);
    tGuardar = setTimeout(function () {
      var nota = $('pr-guardado');
      try { localStorage.setItem(KEY, JSON.stringify(st)); if (nota) nota.textContent = 'Borrador guardado en este navegador. A mí no me llega nada.'; }
      catch (e) {
        try { var s2 = JSON.parse(JSON.stringify(st)); s2.logo = ''; localStorage.setItem(KEY, JSON.stringify(s2)); } catch (e2) {}
        if (nota) nota.textContent = 'Se hace en tu navegador. No se ha podido guardar el borrador: descárgalo en PDF antes de cerrar.';
      }
    }, 400);
  }

  function calcular() {
    var t = totales();
    $('pr-base').textContent = eur(t.base);
    $('pr-iva-txt').textContent = 'IVA ' + st.iva + ' %';
    $('pr-iva-imp').textContent = eur(t.iva);
    $('pr-total').textContent = eur(t.total);

    var matTxt = '', aviso = '';
    if (t.base > 0 && t.mat > 0) {
      var pct = t.mat / t.base * 100;
      matTxt = 'Materiales (a precio de presupuesto): ' + cant(Math.round(pct * 10) / 10) + ' % de la base' + (t.mix > 0 ? ' (sin contar las partidas marcadas «Las dos»).' : '.');
      if (st.iva === '10' && pct > 40) {
        aviso = 'Con el IVA al 10 %, el coste de los materiales que pones tú no puede pasar del 40 % de la base sin IVA, y si se pasa, toda la obra va al 21 %. ' +
          'A precio de presupuesto son el ' + cant(Math.round(pct * 10) / 10) + ' %. Hacienda mira lo que te costaron a ti: haz la cuenta con tus facturas de compra y revísalo con tu gestor.';
      }
    }
    if (st.iva === '10' && t.mix > 0 && !aviso) {
      aviso = 'Tienes partidas con material y mano de obra juntos. Para el IVA del 10 % cuenta cuánto es material: si lo separas, te hago la cuenta.';
    }
    $('pr-mat').textContent = matTxt;
    var av = $('pr-aviso'); av.textContent = aviso; av.hidden = !aviso;

    // subtotales de capítulo en el editor
    cont.querySelectorAll('.pr-line').forEach(function (row) {
      var i = +row.dataset.i, l = st.lines[i]; if (!l) return;
      if (l.k === 'cap') row.querySelector('.pr-sub').textContent = t.caps[i] ? eur(t.caps[i]) : '';
      else { var imp = num(l.q) * num(l.p); row.querySelector('.pr-imp').textContent = imp ? eur(imp) : '—'; }
    });

    $('prDoc').innerHTML = documento(t);
    guardar();
  }

  function documento(t) {
    var filas = '', nCap = 0, nLin = 0, hayCap = st.lines.some(function (l) { return l.k === 'cap'; });
    st.lines.forEach(function (l, i) {
      if (l.k === 'cap') {
        nCap++; nLin = 0;
        filas += '<tr class="pr-d-cap"><td colspan="4">' + nCap + '. ' + esc(l.t || 'Capítulo') + '</td><td class="n">' + (t.caps[i] ? eur(t.caps[i]) : '') + '</td></tr>';
        return;
      }
      if (!l.c && !num(l.p)) return;
      nLin++;
      var imp = num(l.q) * num(l.p);
      filas += '<tr><td>' + (hayCap ? '<span class="pr-d-n">' + Math.max(nCap, 1) + '.' + nLin + '</span>' : '') + esc(l.c) + '</td>' +
        '<td class="c">' + esc(l.u) + '</td><td class="n">' + cant(num(l.q)) + '</td>' +
        '<td class="n">' + (num(l.p) ? eur(num(l.p)) : '') + '</td><td class="n">' + (imp ? eur(imp) : '') + '</td></tr>';
    });
    var empDatos = [st.empNif && 'NIF ' + esc(st.empNif), esc(st.empDir), esc(st.empTel), esc(st.empMail)].filter(Boolean).join('<br>');
    var ivaNota = st.iva === '10'
      ? '<p class="pr-d-nota">IVA del 10 % según el artículo 91.Uno.2.10.º de la Ley 37/1992, para obras de renovación o reparación de una vivienda de uso particular.</p>'
      : '';
    return '' +
      '<header class="pr-d-head">' +
        '<div class="pr-d-emp">' + (st.logo ? '<img src="' + esc(st.logo) + '" alt="">' : '') +
          '<strong>' + (esc(st.emp) || 'Tu empresa') + '</strong><p>' + empDatos + '</p></div>' +
        '<div class="pr-d-meta"><p class="pr-d-tit">Presupuesto</p>' +
          '<p>N.º <strong>' + esc(st.num) + '</strong></p>' +
          '<p>Fecha: ' + fechaEs(st.fecha) + '</p>' +
          '<p>Válido hasta: ' + fechaEs(st.fecha, +st.validez) + '</p></div>' +
      '</header>' +
      '<section class="pr-d-cli">' +
        '<div><span>Cliente</span><strong>' + (esc(st.cli) || '—') + '</strong>' + (st.cliTel ? '<p>' + esc(st.cliTel) + '</p>' : '') + '</div>' +
        '<div><span>Obra</span><strong>' + (esc(st.obra) || '—') + '</strong>' + (st.obraDir ? '<p>' + esc(st.obraDir) + '</p>' : '') + '</div>' +
      '</section>' +
      '<table class="pr-d-tab"><thead><tr><th>Concepto</th><th class="c">Ud.</th><th class="n">Cant.</th><th class="n">Precio</th><th class="n">Importe</th></tr></thead>' +
      '<tbody>' + (filas || '<tr><td colspan="5" class="pr-d-vacio">Añade las partidas en el paso 3.</td></tr>') + '</tbody></table>' +
      '<div class="pr-d-tot">' +
        '<p><span>Base imponible</span><span>' + eur(t.base) + '</span></p>' +
        '<p><span>IVA ' + st.iva + ' %</span><span>' + eur(t.iva) + '</span></p>' +
        '<p class="pr-d-total"><span>Total</span><span>' + eur(t.total) + '</span></p>' +
      '</div>' + ivaNota +
      '<section class="pr-d-cond">' +
        (st.plazo ? '<p><strong>Plazo de la obra:</strong> ' + esc(st.plazo) + '</p>' : '') +
        '<p><strong>Forma de pago:</strong> ' + esc(st.pago) + '</p>' +
        (st.notas ? '<p><strong>Notas:</strong> ' + esc(st.notas).replace(/\n/g, '<br>') + '</p>' : '') +
      '</section>' +
      '<section class="pr-d-firma"><div><span>Por la empresa</span></div><div><span>Acepto el presupuesto (firma del cliente y fecha)</span></div></section>';
  }

  /* ---------- eventos del formulario ---------- */
  form.addEventListener('input', function (e) {
    var k = CAMPOS[e.target.id]; if (k) { st[k] = e.target.value; calcular(); }
  });
  form.addEventListener('change', function (e) {
    if (e.target.name === 'pr-iva') { st.iva = e.target.value; calcular(); return; }
    var k = CAMPOS[e.target.id]; if (k) { st[k] = e.target.value; calcular(); }
  });

  $('pr-ver').addEventListener('click', function () { $('vista').scrollIntoView({ behavior: 'smooth', block: 'start' }); });

  $('pr-nuevo').addEventListener('click', function () {
    if (!window.confirm('Se borran el cliente y las partidas. Tus datos de empresa y el logo se quedan. ¿Empezamos uno nuevo?')) return;
    var n = nuevoEstado();
    ['emp', 'empNif', 'empTel', 'empMail', 'empDir', 'logo', 'iva', 'validez', 'pago', 'notas'].forEach(function (k) { n[k] = st[k]; });
    n.num = String(st.num || '').replace(/(\d+)(?!.*\d)/, function (d) { return String(+d + 1).padStart(d.length, '0'); }) || n.num;
    n.lines = [{ k: 'cap', t: '' }, { k: 'lin', c: '', u: 'ud', q: '1', p: '', t: 'mo' }];
    st = n; volcarCampos(); pintarLineas(); calcular();
    window.scrollTo({ top: form.getBoundingClientRect().top + window.scrollY - 110, behavior: 'smooth' });
  });

  $('pr-pdf').addEventListener('click', function () {
    var vieja = $('prPrint'); if (vieja) vieja.parentNode.removeChild(vieja);
    var hoja = document.createElement('div');
    hoja.id = 'prPrint';
    hoja.innerHTML = '<article class="pr-doc">' + documento(totales()) + '</article>';
    document.body.appendChild(hoja);
    document.body.classList.add('imprimiendo-presupuesto'); document.documentElement.classList.add('imprimiendo-presupuesto');
    var titulo = document.title;
    document.title = ('Presupuesto ' + (st.num || '') + ' ' + (st.cli || '')).trim();
    var fin = function () {
      document.body.classList.remove('imprimiendo-presupuesto'); document.documentElement.classList.remove('imprimiendo-presupuesto');
      document.title = titulo;
      if (hoja.parentNode) hoja.parentNode.removeChild(hoja);
      window.removeEventListener('afterprint', fin);
    };
    window.addEventListener('afterprint', fin);
    var img = hoja.querySelector('img');
    var imprimir = function () { window.print(); };
    if (img && !img.complete) { img.onload = imprimir; img.onerror = imprimir; } else imprimir();
  });

  volcarCampos(); pintarLineas(); calcular();
})();
