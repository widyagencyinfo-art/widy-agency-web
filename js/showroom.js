/* ============================================================
   Widy · Showroom — presentación cinemática del Audi (foto)
   Inclinación 3D siguiendo el ratón + parallax al scroll +
   brillo de estudio + contadores de resultados.
   ============================================================ */
(function () {
  const stage = document.querySelector('.showroom-stage');
  const scene = document.getElementById('carScene');
  const img = document.getElementById('carImg');
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // --- Inclinación 3D siguiendo el cursor (efecto "en la mano") ---
  if (stage && scene && img && !reduce) {
    let tx = 0, ty = 0, cx = 0, cy = 0, raf = null;
    function loop() {
      cx += (tx - cx) * 0.09; cy += (ty - cy) * 0.09;
      img.style.transform =
        `perspective(1500px) rotateY(${cx * 7}deg) rotateX(${-cy * 4.5}deg) translate(${cx * -18}px, ${cy * -10}px) scale(1.03)`;
      if (Math.abs(tx - cx) > 0.0005 || Math.abs(ty - cy) > 0.0005) raf = requestAnimationFrame(loop);
      else raf = null;
    }
    function kick() { if (!raf) raf = requestAnimationFrame(loop); }
    stage.addEventListener('mousemove', (e) => {
      const r = stage.getBoundingClientRect();
      tx = (e.clientX - r.left) / r.width - 0.5;
      ty = (e.clientY - r.top) / r.height - 0.5;
      stage.style.setProperty('--gx', ((tx + 0.5) * 100).toFixed(1) + '%');
      stage.style.setProperty('--gy', ((ty + 0.5) * 100).toFixed(1) + '%');
      stage.classList.add('is-hover');
      kick();
    });
    stage.addEventListener('mouseleave', () => { tx = 0; ty = 0; stage.classList.remove('is-hover'); kick(); });
  }

  // --- Parallax sutil al hacer scroll ---
  if (scene && !reduce) {
    const sec = document.getElementById('resultados');
    let ticking = false;
    function apply() {
      const r = sec.getBoundingClientRect(); const vh = window.innerHeight;
      const p = Math.min(1, Math.max(0, (vh - r.top) / (vh + r.height))); // 0..1
      scene.style.setProperty('--sy', ((p - 0.5) * -34).toFixed(1) + 'px');
      ticking = false;
    }
    window.addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(apply); } }, { passive: true });
    apply();
  }

  // --- Contadores de resultados (cuenta al entrar en vista) ---
  const nums = document.querySelectorAll('.rnum[data-to]');
  if (nums.length && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(en => {
        if (!en.isIntersecting) return;
        const el = en.target;
        const to = parseFloat(el.dataset.to);
        const dec = parseInt(el.dataset.dec || '0', 10);
        const pre = el.dataset.prefix || '', suf = el.dataset.suffix || '';
        const finalTxt = pre + to.toFixed(dec) + suf;
        const dur = 1400, t0 = performance.now();
        function step(now) {
          const p = Math.min(1, (now - t0) / dur);
          const e = 1 - Math.pow(1 - p, 3);
          el.textContent = pre + (to * e).toFixed(dec) + suf;
          if (p < 1) requestAnimationFrame(step);
        }
        requestAnimationFrame(step);
        setTimeout(() => { el.textContent = finalTxt; }, dur + 500); // red de seguridad
        io.unobserve(el);
      });
    }, { threshold: 0.6 });
    nums.forEach(n => io.observe(n));
  }
})();
