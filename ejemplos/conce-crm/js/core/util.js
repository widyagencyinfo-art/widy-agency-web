/* =====================================================================
   Utilidades comunes: plantillas seguras, formatos, fechas, iconos,
   toasts, modales, drawers, menús y gráficas SVG.
   Todo cuelga de window.App.
   ===================================================================== */
(function(){
const App = window.App = window.App || {};
App.views = App.views || {};
App.actions = App.actions || {};
App.modals = App.modals || {};

/* ---------- HTML seguro ----------
   html`<b>${nombre}</b>` escapa los valores; raw(str) marca HTML ya seguro.
   Los arrays se concatenan (útil para .map()). null/undefined/false → ''. */
class Safe { constructor(s){ this.s = s; } toString(){ return this.s; } }
const ESC = {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'};
const esc = v => String(v).replace(/[&<>"']/g, c => ESC[c]);
const val = v => v == null || v === false ? '' : v instanceof Safe ? v.s : Array.isArray(v) ? v.map(val).join('') : esc(v);
App.html = (strings, ...vals) => new Safe(strings.reduce((o, s, i) => o + s + (i < vals.length ? val(vals[i]) : ''), ''));
App.raw = s => new Safe(s == null ? '' : String(s));
App.esc = esc;
App.str = v => val(v);   // Safe|array → string

/* ---------- números ---------- */
const nf0 = new Intl.NumberFormat('es-ES', {maximumFractionDigits:0});
const nf1 = new Intl.NumberFormat('es-ES', {maximumFractionDigits:1});
const nf2 = new Intl.NumberFormat('es-ES', {minimumFractionDigits:2, maximumFractionDigits:2});
// Intl es-ES no agrupa 4 cifras (1500 → "1500"); forzamos el punto de miles.
const miles = s => s.replace(/^(-?)(\d{1,3})(\d{3})(?=,|$)/, '$1$2.$3');
App.num = n => miles(nf0.format(Math.round(n || 0)));
App.num1 = n => miles(nf1.format(n || 0));
App.dec = (n, d = 2) => miles(new Intl.NumberFormat('es-ES', {maximumFractionDigits:d}).format(n || 0));
App.eur = n => App.num(n) + ' €';
App.eur2 = n => miles(nf2.format(n || 0)) + ' €';
App.km = n => App.num(n) + ' km';
App.pct = (n, d=0) => (d ? nf1.format(n) : nf0.format(n)) + ' %';
App.k = n => Math.abs(n) >= 1000 ? miles(nf1.format(n/1000)) + ' k' : App.num(n);
App.clamp = (n, a, b) => Math.max(a, Math.min(b, n));
// Cuota de préstamo francés
App.cuota = (capital, tinAnual, meses) => {
  if (capital <= 0 || !meses) return 0;
  const r = tinAnual / 100 / 12;
  if (!r) return capital / meses;
  return capital * r / (1 - Math.pow(1 + r, -meses));
};

/* ---------- fechas (todo relativo a HOY, para que la demo esté siempre fresca) ---------- */
const DAY = 864e5;
App.now = () => new Date();
App.today = () => { const d = new Date(); d.setHours(0,0,0,0); return d; };
App.addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
App.addMin = (d, n) => new Date(new Date(d).getTime() + n * 6e4);
App.at = (dayOffset, h = 10, m = 0) => { const d = App.addDays(App.today(), dayOffset); d.setHours(h, m, 0, 0); return d.toISOString(); };
App.ago = (min) => new Date(Date.now() - min * 6e4).toISOString();
App.sameDay = (a, b) => { a = new Date(a); b = new Date(b); return a.getFullYear()===b.getFullYear() && a.getMonth()===b.getMonth() && a.getDate()===b.getDate(); };
App.isToday = d => App.sameDay(d, new Date());
App.daysBetween = (a, b) => Math.round((new Date(b).setHours(0,0,0,0) - new Date(a).setHours(0,0,0,0)) / DAY);
App.daysSince = d => App.daysBetween(d, new Date());
App.startOfWeek = d => { const x = new Date(d); x.setHours(0,0,0,0); const wd = (x.getDay() + 6) % 7; x.setDate(x.getDate() - wd); return x; };
App.startOfMonth = d => { const x = new Date(d); x.setHours(0,0,0,0); x.setDate(1); return x; };
const DIAS = ['domingo','lunes','martes','miércoles','jueves','viernes','sábado'];
const DIAS_C = ['dom','lun','mar','mié','jue','vie','sáb'];
const MESES = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
const MESES_C = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
App.DIAS = DIAS; App.DIAS_C = DIAS_C; App.MESES = MESES; App.MESES_C = MESES_C;
const p2 = n => String(n).padStart(2, '0');
App.hora = d => { d = new Date(d); return p2(d.getHours()) + ':' + p2(d.getMinutes()); };
App.fecha = d => { d = new Date(d); return d.getDate() + ' ' + MESES_C[d.getMonth()] + (d.getFullYear() !== new Date().getFullYear() ? ' ' + d.getFullYear() : ''); };
App.fechaLarga = d => { d = new Date(d); return DIAS[d.getDay()] + ' ' + d.getDate() + ' de ' + MESES[d.getMonth()]; };
App.fechaNum = d => { d = new Date(d); return p2(d.getDate()) + '/' + p2(d.getMonth()+1) + '/' + d.getFullYear(); };
App.fechaHora = d => App.fecha(d) + ', ' + App.hora(d);
App.cap = s => s ? s.charAt(0).toUpperCase() + s.slice(1) : '';
// "hace 3 min", "hace 2 h", "ayer 18:30", "lun 14:00", "12 sep"
App.rel = d => {
  d = new Date(d); const diff = (Date.now() - d.getTime()) / 6e4;
  if (diff < 0) return App.relFuture(d);
  if (diff < 1) return 'ahora';
  if (diff < 60) return 'hace ' + Math.floor(diff) + ' min';
  if (App.isToday(d)) return 'hace ' + Math.floor(diff / 60) + ' h';
  const days = App.daysSince(d);
  if (days === 1) return 'ayer ' + App.hora(d);
  if (days < 7) return DIAS_C[d.getDay()] + ' ' + App.hora(d);
  return App.fecha(d);
};
App.relFuture = d => {
  d = new Date(d); const days = App.daysBetween(new Date(), d);
  if (days === 0) { const m = (d - Date.now()) / 6e4; return m < 60 ? 'en ' + Math.max(1, Math.round(m)) + ' min' : 'hoy ' + App.hora(d); }
  if (days === 1) return 'mañana ' + App.hora(d);
  if (days < 7) return DIAS_C[d.getDay()] + ' ' + App.hora(d);
  return App.fecha(d);
};
App.diaRel = d => { const n = App.daysBetween(new Date(), d); return n === 0 ? 'Hoy' : n === 1 ? 'Mañana' : n === -1 ? 'Ayer' : App.cap(App.fechaLarga(d)); };
App.saludo = () => { const h = new Date().getHours(); return h < 14 ? 'Buenos días' : h < 21 ? 'Buenas tardes' : 'Buenas noches'; };

/* ---------- varios ---------- */
App.uid = (p = 'id') => p + '_' + Math.random().toString(36).slice(2, 9);
App.debounce = (fn, ms = 200) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };
App.initials = n => (n || '?').split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase();
App.norm = s => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
App.pick = (arr, seed) => arr[Math.abs(seed) % arr.length];
App.sum = (arr, f = x => x) => arr.reduce((a, x) => a + (+f(x) || 0), 0);
App.groupBy = (arr, f) => arr.reduce((o, x) => { const k = f(x); (o[k] = o[k] || []).push(x); return o; }, {});
App.telFmt = t => String(t || '').replace(/\D/g, '').replace(/^34/, '').replace(/(\d{3})(\d{2})(\d{2})(\d{2})/, '$1 $2 $3 $4');
App.sleep = ms => new Promise(r => setTimeout(r, ms));
App.parseQuery = q => Object.fromEntries(new URLSearchParams(q || ''));

/* ---------- iconos ---------- */
App.icon = (name, size = 18, cls = '') => {
  const p = (window.ICONS || {})[name];
  if (!p) return App.raw('');
  return App.raw(`<svg class="i ${cls}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`);
};

/* ---------- avatar ---------- */
const AV_COLORS = ['#1A56DB','#0E9F6E','#D97706','#7E3AF2','#0891B2','#DB2777','#E02424','#4B5563','#047857','#9333EA','#B45309','#0369A1'];
App.avColor = name => { let h = 0; for (const c of String(name)) h = (h * 31 + c.charCodeAt(0)) >>> 0; return AV_COLORS[h % AV_COLORS.length]; };
App.avatar = (name, {size = '', color, wa = false, cls = ''} = {}) =>
  App.html`<span class="av ${size ? 'av--' + size : ''} ${cls}" style="--c:${color || App.avColor(name)}" title="${name}">${App.initials(name)}${wa ? App.raw('<i class="av__wa"></i>') : ''}</span>`;
App.badge = (text, variant = '', icon) => App.html`<span class="badge ${variant ? 'badge--' + variant : ''}">${icon ? App.icon(icon, 13) : ''}${text}</span>`;

/* ---------- DOM ---------- */
App.$ = (sel, root = document) => root.querySelector(sel);
App.$$ = (sel, root = document) => [...root.querySelectorAll(sel)];
App.el = (htmlStr) => { const t = document.createElement('template'); t.innerHTML = String(htmlStr).trim(); return t.content.firstElementChild; };

/* ---------- toasts ---------- */
App.toast = (title, {sub = '', tipo = 'ok', icon, accion, onAccion, ms = 4200} = {}) => {
  let wrap = App.$('.toasts'); if (!wrap) { wrap = App.el('<div class="toasts"></div>'); document.body.appendChild(wrap); }
  const ico = icon || ({ok:'check', wa:'message-circle', lead:'zap', warn:'alert-triangle', info:'info'}[tipo] || 'check');
  const t = App.el(App.str(App.html`<div class="toast toast--${tipo}" role="status"><div class="toast__ico">${App.icon(ico, 14)}</div><div class="toast__txt"><b>${title}</b>${sub ? App.html`<span>${sub}</span>` : ''}</div>${accion ? App.html`<button class="toast__act">${accion}</button>` : ''}</div>`));
  wrap.appendChild(t);
  const close = () => { t.classList.add('is-out'); setTimeout(() => t.remove(), 250); };
  if (accion) t.querySelector('.toast__act').onclick = () => { close(); onAccion && onAccion(); };
  setTimeout(close, ms);
  return close;
};

/* ---------- capas (modal / drawer) ---------- */
const layers = [];
function openLayer(node, {onClose} = {}) {
  const ov = App.el('<div class="overlay"></div>');
  document.body.append(ov, node);
  requestAnimationFrame(() => { ov.classList.add('is-in'); node.classList.add('is-in'); });
  const layer = {node, ov, onClose};
  const close = () => {
    const i = layers.indexOf(layer); if (i < 0) return; layers.splice(i, 1);
    ov.classList.remove('is-in'); node.classList.remove('is-in');
    setTimeout(() => { ov.remove(); node.remove(); }, 260);
    onClose && onClose();
  };
  layer.close = close;
  ov.addEventListener('click', close);
  node.addEventListener('click', e => { const c = e.target.closest('[data-close]'); if (c) { e.preventDefault(); close(); } });
  layers.push(layer);
  return close;
}
App.closeTop = () => { const l = layers[layers.length - 1]; if (l) { l.close(); return true; } return false; };
App.closeAll = () => { while (layers.length) layers[layers.length - 1].close(); };
document.addEventListener('keydown', e => { if (e.key === 'Escape' && !document.querySelector('.cmdk') && !document.querySelector('.tour-card')) App.closeTop(); });

/* App.modal({title, sub, body, foot, size:'sm|lg|xl', onMount(node, close), onClose})
   body/foot: Safe HTML (App.html). Botón con data-close cierra. Devuelve {node, close}. */
App.modal = ({title = '', sub = '', body = '', foot = '', size = '', onMount, onClose, cls = ''} = {}) => {
  const node = App.el(App.str(App.html`<div class="modal ${size ? 'modal--' + size : ''} ${cls}" role="dialog" aria-modal="true">
    ${title ? App.html`<div class="modal__head"><div><h2>${title}</h2>${sub ? App.html`<p>${sub}</p>` : ''}</div><button class="icon-btn" data-close aria-label="Cerrar">${App.icon('x', 18)}</button></div>` : ''}
    <div class="modal__body">${body}</div>
    ${foot ? App.html`<div class="modal__foot">${foot}</div>` : ''}
  </div>`));
  const close = openLayer(node, {onClose});
  App.bindActs(node);
  onMount && onMount(node, close);
  setTimeout(() => { const f = node.querySelector('[autofocus]'); f && f.focus(); }, 60);
  return {node, close};
};
App.drawer = ({title = '', head = '', body = '', foot = '', width = 520, onMount, onClose} = {}) => {
  const node = App.el(App.str(App.html`<aside class="drawer" style="--dw:${width}px" role="dialog">
    <div class="drawer__head">${head || App.html`<h2>${title}</h2>`}<button class="icon-btn" data-close aria-label="Cerrar">${App.icon('x', 18)}</button></div>
    <div class="drawer__body">${body}</div>
    ${foot ? App.html`<div class="drawer__foot">${foot}</div>` : ''}
  </aside>`));
  const close = openLayer(node, {onClose});
  App.bindActs(node);
  onMount && onMount(node, close);
  return {node, close};
};
App.confirm = ({title = '¿Seguro?', text = '', ok = 'Confirmar', danger = false} = {}) => new Promise(res => {
  let done = false;
  const {close} = App.modal({size:'sm', title, body: App.html`<p class="muted">${text}</p>`,
    foot: App.html`<button class="btn" data-close>Cancelar</button><button class="btn ${danger ? 'btn--danger' : 'btn--primary'}" data-ok>${ok}</button>`,
    onMount: (n, c) => n.querySelector('[data-ok]').onclick = () => { done = true; c(); res(true); },
    onClose: () => { if (!done) res(false); }});
});

/* App.menu(anchorEl, [{label, icon, onClick, danger, sep, header, kbd}]) */
let openMenu = null;
App.menu = (anchor, items, {align = 'left'} = {}) => {
  if (openMenu) openMenu();
  const node = App.el(App.str(App.html`<div class="menu" role="menu">${items.map((it, i) =>
    it.sep ? App.raw('<div class="menu__sep"></div>') :
    it.header ? App.html`<div class="menu__label">${it.header}</div>` :
    App.html`<button class="menu__item ${it.danger ? 'menu__item--danger' : ''}" data-i="${i}">${it.icon ? App.icon(it.icon, 16) : ''}${it.label}${it.kbd ? App.html`<small>${it.kbd}</small>` : ''}</button>`)}</div>`));
  document.body.appendChild(node);
  const r = anchor.getBoundingClientRect(), mw = node.offsetWidth, mh = node.offsetHeight;
  let left = align === 'right' ? r.right - mw : r.left;
  left = App.clamp(left, 8, innerWidth - mw - 8);
  let top = r.bottom + 6; if (top + mh > innerHeight - 8) top = Math.max(8, r.top - mh - 6);
  Object.assign(node.style, {left: left + 'px', top: top + 'px'});
  requestAnimationFrame(() => node.classList.add('is-in'));
  const close = () => { node.remove(); document.removeEventListener('pointerdown', outside, true); openMenu = null; };
  const outside = e => { if (!node.contains(e.target) && !anchor.contains(e.target)) close(); };
  setTimeout(() => document.addEventListener('pointerdown', outside, true));
  node.addEventListener('click', e => { const b = e.target.closest('[data-i]'); if (!b) return; const it = items[+b.dataset.i]; close(); it.onClick && it.onClick(); });
  openMenu = close;
  return close;
};

/* ---------- delegación de acciones ----------
   <button data-act="nombre" data-id="...">  →  App.actions.nombre(el, event)
   Las vistas pueden declarar view.actions = {nombre(el, ev){}} (tienen prioridad). */
App.runAct = (el, ev) => {
  const name = el.dataset.act;
  const view = App.currentView;
  const fn = (view && view.actions && view.actions[name]) || App.actions[name];
  if (fn) { ev && ev.preventDefault(); fn.call(view, el, ev); return true; }
  console.warn('Acción sin definir:', name);
  return false;
};
App.bindActs = root => {
  if (root.__acts) return; root.__acts = true;
  root.addEventListener('click', e => {
    if (e.__act) return;
    const el = e.target.closest('[data-act]');
    if (!el || !root.contains(el) || el.matches('input,select,textarea')) return;
    e.__act = true;
    App.runAct(el, e);
  });
  root.addEventListener('change', e => { if (e.__act) return; const el = e.target.closest('[data-act-change]'); if (el) { e.__act = true; const fn = (App.currentView?.actions || {})[el.dataset.actChange] || App.actions[el.dataset.actChange]; fn && fn.call(App.currentView, el, e); } });
  root.addEventListener('input', e => { if (e.__act) return; const el = e.target.closest('[data-act-input]'); if (el) { e.__act = true; const fn = (App.currentView?.actions || {})[el.dataset.actInput] || App.actions[el.dataset.actInput]; fn && fn.call(App.currentView, el, e); } });
};

/* ---------- gráficas SVG ---------- */
const tip = () => { let t = App.$('.chart-tip'); if (!t) { t = App.el('<div class="chart-tip"></div>'); document.body.appendChild(t); } return t; };
document.addEventListener('pointerover', e => {
  const el = e.target.closest('[data-tip]'); const t = tip();
  if (!el) { t.classList.remove('is-in'); return; }
  t.innerHTML = el.dataset.tip; const r = el.getBoundingClientRect();
  t.style.left = (r.left + r.width / 2) + 'px'; t.style.top = r.top + 'px'; t.classList.add('is-in');
});
const niceMax = v => { if (v <= 0) return 1; const e = Math.pow(10, Math.floor(Math.log10(v))); const f = v / e; return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10) * e; };
App.chart = {
  /* barras: data=[{label, value, color?, tip?}] o apiladas: data=[{label, parts:[{value,color,name}]}] */
  bars(data, {h = 220, color = 'var(--accent)', fmt = App.num, gap = .36, yTicks = 4, showValues = false, radius = 5} = {}) {
    const W = 600, padL = 40, padB = 26, padT = 10, iw = W - padL - 6, ih = h - padB - padT;
    const tot = d => d.parts ? App.sum(d.parts, p => p.value) : d.value;
    const max = niceMax(Math.max(...data.map(tot), 1));
    const bw = iw / data.length;
    let s = `<svg class="chart" viewBox="0 0 ${W} ${h}" preserveAspectRatio="none" style="height:${h}px">`;
    for (let i = 0; i <= yTicks; i++) { const y = padT + ih - ih * i / yTicks; s += `<line class="grid" x1="${padL}" x2="${W}" y1="${y}" y2="${y}"/><text x="${padL - 8}" y="${y + 4}" text-anchor="end">${esc(App.k(max * i / yTicks))}</text>`; }
    data.forEach((d, i) => {
      const x = padL + i * bw + bw * gap / 2, w = bw * (1 - gap);
      let y0 = padT + ih;
      const parts = d.parts || [{value: d.value, color: d.color || color, name: ''}];
      parts.forEach((p, j) => {
        const bh = ih * p.value / max; y0 -= bh;
        const isTop = j === parts.length - 1, r = isTop ? Math.min(radius, w / 2, bh) : 0;
        const tipTxt = d.tip || `<b>${esc(d.label)}</b> · ${esc((p.name ? p.name + ': ' : '') + fmt(p.value))}`;
        s += r > 0
          ? `<path class="bar" data-tip="${esc(tipTxt)}" fill="${p.color}" d="M${x},${y0 + bh}V${y0 + r}Q${x},${y0} ${x + r},${y0}H${x + w - r}Q${x + w},${y0} ${x + w},${y0 + r}V${y0 + bh}Z"/>`
          : `<rect class="bar" data-tip="${esc(tipTxt)}" fill="${p.color}" x="${x}" y="${y0}" width="${w}" height="${Math.max(bh, 0)}"/>`;
      });
      if (showValues) s += `<text x="${x + w / 2}" y="${y0 - 6}" text-anchor="middle" style="font-weight:600;fill:var(--ink-2)">${esc(fmt(tot(d)))}</text>`;
      s += `<text x="${x + w / 2}" y="${h - 8}" text-anchor="middle">${esc(d.label)}</text>`;
    });
    return App.raw(s + '</svg>');
  },
  /* línea/área: series=[{name, color, values:[n]}], labels=[...] */
  line(series, labels, {h = 220, fmt = App.num, area = true, yTicks = 4, dots = true} = {}) {
    const W = 600, padL = 40, padB = 26, padT = 12, iw = W - padL - 14, ih = h - padB - padT;
    const max = niceMax(Math.max(...series.flatMap(s => s.values), 1));
    const n = labels.length, X = i => padL + 7 + (n === 1 ? iw / 2 : iw * i / (n - 1)), Y = v => padT + ih - ih * v / max;
    let s = `<svg class="chart" viewBox="0 0 ${W} ${h}" preserveAspectRatio="none" style="height:${h}px"><defs>`;
    series.forEach((se, k) => s += `<linearGradient id="lg${k}${se.color.replace(/\W/g,'')}" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="${se.color}" stop-opacity=".22"/><stop offset="1" stop-color="${se.color}" stop-opacity="0"/></linearGradient>`);
    s += '</defs>';
    for (let i = 0; i <= yTicks; i++) { const y = Y(max * i / yTicks); s += `<line class="grid" x1="${padL}" x2="${W}" y1="${y}" y2="${y}"/><text x="${padL - 8}" y="${y + 4}" text-anchor="end">${esc(App.k(max * i / yTicks))}</text>`; }
    const step = Math.ceil(n / 12);
    labels.forEach((l, i) => { if (i % step === 0 || i === n - 1) s += `<text x="${X(i)}" y="${h - 8}" text-anchor="middle">${esc(l)}</text>`; });
    series.forEach((se, k) => {
      const pts = se.values.map((v, i) => [X(i), Y(v)]);
      const d = pts.map((p, i) => {
        if (!i) return `M${p[0]},${p[1]}`;
        const pr = pts[i - 1], cx = (pr[0] + p[0]) / 2;
        return `C${cx},${pr[1]} ${cx},${p[1]} ${p[0]},${p[1]}`;
      }).join('');
      if (area) s += `<path d="${d}L${pts[pts.length-1][0]},${padT + ih}L${pts[0][0]},${padT + ih}Z" fill="url(#lg${k}${se.color.replace(/\W/g,'')})"/>`;
      s += `<path d="${d}" fill="none" stroke="${se.color}" stroke-width="2.5" stroke-linecap="round" vector-effect="non-scaling-stroke"/>`;
      if (dots) pts.forEach((p, i) => s += `<circle cx="${p[0]}" cy="${p[1]}" r="9" fill="transparent" data-tip="${esc(`<b>${labels[i]}</b> · ${se.name ? se.name + ': ' : ''}${fmt(se.values[i])}`)}"/><circle cx="${p[0]}" cy="${p[1]}" r="3" fill="var(--surface)" stroke="${se.color}" stroke-width="2" vector-effect="non-scaling-stroke" pointer-events="none"/>`);
    });
    return App.raw(s + '</svg>');
  },
  /* donut: parts=[{name, value, color}] */
  donut(parts, {size = 160, stroke = 22, center = '', sub = ''} = {}) {
    const r = (size - stroke) / 2, c = 2 * Math.PI * r, tot = App.sum(parts, p => p.value) || 1;
    let off = 0, s = `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" style="flex:none"><circle cx="${size/2}" cy="${size/2}" r="${r}" fill="none" stroke="var(--surface-3)" stroke-width="${stroke}"/>`;
    parts.forEach(p => {
      const len = c * p.value / tot;
      s += `<circle cx="${size/2}" cy="${size/2}" r="${r}" fill="none" stroke="${p.color}" stroke-width="${stroke}" stroke-dasharray="${Math.max(len - 2, 0)} ${c}" stroke-dashoffset="${-off}" transform="rotate(-90 ${size/2} ${size/2})" data-tip="${esc(`<b>${p.name}</b> · ${App.num(p.value)} (${Math.round(p.value / tot * 100)} %)`)}"/>`;
      off += len;
    });
    if (center) s += `<text x="50%" y="${sub ? '47%' : '53%'}" text-anchor="middle" style="font:800 ${size/6.5}px var(--font-d);fill:var(--ink)">${esc(center)}</text>`;
    if (sub) s += `<text x="50%" y="62%" text-anchor="middle" style="font:500 12px var(--font);fill:var(--ink-3)">${esc(sub)}</text>`;
    return App.raw(s + '</svg>');
  },
  spark(values, {w = 90, h = 32, color = 'var(--accent)'} = {}) {
    const max = Math.max(...values), min = Math.min(...values), rng = max - min || 1;
    const pts = values.map((v, i) => [i * w / (values.length - 1), h - 3 - (v - min) / rng * (h - 6)]);
    const d = pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ',' + p[1].toFixed(1)).join('');
    return App.raw(`<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><path d="${d}L${w},${h}L0,${h}Z" fill="${color}" opacity=".1"/><path d="${d}" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`);
  },
  /* barras horizontales: data=[{label, value, color?, sub?}] */
  hbars(data, {fmt = App.num, color = 'var(--accent)'} = {}) {
    const max = Math.max(...data.map(d => d.value), 1);
    return App.html`<div class="stack-sm">${data.map(d => App.html`
      <div data-tip="${`<b>${esc(d.label)}</b> · ${esc(fmt(d.value))}`}">
        <div class="between small"><span class="semi ink">${d.label}</span><span class="muted tnum">${d.sub || fmt(d.value)}</span></div>
        <div class="progress mt-4" style="height:8px"><i style="width:${(d.value / max * 100).toFixed(1)}%;background:${d.color || color}"></i></div>
      </div>`)}</div>`;
  }
};

/* ---------- impresión de un nodo (presupuestos, fichas) ---------- */
App.printHTML = (htmlStr, {title = document.title} = {}) => {
  const root = App.el('<div class="print-root"></div>');
  root.innerHTML = htmlStr;
  document.body.appendChild(root);
  document.body.classList.add('printing');
  const prev = document.title; document.title = title;
  const done = () => { document.body.classList.remove('printing'); root.remove(); document.title = prev; window.removeEventListener('afterprint', done); };
  window.addEventListener('afterprint', done);
  setTimeout(() => { window.print(); setTimeout(done, 1500); }, 80);
};
})();
