/* ===================================================
   Widy · Valoración de propietarios
   Calcula una estimación orientativa y registra el lead.
   =================================================== */
(function () {
  'use strict';

  var WA_NUMBER = '34624869847';
  var LEADS_KEY = 'widy_leads_v1';

  /* ---------------------------------------------------
     PRECIO MEDIO DE OFERTA POR DISTRITO (€/m²) — Sevilla capital.
     Fuente: índice de precio de vivienda de Fotocasa, julio de 2026,
     contrastado con el informe de idealista (media de la capital:
     2.902 €/m² Fotocasa vs 2.804 €/m² idealista en abril, +7,4% interanual).

     Son los 11 distritos OFICIALES y son precios de OFERTA (lo que se pide
     en los portales), no de cierre. Es a propósito: es lo que el propietario
     ve cuando mira pisos como el suyo, y lo que puede contrastar él mismo.

     ⚠️ CADUCAN. Sevilla lleva +7,4% interanual y está en máximo histórico.
     Revísalos cada 3 meses en:
     https://www.fotocasa.es/indice-precio-vivienda/sevilla-capital/todas-las-zonas
     Actualizado por última vez: julio de 2026.
     --------------------------------------------------- */
  var ACTUALIZADO = 'julio de 2026';
  var ZONAS = [
    { id: 'casco',    corto: 'el Casco Antiguo',      nombre: 'Casco Antiguo (Centro, Alameda, Santa Cruz)',  m2: 4367 },
    { id: 'remedios', corto: 'Los Remedios',          nombre: 'Los Remedios',                                 m2: 4140 },
    { id: 'triana',   corto: 'Triana',                nombre: 'Triana (incluye El Tardón)',                   m2: 4068 },
    { id: 'nervion',  corto: 'Nervión',               nombre: 'Nervión (incluye La Buhaira y San Bernardo)',  m2: 4021 },
    { id: 'sanpablo', corto: 'San Pablo-Santa Justa', nombre: 'San Pablo - Santa Justa',                      m2: 3095 },
    { id: 'sur',      corto: 'el Distrito Sur',       nombre: 'Sur (El Porvenir, Bami, Heliópolis)',          m2: 2922 },
    { id: 'palmera',  corto: 'Bellavista-La Palmera', nombre: 'Bellavista - La Palmera',                      m2: 2553 },
    { id: 'macarena', corto: 'la Macarena',           nombre: 'Macarena',                                     m2: 2410 },
    { id: 'este',     corto: 'Sevilla Este',          nombre: 'Este - Alcosa - Torreblanca',                  m2: 2144 },
    { id: 'norte',    corto: 'el Distrito Norte',     nombre: 'Norte (Pino Montano, San Jerónimo)',           m2: 1926 },
    { id: 'cerro',    corto: 'Cerro-Amate',           nombre: 'Cerro - Amate',                                m2: 1739 },
    { id: 'otra',     corto: 'Sevilla',               nombre: 'Otra zona de Sevilla',                         m2: 2902 }
  ];

  var AJUSTES = {
    estado: { reformar: { f: 0.85, txt: 'Para reformar' },
              bien:     { f: 1.00, txt: 'En buen estado' },
              reformado:{ f: 1.12, txt: 'Reformado o a estrenar' } },
    planta: { bajo:  { f: 0.92, txt: 'Bajo o entreplanta' },
              media: { f: 1.00, txt: 'Planta intermedia' },
              alta:  { f: 1.03, txt: 'Planta alta' },
              atico: { f: 1.10, txt: 'Ático' } }
  };
  var GARAJE_EUR = 18000;

  var $ = function (id) { return document.getElementById(id); };

  /* ---------- Personalización por URL (?agencia=Nombre) ---------- */
  var params = new URLSearchParams(window.location.search);
  var agencia = (params.get('agencia') || '').trim().slice(0, 40);
  if (agencia) {
    var marca = $('marcaNombre');
    if (marca) { marca.textContent = agencia; }
    document.querySelectorAll('.marca-inline').forEach(function (el) {
      el.textContent = agencia;
    });
    document.title = '¿Cuánto vale tu piso en Sevilla? — ' + agencia;
  }

  /* ---------- Rellenar zonas ---------- */
  var selZona = $('zona');
  ZONAS.forEach(function (z) {
    var op = document.createElement('option');
    op.value = z.id;
    op.textContent = z.nombre;
    selZona.appendChild(op);
  });

  var zonaTitulo = $('zonaTitulo');
  selZona.addEventListener('change', function () {
    var z = zonaFor(selZona.value);
    zonaTitulo.textContent = z ? z.corto : 'Sevilla';
  });

  function zonaFor(id) {
    for (var i = 0; i < ZONAS.length; i++) { if (ZONAS[i].id === id) { return ZONAS[i]; } }
    return null;
  }

  var eur = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
  function redondea(n) { return Math.round(n / 1000) * 1000; }

  /* ---------- Cálculo ---------- */
  var ultimo = null;

  function calcular(datos) {
    var z = zonaFor(datos.zona);
    var base = z.m2;
    var lineas = [];
    var factor = 1;

    var est = AJUSTES.estado[datos.estado];
    var pla = AJUSTES.planta[datos.planta];
    factor *= est.f;
    factor *= pla.f;
    if (est.f !== 1) { lineas.push({ txt: est.txt, pct: est.f - 1 }); }
    if (pla.f !== 1) { lineas.push({ txt: pla.txt, pct: pla.f - 1 }); }

    if (!datos.ascensor && (datos.planta === 'alta' || datos.planta === 'atico')) {
      factor *= 0.90;
      lineas.push({ txt: 'Sin ascensor en planta alta', pct: -0.10 });
    }
    if (!datos.exterior) { factor *= 0.93; lineas.push({ txt: 'Vivienda interior', pct: -0.07 }); }
    if (datos.terraza)   { factor *= 1.03; lineas.push({ txt: 'Con terraza', pct: 0.03 }); }

    var valor = datos.m2 * base * factor;
    if (datos.garaje) { valor += GARAJE_EUR; lineas.push({ txt: 'Plaza de garaje', eur: GARAJE_EUR }); }

    return {
      zonaNombre: z.corto,
      baseM2: base,
      min: redondea(valor * 0.93),
      max: redondea(valor * 1.07),
      medio: redondea(valor),
      m2Final: Math.round(valor / datos.m2),
      lineas: lineas
    };
  }

  /* ---------- Aparición del rango ----------
     El número va entero desde el primer frame: NO se cuenta de 0 al precio.
     Un contador que se congele (pestaña de fondo, móvil lento, rAF pausado)
     deja al propietario leyendo que su piso vale 28.000 € en vez de 271.000 €,
     y este es EL dato de la página. La animación va en la aparición, que si
     falla no miente. */
  function animaRango(el, min, max) {
    el.textContent = eur.format(min) + ' – ' + eur.format(max);
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { return; }
    el.classList.remove('v-pop');
    void el.offsetWidth; // reinicia la animación si se calcula otro piso
    el.classList.add('v-pop');
  }

  /* ---------- Envío del formulario de cálculo ---------- */
  $('valForm').addEventListener('submit', function (e) {
    e.preventDefault();
    var msg = $('valMsg');

    var m2 = parseInt($('m2').value, 10);
    if (!selZona.value) { setMsg(msg, 'Elige la zona donde está tu piso.', 'error'); return; }
    if (!m2 || m2 < 20 || m2 > 600) { setMsg(msg, 'Escribe los metros cuadrados (entre 20 y 600).', 'error'); return; }
    setMsg(msg, '', '');

    var datos = {
      zona: selZona.value,
      m2: m2,
      habs: $('habs').value,
      estado: $('estado').value,
      planta: $('planta').value,
      ascensor: $('ascensor').checked,
      exterior: $('exterior').checked,
      terraza: $('terraza').checked,
      garaje: $('garaje').checked
    };

    var r = calcular(datos);
    ultimo = { datos: datos, resultado: r };

    $('rango').textContent = '—';
    $('detalleM2').textContent = r.zonaNombre + ' · ' + datos.m2 + ' m² · unos ' +
      eur.format(r.m2Final) + '/m²';

    var des = $('desglose');
    des.innerHTML = '';
    addLinea(des, 'Precio medio en ' + r.zonaNombre + ' (' + ACTUALIZADO + ')', eur.format(r.baseM2) + '/m²', '');
    r.lineas.forEach(function (l) {
      if (l.eur) {
        addLinea(des, l.txt, '+ ' + eur.format(l.eur), 'suma');
      } else {
        var pct = Math.round(l.pct * 100);
        addLinea(des, l.txt, (pct > 0 ? '+' : '') + pct + ' %', pct > 0 ? 'suma' : 'resta');
      }
    });
    addLinea(des, 'Estimación central', eur.format(r.medio), '');

    $('marcaMin').textContent = eur.format(r.min);
    $('marcaMax').textContent = eur.format(r.max);

    $('pasoForm').hidden = true;
    $('pasoResultado').hidden = false;
    window.scrollTo({ top: 0, behavior: 'smooth' });

    animaRango($('rango'), r.min, r.max);
    setTimeout(function () { $('barraFill').style.width = '100%'; }, 120);
  });

  function addLinea(ul, txt, val, cls) {
    var li = document.createElement('li');
    if (cls) { li.className = cls; }
    var a = document.createElement('span'); a.textContent = txt;
    var b = document.createElement('span'); b.textContent = val;
    li.appendChild(a); li.appendChild(b);
    ul.appendChild(li);
  }

  /* ---------- Volver a calcular ---------- */
  $('otraBtn').addEventListener('click', function () {
    $('pasoResultado').hidden = true;
    $('pasoForm').hidden = false;
    $('barraFill').style.width = '0';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  /* ---------- Lead: guardar + avisar ---------- */
  $('contactoForm').addEventListener('submit', function (e) {
    e.preventDefault();
    var msg = $('cfMsg');
    var nombre = ($('cf-nombre').value || '').trim();
    var tel = ($('cf-tel').value || '').trim();

    if (!nombre || !tel) { setMsg(msg, 'Escribe tu nombre y tu teléfono para que podamos llamarte.', 'error'); return; }
    if (!ultimo) { setMsg(msg, 'Calcula primero la valoración.', 'error'); return; }

    var lead = {
      id: 'ld_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
      fecha: new Date().toISOString(),
      nombre: nombre,
      tel: tel,
      tipo: 'Propietario',
      origen: 'Web de valoración',
      zona: ultimo.resultado.zonaNombre,
      detalle: ultimo.datos.m2 + ' m² · ' + ultimo.datos.habs + ' hab · ' +
               AJUSTES.estado[ultimo.datos.estado].txt,
      valoracion: ultimo.resultado.medio,
      rango: [ultimo.resultado.min, ultimo.resultado.max],
      agencia: agencia || '',
      estado: 'nuevo',
      nota: ''
    };

    guardaLead(lead);

    var texto =
      '🏠 NUEVO PROPIETARIO — Web de valoración\n\n' +
      '• Nombre: ' + nombre + '\n' +
      '• Teléfono: ' + tel + '\n' +
      '• Zona: ' + lead.zona + '\n' +
      '• Piso: ' + lead.detalle + '\n' +
      '• Estimación: ' + eur.format(ultimo.resultado.min) + ' – ' + eur.format(ultimo.resultado.max) +
      (agencia ? '\n• Agencia: ' + agencia : '');

    setMsg(msg, '¡Listo! Te llamamos hoy mismo para darte el precio afinado.', 'ok');
    e.target.querySelector('button[type="submit"]').disabled = true;

    window.open('https://wa.me/' + WA_NUMBER + '?text=' + encodeURIComponent(texto), '_blank', 'noopener');
  });

  function guardaLead(lead) {
    var lista = [];
    try { lista = JSON.parse(localStorage.getItem(LEADS_KEY) || '[]'); } catch (err) { lista = []; }
    lista.unshift(lead);
    try { localStorage.setItem(LEADS_KEY, JSON.stringify(lista)); } catch (err) { /* modo privado */ }
    try { new BroadcastChannel('widy_leads').postMessage({ tipo: 'nuevo', lead: lead }); } catch (err) { /* sin soporte */ }
  }

  function setMsg(el, text, type) {
    if (!el) { return; }
    el.textContent = text;
    el.className = 'form-msg' + (type ? ' ' + type : '');
  }
})();
