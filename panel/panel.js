/* ===================================================
   Widy · El Cerebro — panel de leads
   Demo autónoma: los leads viven en localStorage de este navegador.
   =================================================== */
(function () {
  'use strict';

  var LEADS_KEY = 'widy_leads_v1';
  var DEMO_KEY = 'widy_demo_v1';
  var COMISION = 0.03;

  var ESTADOS = [
    { id: 'nuevo',      txt: 'Sin contactar' },
    { id: 'contactado', txt: 'Contactado' },
    { id: 'visita',     txt: 'Visita agendada' },
    { id: 'oferta',     txt: 'Oferta sobre la mesa' },
    { id: 'cerrado',    txt: 'Cerrado' },
    { id: 'perdido',    txt: 'Perdido' }
  ];

  /* Leads de ejemplo — inventados, para enseñar el panel lleno. */
  var DEMO = [
    { nombre: 'María del Carmen R.', tel: '600 00 00 11', tipo: 'Propietario', origen: 'Web de valoración',
      zona: 'Nervión', detalle: '92 m² · 3 hab · En buen estado', valoracion: 262000, estado: 'nuevo',
      nota: '', hace: 2 },
    { nombre: 'Antonio J. Vega', tel: '600 00 00 22', tipo: 'Comprador', origen: 'WhatsApp 24 h',
      zona: 'Triana', detalle: 'Busca 3 hab hasta 180.000 · Con financiación', valoracion: 0, estado: 'visita',
      nota: 'Visita el martes 18:00. Le encaja el de Pagés del Corro.', hace: 9 },
    { nombre: 'Inmaculada Ortiz', tel: '600 00 00 33', tipo: 'Propietario', origen: 'Radar de particulares',
      zona: 'Los Remedios', detalle: '110 m² · Publicado en Milanuncios por 340.000', valoracion: 351000, estado: 'contactado',
      nota: 'Lleva 3 meses intentando venderlo solo. Abierta a exclusiva.', hace: 26 },
    { nombre: 'Francisco Delgado', tel: '600 00 00 44', tipo: 'Propietario', origen: 'Web de valoración',
      zona: 'Sevilla Este', detalle: '78 m² · 3 hab · Para reformar', valoracion: 123000, estado: 'nuevo',
      nota: '', hace: 30 },
    { nombre: 'Rocío Jiménez', tel: '600 00 00 55', tipo: 'Comprador', origen: 'Redes sociales',
      zona: 'Macarena', detalle: 'Vio el reel del piso de San Luis', valoracion: 0, estado: 'oferta',
      nota: 'Ha ofrecido 148.000. El propietario pide 155.000.', hace: 51 },
    { nombre: 'Manuel Ruiz Ternero', tel: '600 00 00 66', tipo: 'Propietario', origen: 'Radar de particulares',
      zona: 'El Porvenir', detalle: '135 m² · Anuncio de particular en Idealista', valoracion: 425000, estado: 'contactado',
      nota: 'Pide llamar después de las 20:00.', hace: 74 },
    { nombre: 'Lucía Ferrer', tel: '600 00 00 77', tipo: 'Comprador', origen: 'WhatsApp 24 h',
      zona: 'Bami', detalle: 'Busca 2 hab con garaje hasta 210.000', valoracion: 0, estado: 'cerrado',
      nota: 'Firmado. Comisión 6.300 €.', hace: 320 },
    { nombre: 'José Antonio Pérez', tel: '600 00 00 88', tipo: 'Comprador', origen: 'Redes sociales',
      zona: 'Cerro - Amate', detalle: 'Preguntó por el piso del vídeo del 3 de julio', valoracion: 0, estado: 'perdido',
      nota: 'Compró con otra agencia. Tardamos 2 días en contestarle.', hace: 400 }
  ];

  var $ = function (id) { return document.getElementById(id); };
  var eur = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });

  var leads = [];
  var filtro = { estado: 'todos', texto: '' };

  /* ---------- Carga ---------- */
  function cargar() {
    try { leads = JSON.parse(localStorage.getItem(LEADS_KEY) || '[]'); } catch (e) { leads = []; }
    if (!Array.isArray(leads)) { leads = []; }

    var demoQuitada = localStorage.getItem(DEMO_KEY) === 'off';
    var hayDemo = leads.some(function (l) { return l.demo; });

    if (!leads.length && !demoQuitada) {
      leads = DEMO.map(function (d, i) {
        return {
          id: 'demo_' + i,
          demo: true,
          fecha: new Date(Date.now() - d.hace * 3600 * 1000).toISOString(),
          nombre: d.nombre, tel: d.tel, tipo: d.tipo, origen: d.origen,
          zona: d.zona, detalle: d.detalle, valoracion: d.valoracion,
          estado: d.estado, nota: d.nota, agencia: ''
        };
      });
      guardar();
      hayDemo = true;
    }
    $('demoAviso').hidden = !hayDemo;
  }

  function guardar() {
    try { localStorage.setItem(LEADS_KEY, JSON.stringify(leads)); } catch (e) { /* modo privado */ }
  }

  /* ---------- Utilidades ---------- */
  function haceTexto(iso) {
    var ms = Date.now() - new Date(iso).getTime();
    var min = Math.round(ms / 60000);
    if (min < 1) { return 'ahora mismo'; }
    if (min < 60) { return 'hace ' + min + ' min'; }
    var h = Math.round(min / 60);
    if (h < 24) { return 'hace ' + h + ' h'; }
    var d = Math.round(h / 24);
    if (d < 31) { return 'hace ' + d + ' día' + (d > 1 ? 's' : ''); }
    return new Date(iso).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
  }
  function soloDigitos(t) { return String(t).replace(/\D/g, ''); }

  /* ---------- KPIs ---------- */
  function pintaKpis() {
    var vivos = leads.filter(function (l) { return l.estado !== 'perdido'; });
    var nuevos = leads.filter(function (l) { return l.estado === 'nuevo'; });
    var props = leads.filter(function (l) { return l.tipo === 'Propietario' && l.estado !== 'perdido'; });
    var cartera = props.reduce(function (s, l) { return s + (Number(l.valoracion) || 0); }, 0);

    $('kTotal').textContent = vivos.length;
    $('kTotalPie').textContent = leads.length ? 'de ' + leads.length + ' en total' : 'Aún no ha entrado nada';
    $('kNuevos').textContent = nuevos.length;
    $('kProp').textContent = props.length;
    $('kComision').textContent = cartera ? eur.format(cartera * COMISION) : '—';
    $('kpiNuevos').classList.toggle('tiene', nuevos.length > 0);
  }

  /* ---------- Tabla ---------- */
  function visibles() {
    var t = filtro.texto.toLowerCase().trim();
    return leads.filter(function (l) {
      if (filtro.estado !== 'todos' && l.estado !== filtro.estado) { return false; }
      if (!t) { return true; }
      return (l.nombre + ' ' + l.tel + ' ' + l.zona + ' ' + l.detalle).toLowerCase().indexOf(t) !== -1;
    });
  }

  function celda(tr, lab, cls) {
    var td = document.createElement('td');
    if (lab) { td.setAttribute('data-lab', lab); }
    if (cls) { td.className = cls; }
    tr.appendChild(td);
    return td;
  }

  function pintaTabla() {
    var cuerpo = $('filas');
    cuerpo.innerHTML = '';
    var lista = visibles();

    $('vacio').hidden = lista.length > 0;

    lista.forEach(function (l) {
      var tr = document.createElement('tr');
      tr.className = 'es-' + l.estado;

      /* Entró */
      var c1 = celda(tr, 'Entró');
      var f = document.createElement('span');
      f.className = 'p-fecha';
      f.textContent = haceTexto(l.fecha);
      c1.appendChild(f);

      /* Quién */
      var c2 = celda(tr, 'Quién');
      var q = document.createElement('div');
      q.className = 'p-quien';
      var nb = document.createElement('b'); nb.textContent = l.nombre;
      var tel = document.createElement('a');
      tel.href = 'tel:' + soloDigitos(l.tel); tel.textContent = l.tel;
      var org = document.createElement('span');
      org.className = 'p-origen'; org.textContent = l.origen;
      q.appendChild(nb); q.appendChild(tel); q.appendChild(org);
      c2.appendChild(q);

      /* Qué */
      var c3 = celda(tr, 'Qué busca / qué tiene');
      var qq = document.createElement('div');
      qq.className = 'p-que';
      var zb = document.createElement('b'); zb.textContent = l.tipo + ' · ' + l.zona;
      var det = document.createElement('span'); det.textContent = l.detalle;
      qq.appendChild(zb); qq.appendChild(det);
      if (l.nota) {
        var nt = document.createElement('div');
        nt.className = 'p-nota-txt'; nt.textContent = l.nota;
        qq.appendChild(nt);
      }
      c3.appendChild(qq);

      /* Valor */
      var c4 = celda(tr, 'Valor', 'p-num');
      c4.textContent = l.valoracion ? eur.format(l.valoracion) : '—';

      /* Estado */
      var c5 = celda(tr, 'Estado');
      var sel = document.createElement('select');
      sel.className = 'p-estado';
      sel.setAttribute('data-e', l.estado);
      sel.setAttribute('aria-label', 'Estado de ' + l.nombre);
      ESTADOS.forEach(function (e) {
        var op = document.createElement('option');
        op.value = e.id; op.textContent = e.txt;
        if (e.id === l.estado) { op.selected = true; }
        sel.appendChild(op);
      });
      sel.addEventListener('change', function () {
        l.estado = sel.value;
        guardar(); pinta();
      });
      c5.appendChild(sel);

      /* Acciones */
      var c6 = celda(tr, 'Acciones');
      var acc = document.createElement('div');
      acc.className = 'p-acciones';

      var wa = document.createElement('a');
      wa.className = 'p-ico'; wa.href = 'https://wa.me/34' + soloDigitos(l.tel).replace(/^34/, '');
      wa.target = '_blank'; wa.rel = 'noopener';
      wa.title = 'Escribir por WhatsApp'; wa.textContent = '✆';
      acc.appendChild(wa);

      var nota = document.createElement('button');
      nota.type = 'button'; nota.className = 'p-ico';
      nota.title = 'Añadir o editar nota'; nota.textContent = '✎';
      nota.addEventListener('click', function () {
        var t = window.prompt('Nota sobre ' + l.nombre + ':', l.nota || '');
        if (t !== null) { l.nota = t.trim(); guardar(); pinta(); }
      });
      acc.appendChild(nota);

      var del = document.createElement('button');
      del.type = 'button'; del.className = 'p-ico p-ico--del';
      del.title = 'Borrar lead'; del.textContent = '×';
      del.addEventListener('click', function () {
        if (window.confirm('¿Borrar el lead de ' + l.nombre + '?')) {
          leads = leads.filter(function (x) { return x.id !== l.id; });
          guardar(); pinta();
        }
      });
      acc.appendChild(del);

      c6.appendChild(acc);
      cuerpo.appendChild(tr);
    });
  }

  function pinta() { pintaKpis(); pintaTabla(); }

  /* ---------- Filtros ---------- */
  $('chipsEstado').addEventListener('click', function (e) {
    var b = e.target.closest('.p-chip');
    if (!b) { return; }
    filtro.estado = b.getAttribute('data-estado');
    $('chipsEstado').querySelectorAll('.p-chip').forEach(function (c) {
      c.classList.toggle('is-on', c === b);
    });
    pintaTabla();
  });

  $('buscar').addEventListener('input', function (e) {
    filtro.texto = e.target.value;
    pintaTabla();
  });

  /* ---------- Quitar demo ---------- */
  $('limpiarDemo').addEventListener('click', function () {
    leads = leads.filter(function (l) { return !l.demo; });
    localStorage.setItem(DEMO_KEY, 'off');
    guardar();
    $('demoAviso').hidden = true;
    pinta();
  });

  /* ---------- CSV ---------- */
  $('csvBtn').addEventListener('click', function () {
    var cols = ['Fecha', 'Nombre', 'Teléfono', 'Tipo', 'Origen', 'Zona', 'Detalle', 'Valoración', 'Estado', 'Nota'];
    var filas = leads.map(function (l) {
      return [
        new Date(l.fecha).toLocaleString('es-ES'),
        l.nombre, l.tel, l.tipo, l.origen, l.zona, l.detalle,
        l.valoracion || '', (ESTADOS.filter(function (e) { return e.id === l.estado; })[0] || {}).txt || l.estado,
        l.nota || ''
      ];
    });
    var csv = [cols].concat(filas).map(function (fila) {
      return fila.map(function (c) { return '"' + String(c).replace(/"/g, '""') + '"'; }).join(';');
    }).join('\n');

    var blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'leads-widy.csv';
    a.click();
    URL.revokeObjectURL(a.href);
  });

  /* ---------- Leads que entran en vivo ---------- */
  function recarga() { cargar(); pinta(); }

  window.addEventListener('storage', function (e) {
    if (e.key === LEADS_KEY) { recarga(); }
  });
  try {
    var canal = new BroadcastChannel('widy_leads');
    canal.onmessage = function (e) {
      if (e.data && e.data.tipo === 'nuevo') { recarga(); }
    };
  } catch (e) { /* sin soporte */ }

  /* ---------- Arranque ---------- */
  cargar();
  pinta();
})();
