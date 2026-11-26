/* Portada «top» (borrador 26-nov-2026). Ver home/top.css.
   Entradas al bajar, titulares palabra a palabra, cifras que cuentan, botones imán, luz que sigue al ratón,
   tarjetas que se inclinan, casos que se apilan, tira que se arrastra y línea de pasos que se rellena. */
(function () {
  var root = document.querySelector('.tp');
  if (!root) return;
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fino = matchMedia('(hover: hover) and (pointer: fine)').matches;
  var each = function (sel, fn, ctx) { Array.prototype.forEach.call((ctx || root).querySelectorAll(sel), fn); };

  /* 1 · titulares palabra a palabra */
  function partir(el) {
    var w = 0;
    (function rec(nodo) {
      Array.prototype.slice.call(nodo.childNodes).forEach(function (n) {
        if (n.nodeType === 3) {
          var frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(function (t) {
            if (!t) return;
            if (/^\s+$/.test(t)) { frag.appendChild(document.createTextNode(' ')); return; }
            var o = document.createElement('span'); o.className = 'tp-w';
            var i = document.createElement('span'); i.textContent = t; i.style.setProperty('--w', w++);
            o.appendChild(i); frag.appendChild(o);
          });
          nodo.replaceChild(frag, n);
        } else if (n.nodeType === 1 && !n.classList.contains('tp-kw')) { rec(n); }
      });
    })(el);
  }
  if (!reduce) each('[data-split]', partir);

  /* 2 · entradas al bajar (con cascada entre hermanos) */
  root.classList.add('tp-js');
  var vistos = [];
  each('[data-r], [data-split], .tp-card, [data-tpn]', function (el) { vistos.push(el); });
  if (reduce || !('IntersectionObserver' in window)) {
    vistos.forEach(function (el) { el.classList.add('on'); });
  } else {
    each('[data-stagger]', function (grupo) {
      Array.prototype.forEach.call(grupo.children, function (h, i) { h.style.setProperty('--d', i * 90); });
    });
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add('on');
        if (e.target.hasAttribute('data-tpn')) contar(e.target);
        io.unobserve(e.target);
      });
    }, { threshold: 0.18, rootMargin: '0px 0px -6% 0px' });
    vistos.forEach(function (el) { io.observe(el); });
  }

  /* 3 · cifras que cuentan */
  function contar(el) {
    var fin = parseFloat(el.getAttribute('data-tpn'));
    if (reduce || isNaN(fin)) { return; }
    var t0 = null, dur = 1400;
    function paso(t) {
      if (!t0) t0 = t;
      var k = Math.min(1, (t - t0) / dur);
      var e = 1 - Math.pow(1 - k, 4);
      el.firstChild.nodeValue = Math.round(fin * e);
      if (k < 1) requestAnimationFrame(paso);
    }
    el.firstChild.nodeValue = '0';
    requestAnimationFrame(paso);
  }

  if (reduce) return;

  /* 4 · luz que sigue al ratón en las zonas oscuras */
  if (fino) {
    each('.tp-hero, .tp-end', function (zona) {
      var raf = 0;
      zona.addEventListener('pointermove', function (ev) {
        if (raf) return;
        raf = requestAnimationFrame(function () {
          var r = zona.getBoundingClientRect();
          zona.style.setProperty('--mx', ((ev.clientX - r.left) / r.width * 100).toFixed(1) + '%');
          zona.style.setProperty('--my', ((ev.clientY - r.top) / r.height * 100).toFixed(1) + '%');
          raf = 0;
        });
      });
    });

    /* 5 · botones imán */
    each('[data-magnet]', function (b) {
      b.addEventListener('pointermove', function (ev) {
        var r = b.getBoundingClientRect();
        var x = (ev.clientX - r.left - r.width / 2) * 0.22, y = (ev.clientY - r.top - r.height / 2) * 0.32;
        b.style.transform = 'translate(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px)';
      });
      b.addEventListener('pointerleave', function () { b.style.transform = ''; });
    });

    /* 6 · tarjetas que se inclinan y brillan donde está el ratón */
    each('.tp-card', function (c) {
      c.addEventListener('pointermove', function (ev) {
        var r = c.getBoundingClientRect();
        var px = (ev.clientX - r.left) / r.width, py = (ev.clientY - r.top) / r.height;
        c.style.setProperty('--cx', (px * 100).toFixed(1) + '%');
        c.style.setProperty('--cy', (py * 100).toFixed(1) + '%');
        c.style.transform = 'perspective(1100px) rotateX(' + ((0.5 - py) * 4).toFixed(2) + 'deg) rotateY(' + ((px - 0.5) * 5).toFixed(2) + 'deg) translateY(-4px)';
      });
      c.addEventListener('pointerleave', function () { c.style.transform = ''; });
    });
  }

  /* 7 · tira de bocetos: se arrastra con el ratón */
  each('.tp-rail', function (rail) {
    var abajo = false, x0 = 0, s0 = 0, movido = false;
    rail.addEventListener('pointerdown', function (ev) {
      if (ev.pointerType !== 'mouse') return;
      abajo = true; movido = false; x0 = ev.clientX; s0 = rail.scrollLeft;
    });
    window.addEventListener('pointermove', function (ev) {
      if (!abajo) return;
      var dx = ev.clientX - x0;
      if (Math.abs(dx) > 6 && !movido) { movido = true; rail.classList.add('drag'); }
      if (movido) rail.scrollLeft = s0 - dx;
    });
    window.addEventListener('pointerup', function () {
      if (!abajo) return;
      abajo = false;
      setTimeout(function () { rail.classList.remove('drag'); }, 0);
    });
    rail.addEventListener('click', function (ev) { if (movido) { ev.preventDefault(); movido = false; } }, true);
  });

  /* 8 · al bajar: casos que se apilan, foto con paralaje y línea de pasos */
  var casos = root.querySelectorAll('.tp-case');
  var foto = root.querySelector('.tp-photo');
  var linea = root.querySelector('.tp-line');
  var ancho = matchMedia('(min-width: 900px)');
  var tic = false;
  function alBajar() {
    tic = false;
    var vh = innerHeight;
    if (ancho.matches) {
      for (var i = 0; i < casos.length - 1; i++) {
        var sig = casos[i + 1].getBoundingClientRect();
        var k = Math.max(0, Math.min(1, 1 - (sig.top - 120) / (vh * 0.8)));
        casos[i].style.transform = 'scale(' + (1 - k * 0.05).toFixed(4) + ')';
        casos[i].style.filter = 'brightness(' + (1 - k * 0.28).toFixed(3) + ')';
      }
    }
    if (foto) {
      var r = foto.getBoundingClientRect();
      if (r.bottom > 0 && r.top < vh) foto.style.setProperty('--py', ((vh - r.top) / (vh + r.height) * 44).toFixed(1));
    }
    if (linea) {
      var l = linea.getBoundingClientRect();
      linea.style.setProperty('--p', Math.max(0, Math.min(1, (vh * 0.85 - l.top) / (vh * 0.5))).toFixed(3));
    }
  }
  addEventListener('scroll', function () { if (!tic) { tic = true; requestAnimationFrame(alBajar); } }, { passive: true });
  addEventListener('resize', alBajar);
  alBajar();
})();

/* ===== segunda pasada: entrada de marca, manifiesto, cursor propio, muro y cintas ===== */
(function () {
  var root = document.querySelector('.tp');
  if (!root) return;
  var doc = document.documentElement;
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fino = matchMedia('(hover: hover) and (pointer: fine)').matches;

  /* entrada de marca */
  var intro = root.querySelector('.tp-intro');
  if (intro && doc.classList.contains('tp-intro-on')) {
    try { sessionStorage.setItem('tpIntro', '1'); } catch (e) {}
    var n = intro.querySelector('.tp-intro-n'), barra = intro.querySelector('.tp-intro-bar i'), t0 = null, dur = 950;
    (function paso(t) {
      if (!t0) t0 = t;
      var k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 3);
      n.textContent = Math.round(e * 100);
      barra.style.setProperty('--p', e.toFixed(3));
      if (k < 1) { requestAnimationFrame(paso); return; }
      intro.classList.add('out');
      setTimeout(function () { doc.classList.remove('tp-intro-on'); }, 850);
    })(performance.now());
  }

  /* manifiesto: palabras que se encienden */
  var mani = root.querySelector('[data-mani]'), palabras = [];
  if (mani && !reduce) {
    (function rec(nodo) {
      Array.prototype.slice.call(nodo.childNodes).forEach(function (c) {
        if (c.nodeType === 3) {
          var frag = document.createDocumentFragment();
          c.textContent.split(/(\s+)/).forEach(function (t) {
            if (!t) return;
            if (/^\s+$/.test(t)) { frag.appendChild(document.createTextNode(' ')); return; }
            var s = document.createElement('span'); s.className = 'mw'; s.textContent = t; palabras.push(s); frag.appendChild(s);
          });
          nodo.replaceChild(frag, c);
        } else if (c.nodeType === 1) { rec(c); }
      });
    })(mani);
  }

  if (reduce) return;

  /* cursor propio */
  if (fino) {
    var cur = document.createElement('div');
    cur.className = 'tp-cur'; cur.setAttribute('aria-hidden', 'true');
    document.body.appendChild(cur);
    doc.classList.add('tp-cur-on');
    var tx = 0, ty = 0, x = 0, y = 0, vivo = false;
    function sigue() {
      x += (tx - x) * 0.2; y += (ty - y) * 0.2;
      cur.style.setProperty('--x', x.toFixed(1) + 'px'); cur.style.setProperty('--y', y.toFixed(1) + 'px');
      if (vivo || Math.abs(tx - x) > 0.5 || Math.abs(ty - y) > 0.5) requestAnimationFrame(sigue);
    }
    document.addEventListener('pointermove', function (ev) {
      tx = ev.clientX; ty = ev.clientY;
      var z = ev.target.closest ? ev.target.closest('[data-cur]') : null;
      if (z && !ev.target.closest('.tp-th[href] b')) {
        if (!vivo) { vivo = true; x = tx; y = ty; requestAnimationFrame(sigue); }
        cur.textContent = z.getAttribute('data-cur');
        cur.classList.add('on');
      } else if (vivo) { vivo = false; cur.classList.remove('on'); }
    }, { passive: true });
    document.addEventListener('pointerdown', function () { cur.style.scale = '.85'; });
    document.addEventListener('pointerup', function () { cur.style.scale = '1'; });
    addEventListener('scroll', function () { if (vivo) { vivo = false; cur.classList.remove('on'); } }, { passive: true });

    /* el muro se inclina hacia el ratón */
    var hero = root.querySelector('.tp-hero'), muro = root.querySelector('.tp-wall');
    if (hero && muro) {
      hero.addEventListener('pointermove', function (ev) {
        var r = hero.getBoundingClientRect();
        muro.style.setProperty('--wy', (((ev.clientX - r.left) / r.width - 0.5) * 7).toFixed(2) + 'deg');
        muro.style.setProperty('--wx', ((0.5 - (ev.clientY - r.top) / r.height) * 5).toFixed(2) + 'deg');
      }, { passive: true });
      hero.addEventListener('pointerleave', function () { muro.style.setProperty('--wy', '0deg'); muro.style.setProperty('--wx', '0deg'); });
    }
  }

  /* al bajar: manifiesto, cintas que se tumban con la velocidad y logotipo gigante */
  var cintas = root.querySelectorAll('.tp-sectors .tp-mq, .tp-tape');
  var grande = root.querySelector('.tp-big span');
  var yAnt = scrollY, sk = 0, tic = false, para = 0;
  function alBajar() {
    tic = false;
    var vh = innerHeight;
    if (palabras.length) {
      var r = mani.getBoundingClientRect();
      var p = Math.max(0, Math.min(1, (vh * 0.86 - r.top) / (r.height + vh * 0.34)));
      var hasta = Math.round(p * palabras.length);
      for (var i = 0; i < palabras.length; i++) palabras[i].classList.toggle('lit', i < hasta);
    }
    var dy = scrollY - yAnt; yAnt = scrollY;
    sk = Math.max(-7, Math.min(7, dy * 0.12));
    for (var j = 0; j < cintas.length; j++) cintas[j].style.setProperty('--sk', sk.toFixed(2));
    clearTimeout(para);
    para = setTimeout(function () { for (var j = 0; j < cintas.length; j++) cintas[j].style.setProperty('--sk', '0'); }, 120);
    if (grande) {
      var g = grande.parentNode.getBoundingClientRect();
      if (innerWidth >= 900 && g.top < vh && g.bottom > 0) grande.style.setProperty('--by', (Math.max(0, g.top - vh * 0.5) * 0.25).toFixed(1));
    }
  }
  addEventListener('scroll', function () { if (!tic) { tic = true; requestAnimationFrame(alBajar); } }, { passive: true });
  alBajar();
})();

/* ===== tercera pasada: el móvil primero ===== */
(function () {
  var root = document.querySelector('.tp');
  if (!root) return;

  /* casos que se deslizan: barra de avance y «02 / 05» */
  var pista = root.querySelector('[data-swipe]'), barra = root.querySelector('.tp-prog i'), num = root.querySelector('.tp-swipe-t b');
  if (pista && barra) {
    var n = pista.children.length, tic = false;
    pista.addEventListener('scroll', function () {
      if (tic) return; tic = true;
      requestAnimationFrame(function () {
        tic = false;
        var max = pista.scrollWidth - pista.clientWidth;
        var p = max > 0 ? pista.scrollLeft / max : 0;
        barra.style.setProperty('--p', p.toFixed(3));
        if (num) num.textContent = '0' + (Math.round(p * (n - 1)) + 1);
      });
    }, { passive: true });
  }

  /* barra fija para pedir el boceto */
  var hero = root.querySelector('.tp-hero'), fin = document.getElementById('boceto');
  if (hero && fin && 'IntersectionObserver' in window) {
    var dock = document.createElement('a');
    dock.className = 'tp-dock'; dock.href = root.getAttribute('data-wa') || '#boceto';
    dock.target = '_blank'; dock.rel = 'noopener';
    dock.innerHTML = '<svg class="wai" viewBox="0 0 24 24" aria-hidden="true" style="stroke:none"><path fill="currentColor" d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm5.8 14.2c-.2.7-1.4 1.3-2 1.4-.5.1-1.2.1-1.9-.1-.4-.1-1-.3-1.7-.6-3-1.3-4.9-4.3-5.1-4.5-.1-.2-1.2-1.6-1.2-3.1s.8-2.2 1.1-2.5c.3-.3.6-.4.8-.4h.6c.2 0 .4 0 .6.5l.8 2c.1.2.1.3 0 .5l-.3.5-.4.4c-.1.1-.3.3-.1.6.2.3.8 1.3 1.7 2.1 1.2 1 2.1 1.3 2.4 1.5.3.1.5.1.6-.1l.9-1.1c.2-.3.4-.2.6-.1l1.9.9c.3.1.5.2.5.3.1.2.1.7-.1 1.3z"/></svg>Pide tu boceto gratis';
    document.body.appendChild(dock);
    var enHero = true, enFin = false;
    function pinta() { dock.classList.toggle('on', !enHero && !enFin); dock.tabIndex = (!enHero && !enFin) ? 0 : -1; }
    new IntersectionObserver(function (es) { enHero = es[0].isIntersecting; pinta(); }, { threshold: 0.25 }).observe(hero);
    /* se quita al llegar al cierre y ya no vuelve en el pie */
    var ticD = false;
    addEventListener('scroll', function () {
      if (ticD) return; ticD = true;
      requestAnimationFrame(function () { ticD = false; var f = fin.getBoundingClientRect().top < innerHeight * 0.9; if (f !== enFin) { enFin = f; pinta(); } });
    }, { passive: true });
    pinta();
  }
})();

/* ===== sexta pasada: las demos de servicios se repiten mientras están en pantalla ===== */
(function () {
  var root = document.querySelector('.tp');
  if (!root || matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) return;
  var tarjetas = root.querySelectorAll('.tp-ar'), visibles = [];
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      var i = visibles.indexOf(e.target);
      if (e.isIntersecting && i < 0) visibles.push(e.target);
      if (!e.isIntersecting && i >= 0) visibles.splice(i, 1);
    });
  }, { threshold: 0.3 });
  Array.prototype.forEach.call(tarjetas, function (t) { io.observe(t); });
  var turno = 0;
  setInterval(function () {
    if (document.hidden || !visibles.length) return;
    var t = visibles[turno++ % visibles.length];
    if (!t.classList.contains('on')) return;
    t.classList.add('re'); t.classList.remove('on');
    void t.offsetWidth;
    setTimeout(function () { t.classList.add('on'); }, 60);
  }, 4200);
})();
