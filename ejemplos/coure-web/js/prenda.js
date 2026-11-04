/* ============================================================
   CUORE · ficha de prenda  (prenda.html?id=...)
   ============================================================ */
(function () {
  "use strict";
  var CFG = window.CUORE, P = window.PRENDAS;
  var id = new URLSearchParams(location.search).get("id");
  var p = C.prenda(id);
  if (!p) { location.replace("tienda.html"); return; }

  var cat = C.cat(p.cat), unica = p.tallas.length === 1;
  var talla = unica ? p.tallas[0] : "";
  var enlace = location.origin + location.pathname + "?id=" + p.id;

  document.title = p.n + " · Cuore";
  var md = document.querySelector('meta[name="description"]');
  if (md) md.content = p.d.slice(0, 155);

  C.$("[data-migas]").insertAdjacentHTML("beforeend", "<span>/</span><a href=\"tienda.html?cat=" + p.cat + "\">" + C.esc(cat.n) + "</a>");

  C.$("[data-ficha]").innerHTML =
    '<div class="galeria">' +
      '<div class="galeria__pista" data-pista>' + p.fotos.map(function (f, i) {
        return '<figure class="galeria__foto" data-lupa>' + (i === 0 && p.nuevo ? '<span class="chapa chapa--roja">Nuevo</span>' : "") +
          (C.real(f) ? '<span class="chapa chapa--foto-real">Foto real · así es en la tienda</span>' : "") +
          C.foto(f, p.n + (C.real(f) ? " (foto real)" : ""), "(min-width: 900px) 52vw, 100vw", i === 0 ? ' fetchpriority="high" loading="eager"' : "").replace(i === 0 ? ' loading="lazy"' : "@@", "") + "</figure>";
      }).join("") + "</div>" +
      (p.fotos.length > 1 ? '<div class="galeria__minis" role="tablist" aria-label="Fotos">' + p.fotos.map(function (f, i) {
        return '<button type="button" role="tab" aria-selected="' + (i === 0) + '" data-mini="' + i + '" aria-label="Foto ' + (i + 1) + (C.real(f) ? " (real)" : "") + '"><img src="img/' + f + '-s.jpg" alt="" loading="lazy"></button>';
      }).join("") + "</div>" : "") +
    "</div>" +
    '<div class="ficha__info">' +
      '<p class="cejilla">' + C.corazon() + C.esc(cat.n) + "</p>" +
      '<h1 class="titulo">' + C.esc(p.n) + "</h1>" +
      (CFG.mostrarPrecios ? '<p class="ficha__precio">' + C.euro(p.p) + "<small>IVA incluido</small></p>" : "") +
      '<p class="ficha__pocas">' + C.corazon() + "<span><b>Pocas unidades.</b> Si te gusta, no lo dejes para la semana que viene.</span></p>" +
      (unica ? '<p class="ficha__etq"><span>Talla única</span></p>' :
        '<div class="ficha__etq"><span>Elige tu talla</span><a href="' + C.wa(CFG.msg.talla + p.n + " · " + enlace) + '" target="_blank" rel="noopener">¿Qué talla soy?</a></div>' +
        '<div class="tallas" role="group" aria-label="Tallas" data-tallas>' +
          p.tallas.map(function (t) { return '<button type="button" data-t="' + t + '" aria-pressed="false">' + t + "</button>"; }).join("") + "</div>" +
        '<p class="ficha__error" data-error aria-live="polite"></p>') +
      '<div class="ficha__botones" data-botones>' +
        '<button class="boton boton--rojo boton--ancho" type="button" data-anadir-ficha>' + C.ico("bolsa") + "Añadir a la bolsa</button>" +
        '<a class="boton boton--borde boton--ancho" href="' + C.wa(CFG.msg.prenda + p.n + " · " + enlace) + '" target="_blank" rel="noopener">' + C.ico("whatsapp") + "Preguntar por esta prenda</a></div>" +
      '<ul class="ficha__garantias">' +
        "<li>" + C.ico("camion") + "Envío a toda España en 24/48 h · gratis desde " + C.euro(CFG.envio.gratisDesde).replace(",00", "") + "</li>" +
        "<li>" + C.ico("pin") + "O recógelo gratis en la tienda de Arroyo de la Miel</li>" +
        "<li>" + C.ico("cambio") + "Cambios de talla en 14 días</li></ul>" +
      '<div class="acordeon">' +
        '<details open><summary>Cómo es' + C.ico("mas") + '</summary><div class="cuerpo"><p>' + C.esc(p.d) + "</p></div></details>" +
        "<details><summary>Cómo se compra" + C.ico("mas") + '</summary><div class="cuerpo"><p>Añádelo a tu bolsa y envíanos el pedido por WhatsApp: te llega ya escrito. Luz te confirma que está disponible y te dice el total con el envío.</p><p>Se paga por Bizum, transferencia o tarjeta. Nada se cobra hasta que te lo confirmamos.</p></div></details>' +
        "<details><summary>Envíos y cambios" + C.ico("mas") + '</summary><div class="cuerpo"><p>Enviamos a toda España en 24/48 h por ' + C.euro(CFG.envio.precio) + ", y gratis a partir de " + C.euro(CFG.envio.gratisDesde) + ".</p><p>Si no te queda bien, tienes 14 días para cambiarlo por otra talla u otra prenda. Escríbenos y te decimos cómo.</p></div></details>" +
      "</div></div>";

  /* tallas */
  var cajaT = C.$("[data-tallas]"), err = C.$("[data-error]");
  if (cajaT) cajaT.addEventListener("click", function (e) {
    var b = e.target.closest("[data-t]"); if (!b) return;
    talla = b.getAttribute("data-t");
    C.$$("[data-t]", cajaT).forEach(function (x) { x.setAttribute("aria-pressed", x === b); });
    err.textContent = ""; pintarBarra();
  });

  function anadir() {
    if (!talla) {
      err.textContent = "Elige primero tu talla.";
      cajaT.classList.remove("aviso-talla"); void cajaT.offsetWidth; cajaT.classList.add("aviso-talla");
      if (cajaT.getBoundingClientRect().top < 80 || cajaT.getBoundingClientRect().bottom > innerHeight) cajaT.scrollIntoView({ block: "center", behavior: "smooth" });
      return;
    }
    C.anadir(p.id, talla);
  }
  C.$("[data-anadir-ficha]").addEventListener("click", anadir);

  /* galería: miniaturas ↔ pista deslizable */
  var pistaG = C.$("[data-pista]"), minis = C.$$("[data-mini]");
  minis.forEach(function (b) {
    b.addEventListener("click", function () { pistaG.scrollTo({ left: pistaG.clientWidth * +b.getAttribute("data-mini"), behavior: "smooth" }); });
  });
  pistaG.addEventListener("scroll", function () {
    var i = Math.round(pistaG.scrollLeft / pistaG.clientWidth);
    minis.forEach(function (b, k) { b.setAttribute("aria-selected", k === i); });
  }, { passive: true });

  /* lupa al pasar el ratón */
  C.$$("[data-lupa]").forEach(function (lupa) {
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) { lupa.style.cursor = "default"; return; }
    lupa.addEventListener("mousemove", function (e) {
      var r = lupa.getBoundingClientRect();
      lupa.style.setProperty("--zx", ((e.clientX - r.left) / r.width * 100) + "%");
      lupa.style.setProperty("--zy", ((e.clientY - r.top) / r.height * 100) + "%");
    });
    lupa.addEventListener("mouseenter", function () { lupa.classList.add("lupa"); });
    lupa.addEventListener("mouseleave", function () { lupa.classList.remove("lupa"); });
  });

  /* barra fija en el móvil cuando los botones ya no se ven */
  var barra = C.$("[data-barra]");
  C.$("[data-barra-n]").textContent = p.n;
  function pintarBarra() {
    C.$("[data-barra-p]").textContent = (CFG.mostrarPrecios ? C.euro(p.p) : "") + (talla && !unica ? " · talla " + talla : "");
  }
  pintarBarra();
  C.$("[data-barra-btn]").addEventListener("click", anadir);
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (en) {
      var fuera = !en[0].isIntersecting && en[0].boundingClientRect.top < 0;
      barra.classList.toggle("si", fuera); barra.setAttribute("aria-hidden", !fuera);
      document.body.classList.toggle("con-barra", fuera);
    }).observe(C.$("[data-botones]"));
  }

  /* te puede gustar: primero de la misma categoría, luego el resto */
  var rel = P.filter(function (x) { return x.id !== p.id && x.cat === p.cat; })
    .concat(P.filter(function (x) { return x.cat !== p.cat; })).slice(0, 8);
  C.$("[data-relacionadas]").innerHTML = rel.map(function (x) { return C.tarjeta(x, { sizes: "(min-width: 1000px) 23vw, (min-width: 640px) 42vw, 72vw" }); }).join("");
  C.carrusel(C.$("[data-relacionadas-raiz]"));

  /* datos para Google */
  var ld = document.createElement("script");
  ld.type = "application/ld+json";
  ld.textContent = JSON.stringify({
    "@context": "https://schema.org", "@type": "Product", name: p.n, description: p.d, category: cat.n,
    image: p.fotos.map(function (f) { return location.origin + "/img/" + f + ".jpg"; }), brand: { "@type": "Brand", name: "Cuore" },
    offers: { "@type": "Offer", price: p.p.toFixed(2), priceCurrency: "EUR", availability: "https://schema.org/LimitedAvailability", url: enlace },
  });
  document.head.appendChild(ld);
})();
