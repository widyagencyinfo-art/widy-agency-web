/* =====================================================================
   Modo presentación: recorrido guiado que resalta lo que más vende.
   Navega solo por las pantallas y lanza el lead en directo.
   ===================================================================== */
(function(){
const App = window.App;
const {html, icon} = App;

let simId = null;
const STEPS = [
  {route: '#/inicio', sel: '[data-tour="kpis"]', title: 'Tu concesionario, de un vistazo', text: 'Leads, citas, ventas, margen y lo que tardáis en contestar a cada cliente. Se actualiza solo, sin rellenar nada.'},
  {route: '#/inicio', sel: '[data-tour="ia-resumen"]', title: 'Mientras dormías, la IA atendía', text: 'Los clientes que escribieron anoche tuvieron respuesta en segundos y hoy tienen su prueba de conducción en la agenda.'},
  {route: '#/inicio', sel: '[data-tour="atencion"]', title: 'Sabes qué hacer primero', text: 'Clientes que esperan a una persona, presupuestos vistos sin respuesta y coches que no se mueven. Un toque y estás en ello.'},
  {route: '#/inicio', sel: '[data-tour="sim"]', title: 'Ahora, un cliente en directo', text: 'Al pulsar «Siguiente» entra un lead de un portal. Mira cómo lo atiende la IA en tiempo real.', next: 'Lanzar lead', onNext: async () => { const p = App.sim.lead(); await App.sleep(350); simId = App.S.contacts[0] && App.S.contacts[0].id; p.catch(() => {}); }},
  {route: () => '#/whatsapp/' + (simId || 'c1'), sel: '[data-tour="wa-chat"]', title: 'Contesta en segundos, con datos reales', text: 'Precio, cuota con entrada y huecos libres de la agenda. Cuando el cliente elige hora, la prueba queda agendada y el comercial avisado. Nadie ha tocado el móvil.'},
  {route: '#/whatsapp/c2', sel: '[data-tour="wa-ia"]', title: 'Y cuando hace falta, te la pasa', text: 'Si el cliente pide descuento o quiere cerrar, la IA avisa al comercial. Con este interruptor la conversación la llevas tú.'},
  {route: '#/leads', sel: '[data-tour="pipeline"]', title: 'Cada cliente, en su etapa', text: 'De nuevo a vendido. Arrastras la tarjeta y queda registrado. Ningún cliente se queda sin seguimiento.'},
  {route: '#/leads/c4', sel: '[data-tour="ficha-timeline"]', title: 'Toda la historia del cliente', text: 'Mensajes, llamadas, prueba, tasación de su coche y presupuesto en una sola pantalla, con un resumen de la IA.'},
  {route: '#/stock', sel: '[data-tour="stock-list"]', title: 'El stock, vivo', text: 'Días en stock, margen, leads y visitas de cada coche. Los que no rotan saltan a la vista.'},
  {route: '#/portales', sel: '[data-tour="portales-matriz"]', title: 'Todos los portales con un clic', text: 'coches.net, Wallapop, Milanuncios, AutoScout24 y Marketplace desde aquí. Al vender un coche se retira de todos a la vez.'},
  {route: '#/presupuestos/nuevo?c=c4&v=58fde280', sel: '[data-tour="pres-preview"]', title: 'Presupuesto en PDF en un minuto', text: 'Con tu logo, el coche a cuenta descontado y la cuota. Se envía por WhatsApp y ves cuándo lo abre el cliente.'},
  {route: '#/agenda', sel: '[data-tour="agenda-cal"]', title: 'La agenda de todo el equipo', text: 'Pruebas, entregas, tasaciones y taller, sincronizada con Google Calendar y con recordatorios automáticos al cliente.'},
  {route: '#/financiacion', sel: '[data-tour="fin-board"]', title: 'Financiación sin perseguir papeles', text: 'La IA pide la documentación, la solicitud va a varias financieras a la vez y eliges la mejor cuota.'},
  {route: '#/informes', sel: '[data-tour="inf-respuesta"]', title: 'Sabes qué funciona', text: 'Ventas, margen, de dónde viene cada cliente y cuánto tardáis en contestar, mes a mes.'},
  {route: '#/automatizaciones', sel: '[data-tour="auto-list"]', title: 'Todo lo que hace solo', text: 'Recordatorios, seguimientos del «me lo pienso», reseñas en Google, avisos de bajada de precio… trabajo que ya no tiene que hacer nadie.'},
  {route: '#/inicio', sel: null, title: 'Tú vendes. Del resto se encarga el CRM.', text: 'Stock, portales, WhatsApp con IA, agenda, presupuestos, financiación e informes en un solo sitio, en el ordenador y en el móvil.', final: true}
];

let i = 0, active = false, spot, card, raf, lastRect = '';

const waitFor = async (sel, ms = 2500) => {
  const t0 = Date.now();
  while (Date.now() - t0 < ms) {
    const el = sel && document.querySelector(sel);
    if (el && el.getBoundingClientRect().width > 0) return el;
    await App.sleep(80);
  }
  return null;
};

function place(el) {
  if (!card || !spot) return;
  const vw = innerWidth, vh = innerHeight, m = innerWidth <= 900;
  const cw = card.offsetWidth, ch = card.offsetHeight;
  if (!el) {
    spot.style.cssText = `left:${vw / 2}px;top:${vh / 2}px;width:0;height:0;opacity:${0}`;
    card.style.left = Math.max(12, (vw - cw) / 2) + 'px'; card.style.top = Math.max(12, (vh - ch) / 2) + 'px';
    return;
  }
  const r = el.getBoundingClientRect(), pad = 8;
  const x = Math.max(4, r.left - pad), y = Math.max(4, r.top - pad);
  const w = Math.min(vw - x - 4, r.width + pad * 2), h = Math.min(vh - y - 4, r.height + pad * 2);
  spot.style.cssText = `left:${x}px;top:${y}px;width:${w}px;height:${h}px;opacity:1`;
  let left, top;
  if (m) { left = 12; top = r.top > vh / 2 ? 12 : vh - ch - 84; }
  else if (vw - (x + w) > cw + 24) { left = x + w + 16; top = App.clamp(r.top, 16, vh - ch - 16); }
  else if (x > cw + 24) { left = x - cw - 16; top = App.clamp(r.top, 16, vh - ch - 16); }
  else if (vh - (y + h) > ch + 24) { top = y + h + 14; left = App.clamp(r.left, 16, vw - cw - 16); }
  else if (y > ch + 24) { top = y - ch - 14; left = App.clamp(r.left, 16, vw - cw - 16); }
  else { left = vw - cw - 24; top = vh - ch - 24; }
  card.style.left = left + 'px'; card.style.top = top + 'px';
}

function loop() {
  if (!active || !card) return;
  const s = STEPS[i]; const el = s.sel && document.querySelector(s.sel);
  const r = el ? el.getBoundingClientRect() : null;
  const key = r ? [r.left, r.top, r.width, r.height].map(Math.round).join() : 'none';
  if (key !== lastRect) { lastRect = key; place(el); }
  raf = requestAnimationFrame(loop);
}

function drawCard() {
  const s = STEPS[i];
  card.innerHTML = App.str(html`
    <div class="between"><span class="tour-card__step">${s.final ? 'Fin de la presentación' : `${i + 1} de ${STEPS.length - 1}`}</span><button class="icon-btn" data-t="stop" aria-label="Salir" style="width:30px;height:30px">${icon('x', 16)}</button></div>
    <h3>${s.title}</h3><p>${s.text}</p>
    <div class="tour-card__foot">
      <div class="tour-card__dots">${STEPS.slice(0, -1).map((_, k) => html`<i class="${k === i ? 'is-on' : ''}"></i>`)}</div>
      ${s.final
        ? html`<button class="btn btn--sm" data-t="restart">${icon('rotate-ccw', 14)}Ver otra vez</button><button class="btn btn--sm btn--primary" data-t="stop">Terminar</button>`
        : html`${i > 0 ? html`<button class="btn btn--sm btn--ghost" data-t="prev">Anterior</button>` : ''}<button class="btn btn--sm btn--primary" data-t="next">${s.next || 'Siguiente'}${icon('arrow-right', 14)}</button>`}
    </div>`);
}

async function go(n) {
  if (n < 0 || n >= STEPS.length) return;
  const prev = STEPS[i];
  if (n > i && prev && prev.onNext) { try { await prev.onNext(); } catch (e) { console.error(e); } }
  i = n;
  const s = STEPS[i];
  App.closeAll();
  const route = typeof s.route === 'function' ? s.route() : s.route;
  card.classList.add('fade-in');
  if (location.hash !== route) { location.hash = route; await App.sleep(120); }
  drawCard();
  const el = await waitFor(s.sel);
  if (el) {
    const r = el.getBoundingClientRect();
    if (r.top < 70 || r.bottom > innerHeight - 20) { el.scrollIntoView({block: r.height > innerHeight * .7 ? 'start' : 'center', behavior: 'smooth'}); await App.sleep(450); }
  }
  lastRect = ''; place(el);
}

function key(e) {
  if (!active) return;
  if (e.target.closest && e.target.closest('input,textarea,select')) return;
  if (e.key === 'Escape') { e.preventDefault(); App.tour.stop(); }
  else if (e.key === 'ArrowRight' || e.key === 'Enter') { e.preventDefault(); if (!STEPS[i].final) go(i + 1); }
  else if (e.key === 'ArrowLeft') { e.preventDefault(); go(i - 1); }
}

App.tour = {
  steps: STEPS,
  get active() { return active; },
  start(from = 0) {
    if (active) this.stop();
    active = true; i = from; simId = null;
    spot = App.el('<div class="tour-spot"></div>');
    card = App.el('<div class="tour-card" role="dialog" aria-live="polite"></div>');
    document.body.append(spot, card);
    card.addEventListener('click', e => {
      const b = e.target.closest('[data-t]'); if (!b) return;
      const t = b.dataset.t;
      if (t === 'next') go(i + 1); else if (t === 'prev') go(i - 1); else if (t === 'stop') App.tour.stop(); else if (t === 'restart') go(0);
    });
    document.addEventListener('keydown', key, true);
    go(from);
    raf = requestAnimationFrame(loop);
  },
  stop() {
    active = false; cancelAnimationFrame(raf);
    spot && spot.remove(); card && card.remove(); spot = card = null;
    document.removeEventListener('keydown', key, true);
  }
};
})();
