/* ============ Widy · Manual de cierre — lógica ============ */
(function () {
  "use strict";

  var DATA = (window.OBJECIONES || []).slice();
  var bank = document.getElementById("bank");
  var chipsBox = document.getElementById("chips");
  var search = document.getElementById("search");
  var countEl = document.getElementById("count");
  var statCount = document.getElementById("stat-count");
  var toast = document.getElementById("toast");
  var themeBtn = document.getElementById("theme");

  var activeCat = "__all__";
  var toastTimer = null;

  var COPY_SVG = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>';
  var CHECK_SVG = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"></path></svg>';

  function esc(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  /* ---------- render objection cards ---------- */
  function cardHTML(o) {
    return '<article class="card" data-cat="' + esc(o.categoria) + '">' +
      '<button class="cat" type="button" data-filter="' + esc(o.categoria) + '">' + esc(o.categoria) + '</button>' +
      '<div class="says"><span class="q">&ldquo;</span><h3>' + esc(o.objecion) + '</h3></div>' +
      '<p class="means">' + esc(o.significa) + '</p>' +
      '<div class="reply"><p>' + esc(o.respuesta) + '</p></div>' +
      '<button class="copy" type="button" style="margin-top:12px">' + COPY_SVG + ' Copiar respuesta</button>' +
      '<div class="why"><b>Por qué funciona:</b> ' + esc(o.por_que) + '</div>' +
      '</article>';
  }

  function render(list) {
    if (!list.length) {
      bank.innerHTML = '<div class="empty">Sin resultados para tu búsqueda.<br><b>Prueba con otra palabra</b> (ej. «caro», «agencia», «no me fío»).</div>';
      return;
    }
    bank.innerHTML = list.map(cardHTML).join("");
  }

  /* ---------- filter ---------- */
  function norm(s) { return String(s).toLowerCase(); }

  function apply() {
    var q = norm(search.value.trim());
    var list = DATA.filter(function (o) {
      if (activeCat !== "__all__" && o.categoria !== activeCat) return false;
      if (!q) return true;
      return norm(o.objecion + " " + o.respuesta + " " + o.significa + " " + o.categoria + " " + o.por_que).indexOf(q) !== -1;
    });
    render(list);
    countEl.textContent = list.length + (list.length === 1 ? " resultado" : " resultados");
  }

  /* ---------- chips ---------- */
  function buildChips() {
    var cats = [];
    DATA.forEach(function (o) { if (cats.indexOf(o.categoria) === -1) cats.push(o.categoria); });
    var html = '<button class="chip active" data-cat="__all__" type="button">Todas <span style="opacity:.55">(' + DATA.length + ')</span></button>';
    cats.forEach(function (c) {
      var n = DATA.filter(function (o) { return o.categoria === c; }).length;
      html += '<button class="chip" data-cat="' + esc(c) + '" type="button">' + esc(c) + ' <span style="opacity:.55">' + n + '</span></button>';
    });
    chipsBox.innerHTML = html;
  }

  function setCat(cat) {
    activeCat = cat;
    var all = chipsBox.querySelectorAll(".chip");
    for (var i = 0; i < all.length; i++) {
      all[i].classList.toggle("active", all[i].getAttribute("data-cat") === cat);
    }
    apply();
  }

  /* ---------- copy ---------- */
  function showToast(msg) {
    toast.textContent = msg;
    toast.classList.add("show");
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toast.classList.remove("show"); }, 1600);
  }

  function copyText(text, btn) {
    var done = function () {
      showToast("Copiado ✓");
      if (btn) {
        var old = btn.innerHTML;
        btn.classList.add("done");
        btn.innerHTML = CHECK_SVG + " Copiado";
        setTimeout(function () { btn.classList.remove("done"); btn.innerHTML = old; }, 1600);
      }
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done, function () { fallbackCopy(text, done); });
    } else {
      fallbackCopy(text, done);
    }
  }

  function fallbackCopy(text, done) {
    var ta = document.createElement("textarea");
    ta.value = text; ta.style.position = "fixed"; ta.style.opacity = "0";
    document.body.appendChild(ta); ta.focus(); ta.select();
    try { document.execCommand("copy"); done(); } catch (e) {}
    document.body.removeChild(ta);
  }

  function textFor(btn) {
    var card = btn.closest(".card");
    if (card) { var r = card.querySelector(".reply p"); return r ? r.innerText : ""; }
    var wrap = btn.closest(".copywrap");
    if (wrap) { var ct = wrap.querySelector(".ct"); return ct ? ct.innerText : ""; }
    return "";
  }

  /* ---------- delegated clicks ---------- */
  document.addEventListener("click", function (e) {
    if (!e.target.closest) return;
    var copyBtn = e.target.closest(".copy");
    if (copyBtn) {
      var text = textFor(copyBtn);
      if (text) copyText(text.trim(), copyBtn);
      return;
    }
    var chip = e.target.closest(".chip");
    if (chip) { setCat(chip.getAttribute("data-cat")); return; }
    var catBtn = e.target.closest(".cat[data-filter]");
    if (catBtn) {
      setCat(catBtn.getAttribute("data-filter"));
      document.getElementById("objeciones").scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
  });

  /* ---------- search ---------- */
  search.addEventListener("input", apply);
  document.addEventListener("keydown", function (e) {
    var tag = document.activeElement ? document.activeElement.tagName : "";
    if (e.key === "/" && document.activeElement !== search && !/^(INPUT|TEXTAREA)$/.test(tag)) {
      e.preventDefault(); search.focus();
    } else if (e.key === "Escape" && document.activeElement === search) {
      search.value = ""; apply(); search.blur();
    }
  });

  /* ---------- theme ---------- */
  (function () {
    var saved = null;
    try { saved = localStorage.getItem("widy-theme"); } catch (e) {}
    if (saved) document.documentElement.setAttribute("data-theme", saved);
    themeBtn.addEventListener("click", function () {
      var cur = document.documentElement.getAttribute("data-theme");
      var prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
      var next = cur === "dark" ? "light" : (cur === "light" ? "dark" : (prefersDark ? "light" : "dark"));
      document.documentElement.setAttribute("data-theme", next);
      try { localStorage.setItem("widy-theme", next); } catch (e) {}
    });
  })();

  /* ---------- nav scrollspy ---------- */
  (function () {
    var links = Array.prototype.slice.call(document.querySelectorAll(".nav-links a"));
    if (!links.length || !window.IntersectionObserver) return;
    var map = {};
    links.forEach(function (a) { map[a.getAttribute("href").slice(1)] = a; });
    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          links.forEach(function (a) { a.classList.remove("active"); });
          if (map[en.target.id]) map[en.target.id].classList.add("active");
        }
      });
    }, { rootMargin: "-45% 0px -50% 0px", threshold: 0 });
    ["frio", "embudo", "llamada", "objeciones"].forEach(function (id) {
      var el = document.getElementById(id); if (el) obs.observe(el);
    });
  })();

  /* ---------- init ---------- */
  if (statCount) statCount.textContent = DATA.length;
  buildChips();
  apply();
})();
