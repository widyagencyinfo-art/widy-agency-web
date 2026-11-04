(function () {
  'use strict';
  var q = new URLSearchParams(location.search);
  var color = (q.get('color') || '0e0e10').replace(/[^0-9a-fA-F]/g, '').slice(0, 6);
  if (color.length === 6 || color.length === 3) { document.getElementById('wg').style.setProperty('--c', '#' + color); }
  var nombre = (q.get('nombre') || '').slice(0, 60);
  if (nombre) { document.getElementById('wgTitulo').textContent = 'Calcula tu cuota en ' + nombre; }
  function n(id) { var v = String(document.getElementById(id).value || '').replace(/\./g, '').replace(',', '.'); var x = parseFloat(v); return isFinite(x) ? x : 0; }
  function eur(v) { var p = v.toFixed(2).split('.'); return p[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.') + ',' + p[1] + ' €/mes'; }
  function calc() {
    var cap = Math.max(0, n('w-precio') - n('w-entrada')), m = parseInt(document.getElementById('w-meses').value, 10) || 72, i = n('w-tin') / 1200;
    var c = cap <= 0 ? 0 : (i === 0 ? cap / m : cap * i / (1 - Math.pow(1 + i, -m)));
    document.getElementById('w-cuota').textContent = c ? eur(c) : '—';
    document.getElementById('w-tae').textContent = c ? m + ' meses · importe financiado ' + Math.round(cap).toLocaleString('es-ES') + ' €' : '';
  }
  document.getElementById('wgForm').addEventListener('input', calc);
  document.getElementById('wgForm').addEventListener('change', calc);
  calc();
})();
