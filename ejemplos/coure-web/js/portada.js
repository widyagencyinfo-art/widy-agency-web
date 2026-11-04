/* ============================================================
   CUORE · portada
   ============================================================ */
(function () {
  "use strict";
  var CFG = window.CUORE, P = window.PRENDAS;

  /* ---------- Pase de looks del hero ---------- */
  var raiz = C.$(".portada"), pase = C.$("[data-pase]");
  var enHero = [];
  if (pase) {
    var slides = C.$$(".portada__slide", pase), barras = C.$$("[data-ir]", pase);
    var lleva = C.$("[data-lleva]"), actual = 0, t = null, DUR = 6500;
    raiz.style.setProperty("--pase", DUR / 1000 + "s");
    slides.forEach(function (s) { enHero.push(s.getAttribute("data-prenda")); });

    function pintaLleva(i, animar) {
      var p = C.prenda(slides[i].getAttribute("data-prenda"));
      if (!p || !lleva) return;
      function pon() {
        lleva.href = C.urlPrenda(p);
        C.$("[data-lleva-n]", lleva).textContent = p.n;
        C.$("[data-lleva-p]", lleva).textContent = CFG.mostrarPrecios ? C.euro(p.p) : "";
        lleva.classList.remove("cambia");
      }
      if (!animar) return pon();
      lleva.classList.add("cambia"); setTimeout(pon, 350);
    }
    function ir(i) {
      slides[actual].classList.remove("activa");
      barras.forEach(function (b, k) { b.classList.remove("activa"); b.classList.toggle("hecha", k < i); });
      actual = (i + slides.length) % slides.length;
      slides[actual].classList.add("activa");
      var b = barras[actual]; void b.offsetWidth; b.classList.add("activa");
      pintaLleva(actual, true);
      programa();
    }
    function programa() { clearTimeout(t); if (!raiz.classList.contains("pausa")) t = setTimeout(function () { ir(actual + 1); }, DUR); }
    barras.forEach(function (b) { b.addEventListener("click", function () { ir(+b.getAttribute("data-ir")); }); });
    /* pausa si la pestaña no se ve o con el ratón encima del look */
    function pausa(si) { raiz.classList.toggle("pausa", si); if (si) clearTimeout(t); else programa(); }
    pase.addEventListener("mouseenter", function () { pausa(true); });
    pase.addEventListener("mouseleave", function () { pausa(false); });
    document.addEventListener("visibilitychange", function () { pausa(document.hidden); });
    /* deslizar con el dedo */
    var x0 = null;
    pase.addEventListener("touchstart", function (e) { x0 = e.touches[0].clientX; }, { passive: true });
    pase.addEventListener("touchend", function (e) {
      if (x0 === null) return; var dx = e.changedTouches[0].clientX - x0; x0 = null;
      if (Math.abs(dx) > 40) ir(actual + (dx < 0 ? 1 : -1));
    });
    pintaLleva(0, false);
    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) programa();
  }

  /* ---------- «Llegó esta semana»: lo nuevo primero, sin repetir las del hero ---------- */
  var novedades = P.filter(function (p) { return enHero.indexOf(p.id) < 0; })
    .sort(function (a, b) { return (b.nuevo || 0) - (a.nuevo || 0) || a.orden - b.orden; });
  var pista = C.$("[data-novedades]");
  if (pista) {
    pista.innerHTML = novedades.map(function (p) {
      return C.tarjeta(p, { sizes: "(min-width: 1000px) 23vw, (min-width: 640px) 42vw, 72vw" });
    }).join("");
    C.carrusel(C.$("[data-novedades-raiz]"));
  }

  /* ---------- cuántas prendas hay de cada cosa ---------- */
  C.$$("[data-cuenta]").forEach(function (s) {
    var n = P.filter(function (p) { return p.cat === s.getAttribute("data-cuenta"); }).length;
    s.textContent = n + (n === 1 ? " prenda" : " prendas");
  });

  /* ---------- horario ---------- */
  var h = C.$("[data-horario]");
  if (h) h.innerHTML = CFG.horario.map(function (x) { return "<span>" + C.esc(x.d) + "</span><span>" + C.esc(x.h) + "</span>"; }).join("");

  C.aparecer();
})();
