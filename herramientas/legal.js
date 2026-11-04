/* Widy — generador de aviso legal y política de privacidad.
   Todo se genera en el navegador. El borrador se guarda en localStorage de este equipo, nada más. */
(function () {
  'use strict';
  var KEY = 'widy-legal-v1';
  var $ = function (id) { return document.getElementById(id); };
  var form = $('lgForm');
  if (!form) return;

  var CAMPOS = ['lg-nombre', 'lg-nif', 'lg-comercial', 'lg-web', 'lg-dir', 'lg-mail', 'lg-tel', 'lg-registro',
    'lg-proveedores', 'lg-dpd', 'lg-autorizacion', 'lg-colegio', 'lg-ncol', 'lg-titulo', 'lg-pais', 'lg-normas'];
  var CHECKS = ['lg-salud', 'lg-fuera', 'lg-colegiado'];
  var doc = 'aviso';

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function v(id) { var el = $(id); return el ? el.value.trim() : ''; }
  function hueco(txt, etiqueta) { return txt ? esc(txt) : '<mark class="lg-hueco">[' + etiqueta + ']</mark>'; }
  function usos() {
    return Array.prototype.map.call(form.querySelectorAll('input[name="lg-uso"]:checked'), function (x) { return x.value; });
  }
  function tipo() { var r = form.querySelector('input[name="lg-tipo"]:checked'); return r ? r.value : 'autonomo'; }
  function fecha() {
    var m = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
    var d = new Date(); return m[d.getMonth()] + ' de ' + d.getFullYear();
  }
  function webTxt() { return v('lg-web').replace(/^https?:\/\//, '').replace(/\/$/, ''); }
  function titular() {
    var n = hueco(v('lg-nombre'), tipo() === 'sociedad' ? 'Razón social' : 'Nombre y apellidos');
    return v('lg-comercial') ? n + ' («' + esc(v('lg-comercial')) + '»)' : n;
  }

  /* ---------- aviso legal ---------- */
  function avisoLegal() {
    var soc = tipo() === 'sociedad', u = usos(), web = webTxt();
    var h = '<h2>Aviso legal</h2>' +
      '<p>En cumplimiento del artículo 10 de la Ley 34/2002, de 11 de julio, de servicios de la sociedad de la información y de comercio electrónico (LSSI), estos son los datos del titular de esta web' + (web ? ' (' + esc(web) + ')' : '') + ':</p><ul>' +
      '<li><strong>' + (soc ? 'Razón social' : 'Titular') + ':</strong> ' + titular() + '</li>' +
      '<li><strong>NIF:</strong> ' + hueco(v('lg-nif'), 'NIF') + '</li>' +
      '<li><strong>Domicilio:</strong> ' + hueco(v('lg-dir'), 'Domicilio') + '</li>' +
      '<li><strong>Correo electrónico:</strong> ' + hueco(v('lg-mail'), 'Correo') + '</li>' +
      (v('lg-tel') ? '<li><strong>Teléfono:</strong> ' + esc(v('lg-tel')) + '</li>' : '') +
      (soc ? '<li><strong>Datos registrales:</strong> ' + hueco(v('lg-registro'), 'Registro Mercantil, tomo, folio, hoja e inscripción') + '</li>' : '') +
      (v('lg-autorizacion') ? '<li><strong>Autorización administrativa:</strong> ' + esc(v('lg-autorizacion')) + '</li>' : '') +
      '</ul>';
    if ($('lg-colegiado').checked) {
      h += '<h3>Profesión regulada</h3><ul>' +
        '<li><strong>Colegio profesional:</strong> ' + hueco(v('lg-colegio'), 'Colegio') + '</li>' +
        '<li><strong>Número de colegiado:</strong> ' + hueco(v('lg-ncol'), 'Número') + '</li>' +
        '<li><strong>Título:</strong> ' + hueco(v('lg-titulo'), 'Título') + ', expedido en ' + hueco(v('lg-pais'), 'País') + '</li>' +
        '<li><strong>Normas profesionales:</strong> ' + hueco(v('lg-normas'), 'Normas y dónde consultarlas') + '</li></ul>';
    }
    h += '<h3>Uso de la web</h3><p>Quien navega por esta web se compromete a usarla de buena fe y conforme a la ley. No está permitido usarla para causar daños al titular o a terceros, introducir programas dañinos ni hacer nada que impida su funcionamiento normal.</p>' +
      '<h3>Propiedad intelectual</h3><p>Los textos, fotografías, logotipos y el diseño de esta web pertenecen al titular o se usan con permiso de sus autores. No se pueden copiar, distribuir ni usar con fines comerciales sin autorización.</p>' +
      '<h3>Enlaces a otras webs</h3><p>Esta web puede enlazar a páginas de terceros. El titular no controla su contenido y no responde de él.</p>';
    if (u.indexOf('tienda') > -1) {
      h += '<h3>Precios</h3><p>Los precios de esta web están en euros e incluyen el IVA, salvo que se indique lo contrario. Los gastos de envío, si los hay, se indican antes de terminar la compra.</p>';
    }
    h += '<h3>Protección de datos</h3><p>Cómo tratamos los datos personales se explica en la política de privacidad de esta web.</p>' +
      '<h3>Ley aplicable</h3><p>Esta web se rige por la ley española. Si eres consumidor, conservas los derechos que te reconoce la normativa de consumo, incluido el de acudir a los juzgados de tu domicilio.</p>' +
      '<p><em>Última actualización: ' + fecha() + '.</em></p>';
    return h;
  }

  /* ---------- política de privacidad ---------- */
  var FINES = {
    contacto: {
      t: 'Consultas y presupuestos',
      f: 'Responder a tus consultas y, si nos lo pides, prepararte un presupuesto.',
      b: 'Tu consentimiento al escribirnos (artículo 6.1.a del RGPD) y, para el presupuesto, la aplicación de medidas precontractuales a petición tuya (artículo 6.1.b).',
      p: 'El tiempo necesario para atenderte. Después, los datos se conservan bloqueados solo durante los plazos en que puedan surgir responsabilidades, y luego se borran.'
    },
    whatsapp: {
      t: 'WhatsApp y teléfono',
      f: 'Hablar contigo cuando nos escribes por WhatsApp o nos llamas.',
      b: 'Tu consentimiento al contactarnos (artículo 6.1.a del RGPD).',
      p: 'El tiempo necesario para atenderte. Después, bloqueados durante los plazos en que puedan surgir responsabilidades, y luego se borran.',
      x: 'WhatsApp es un servicio de WhatsApp Ireland Limited: cuando lo usas, se aplica también su propia política de privacidad.'
    },
    reservas: {
      t: 'Citas y reservas',
      f: 'Gestionar tu cita o reserva y avisarte de ella.',
      b: 'La ejecución del servicio que nos pides o la aplicación de medidas precontractuales a petición tuya (artículo 6.1.b del RGPD).',
      p: 'Mientras dure la relación contigo. Después, bloqueados durante los plazos en que puedan surgir responsabilidades, y luego se borran.'
    },
    tienda: {
      t: 'Pedidos de la tienda online',
      f: 'Gestionar tus pedidos, cobros, envíos, devoluciones y facturas.',
      b: 'La ejecución del contrato de compra (artículo 6.1.b del RGPD) y el cumplimiento de obligaciones legales, como las fiscales y contables (artículo 6.1.c).',
      p: 'Mientras dure la relación contigo y, después, durante los plazos que exige la ley (por ejemplo, seis años para la documentación contable, según el artículo 30 del Código de Comercio).'
    },
    boletin: {
      t: 'Boletín de novedades',
      f: 'Enviarte novedades y ofertas por correo electrónico.',
      b: 'Tu consentimiento (artículo 6.1.a del RGPD), que puedes retirar cuando quieras con el enlace de baja de cada correo.',
      p: 'Hasta que te des de baja.'
    },
    cv: {
      t: 'Currículums',
      f: 'Valorar tu candidatura en nuestros procesos de selección.',
      b: 'Tu consentimiento al enviarnos el currículum (artículo 6.1.a del RGPD).',
      p: 'Lo que dure el proceso de selección. Si nos autorizas a tenerte en cuenta para futuros puestos, hasta que nos pidas que lo borremos.'
    }
  };

  function privacidad() {
    var u = usos(), web = webTxt(), mail = v('lg-mail');
    var h = '<h2>Política de privacidad</h2>' +
      '<p>Esta política explica cómo tratamos los datos personales que recogemos a través de ' + (web ? esc(web) : 'esta web') +
      ', conforme al Reglamento (UE) 2016/679 (RGPD) y a la Ley Orgánica 3/2018, de protección de datos personales y garantía de los derechos digitales (LOPDGDD).</p>' +
      '<h3>1. Quién es el responsable</h3><ul>' +
      '<li><strong>Responsable:</strong> ' + titular() + ', con NIF ' + hueco(v('lg-nif'), 'NIF') + '</li>' +
      '<li><strong>Domicilio:</strong> ' + hueco(v('lg-dir'), 'Domicilio') + '</li>' +
      '<li><strong>Correo:</strong> ' + hueco(mail, 'Correo') + '</li>' +
      (v('lg-tel') ? '<li><strong>Teléfono:</strong> ' + esc(v('lg-tel')) + '</li>' : '') +
      (v('lg-dpd') ? '<li><strong>Delegado de protección de datos:</strong> ' + esc(v('lg-dpd')) + '</li>' : '') +
      '</ul><h3>2. Para qué usamos tus datos, con qué base legal y cuánto tiempo los guardamos</h3>';
    if (!u.length) {
      h += '<p>Esta web no recoge datos personales con formularios. Si nos escribes por correo, usaremos tus datos solo para contestarte, con base en tu consentimiento (artículo 6.1.a del RGPD), y los conservaremos el tiempo necesario para atenderte.</p>';
    }
    u.forEach(function (k) {
      var f = FINES[k];
      h += '<p><strong>' + f.t + '</strong></p><ul><li><strong>Para qué:</strong> ' + f.f + '</li><li><strong>Base legal:</strong> ' + f.b +
        '</li><li><strong>Cuánto tiempo:</strong> ' + f.p + '</li></ul>' + (f.x ? '<p>' + f.x + '</p>' : '');
    });
    if (u.length) {
      h += '<p>Los datos que marcamos como obligatorios en los formularios son necesarios para atenderte: si no nos los das, no podremos responder a tu solicitud.</p>';
    }
    h += '<h3>3. A quién damos tus datos</h3><p>No cedemos tus datos a terceros, salvo obligación legal (por ejemplo, a la Agencia Tributaria o a jueces y tribunales).</p>';
    if (u.indexOf('tienda') > -1) h += '<p>Para entregarte un pedido, damos los datos necesarios a la empresa de transporte y a la entidad que procesa el pago.</p>';
    h += '<p>' + (v('lg-proveedores')
      ? 'Estos proveedores nos prestan servicios y pueden acceder a los datos solo para ese fin, con el contrato de encargado del tratamiento que exige el artículo 28 del RGPD: ' + esc(v('lg-proveedores')) + '.'
      : 'Los proveedores que nos prestan servicios (por ejemplo, el alojamiento de la web o el correo) pueden acceder a los datos solo para ese fin, con el contrato de encargado del tratamiento que exige el artículo 28 del RGPD.') + '</p>';
    h += '<h3>4. Transferencias fuera de la Unión Europea</h3>' + ($('lg-fuera').checked
      ? '<p>Algunos de nuestros proveedores están fuera del Espacio Económico Europeo. En esos casos, la transferencia se ampara en una decisión de adecuación de la Comisión Europea (como el Marco de Privacidad de Datos UE-EE. UU., para las empresas adheridas) o en las cláusulas contractuales tipo aprobadas por la Comisión. Puedes pedirnos más información en ' + hueco(mail, 'Correo') + '.</p>'
      : '<p>No transferimos tus datos fuera del Espacio Económico Europeo' + (u.indexOf('whatsapp') > -1 ? ', salvo lo que haga WhatsApp según su propia política cuando lo usas para escribirnos' : '') + '.</p>');
    h += '<h3>5. Tus derechos</h3><p>Puedes pedirnos en cualquier momento acceder a tus datos, rectificarlos o suprimirlos, limitar su tratamiento, oponerte a él y recibirlos para llevarlos a otro sitio (portabilidad). Si nos diste tu consentimiento, puedes retirarlo cuando quieras, sin que eso afecte a lo que hicimos antes. Escríbenos a ' +
      hueco(mail, 'Correo') + ' diciendo qué derecho quieres ejercer; si hace falta, te pediremos que acredites tu identidad.</p>' +
      '<p>Si crees que no hemos tratado bien tus datos, puedes presentar una reclamación ante la Agencia Española de Protección de Datos (www.aepd.es).</p>' +
      '<h3>6. Decisiones automatizadas</h3><p>No tomamos decisiones automatizadas ni elaboramos perfiles con tus datos.</p>' +
      '<h3>7. Seguridad y cambios</h3><p>Aplicamos medidas técnicas y organizativas para proteger tus datos. Si cambiamos esta política, publicaremos aquí la nueva versión.</p>' +
      '<p><em>Última actualización: ' + fecha() + '.</em></p>';
    return h;
  }

  /* ---------- primera capa para el formulario ---------- */
  function capa() {
    var u = usos(), fines = [];
    if (u.indexOf('contacto') > -1) fines.push('responder a tu consulta o preparar tu presupuesto');
    if (u.indexOf('reservas') > -1) fines.push('gestionar tu cita');
    if (u.indexOf('tienda') > -1) fines.push('gestionar tu pedido');
    if (u.indexOf('cv') > -1) fines.push('valorar tu candidatura');
    if (!fines.length) fines.push('responder a tu mensaje');
    var fin = fines.length > 1 ? fines.slice(0, -1).join(', ') + ' y ' + fines[fines.length - 1] : fines[0];
    var h = '<h2>Texto para debajo del formulario</h2>' +
      '<p>Pega esto justo debajo del botón de enviar, con un enlace a tu política de privacidad:</p>' +
      '<blockquote><p><strong>Responsable:</strong> ' + titular().replace(/\.$/, '') + '. <strong>Finalidad:</strong> ' + fin + '. <strong>Derechos:</strong> acceso, rectificación, supresión y los demás que se explican en la política de privacidad.</p></blockquote>';
    if (u.indexOf('boletin') > -1) {
      h += '<p>Y, aparte, una casilla <strong>sin marcar</strong> para el boletín:</p><blockquote><p>☐ Quiero recibir novedades y ofertas por correo. Puedo darme de baja cuando quiera.</p></blockquote>';
    }
    h += '<p>Es la «información básica» que permite el artículo 11 de la LOPDGDD: lo esencial a la vista y el resto en la política de privacidad.</p>';
    return h;
  }

  /* ---------- pintar ---------- */
  var TIT = { aviso: 'Aviso legal', privacidad: 'Política de privacidad', capa: 'Texto para el formulario' };
  function pintar() {
    var soc = tipo() === 'sociedad';
    $('lg-nombre-lbl').textContent = soc ? 'Razón social' : 'Nombre y apellidos';
    $('lg-registro-wrap').hidden = !soc;
    $('lg-colegio-wrap').hidden = !$('lg-colegiado').checked;
    $('lg-salud-aviso').hidden = !$('lg-salud').checked;
    $('lgDoc').innerHTML = doc === 'aviso' ? avisoLegal() : doc === 'privacidad' ? privacidad() : capa();
    $('lg-titulo-doc').textContent = TIT[doc];
    var falta = [];
    if (!v('lg-nombre')) falta.push(soc ? 'razón social' : 'nombre');
    if (!v('lg-nif')) falta.push('NIF');
    if (!v('lg-dir')) falta.push('domicilio');
    if (!v('lg-mail')) falta.push('correo');
    if (soc && !v('lg-registro')) falta.push('datos del registro');
    $('lg-falta').textContent = falta.length ? 'Te falta: ' + falta.join(', ') + '. Sale marcado en amarillo.' : 'Todo relleno. Revísalo y cópialo.';
    guardar();
  }

  var tG;
  function guardar(ya) {
    clearTimeout(tG);
    tG = setTimeout(function () {
      var st = { tipo: tipo(), usos: usos(), doc: doc, c: {}, k: {} };
      CAMPOS.forEach(function (id) { st.c[id] = v(id); });
      CHECKS.forEach(function (id) { st.k[id] = $(id).checked; });
      try { localStorage.setItem(KEY, JSON.stringify(st)); } catch (e) {}
    }, ya ? 0 : 400);
  }
  window.addEventListener('pagehide', function () { guardar(true); });
  function cargar() {
    var st;
    try { st = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) { st = null; }
    if (!st) return;
    CAMPOS.forEach(function (id) { if (st.c && st.c[id] != null && $(id)) $(id).value = st.c[id]; });
    CHECKS.forEach(function (id) { if (st.k && id in st.k) $(id).checked = !!st.k[id]; });
    var r = form.querySelector('input[name="lg-tipo"][value="' + st.tipo + '"]'); if (r) r.checked = true;
    if (Array.isArray(st.usos)) form.querySelectorAll('input[name="lg-uso"]').forEach(function (x) { x.checked = st.usos.indexOf(x.value) > -1; });
    if (TIT[st.doc]) elegir(st.doc, true);
  }

  function elegir(d, sinPintar) {
    doc = d;
    document.querySelectorAll('.lg-tab').forEach(function (b) { b.setAttribute('aria-selected', b.dataset.doc === d ? 'true' : 'false'); });
    if (!sinPintar) pintar();
  }
  document.querySelectorAll('.lg-tab').forEach(function (b) { b.addEventListener('click', function () { elegir(b.dataset.doc); }); });
  form.addEventListener('input', pintar);
  form.addEventListener('change', pintar);

  function copiar(txt, boton, ok) {
    var hecho = function () { var t = boton.textContent; boton.textContent = ok; setTimeout(function () { boton.textContent = t; }, 1800); };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(txt).then(hecho, function () { viejo(); });
    } else viejo();
    function viejo() {
      var ta = document.createElement('textarea'); ta.value = txt; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); hecho(); } catch (e) {}
      document.body.removeChild(ta);
    }
  }
  $('lg-copiar').addEventListener('click', function () { copiar($('lgDoc').innerText.trim(), this, 'Copiado ✓'); });
  $('lg-copiar-html').addEventListener('click', function () {
    var html = $('lgDoc').innerHTML.replace(/<mark class="lg-hueco">([^<]*)<\/mark>/g, '$1').replace(/></g, '>\n<');
    copiar(html, this, 'HTML copiado ✓');
  });
  $('lg-ver').addEventListener('click', function () { $('texto').scrollIntoView({ behavior: 'smooth', block: 'start' }); });

  cargar(); pintar();
})();
