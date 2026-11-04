/* ============================================================
   CUORE · lo común a todas las páginas
   bolsa (localStorage) · pedido por WhatsApp · menú móvil · cabecera ·
   avisos · tarjetas de prenda · carruseles · aparición al hacer scroll
   ============================================================ */
(function () {
  "use strict";
  var CFG = window.CUORE, PRENDAS = window.PRENDAS || [];
  var SPRITE = "img/marca/sprite.svg";
  var CLAVE = "cuore_bolsa_v1";

  function $(s, c) { return (c || document).querySelector(s); }
  function $$(s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); }
  function esc(t) { return String(t).replace(/[&<>"']/g, function (m) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m]; }); }
  function ico(n, cls) { return '<svg class="' + (cls || "ico") + " i-" + n + '" aria-hidden="true"><use href="' + SPRITE + "#i-" + n + '"/></svg>'; }
  function corazon(cls) { return '<svg class="' + (cls || "ico") + '" viewBox="0 0 100 100" aria-hidden="true"><use href="' + SPRITE + '#corazon"/></svg>'; }
  function euro(n) { return n.toFixed(2).replace(".", ",") + "\u00a0€"; }
  function prenda(id) { for (var i = 0; i < PRENDAS.length; i++) if (PRENDAS[i].id === id) return PRENDAS[i]; return null; }
  function cat(id) { return (window.CATEGORIAS || []).filter(function (c) { return c.id === id; })[0] || { n: "" }; }
  function wa(texto) { return "https://wa.me/" + CFG.whatsapp + "?text=" + encodeURIComponent(texto); }
  function urlPrenda(p) { return "prenda.html?id=" + encodeURIComponent(p.id); }

  /* <img> con dos tamaños. ref = ruta dentro de img/ sin «.jpg»: «ia/…» (IA, 1200/600, hero 1440/720) o «fotos/…» (reales, 960/480) */
  function anchos(ref) { return /^ia\/hero-/.test(ref) ? [720, 1440] : /^ia\//.test(ref) ? [600, 1200] : [480, 960]; }
  function real(ref) { return /^fotos\//.test(ref); }
  function foto(ref, alt, sizes, extra) {
    var b = "img/" + ref, a = anchos(ref);
    return '<img src="' + b + '-s.jpg" srcset="' + b + "-s.jpg " + a[0] + "w, " + b + ".jpg " + a[1] + 'w" sizes="' + (sizes || "(min-width: 1100px) 25vw, (min-width: 700px) 33vw, 50vw") +
      '" alt="' + esc(alt || "") + '" loading="lazy" decoding="async" width="' + a[1] + '" height="' + Math.round(a[1] * (/hero-/.test(ref) ? 1.25 : 4 / 3)) + '"' + (extra || "") + ">";
  }

  function tarjeta(p, o) {
    o = o || {};
    var chapa = p.nuevo ? '<span class="chapa chapa--roja">Nuevo</span>' : "";
    var segunda = p.fotos.filter(real)[0] || p.fotos[1];
    var tallas = '<div class="tarjeta__tallas"><small>' + (p.tallas.length > 1 ? "Añadir talla" : "Añadir") + "</small>" +
      p.tallas.map(function (t) { return '<button type="button" data-anadir="' + p.id + '" data-talla="' + t + '">' + (t === "Única" && p.tallas.length === 1 ? "Única " + ico("mas") : t) + "</button>"; }).join("") + "</div>";
    return '<article class="tarjeta">' +
      '<a class="tarjeta__foto" href="' + urlPrenda(p) + '" tabindex="-1" aria-hidden="true">' + chapa + foto(p.foto, p.n, o.sizes) +
      (segunda ? foto(segunda, "", o.sizes, ' class="tarjeta__otra"') + (real(segunda) ? '<span class="chapa chapa--real">Foto real</span>' : "") : "") + "</a>" +
      tallas +
      '<div class="tarjeta__txt"><div><h3 class="tarjeta__n"><a href="' + urlPrenda(p) + '">' + esc(p.n) + "</a></h3>" +
      '<p class="tarjeta__cat">' + esc(cat(p.cat).n) + (p.tallas.length > 1 ? " · " + p.tallas[0] + "–" + p.tallas[p.tallas.length - 1] : " · Talla única") + "</p></div>" +
      (CFG.mostrarPrecios ? '<p class="tarjeta__p">' + euro(p.p) + "</p>" : "") + "</div></article>";
  }

  /* ============================================================
     BOLSA
     ============================================================ */
  var bolsa = leer();
  function leer() {
    try { var b = JSON.parse(localStorage.getItem(CLAVE) || "[]"); return b.filter(function (l) { return prenda(l.id); }); }
    catch (e) { return []; }
  }
  function guardar() { try { localStorage.setItem(CLAVE, JSON.stringify(bolsa)); } catch (e) {} pintarBolsa(); }
  function unidades() { return bolsa.reduce(function (s, l) { return s + l.cant; }, 0); }
  function subtotal() { return bolsa.reduce(function (s, l) { return s + prenda(l.id).p * l.cant; }, 0); }
  function anadir(id, talla) {
    var l = bolsa.filter(function (x) { return x.id === id && x.talla === talla; })[0];
    if (l) l.cant++; else bolsa.push({ id: id, talla: talla, cant: 1 });
    guardar();
    var c = $("[data-contador]");
    if (c) { c.classList.remove("late"); void c.offsetWidth; c.classList.add("late"); }
    var p = prenda(id);
    toast("<b>" + esc(p.n) + "</b>" + (talla !== "Única" ? " · talla " + talla : "") + " en tu bolsa", "Ver bolsa", abrirBolsa);
  }
  function cambiar(i, d) {
    bolsa[i].cant += d;
    if (bolsa[i].cant < 1) bolsa.splice(i, 1);
    guardar();
  }

  function montarCajon() {
    var html =
      '<div class="velo" data-cerrar></div>' +
      '<aside class="cajon" id="bolsa" role="dialog" aria-modal="true" aria-labelledby="bolsa-t" tabindex="-1">' +
      '<div class="cajon__cab"><h2 id="bolsa-t">Tu bolsa <small data-bolsa-n></small></h2>' +
      '<button class="cab__btn" type="button" data-cerrar aria-label="Cerrar la bolsa">' + ico("cerrar") + "</button></div>" +
      '<div class="cajon__cuerpo" data-bolsa-lineas></div>' +
      '<div class="cajon__pie" data-bolsa-pie></div></aside>';
    document.body.insertAdjacentHTML("beforeend", html);
  }

  function pintarBolsa() {
    var n = unidades();
    $$("[data-contador]").forEach(function (c) { c.textContent = n; c.classList.toggle("si", n > 0); });
    var cuerpo = $("[data-bolsa-lineas]"), pie = $("[data-bolsa-pie]");
    if (!cuerpo) return;
    $("[data-bolsa-n]").textContent = n ? "(" + n + (n === 1 ? " prenda)" : " prendas)") : "";

    if (!bolsa.length) {
      cuerpo.innerHTML = '<div class="cajon__vacia">' + corazon() +
        '<h3 class="titulo" style="font-size:30px">Tu bolsa está vacía</h3>' +
        "<p>Traemos pocas unidades de cada prenda. Si algo te gusta, mejor no dejarlo para la semana que viene.</p>" +
        '<a class="boton boton--rojo" href="tienda.html">Ver la tienda ' + ico("flecha") + "</a></div>";
      pie.hidden = true;
      return;
    }
    pie.hidden = false;
    cuerpo.innerHTML = bolsa.map(function (l, i) {
      var p = prenda(l.id);
      return '<div class="linea-bolsa"><a href="' + urlPrenda(p) + '"><img src="img/' + p.foto + '-s.jpg" alt="" width="76" height="100"></a><div>' +
        '<p class="linea-bolsa__n"><a href="' + urlPrenda(p) + '">' + esc(p.n) + "</a></p>" +
        '<p class="linea-bolsa__t">' + (l.talla === "Única" ? "Talla única" : "Talla " + l.talla) + (CFG.mostrarPrecios ? " · " + euro(p.p) : "") + "</p>" +
        '<div class="linea-bolsa__abajo"><div class="cantidad">' +
        '<button type="button" data-cant="' + i + '" data-d="-1" aria-label="Quitar una">' + ico("menos") + "</button><span>" + l.cant + "</span>" +
        '<button type="button" data-cant="' + i + '" data-d="1" aria-label="Añadir una">' + ico("mas") + "</button></div>" +
        (CFG.mostrarPrecios ? '<span class="linea-bolsa__p">' + euro(p.p * l.cant) + "</span>" : "") + "</div>" +
        '<button class="quitar" type="button" data-quitar="' + i + '">Quitar</button></div></div>';
    }).join("");

    var sub = subtotal(), e = CFG.envio, recoger = entrega() === "tienda";
    var falta = Math.max(0, e.gratisDesde - sub), gratis = falta === 0 || recoger;
    var envio = gratis ? 0 : e.precio;
    pie.innerHTML =
      '<div class="entrega" role="radiogroup" aria-label="Cómo lo quieres">' +
      '<label><input type="radio" name="entrega" value="casa"' + (recoger ? "" : " checked") + "><b>Envío a casa</b>Toda España, 24/48 h</label>" +
      '<label><input type="radio" name="entrega" value="tienda"' + (recoger ? " checked" : "") + "><b>Recoger en tienda</b>Arroyo de la Miel, gratis</label></div>" +
      (recoger ? "" : '<div class="progreso-envio">' + (falta ? "Te faltan <b>" + euro(falta) + "</b> para el envío gratis" : "¡Tienes el <b>envío gratis</b>! 🎉") +
        '<div class="barra"><i style="width:' + Math.min(100, sub / e.gratisDesde * 100) + '%"></i></div></div>') +
      (CFG.mostrarPrecios ? '<div class="totales"><div><span>Prendas</span><span>' + euro(sub) + "</span></div>" +
        "<div><span>" + (recoger ? "Recogida en tienda" : "Envío") + "</span><span>" + (envio ? euro(envio) : "Gratis") + "</span></div>" +
        '<div class="total"><span>Total</span><span>' + euro(sub + envio) + "</span></div></div>" : "") +
      '<a class="boton boton--rojo boton--ancho" href="' + wa(mensajePedido(sub, envio, recoger)) + '" target="_blank" rel="noopener" data-pedido>' + ico("whatsapp") + "Enviar pedido por WhatsApp</a>" +
      '<p class="cajon__nota">Luz te confirma talla y disponibilidad por WhatsApp antes de pagar. Nada se cobra hasta entonces.</p>';
  }

  var _entrega = "casa";
  function entrega() { return _entrega; }

  function mensajePedido(sub, envio, recoger) {
    var t = "¡Hola Luz! Quiero hacer este pedido desde la web de Cuore:\n\n";
    bolsa.forEach(function (l) {
      var p = prenda(l.id);
      t += "• " + p.n + " — " + (l.talla === "Única" ? "talla única" : "talla " + l.talla) + " — " + l.cant + " × " + euro(p.p) + "\n";
    });
    t += "\n" + (recoger ? "Lo recojo en la tienda de Arroyo de la Miel." : "Envío a casa" + (envio ? " (" + euro(envio) + ")." : " (gratis)."));
    if (CFG.mostrarPrecios) t += "\nTotal: " + euro(sub + envio);
    t += "\n\n¿Me confirmas que está disponible?";
    return t;
  }

  var ultimoFoco = null;
  function abrirBolsa() {
    ultimoFoco = document.activeElement;
    $(".cajon").classList.add("abierto"); $(".velo").classList.add("si"); document.body.classList.add("sin-scroll");
    setTimeout(function () { $(".cajon").focus(); }, 60);
  }
  function cerrarTodo() {
    var c = $(".cajon"), m = $(".movil");
    if (c) c.classList.remove("abierto");
    if (m) { m.classList.remove("abierto"); m.setAttribute("aria-hidden", "true"); }
    var v = $(".velo"); if (v) v.classList.remove("si");
    document.body.classList.remove("sin-scroll");
    var b = $("[data-menu]"); if (b) b.setAttribute("aria-expanded", "false");
    if (ultimoFoco && ultimoFoco.focus) ultimoFoco.focus();
  }

  /* ---------- Aviso emergente ---------- */
  var tTimer;
  function toast(html, accion, fn) {
    var t = $(".toast");
    if (!t) { document.body.insertAdjacentHTML("beforeend", '<div class="toast" role="status" aria-live="polite"></div>'); t = $(".toast"); }
    t.innerHTML = corazon() + "<span>" + html + "</span>" + (accion ? '<button type="button">' + accion + "</button>" : "");
    if (accion) $("button", t).onclick = function () { t.classList.remove("si"); fn(); };
    requestAnimationFrame(function () { t.classList.add("si"); });
    clearTimeout(tTimer); tTimer = setTimeout(function () { t.classList.remove("si"); }, 3800);
  }

  /* ============================================================
     CABECERA, MENÚ, AVISOS
     ============================================================ */
  function montarMenu() {
    var html = '<nav class="movil" aria-label="Menú" aria-hidden="true">' +
      '<div class="movil__cab"><svg class="logo" viewBox="0 0 344.4 150" role="img" aria-label="Cuore"><use href="' + SPRITE + '#logo"/></svg>' +
      '<button class="cab__btn" type="button" data-cerrar aria-label="Cerrar el menú">' + ico("cerrar") + "</button></div>" +
      '<div class="movil__nav">' +
      [["tienda.html", "Toda la tienda"], ["tienda.html?cat=vestidos", "Vestidos"], ["tienda.html?cat=faldas", "Faldas y tops"], ["tienda.html?cat=bolsos", "Bolsos de piel"], ["index.html#luz", "Quién es Luz"], ["index.html#visitanos", "Ven a vernos"]]
        .map(function (a) { return '<a href="' + a[0] + '">' + a[1] + ico("flecha") + "</a>"; }).join("") +
      '</div><div class="movil__pie"><p>' + esc(CFG.direccion) + " · Arroyo de la Miel</p><p>" + esc(CFG.telefono) + " · @" + esc(CFG.instagram) + "</p>" +
      '<a class="boton boton--rojo" href="' + wa(CFG.msg.general) + '" target="_blank" rel="noopener">' + ico("whatsapp") + "Escríbele a Luz</a></div></nav>";
    document.body.insertAdjacentHTML("beforeend", html);
  }

  function avisos() {
    var caja = $("[data-avisos]");
    if (!caja || !CFG.avisos.length) return;
    caja.innerHTML = CFG.avisos.map(function (a, i) { return '<p class="aviso__frase' + (i ? "" : " activa") + '"><span>' + a + "</span></p>"; }).join("");
    var f = $$(".aviso__frase", caja), i = 0;
    if (f.length < 2) return;
    setInterval(function () {
      if (document.hidden) return;
      var a = f[i]; i = (i + 1) % f.length; var b = f[i];
      a.classList.remove("activa"); a.classList.add("sale");
      b.classList.remove("sale"); b.classList.add("activa");
      setTimeout(function () { a.classList.remove("sale"); }, 700);
    }, 4200);
  }

  function cabecera() {
    var cab = $(".cab"), waf = $(".wa-flota"), y0 = 0, raf = 0;
    function mira() {
      raf = 0;
      var y = window.scrollY, abajo = y > y0;
      if (cab) {
        cab.classList.toggle("con-linea", y > 8);
        cab.classList.toggle("escondida", abajo && y > 420 && !document.body.classList.contains("sin-scroll"));
      }
      if (waf) waf.classList.toggle("si", y > 360);
      y0 = y;
    }
    window.addEventListener("scroll", function () { if (!raf) raf = requestAnimationFrame(mira); }, { passive: true });
    mira();
  }

  /* ============================================================
     CARRUSEL (flechas, barra de avance y arrastre con ratón)
     ============================================================ */
  function carrusel(raiz) {
    var pista = $(".carrusel__pista", raiz), barra = $(".carrusel__barra i", raiz);
    var ant = $("[data-ant]", raiz), sig = $("[data-sig]", raiz);
    function paso() { var h = pista.children[0]; return h ? h.getBoundingClientRect().width + parseFloat(getComputedStyle(pista).columnGap || 0) : 300; }
    function estado() {
      var max = pista.scrollWidth - pista.clientWidth;
      if (ant) ant.disabled = pista.scrollLeft < 4;
      if (sig) sig.disabled = pista.scrollLeft > max - 4;
      if (barra) {
        var vis = pista.clientWidth / pista.scrollWidth;
        barra.style.width = (vis * 100) + "%";
        barra.style.transform = "translateX(" + (max > 0 ? (pista.scrollLeft / max) * (1 / vis - 1) * 100 : 0) + "%)";
      }
    }
    if (ant) ant.onclick = function () { pista.scrollBy({ left: -paso() * 2, behavior: "smooth" }); };
    if (sig) sig.onclick = function () { pista.scrollBy({ left: paso() * 2, behavior: "smooth" }); };
    pista.addEventListener("scroll", estado, { passive: true });
    window.addEventListener("resize", estado);
    estado();

    /* arrastrar con el ratón (en táctil ya lo hace el navegador) */
    var x0, s0, movido = false, abajo = false;
    pista.addEventListener("pointerdown", function (e) {
      if (e.pointerType !== "mouse" || e.button !== 0) return;
      abajo = true; movido = false; x0 = e.clientX; s0 = pista.scrollLeft;
    });
    window.addEventListener("pointermove", function (e) {
      if (!abajo) return;
      var dx = e.clientX - x0;
      if (!movido && Math.abs(dx) > 6) { movido = true; pista.classList.add("arrastrando"); }
      if (movido) { pista.scrollLeft = s0 - dx; e.preventDefault(); }
    });
    window.addEventListener("pointerup", function () {
      if (!abajo) return; abajo = false;
      if (movido) {
        var p = paso(), destino = Math.round(pista.scrollLeft / p) * p;
        pista.classList.remove("arrastrando");
        pista.scrollTo({ left: destino, behavior: "smooth" });
      }
    });
    pista.addEventListener("click", function (e) { if (movido) { e.preventDefault(); e.stopPropagation(); movido = false; } }, true);
    pista.addEventListener("dragstart", function (e) { e.preventDefault(); });
  }

  /* ============================================================
     APARICIÓN AL HACER SCROLL
     ============================================================ */
  function aparecer() {
    var els = $$("[data-rev]:not(.visto)");
    if (!("IntersectionObserver" in window)) { els.forEach(function (e) { e.classList.add("visto"); }); return; }
    var io = new IntersectionObserver(function (ent) {
      ent.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add("visto"); io.unobserve(en.target); } });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    els.forEach(function (e) { io.observe(e); });
  }

  /* ============================================================
     EVENTOS (delegados: sirven para lo que se pinte después)
     ============================================================ */
  document.addEventListener("click", function (e) {
    var t = e.target.closest("[data-anadir],[data-abrir-bolsa],[data-cerrar],[data-menu],[data-cant],[data-quitar]");
    if (!t) return;
    if (t.hasAttribute("data-anadir")) { e.preventDefault(); anadir(t.getAttribute("data-anadir"), t.getAttribute("data-talla")); }
    else if (t.hasAttribute("data-abrir-bolsa")) { e.preventDefault(); abrirBolsa(); }
    else if (t.hasAttribute("data-cerrar")) { cerrarTodo(); }
    else if (t.hasAttribute("data-menu")) {
      ultimoFoco = t;
      var m = $(".movil"); m.classList.add("abierto"); m.setAttribute("aria-hidden", "false");
      t.setAttribute("aria-expanded", "true"); document.body.classList.add("sin-scroll");
      setTimeout(function () { var a = $(".movil__nav a"); if (a) a.focus(); }, 80);
    }
    else if (t.hasAttribute("data-cant")) { cambiar(+t.getAttribute("data-cant"), +t.getAttribute("data-d")); }
    else if (t.hasAttribute("data-quitar")) { cambiar(+t.getAttribute("data-quitar"), -999); }
  });
  document.addEventListener("change", function (e) {
    if (e.target.name === "entrega") { _entrega = e.target.value; pintarBolsa(); }
  });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") cerrarTodo(); });
  /* cerrar el menú al pulsar un ancla de la misma página */
  document.addEventListener("click", function (e) { if (e.target.closest(".movil__nav a")) cerrarTodo(); });
  window.addEventListener("storage", function (e) { if (e.key === CLAVE) { bolsa = leer(); pintarBolsa(); } });

  /* ---------- Arranque ---------- */
  montarCajon();
  montarMenu();
  pintarBolsa();
  avisos();
  cabecera();
  $$("[data-carrusel]").forEach(carrusel);
  $$("[data-anio]").forEach(function (e) { e.textContent = new Date().getFullYear(); });
  requestAnimationFrame(function () { document.documentElement.classList.add("listo"); aparecer(); });

  window.C = { $: $, $$: $$, esc: esc, ico: ico, corazon: corazon, euro: euro, prenda: prenda, cat: cat, wa: wa, foto: foto, real: real,
    tarjeta: tarjeta, anadir: anadir, abrirBolsa: abrirBolsa, toast: toast, carrusel: carrusel, aparecer: aparecer, urlPrenda: urlPrenda };
})();
