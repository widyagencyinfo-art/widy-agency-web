/* =====================================================================
   Portales · rendimiento por portal, matriz coches × portales,
   leads por portal y estado de las integraciones.
   ===================================================================== */
(function(){
const App = window.App;
const {html, icon, db, C, ui} = App;
const S = () => App.S;
const eur = App.eur;

const INFO = {
  web:         {label: 'Tu web',      cuota: 0,   nota: 'Incluida en tu plan'},
  cochesnet:   {label: 'coches.net',  cuota: 390, nota: 'Plan profesional'},
  wallapop:    {label: 'Wallapop',    cuota: 149, nota: 'Wallapop PRO'},
  milanuncios: {label: 'Milanuncios', cuota: 99,  nota: 'Pack profesional'},
  autoscout:   {label: 'AutoScout24', cuota: 229, nota: 'Plan concesionario'},
  fbmarket:    {label: 'Marketplace', cuota: 0,   nota: 'Sin cuota'}
};
const INTEG = [
  {id: 'cochesnet', label: 'coches.net', desc: 'Anuncios y leads al momento', grupo: 'Portales'},
  {id: 'wallapop', label: 'Wallapop PRO', desc: 'Anuncios y chats dentro del CRM', grupo: 'Portales'},
  {id: 'milanuncios', label: 'Milanuncios', desc: 'Anuncios y leads al momento', grupo: 'Portales'},
  {id: 'autoscout', label: 'AutoScout24', desc: 'Anuncios y leads al momento', off: 'Ahora se suben por fichero una vez al día', grupo: 'Portales'},
  {id: 'fbmarket', label: 'Facebook Marketplace', desc: 'Catálogo de coches en Facebook e Instagram', grupo: 'Portales'},
  {id: 'meta', label: 'Instagram y Facebook Ads', desc: 'Los leads de tus anuncios entran solos', grupo: 'Captación', sello: ['IG', '#D6297A']},
  {id: 'google', label: 'Perfil de Google', desc: 'Reseñas y llamadas desde Google', grupo: 'Captación', sello: ['G', '#4285F4']},
  {id: 'whatsapp', label: 'WhatsApp Business', desc: 'Conversaciones atendidas por la IA', grupo: 'Captación', sello: ['wa', '#25D366']},
  {id: 'gcal', label: 'Google Calendar', desc: 'Citas sincronizadas con el móvil', grupo: 'Gestión', sello: ['31', '#1A73E8']},
  {id: 'holded', label: 'Holded', desc: 'Facturas de venta automáticas', grupo: 'Gestión', sello: ['H', '#E6463C']}
];
const ORIG_KEYS = ['cochesnet', 'wallapop', 'web', 'meta', 'milanuncios', 'fbmarket', 'otros'];
const colorDe = k => k === 'otros' ? '#9CA3AF' : k === 'web' ? 'var(--ink-2)' : C.origen(k).color;
const labelDe = k => k === 'otros' ? 'Otros' : k === 'meta' ? 'Instagram Ads' : (INFO[k] || C.origen(k)).label;

let lastSync = Date.now() - 4 * 6e4;
let syncing = false;
const conectando = new Set();
const keepXMap = {};
const rerender = () => App.render({keepScroll: true});

function statsPortal(p) {
  const stock = db.stock();
  const act = stock.filter(v => v.portales[p] && v.portales[p].on).length;
  const visitas = App.sum(stock, v => (v.portales[p] || {}).visitas || 0);
  const leads = App.sum(stock, v => (v.portales[p] || {}).leads || 0);
  const h = S().hist, mes = h[h.length - 2] || h[h.length - 1];
  const leadsMes = p === 'autoscout' ? Math.round((mes.origen.otros || 0) * .35) : (mes.origen[p] || 0);
  const cuota = INFO[p].cuota;
  return {act, total: stock.length, visitas, leads, conv: visitas ? leads / visitas * 100 : 0, cuota, leadsMes, cpl: cuota && leadsMes ? cuota / leadsMes : 0, mes: App.MESES[(App.MESES_C.indexOf(mes.mes) + 12) % 12]};
}

function portalCard(p) {
  const s = statsPortal(p);
  const integ = S().integraciones || {};
  const conectado = p === 'web' || !!integ[p];
  return html`<article class="card po-card">
    <div class="po-card__head">
      ${ui.portal(p, 'lg')}
      <div class="grow"><b>${INFO[p].label}</b><span>${App.num(s.act)} ${s.act === 1 ? 'anuncio activo' : 'anuncios activos'} · ${Math.round(s.act / Math.max(s.total, 1) * 100)} % del stock</span></div>
      ${conectado ? html`<span class="badge badge--green badge--dot">Conectado</span>` : html`<span class="badge badge--amber badge--dot">Por fichero</span>`}
    </div>
    <div class="po-card__bar"><div class="progress"><i style="width:${(s.act / Math.max(s.total, 1) * 100).toFixed(1)}%;background:${p === 'web' ? 'var(--ink-2)' : C.origen(p).color}"></i></div></div>
    <div class="po-card__stats">
      <div><span>Visitas</span><b class="tnum">${App.k(s.visitas)}</b></div>
      <div><span>Leads</span><b class="tnum">${App.num(s.leads)}</b></div>
      <div><span>Por 100 visitas</span><b class="tnum">${App.dec(s.conv, 2)}</b></div>
    </div>
    <div class="po-card__foot">
      <div><span>Cuota orientativa</span><b class="tnum">${s.cuota ? `${eur(s.cuota)}/mes` : 'Gratis'}</b><small>${INFO[p].nota}</small></div>
      <div class="r"><span>Coste por lead</span><b class="tnum ${s.cuota ? '' : 'green'}">${s.cuota ? App.dec(s.cpl, 1) + ' €' : '0 €'}</b><small>${s.leadsMes} leads en ${s.mes}</small></div>
    </div>
  </article>`;
}

function matriz() {
  const list = db.stock().sort((a, b) => (a.estado === 'preparacion') - (b.estado === 'preparacion') || b.fechaEntrada.localeCompare(a.fechaEntrada));
  const totalAnuncios = App.sum(list, v => C.PORTALES.filter(p => v.portales[p].on).length);
  const sinPublicar = list.filter(v => !C.PORTALES.some(p => v.portales[p].on)).length;
  const fotos = App.stk ? App.stk.fotos : (v => [{s: ui.img(v)}]);
  return html`<section class="card po-matrix" data-tour="portales-matriz">
    <div class="card__head po-matrix__head">
      <div><h2>Qué coche está en cada portal</h2><p>${App.num(totalAnuncios)} anuncios activos${sinPublicar ? ` · ${sinPublicar} sin publicar (en preparación o nuevos)` : ''}</p></div>
      <div class="po-sync">
        ${syncing ? icon('refresh-cw', 15, 'spin') : html`<span class="live-dot"></span>`}
        <span class="small muted">${syncing ? 'Sincronizando…' : 'Sincronizado ' + App.rel(lastSync)}</span>
        <button class="btn btn--sm" data-act="po-sync" ${syncing ? 'disabled' : ''}>${icon('refresh-cw', 15)}<span class="hide-m">Sincronizar ahora</span><span class="show-m">Sincronizar</span></button>
      </div>
    </div>
    <div class="po-matrix__wrap" data-keep-x="po-matriz">
      <table class="po-table">
        <thead><tr>
          <th class="po-sticky po-th-car">Coche <span class="chip__n">${list.length}</span></th>
          ${C.PORTALES.map(p => { const n = list.filter(v => v.portales[p].on).length; const all = n === list.length; return html`<th class="po-col">
            <div class="po-colhead">${ui.portal(p, 'sm')}<b>${INFO[p].label}</b><span class="tnum">${n}/${list.length}</span>
            <button class="po-all ${all ? 'is-all' : ''}" data-act="po-col" data-portal="${p}" title="${all ? 'Retirar todos de ' : 'Publicar todos en '}${INFO[p].label}">${all ? 'Retirar todos' : 'Publicar todos'}</button></div></th>`; })}
          <th class="po-num">Visitas</th><th class="po-num">Leads</th>
        </tr></thead>
        <tbody>${list.map(v => html`<tr class="${v.estado === 'preparacion' ? 'is-prep' : ''}">
          <th class="po-sticky"><a class="po-car" href="#/stock/${v.id}"><img src="${fotos(v)[0].s}" alt="" loading="lazy"><span><b>${ui.vehNombre(v)}</b><small>${v.estado === 'preparacion' ? 'En preparación' : v.estado === 'reservado' ? 'Reservado · ' + eur(v.precio) : eur(v.precio) + ' · ' + v.anio}</small></span></a></th>
          ${C.PORTALES.map(p => { const on = v.portales[p].on; return html`<td class="po-cell"><button class="switch switch--sm ${on ? 'is-on' : ''}" data-act="po-toggle" data-id="${v.id}" data-portal="${p}" aria-label="${on ? 'Retirar' : 'Publicar'} ${ui.vehNombre(v)} ${on ? 'de' : 'en'} ${INFO[p].label}" title="${on ? 'Publicado' : 'Sin publicar'} en ${INFO[p].label}"></button></td>`; })}
          <td class="po-num tnum">${App.k(db.visitas(v))}</td><td class="po-num tnum">${db.leadsPortales(v)}</td>
        </tr>`)}</tbody>
      </table>
    </div>
    <div class="card__foot po-matrix__foot"><span class="small muted row-sm">${icon('badge-check', 15)}Al vender un coche se retira solo de todos los portales</span><span class="small muted row-sm hide-m">${icon('info', 14)}Los cambios de precio y fotos se envían a todos a la vez</span></div>
  </section>`;
}

function leadsChart() {
  const h = S().hist.slice(-6);
  const data = h.map((m, i) => ({label: m.mes + (i === h.length - 1 ? '*' : ''), parts: ORIG_KEYS.map(k => ({name: labelDe(k), value: m.origen[k] || 0, color: colorDe(k)}))}));
  const last = h[h.length - 2] || h[h.length - 1];
  const tot = App.sum(ORIG_KEYS, k => last.origen[k] || 0) || 1;
  const top = ORIG_KEYS.filter(k => k !== 'otros').sort((a, b) => (last.origen[b] || 0) - (last.origen[a] || 0))[0];
  return html`<section class="card">
    <div class="card__head"><div><h3>${icon('bar-chart-3', 17)}Leads por portal</h3><p>Últimos 6 meses · de dónde viene cada cliente</p></div></div>
    <div class="card__body">
      <div class="po-insight">${icon('trending-up', 16)}<span><b>${labelDe(top)}</b> trajo el ${Math.round((last.origen[top] || 0) / tot * 100)} % de tus leads en ${App.MESES[App.MESES_C.indexOf(last.mes)]} (${last.origen[top]} de ${tot}).</span></div>
      ${App.chart.bars(data, {h: 240})}
      <div class="legend mt-8">${ORIG_KEYS.map(k => html`<span><i style="background:${colorDe(k)}"></i>${labelDe(k)}</span>`)}</div>
      <p class="xs muted mt-8">* Mes en curso, hasta hoy.</p>
    </div>
    <div class="card__foot po-note"><span class="po-note__ico">${icon('eye-off', 16)}</span><span class="small"><b>Al vender un coche se retira solo de todos los portales.</b> <span class="muted">Nadie vuelve a llamar por un coche que ya no tienes.</span></span></div>
  </section>`;
}

function integraciones() {
  const integ = S().integraciones || {};
  const grupos = App.groupBy(INTEG, x => x.grupo);
  const on = INTEG.filter(x => integ[x.id]).length + 1;
  const sello = x => x.sello ? html`<span class="portal" style="background:${x.sello[1]}">${x.sello[0]}</span>` : ui.portal(x.id);
  return html`<section class="card po-integ">
    <div class="card__head"><div><h3>${icon('workflow', 17)}Integraciones</h3><p>${on} de ${INTEG.length + 1} conectadas</p></div></div>
    <div class="po-integ__list">
      <div class="po-integ__group">Tu web</div>
      <div class="po-int is-on">${ui.portal('web')}<div class="grow"><b>${S().dealer.web}</b><span>Stock publicado al momento</span></div><span class="badge badge--green badge--dot">Conectada</span></div>
      ${Object.entries(grupos).map(([g, items]) => html`<div class="po-integ__group">${g}</div>${items.map(x => { const ok = !!integ[x.id]; const busy = conectando.has(x.id); return html`
        <div class="po-int ${ok ? 'is-on' : ''}">${sello(x)}
          <div class="grow"><b>${x.label}</b><span>${ok ? x.desc : x.off || 'Sin conectar'}</span></div>
          ${busy ? html`<button class="btn btn--xs" disabled>${icon('refresh-cw', 13, 'spin')}Conectando…</button>`
            : ok ? html`<button class="btn btn--xs btn--ghost po-int__off" data-act="po-integ" data-id="${x.id}"><span class="status-dot status-dot--green"></span>Conectado</button>`
            : html`<button class="btn btn--xs btn--soft" data-act="po-integ" data-id="${x.id}">${icon('link', 13)}Conectar</button>`}
        </div>`; })}`)}
    </div>
  </section>`;
}

App.views.portales = {
  title: 'Portales',
  deps: ['vehicles', 'integraciones'],
  render() {
    const stock = db.stock();
    const tot = C.PORTALES.map(statsPortal);
    const anuncios = App.sum(tot, s => s.act), visitas = App.sum(tot, s => s.visitas), leads = App.sum(tot, s => s.leads);
    const cuotas = App.sum(tot, s => s.cuota), leadsMes = App.sum(tot, s => s.cuota ? s.leadsMes : 0);
    const sinPub = stock.filter(v => v.estado !== 'preparacion' && !C.PORTALES.some(p => v.portales[p].on)).length;
    return html`
    <div class="page-head">
      <div><h1>Portales</h1><p>Tus ${stock.length} coches en 6 portales, desde un solo sitio</p></div>
      <div class="page-head__actions">
        <button class="btn" data-act="go" data-href="#/stock">${icon('car', 16)}Ver stock</button>
        <button class="btn btn--primary" data-act="po-pub-todo" ${sinPub ? '' : 'disabled'}>${icon('send', 16)}${sinPub ? `Publicar ${sinPub === 1 ? 'el que falta' : `los ${sinPub} que faltan`}` : 'Todo publicado'}</button>
      </div>
    </div>
    <div class="kpis po-kpis">
      ${ui.kpi({label: 'Anuncios activos', value: App.num(anuncios), sub: `en ${C.PORTALES.length} portales`, icon: 'globe', color: 'var(--accent)'})}
      ${ui.kpi({label: 'Visitas', value: App.k(visitas), sub: 'del stock actual', icon: 'eye', color: 'var(--cyan)'})}
      ${ui.kpi({label: 'Leads de portales', value: App.num(leads), sub: `${App.dec(visitas ? leads / visitas * 100 : 0, 2)} por cada 100 visitas`, icon: 'zap', color: 'var(--violet)'})}
      ${ui.kpi({label: 'Coste medio por lead', value: html`${App.dec(leadsMes ? cuotas / leadsMes : 0, 1)}<small>€</small>`, sub: `${eur(cuotas)}/mes en cuotas`, icon: 'wallet', color: 'var(--green)'})}
    </div>
    <div class="po-cards mt-16">${C.PORTALES.map(portalCard)}</div>
    <div class="mt-16">${matriz()}</div>
    <div class="grid-main mt-16 po-bottom">
      ${leadsChart()}
      ${integraciones()}
    </div>`;
  },
  mount(root) {
    App.$$('[data-keep-x]', root).forEach(el => {
      const k = el.dataset.keepX;
      if (keepXMap[k] != null) el.scrollLeft = keepXMap[k];
      el.addEventListener('scroll', () => { keepXMap[k] = el.scrollLeft; }, {passive: true});
    });
  },
  actions: {
    'po-toggle'(el) {
      const v = db.veh(el.dataset.id), p = el.dataset.portal; if (!v) return;
      const on = !v.portales[p].on;
      db.setPortal(v.id, p, on);
      App.toast(on ? `Publicado en ${INFO[p].label}` : `Retirado de ${INFO[p].label}`, {icon: on ? 'globe' : 'eye-off', sub: ui.vehNombre(v), ms: 2600});
    },
    'po-col'(el) {
      const p = el.dataset.portal;
      const list = db.stock();
      const all = list.every(v => v.portales[p].on);
      const antes = list.map(v => [v, v.portales[p].on, v.portales[p].desde]);
      const cambian = list.filter(v => v.portales[p].on === all).length;
      App.store.update(() => list.forEach(v => { const x = v.portales[p]; if (x.on === all) { x.on = !all; x.desde = all ? null : new Date().toISOString(); } }), 'vehicles');
      db.log(`${all ? 'Retirados' : 'Publicados'} ${cambian} coches ${all ? 'de' : 'en'} ${INFO[p].label}`, {icon: 'globe', link: '#/portales'});
      App.toast(all ? `Retirados ${cambian} coches de ${INFO[p].label}` : `Publicados ${cambian} coches en ${INFO[p].label}`, {icon: all ? 'eye-off' : 'globe', accion: 'Deshacer',
        onAccion: () => App.store.update(() => antes.forEach(([v, on, desde]) => { v.portales[p].on = on; v.portales[p].desde = desde; }), 'vehicles')});
    },
    'po-pub-todo'() {
      const list = db.stock().filter(v => v.estado !== 'preparacion' && !C.PORTALES.some(p => v.portales[p].on));
      if (!list.length) return;
      App.store.update(() => list.forEach(v => C.PORTALES.forEach(p => { v.portales[p].on = true; v.portales[p].desde = new Date().toISOString(); })), 'vehicles');
      App.toast(`${list.length === 1 ? '1 coche publicado' : list.length + ' coches publicados'} en ${C.PORTALES.length} portales`, {icon: 'globe', sub: list.map(ui.vehNombre).join(', ')});
    },
    'po-sync'() {
      if (syncing) return;
      syncing = true; rerender();
      setTimeout(() => {
        syncing = false; lastSync = Date.now();
        const anuncios = App.sum(db.stock(), v => C.PORTALES.filter(p => v.portales[p].on).length);
        if (App.route && App.route.name === 'portales') rerender();
        App.toast('Sincronizado con los 6 portales', {icon: 'cloud-check', sub: `${anuncios} anuncios al día · sin errores`});
      }, 1600);
    },
    async 'po-integ'(el) {
      const id = el.dataset.id; const x = INTEG.find(i => i.id === id); if (!x) return;
      const on = !!(S().integraciones || {})[id];
      if (on) {
        const ok = await App.confirm({title: `¿Desconectar ${x.label}?`, text: 'Dejarán de entrar sus leads al CRM de forma automática. Puedes volver a conectarlo cuando quieras.', ok: 'Desconectar', danger: true});
        if (!ok) return;
        App.store.update(s => { s.integraciones[id] = false; }, 'integraciones');
        App.toast(`${x.label} desconectado`, {icon: 'power', tipo: 'warn'});
        return;
      }
      conectando.add(id); rerender();
      setTimeout(() => {
        conectando.delete(id);
        App.store.update(s => { s.integraciones[id] = true; }, 'integraciones');
        App.toast(`${x.label} conectado`, {icon: 'link', sub: x.desc});
      }, 1300);
    }
  }
};
})();
