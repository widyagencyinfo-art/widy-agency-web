const pad = n => String(n).padStart(2,'0');
const isoOfDate = d => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
const WD_FULL = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
const MONTHS_SHORT = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];

// Columnas del tablero: Hoy + próximos días laborables, calculado a partir de la fecha real del navegador.
function buildDays(n){
  const days = [];
  const d = new Date(); d.setHours(0,0,0,0);
  while(days.length < n){
    const dow = d.getDay();
    if(dow !== 0 && dow !== 6){
      days.push({
        key: days.length===0 ? 'hoy' : 'd'+days.length,
        label: days.length===0 ? 'Hoy' : WD_FULL[dow],
        date: `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}`,
        today: days.length===0,
        iso: isoOfDate(d),
      });
    }
    d.setDate(d.getDate()+1);
  }
  return days;
}
const DAYS = buildDays(5);
const TODAY_ISO = DAYS[0].iso;

(function(){
  const el = document.getElementById('subDate');
  if(!el) return;
  const now = new Date();
  const wd = WD_FULL[now.getDay()];
  el.innerHTML = `${wd} ${now.getDate()} ${MONTHS_SHORT[now.getMonth()]} ${now.getFullYear()} · ` + el.innerHTML;
})();

const D = [
  /* ===== MARTES 28 — reuniones + confirmaciones (ordenado por hora) ===== */
  {id:'cuquisimamar',date:'2026-07-28', ch:'call', hot:true, tag:'Cierre', name:'Cuquísima', note:'Cierre casi hecho — plan 300 € + 50 €/mes, dijo "sí seguro". Rematar el sí y cobrar la primera cuota.'},
  {id:'agautomocion',date:'2026-07-28', ch:'call', name:'AG Automoción (Adri)', phone:'697 81 96 57', mob:true, note:'Por la mañana. Primer contacto con Adri — presentar la oferta (compradores por Meta Ads) y ver si quiere reunión.'},
  {id:'angel',       date:'2026-07-28', ch:'call', name:'Ángel', phone:'638 91 05 11', mob:true, note:'Por la mañana. Retomar la conversación y proponer reunión.'},
  {id:'pacon',       date:'2026-07-28', ch:'call', name:'Paco Núñez', phone:'666 53 52 63', mob:true, note:'Confirmar si sigue interesado y fijar día de reunión.'},
  {id:'tere',        date:'2026-07-28', ch:'meet', time:'11:00', hot:true, tag:'Cierre', name:'Tere', note:'Reunión de cierre — está súper interesada. Cerrar el plan y arrancar.'},
  {id:'anamaria',    date:'2026-07-28', ch:'meet', time:'12:00', hot:true, tag:'Cierre', name:'Ana María', note:'Reunión de cierre en La Trufa · plan tienda online 300 €. Cerrar en la reunión.'},
  {id:'tatto',      date:'2026-07-29', ch:'meet', time:'12:30', hot:true, tag:'Cierre', name:'Sesentainueve Tattos', phone:'954 089 189', note:'Reunión de CIERRE 12:30–13:00. Cerrar el plan y agendar el arranque.'},
  {id:'albaocasion',date:'2026-07-28', ch:'call', name:'Albaocasión', note:'Concesionario. Primer contacto: presentar la oferta y ver interés en reunión.'},
  {id:'loure',       date:'2026-07-28', ch:'meet', time:'17:00', hot:true, tag:'Cierre', name:'Coure', phone:'658 330 136', mob:true, note:'Reunión de cierre a las 17:00. Cerrar y agendar el arranque.'},
  {id:'autosinigo', date:'2026-07-28', ch:'call', name:'Autosinigo', phone:'687 787 273', mob:true, note:'Concesionario. Retomar el contacto (venía de WhatsApp) y proponer reunión.'},

  /* ===== MIÉRCOLES 29 — concesionarios ===== */
  {id:'playcar',  date:'2026-08-04', ch:'call', time:'10:00', tag:'Mar 4 ago', name:'Automóviles Playcar', phone:'672 40 38 79', mob:true, note:'Llamar el MARTES a las 10:00 si hay hueco; si no, por la mañana cuando se pueda. Preguntar por el GERENTE (es quien decide) y presentar la oferta.'},
  {id:'autoboss', date:'2026-07-29', ch:'call', name:'Autoboss', phone:'677 077 128', mob:true, note:'Concesionario. Intentarlo esta semana — si no coge, insistir otro día.'},
  {id:'conce722', date:'2026-07-29', ch:'call', name:'Concesionario (722 703 353)', phone:'722 703 353', mob:true, note:'Retomar seguimiento — presentar la oferta y agendar reunión.'},
  {id:'julietta', date:'2026-07-29', ch:'call', name:'Automóviles Julietta', note:'Tenía que hablar con su compañero Antonio — llamar mañana para preguntar cómo ha ido.'},

  /* ===== JUEVES 30 — concesionario + moda pendiente ===== */
  {id:'antoniocabas', date:'2026-07-31', ch:'call', time:'09:30', hot:true, tag:'Apertura', name:'Autocasión Cabas (Raúl)', phone:'635 75 48 05', mob:true, note:'Llamar a la HORA DE APERTURA. Ya visitamos y hablamos con Alejandro; el que decide es Raúl → pedir hablar con él y fijar la 2ª reunión.'},
  {id:'conce625',   date:'2026-07-30', ch:'call', time:'10:00', name:'Concesionario (625 58 81 94)', phone:'625 58 81 94', mob:true, note:'Llamada de seguimiento — presentar la oferta y proponer reunión.'},
  {id:'santabarbara',date:'2026-07-31', ch:'wa', time:'12:00', hot:true, tag:'Insistir', name:'Santa Bárbara Autos', note:'Ponerse PESADOS para conseguir la llamada. Recordatorio: mandarle el mensaje mañana a las 12:00.'},
  {id:'matcar',     date:'2026-08-15', ch:'call', tag:'Vie 15 ago', name:'Matcar', phone:'653 653 883', mob:true, note:'Llamada agendada para el 15 de agosto — retomar y presentar la oferta.'},
  {id:'autotronic', date:'2026-07-30', ch:'call', time:'11:30', name:'Autotronic Cars', phone:'679 605 633', mob:true, note:'Primer contacto — presentar la oferta y agendar reunión si hay interés.'},
  {id:'driverz',    date:'2026-07-31', ch:'meet', time:'10:30', hot:true, tag:'Cierre', name:'Driverz Selected Cars', note:'Reunión de CIERRE mañana a las 10:30.'},
  {id:'bywendy',  date:'2026-07-30', ch:'wa', hot:true, name:'By Wendy (Salamanca)', note:'Moda — tienda online 250 € + 50 €/mes. Interesada, pero le coge lejos → ofrecer reunión telemática y cerrar.'},
  {id:'nicca',    date:'2026-07-30', ch:'call', name:'Nicca y el Ropero', note:'Moda — llamar y retomar la conversación.'},
  {id:'naranjo',  date:'2026-07-30', ch:'wa', name:'Naranjo Modas', note:'Moda — hablar y presentarle la propuesta de tienda/landing.'},
  {id:'bonsai',   date:'2026-07-30', ch:'wa', name:'Peluquería Bonsai', note:'Peluquería — estaban ocupados al llamar → reintentar por WhatsApp.'},
  {id:'manuela',  date:'2026-07-30', ch:'call', name:'Manuela Sáez', note:'Lencería — confirmar la landing y el siguiente paso.'},
  {id:'corner',   date:'2026-07-30', ch:'call', name:'Corner Xàtiva Multibrand', note:'Moda — retomar contacto y presentar la propuesta.'},
  {id:'mario',    date:'2026-07-30', ch:'call', hot:true, tag:'Cierre', name:'Mario · Automobile World Cast', phone:'624 72 61 02', mob:true, note:'CIERRE. Llamar el jueves por la tarde (o el viernes por la mañana) para cerrar la reunión.'},

  /* ===== VIERNES 31 / próxima — concesionario + resto de moda/peluquerías ===== */
  {id:'martinezautos', date:'2026-08-03', ch:'meet', time:'11:00', hot:true, tag:'Lun 3 ago', name:'Martínez Autos', note:'Acercarnos EN PERSONA el lunes sobre las 11:00 — primera visita.'},
  {id:'plusauto',   date:'2026-07-31', ch:'meet', time:'17:30', hot:true, tag:'Visita', name:'PlusAuto', note:'Visita a las 17:30. ⚠️ Confirmar que es mañana viernes 31.'},
  {id:'drivauto',   date:'2026-08-04', ch:'meet', time:'11:00', hot:true, tag:'Mar 4 ago', name:'DrivAuto', note:'Visita el martes que viene (4 ago) a las 11:00.'},
  {id:'conce677', date:'2026-07-31', ch:'call', name:'Danauto (Daniel)', phone:'677 259 069', mob:true, note:'Llamar el LUNES que viene para agendar una reunión de cierre esa misma semana.'},
  {id:'arturo',   date:'2026-08-03', ch:'call', tag:'Lun 3 ago', name:'Arturo', phone:'601 40 11 98', mob:true, note:'LUNES que viene. Hablé con Carlos — preguntar por Arturo.'},
  {id:'miriamconf', date:'2026-07-31', ch:'wa', hot:true, tag:'Confirmar', name:'Miriam · Automóviles Marchena', phone:'661 50 16 28', mob:true, note:'Escribirle el VIERNES para confirmar la reunión del martes 4 ago (después de hablar con el gerente de la tienda).'},
  {id:'miriamreu',  date:'2026-08-04', ch:'meet', tag:'Mar 4 ago', name:'Miriam · Automóviles Marchena', phone:'661 50 16 28', mob:true, note:'Reunión — confirmar antes por WhatsApp el viernes 31.'},
  {id:'bgautos',    date:'2026-08-04', ch:'call', tag:'Mar 4 ago', name:'Javier · BG Autos', note:'Llamar a Javier el martes que viene (4 ago).'},
  {id:'jnjconf',    date:'2026-08-15', ch:'wa', hot:true, tag:'Confirmar', name:'Javier · JNJ Motor', phone:'656 93 00 28', mob:true, note:'Escribirle el 15 ago para confirmar la reunión de cierre del día 16.'},
  {id:'jnjmotor',   date:'2026-08-16', ch:'meet', hot:true, tag:'Cierre', name:'Javier · JNJ Motor', phone:'656 93 00 28', mob:true, note:'Reunión de CIERRE (confirmada el día 15).'},
  {id:'angeles',  date:'2026-07-31', ch:'wa', name:'Ángeles', note:'Moda — enviar/retomar la propuesta de landing.'},
  {id:'antonio',  date:'2026-07-31', ch:'wa', name:'Antonio', note:'Seguimiento por WhatsApp — retomar conversación.'},
  {id:'pedro',    date:'2026-07-31', ch:'wa', name:'Pedro Muñoz', note:'Mandarle el informativo de la landing.'},
  {id:'jesus',    date:'2026-07-31', ch:'wa', name:'Jesús Domínguez (Dos Hermanas)', note:'Está de vacaciones — mandarle la info para retomar a la vuelta.'},
  {id:'clan',     date:'2026-07-31', ch:'wa', name:'Clan 20037', note:'Moda — propuesta de landing 50 €.'},
  {id:'inmoandal',date:'2026-07-31', ch:'wa', name:'Inmoandal (Omar)', note:'Inmobiliaria — presentarle la propuesta.'},
  {id:'cura',     date:'2026-07-31', ch:'wa', name:'El Cura', note:'Mandarle el WhatsApp de seguimiento pendiente.'},
  {id:'pelus',    date:'2026-07-31', ch:'wa', name:'WhatsApp a peluquerías', note:'Enviar la tanda de WhatsApp a las peluquerías pendientes.'},
  {id:'velvett',  date:'2026-07-31', ch:'wa', name:'Velvett (Hellín)', phone:'627 194 556', mob:true, note:'Moda — propuesta de landing 100 €.'},
  {id:'oviedo',   date:'2026-07-31', ch:'wa', name:'Oviedo (633 836 668)', phone:'633 836 668', mob:true, note:'Le gusta la propuesta — retomar y cerrar.'},
  {id:'ohlala',   date:'2026-07-31', ch:'wa', name:'Ohlala (León)', note:'Moda — seguimiento por WhatsApp.'},
  {id:'didada',   date:'2026-07-31', ch:'wa', name:'Didada (Cartagena)', note:'Moda — seguimiento por WhatsApp.'},
  {id:'informativos', date:'2026-07-31', ch:'wa', name:'WhatsApp informativos', note:'Recordar enviar los informativos pendientes de la semana.'},
  {id:'atypica',  date:'2026-07-31', ch:'call', name:'Atypica Moda (Logroño)', note:'Moda — primer contacto/seguimiento.'},
  {id:'primode',  date:'2026-07-31', ch:'call', name:'Primode Outlet', phone:'622 66 11 01', mob:true, note:'Outlet de moda — retomar y presentar la propuesta.'},
  {id:'diksi',    date:'2026-07-31', ch:'call', name:'Diksi by Amaya', note:'Moda — retomar contacto.'},

  /* ===== JUEVES 6 AGO ===== */
  {id:'ropa617',  date:'2026-08-06', ch:'call', tag:'Jue 6 ago', name:'Tienda de ropa (jefa)', phone:'617 73 20 12', mob:true, note:'Llamar POR LA MAÑANA. Preguntar por la JEFA (es quien decide) y presentar la propuesta.'},
];

const KEY='widy-seguimientos-done-v1';
let done = new Set(JSON.parse(localStorage.getItem(KEY) || '[]'));
const save = () => localStorage.setItem(KEY, JSON.stringify([...done]));

const intl = p => '34' + p.replace(/\D/g,'');
const svgWa = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.5 14.4c-.3-.15-1.7-.84-1.96-.93-.26-.1-.45-.15-.64.15-.19.29-.74.93-.9 1.12-.17.19-.33.21-.62.07-.29-.15-1.22-.45-2.33-1.44-.86-.77-1.44-1.72-1.6-2-.17-.3-.02-.45.13-.6.13-.13.29-.34.44-.5.15-.17.19-.29.29-.48.1-.19.05-.36-.02-.5-.08-.15-.64-1.55-.88-2.12-.23-.55-.47-.48-.64-.49l-.55-.01c-.19 0-.5.07-.76.36-.26.29-1 .98-1 2.38s1.02 2.76 1.17 2.95c.15.19 2.02 3.08 4.9 4.32.68.3 1.22.47 1.63.6.69.22 1.31.19 1.8.11.55-.08 1.7-.69 1.94-1.36.24-.67.24-1.24.17-1.36-.07-.12-.26-.19-.55-.34z M12.04 2C6.58 2 2.13 6.45 2.13 11.9c0 1.75.46 3.45 1.32 4.95L2 22l5.3-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.9-4.45 9.9-9.9C21.94 6.45 17.5 2 12.04 2z"/></svg>';
const svgCall = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.5.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C10.6 21 3 13.4 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.2.2 2.4.6 3.5.1.4 0 .8-.3 1l-2.2 2.3z"/></svg>';

const leadIso = x => x.date || null;
const isOverdue = x => { const iso = leadIso(x); return !!iso && iso < TODAY_ISO && !done.has(x.id); };

// Cada tarjeta se coloca en la columna de su fecha real; si su fecha ya pasó y sigue
// pendiente, "sube" sola a la columna Hoy marcada como Atrasado (así nunca se pierde de vista).
const isoToKey = {}; DAYS.forEach(d=> isoToKey[d.iso] = d.key);
function bucketKeyFor(x){
  const iso = leadIso(x);
  if(!iso) return DAYS[0].key;
  if(isoToKey[iso]) return isoToKey[iso];
  if(iso < TODAY_ISO) return DAYS[0].key;
  return null; // fuera de la ventana visible del kanban (sigue disponible en el calendario mensual)
}

const board = document.getElementById('board');

DAYS.forEach(day=>{
  const col = document.createElement('section');
  col.className = 'col' + (day.today ? ' is-today':'');
  col.dataset.day = day.key;
  col.innerHTML = `<div class="col-head">
      <div><span class="col-day">${day.label}</span> <span class="col-date">${day.date}</span></div>
      <span class="col-count" data-count="${day.key}"></span>
    </div>`;
  D.filter(x=>bucketKeyFor(x)===day.key).forEach(x=> col.appendChild(cardEl(x)));
  board.appendChild(col);
});

function cardEl(x){
  const el = document.createElement('article');
  el.className = 'card' + (x.hot?' hot':'') + (done.has(x.id)?' done':'');
  el.dataset.ch = x.ch; el.dataset.id = x.id; el.dataset.hot = x.hot?'1':'0';
  el.dataset.cierre = (x.tag==='Cierre')?'1':'0';

  const chLabel = x.ch==='call'?'Llamada':x.ch==='wa'?'WhatsApp':x.ch==='meet'?'Reunión':'Tarea';
  const badgeTxt = x.tag || (x.hot?'Interesada':'');
  const badge = badgeTxt ? `<span class="badge ${x.hot?'hot':'tag'}">${badgeTxt}</span>` : '';
  const overdueBadge = isOverdue(x) ? `<span class="badge overdue">Atrasado</span>` : '';
  const time = x.time ? `<span class="time">⏰ ${x.time}</span>` : '';

  let acts = '';
  if(x.phone){
    const n = intl(x.phone);
    acts += `<a class="btn call" href="tel:+${n}"><span>${svgCall}</span> Llamar <span class="ph">${x.phone}</span></a>`;
    if(x.mob) acts += `<a class="btn wa" href="https://wa.me/${n}" target="_blank" rel="noopener"><span>${svgWa}</span> WhatsApp</a>`;
  }

  el.innerHTML = `
    <div class="card-top">
      <input class="cbox" type="checkbox" ${done.has(x.id)?'checked':''} aria-label="Marcar ${x.name} como hecho">
      <div class="who">
        <div class="name">${x.name}${badge}${overdueBadge}</div>
        ${x.note?`<div class="note">${x.note}</div>`:''}
        <div class="meta" style="margin-top:6px">
          ${time}
          <span class="chn"><span class="dot"></span>${chLabel}</span>
        </div>
      </div>
    </div>
    ${acts?`<div class="actions">${acts}</div>`:''}`;

  el.querySelector('.cbox').addEventListener('change', e=>{
    if(e.target.checked){ done.add(x.id); el.classList.add('done'); }
    else { done.delete(x.id); el.classList.remove('done'); }
    save(); refresh(); if(window.refreshMonthly) window.refreshMonthly();
  });
  return el;
}

let filter='all';
const filters = document.getElementById('filters');
filters.addEventListener('click', e=>{
  const b = e.target.closest('.chip'); if(!b) return;
  if(b.id==='hideDone'){
    const on = b.getAttribute('aria-pressed')==='true';
    b.setAttribute('aria-pressed', String(!on));
    board.classList.toggle('hide-done', !on);
    return;
  }
  filter = b.dataset.filter;
  [...filters.querySelectorAll('.chip[data-filter]')].forEach(c=>
    c.setAttribute('aria-pressed', String(c===b)));
  applyFilter();
});

function applyFilter(){
  document.querySelectorAll('.card').forEach(c=>{
    let show = filter==='all'
      || (filter==='hot' && c.dataset.hot==='1')
      || (c.dataset.ch===filter);
    c.classList.toggle('filtered', !show);
  });
  document.querySelectorAll('.col').forEach(col=>{
    const any = [...col.querySelectorAll('.card')].some(c=>!c.classList.contains('filtered'));
    col.classList.toggle('empty', !any);
  });
}

function refresh(){
  const total = D.length, d = done.size;
  document.getElementById('doneN').textContent = d;
  document.getElementById('leftN').textContent = total - d;
  document.getElementById('totalN').textContent = total;
  document.getElementById('fill').style.width = (d/total*100)+'%';
  DAYS.forEach(day=>{
    const items = D.filter(x=>bucketKeyFor(x)===day.key);
    const left = items.filter(x=>!done.has(x.id)).length;
    const cc = document.querySelector(`[data-count="${day.key}"]`);
    if(cc) cc.textContent = left ? `${left} por hacer` : '✓ hecho';
  });
  const cnt = f => f==='all'?D.length : f==='hot'?D.filter(x=>x.hot).length : D.filter(x=>x.ch===f).length;
  document.getElementById('c-all').textContent = cnt('all');
  document.getElementById('c-call').textContent = cnt('call');
  document.getElementById('c-wa').textContent = cnt('wa');
  document.getElementById('c-hot').textContent = cnt('hot');
}

// Ocultar los hechos por defecto (los que marcaste como hechos desaparecen solos)
board.classList.add('hide-done');
const hideBtn = document.getElementById('hideDone');
if (hideBtn) hideBtn.setAttribute('aria-pressed', 'true');

/* ================= SEGUIMIENTO MENSUAL + CALENDARIO ================= */
const MONTHS = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
const WD = ['domingo','lunes','martes','miércoles','jueves','viernes','sábado'];
const isoOf = (y,m,d) => `${y}-${pad(m+1)}-${pad(d)}`;

const _today = new Date();
let viewY = _today.getFullYear(), viewM = _today.getMonth(), selIso = TODAY_ISO;

function leadsByIso(){
  const m = {};
  D.forEach(x=>{ const k = leadIso(x); if(!k) return; (m[k] = m[k]||[]).push(x); });
  return m;
}

function renderStats(){
  const prefix = `${viewY}-${pad(viewM+1)}`;
  const inMonth = D.filter(x=>{ const k = leadIso(x); return k && k.startsWith(prefix); });
  const cnt = f => inMonth.filter(f).length;
  const dn = cnt(x=>done.has(x.id));
  const tiles = [
    {n:inMonth.length, l:'Contactos'},
    {n:cnt(x=>x.ch==='meet'), l:'Reuniones', c:'meet'},
    {n:cnt(x=>x.ch==='call' && !done.has(x.id)), l:'Llamadas por hacer', c:'call'},
    {n:cnt(x=>x.ch==='wa' && !done.has(x.id)), l:'WhatsApp', c:'wa'},
    {n:cnt(x=>x.hot), l:'Calientes', c:'hot'},
    {n:`${dn}/${inMonth.length||0}`, l:'Cerrados'},
  ];
  document.getElementById('stats').innerHTML = tiles.map(t=>`
    <div class="stat${t.c?' st-'+t.c:''}">
      <div class="stat-n">${t.n}</div>
      <div class="stat-l">${t.l}</div>
    </div>`).join('');
}

function renderCal(){
  document.getElementById('calTitle').textContent = `${MONTHS[viewM]} ${viewY}`;
  const map = leadsByIso();
  const daysInMonth = new Date(viewY, viewM+1, 0).getDate();
  const startDow = (new Date(viewY, viewM, 1).getDay()+6)%7; // Lunes=0
  const cells = ['L','M','X','J','V','S','D'].map(w=>`<div class="cal-dow">${w}</div>`);
  for(let i=0;i<startDow;i++) cells.push('<div class="cal-cell is-empty"></div>');
  for(let d=1; d<=daysInMonth; d++){
    const iso = isoOf(viewY, viewM, d);
    const items = map[iso] || [];
    const pend = items.filter(x=>!done.has(x.id)).length;
    const dots = [...new Set(items.map(x=>x.ch))].map(c=>`<i class="cdot ${c}"></i>`).join('');
    const cls = ['cal-cell'];
    if(items.length) cls.push('has');
    if(iso===TODAY_ISO) cls.push('today');
    if(iso===selIso) cls.push('sel');
    if(items.some(x=>x.hot)) cls.push('hot');
    cells.push(`<button class="${cls.join(' ')}" data-iso="${iso}">
        <span class="cnum">${d}</span>
        ${items.length?`<span class="cbadge">${pend||'✓'}</span>`:''}
        <span class="cdots">${dots}</span>
      </button>`);
  }
  document.getElementById('calGrid').innerHTML = cells.join('');
}

function ddRow(x){
  const ch = x.ch==='call'?'Llamada':x.ch==='wa'?'WhatsApp':x.ch==='meet'?'Reunión':'Tarea';
  let acts = '';
  if(x.phone){
    const n = intl(x.phone);
    acts += `<a class="btn call" href="tel:+${n}"><span>${svgCall}</span> Llamar</a>`;
    if(x.mob) acts += `<a class="btn wa" href="https://wa.me/${n}" target="_blank" rel="noopener"><span>${svgWa}</span> WhatsApp</a>`;
  }
  return `<div class="dd-row ch-${x.ch}${x.tag==='Cierre'?' cierre':''}${x.hot?' hot':''}${done.has(x.id)?' done':''}">
     <div class="dd-main">
       <div class="dd-name">${x.time?`<b class="dd-time">${x.time}</b> `:''}${x.name}${x.tag?`<span class="badge tag">${x.tag}</span>`:''}</div>
       ${x.note?`<div class="dd-note">${x.note}</div>`:''}
       <div class="dd-ch"><span class="dot ch-${x.ch}"></span>${ch}</div>
     </div>
     ${acts?`<div class="dd-acts">${acts}</div>`:''}
   </div>`;
}

function renderDetail(){
  const map = leadsByIso();
  const items = (map[selIso]||[]).slice().sort((a,b)=>(a.time||'99:99').localeCompare(b.time||'99:99'));
  const [Y,M,Dn] = selIso.split('-').map(Number);
  const wd = WD[new Date(Y, M-1, Dn).getDay()];
  const title = `${wd.charAt(0).toUpperCase()+wd.slice(1)} ${Dn} de ${MONTHS[M-1]}`;
  const el = document.getElementById('dayDetail');
  if(!items.length){
    el.innerHTML = `<div class="dd-head"><b>${title}</b><span class="dd-count">Sin seguimientos</span></div>
      <div class="dd-empty">Nada agendado este día. Pulsa un día marcado en el calendario.</div>`;
    return;
  }
  el.innerHTML = `<div class="dd-head"><b>${title}</b><span class="dd-count">${items.length} contacto${items.length>1?'s':''}</span></div>
    <div class="dd-list">${items.map(ddRow).join('')}</div>`;
}

function refreshMonthly(){ renderStats(); renderCal(); renderDetail(); }
window.refreshMonthly = refreshMonthly;

document.getElementById('calGrid').addEventListener('click', e=>{
  const b = e.target.closest('.cal-cell'); if(!b || !b.dataset.iso) return;
  selIso = b.dataset.iso; renderCal(); renderDetail();
});
document.getElementById('calPrev').onclick = ()=>{ if(--viewM<0){viewM=11;viewY--;} refreshMonthly(); };
document.getElementById('calNext').onclick = ()=>{ if(++viewM>11){viewM=0;viewY++;} refreshMonthly(); };
document.getElementById('calToday').onclick = ()=>{ const n=new Date(); viewY=n.getFullYear(); viewM=n.getMonth(); selIso=TODAY_ISO; refreshMonthly(); };

refresh();
refreshMonthly();

/* ===== Facturación · camino a 10.000 € ===== */
const GOAL = 10000;
const COBROS = [
  {day:'Lun 27', cli:'', amt:100},
  {day:'Mar 28', cli:'La Boutique', amt:175},
  {day:'Mié 29', cli:'Ana María', amt:225},
  {day:'Mié 29', cli:'Lunares', amt:350},
];
(function(){
  const list = document.getElementById('factList');
  if(!list) return;
  const eur = n => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.') + ' €';
  const total = COBROS.reduce((s,c)=>s+c.amt,0);
  const pct = Math.min(100, total/GOAL*100);
  const set = (id,v)=>{ const el=document.getElementById(id); if(el) el.textContent=v; };
  set('factTotal', eur(total));
  set('factPct', (Math.round(pct*10)/10).toLocaleString('es-ES')+'%');
  set('factLeft', eur(Math.max(0, GOAL-total)));
  set('factCount', COBROS.length + (COBROS.length===1?' cobro':' cobros'));
  const fill = document.getElementById('factFill');
  if(fill) requestAnimationFrame(()=>{ fill.style.width = pct+'%'; });
  list.innerHTML = COBROS.map(c=>
    `<li class="fact-row"><span class="fact-day">${c.day}</span><span class="fact-cli">${c.cli||'—'}</span><span class="fact-amt">+${eur(c.amt)}</span></li>`
  ).join('');
})();
