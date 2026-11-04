/* =========================================================
   Lencería Mordissko — interacción de la landing
   ========================================================= */
(function () {
  "use strict";

  /* ---- Año en el footer ---- */
  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---- Header con sombra al hacer scroll ---- */
  var header = document.getElementById("header");
  function onScroll() {
    if (window.scrollY > 12) header.classList.add("scrolled");
    else header.classList.remove("scrolled");
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---- Menú móvil ---- */
  var toggle = document.getElementById("navToggle");
  var nav = document.getElementById("nav");
  function closeNav() {
    nav.classList.remove("open");
    toggle.classList.remove("open");
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-label", "Abrir menú");
  }
  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("open");
      toggle.classList.toggle("open", open);
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      toggle.setAttribute("aria-label", open ? "Cerrar menú" : "Abrir menú");
    });
    nav.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", closeNav);
    });
  }

  /* ---- Reveal al entrar en el viewport ---- */
  var revealEls = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.14, rootMargin: "0px 0px -40px 0px" }
    );
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("visible"); });
  }

  /* ---- Horario: día actual + estado abierto/cerrado ----
     Horario real (Google): Lun–Vie 11:00–13:30 y 17:30–20:00.
     Sábado 11:00–13:30. Domingo: cerrado.
     Índice JS de día: 0=Dom, 1=Lun ... 6=Sáb                    */
  var HORARIO = {
    1: [[660, 810], [1050, 1200]], // Lunes
    2: [[660, 810], [1050, 1200]], // Martes
    3: [[660, 810], [1050, 1200]], // Miércoles
    4: [[660, 810], [1050, 1200]], // Jueves
    5: [[660, 810], [1050, 1200]], // Viernes
    6: [[660, 810]],               // Sábado
    0: []  // Domingo
  };

  var now = new Date();
  var day = now.getDay();
  var minutes = now.getHours() * 60 + now.getMinutes();

  // Resaltar la fila de hoy
  var todayRow = document.querySelector('#scheduleTable tr[data-day="' + day + '"]');
  if (todayRow) todayRow.classList.add("today");

  // Calcular estado actual
  var noteEl = document.getElementById("openNow");
  if (noteEl) {
    var tramos = HORARIO[day] || [];
    var abierto = false;
    var proximaApertura = null;
    for (var i = 0; i < tramos.length; i++) {
      if (minutes >= tramos[i][0] && minutes < tramos[i][1]) { abierto = true; break; }
      if (minutes < tramos[i][0] && proximaApertura === null) proximaApertura = tramos[i][0];
    }

    function fmt(m) {
      var h = Math.floor(m / 60);
      var mm = m % 60;
      return h + ":" + (mm < 10 ? "0" + mm : mm);
    }
    // Buscar el próximo día con horario (para mensajes de cerrado)
    function proximoDiaAbierto(fromDay) {
      var nombres = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
      for (var k = 1; k <= 7; k++) {
        var d = (fromDay + k) % 7;
        if ((HORARIO[d] || []).length) {
          var abre = HORARIO[d][0][0];
          var etq = (k === 1) ? "mañana" : nombres[d];
          return etq + " a las " + fmt(abre);
        }
      }
      return null;
    }

    var texto, clase;
    if (abierto) {
      // ¿cuándo cierra este tramo?
      var cierra = null;
      for (var j = 0; j < tramos.length; j++) {
        if (minutes >= tramos[j][0] && minutes < tramos[j][1]) { cierra = tramos[j][1]; break; }
      }
      texto = "Abierto ahora · cierra a las " + fmt(cierra);
      clase = "open";
    } else if (proximaApertura !== null) {
      texto = "Cerrado ahora · abre hoy a las " + fmt(proximaApertura);
      clase = "closed-now";
    } else {
      var prox = proximoDiaAbierto(day);
      texto = prox ? "Cerrado ahora · abre el " + prox : "Cerrado ahora";
      clase = "closed-now";
    }

    noteEl.classList.add(clase);
    noteEl.innerHTML = '<span class="dot"></span>' + texto;
  }
})();
