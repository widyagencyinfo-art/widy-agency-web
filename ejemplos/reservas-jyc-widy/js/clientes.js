/* Widy · pestaña Clientes: quién ha venido, cuándo, cuánto se ha gastado y las notas del dueño */
(function () {
  'use strict';
  var S = window.Store;
  if (!S || !S.panel) return;

  var $ = function (s, c) { return (c || document).querySelector(s); };
  var el = function (t, c, h) { var e = document.createElement(t); if (c) e.className = c; if (h != null) e.innerHTML = h; return e; };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (x) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[x]; }); };

  var lista = null, cargando = false, filtro = '', abierto = null;

  function telHref(p) {
    var d = String(p || '').replace(/[^\d+]/g, '');
    if (!d) return '';
    return d.charAt(0) === '+' ? d : '+' + (d.length === 9 ? '34' : '') + d;
  }
  function normal(s) { return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); }
  /* misma regla que el servidor para reconocer a la misma persona */
  function claveDe(telefono, nombre) {
    var d = String(telefono || '').replace(/\D/g, '');
    if (d.length >= 9) return d.slice(-9);
    return 'n:' + normal(nombre).replace(/[^a-z0-9]+/g, ' ').trim();
  }

  function cargar(forzar) {
    if (cargando || (lista && !forzar)) { pintar(); return; }
    cargando = true; pintar();
    S.pedir('/ejemplos/reservas-jyc-widy/api/panel', { accion: 'clientes' }).then(function (j) { lista = j.clientes || []; })
      .catch(function (e) { if (window.Panel) window.Panel.pop('⚠️ ' + esc(e.message)); })
      .then(function () { cargando = false; pintar(); });
  }
  /* se llama tras apuntar o anular una cita para que la ficha no se quede vieja */
  function recargar() { if (lista) cargar(true); }

  function filtrada() {
    if (!filtro) return lista;
    var q = normal(filtro);
    return lista.filter(function (c) {
      return normal(c.nombre).indexOf(q) >= 0 || String(c.telefono).indexOf(filtro.replace(/\D/g, '')) >= 0;
    });
  }

  function pintar() {
    var box = $('#clientes'); if (!box) return;
    box.innerHTML = '';

    var head = el('div', 'p-card');
    head.innerHTML = '<div class="p-h"><b>Tus clientes</b><span class="cnt" id="clCount"></span></div>';
    var busca = el('input', 'cl-busca'); busca.type = 'search'; busca.placeholder = 'Buscar por nombre o móvil'; busca.value = filtro;
    busca.addEventListener('input', function () { filtro = busca.value; pintarLista(); });
    head.appendChild(busca);
    var acts = el('div', 'aj-acts');
    var rec = el('button', 'eb sm', 'Actualizar'); rec.type = 'button';
    rec.onclick = function () { cargar(true); };
    acts.appendChild(rec);
    var csv = el('button', 'eb sm', 'Descargar lista'); csv.type = 'button';
    csv.onclick = descargar;
    acts.appendChild(csv);
    head.appendChild(acts);
    box.appendChild(head);

    var cont = el('div'); cont.id = 'clLista';
    box.appendChild(cont);
    pintarLista();
  }

  function pintarLista() {
    var cont = $('#clLista'); if (!cont) return;
    cont.innerHTML = '';
    if (cargando && !lista) { cont.appendChild(el('p', 'empty', 'Cargando clientes…')); return; }
    if (!lista || !lista.length) {
      cont.appendChild(el('p', 'empty', 'Todavía no hay clientes. En cuanto alguien reserve, su ficha se guarda aquí sola.'));
      $('#clCount').textContent = '0';
      return;
    }
    var l = filtrada();
    $('#clCount').textContent = l.length + (l.length === 1 ? ' cliente' : ' clientes');
    if (!l.length) { cont.appendChild(el('p', 'empty', 'Ningún cliente con esa búsqueda.')); return; }
    l.slice(0, 300).forEach(function (c) { cont.appendChild(ficha(c)); });
    if (l.length > 300) cont.appendChild(el('p', 'ef-a', 'Se enseñan los 300 primeros. Usa el buscador para encontrar a alguien.'));
  }

  function ficha(c) {
    var abierta = abierto === c.clave;
    var card = el('div', 'cl' + (abierta ? ' open' : ''));
    var top = el('button', 'cl-top'); top.type = 'button';
    var ini = (c.nombre || '?').trim().charAt(0).toUpperCase();
    top.innerHTML =
      '<span class="cl-av">' + esc(ini) + '</span>' +
      '<span class="cl-m"><b>' + esc(c.nombre || 'Sin nombre') + '</b>' +
      '<span>' + (c.visitas ? c.visitas + (c.visitas === 1 ? ' visita' : ' visitas') : 'Nueva') +
      (c.gastado ? ' · ' + S.money(c.gastado) : '') + (c.notas ? ' · 📝' : '') + '</span></span>' +
      (c.proxima ? '<span class="cl-next">' + S.fmtDateShort(c.proxima.date) + '<i>' + c.proxima.time + '</i></span>'
        : c.ultima ? '<span class="cl-last">última<i>' + S.fmtDateShort(c.ultima.date) + '</i></span>' : '');
    top.onclick = function () { abierto = abierta ? null : c.clave; pintarLista(); };
    card.appendChild(top);
    if (!abierta) return card;

    var b = el('div', 'cl-b');
    var tel = telHref(c.telefono);
    var acc = el('div', 'bkc-c');
    if (tel) {
      acc.innerHTML = '<a class="mini" href="tel:' + esc(tel) + '">Llamar ' + esc(c.telefono) + '</a>' +
        '<a class="mini wa" target="_blank" rel="noopener" href="https://wa.me/' + esc(tel.replace('+', '')) + '">WhatsApp</a>';
    }
    var nueva = el('button', 'mini add', '+ Apuntarle cita');
    nueva.onclick = function () { if (window.Panel) window.Panel.apuntarPara(c.nombre, c.telefono); };
    acc.appendChild(nueva);
    b.appendChild(acc);

    var nota = el('label', 'ef');
    nota.appendChild(el('span', 'ef-l', 'Notas (color, alergias, lo que sea — solo lo ves tú)'));
    var ta = el('textarea'); ta.rows = 3; ta.maxLength = 600; ta.value = c.notas || '';
    ta.placeholder = 'Ej.: tinte 7.3, no le gusta el secador muy caliente…';
    nota.appendChild(ta);
    b.appendChild(nota);
    var guardar = el('button', 'eb sm prim', 'Guardar notas'); guardar.type = 'button';
    guardar.onclick = function () {
      guardar.disabled = true; guardar.textContent = 'Guardando…';
      S.pedir('/ejemplos/reservas-jyc-widy/api/panel', { accion: 'clienteGuardar', cliente: { clave: c.clave, nombre: c.nombre, telefono: c.telefono, notas: ta.value } })
        .then(function (j) { lista = j.clientes || lista; if (window.Panel) window.Panel.pop('✓ Notas guardadas'); pintarLista(); })
        .catch(function (e) { if (window.Panel) window.Panel.pop('⚠️ ' + esc(e.message)); guardar.disabled = false; guardar.textContent = 'Guardar notas'; });
    };
    b.appendChild(guardar);

    b.appendChild(el('p', 'ed-h', 'Su historial'));
    var hist = el('div', 'cl-hist');
    c.citas.forEach(function (x) {
      var stf = x.staffId ? S.staffMember(x.staffId) : null;
      var cls = x.estado === 'cancelada' ? ' no' : (x.date >= S.today() && x.estado !== 'hecha') ? ' next' : '';
      hist.appendChild(el('div', 'cl-h' + cls,
        '<span class="cl-hf">' + S.fmtDateShort(x.date) + ' · ' + x.time + '</span>' +
        '<span class="cl-hs">' + esc(x.nombres || 'Cita') + (stf ? ' · ' + esc(stf.nm) : '') +
        (x.estado === 'cancelada' ? ' · anulada' : '') + (x.origen === 'panel' ? ' · a mano' : '') +
        (x.notas ? '<i>📝 ' + esc(x.notas) + '</i>' : '') + '</span>' +
        '<span class="cl-ht">' + (x.total ? S.money(x.total) : '—') + '</span>'));
    });
    b.appendChild(hist);
    if (c.anuladas) b.appendChild(el('p', 'ef-a', c.anuladas + (c.anuladas === 1 ? ' cita anulada' : ' citas anuladas') + ' en total.'));
    card.appendChild(b);
    return card;
  }

  function descargar() {
    if (!lista || !lista.length) return;
    var filas = [['Nombre', 'Móvil', 'Visitas', 'Gastado', 'Última visita', 'Próxima cita', 'Notas']];
    lista.forEach(function (c) {
      filas.push([c.nombre, c.telefono, c.visitas, String(c.gastado).replace('.', ','),
        c.ultima ? c.ultima.date : '', c.proxima ? c.proxima.date + ' ' + c.proxima.time : '', c.notas]);
    });
    var csv = '﻿' + filas.map(function (f) {
      return f.map(function (v) { return '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"'; }).join(';');
    }).join('\r\n');
    var a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    a.download = 'clientes-' + S.today() + '.csv';
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 4000);
  }

  /* la nota del cliente, para enseñarla en su cita de la agenda */
  function notaDe(telefono, nombre) {
    if (!lista) return '';
    var k = claveDe(telefono, nombre);
    var c = lista.filter(function (x) { return x.clave === k; })[0];
    return c ? c.notas : '';
  }

  window.Clientes = {
    abrir: function () { cargar(false); },
    recargar: recargar,
    precargar: function () { if (!lista) cargar(false); },
    notaDe: notaDe
  };
})();
