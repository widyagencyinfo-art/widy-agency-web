/* Newsletter de Widy (15-oct-2026): ventana emergente al entrar en la web.
   - 16-oct (Darío): «a los 2 segundos» y «en el medio, ventana emergente y que tengas que quitarla».
     Sale a los 2 s centrada, con el fondo oscurecido y la página bloqueada: solo se quita con la X
     (o con Esc). Clic fuera NO la cierra.
   - Si la cierras no vuelve en 14 días; si te apuntas, no vuelve nunca (se guarda en este navegador).
   - El correo va a /api/newsletter (tabla `suscriptores` del Widy Panel, tienda «widy»). */
(function () {
  var CLAVE = 'widy-newsletter';
  var DIAS = 14;
  function lee() { try { return localStorage.getItem(CLAVE); } catch (e) { return null; } }
  function guarda(v) { try { localStorage.setItem(CLAVE, v); } catch (e) {} }

  var estado = lee();
  if (estado === 'dentro') return;
  if (estado && /^\d+$/.test(estado) && Date.now() - Number(estado) < DIAS * 864e5) return;
  if (/[?&]nonl\b/.test(location.search)) return;

  var abierta = false;
  var flecha = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14"/><path d="m13 6 6 6-6 6"/></svg>';

  function abre() {
    if (abierta || document.querySelector('dialog[open], .drawer:not([hidden])')) return;
    abierta = true;
    quitaDisparadores();
    if (!document.querySelector('link[href="/css/newsletter.css"]')) {
      var l = document.createElement('link'); l.rel = 'stylesheet'; l.href = '/css/newsletter.css';
      l.onload = monta; document.head.appendChild(l);
    } else { monta(); }
  }

  function monta() {
    var ov = document.createElement('div');
    ov.className = 'nl-ov';
    ov.innerHTML =
      '<div class="nl" role="dialog" aria-modal="true" aria-labelledby="nl-t" tabindex="-1">' +
        '<div class="nl-top">' +
          '<button type="button" class="nl-x" aria-label="Cerrar"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg></button>' +
          '<p class="nl-k">la newsletter de Widy</p>' +
          '<h2 class="nl-t" id="nl-t">Ideas para que tu negocio <em>venda más</em> <span class="nl-m">en internet.</span></h2>' +
        '</div>' +
        '<div class="nl-b">' +
          '<p class="nl-p">Un correo al mes con lo que nos funciona en webs, Google, Instagram e IA. Gratis y sin spam.</p>' +
          '<form class="nl-f" novalidate>' +
            '<label class="nl-hp" aria-hidden="true">Web <input type="text" name="web" tabindex="-1" autocomplete="off"></label>' +
            '<input class="nl-in" type="email" name="email" placeholder="tu@correo.com" autocomplete="email" inputmode="email" required aria-label="Tu correo electrónico">' +
            '<label class="nl-ok"><input type="checkbox" name="acepto" required><span>Acepto la <a href="/privacidad" target="_blank" rel="noopener">política de privacidad</a>.</span></label>' +
            '<p class="nl-err" role="alert" aria-live="polite"></p>' +
            '<button type="submit" class="nl-go">Apuntarme ' + flecha + '</button>' +
          '</form>' +
          '<div class="nl-done" aria-live="polite">' +
            '<span class="nl-done-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg></span>' +
            '<strong>¡Ya estás dentro!</strong>' +
            '<p>Te llegará el próximo correo de Widy. Mientras, ¿te enseñamos gratis cómo quedaría tu web?</p>' +
            '<a href="/#boceto" class="nl-cta">Pedir mi boceto gratis ' + flecha + '</a>' +
          '</div>' +
        '</div>' +
      '</div>';
    document.body.appendChild(ov);
    var caja = ov.querySelector('.nl'), form = ov.querySelector('form'), err = ov.querySelector('.nl-err');
    var correo = form.elements.email, boton = form.querySelector('.nl-go');

    var antes = document.activeElement;
    var html = document.documentElement, overflowAntes = html.style.overflow;
    html.style.overflow = 'hidden';   // la página de detrás no se mueve hasta que se quite
    function cierra(apuntado) {
      if (!apuntado) guarda(String(Date.now()));
      ov.classList.remove('on');
      document.body.classList.remove('nl-abierta');
      document.removeEventListener('keydown', teclas);
      html.style.overflow = overflowAntes;
      setTimeout(function () { ov.remove(); if (antes && antes.focus) antes.focus({ preventScroll: true }); }, 300);
    }
    function teclas(ev) {
      if (ev.key === 'Escape') { cierra(caja.classList.contains('is-done')); return; }
      if (ev.key === 'Tab') {   // el foco no se sale de la ventana
        var f = Array.prototype.filter.call(caja.querySelectorAll('button, input:not([tabindex="-1"]), a[href]'), function (x) { return x.offsetParent !== null; });
        if (!f.length) return;
        if (ev.shiftKey && document.activeElement === f[0]) { ev.preventDefault(); f[f.length - 1].focus(); }
        else if (!ev.shiftKey && document.activeElement === f[f.length - 1]) { ev.preventDefault(); f[0].focus(); }
      }
    }
    document.addEventListener('keydown', teclas);
    ov.querySelector('.nl-x').addEventListener('click', function () { cierra(caja.classList.contains('is-done')); });
    ov.querySelector('.nl-cta').addEventListener('click', function () { cierra(true); });

    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      err.textContent = '';
      var email = correo.value.trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) { err.textContent = 'Escribe un correo válido.'; correo.focus(); return; }
      if (!form.elements.acepto.checked) { err.textContent = 'Marca la casilla de la política de privacidad.'; return; }
      boton.disabled = true;
      fetch('https://widy-api.widyagency-info.workers.dev/api/newsletter', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email, acepto: true, pagina: location.pathname, web: form.elements.web.value })
      }).then(function (r) { return r.json().catch(function () { return {}; }).then(function (d) { return { ok: r.ok && d.ok, d: d }; }); })
        .then(function (x) {
          if (!x.ok) throw new Error(x.d.error || 'No hemos podido apuntarte. Inténtalo de nuevo.');
          guarda('dentro');
          caja.classList.add('is-done');
          setTimeout(function () { if (document.body.contains(ov)) cierra(true); }, 9000);
        })
        .catch(function (e) { err.textContent = e.message || 'No hemos podido apuntarte. Inténtalo de nuevo.'; })
        .then(function () { boton.disabled = false; });
    });

    requestAnimationFrame(function () {
      ov.classList.add('on'); document.body.classList.add('nl-abierta');
      // en el móvil no se enfoca el campo: si no, sale el teclado nada más abrir
      (matchMedia('(min-width: 641px)').matches ? correo : caja).focus({ preventScroll: true });
    });
  }

  var reloj = setTimeout(abre, 2000);
  function quitaDisparadores() { clearTimeout(reloj); }
})();
