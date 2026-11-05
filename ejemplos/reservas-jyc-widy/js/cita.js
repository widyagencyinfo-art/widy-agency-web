/* Widy · el cliente ve su cita y puede anularla */
(function () {
  'use strict';
  var M = window.Motor;
  var q = new URLSearchParams(location.search), c = q.get('c'), t = q.get('t');
  var caja = document.getElementById('caja');
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (x) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[x]; }); };

  function toast(msg) {
    var el = document.getElementById('toast');
    el.textContent = msg; el.className = 'toast show warn';
    setTimeout(function () { el.className = 'toast'; }, 4200);
  }
  function telDe(n) { return '+' + (String(n.phone).length === 9 ? '34' : '') + n.phone; }

  /* si está anulada, deja de recordársela en la página de reservar */
  function olvidar(id) {
    try {
      Object.keys(localStorage).forEach(function (k) {
        if (k.indexOf('widy:citas:') !== 0) return;
        var l = JSON.parse(localStorage.getItem(k) || '[]').filter(function (x) { return x.c !== id; });
        localStorage.setItem(k, JSON.stringify(l));
      });
    } catch (e) {}
  }

  function pintar(ci) {
    var n = ci.negocio, anulada = ci.status === 'cancelada';
    if (anulada) olvidar(ci.id);
    document.title = 'Tu cita · ' + n.name;
    caja.innerHTML =
      '<div class="check"' + (anulada ? ' style="background:var(--surface2);color:var(--muted)"' : '') + '>' +
      (anulada ? '✕' : '<svg viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg>') + '</div>' +
      '<h2 style="text-align:center">' + (anulada ? 'Cita anulada' : ci.pasada ? 'Esta cita ya pasó' : 'Tu cita en ' + esc(n.name)) + '</h2>' +
      '<p class="sub" style="text-align:center">' + (anulada ? 'El hueco ha quedado libre. Cuando quieras, reservas otra.' : 'Hola, ' + esc(ci.name) + '. Estos son los datos de tu cita.') + '</p>' +
      '<div class="recap" style="margin-top:16px">' +
      '<div class="r-row"><span>Servicio</span><b>' + esc(ci.nombres || 'Cita') + '</b></div>' +
      '<div class="r-row"><span>Fecha</span><b>' + esc(M.fmtDate(ci.date)) + '</b></div>' +
      '<div class="r-row"><span>Hora</span><b>' + esc(ci.time) + ' · ' + esc(M.dur(ci.dur)) + '</b></div>' +
      (ci.staff ? '<div class="r-row"><span>Te atiende</span><b>' + esc(ci.staff) + '</b></div>' : '') +
      '<div class="r-row"><span>Dónde</span><b>' + esc(n.address) + '</b></div></div>' +
      '<div class="done-acts">' +
      (!anulada && !ci.pasada ? '<a class="done-act prim" href="/ejemplos/reservas-jyc-widy/api/reserva?c=' + encodeURIComponent(c) + '&t=' + encodeURIComponent(t) + '&ics=1">📅 Añadir a mi calendario <small>con aviso el día antes</small></a>' : '') +
      (n.phone ? '<a class="done-act" href="tel:' + telDe(n) + '">📞 Llamar a la peluquería</a>' : '') +
      (n.whatsapp ? '<a class="done-act wa" target="_blank" rel="noopener" href="https://wa.me/' + esc(n.whatsapp) + '?text=' +
        encodeURIComponent('Hola, soy ' + ci.name + '. Sobre mi cita del ' + M.fmtDateShort(ci.date) + ' a las ' + ci.time + ':') + '">💬 Escribir por WhatsApp</a>' : '') +
      (anulada || ci.pasada ? '<a class="done-act prim" href="/ejemplos/reservas-jyc-widy/reservar">Reservar otra cita</a>' : '') +
      '</div>' +
      (!anulada && !ci.pasada ? '<button type="button" id="anular" class="done-anular">No puedo ir: anular la cita</button>' : '');
    var b = document.getElementById('anular');
    if (b) b.onclick = function () {
      if (!confirm('¿Seguro que quieres anular tu cita del ' + M.fmtDateShort(ci.date) + ' a las ' + ci.time + '?')) return;
      b.disabled = true; b.textContent = 'Anulando…';
      fetch('/ejemplos/reservas-jyc-widy/api/reserva', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ accion: 'anular', c: c, t: t }) })
        .then(function (r) { return r.json().then(function (j) { if (!r.ok) throw new Error(j.error); return j; }); })
        .then(function (j) { pintar(j.cita); })
        .catch(function (e) { b.disabled = false; b.textContent = 'No puedo ir: anular la cita'; toast(e.message || 'No se pudo anular. Llama a la peluquería.'); });
    };
  }

  if (!c || !t) { caja.innerHTML = '<h2>Enlace incompleto</h2><p class="sub">Abre el enlace completo que te dimos al reservar.</p>'; return; }
  fetch('/ejemplos/reservas-jyc-widy/api/reserva?c=' + encodeURIComponent(c) + '&t=' + encodeURIComponent(t), { cache: 'no-store' })
    .then(function (r) { return r.json().then(function (j) { if (!r.ok) throw new Error(j.error); return j; }); })
    .then(function (j) { pintar(j.cita); })
    .catch(function (e) { caja.innerHTML = '<h2>No encontramos la cita</h2><p class="sub">' + esc(e.message || 'Revisa el enlace.') + '</p>'; });
})();
