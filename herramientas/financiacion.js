/* ===================================================
   Widy — Calculadora de financiación de coches
   Sistema francés (cuota fija). TAE calculada por TIR mensual
   con la comisión de apertura descontada del capital.
   Todo en el navegador; no se envía nada.
   =================================================== */
(function () {
  'use strict';

  function $(id) { return document.getElementById(id); }
  var form = $('finCalc');
  if (!form) { return; }

  function num(id) {
    var v = String($(id).value || '').replace(/\./g, '').replace(',', '.');
    var n = parseFloat(v);
    return isFinite(n) ? n : 0;
  }
  function eur(n, dec) {
    var d = dec === undefined ? 2 : dec;
    var partes = Math.abs(n).toFixed(d).split('.');
    var ent = partes[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return (n < 0 ? '-' : '') + ent + (d ? ',' + partes[1] : '') + '\u00a0€';
  }
  function miles(n) { return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '.'); }
  function pctTxt(n) { return n.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' %'; }

  function cuota(capital, tinAnual, meses) {
    var i = tinAnual / 100 / 12;
    if (i === 0) { return capital / meses; }
    return capital * i / (1 - Math.pow(1 + i, -meses));
  }
  // TIR mensual: capital neto recibido = suma de cuotas descontadas
  function tae(neto, c, meses) {
    if (neto <= 0 || c <= 0) { return 0; }
    var lo = 0, hi = 1;
    for (var k = 0; k < 200; k++) {
      var mid = (lo + hi) / 2;
      var pv = mid === 0 ? c * meses : c * (1 - Math.pow(1 + mid, -meses)) / mid;
      if (pv > neto) { lo = mid; } else { hi = mid; }
    }
    return (Math.pow(1 + (lo + hi) / 2, 12) - 1) * 100;
  }

  function calcular() {
    var precio = num('fc-precio');
    var entrada = num('fc-entrada');
    var meses = parseInt($('fc-meses').value, 10) || 72;
    var tin = num('fc-tin');
    var comPct = num('fc-comision');
    var capital = Math.max(0, precio - entrada);
    var out = $('fcOut');
    if (!precio || capital <= 0) {
      out.classList.add('fc-vacio');
      $('fc-cuota').textContent = '—';
      return;
    }
    out.classList.remove('fc-vacio');
    var com = capital * comPct / 100;
    var c = cuota(capital, tin, meses);
    var totalAdeudado = c * meses + com;
    var intereses = c * meses - capital;
    var t = tae(capital - com, c, meses);
    var totalPlazos = entrada + totalAdeudado;
    $('fc-cuota').textContent = eur(c);
    $('fc-meses-txt').textContent = meses + ' meses';
    $('fc-capital').textContent = eur(capital, 0);
    $('fc-intereses').textContent = eur(intereses);
    $('fc-com').textContent = eur(com);
    $('fc-total').textContent = eur(totalAdeudado);
    $('fc-plazos').textContent = eur(totalPlazos);
    $('fc-tae').textContent = pctTxt(t);
    $('fc-ejemplo').value =
      'Ejemplo de financiación para un vehículo de ' + miles(precio) + ' € de precio al contado, con una entrada de ' + miles(entrada) +
      ' € e importe financiado de ' + miles(capital) + ' €, a ' + meses + ' meses. TIN ' + pctTxt(tin) + '. Comisión de apertura ' +
      pctTxt(comPct) + ' (' + eur(com) + '). Cuota mensual: ' + eur(c) + '. TAE ' + pctTxt(t) + '. Importe total adeudado: ' +
      eur(totalAdeudado) + '. Precio total a plazos: ' + eur(totalPlazos) + '. Financiación sujeta a aprobación de la entidad financiera. Atención: tomar dinero prestado cuesta dinero.';
  }

  form.addEventListener('input', calcular);
  form.addEventListener('change', calcular);
  form.addEventListener('submit', function (e) { e.preventDefault(); });

  var copiar = $('fc-copiar');
  if (copiar) {
    copiar.addEventListener('click', function () {
      var t = $('fc-ejemplo');
      t.select();
      var ok = function () { var a = copiar.textContent; copiar.textContent = '¡Copiado!'; setTimeout(function () { copiar.textContent = a; }, 1600); };
      if (navigator.clipboard) { navigator.clipboard.writeText(t.value).then(ok, function () { document.execCommand('copy'); ok(); }); }
      else { document.execCommand('copy'); ok(); }
    });
  }

  // Código para insertar en la web del concesionario
  var emb = $('fc-embed'), color = $('fc-color'), nombre = $('fc-nombre');
  function codigo() {
    if (!emb) { return; }
    var c = (color && color.value || '#0e0e10').replace('#', '');
    var n = encodeURIComponent((nombre && nombre.value || '').trim());
    var src = 'https://widy.agency/widget/calculadora-coche?color=' + c + (n ? '&nombre=' + n : '');
    emb.value = '<iframe src="' + src + '" title="Calculadora de financiación" width="100%" height="560" style="border:0;max-width:520px" loading="lazy"></iframe>\n' +
      '<p style="font:12px sans-serif;max-width:520px">Calculadora de <a href="https://widy.agency/calculadora-financiacion-coche">financiación de coches</a> de Widy</p>';
    var pv = $('fc-preview');
    if (pv) { pv.src = src.replace('https://widy.agency', ''); }
  }
  [color, nombre].forEach(function (el) { if (el) { el.addEventListener('input', codigo); } });
  var copEmb = $('fc-copiar-embed');
  if (copEmb) {
    copEmb.addEventListener('click', function () {
      emb.select();
      var a = copEmb.textContent;
      var ok = function () { copEmb.textContent = '¡Copiado!'; setTimeout(function () { copEmb.textContent = a; }, 1600); };
      if (navigator.clipboard) { navigator.clipboard.writeText(emb.value).then(ok, function () { document.execCommand('copy'); ok(); }); }
      else { document.execCommand('copy'); ok(); }
    });
  }
  calcular();
  codigo();
})();
