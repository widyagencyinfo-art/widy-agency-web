/* ============================================================
   CUORE · tienda (filtros por categoría y talla, orden)
   El estado vive en la URL: tienda.html?cat=vestidos&talla=M&orden=barato
   ============================================================ */
(function () {
  "use strict";
  var P = window.PRENDAS, CATS = window.CATEGORIAS;
  var q = new URLSearchParams(location.search);
  var st = { cat: q.get("cat") || "", talla: q.get("talla") || "", orden: q.get("orden") || "nuevo" };
  if (st.cat && !CATS.some(function (c) { return c.id === st.cat; })) st.cat = "";

  var ENTRADILLAS = {
    "": "Todo lo que tenemos ahora mismo. De cada prenda hay pocas unidades: si te gusta algo, no lo dejes para la semana que viene.",
    vestidos: "Largos, cortos, de flores y de los que llenan la foto. Para la boda de día, la terraza y el día a día.",
    faldas: "Faldas con vuelo y tops con estampado: las piezas con las que se monta todo lo demás.",
    chaquetas: "La prenda que convierte un vaquero y una camiseta en un look.",
    bolsos: "Piel de verdad, en los colores que no encuentras en las cadenas.",
  };

  var cajaCats = C.$("[data-cats]"), cajaTallas = C.$("[data-tallas]"), sel = C.$("[data-orden]");
  var rejilla = C.$("[data-rejilla]"), res = C.$("[data-resultado]");

  function cuenta(filtro) { return P.filter(filtro).length; }

  function pintarFiltros() {
    cajaCats.innerHTML = [{ id: "", n: "Todo" }].concat(CATS).map(function (c) {
      var n = cuenta(function (p) { return (!c.id || p.cat === c.id) && (!st.talla || p.tallas.indexOf(st.talla) >= 0); });
      return '<button class="pildora" type="button" data-cat="' + c.id + '" aria-pressed="' + (st.cat === c.id) + '">' + C.esc(c.n) + " <small>" + n + "</small></button>";
    }).join("");
    cajaTallas.innerHTML = window.TALLAS.map(function (t) {
      return '<button type="button" data-talla-f="' + t + '" aria-pressed="' + (st.talla === t) + '">' + t + "</button>";
    }).join("");
    sel.value = st.orden;
  }

  function pintar() {
    var lista = P.filter(function (p) {
      return (!st.cat || p.cat === st.cat) && (!st.talla || p.tallas.indexOf(st.talla) >= 0);
    });
    lista.sort(function (a, b) {
      if (st.orden === "barato") return a.p - b.p;
      if (st.orden === "caro") return b.p - a.p;
      return (b.nuevo || 0) - (a.nuevo || 0) || a.orden - b.orden;
    });

    var cat = C.cat(st.cat);
    C.$("[data-titulo]").innerHTML = st.cat ? C.esc(cat.n.split(" ")[0]) + (cat.n.indexOf(" ") > 0 ? " <em>" + C.esc(cat.n.split(" ").slice(1).join(" ")) + "</em>" : "") : "La <em>tienda</em>";
    C.$("[data-miga]").textContent = st.cat ? cat.n : "Tienda";
    C.$("[data-entradilla]").textContent = ENTRADILLAS[st.cat] || ENTRADILLAS[""];
    document.title = (st.cat ? cat.n + " · " : "Tienda · ") + "Cuore · Ropa divertida";
    var ref = st.cat ? cat.portada : "ia/hero-azul", caja = C.$("[data-cab-foto]");
    if (caja && window.matchMedia("(min-width: 1000px)").matches && caja.getAttribute("data-ref") !== ref) { caja.setAttribute("data-ref", ref); caja.innerHTML = C.foto(ref, "", "(min-width: 1000px) 420px, 0px", ' loading="eager"').replace(' loading="lazy"', ""); }

    res.textContent = lista.length + (lista.length === 1 ? " prenda" : " prendas") + (st.talla ? " en talla " + st.talla : "");
    rejilla.innerHTML = lista.length ? lista.map(function (p, i) {
      return C.tarjeta(p).replace('<article class="tarjeta"', '<article class="tarjeta" style="animation-delay:' + Math.min(i, 8) * 0.05 + 's"');
    }).join("") :
      '<div class="sin-resultados">' + C.corazon() + '<h2 class="titulo" style="font-size:34px">Ahora mismo no hay nada así</h2>' +
      "<p>Prueba con otra talla, o escríbenos: siempre hay prendas en la tienda que todavía no están en la web.</p>" +
      '<a class="boton boton--rojo" href="' + C.wa(window.CUORE.msg.general + "Busco algo en talla " + (st.talla || "…")) + '" target="_blank" rel="noopener">' + C.ico("whatsapp") + "Preguntar por WhatsApp</a></div>";
  }

  function url() {
    var u = new URLSearchParams();
    if (st.cat) u.set("cat", st.cat);
    if (st.talla) u.set("talla", st.talla);
    if (st.orden !== "nuevo") u.set("orden", st.orden);
    history.replaceState(null, "", location.pathname + (u.toString() ? "?" + u : ""));
  }
  function cambia() { url(); pintarFiltros(); pintar(); }

  cajaCats.addEventListener("click", function (e) {
    var b = e.target.closest("[data-cat]"); if (!b) return;
    st.cat = b.getAttribute("data-cat"); cambia();
    b = C.$('[data-cat="' + st.cat + '"]', cajaCats); if (b) b.scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" });
  });
  cajaTallas.addEventListener("click", function (e) {
    var b = e.target.closest("[data-talla-f]"); if (!b) return;
    var t = b.getAttribute("data-talla-f"); st.talla = st.talla === t ? "" : t; cambia();
  });
  sel.addEventListener("change", function () { st.orden = sel.value; cambia(); });

  /* los enlaces del menú a otra categoría no recargan la página */
  document.addEventListener("click", function (e) {
    var a = e.target.closest('a[href^="tienda.html"]');
    if (!a || e.metaKey || e.ctrlKey) return;
    var u = new URL(a.href, location.href);
    e.preventDefault();
    st.cat = u.searchParams.get("cat") || ""; st.talla = ""; st.orden = "nuevo";
    cambia(); window.scrollTo({ top: 0, behavior: "smooth" });
  });

  pintarFiltros(); pintar();
})();
