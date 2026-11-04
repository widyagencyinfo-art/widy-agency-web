/* ═══════════════════════════════════════════════
   ALICIA LENCERÍA · lógica de la landing
   ═══════════════════════════════════════════════ */
(function () {
  'use strict';
  const C = window.CONFIG || CONFIG;
  const $  = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const N  = C.negocio;

  /* ── WhatsApp ───────────────────────────── */
  const wa = (txt) => `https://wa.me/${N.whatsappRaw}?text=${encodeURIComponent(txt)}`;
  const SALUDO = '¡Hola! Os escribo desde la web 👋 ';

  function pintarEnlaces() {
    const set = (sel, href, txt) => {
      const el = $(sel); if (!el) return;
      if (href) el.href = href;
      if (txt != null) el.textContent = txt;
    };
    const gen = wa(SALUDO + 'Quería preguntaros una cosa.');
    ['#waHdr', '#ctaHdr', '#ctaHero', '#ctaCierre', '#fab', '#ftWa'].forEach(s => set(s, gen));
    set('#ctaLook',  wa(SALUDO + 'He visto el escaparate y me ha gustado algo. ¿Me decís tallas y precio?'));
    set('#ctaPasos', wa(SALUDO + 'Quería comprar desde casa. ¿Me ayudáis a elegir?'));

    set('#lnkTel', 'tel:' + N.telefonoRaw);
    set('#ftTel',  'tel:' + N.telefonoRaw, N.telefono);
    set('#telTxt', null, N.telefono);
    set('#ftMail', 'mailto:' + N.email, N.email);
    set('#lnkMaps', N.mapsUrl);
    set('#resLink', N.mapsUrl);
    const ig = 'https://www.instagram.com/' + N.instagram + '/';
    set('#lnkIg', ig); set('#ftIg', ig);
    set('#cierreN', null, N.whatsapp);
    $('#ftWa').textContent = 'WhatsApp ' + N.whatsapp;

    const m = $('#mapa'); if (m) m.src = N.mapsEmbed;
    $('#rNota').textContent   = C.rating.nota;
    $('#rTotal').textContent  = C.rating.total;
    $('#rTotal2').textContent = C.rating.total;
    $('#igSeg').textContent   = N.instagramSeguidores;
    $('#year').textContent    = new Date().getFullYear();
  }

  /* ── Ticker de avisos ───────────────────── */
  function ticker() {
    const t = $('#tickerIn');
    const uno = C.avisos.map(a => `<span>${a}</span>`).join('');
    t.innerHTML = uno + uno;   // duplicado para el bucle infinito
  }

  /* ── Header ─────────────────────────────── */
  function header() {
    const hdr = $('#hdr'), burger = $('#burger'), nav = $('#nav');
    let last = 0;
    addEventListener('scroll', () => {
      const y = scrollY;
      hdr.classList.toggle('scrolled', y > 12);
      $('#fab').classList.toggle('on', y > 520);
      last = y;
    }, { passive: true });

    burger.addEventListener('click', () => {
      const open = burger.getAttribute('aria-expanded') === 'true';
      burger.setAttribute('aria-expanded', String(!open));
      nav.classList.toggle('open', !open);
      document.body.classList.toggle('lock', !open);
    });
    $$('#nav a').forEach(a => a.addEventListener('click', () => {
      burger.setAttribute('aria-expanded', 'false');
      nav.classList.remove('open');
      document.body.classList.remove('lock');
    }));
  }

  /* ── Categorías ─────────────────────────── */
  function categorias() {
    $('#catGrid').innerHTML = C.categorias.map(c => `
      <a class="cc" href="${wa(SALUDO + 'Quería ver lo que tenéis de ' + c.nombre.toLowerCase() + '.')}" target="_blank" rel="noopener">
        <img src="${c.img}" alt="${c.nombre} en Alicia Lencería" loading="lazy" />
        <span class="cc-in">
          <span class="cc-name">${c.nombre}</span>
          <span class="cc-sub">${c.sub}</span>
          <span class="cc-go">Preguntar <span aria-hidden="true">→</span></span>
        </span>
      </a>`).join('');

    $('#ftCats').innerHTML = C.categorias.map(c =>
      `<li><a href="#escaparate">${c.nombre}</a></li>`).join('');
  }

  /* ── Escaparate ─────────────────────────── */
  function escaparate() {
    $('#lookGrid').innerHTML = C.escaparate.map((p, i) => `
      <a class="lk${p.destacado ? ' lk-big' : ''}" style="--i:${i}"
         href="${wa(SALUDO + 'Me interesa el/la "' + p.nombre + '" de ' + p.marca + '. ¿Me decís tallas, colores y precio?')}"
         target="_blank" rel="noopener">
        <span class="lk-media"><img src="${p.img}" alt="${p.nombre} de ${p.marca}" loading="lazy" /></span>
        ${p.nota ? `<span class="lk-badge">${p.nota}</span>` : ''}
        <span class="lk-body">
          <span class="lk-marca">${p.marca}</span>
          <span class="lk-name">${p.nombre}</span>
          <span class="lk-ask">Preguntar por WhatsApp&nbsp;<span aria-hidden="true">→</span></span>
        </span>
      </a>`).join('');
  }

  /* ── Marcas ─────────────────────────────── */
  function marcas() {
    const uno = C.marcas.map(m => `<span>${m}</span>`).join('');
    $('#marq').innerHTML = uno + uno;
  }

  /* ── Reseñas ────────────────────────────── */
  function resenas() {
    $('#resGrid').innerHTML = C.resenas.map(r => `
      <article class="rc">
        <p class="rc-stars" aria-label="5 sobre 5">★★★★★</p>
        <p class="rc-txt">${r.texto}</p>
        <footer class="rc-who">
          <span class="rc-ini" aria-hidden="true">${r.nombre.charAt(0)}</span>
          <span><span class="rc-name">${r.nombre}</span><br><span class="rc-src">Reseña de Google</span></span>
        </footer>
      </article>`).join('');
  }

  /* ── FAQ ────────────────────────────────── */
  function faq() {
    $('#faqList').innerHTML = C.faq.map((f, i) => `
      <div class="fq">
        <button class="fq-q" aria-expanded="false" aria-controls="fa${i}">
          ${f.q}<span class="fq-ico" aria-hidden="true"></span>
        </button>
        <div class="fq-a" id="fa${i}"><p>${f.a}</p></div>
      </div>`).join('');

    $$('.fq-q').forEach(b => b.addEventListener('click', () => {
      const fq = b.parentElement, a = b.nextElementSibling;
      const abierto = fq.classList.contains('on');
      $$('.fq').forEach(o => { o.classList.remove('on'); $('.fq-a', o).style.maxHeight = null; $('.fq-q', o).setAttribute('aria-expanded', 'false'); });
      if (!abierto) { fq.classList.add('on'); a.style.maxHeight = a.scrollHeight + 'px'; b.setAttribute('aria-expanded', 'true'); }
    }));
  }

  /* ── Horario y estado ───────────────────── */
  function horario() {
    const hoy = new Date().getDay();
    $('#horario').innerHTML = C.horario.map(h =>
      `<tr class="${h.d === hoy ? 'hoy' : ''}"><td>${h.dia}</td><td>${h.texto}</td></tr>`).join('');

    const ahora = new Date(), min = ahora.getHours() * 60 + ahora.getMinutes();
    const dia = C.horario.find(h => h.d === hoy);
    const abierto = dia && dia.tramos.some(t => min >= t[0] && min < t[1]);
    const est = $('#estado');
    est.classList.add(abierto ? 'open' : 'closed');

    let txt;
    if (abierto) {
      const cierra = dia.tramos.find(t => min >= t[0] && min < t[1])[1];
      txt = `Abierto ahora · cerramos a las ${String(Math.floor(cierra / 60)).padStart(2, '0')}:${String(cierra % 60).padStart(2, '0')}`;
    } else {
      // buscar la próxima apertura
      let d = hoy, salto = 0, prox = null;
      while (salto < 8) {
        const h = C.horario.find(x => x.d === d);
        if (h) for (const t of h.tramos) {
          if (salto === 0 && min >= t[0]) continue;
          prox = { dia: h.dia, hora: t[0], salto }; break;
        }
        if (prox) break;
        d = (d + 1) % 7; salto++;
      }
      const hh = prox ? `${String(Math.floor(prox.hora / 60)).padStart(2, '0')}:${String(prox.hora % 60).padStart(2, '0')}` : '';
      const cuando = !prox ? '' : prox.salto === 0 ? `hoy a las ${hh}` : prox.salto === 1 ? `mañana a las ${hh}` : `el ${prox.dia.toLowerCase()} a las ${hh}`;
      txt = `Cerrado ahora · abrimos ${cuando}`;
    }
    $('#estadoTxt').textContent = txt + ' · el WhatsApp sigue abierto';
  }

  /* ── Calculadora de talla ───────────────── */
  function calculadora() {
    const form = $('#calc'), res = $('#calcRes'), hint = $('#calcHint');

    form.addEventListener('submit', e => {
      e.preventDefault();
      const bajo  = parseFloat($('#mBajo').value);
      const pecho = parseFloat($('#mPecho').value);

      hint.classList.remove('err');
      if (!bajo || !pecho) { hint.textContent = 'Nos faltan las dos medidas para poder calcularlo.'; hint.classList.add('err'); return; }
      if (pecho <= bajo)   { hint.textContent = 'El contorno de pecho tiene que ser mayor que el de bajo pecho. Vuelve a medir.'; hint.classList.add('err'); return; }

      const c = C.tallas.contorno.find(x => bajo >= x.min && bajo <= x.max);
      if (!c) { hint.textContent = 'Esa medida se nos sale de la tabla. Escríbenos y lo miramos contigo.'; hint.classList.add('err'); return; }
      const dif  = Math.round(pecho - bajo);
      const copa = C.tallas.copas.find(x => dif <= x.max).copa;
      const talla = c.talla + copa;

      $('#resV').textContent = talla;
      const grande = ['E','F','G','H','I'].includes(copa);
      $('#resTxt').textContent = grande
        ? 'Esa es de las tallas que casi nadie tiene — y nosotras sí. Escríbenos y te decimos qué modelos hay ahora mismo.'
        : 'Escríbenos con esta talla y te enseñamos lo que tenemos en ella.';
      $('#resWa').href = wa(`${SALUDO}He usado la calculadora de la web y me sale la talla ${talla} (bajo pecho ${bajo} cm, pecho ${pecho} cm). ¿Qué tenéis en mi talla?`);

      form.hidden = true; res.hidden = false;
      res.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });

    $('#resAgain').addEventListener('click', () => {
      res.hidden = true; form.hidden = false;
      hint.textContent = 'Orientativo. Si dudas, mándanos las medidas y lo miramos contigo.';
      hint.classList.remove('err');
      $('#mBajo').value = ''; $('#mPecho').value = ''; $('#mBajo').focus();
    });
  }

  /* ── Reveal al hacer scroll ─────────────── */
  function reveal() {
    const els = $$('.reveal');
    if (!('IntersectionObserver' in window)) { els.forEach(e => e.classList.add('in')); return; }
    const io = new IntersectionObserver((ents) => {
      ents.forEach((e, i) => {
        if (!e.isIntersecting) return;
        setTimeout(() => e.target.classList.add('in'), i * 70);
        io.unobserve(e.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: .08 });
    els.forEach(e => io.observe(e));
  }

  /* ── Aviso de boceto ────────────────────── */
  function aviso() {
    const b = $('#boceto');
    setTimeout(() => b.classList.add('on'), 2200);
    $('#bocetoX').addEventListener('click', () => b.classList.remove('on'));
  }

  /* ── Arranque ───────────────────────────── */
  pintarEnlaces();
  ticker();
  header();
  categorias();
  escaparate();
  marcas();
  resenas();
  faq();
  horario();
  calculadora();
  reveal();
  aviso();
})();
