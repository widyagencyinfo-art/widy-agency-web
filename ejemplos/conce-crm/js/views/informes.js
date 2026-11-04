/* =====================================================================
   Informes (#/informes) — ventas, margen, respuesta, origen de leads,
   comerciales, rotación de stock y últimas ventas. Exporta CSV e imprime.
   Las gráficas se dibujan en mount() al ancho real del contenedor
   (así el texto del SVG nunca se deforma) y se redibujan al cambiar el ancho.
   ===================================================================== */
(function(){
const App = window.App;
const {html, raw, icon, db, C, ui} = App;
const P = App.panel;
const st = {periodo: 'mes', comercial: 'todos'};
const PERIODOS = [{id:'mes', label:'Este mes', n: 1}, {id:'3m', label:'Últimos 3 meses', n: 3}, {id:'12m', label:'12 meses', n: 12}];
const CITA_TIPOS = ['prueba','visita','tasacion'];
const esc = App.esc;
let charts = {}, ro = null;

/* ---------- datos por mes (y reparto por comercial) ---------- */
const mesIdx = h => App.MESES_C.indexOf(h.mes);
const rangoMes = h => [new Date(h.anio, mesIdx(h), 1), new Date(h.anio, mesIdx(h) + 1, 1)];
const nombreMes = (h, largo) => (largo ? App.MESES : App.MESES_C)[mesIdx(h)];

function splitMes(i) {
  const S = App.S, h = S.hist[i], coms = P.comerciales();
  const [a, b] = rangoMes(h), en = d => { d = new Date(d); return d >= a && d < b; };
  const tb = k => k === 0 ? (i % 2 ? .02 : -.02) : 0;       // desempate alterno mes a mes
  const wV = coms.map((u, k) => db.vendidos().filter(v => v.vendedor === u.id && en(v.fechaVenta)).length + .5 + tb(k));
  const wL = coms.map((u, k) => S.contacts.filter(c => c.asignado === u.id && en(c.creado)).length + .5 + tb(k));
  const wC = coms.map((u, k) => S.events.filter(e => e.userId === u.id && en(e.inicio) && CITA_TIPOS.includes(e.tipo)).length + .5 + tb(k));
  const ventas = P.reparto(h.ventas, wV), leads = P.reparto(h.leads, wL), citas = P.reparto(h.citas, wC);
  const pesoV = ventas.map((x, k) => x + wV[k] / 100);
  const facturacion = P.reparto(h.facturacion, pesoV), margen = P.reparto(h.margen, pesoV);
  const origen = coms.map(() => ({}));
  Object.keys(h.origen).forEach(o => P.reparto(h.origen[o], leads.map((x, k) => x + wL[k] / 100)).forEach((x, k) => origen[k][o] = x));
  return Object.fromEntries(coms.map((u, k) => [u.id, Object.assign({}, h, {ventas: ventas[k], leads: leads[k], citas: citas[k], facturacion: facturacion[k], margen: margen[k], origen: origen[k]})]));
}
function meses(uid) {
  const H = App.S.hist;
  return H.map((h, i) => Object.assign({}, uid === 'todos' ? h : splitMes(i)[uid] || h)).map(h => Object.assign(h, {origen: conOtros(h)}));
}
const sumar = (arr, k) => App.sum(arr, h => h[k]);
// el histórico no siempre reparte el 100 % de los leads por origen: lo que falta va a «Otros»
const conOtros = h => P.origenMes(h);
const escala = (h, f) => Object.assign({}, h, {ventas: h.ventas * f, leads: h.leads * f, citas: h.citas * f, facturacion: h.facturacion * f, margen: h.margen * f});

/* reparto de citas y ventas por origen (los portales convierten distinto) */
const CIT_O = {cochesnet: 1.05, wallapop: .85, web: 1.3, meta: .9, milanuncios: .8, fbmarket: .7, otros: 1.25};
const VEN_O = {cochesnet: 1.05, wallapop: .8, web: 1.35, meta: .75, milanuncios: .9, fbmarket: .6, otros: 1.5};
function porOrigen(ms) {
  const leads = {}; P.ORIGENES.forEach(o => leads[o] = App.sum(ms, h => h.origen[o] || 0));
  const ids = P.ORIGENES.filter(o => leads[o]);
  const citas = P.reparto(sumar(ms, 'citas'), ids.map(o => leads[o] * CIT_O[o]));
  const ventas = P.reparto(sumar(ms, 'ventas'), ids.map((o, k) => citas[k] * VEN_O[o] + .01));
  return ids.map((o, k) => ({id: o, leads: leads[o], citas: citas[k], ventas: ventas[k]})).sort((a, b) => b.leads - a.leads);
}

/* ---------- gráficas SVG a medida ---------- */
// máximos que se dividen bien en 4 tramos (0 · ¼ · ½ · ¾ · máx.)
const niceMax = v => { if (v <= 0) return 4; const e = Math.pow(10, Math.floor(Math.log10(v))); const f = v / e; return [1, 2, 3, 4, 6, 8, 10].find(x => f <= x) * e; };
const curva = pts => pts.map((p, i) => { if (!i) return `M${p[0].toFixed(1)},${p[1].toFixed(1)}`; const q = pts[i - 1], cx = (q[0] + p[0]) / 2; return `C${cx.toFixed(1)},${q[1].toFixed(1)} ${cx.toFixed(1)},${p[1].toFixed(1)} ${p[0].toFixed(1)},${p[1].toFixed(1)}`; }).join('');
/* combo: barras (apiladas si hay varias series) + líneas (eje izq. o dcho.) + banda anotada */
function combo(W, {h = 260, labels, hl = [], parcial = -1, bars = [], lines = [], fmtL = App.k, fmtR = App.k, maxL, maxR, band, values = false, tip}) {
  W = Math.max(W, 280);
  const small = W < 520, n = labels.length;
  const hasR = lines.some(l => l.axis === 'right');
  const padL = small ? 34 : 42, padR = hasR ? (small ? 38 : 48) : 10, padT = band || values ? 26 : 12, padB = 28;
  const iw = W - padL - padR, ih = h - padT - padB, bw = iw / n;
  const tot = i => App.sum(bars, s => s.values[i]);
  const mL = maxL || niceMax(Math.max(1, ...labels.map((_, i) => tot(i)), ...lines.filter(l => l.axis !== 'right').flatMap(l => l.values)));
  const mR = maxR || niceMax(Math.max(1, ...lines.filter(l => l.axis === 'right').flatMap(l => l.values)));
  const X = i => padL + bw * (i + .5), YL = v => padT + ih - ih * v / mL, YR = v => padT + ih - ih * v / mR;
  let s = `<svg class="inf-svg" width="${W}" height="${h}" viewBox="0 0 ${W} ${h}" role="img">`;
  if (bars.length > 1 || parcial >= 0) s += `<defs><pattern id="infHatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="6" height="6" style="fill:var(--surface)" opacity=".0"/><line x1="0" y1="0" x2="0" y2="6" style="stroke:var(--surface)" stroke-width="2.4" opacity=".55"/></pattern></defs>`;
  if (band) {
    const bx = padL + bw * band.from;
    s += `<rect x="${bx}" y="${padT - 18}" width="${padL + iw - bx}" height="${ih + 18}" rx="8" class="inf-band"/>`;
    s += `<line x1="${bx}" x2="${bx}" y1="${padT - 18}" y2="${padT + ih}" class="inf-band-line"/>`;
    s += `<text x="${bx + 9}" y="${padT - 5}" class="inf-band-txt">${esc(band.label)}</text>`;
  }
  for (let t = 0; t <= 4; t++) {
    const y = padT + ih - ih * t / 4;
    s += `<line class="inf-grid ${t ? '' : 'is-base'}" x1="${padL}" x2="${padL + iw}" y1="${y}" y2="${y}"/>`;
    s += `<text x="${padL - 8}" y="${y + 4}" text-anchor="end">${esc(fmtL(mL * t / 4))}</text>`;
    if (hasR) s += `<text x="${padL + iw + 8}" y="${y + 4}" text-anchor="start" class="inf-axis-r">${esc(fmtR(mR * t / 4))}</text>`;
  }
  const barW = Math.min(bw * (small ? .62 : .54), 38);
  labels.forEach((lab, i) => {
    const on = !hl.length || hl.includes(i), x = X(i) - barW / 2;
    let y0 = padT + ih;
    bars.forEach((se, j) => {
      const v = se.values[i] || 0, bh = ih * v / mL; if (bh <= 0) return;
      y0 -= bh;
      const top = j === bars.length - 1 || !bars.slice(j + 1).some(z => z.values[i]);
      const r = top ? Math.min(5, barW / 2, bh) : 0;
      const d = r ? `M${x},${y0 + bh}V${y0 + r}Q${x},${y0} ${x + r},${y0}H${x + barW - r}Q${x + barW},${y0} ${x + barW},${y0 + r}V${y0 + bh}Z` : `M${x},${y0}h${barW}v${bh}h${-barW}Z`;
      s += `<path d="${d}" style="fill:${se.color}" class="inf-bar ${on ? '' : 'is-off'}"/>`;
      if (bars.length > 1 && j < bars.length - 1) s += `<line x1="${x}" x2="${x + barW}" y1="${y0}" y2="${y0}" style="stroke:var(--surface)" stroke-width="1.5"/>`;
      if (i === parcial) s += `<path d="${d}" fill="url(#infHatch)" class="${on ? '' : 'is-off'}" pointer-events="none"/>`;
    });
    const bhT = ih * tot(i) / mL;
    if (values && on && tot(i)) s += bhT > 24 && barW >= 16 ? `<text x="${X(i)}" y="${y0 + 15}" text-anchor="middle" class="inf-val is-in">${esc(App.num(tot(i)))}</text>` : `<text x="${X(i)}" y="${y0 - 7}" text-anchor="middle" class="inf-val">${esc(App.num(tot(i)))}</text>`;
    const salta = bw < 30 && (n - 1 - i) % 2 === 1;   // en estrecho, una etiqueta sí y otra no (la última siempre)
    if (!salta) s += `<text x="${X(i)}" y="${h - 9}" text-anchor="middle" class="${on ? 'is-on' : ''}">${esc(lab)}${i === parcial ? '*' : ''}</text>`;
  });
  lines.forEach(l => {
    const Y = l.axis === 'right' ? YR : YL;
    const pts = l.values.map((v, i) => [X(i), Y(v)]);
    if (l.area) s += `<path d="${curva(pts)}L${pts[pts.length - 1][0]},${padT + ih}L${pts[0][0]},${padT + ih}Z" style="fill:${l.color}" opacity=".08"/>`;
    s += `<path d="${curva(pts)}" fill="none" style="stroke:${l.color}" stroke-width="${l.width || 2.5}" stroke-linecap="round" ${l.dash ? 'stroke-dasharray="5 5"' : ''}/>`;
    pts.forEach((p, i) => { const on = !hl.length || hl.includes(i); s += `<circle cx="${p[0]}" cy="${p[1]}" r="${on ? 3.6 : 2.6}" style="fill:var(--surface);stroke:${l.color}" stroke-width="2" ${on ? '' : 'opacity=".55"'}/>`; });
  });
  // zonas de tooltip por columna
  labels.forEach((lab, i) => { s += `<rect x="${padL + bw * i}" y="${padT - 18}" width="${bw}" height="${ih + 18}" fill="transparent" class="inf-hit" data-tip="${esc(tip(i))}"/>`; });
  return s + '</svg>';
}

/* ---------- piezas ---------- */
const kpiSub = (d, txt, invert) => d == null ? txt : html`<span class="delta delta--${(invert ? -d : d) >= 0 ? 'up' : 'down'}">${icon(d >= 0 ? 'arrow-up-right' : 'arrow-down-right', 13)}${Math.abs(d)} %</span>${txt}`;

function calcular() {
  const S = App.S, H = S.hist, N = H.length, fr = P.frac();
  const per = PERIODOS.find(p => p.id === st.periodo);
  const todos = meses(st.comercial);
  const idx = H.map((_, i) => i).slice(N - per.n);
  const act = idx.map(i => todos[i]);
  let ant = null, antTxt = '';
  if (per.n < N) {
    ant = H.map((_, i) => i).slice(N - per.n * 2, N - per.n).map(i => todos[i]);
    ant = ant.map((h, k) => k === ant.length - 1 ? escala(h, fr) : h);   // el último mes, a la misma altura
    antTxt = per.n === 1 ? ` vs mismo día de ${nombreMes(H[N - 2])}` : ' vs 3 meses anteriores';
  }
  return {per, todos, idx, act, ant, antTxt};
}

function kpis(k) {
  const {act, ant, antTxt, per} = k;
  const f = sumar(act, 'facturacion'), m = sumar(act, 'margen'), v = sumar(act, 'ventas'), l = sumar(act, 'leads');
  const dias = Math.round(App.sum(act, h => h.diasStock * Math.max(h.ventas, 1)) / Math.max(App.sum(act, h => Math.max(h.ventas, 1)), 1));
  const d = (a, b) => ant ? P.delta(a, b) : null;
  const fa = ant && sumar(ant, 'facturacion'), ma = ant && sumar(ant, 'margen'), va = ant && sumar(ant, 'ventas'), la = ant && sumar(ant, 'leads');
  const conv = l ? v / l * 100 : 0, convA = ant && la ? va / la * 100 : 0;
  const diasA = ant && Math.round(App.sum(ant, h => h.diasStock * Math.max(h.ventas, 1)) / Math.max(App.sum(ant, h => Math.max(h.ventas, 1)), 1));
  const H = App.S.hist, pre = H.slice(0, H.length - 4);
  const diasPre = Math.round(P.avg(pre, h => h.diasStock));
  const txt = antTxt || ' en 12 meses';
  const pp = ant ? Math.round((conv - convA) * 10) / 10 : null;
  return html`<div class="kpis in-kpis inf-kpis">
    ${ui.kpi({label:'Facturación', icon:'receipt', color:'var(--accent)', value: App.eur(f), sub: kpiSub(d(f, fa), txt)})}
    ${ui.kpi({label:'Margen bruto', icon:'wallet', color:'var(--green)', value: App.eur(m), sub: kpiSub(d(m, ma), txt)})}
    ${ui.kpi({label:'Margen medio por coche', icon:'badge-euro', color:'var(--cyan)', value: App.eur(v ? m / v : 0), sub: kpiSub(d(v ? m / v : 0, va ? ma / va : 0), txt)})}
    ${ui.kpi({label:'Coches vendidos', icon:'car', color:'var(--violet)', value: html`${App.num(v)}<small>${v === 1 ? 'coche' : 'coches'}</small>`, sub: kpiSub(d(v, va), txt)})}
    ${ui.kpi({label:'Conversión lead → venta', icon:'target', color:'var(--pink)', value: App.dec(conv, 1) + ' %', sub: pp == null ? html`${App.num(v)} ventas de ${App.num(l)} leads` : html`<span class="delta delta--${pp >= 0 ? 'up' : 'down'}">${icon(pp >= 0 ? 'arrow-up-right' : 'arrow-down-right', 13)}${App.dec(Math.abs(pp), 1)} p. p.</span>${txt}`})}
    ${ui.kpi({label:'Días medios en stock', icon:'hourglass', color:'var(--amber)', value: html`${dias}<small>días</small>`, sub: diasA ? html`<span class="delta delta--${dias <= diasA ? 'up' : 'down'}">${icon(dias <= diasA ? 'arrow-down-right' : 'arrow-up-right', 13)}${Math.abs(dias - diasA)} d</span>${txt}` : html`antes del CRM: ${diasPre} días`})}
  </div>`;
}

function ventasCard(k) {
  const H = App.S.hist, N = H.length, {todos, idx} = k;
  const labels = H.map(h => nombreMes(h));
  const v = todos.map(h => h.ventas), m = todos.map(h => h.margen);
  charts.ventas = W => combo(W, {h: W < 520 ? 230 : 270, labels, hl: idx, parcial: N - 1, values: true,
    bars: [{name:'Ventas', color:'var(--accent)', values: v}],
    lines: [{name:'Margen', color:'var(--green)', values: m, axis:'right'}],
    fmtL: n => App.num(n), fmtR: n => n ? App.num(n / 1000) + ' k' : '0',
    tip: i => `<b>${esc(App.cap(nombreMes(H[i], true)))} ${H[i].anio}${i === N - 1 ? ' (en curso)' : ''}</b><br>${v[i]} coches · ${App.eur(todos[i].facturacion)}<br>Margen ${App.eur(m[i])}`});
  const f = sumar(k.act, 'facturacion'), vv = sumar(k.act, 'ventas'), mm = sumar(k.act, 'margen');
  return html`<section class="card in-card" data-tour="inf-ventas">
    ${P.cardHead({ic:'bar-chart-3', color:'var(--accent)', title:'Ventas y margen por mes', sub: `${k.per.label}: ${P.n(vv, 'coche', 'coches')} · ${App.eur(f)} facturados · ${App.eur(mm)} de margen`,
      right: html`<div class="legend hide-m"><span><i style="background:var(--accent)"></i>Coches vendidos</span><span><i class="inf-lg-line" style="background:var(--green)"></i>Margen bruto</span></div>`})}
    <div class="card__body inf-chart-body">
      <div class="legend show-m mb-8"><span><i style="background:var(--accent)"></i>Coches vendidos</span><span><i class="inf-lg-line" style="background:var(--green)"></i>Margen bruto</span></div>
      <div class="inf-chart" data-inf-chart="ventas" style="height:${270}px"></div>
      <p class="xs faint mt-4">* Mes en curso, hasta hoy. En color, los meses del periodo elegido.</p>
    </div>
  </section>`;
}

function respuestaCard(k) {
  const H = App.S.hist, N = H.length, desde = N - 4;
  const labels = H.map(h => nombreMes(h));
  const resp = H.map(h => h.respuestaMin), tasa = k.todos.map(h => h.leads ? Math.round(h.citas / h.leads * 100) : 0);
  const pre = H.slice(0, desde), post = H.slice(desde);
  const antes = P.avg(pre, h => h.respuestaMin), ahora = P.avg(post, h => h.respuestaMin);
  const tAntes = Math.round(P.avg(k.todos.slice(0, desde), h => h.leads ? h.citas / h.leads * 100 : 0));
  const tAhora = Math.round(P.avg(k.todos.slice(desde), h => h.leads ? h.citas / h.leads * 100 : 0));
  const maxL = Math.max(60, Math.ceil(Math.max(...resp) / 60) * 60);
  const cli = App.S.messages.filter(m => m.from === 'cliente');
  const fuera = P.pct(cli.filter(m => !P.enHorario(m.fecha)).length, cli.length);
  charts.respuesta = W => combo(W, {h: 250, labels, hl: k.idx,
    band: {from: desde, label: W < 420 ? 'Con IA' : 'WhatsApp con IA'},
    lines: [{name:'Respuesta', color:'var(--pink)', values: resp, area: true}, {name:'Citas', color:'var(--violet)', values: tasa, axis:'right', dash: true, width: 2}],
    maxL, maxR: 40, fmtL: n => n ? (n >= 60 ? Math.round(n / 60) + ' h' : Math.round(n) + ' min') : '0', fmtR: n => Math.round(n) + ' %',
    tip: i => `<b>${esc(App.cap(nombreMes(H[i], true)))}</b><br>Primera respuesta: ${esc(P.durMin(resp[i]))}<br>Citas por cada 100 leads: ${tasa[i]}`});
  return html`<section class="card in-card" data-tour="inf-respuesta">
    ${P.cardHead({ic:'timer', color:'var(--pink)', title:'Tiempo de respuesta', sub: `Primera respuesta al cliente · IA activa desde ${nombreMes(H[desde], true)}`})}
    <div class="inf-callouts">
      <div class="inf-callout"><span>Antes</span><b class="tnum">${P.durMin(antes)}</b></div>
      <div class="inf-callout inf-callout--hl"><span>${icon('sparkles', 12)}Con la IA</span><b class="tnum">${P.durMin(ahora)}</b></div>
      <div class="inf-callout"><span>Citas por cada 100 leads</span><b class="tnum">${tAntes} ${raw('&rarr;')} ${tAhora}</b></div>
    </div>
    <div class="card__body inf-chart-body">
      <div class="inf-chart" data-inf-chart="respuesta" style="height:250px"></div>
      <div class="legend mt-8"><span><i style="background:var(--pink)"></i>Tiempo de respuesta</span><span><i class="inf-lg-line inf-lg-dash" style="color:var(--violet)"></i>Citas por lead (%)</span></div>
    </div>
    <div class="card__foot in-foot inf-insight">${icon('moon', 15)}<span><b>${fuera} %</b> de los mensajes de clientes llegan con el concesionario cerrado. Ahora ninguno espera a mañana.</span></div>
  </section>`;
}

function stockCard() {
  const stock = db.stock();
  const TR = [{id:'0-30', label:'0-30 días', a: 0, b: 30, color:'var(--green)'}, {id:'31-60', label:'31-60 días', a: 31, b: 60, color:'var(--accent)'}, {id:'61-90', label:'61-90 días', a: 61, b: 90, color:'var(--amber)'}, {id:'90', label:'Más de 90', a: 91, b: 1e9, color:'var(--red)'}];
  const tr = TR.map(t => { const vs = stock.filter(v => { const d = db.diasStock(v); return d >= t.a && d <= t.b; }); return Object.assign({}, t, {n: vs.length, capital: App.sum(vs, v => db.costeTotal(v))}); });
  const total = stock.length || 1, capital = App.sum(tr, t => t.capital);
  const lentos = stock.filter(v => db.diasStock(v) > 60).sort((a, b) => db.diasStock(b) - db.diasStock(a));
  const diasMed = Math.round(P.avg(stock, v => db.diasStock(v)));
  return html`<section class="card in-card">
    ${P.cardHead({ic:'hourglass', color:'var(--amber)', title:'Rotación de stock', sub:`Hoy · ${P.n(stock.length, 'coche', 'coches')} · ${diasMed} días de media · ${App.eur(capital)} invertidos`})}
    <div class="card__body">
      <div class="inf-rot">${tr.map(t => html`<div class="inf-rot__t" style="--c:${t.color}">
        <span class="inf-rot__lbl">${t.label}</span>
        <b class="tnum">${t.n}</b>
        <span class="inf-rot__cap tnum">${App.k(t.capital)} €</span>
        <div class="inf-rot__bar"><i style="width:${(t.n / total * 100).toFixed(1)}%"></i></div>
      </div>`)}</div>
      <div class="inf-strip">${tr.filter(t => t.n).map(t => html`<i style="flex:${t.n};background:${t.color}" data-tip="${`<b>${esc(t.label)}</b> · ${t.n} coches`}"></i>`)}</div>
    </div>
    <div class="inf-sub-h"><span>Más de 60 días${lentos.length > 4 ? ` · ${lentos.length}` : ''}</span><span>Margen en juego</span></div>
    <div class="inf-slow">${lentos.length ? lentos.slice(0, 4).map(v => {
      const mg = db.margen(v), sug = P.sugerido(v);
      return html`<div class="inf-slow__row" data-act="vehiculo" data-id="${v.id}" role="button" tabindex="0">
        <img class="thumb thumb--sm" src="${ui.img(v)}" alt="">
        <div class="inf-slow__main"><b>${ui.vehNombre(v)}</b><span>${App.eur(v.precio)}${sug && !P.rebajadoHoy(v) ? html` · sugerido ${App.eur(sug)}` : ''}</span></div>
        ${ui.dias(v)}
        <span class="inf-slow__mg tnum ${mg < 1000 ? 'red' : 'green'}">${App.eur(mg)}</span>
      </div>`;
    }) : html`<div class="inf-empty-row">${icon('circle-check', 16)}Ningún coche pasa de 60 días. Buena rotación.</div>`}</div>
  </section>`;
}

function origenCard(k) {
  const H = App.S.hist, N = H.length, {todos, idx, act} = k;
  const labels = H.map(h => nombreMes(h));
  const series = P.ORIGENES.map(o => ({id: o, name: P.origenInfo(o).label, color: o === 'web' ? 'var(--ink)' : P.origenInfo(o).color, values: todos.map(h => h.origen[o] || 0)}));
  charts.origen = W => combo(W, {h: W < 520 ? 240 : 280, labels, hl: idx, parcial: N - 1, bars: series, fmtL: n => App.num(n),
    tip: i => `<b>${esc(App.cap(nombreMes(H[i], true)))}</b> · ${App.sum(series, s => s.values[i])} leads<br>` + series.slice().sort((a, b) => b.values[i] - a.values[i]).map(s => `${esc(s.name)}: ${s.values[i]}`).join('<br>')});
  const filas = porOrigen(act);
  const tot = {leads: App.sum(filas, f => f.leads), citas: App.sum(filas, f => f.citas), ventas: App.sum(filas, f => f.ventas)};
  const maxConv = Math.max(...filas.map(f => f.leads ? f.ventas / f.leads : 0), .01);
  return html`<section class="card in-card" data-tour="inf-origen">
    ${P.cardHead({ic:'globe', color:'var(--cyan)', title:'Leads por origen', sub:`De dónde llegan los clientes y cuáles compran · ${k.per.label.toLowerCase()}`})}
    <div class="inf-org">
      <div class="inf-org__chart">
        <div class="inf-chart" data-inf-chart="origen" style="height:280px"></div>
        <div class="legend mt-8">${series.map(s => html`<span><i style="background:${s.color}"></i>${s.name}</span>`)}</div>
      </div>
      <div class="inf-org__table table-wrap">
        <table class="table inf-table">
          <thead><tr><th>Origen</th><th class="r">Leads</th><th class="r">Citas</th><th class="r">Ventas</th><th class="r">Conversión</th></tr></thead>
          <tbody>${filas.map(f => { const o = P.origenInfo(f.id), cv = f.leads ? f.ventas / f.leads * 100 : 0; return html`<tr>
            <td><span class="row"><span class="portal portal--sm" style="background:${o.color}" title="${o.label}">${o.short}</span><span class="semi nowrap">${o.label}</span></span></td>
            <td class="r tnum">${App.num(f.leads)}</td><td class="r tnum">${App.num(f.citas)}</td><td class="r tnum semi">${App.num(f.ventas)}</td>
            <td class="r"><span class="inf-conv"><i style="width:${(cv / (maxConv * 100) * 100).toFixed(0)}%"></i></span><span class="tnum semi">${App.dec(cv, 1)} %</span></td>
          </tr>`; })}</tbody>
          <tfoot><tr><td>Total</td><td class="r tnum">${App.num(tot.leads)}</td><td class="r tnum">${App.num(tot.citas)}</td><td class="r tnum">${App.num(tot.ventas)}</td><td class="r tnum">${App.dec(tot.leads ? tot.ventas / tot.leads * 100 : 0, 1)} %</td></tr></tfoot>
        </table>
      </div>
    </div>
  </section>`;
}

function comercialesCard(k) {
  const H = App.S.hist, N = H.length, coms = P.comerciales();
  const splits = k.idx.map(i => splitMes(i));
  const filas = coms.map(u => {
    const ms = splits.map(s => s[u.id]);
    const leads = sumar(ms, 'leads'), citas = sumar(ms, 'citas'), ventas = sumar(ms, 'ventas'), margen = sumar(ms, 'margen');
    return {u, leads, citas, pruebas: Math.round(citas * .72), ventas, margen, conv: leads ? ventas / leads * 100 : 0};
  });
  const T = {leads: App.sum(filas, f => f.leads), citas: App.sum(filas, f => f.citas), pruebas: App.sum(filas, f => f.pruebas), ventas: App.sum(filas, f => f.ventas), margen: App.sum(filas, f => f.margen)};
  const maxV = Math.max(...filas.map(f => f.ventas), 1);
  return html`<section class="card in-card">
    ${P.cardHead({ic:'users', color:'var(--violet)', title:'Rendimiento por comercial', sub: k.per.label})}
    <div class="inf-mlist">${filas.map(f => html`<div class="inf-mcom ${st.comercial !== 'todos' && st.comercial !== f.u.id ? 'is-dim' : ''}">
      <div class="between"><span class="row">${App.avatar(f.u.nombre, {color: f.u.color})}<b>${P.corto(f.u.nombre)}</b></span><span class="tnum"><b class="inf-mbig">${f.ventas}</b> ${f.ventas === 1 ? 'venta' : 'ventas'}</span></div>
      <div class="inf-mstats">
        <span><b class="tnum">${App.num(f.leads)}</b>leads</span><span><b class="tnum">${App.num(f.citas)}</b>citas</span><span><b class="tnum">${App.num(f.pruebas)}</b>pruebas</span><span><b class="tnum">${App.dec(f.conv, 1)} %</b>conversión</span><span><b class="tnum">${App.eur(f.margen)}</b>margen</span><span><b class="tnum">${App.eur(f.ventas ? f.margen / f.ventas : 0)}</b>por coche</span>
      </div>
    </div>`)}</div>
    <div class="table-wrap inf-tbl">
      <table class="table inf-table inf-com">
        <thead><tr><th>Comercial</th><th class="r">Leads</th><th class="r">Citas</th><th class="r">Pruebas</th><th>Ventas</th><th class="r">Conversión</th><th class="r">Margen</th><th class="r">Por coche</th></tr></thead>
        <tbody>${filas.map(f => html`<tr class="${st.comercial !== 'todos' && st.comercial !== f.u.id ? 'is-dim' : ''}">
          <td><span class="cell-main">${App.avatar(f.u.nombre, {color: f.u.color})}<span><b>${P.corto(f.u.nombre)}</b><span>${f.u.rol}</span></span></span></td>
          <td class="r tnum">${App.num(f.leads)}</td><td class="r tnum">${App.num(f.citas)}</td><td class="r tnum">${App.num(f.pruebas)}</td>
          <td><span class="inf-vbar"><b class="tnum">${f.ventas}</b><span class="progress"><i style="width:${(f.ventas / maxV * 100).toFixed(1)}%;background:${f.u.color}"></i></span></span></td>
          <td class="r tnum">${App.dec(f.conv, 1)} %</td><td class="r tnum semi">${App.eur(f.margen)}</td><td class="r tnum muted">${App.eur(f.ventas ? f.margen / f.ventas : 0)}</td>
        </tr>`)}</tbody>
        <tfoot><tr><td>Equipo</td><td class="r tnum">${App.num(T.leads)}</td><td class="r tnum">${App.num(T.citas)}</td><td class="r tnum">${App.num(T.pruebas)}</td><td class="tnum">${T.ventas}</td><td class="r tnum">${App.dec(T.leads ? T.ventas / T.leads * 100 : 0, 1)} %</td><td class="r tnum">${App.eur(T.margen)}</td><td class="r tnum">${App.eur(T.ventas ? T.margen / T.ventas : 0)}</td></tr></tfoot>
      </table>
    </div>
  </section>`;
}

function ventasFiltradas() {
  const per = PERIODOS.find(p => p.id === st.periodo), now = new Date();
  const desde = new Date(now.getFullYear(), now.getMonth() - (per.n - 1), 1);
  return db.vendidos().filter(v => new Date(v.fechaVenta) >= desde && (st.comercial === 'todos' || v.vendedor === st.comercial));
}

function ventasTabla() {
  const lista = ventasFiltradas();
  const tot = App.sum(lista, v => v.precioVenta), mg = App.sum(lista, v => db.margen(v));
  return html`<section class="card in-card">
    ${P.cardHead({ic:'badge-check', color:'var(--green)', title:'Últimas ventas', sub: lista.length ? `${P.n(lista.length, 'coche entregado', 'coches entregados')} registrados en el CRM · ${App.eur(tot)} · margen ${App.eur(mg)}` : 'Sin ventas registradas en este periodo',
      right: lista.length ? html`<button class="btn btn--sm hide-m" data-act="inf-csv">${icon('download', 15)}Excel</button>` : ''})}
    ${lista.length ? html`<div class="inf-mlist">${lista.map(v => {
      const c = db.contact(v.cliente), u = db.user(v.vendedor), m = db.margen(v), d = db.diasStock(v);
      return html`<div class="inf-msale" data-act="vehiculo" data-id="${v.id}" role="button" tabindex="0">
        <img class="thumb" src="${ui.img(v)}" alt="">
        <div class="inf-msale__main">
          <div class="between"><b>${ui.vehNombre(v)}</b><b class="tnum">${App.eur(v.precioVenta)}</b></div>
          <div class="between small muted"><span>${c ? P.corto(c.nombre) : '—'}</span><span class="green semi tnum">+${App.eur(m)}</span></div>
          <div class="inf-msale__meta">${u ? ui.user(u.id, {name: true}) : ''}<span class="tnum">${App.fecha(v.fechaVenta)}</span>${v.financiado ? html`<span class="badge badge--blue">Financiado</span>` : html`<span class="badge">Contado</span>`}<span class="badge ${d <= 20 ? 'badge--green' : d > 40 ? 'badge--amber' : ''}">${d} d</span></div>
        </div>
      </div>`;
    })}</div>
    <div class="table-wrap inf-tbl">
      <table class="table inf-table inf-sales">
        <thead><tr><th>Coche</th><th>Cliente</th><th>Comercial</th><th>Fecha</th><th class="r">Precio</th><th class="r">Margen</th><th>Pago</th><th class="r">Días en venta</th></tr></thead>
        <tbody>${lista.map(v => {
          const c = db.contact(v.cliente), u = db.user(v.vendedor), m = db.margen(v), d = db.diasStock(v);
          return html`<tr class="is-link" data-act="vehiculo" data-id="${v.id}">
            <td><span class="cell-main"><img class="thumb thumb--sm" src="${ui.img(v)}" alt=""><span><b>${ui.vehNombre(v)}</b><span>${v.anio} · ${v.matricula}</span></span></span></td>
            <td>${c ? html`<button class="inf-link" data-act="contacto" data-id="${c.id}">${P.corto(c.nombre)}</button>` : html`<span class="muted">—</span>`}</td>
            <td>${u ? ui.user(u.id, {name: true}) : ''}</td>
            <td class="nowrap muted tnum">${App.fechaNum(v.fechaVenta)}</td>
            <td class="r tnum semi">${App.eur(v.precioVenta)}</td>
            <td class="r tnum"><span class="green semi">${App.eur(m)}</span><span class="xs faint inf-mgp">${App.dec(m / v.precioVenta * 100, 1)} %</span></td>
            <td>${v.financiado ? html`<span class="badge badge--blue">${icon('landmark', 12)}Financiado</span>` : html`<span class="badge">${icon('banknote', 12)}Contado</span>`}</td>
            <td class="r"><span class="badge ${d <= 20 ? 'badge--green' : d > 40 ? 'badge--amber' : ''}">${d} d</span></td>
          </tr>`;
        })}</tbody>
      </table>
    </div>` : ui.empty('badge-check', 'Sin ventas en este periodo', st.comercial !== 'todos' ? 'Prueba con «Todos» o con un periodo más largo.' : 'Prueba con un periodo más largo.', html`<button class="btn btn--sm" data-act="inf-periodo" data-v="12m">Ver 12 meses</button>`)}
  </section>`;
}

/* ---------- vista ---------- */
App.views.informes = {
  title: 'Informes',
  deps: ['*'],
  render() {
    const S = App.S;
    charts = {};
    const k = calcular();
    const H = S.hist, N = H.length, ult = H[N - 1];
    const rango = k.per.n === 1 ? `${App.cap(nombreMes(ult, true))} ${ult.anio}, hasta hoy` : `${App.cap(nombreMes(H[N - k.per.n], true))} ${H[N - k.per.n].anio} – ${nombreMes(ult, true)} ${ult.anio}`;
    const com = st.comercial === 'todos' ? null : db.user(st.comercial);
    return P.nb(html`<div class="inf">
      <div class="page-head">
        <div><h1>Informes</h1><p>${S.dealer.nombre} · ${rango}${com ? ' · ' + P.corto(com.nombre) : ''}</p></div>
        <div class="page-head__actions">
          <button class="btn" data-act="inf-print">${icon('printer', 16)}<span>Imprimir</span></button>
          <button class="btn btn--primary" data-act="inf-csv">${icon('download', 16)}Descargar Excel</button>
        </div>
      </div>
      <div class="inf-bar">
        <div class="seg inf-seg" role="tablist" aria-label="Periodo">${PERIODOS.map(p => html`<button class="${st.periodo === p.id ? 'is-on' : ''}" data-act="inf-periodo" data-v="${p.id}">${p.label}</button>`)}</div>
        <div class="seg inf-seg" role="tablist" aria-label="Comercial">
          <button class="${st.comercial === 'todos' ? 'is-on' : ''}" data-act="inf-comercial" data-v="todos">${icon('users', 14)}Todos</button>
          ${P.comerciales().map(u => html`<button class="${st.comercial === u.id ? 'is-on' : ''}" data-act="inf-comercial" data-v="${u.id}">${App.avatar(u.nombre, {size:'sm', color: u.color})}${P.nombre(u.nombre)}</button>`)}
        </div>
      </div>
      <div class="inf-grid">
        ${kpis(k)}
        ${ventasCard(k)}
        <div class="inf-row">${respuestaCard(k)}${stockCard()}</div>
        ${origenCard(k)}
        ${comercialesCard(k)}
        ${ventasTabla()}
      </div>
      <div class="inf-print-foot">Informe generado el ${App.fechaNum(new Date())} a las ${App.hora(new Date())} · ${S.dealer.nombre} · datos de ejemplo</div>
    </div>`);
  },
  mount(root) {
    const draw = el => { const fn = charts[el.dataset.infChart]; if (!fn) return; const w = Math.floor(el.clientWidth || 600); if (el.__w === w) return; el.__w = w; el.innerHTML = fn(w); el.style.height = ''; };
    const els = App.$$('[data-inf-chart]', root);
    els.forEach(draw);
    if (ro) ro.disconnect();
    if (window.ResizeObserver) { ro = new ResizeObserver(entries => entries.forEach(e => draw(e.target))); els.forEach(el => ro.observe(el)); }
    root.addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.matches('[role="button"][data-act]')) { e.preventDefault(); App.runAct(e.target, e); } });
  },
  unmount() { if (ro) { ro.disconnect(); ro = null; } },
  actions: {
    'inf-periodo'(el) { st.periodo = el.dataset.v; App.render({keepScroll: true}); },
    'inf-comercial'(el) { st.comercial = el.dataset.v; App.render({keepScroll: true}); },
    'inf-print'() { window.print(); },
    'inf-csv'() {
      const lista = ventasFiltradas();
      if (!lista.length) return App.toast('No hay ventas que exportar', {tipo: 'warn', sub: 'Cambia el periodo o el comercial.'});
      const q = v => { const s = String(v == null ? '' : v); return /[;"\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
      const dec = n => String(Math.round(n * 100) / 100).replace('.', ',');
      const cab = ['Fecha de venta','Marca','Modelo','Versión','Año','Km','Matrícula','Bastidor','Cliente','Comercial','Precio de venta (€)','Coste total (€)','Margen (€)','Margen (%)','Forma de pago','Días en stock'];
      const filas = lista.map(v => { const c = db.contact(v.cliente), u = db.user(v.vendedor), m = db.margen(v); return [App.fechaNum(v.fechaVenta), v.marca, v.modelo, v.version, v.anio, v.km, v.matricula, v.bastidor, c ? c.nombre : '', u ? u.nombre : '', v.precioVenta, db.costeTotal(v), m, dec(m / v.precioVenta * 100), v.financiado ? 'Financiado' : 'Contado', db.diasStock(v)]; });
      const csv = '﻿' + [cab].concat(filas).map(r => r.map(q).join(';')).join('\r\n');
      const slug = App.norm(App.S.dealer.nombre).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      const nombre = `ventas-${slug}-${st.periodo === 'mes' ? 'este-mes' : st.periodo === '3m' ? 'ultimos-3-meses' : '12-meses'}${st.comercial !== 'todos' ? '-' + App.norm(P.nombre(db.user(st.comercial).nombre)) : ''}-${new Date().toISOString().slice(0, 10)}.csv`;
      const url = URL.createObjectURL(new Blob([csv], {type: 'text/csv;charset=utf-8'}));
      const a = document.createElement('a'); a.href = url; a.download = nombre; document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
      App.toast('Excel descargado', {sub: `${nombre} · ${P.n(lista.length, 'venta', 'ventas')}`, icon: 'download'});
    }
  }
};
})();
