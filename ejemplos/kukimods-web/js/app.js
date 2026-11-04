/* KUKI MODS — tienda online
   Bolsa en el navegador (localStorage), filtros, ficha, compra del look
   y pedido por WhatsApp. Sin dependencias. */

(function () {
  'use strict';

  const C = window.CONFIG;
  const PRODUCTOS = window.PRODUCTOS;
  const COLECCIONES = window.COLECCIONES;
  const LOOKS = window.LOOKS;

  const $ = (s, raiz) => (raiz || document).querySelector(s);
  const $$ = (s, raiz) => [...(raiz || document).querySelectorAll(s)];
  const porId = (id) => PRODUCTOS.find((p) => p.id === id);

  const euros = (n) =>
    n.toLocaleString('es-ES', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2 });

  const precioTexto = (p) => (C.MOSTRAR_PRECIOS ? euros(p.precio) : 'Precio por WhatsApp');

  const wa = (texto) =>
    'https://wa.me/34' + C.telefono + '?text=' + encodeURIComponent(texto);

  /* ---------------------------------------------------------------- bolsa */
  const CLAVE = 'kuki-bolsa-v1';
  let bolsa = [];
  try { bolsa = JSON.parse(localStorage.getItem(CLAVE)) || []; } catch (e) { bolsa = []; }

  function guardarBolsa() {
    try { localStorage.setItem(CLAVE, JSON.stringify(bolsa)); } catch (e) { /* modo privado */ }
    pintarBolsa();
  }

  function anadir(id, talla, silencio) {
    const p = porId(id);
    if (!p) return;
    const t = talla || p.tallas[0];
    const ya = bolsa.find((l) => l.id === id && l.talla === t);
    if (ya) ya.n += 1;
    else bolsa.push({ id: id, talla: t, n: 1 });
    guardarBolsa();
    if (!silencio) avisar(p.nombre + ' · talla ' + t + ' — añadido a la bolsa');
  }

  function cambiarCantidad(i, delta) {
    bolsa[i].n += delta;
    if (bolsa[i].n < 1) bolsa.splice(i, 1);
    guardarBolsa();
  }

  const totalUnidades = () => bolsa.reduce((s, l) => s + l.n, 0);
  const totalEuros = () => bolsa.reduce((s, l) => s + (porId(l.id) ? porId(l.id).precio * l.n : 0), 0);

  function pintarBolsa() {
    const n = totalUnidades();
    const cont = $('#contadorBolsa');
    cont.textContent = n;
    cont.hidden = n === 0;

    const cuerpo = $('#cuerpoBolsa');
    const pie = $('#pieBolsa');

    if (!bolsa.length) {
      cuerpo.innerHTML =
        '<div class="bolsa-vacia">' +
        '<p class="rotulo">Tu bolsa está vacía</p>' +
        '<p>Empieza por un look completo: es como se compra en la tienda.</p>' +
        '<button class="btn linea" data-ir="#looks">Ver los looks</button>' +
        '</div>';
      pie.hidden = true;
      return;
    }

    cuerpo.innerHTML = bolsa.map(function (l, i) {
      const p = porId(l.id);
      if (!p) return '';
      return '' +
        '<div class="linea-bolsa">' +
          '<div class="mini"><img src="' + p.foto + '" alt="" loading="lazy"></div>' +
          '<div>' +
            '<p class="nom">' + p.nombre + '</p>' +
            '<p class="det">Talla ' + l.talla + '</p>' +
            '<div class="cantidad">' +
              '<button data-menos="' + i + '" aria-label="Quitar una unidad de ' + p.nombre + '">−</button>' +
              '<span>' + l.n + '</span>' +
              '<button data-mas="' + i + '" aria-label="Añadir una unidad de ' + p.nombre + '">+</button>' +
            '</div>' +
          '</div>' +
          '<div class="lado-precio">' +
            '<p class="precio">' + (C.MOSTRAR_PRECIOS ? euros(p.precio * l.n) : '—') + '</p>' +
            '<button class="quitar" data-quitar="' + i + '">Quitar</button>' +
          '</div>' +
        '</div>';
    }).join('');

    const subtotal = totalEuros();
    const envio = subtotal >= C.envio.gratisDesde ? 0 : C.envio.coste;
    pie.hidden = false;

    $('#resumenBolsa').innerHTML = C.MOSTRAR_PRECIOS
      ? '<div><span>Subtotal</span><span>' + euros(subtotal) + '</span></div>' +
        '<div><span>Envío</span><span>' + (envio === 0 ? 'Gratis' : euros(envio)) + '</span></div>' +
        '<div class="total"><span>Total</span><span>' + euros(subtotal + envio) + '</span></div>'
      : '<div class="total"><span>' + totalUnidades() + ' prendas</span><span>Te pasamos precio</span></div>';

    $('#avisoEnvio').textContent = subtotal >= C.envio.gratisDesde
      ? 'Envío gratis. ' + C.envio.recogida + '.'
      : 'Te faltan ' + euros(C.envio.gratisDesde - subtotal) + ' para el envío gratis.';
  }

  /* --------------------------------------------------------- catálogo */
  let filtroCat = 'todo';
  let filtroTalla = '';
  let ordenActual = 'destacado';

  function tarjeta(p) {
    return '' +
      '<article class="producto">' +
        '<div class="marco">' +
          '<img src="' + p.foto + '" alt="' + p.nombre + '" loading="lazy" width="1000" height="1333">' +
          (p.etiqueta ? '<span class="etiqueta">' + p.etiqueta + '</span>' : '') +
          '<button class="rapido" data-ficha="' + p.id + '">Ver y elegir talla</button>' +
        '</div>' +
        '<div class="datos">' +
          '<h3 class="nom">' + p.nombre + '</h3>' +
          '<p class="cat">' + p.cat + ' · ' + p.tallas.join(' · ') + '</p>' +
          '<p class="precio">' + precioTexto(p) + '</p>' +
        '</div>' +
      '</article>';
  }

  function pintarRejilla() {
    let lista = PRODUCTOS.slice();

    if (filtroCat !== 'todo') {
      lista = lista.filter((p) => p.coleccion === filtroCat || p.cat === filtroCat);
    }
    if (filtroTalla) {
      lista = lista.filter((p) => p.tallas.includes(filtroTalla) && !(p.agotadas || []).includes(filtroTalla));
    }
    if (ordenActual === 'barato') lista.sort((a, b) => a.precio - b.precio);
    if (ordenActual === 'caro') lista.sort((a, b) => b.precio - a.precio);

    $('#rejilla').innerHTML = lista.map(tarjeta).join('');
    $('#vacio').hidden = lista.length > 0;
    $('#cuenta').textContent = lista.length + (lista.length === 1 ? ' prenda' : ' prendas');
  }

  /* ------------------------------------------------------------ ficha */
  let fichaActual = null;
  let tallaElegida = null;

  function abrirFicha(id) {
    const p = porId(id);
    if (!p) return;
    fichaActual = p;
    tallaElegida = null;

    const agotadas = p.agotadas || [];
    $('#cuerpoFicha').innerHTML = '' +
      '<div class="ficha-foto"><img src="' + (p.foto2 || p.foto) + '" alt="' + p.nombre + '"></div>' +
      '<p class="rotulo">' + p.cat + '</p>' +
      '<h3>' + p.nombre + '</h3>' +
      '<p class="precio-ficha">' + precioTexto(p) + '</p>' +
      '<p class="desc">' + p.desc + '</p>' +
      '<p class="rotulo rotulo-talla">Talla</p>' +
      '<div class="tallas">' + p.tallas.map(function (t) {
        const fuera = agotadas.includes(t);
        return '<button class="talla" data-talla="' + t + '" aria-pressed="false"' + (fuera ? ' disabled' : '') + '>' + t + '</button>';
      }).join('') + '</div>' +
      '<p class="aviso-talla" id="avisoTalla" hidden>Elige una talla para continuar.</p>' +
      '<ul class="detalle-lista">' +
        '<li><svg viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6"/></svg>Envío en 24-48 h. Gratis a partir de ' + euros(C.envio.gratisDesde) + '.</li>' +
        '<li><svg viewBox="0 0 24 24"><path d="M9 14 4 9l5-5"/><path d="M4 9h11a5 5 0 0 1 0 10H9"/></svg>Cambios y devoluciones en 14 días.</li>' +
        '<li><svg viewBox="0 0 24 24"><path d="M12 21s-7-4.5-7-10a7 7 0 0 1 14 0c0 5.5-7 10-7 10Z"/><circle cx="12" cy="11" r="2.5"/></svg>Recogida gratis en Av. Cervantes, 21 (Álora).</li>' +
      '</ul>';

    abrirPanel('#panelFicha');
  }

  /* ------------------------------------------------------------ looks */
  let lookActual = LOOKS[0];

  function pintarLook() {
    $('#cambiarLook').innerHTML = LOOKS.map(function (l) {
      return '<button class="chip" data-look="' + l.id + '" aria-pressed="' + (l.id === lookActual.id) + '">' + l.nombre + '</button>';
    }).join('');

    $('#lookFoto').innerHTML =
      '<img src="' + lookActual.foto + '" alt="' + lookActual.nombre + '" loading="lazy">' +
      lookActual.piezas.map(function (pz, i) {
        const p = porId(pz.id);
        return '<button class="punto" style="left:' + pz.x + '%;top:' + pz.y + '%" ' +
          'data-punto="' + i + '" aria-pressed="false" aria-label="Ver ' + (p ? p.nombre : 'prenda') + '"></button>';
      }).join('');

    $('#lookLista').innerHTML = lookActual.piezas.map(function (pz, i) {
      const p = porId(pz.id);
      if (!p) return '';
      return '' +
        '<button class="pieza" data-ficha="' + p.id + '" data-pieza="' + i + '">' +
          '<span class="mini"><img src="' + p.foto + '" alt="" loading="lazy"></span>' +
          '<span>' +
            '<span class="nom">' + p.nombre + '</span>' +
            '<span class="det">' + p.tallas.join(' · ') + '</span>' +
          '</span>' +
          '<span class="precio">' + (C.MOSTRAR_PRECIOS ? euros(p.precio) : '—') + '</span>' +
        '</button>';
    }).join('');

    const total = lookActual.piezas.reduce(function (s, pz) {
      const p = porId(pz.id);
      return s + (p ? p.precio : 0);
    }, 0);
    $('#lookTotal').textContent = C.MOSTRAR_PRECIOS ? euros(total) : lookActual.piezas.length + ' prendas';
  }

  function resaltar(i, si) {
    const punto = $('[data-punto="' + i + '"]');
    const pieza = $('[data-pieza="' + i + '"]');
    if (punto) punto.setAttribute('aria-pressed', si ? 'true' : 'false');
    if (pieza) pieza.classList.toggle('destacada', si);
  }

  /* ---------------------------------------------------------- paneles */
  let panelAbierto = null;
  let ultimoFoco = null;

  function marcarBoton(panel, abierto) {
    const b = document.querySelector('[aria-controls="' + panel.id + '"]');
    if (b) b.setAttribute('aria-expanded', abierto ? 'true' : 'false');
  }

  function abrirPanel(sel) {
    const panel = $(sel);
    if (!panel) return;
    ultimoFoco = document.activeElement;
    panelAbierto = panel;
    $('#scrim').hidden = false;
    requestAnimationFrame(function () {
      $('#scrim').classList.add('visible');
      panel.classList.add('abierto');
    });
    panel.setAttribute('aria-hidden', 'false');
    marcarBoton(panel, true);
    document.body.classList.add('bloqueado');
    const foco = panel.querySelector('input, button:not(.cerrar), .cerrar');
    if (foco) foco.focus({ preventScroll: true });
  }

  function cerrarPanel() {
    if (!panelAbierto) return;
    panelAbierto.classList.remove('abierto');
    panelAbierto.setAttribute('aria-hidden', 'true');
    marcarBoton(panelAbierto, false);
    $('#scrim').classList.remove('visible');
    document.body.classList.remove('bloqueado');
    setTimeout(function () { $('#scrim').hidden = true; }, 260);
    if (ultimoFoco) ultimoFoco.focus({ preventScroll: true });
    panelAbierto = null;
  }

  let tempAviso = null;
  function avisar(texto) {
    const a = $('#aviso');
    a.textContent = texto;
    a.classList.add('visible');
    clearTimeout(tempAviso);
    tempAviso = setTimeout(function () { a.classList.remove('visible'); }, 3200);
  }

  /* -------------------------------------------------------- buscador */
  function buscar(q) {
    const t = q.trim().toLowerCase();
    const caja = $('#sugerencias');
    if (t.length < 2) {
      caja.innerHTML = '<p class="rotulo">Lo más buscado</p>' +
        ['Vestido', 'Blazer', 'Vaquero', 'Bolso'].map(function (s) {
          return '<button class="enlace-sub sugerencia" data-buscar="' + s + '">' + s + '</button>';
        }).join('');
      return;
    }
    const res = PRODUCTOS.filter(function (p) {
      return (p.nombre + ' ' + p.cat + ' ' + p.desc).toLowerCase().includes(t);
    });
    caja.innerHTML = res.length
      ? res.map(function (p) {
          return '<button class="pieza" data-ficha="' + p.id + '">' +
            '<span class="mini"><img src="' + p.foto + '" alt="" loading="lazy"></span>' +
            '<span><span class="nom">' + p.nombre + '</span><span class="det">' + p.cat + '</span></span>' +
            '<span class="precio">' + (C.MOSTRAR_PRECIOS ? euros(p.precio) : '—') + '</span></button>';
        }).join('')
      : '<p class="sin-resultados">No encontramos nada con «' + q + '». Prueba con «vestido» o «blazer».</p>';
  }

  /* ------------------------------------------------------ el pedido */
  function pedidoWhatsApp() {
    if (!bolsa.length) return;
    const lineas = bolsa.map(function (l) {
      const p = porId(l.id);
      return '· ' + p.nombre + ' — talla ' + l.talla + ' × ' + l.n + (C.MOSTRAR_PRECIOS ? ' — ' + euros(p.precio * l.n) : '');
    });
    const subtotal = totalEuros();
    const envio = subtotal >= C.envio.gratisDesde ? 0 : C.envio.coste;
    const texto =
      '¡Hola KUKI! Quiero pedir esto desde la web:\n\n' + lineas.join('\n') +
      (C.MOSTRAR_PRECIOS ? '\n\nEnvío: ' + (envio === 0 ? 'gratis' : euros(envio)) + '\nTotal: ' + euros(subtotal + envio) : '') +
      '\n\n¿Me confirmáis disponibilidad?';
    window.open(wa(texto), '_blank', 'noopener');
  }

  /* --------------------------------------------------------- pintado */
  function pintarFijos() {
    // colecciones
    $('#listaColecciones').innerHTML = COLECCIONES.map(function (c) {
      return '' +
        '<figure class="coleccion revela">' +
          '<button class="tapa-coleccion" data-coleccion="' + c.id + '" aria-label="Ver ' + c.nombre + '">' +
            '<span class="marco"><img src="' + c.foto + '" alt="' + c.nombre + '" loading="lazy" width="1000" height="1333"></span>' +
          '</button>' +
          '<figcaption><span class="nombre">' + c.nombre + '</span><span class="det">' + c.det + '</span></figcaption>' +
        '</figure>';
    }).join('');

    // filtros
    const cats = ['todo'].concat(COLECCIONES.map((c) => c.id));
    const nombres = { todo: 'Todo' };
    COLECCIONES.forEach(function (c) { nombres[c.id] = c.nombre; });
    $('#filtrosCat').innerHTML = cats.map(function (c) {
      return '<button class="chip" data-filtro="' + c + '" aria-pressed="' + (c === filtroCat) + '">' + nombres[c] + '</button>';
    }).join('');

    // tallas
    const tallas = [...new Set(PRODUCTOS.flatMap((p) => p.tallas))].filter((t) => t !== 'Única');
    $('#filtroTalla').innerHTML = '<option value="">Todas las tallas</option>' +
      tallas.map((t) => '<option value="' + t + '">Talla ' + t + '</option>').join('');

    // accesorios
    $('#tiraAccesorios').innerHTML = PRODUCTOS
      .filter((p) => p.coleccion === 'accesorios')
      .concat(PRODUCTOS.filter((p) => p.coleccion !== 'accesorios').slice(0, 2))
      .map(tarjeta).join('');

    // opiniones
    $('#opiniones').innerHTML = window.OPINIONES.map(function (o) {
      return '<blockquote class="opinion revela"><p class="estrellas" aria-label="5 de 5">★★★★★</p>' +
        '<p>“' + o.texto + '”</p><p class="quien">' + o.quien + '</p></blockquote>';
    }).join('');
    $('#tituloOpiniones').textContent = C.google.nota + ' en Google';
    $('#enlaceGoogle').href = C.mapaEnlace;
    $('#enlaceGoogle').textContent = C.google.resenas + ' opiniones';

    // horario y contacto
    $('#horario').innerHTML = C.horario.map(function (h) {
      return '<p>' + h.dias + ' · ' + h.horas + '</p>';
    }).join('');
    $('#telEnlace').href = 'tel:+34' + C.telefono;
    $('#telEnlace').textContent = C.telefonoBonito;
    $('#igEnlace').href = 'https://instagram.com/' + C.instagram;
    $('#igEnlace').textContent = '@' + C.instagram;
    $('#menuDireccion').textContent = C.direccion;
    $('#menuTel').href = 'tel:+34' + C.telefono;
    $('#menuTel').textContent = C.telefonoBonito;
    $('#menuIg').href = 'https://instagram.com/' + C.instagram;
    $('#menuIg').textContent = '@' + C.instagram;
    $('#mapa').src = C.mapa;
    $('#anio').textContent = new Date().getFullYear();

    const saludo = wa('¡Hola KUKI! Os escribo desde la web.');
    ['#waCabecera', '#waFlota', '#waPie'].forEach(function (s) { $(s).href = saludo; });
    $('#waAsesora').href = wa('¡Hola KUKI! ¿Me ayudáis a montar un look? Os cuento la ocasión y mi talla.');
  }

  /* ------------------------------------------------------- escuchas */
  document.addEventListener('click', function (e) {
    const t = e.target.closest('[data-ficha],[data-filtro],[data-look],[data-punto],[data-coleccion],[data-menos],[data-mas],[data-quitar],[data-talla],[data-buscar],[data-ir],.cerrar');
    if (!t) return;

    if (t.dataset.ficha) { abrirFicha(t.dataset.ficha); return; }

    if (t.dataset.filtro) {
      filtroCat = t.dataset.filtro;
      $$('[data-filtro]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.filtro === filtroCat)));
      pintarRejilla();
      return;
    }

    if (t.dataset.coleccion) {
      filtroCat = t.dataset.coleccion;
      $$('[data-filtro]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.filtro === filtroCat)));
      pintarRejilla();
      document.getElementById('tienda').scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }

    if (t.dataset.look) {
      lookActual = LOOKS.find((l) => l.id === t.dataset.look) || LOOKS[0];
      pintarLook();
      return;
    }

    if (t.dataset.punto) {
      const i = Number(t.dataset.punto);
      const p = lookActual.piezas[i];
      abrirFicha(p.id);
      return;
    }

    if (t.dataset.menos) { cambiarCantidad(Number(t.dataset.menos), -1); return; }
    if (t.dataset.mas) { cambiarCantidad(Number(t.dataset.mas), 1); return; }
    if (t.dataset.quitar) { bolsa.splice(Number(t.dataset.quitar), 1); guardarBolsa(); return; }

    if (t.dataset.talla) {
      tallaElegida = t.dataset.talla;
      $$('[data-talla]').forEach((b) => b.setAttribute('aria-pressed', String(b === t)));
      const av = $('#avisoTalla');
      if (av) av.hidden = true;
      return;
    }

    if (t.dataset.buscar) { $('#campoBuscar').value = t.dataset.buscar; buscar(t.dataset.buscar); return; }

    if (t.dataset.ir) { cerrarPanel(); document.querySelector(t.dataset.ir).scrollIntoView({ behavior: 'smooth' }); return; }

    if (t.classList.contains('cerrar')) cerrarPanel();
  });

  // resaltar la prenda al pasar por su punto (y al revés)
  document.addEventListener('mouseover', function (e) {
    const p = e.target.closest('[data-punto],[data-pieza]');
    if (p) resaltar(Number(p.dataset.punto !== undefined ? p.dataset.punto : p.dataset.pieza), true);
  });
  document.addEventListener('mouseout', function (e) {
    const p = e.target.closest('[data-punto],[data-pieza]');
    if (p) resaltar(Number(p.dataset.punto !== undefined ? p.dataset.punto : p.dataset.pieza), false);
  });

  $('#abrirMenu').addEventListener('click', () => abrirPanel('#panelMenu'));
  $('#abrirBolsa').addEventListener('click', () => abrirPanel('#panelBolsa'));
  $('#abrirBuscador').addEventListener('click', function () { abrirPanel('#panelBuscador'); buscar(''); });
  $('#scrim').addEventListener('click', cerrarPanel);

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && panelAbierto) cerrarPanel();
  });

  $('#anadirFicha').addEventListener('click', function () {
    if (!fichaActual) return;
    if (fichaActual.tallas.length > 1 && !tallaElegida) {
      const av = $('#avisoTalla');
      if (av) av.hidden = false;
      const primera = $('.talla:not([disabled])');
      if (primera) primera.focus();
      return;
    }
    anadir(fichaActual.id, tallaElegida || fichaActual.tallas[0]);
    cerrarPanel();
    abrirPanel('#panelBolsa');
  });

  $('#anadirLook').addEventListener('click', function () {
    lookActual.piezas.forEach(function (pz) {
      const p = porId(pz.id);
      if (!p) return;
      const libre = p.tallas.find((t) => !(p.agotadas || []).includes(t));
      anadir(p.id, libre, true);
    });
    avisar('Look completo añadido — revisa las tallas en la bolsa');
    abrirPanel('#panelBolsa');
  });

  $('#finalizar').addEventListener('click', pedidoWhatsApp);
  $('#campoBuscar').addEventListener('input', (e) => buscar(e.target.value));
  $('#filtroTalla').addEventListener('change', function (e) { filtroTalla = e.target.value; pintarRejilla(); });
  $('#orden').addEventListener('change', function (e) { ordenActual = e.target.value; pintarRejilla(); });
  $('#limpiarFiltros').addEventListener('click', function () {
    filtroCat = 'todo'; filtroTalla = ''; $('#filtroTalla').value = '';
    $$('[data-filtro]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.filtro === 'todo')));
    pintarRejilla();
  });

  // menú: cerrar al navegar
  $$('#panelMenu a').forEach((a) => a.addEventListener('click', cerrarPanel));

  /* --------------------------------------------------- entrada suave */
  function revelar() {
    const io = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('dentro'); io.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -10% 0px' });
    $$('.revela').forEach((el) => io.observe(el));
  }

  /* ------------------------------------------------------- arranque */
  pintarFijos();
  pintarRejilla();
  pintarLook();
  pintarBolsa();
  if ('IntersectionObserver' in window) revelar();
  else $$('.revela').forEach((el) => el.classList.add('dentro'));
})();
