/* ============================================================
   Widy · Interacciones — tilt de tarjetas, botones magnéticos,
   foco que sigue al cursor y demo de WhatsApp interactivo.
   ============================================================ */
(function () {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- 1) Tarjetas con inclinación 3D ---------- */
  if (!reduce && window.matchMedia('(hover: hover)').matches) {
    const cards = document.querySelectorAll('.card, .module, .pillar, .plan, .rstat, .step, .member, .addon');
    cards.forEach(el => {
      el.addEventListener('mousemove', e => {
        const r = el.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        el.style.transition = 'transform .08s linear';
        el.style.transform = `perspective(900px) rotateX(${-py * 5}deg) rotateY(${px * 6}deg) translateY(-4px)`;
      });
      el.addEventListener('mouseleave', () => {
        el.style.transition = 'transform .4s var(--ease)';
        el.style.transform = '';
      });
    });
  }

  /* ---------- 2) Botones magnéticos ---------- */
  if (!reduce && window.matchMedia('(hover: hover)').matches) {
    document.querySelectorAll('.btn-primary, .nav-cta').forEach(b => {
      b.addEventListener('mousemove', e => {
        const r = b.getBoundingClientRect();
        const mx = e.clientX - r.left - r.width / 2;
        const my = e.clientY - r.top - r.height / 2;
        b.style.transform = `translate(${mx * 0.28}px, ${my * 0.4}px)`;
      });
      b.addEventListener('mouseleave', () => { b.style.transform = ''; });
    });
  }

  /* ---------- 3) Foco que sigue al cursor (secciones oscuras) ---------- */
  if (!reduce && window.matchMedia('(hover: hover)').matches) {
    document.querySelectorAll('.hero, .section-dark').forEach(sec => {
      sec.classList.add('spotlight-host');
      const spot = document.createElement('span'); spot.className = 'spot'; sec.prepend(spot);
      sec.addEventListener('mousemove', e => {
        const r = sec.getBoundingClientRect();
        sec.style.setProperty('--mx', ((e.clientX - r.left) / r.width * 100).toFixed(1) + '%');
        sec.style.setProperty('--my', ((e.clientY - r.top) / r.height * 100).toFixed(1) + '%');
        sec.classList.add('is-hot');
      });
      sec.addEventListener('mouseleave', () => sec.classList.remove('is-hot'));
    });
  }

  /* ---------- 4) Demo de WhatsApp interactivo ---------- */
  const body = document.getElementById('waBody');
  const quick = document.getElementById('waQuick');
  const demo = document.getElementById('waDemo');
  if (body && quick && demo) {
    const T = () => { const d = new Date(); return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0'); };

    const NODES = {
      start: {
        bot: '¡Hola! 👋 Soy el asistente del concesionario. ¿En qué te ayudo?',
        opts: [
          { t: '¿Sigue disponible el Audi?', next: 'avail' },
          { t: '¿Cuánto por mi coche?', next: 'tasa' },
          { t: 'Quiero una prueba', next: 'prueba' },
        ],
      },
      avail: {
        bot: '¡Sí! Nos queda un Audi A3 Sportback 2021 · 35.900 €. ¿Lo quieres ver o probar?',
        opts: [
          { t: 'Quiero probarlo', next: 'prueba' },
          { t: 'Mándame fotos', next: 'fotos' },
        ],
      },
      fotos: {
        bot: 'Te las acabo de enviar 📸. ¿Reservamos una prueba de conducción sin compromiso?',
        opts: [{ t: 'Sí, resérvala', next: 'prueba' }],
      },
      tasa: {
        bot: 'Claro 🙌 Dime marca, modelo y año y te doy una tasación orientativa al momento. Y de paso, ¿reservamos una prueba del A3?',
        opts: [{ t: 'Vale, resérvala', next: 'prueba' }],
      },
      prueba: {
        bot: '¡Genial! Tengo hueco mañana a las 18:00 o el jueves a las 11:00. ¿Cuál te viene mejor?',
        opts: [
          { t: 'Mañana 18:00', next: 'done' },
          { t: 'Jueves 11:00', next: 'done' },
        ],
      },
      done: {
        bot: '✅ ¡Reservado! Te espero. Te mando la ubicación por aquí y un recordatorio el día antes.',
        note: 'Todo esto en segundos, 24/7 — sin que el concesionario tocara el móvil.',
        opts: [{ t: '↻ Verlo otra vez', next: 'start', restart: true }],
      },
    };

    function scrollBottom() { body.scrollTop = body.scrollHeight; }
    function addMsg(text, who) {
      const m = document.createElement('div');
      m.className = 'wa-msg ' + who;
      m.innerHTML = text + '<small>' + T() + (who === 'me' ? ' ✓✓' : '') + '</small>';
      body.appendChild(m); scrollBottom();
    }
    function typing() {
      const t = document.createElement('div');
      t.className = 'wa-typing'; t.innerHTML = '<i></i><i></i><i></i>';
      body.appendChild(t); scrollBottom(); return t;
    }
    function chips(opts) {
      quick.innerHTML = '';
      opts.forEach(o => {
        const c = document.createElement('button');
        c.type = 'button'; c.className = 'wa-chip'; c.textContent = o.t;
        c.addEventListener('click', () => choose(o));
        quick.appendChild(c);
      });
    }
    let busy = false;
    function choose(o) {
      if (busy) return; busy = true; quick.innerHTML = '';
      if (o.restart) { body.innerHTML = ''; go('start'); busy = false; return; }
      addMsg(o.t, 'me');
      const t = typing();
      setTimeout(() => { t.remove(); go(o.next); busy = false; }, 1100 + Math.random() * 500);
    }
    function go(key) {
      const n = NODES[key];
      addMsg(n.bot, 'them');
      if (n.note) {
        const nn = document.createElement('div'); nn.className = 'wa-note'; nn.textContent = n.note; body.appendChild(nn); scrollBottom();
      }
      chips(n.opts);
    }

    let started = false;
    const io = new IntersectionObserver((entries) => {
      entries.forEach(en => {
        if (en.isIntersecting && !started) {
          started = true;
          const t = typing();
          setTimeout(() => { t.remove(); go('start'); }, 900);
          io.disconnect();
        }
      });
    }, { threshold: 0.4 });
    io.observe(demo);
  }
})();
