/* Panel Torres Bus — router + vistas */
const $ = id => document.getElementById(id);
const money = n => n.toLocaleString('es-ES') + ' €';
const esc = s => String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

/* ---------- navegación ---------- */
const SECCIONES = [
 {id:'resumen', t:'Resumen', sub:'Todo lo que tenéis en la calle, en una pantalla',
  ic:'<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>'},
 {id:'presupuestos', t:'Presupuestos', sub:'Cada solicitud, su estado y su seguimiento', pill:'37',
  ic:'<path d="M7 3h7l5 5v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z"/><path d="M14 3v5h5"/>'},
 {id:'flota', t:'Flota', sub:'De 7 a 71 plazas · estado y ocupación',
  ic:'<path d="M3 17V8a1 1 0 0 1 1-1h13a1 1 0 0 1 1 1v9"/><path d="M18 10h2.2a1 1 0 0 1 .9.6L22 13v4h-4"/><circle cx="7" cy="17.5" r="2"/><circle cx="17" cy="17.5" r="2"/>'},
 {id:'clientes', t:'Clientes', sub:'Quién repite y cuánto vale cada uno',
  ic:'<circle cx="9" cy="8" r="3.2"/><path d="M3 20a6 6 0 0 1 12 0"/><path d="M16 6a3 3 0 0 1 0 6"/><path d="M18 20a5 5 0 0 0-3-4.6"/>'},
 {id:'seguimiento', t:'Seguimiento', sub:'La secuencia que persigue cada presupuesto sola',
  ic:'<path d="M13 2 4 14h7l-1 8 9-12h-7l1-8z"/>'},
 {id:'ajustes', t:'Ajustes', sub:'Datos, condiciones y canales conectados', grupo:'Cuenta',
  ic:'<circle cx="12" cy="12" r="3"/><path d="M19 12a7 7 0 0 0-.1-1.3l2-1.5-2-3.4-2.3 1a7 7 0 0 0-2.2-1.3L14 2h-4l-.3 2.5A7 7 0 0 0 7.5 5.8l-2.3-1-2 3.4 2 1.5A7 7 0 0 0 5 12c0 .4 0 .9.1 1.3l-2 1.5 2 3.4 2.3-1a7 7 0 0 0 2.2 1.3L10 22h4l.3-2.5a7 7 0 0 0 2.2-1.3l2.3 1 2-3.4-2-1.5c.1-.4.1-.9.1-1.3z"/>'},
];

function pintarNav(){
 let html = '', grupo = null;
 SECCIONES.forEach(s => {
  if (s.grupo && s.grupo !== grupo) { grupo = s.grupo; html += `<div class="sep">${s.grupo}</div>`; }
  html += `<a data-go="${s.id}"><svg viewBox="0 0 24 24">${s.ic}</svg>${s.t}${s.pill?`<span class="pill">${s.pill}</span>`:''}</a>`;
 });
 $('nav').innerHTML = html;
}

let actual = 'resumen', query = '', filtro = 'all';

function ir(id){
 const s = SECCIONES.find(x => x.id === id); if (!s) return;
 actual = id; query = ''; $('q').value = '';
 $('q').placeholder = id==='flota' ? 'Buscar vehículo…' : id==='clientes' ? 'Buscar cliente…' : 'Buscar presupuesto…';
 $('ttl').textContent = s.t; $('sub').textContent = s.sub;
 document.querySelectorAll('#nav a').forEach(a => a.classList.toggle('on', a.dataset.go === id));
 $('side').classList.remove('open');
 const v = $('view'); v.className = 'fade'; v.innerHTML = VISTAS[id]();
 if (typeof POST[id] === 'function') POST[id]();
 location.hash = id;
}

/* ---------- utilidades visuales ---------- */
const fmt = (v,f) => f==='e' ? money(v) : f==='p' ? v+'%' : v.toLocaleString('es-ES');
function contar(el,t,f){ let s=null; const step=x=>{ if(!s)s=x; const p=Math.min((x-s)/900,1), e=1-Math.pow(1-p,3);
 el.textContent = fmt(Math.round(t*e), f); if(p<1) requestAnimationFrame(step); }; requestAnimationFrame(step); }
function spark(d){ const w=62,h=25,mx=Math.max(...d),mn=Math.min(...d);
 const p = d.map((v,i)=>`${(i/(d.length-1)*w).toFixed(1)},${(h-((v-mn)/(mx-mn||1))*(h-4)-2).toFixed(1)}`).join(' ');
 return `<svg class="spark" viewBox="0 0 ${w} ${h}"><polyline points="${p}" fill="none" stroke="var(--brand)" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>`; }
const kpisHTML = () => `<div class="kpis">${KPIS.map((k,i)=>
 `<div class="kpi"><div class="kl">${k.kl}</div><div class="kv" data-kv="${i}">0</div><div class="kd ${k.cls}">${k.kd}</div>${spark(k.sp)}</div>`).join('')}</div>`;
const animarKPIs = () => document.querySelectorAll('[data-kv]').forEach(el => { const k = KPIS[el.dataset.kv]; contar(el, k.kv, k.fmt); });
const animarBarras = () => setTimeout(()=>{
 document.querySelectorAll('.bar[data-h]').forEach(b=>b.style.height=b.dataset.h+'px');
 document.querySelectorAll('.cfill[data-w],.of[data-w]').forEach(f=>f.style.width=f.dataset.w+'%');
},60);

/* ---------- filas ---------- */
function filaPresu(d){
 const [bt,bc] = BADGE[d.estado];
 const txt = d.estado==='follow' ? `${bt} ${d.rec}` : bt;
 return `<div class="trow" data-id="${d.id}">
  <div class="name">${esc(d.tipo)} · ${d.plazas} plazas<span>${esc(d.ruta)} · ${d.fecha}</span></div>
  <div class="canal"><i class="${d.canal==='WhatsApp'?'wa':''}"></i>${d.canal}</div>
  <div class="val">${money(d.valor)}</div>
  <div class="badge ${bc}">${txt}</div></div>`;
}
const casaPresu = d => (filtro==='all' || (filtro==='open'&&d.estado!=='won') || (filtro==='exp'&&d.estado==='exp') || (filtro==='won'&&d.estado==='won'))
 && (!query || `${d.tipo} ${d.ruta} ${d.cli} ${d.canal} ${d.bus}`.toLowerCase().includes(query));

function listaPresu(lim){
 let r = PRESUS.filter(casaPresu); if (lim) r = r.slice(0, lim);
 return r.length ? r.map(filaPresu).join('') : '<div class="empty">Sin presupuestos con ese filtro.</div>';
}
const chipsHTML = () => `<div class="chips" id="chips">
 ${[['all','Todos'],['open','Abiertos'],['exp','Caducan pronto'],['won','Ganados']]
  .map(([f,t])=>`<span class="chip ${filtro===f?'on':''}" data-f="${f}">${t}</span>`).join('')}</div>`;

/* ---------- vistas ---------- */
const VISTAS = {

resumen: () => `${kpisHTML()}
<div class="grid">
 <div class="stack">
  <div class="card">
   <div class="ch"><h2>Presupuestos recientes</h2>${chipsHTML()}</div>
   <div id="tbl">${listaPresu(6)}</div>
  </div>
  <div class="card">
   <div class="ch"><h2>Próximos servicios</h2><span class="hint">5 salidas confirmadas</span></div>
   ${PROXIMOS.map(p=>`<div class="svc"><div class="day"><b>${p.d}</b><span>${p.m}</span></div>
    <div class="info"><b>${esc(p.t)}</b><span>${esc(p.r)}</span></div><div class="bus">${p.b}</div></div>`).join('')}
  </div>
 </div>
 <div class="stack">
  <div class="card">
   <div class="ch"><h2>Cierres por semana</h2><span style="font-size:11.5px;color:var(--brand);font-weight:700">▲ 82%</span></div>
   <div class="chart">${(()=>{ const mx=Math.max(...SEMANAS),H=128; return SEMANAS.map((v,i)=>
    `<div class="bcol ${i===SEMANAS.length-1?'win':''}"><div class="bar" style="height:0" data-h="${Math.round(v/mx*H)}"><span class="bv">${v} cerrados</span></div><div class="bl">S${i+1}</div></div>`).join(''); })()}</div>
  </div>
  <div class="card">
   <div class="ch"><h2>Por dónde entran</h2></div>
   <div class="cbars">${CANALES.map(([n,p,w])=>`<div class="cbar ${w?'wa':''}">
    <div class="clab"><span class="n">${n}</span><span class="p">${p}%</span></div>
    <div class="ctrack"><div class="cfill" style="width:0" data-w="${p}"></div></div></div>`).join('')}</div>
  </div>
  <div class="card">
   <div class="ch"><h2>Ocupación de flota</h2><span class="hint">este mes</span></div>
   <div class="cbars">${FLOTA.slice().sort((a,b)=>b.occ-a.occ).slice(0,4).map(v=>`<div class="cbar">
    <div class="clab"><span class="n">${v.n}</span><span class="p">${v.occ}%</span></div>
    <div class="ctrack"><div class="cfill" style="width:0" data-w="${v.occ}"></div></div></div>`).join('')}</div>
  </div>
 </div>
</div>`,

presupuestos: () => `${kpisHTML()}
<div class="card">
 <div class="ch"><h2>Todos los presupuestos</h2>${chipsHTML()}</div>
 <div id="tbl">${listaPresu()}</div>
</div>`,

flota: () => {
 const r = FLOTA.filter(v => !query || `${v.n} ${v.mat} ${v.tipo}`.toLowerCase().includes(query));
 const dis = FLOTA.filter(v=>v.st==='ok').length, ruta = FLOTA.filter(v=>v.st==='go').length;
 const media = Math.round(FLOTA.reduce((a,v)=>a+v.occ,0)/FLOTA.length);
 return `<div class="kpis">
  <div class="kpi"><div class="kl">Vehículos</div><div class="kv">${FLOTA.length}</div><div class="kd">de 7 a 71 plazas</div></div>
  <div class="kpi"><div class="kl">Disponibles</div><div class="kv">${dis}</div><div class="kd up">listos para salir</div></div>
  <div class="kpi"><div class="kl">En ruta ahora</div><div class="kv">${ruta}</div><div class="kd">con servicio activo</div></div>
  <div class="kpi"><div class="kl">Ocupación media</div><div class="kv">${media}%</div><div class="kd up">▲ 8 pts vs. mes pasado</div></div>
 </div>
 <div class="fleet">${ r.length ? r.map(v=>{ const [et,ec]=EST_VEH[v.st]; return `<div class="veh">
   <div class="vt"><div class="vi"><svg viewBox="0 0 24 24"><path d="M3 17V8a1 1 0 0 1 1-1h13a1 1 0 0 1 1 1v9"/><path d="M18 10h2.2a1 1 0 0 1 .9.6L22 13v4h-4"/><circle cx="7" cy="17.5" r="2"/><circle cx="17" cy="17.5" r="2"/></svg></div>
   <span class="st ${ec}">${et}</span></div>
   <h3>${v.n}</h3><div class="pl">${v.pl} plazas · ${v.tipo}</div><div class="mat">${v.mat}</div>
   <div class="occ"><div class="ol"><span>Ocupación</span><b>${v.occ}%</b></div>
   <div class="ot"><div class="of" style="width:0" data-w="${v.occ}"></div></div></div></div>`; }).join('')
  : '<div class="empty">Ningún vehículo coincide.</div>' }</div>`;
},

clientes: () => {
 const r = CLIENTES.filter(c => !query || `${c.n} ${c.t} ${c.c}`.toLowerCase().includes(query));
 const total = CLIENTES.reduce((a,c)=>a+c.eur,0), rep = CLIENTES.filter(c=>c.rep).length;
 return `<div class="kpis">
  <div class="kpi"><div class="kl">Clientes activos</div><div class="kv">${CLIENTES.length}</div><div class="kd">con servicio este año</div></div>
  <div class="kpi"><div class="kl">Facturado</div><div class="kv">${money(total)}</div><div class="kd up">▲ 14% vs. año pasado</div></div>
  <div class="kpi"><div class="kl">Repiten</div><div class="kv">${rep}</div><div class="kd up">3 o más servicios</div></div>
  <div class="kpi"><div class="kl">Ticket medio</div><div class="kv">${money(Math.round(total/CLIENTES.reduce((a,c)=>a+c.sv,0)))}</div><div class="kd">por servicio</div></div>
 </div>
 <div class="card">
  <div class="ch"><h2>Cartera de clientes</h2><span class="hint">ordenados por facturación</span></div>
  <div class="hrow"><span>Cliente</span><span>Entra por</span><span>Servicios</span><span>Facturado</span><span></span></div>
  ${ r.length ? r.map(c=>`<div class="crow">
   <div class="cn"><div class="av">${esc(c.n.slice(0,2).toUpperCase())}</div><div><b>${esc(c.n)}</b><span>${esc(c.t)}</span></div></div>
   <div class="cc">${c.c}</div>
   <div class="cnum">${c.sv}<span>último ${c.ult}</span></div>
   <div class="cnum">${money(c.eur)}</div>
   <div class="badge ${c.rep?'b-won':'b-send'}">${c.rep?'Repite':'Nuevo'}</div></div>`).join('')
  : '<div class="empty">Ningún cliente coincide.</div>' }
 </div>`;
},

seguimiento: () => {
 const env = SECUENCIA.reduce((a,s)=>a+s.st[0][1],0);
 const res = SECUENCIA.reduce((a,s)=>a+s.st[1][1],0);
 return `<div class="kpis">
  <div class="kpi"><div class="kl">Secuencia</div><div class="kv">${SECUENCIA.length}</div><div class="kd">pasos automáticos</div></div>
  <div class="kpi"><div class="kl">Mensajes enviados</div><div class="kv">${env}</div><div class="kd">últimos 30 días</div></div>
  <div class="kpi"><div class="kl">Respuestas</div><div class="kv">${res}</div><div class="kd up">${Math.round(res/env*100)}% de respuesta</div></div>
  <div class="kpi"><div class="kl">Horas ahorradas</div><div class="kv">31 h</div><div class="kd up">al mes, sin perseguir a mano</div></div>
 </div>
 <div class="card" style="margin-bottom:13px">
  <div class="ch"><h2>Qué hace el sistema por vosotros</h2>
   <span class="hint">Se dispara solo al enviar cada presupuesto · se para en cuanto el cliente responde</span></div>
 </div>
 <div class="seq">${SECUENCIA.map(s=>`<div class="step"><div class="dotn">${s.n}</div>
  <div class="sh"><b>${esc(s.t)}</b><span class="when">${s.w}</span></div>
  <div class="via">${s.via.map(([v,w])=>`<span class="${w?'w':''}">${v}</span>`).join('')}</div>
  <div class="msg">${esc(s.msg)}</div>
  <div class="sstats">${s.st.map(([l,v,g])=>`<div><b class="${g?'g':''}">${v}</b>${l}</div>`).join('')}</div>
 </div>`).join('')}</div>`;
},

ajustes: () => `<div class="grid-2">
 <div class="stack">
  <div class="card">
   <div class="ch"><h2>Datos de la empresa</h2></div>
   ${[['Razón social','Torres Bus, S.L.'],['Actividad','Alquiler de autocares con conductor'],
      ['Zona','Madrid y centro de España'],['Teléfono / WhatsApp','607 372 252'],
      ['Correo','info@torresbus.es'],['Atención','24 horas'],['En activo desde','1960']]
     .map(([l,v])=>`<div class="set"><div class="sl">${l}</div><div class="sv">${v}</div></div>`).join('')}
  </div>
  <div class="card">
   <div class="ch"><h2>Condiciones de contratación</h2><span class="hint">las que ya aplicáis</span></div>
   ${COND.map(([l,v])=>`<div class="set"><div class="sl">${l}</div><div class="sv">${v}</div></div>`).join('')}
  </div>
 </div>
 <div class="stack">
  <div class="card">
   <div class="ch"><h2>Canales conectados</h2><span class="hint">de aquí entran los presupuestos</span></div>
   ${CONEXIONES.map(([n,s,c,bgc,ic])=>`<div class="conn">
    <div class="ci" style="background:${bgc};color:${c}">${ic}</div>
    <div class="cinfo"><b>${n}</b><span>${s}</span></div>
    <span class="st st-ok">Activo</span></div>`).join('')}
  </div>
  <div class="card">
   <div class="ch"><h2>Avisos automáticos</h2></div>
   ${AVISOS.map(([l,s,on],i)=>`<div class="set"><div class="sl">${l}<span>${s}</span></div>
    <button class="sw ${on?'on':''}" data-sw="${i}" aria-label="${l}"></button></div>`).join('')}
  </div>
 </div>
</div>`
};

/* ---------- post-render ---------- */
const POST = {
 resumen(){ animarKPIs(); animarBarras(); },
 presupuestos(){ animarKPIs(); },
 flota(){ animarBarras(); },
 clientes(){},
 seguimiento(){},
 ajustes(){}
};

/* ---------- panel de detalle ---------- */
const TL = d =>
 d.estado==='won' ? [['Presupuesto enviado','29 oct · '+d.canal,'done'],['Recordatorio 1','31 oct · WhatsApp','done'],['Cliente responde','2 nov','done'],['Reserva confirmada · 40% cobrado','2 nov','done']]
 : d.estado==='exp' ? [['Presupuesto enviado','2 nov · '+d.canal,'done'],['Recordatorio 1','3 nov · WhatsApp','done'],['Recordatorio 2','4 nov · WhatsApp','done'],['Aviso de caducidad de tarifa','hoy · se envía en 2 h','next']]
 : d.estado==='send' ? [['Presupuesto enviado','hoy · '+d.canal,'done'],['Recordatorio 1','en 48 h · WhatsApp','next'],['Recordatorio 2','en 5 días · WhatsApp','next']]
 : [['Presupuesto enviado','1 nov · '+d.canal,'done'],['Recordatorio 1','3 nov · WhatsApp','done'],['Recordatorio 2','hoy · WhatsApp','done'],['Recordatorio 3','en 2 días · email','next'],['Aviso de caducidad','en 4 días','next']];

let cur = null;
function abrir(id){
 const d = PRESUS.find(x => x.id === id); if (!d) return; cur = d;
 const [bt] = BADGE[d.estado];
 $('dtag').textContent = d.estado==='won' ? 'Ganado' : d.estado==='exp' ? 'Caduca pronto' : 'En seguimiento';
 $('dttl').textContent = `${d.tipo} · ${d.plazas} plazas`;
 $('dval').textContent = money(d.valor);
 $('dmeta').innerHTML = [['Ruta',d.ruta],['Fecha del servicio',d.fecha],['Cliente',d.cli],
  ['Entró por',d.canal],['Contacto',d.tel],['Vehículo asignado',d.bus]]
  .map(([l,v])=>`<div class="m"><div class="l">${l}</div><div class="v">${esc(v)}</div></div>`).join('');
 $('dtl').innerHTML = TL(d).map(([t,s,c])=>`<div class="ti ${c}"><div class="tt">${t}</div><div class="td">${s}</div></div>`).join('');
 $('scrim').classList.add('on'); $('drawer').classList.add('on');
}
const cerrar = () => { $('scrim').classList.remove('on'); $('drawer').classList.remove('on'); };

/* ---------- avisos ---------- */
function toast(ic,t,s){
 const el = document.createElement('div'); el.className = 'toast';
 el.innerHTML = `<div class="ic ${ic}">${ic==='g'?'✓':'!'}</div><div><b>${esc(t)}</b>${s?' · '+esc(s):''}</div>`;
 $('toasts').appendChild(el); setTimeout(()=>el.remove(), 3800);
}

/* ---------- eventos ---------- */
document.addEventListener('click', e => {
 const nav = e.target.closest('[data-go]');           if (nav) return ir(nav.dataset.go);
 const chip = e.target.closest('.chip');              if (chip){ filtro = chip.dataset.f;
  document.querySelectorAll('.chip').forEach(c=>c.classList.toggle('on', c===chip));
  const t = $('tbl'); if (t) t.innerHTML = listaPresu(actual==='resumen'?6:0); return; }
 const row = e.target.closest('.trow');               if (row) return abrir(+row.dataset.id);
 const sw = e.target.closest('.sw');                  if (sw){ sw.classList.toggle('on');
  toast('g', sw.classList.contains('on') ? 'Aviso activado' : 'Aviso desactivado'); return; }
 if (e.target.closest('#burger')) return $('side').classList.toggle('open');
 if (e.target.closest('#scrim') || e.target.closest('#dx')) return cerrar();
});
$('bwa').onclick = () => { if(!cur) return; toast('g','Recordatorio enviado','a '+cur.cli+' por WhatsApp'); cerrar(); };
$('bwon').onclick = () => { if(!cur) return; toast('g','Presupuesto ganado 🎉', cur.tipo+' · '+money(cur.valor));
 cur.estado='won'; const t=$('tbl'); if(t) t.innerHTML = listaPresu(actual==='resumen'?6:0); cerrar(); };
$('q').oninput = e => { query = e.target.value.toLowerCase().trim();
 if (actual==='flota' || actual==='clientes'){ $('view').innerHTML = VISTAS[actual](); POST[actual](); }
 else { const t=$('tbl'); if(t) t.innerHTML = listaPresu(actual==='resumen'?6:0); } };
document.addEventListener('keydown', e => { if (e.key === 'Escape') cerrar(); });

/* ---------- arranque ---------- */
let secs = 0;
setInterval(() => { secs++; $('ago').textContent = secs<60 ? `hace ${secs} s` : `hace ${Math.floor(secs/60)} min`; }, 1000);
let li = 0;
setTimeout(function loop(){ toast(...LIVE_FEED[li++ % LIVE_FEED.length]); setTimeout(loop, 9000); }, 4000);

pintarNav();
ir(SECCIONES.some(s => s.id === location.hash.slice(1)) ? location.hash.slice(1) : 'resumen');
