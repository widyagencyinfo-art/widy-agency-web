/* P&G REFORMA Y DECORACIÓN · interacción de la web */
(() => {
  'use strict';

  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const desktop = window.matchMedia('(min-width: 1024px)');
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const WA = '34669523926';
  const waLink = text => `https://wa.me/${WA}?text=${encodeURIComponent(text)}`;

  $$('[data-year]').forEach(el => { el.textContent = new Date().getFullYear(); });

  /* ---------- Cabecera, progreso y barra móvil ---------- */
  const hdr = $('[data-hdr]');
  const bar = $('.progress span');
  const mbar = $('[data-mbar]');
  const hero = $('.hero');
  const contact = $('#contacto');
  let lastY = window.scrollY;
  let ticking = false;
  let contactVisible = false;

  const onScroll = () => {
    const y = window.scrollY;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    if (bar) bar.style.transform = `scaleX(${max > 0 ? Math.min(y / max, 1) : 0})`;

    const heroEnd = hero ? hero.offsetHeight - 120 : 400;
    hdr.classList.toggle('is-solid', y > heroEnd - 40);
    const goingDown = y > lastY + 4;
    const goingUp = y < lastY - 4;
    if (!document.body.classList.contains('menu-open')) {
      if (goingDown && y > heroEnd) hdr.classList.add('is-hidden');
      else if (goingUp || y < heroEnd) hdr.classList.remove('is-hidden');
    }
    if (mbar) mbar.classList.toggle('is-on', y > heroEnd * 0.6 && !contactVisible && !document.body.classList.contains('menu-open'));
    lastY = y;
    ticking = false;
  };
  window.addEventListener('scroll', () => { if (!ticking) { requestAnimationFrame(onScroll); ticking = true; } }, { passive: true });
  onScroll();

  if (contact && 'IntersectionObserver' in window) {
    new IntersectionObserver(([e]) => { contactVisible = e.isIntersecting; onScroll(); }, { threshold: 0.05 }).observe(contact);
  }

  /* Enlace activo en la navegación */
  const navLinks = $$('.nav a');
  const sections = navLinks.map(a => $(a.getAttribute('href'))).filter(Boolean);
  if ('IntersectionObserver' in window && sections.length) {
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        navLinks.forEach(a => {
          const on = a.getAttribute('href') === `#${e.target.id}`;
          a.classList.toggle('is-current', on);
          if (on) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current');
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    sections.forEach(s => io.observe(s));
  }

  /* ---------- Menú móvil ---------- */
  const burger = $('[data-burger]');
  const menu = $('[data-menu]');
  const setMenu = open => {
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
    menu.hidden = !open;
    document.body.classList.toggle('menu-open', open);
    hdr.classList.remove('is-hidden');
    if (open) { const first = $('a', menu); first && first.focus(); }
    onScroll();
  };
  burger.addEventListener('click', () => setMenu(burger.getAttribute('aria-expanded') !== 'true'));
  menu.addEventListener('click', e => { if (e.target.closest('a')) setMenu(false); });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && !menu.hidden) { setMenu(false); burger.focus(); }
  });
  desktop.addEventListener('change', e => { if (e.matches && !menu.hidden) setMenu(false); });

  /* ---------- Hero: baño → cocina → salón ---------- */
  const slides = $$('.hero-img');
  const steps = $$('.step');
  const STEP_MS = 6500;
  let cur = 0;
  let timer = null;
  let heroVisible = true;

  const go = i => {
    cur = (i + slides.length) % slides.length;
    slides.forEach((s, k) => s.classList.toggle('is-on', k === cur));
    steps.forEach((s, k) => {
      s.classList.toggle('is-on', k === cur);
      s.classList.toggle('is-done', k < cur);
      s.setAttribute('aria-selected', String(k === cur));
      const fill = $('.step-bar span', s);
      fill.style.animation = 'none'; void fill.offsetWidth; fill.style.animation = '';
    });
  };
  const play = () => {
    clearTimeout(timer);
    if (reduced || !heroVisible || document.hidden) { hero.classList.add('is-paused'); return; }
    hero.classList.remove('is-paused');
    timer = setTimeout(() => { go(cur + 1); play(); }, STEP_MS);
  };
  hero.style.setProperty('--step-dur', `${STEP_MS}ms`);
  if (reduced) hero.style.setProperty('--step-dur', '0.01ms');
  steps.forEach((s, k) => s.addEventListener('click', () => { go(k); play(); }));
  document.addEventListener('visibilitychange', play);
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([e]) => { heroVisible = e.isIntersecting; play(); }, { threshold: 0.2 }).observe(hero);
  }
  go(0); play();

  /* ---------- Cinta ---------- */
  const mq = $('[data-marquee]');
  if (mq && !reduced) {
    const track = $('.marquee-track', mq);
    [...track.children].forEach(li => { const c = li.cloneNode(true); c.setAttribute('aria-hidden', 'true'); track.appendChild(c); });
    const setDur = () => mq.style.setProperty('--mq-dur', `${Math.max(track.scrollWidth / 2 / 55, 20)}s`);
    setDur(); window.addEventListener('resize', setDur);
    mq.classList.add('is-running');
  }

  /* ---------- Apariciones y contadores ---------- */
  const fmt = (n, dec) => n.toFixed(dec).replace('.', ',');
  const countUp = el => {
    const end = parseFloat(el.dataset.count);
    const dec = parseInt(el.dataset.dec || '0', 10);
    if (Number.isNaN(end) || reduced) { el.textContent = fmt(end, dec); return; }
    const t0 = performance.now(); const dur = 1300;
    const step = t => {
      const p = Math.min((t - t0) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 4);
      const v = end * eased;
      el.textContent = fmt(dec ? v : Math.round(v), dec);
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  const reveals = $$('.reveal');
  if ('IntersectionObserver' in window) {
    const rio = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        const el = e.target;
        const sibs = [...el.parentElement.children].filter(n => n.classList.contains('reveal'));
        const idx = Math.max(sibs.indexOf(el), 0);
        el.style.setProperty('--d', `${Math.min(idx, 6) * 60}ms`);
        el.classList.add('is-in');
        $$('[data-count]', el).forEach(countUp);
        rio.unobserve(el);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
    reveals.forEach(el => rio.observe(el));
  } else {
    reveals.forEach(el => el.classList.add('is-in'));
  }

  /* ---------- Servicios: acordeón (móvil) / panel (escritorio) ---------- */
  const svc = $('[data-svc]');
  if (svc) {
    const items = $$('.svc-item', svc);
    const activate = (item, fromUser) => {
      const isDesk = desktop.matches;
      const wasOn = item.classList.contains('is-on');
      if (!isDesk && wasOn && fromUser) {
        item.classList.remove('is-on');
        $('button', item).setAttribute('aria-expanded', 'false');
        return;
      }
      const head = $('.svc-head', item);
      const before = head.getBoundingClientRect().top;
      items.forEach(it => {
        const on = it === item;
        it.classList.toggle('is-on', on);
        $('button', it).setAttribute('aria-expanded', String(on));
      });
      if (!isDesk && fromUser) {
        requestAnimationFrame(() => {
          setTimeout(() => {
            const after = head.getBoundingClientRect().top;
            const hh = hdr.offsetHeight;
            if (after < hh || Math.abs(after - before) > 40) {
              window.scrollBy({ top: after - Math.max(before, hh + 12), behavior: reduced ? 'auto' : 'smooth' });
            }
          }, 320);
        });
      }
    };
    items.forEach(item => {
      const btn = $('button', item);
      btn.addEventListener('click', () => activate(item, true));
      if (finePointer) {
        let t;
        btn.addEventListener('mouseenter', () => { if (desktop.matches) { t = setTimeout(() => activate(item, false), 110); } });
        btn.addEventListener('mouseleave', () => clearTimeout(t));
      }
    });
    svc.addEventListener('keydown', e => {
      if (!['ArrowDown', 'ArrowUp'].includes(e.key)) return;
      const btns = items.map(it => $('button', it));
      const i = btns.indexOf(document.activeElement);
      if (i < 0) return;
      e.preventDefault();
      const n = btns[(i + (e.key === 'ArrowDown' ? 1 : -1) + btns.length) % btns.length];
      n.focus();
      if (desktop.matches) activate(n.closest('.svc-item'), false);
    });
    desktop.addEventListener('change', e => {
      if (e.matches && !items.some(it => it.classList.contains('is-on'))) activate(items[0], false);
    });
  }

  /* ---------- Estilos de decoración (pestañas) ---------- */
  const st = $('[data-styles]');
  if (st) {
    const tabs = $$('[role="tab"]', st);
    const panels = $$('[role="tabpanel"]', st);
    const selectTab = (tab, focus) => {
      tabs.forEach(t => {
        const on = t === tab;
        t.setAttribute('aria-selected', String(on));
        t.tabIndex = on ? 0 : -1;
      });
      panels.forEach(p => { p.hidden = p.id !== tab.getAttribute('aria-controls'); });
      if (focus) tab.focus();
      tab.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: reduced ? 'auto' : 'smooth' });
    };
    tabs.forEach(t => t.addEventListener('click', () => selectTab(t, false)));
    st.addEventListener('keydown', e => {
      const i = tabs.indexOf(document.activeElement);
      if (i < 0 || !['ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(e.key)) return;
      e.preventDefault();
      const n = e.key === 'Home' ? 0 : e.key === 'End' ? tabs.length - 1 : (i + (e.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
      selectTab(tabs[n], true);
    });
    panels.forEach(p => {
      const cta = $('[data-style-cta]', p);
      if (cta) cta.href = waLink(`Hola, me gusta el estilo «${p.dataset.style}» que tenéis en la web. ¿Me podéis preparar una propuesta para mi casa?`);
    });
  }

  /* ---------- Obras: filtros ---------- */
  const works = $$('.work');
  const chips = $$('[data-filters] .chip');
  const counts = { all: works.length };
  works.forEach(w => { counts[w.dataset.cat] = (counts[w.dataset.cat] || 0) + 1; });
  $$('[data-n]').forEach(el => { el.textContent = String(counts[el.dataset.n] || 0); });
  chips.forEach(chip => chip.addEventListener('click', () => {
    const f = chip.dataset.f;
    chips.forEach(c => { const on = c === chip; c.classList.toggle('is-on', on); c.setAttribute('aria-pressed', String(on)); });
    works.forEach(w => { w.hidden = !(f === 'all' || w.dataset.cat === f); });
  }));

  /* ---------- Visor de fotos ---------- */
  const lb = $('[data-lb]');
  const lbImg = $('[data-lb-img]');
  const lbCat = $('[data-lb-cat]');
  const lbT = $('[data-lb-t]');
  const lbN = $('[data-lb-n]');
  let list = [];
  let li = 0;
  let opener = null;

  const show = i => {
    li = (i + list.length) % list.length;
    const w = list[li];
    const btn = $('.work-btn', w);
    lbImg.src = btn.dataset.full;
    lbImg.alt = $('img', w).alt;
    lbCat.textContent = $('.work-cat', w).textContent;
    lbT.textContent = $('.work-t', w).textContent;
    lbN.textContent = `${li + 1} / ${list.length}`;
    const nxt = list[(li + 1) % list.length];
    if (nxt) { const p = new Image(); p.src = $('.work-btn', nxt).dataset.full; }
  };
  const openLb = w => {
    list = works.filter(x => !x.hidden);
    opener = document.activeElement;
    show(list.indexOf(w));
    if (typeof lb.showModal === 'function') lb.showModal(); else lb.setAttribute('open', '');
    document.body.style.overflow = 'hidden';
    $('[data-lb-close]', lb).focus();
  };
  const closeLb = () => { if (lb.open) lb.close(); };
  lb.addEventListener('close', () => { document.body.style.overflow = ''; lbImg.removeAttribute('src'); opener && opener.focus(); });

  works.forEach(w => {
    const btn = $('.work-btn', w);
    btn.setAttribute('aria-label', `Ampliar foto: ${$('.work-t', w).textContent}`);
    btn.addEventListener('click', () => openLb(w));
  });
  $('[data-lb-close]').addEventListener('click', closeLb);
  $('[data-lb-prev]').addEventListener('click', () => show(li - 1));
  $('[data-lb-next]').addEventListener('click', () => show(li + 1));
  lb.addEventListener('click', e => { if (e.target === lb || e.target.classList.contains('lb-in')) closeLb(); });
  lb.addEventListener('keydown', e => {
    if (e.key === 'ArrowRight') show(li + 1);
    if (e.key === 'ArrowLeft') show(li - 1);
  });
  let sx = 0, sy = 0;
  lb.addEventListener('touchstart', e => { sx = e.touches[0].clientX; sy = e.touches[0].clientY; }, { passive: true });
  lb.addEventListener('touchend', e => {
    const dx = e.changedTouches[0].clientX - sx;
    const dy = e.changedTouches[0].clientY - sy;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.4) show(li + (dx < 0 ? 1 : -1));
  }, { passive: true });

  /* ---------- Formulario → WhatsApp con el mensaje preparado ---------- */
  const form = $('[data-form]');
  if (form) {
    const okBox = $('[data-ok]', form);
    const rules = {
      nombre: v => v.trim().length >= 2 || 'Dinos tu nombre para saber a quién contestar.',
      mensaje: v => v.trim().length >= 10 || 'Cuéntanos un poco la reforma: qué estancia y qué quieres cambiar.'
    };
    const errIds = { nombre: 'e-nombre', mensaje: 'e-msg' };
    const check = name => {
      const el = form.elements[name];
      const res = rules[name](el.value);
      const err = $(`#${errIds[name]}`);
      const bad = res !== true;
      err.textContent = bad ? res : '';
      el.closest('.field').classList.toggle('has-err', bad);
      el.setAttribute('aria-invalid', String(bad));
      return !bad;
    };
    Object.keys(rules).forEach(n => {
      const el = form.elements[n];
      el.addEventListener('blur', () => { if (el.value) check(n); });
      el.addEventListener('input', () => { if (el.closest('.field').classList.contains('has-err')) check(n); });
    });
    const priv = form.elements.privacidad;
    const privErr = $('#e-priv');
    priv.addEventListener('change', () => { if (priv.checked) privErr.textContent = ''; });

    form.addEventListener('submit', e => {
      e.preventDefault();
      const bad = Object.keys(rules).filter(n => !check(n));
      if (!priv.checked) { privErr.textContent = 'Necesitamos tu conformidad para poder contestarte.'; bad.push('privacidad'); }
      else privErr.textContent = '';
      if (bad.length) { form.elements[bad[0]].focus(); return; }

      const d = new FormData(form);
      const tipos = d.getAll('tipo');
      const text = [
        `Hola, soy ${d.get('nombre').trim()} y quería pedir presupuesto.`,
        tipos.length ? `Reforma: ${tipos.join(', ')}` : null,
        d.get('zona').trim() ? `Zona: ${d.get('zona').trim()}` : null,
        '',
        d.get('mensaje').trim()
      ].filter(v => v !== null).join('\n');

      window.open(waLink(text), '_blank', 'noopener');
      okBox.hidden = false;
      okBox.focus();
    });
  }

  /* ---------- Mapa diferido ---------- */
  const map = $('.map iframe');
  if (map) {
    const load = () => { if (map.dataset.src) { map.src = map.dataset.src; delete map.dataset.src; } };
    if ('IntersectionObserver' in window) {
      const mio = new IntersectionObserver(([e]) => { if (e.isIntersecting) { load(); mio.disconnect(); } }, { rootMargin: '400px' });
      mio.observe(map);
    } else load();
  }
})();
