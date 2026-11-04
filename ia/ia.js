(function () {
  var $ = function (id) { return document.getElementById(id); };
  var sinMovimiento = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ============ NAV ============
  var nav = $('nav');
  var alScroll = function () { if (nav) { nav.classList.toggle('solido', scrollY > 40); } };
  alScroll();
  addEventListener('scroll', alScroll, { passive: true });

  var enlaces = document.querySelectorAll('.nav-links a');
  if ('IntersectionObserver' in window && enlaces.length) {
    var ioNav = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        enlaces.forEach(function (a) {
          var on = a.getAttribute('href') === '#' + e.target.id;
          a.classList.toggle('activo', on);
          if (on) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current');
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    enlaces.forEach(function (a) { var t = document.querySelector(a.getAttribute('href')); if (t) ioNav.observe(t); });
  }

  // ============ MARQUESINA ============
  var herramientas = ['SAP', 'Sage', 'a3', 'Holded', 'Odoo', 'Microsoft Dynamics', 'Salesforce', 'HubSpot',
    'Microsoft 365', 'Google Workspace', 'WhatsApp Business', 'Excel y SharePoint', 'Prestashop', 'Shopify',
    'Navision', 'Software de gestión propio', 'Google Calendar', 'Power BI'];
  var track = $('marquee');
  if (track) {
    track.innerHTML = herramientas.concat(herramientas).map(function (h) { return '<span>' + h + '</span>'; }).join('');
  }

  // ============ DEMOS EN VIVO ============
  var DEMOS = [
    {
      titulo: 'El pedido que nadie teclea',
      dispositivo: 'agente-pedidos · en directo',
      texto: 'Cada cliente manda el pedido a su manera: en el cuerpo del correo, en un Excel o en un PDF escaneado. El agente lo entiende, comprueba stock y tarifa, lo crea en el ERP y confirma al cliente con su número de pedido.',
      puntos: ['Lee cualquier formato, también escaneados', 'Comprueba stock, tarifa y condiciones del cliente', 'Avisa a una persona solo si algo no cuadra'],
      guion: [
        { doc: 'De: compras@distribuciones-sur.es', txt: 'Buenas, para el jueves: 40 cajas ref. 2210, 25 de la 2214 y 10 palés de agua 1,5 L. Entrega en el almacén de Dos Hermanas. Gracias.' },
        { t: '09:14:02', k: 'Correo leído', v: 'pedido detectado · cliente C-0418' },
        { t: '09:14:03', k: 'Líneas extraídas', v: '3 referencias · 75 unidades' },
        { t: '09:14:04', k: 'Stock y tarifa comprobados', v: 'ERP · todo disponible' },
        { t: '09:14:05', k: 'Pedido creado', v: 'PV-26-08812 · entrega jueves' },
        { t: '09:14:06', k: 'Confirmación enviada', v: 'al cliente, con el nº de pedido' },
        { t: '09:14:06', k: 'Tiempo total', v: '4 segundos · antes: 12 minutos' }
      ]
    },
    {
      titulo: 'El cliente que escribe a las 23:41',
      dispositivo: 'agente-whatsapp · en directo',
      texto: 'Atiende por WhatsApp, correo o web con vuestra información real: estado del pedido, disponibilidad, plazos. Resuelve lo que puede resolver y lo que no, lo pasa a una persona con el caso ya resumido.',
      puntos: ['Contesta en segundos, a cualquier hora', 'Consulta vuestro ERP antes de responder', 'Escala a una persona con el caso resumido'],
      guion: [
        { chat: 'ellos', txt: '¿Me podéis decir si el pedido 26-08791 sale mañana? Lo necesito para el finde', hora: '23:41' },
        { chat: 'nos', txt: 'Hola, buenas noches. Soy el asistente de IA de la empresa. Miro ahora mismo el 26-08791.', hora: '23:41' },
        { t: '23:41', k: 'Consulta al ERP', v: 'pedido 26-08791 · preparado' },
        { chat: 'nos', txt: 'Está preparado y sale mañana a primera hora en la ruta de Sevilla. Entrega prevista: viernes antes de las 13:00. ¿Quieres que te avise cuando salga del almacén?', hora: '23:41' },
        { chat: 'ellos', txt: 'Perfecto, sí, avísame. Y añádeme 5 cajas de la 2214 si llego a tiempo', hora: '23:42' },
        { t: '23:42', k: 'Ampliación registrada', v: '5 uds. ref. 2214 · pendiente de validar' },
        { t: '23:42', k: 'Aviso al responsable', v: 'para aprobar la ampliación a primera hora' }
      ]
    },
    {
      titulo: 'El presupuesto que nadie perseguía',
      dispositivo: 'agente-voz · llamada saliente',
      texto: 'Un agente de voz llama para hacer seguimiento, confirmar citas o recordar entregas. Se presenta como IA, hace una sola pregunta y deja el resultado apuntado en el CRM. Si piden hablar con una persona, transfiere.',
      puntos: ['Voz natural, se identifica como IA', 'Una llamada, un objetivo claro', 'Resultado y resumen apuntados en el CRM'],
      guion: [
        { t: '10:02', k: 'Llamada saliente', v: 'Talleres Herrera · presupuesto P-2211' },
        { onda: true },
        { voz: 'Agente', txt: 'Buenos días, llamo de parte de la empresa. Soy un asistente de inteligencia artificial. Es por el presupuesto que os enviamos la semana pasada, ¿lo habéis podido ver?' },
        { voz: 'Cliente', txt: 'Sí, lo vimos. Nos interesa, pero queríamos ajustar el plazo de entrega.' },
        { t: '10:03', k: 'Intención detectada', v: 'interesado · objeción de plazo' },
        { voz: 'Agente', txt: 'Perfecto. Le paso con el responsable para cerrar la fecha, ¿le viene bien ahora?' },
        { t: '10:03', k: 'CRM actualizado', v: 'P-2211 · a negociación · llamada transferida' }
      ]
    }
  ];

  var cuerpo = $('demo-body'), tabsDemo = $('demo-tabs');
  var temporizadores = [], actual = 0;

  function limpiaTemporizadores() { temporizadores.forEach(clearTimeout); temporizadores = []; }

  function nodo(p) {
    var el = document.createElement('div');
    if (p.doc) {
      el.className = 'linea doc';
      el.innerHTML = '<b>' + p.doc + '</b>' + p.txt;
    } else if (p.chat) {
      el.className = 'burbuja ' + p.chat;
      el.innerHTML = p.txt + '<small>' + p.hora + '</small>';
    } else if (p.voz) {
      el.className = 'linea voz';
      el.innerHTML = '<b>' + p.voz + ':</b> ' + p.txt;
    } else if (p.onda) {
      el.className = 'linea voz onda-wrap';
      el.innerHTML = '<div class="onda">' + Array.from({ length: 28 }, function (_, i) {
        return '<i style="animation-delay:' + (i * 60) + 'ms"></i>';
      }).join('') + '</div>';
    } else {
      el.className = 'linea';
      el.innerHTML = '<span class="t">' + p.t + '</span><span><span class="k">' + p.k + '</span> <span class="v">— ' + p.v + '</span></span>';
    }
    if (p.chat) { el.style.opacity = 0; el.style.transform = 'translateY(8px)'; el.style.transition = 'opacity .4s,transform .4s'; }
    return el;
  }

  function reproduce(indice) {
    if (!cuerpo) return;
    limpiaTemporizadores();
    var d = DEMOS[indice];
    cuerpo.innerHTML = '';
    $('device-title').textContent = d.dispositivo;
    $('demo-titulo').textContent = d.titulo;
    $('demo-texto').textContent = d.texto;
    $('demo-puntos').innerHTML = d.puntos.map(function (p) { return '<li>' + p + '</li>'; }).join('');

    d.guion.forEach(function (p, i) {
      var el = nodo(p);
      cuerpo.appendChild(el);
      var encender = function () { el.classList.add('on'); el.style.opacity = 1; el.style.transform = 'none'; };
      if (sinMovimiento) return encender();
      temporizadores.push(setTimeout(encender, 500 + i * 1100));
    });
    if (!sinMovimiento) {
      temporizadores.push(setTimeout(function () { reproduce(indice); }, 500 + d.guion.length * 1100 + 6000));
    }
  }

  if (tabsDemo) {
    var botones = Array.prototype.slice.call(tabsDemo.querySelectorAll('button'));
    var selecciona = function (i, enfocar) {
      actual = i;
      botones.forEach(function (b, j) {
        b.setAttribute('aria-selected', i === j ? 'true' : 'false');
        b.tabIndex = i === j ? 0 : -1;
      });
      $('demo-panel').setAttribute('aria-labelledby', botones[i].id);
      if (enfocar) botones[i].focus();
      reproduce(i);
    };
    botones.forEach(function (b, i) {
      b.addEventListener('click', function () { selecciona(i); });
      b.addEventListener('keydown', function (e) {
        var j = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: botones.length - 1 }[e.key];
        if (j === undefined) return;
        e.preventDefault();
        selecciona((j + botones.length) % botones.length, true);
      });
    });
    reproduce(0);
  }

  // ============ CALCULADORA ============
  var fmt = new Intl.NumberFormat('es-ES', { maximumFractionDigits: 0, useGrouping: 'always' });
  var fmt1 = new Intl.NumberFormat('es-ES', { maximumFractionDigits: 1 });
  var AUTOMATIZABLE = 0.6, SEMANAS = 46, HORAS_JORNADA_ANUAL = 1640;

  function calcular() {
    ['c-personas', 'c-horas', 'c-coste'].forEach(function (id) {
      var r = $(id); r.style.setProperty('--pct', ((r.value - r.min) / (r.max - r.min) * 100) + '%');
    });
    var p = +$('c-personas').value, h = +$('c-horas').value, c = +$('c-coste').value;
    $('o-personas').textContent = p;
    $('o-horas').textContent = h + ' h';
    $('o-coste').textContent = c + ' €';
    var horas = p * h * SEMANAS * AUTOMATIZABLE;
    $('r-horas').textContent = fmt.format(horas);
    $('r-euros').textContent = fmt.format(horas * c) + ' €';
    $('r-fte').textContent = fmt1.format(horas / HORAS_JORNADA_ANUAL);
  }
  ['c-personas', 'c-horas', 'c-coste'].forEach(function (id) {
    var el = $(id); if (el) el.addEventListener('input', calcular);
  });
  if ($('c-personas')) calcular();

  // ============ SECTORES ============
  var sectores = {
    'Logística y transporte': { foto: '/ia/media/almacen.jpg', items: [
      ['Pedidos y órdenes de carga', 'Las solicitudes por correo o WhatsApp se convierten en órdenes en el TMS sin teclear.'],
      ['¿Dónde está mi envío?', 'Un agente responde el estado de cada expedición al momento, sin pasar por tráfico.'],
      ['Albaranes y POD', 'Lectura automática de albaranes firmados y conciliación con la facturación.']
    ]},
    'Distribución y alimentación': { foto: '/ia/media/dist.jpg', items: [
      ['Pedidos de clientes', 'Cada cliente manda su formato; el agente lo entiende y lo carga en el ERP.'],
      ['Tarifas y disponibilidad', 'Consultas contestadas con la tarifa vigente y el stock real.'],
      ['Cobros', 'Reclamación escalonada de facturas vencidas con registro de cada respuesta.']
    ]},
    'Industria': { foto: '/ia/media/industria.jpg', items: [
      ['Ofertas técnicas', 'Primer borrador del presupuesto a partir de la petición y de vuestro histórico.'],
      ['Documentación técnica', 'Asistente interno que responde con fichas, planos y procedimientos.'],
      ['Proveedores', 'Seguimiento automático de pedidos de compra y fechas de entrega.']
    ]},
    'Hoteles y restauración': { foto: '/ia/media/hotel.jpg', items: [
      ['Reservas directas', 'Respuesta 24/7 en varios idiomas por web, correo y WhatsApp.'],
      ['Grupos y eventos', 'Cualificación y primera propuesta en minutos, no al día siguiente.'],
      ['Reseñas', 'Respuesta a reseñas y detección de las incidencias que se repiten.']
    ]},
    'Salud y clínicas': { foto: '/ia/media/salud.jpg', items: [
      ['Citas', 'Agendar, confirmar y reprogramar sin colapsar el teléfono de recepción.'],
      ['Ausencias', 'Recordatorios que reducen las citas perdidas y rellenan los huecos.'],
      ['Presupuestos de tratamiento', 'Seguimiento de cada presupuesto pendiente de aceptar.']
    ]},
    'Seguros y despachos': { foto: '/ia/media/legal.jpg', items: [
      ['Siniestros y nuevos asuntos', 'Datos y documentación completos antes de llegar a un tramitador.'],
      ['Renovaciones y vencimientos', 'Avisos y seguimiento cliente a cliente, sin caídas de cartera.'],
      ['Documentos', 'Extracción de datos de pólizas, contratos y expedientes.']
    ]},
    'Construcción e inmobiliaria': { foto: '/ia/media/obra.jpg', items: [
      ['Licitaciones', 'Borrador de oferta a partir de vuestros proyectos anteriores.'],
      ['Subcontratas', 'Control de documentación, certificados y vencimientos, con alertas.'],
      ['Compradores y postventa', 'Cada interesado atendido y cada incidencia clasificada con su plazo.']
    ]},
    'Agroalimentario': { foto: '/ia/media/agro.jpg', items: [
      ['Pedidos de la gran distribución', 'Entran solos en el ERP, comprobados contra disponibilidad.'],
      ['Socios y agricultores', 'Liquidaciones y consultas contestadas con vuestros datos reales.'],
      ['Campaña y exportación', 'Certificados, fichas y trazabilidad generados y archivados solos.']
    ]},
    'Automoción': { foto: '/ia/media/auto.jpg', items: [
      ['Leads de portales', 'Respuesta inmediata a cada interesado y prueba de conducción agendada.'],
      ['Taller', 'Citas, avisos de vehículo listo y recordatorios de revisión.'],
      ['Presupuestos', 'Seguimiento de cada oferta de venta o reparación sin respuesta.']
    ]}
  };

  var tabs = $('tabs'), panel = $('tab-panel'), foto = $('sector-img');
  function mostrar(nombre, enfocar) {
    Array.prototype.forEach.call(tabs.children, function (b) {
      var sel = b.textContent === nombre;
      b.setAttribute('aria-selected', sel ? 'true' : 'false');
      b.tabIndex = sel ? 0 : -1;
      if (sel) { panel.setAttribute('aria-labelledby', b.id); if (enfocar) b.focus(); }
    });
    var s = sectores[nombre];
    panel.innerHTML = s.items.map(function (x) { return '<div><h3>' + x[0] + '</h3><p>' + x[1] + '</p></div>'; }).join('');
    if (foto) { foto.style.opacity = 0; foto.src = s.foto; foto.alt = nombre; setTimeout(function () { foto.style.opacity = 1; }, 120); }
  }
  if (tabs && panel) {
    var nombres = Object.keys(sectores);
    nombres.forEach(function (n, i) {
      var b = document.createElement('button');
      b.type = 'button'; b.setAttribute('role', 'tab'); b.textContent = n;
      b.id = 'stab-' + i; b.setAttribute('aria-controls', 'tab-panel');
      b.addEventListener('click', function () { mostrar(n); });
      b.addEventListener('keydown', function (e) {
        var j = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: nombres.length - 1 }[e.key];
        if (j === undefined) return;
        e.preventDefault();
        mostrar(nombres[(j + nombres.length) % nombres.length], true);
      });
      tabs.appendChild(b);
    });
    mostrar(nombres[0]);
  }

  // ============ VÍDEOS: solo se reproducen cuando se ven ============
  if ('IntersectionObserver' in window) {
    var ioVid = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        var v = e.target;
        if (e.isIntersecting && !sinMovimiento) {
          if (v.preload === 'none') v.preload = 'auto';
          var pr = v.play(); if (pr && pr.catch) pr.catch(function () {});
        } else if (!v.paused) { v.pause(); }
      });
    }, { threshold: 0.25 });
    document.querySelectorAll('.muro-item video, .cta-video, .hero-video').forEach(function (v) { ioVid.observe(v); });
  }
  if (sinMovimiento) {
    document.querySelectorAll('video').forEach(function (v) { v.removeAttribute('autoplay'); v.pause(); });
  }

  // ============ APARICIÓN AL HACER SCROLL ============
  if ('IntersectionObserver' in window) {
    document.querySelectorAll('.cards, .steps, .checks, .muro').forEach(function (grupo) {
      Array.prototype.forEach.call(grupo.children, function (el, i) { el.style.setProperty('--d', Math.min(i, 7) * 45 + 'ms'); });
    });
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { threshold: 0.12 });
    document.querySelectorAll('.card, .steps li, .checks li, .muro-item, .calc-out, .rx').forEach(function (el) {
      el.classList.add('reveal'); io.observe(el);
    });
    setTimeout(function () { document.querySelectorAll('.reveal').forEach(function (el) { el.classList.add('in'); }); }, 4500);
  }

  // ============ CTA FIJA EN MÓVIL ============
  var sticky = $('sticky-cta'), hero = document.querySelector('.hero'), final = $('contacto');
  if (sticky && hero && final && 'IntersectionObserver' in window) {
    var heroVisible = true, finalVisible = false;
    var actualiza = function () { sticky.classList.toggle('visible', !heroVisible && !finalVisible); };
    new IntersectionObserver(function (es) { heroVisible = es[0].isIntersecting; actualiza(); }).observe(hero);
    new IntersectionObserver(function (es) { finalVisible = es[0].isIntersecting; actualiza(); }).observe(final);
  }
})();
