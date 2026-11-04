/* PlusAuto Motor — app.js (común a todas las páginas) */
(function(){
'use strict';
const S = window.STOCK || [];
const WA_NUM = '34624078107';
const TEL = '+34624078107';

/* ---------- iconos (Lucide-like, inline SVG) ---------- */
const svg = (p, cls='') => `<svg class="i ${cls}" viewBox="0 0 24 24" aria-hidden="true">${p}</svg>`;
const I = {
  search: svg('<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>'),
  spark: svg('<path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z"/><path d="M19 16l.9 2.1L22 19l-2.1.9L19 22l-.9-2.1L16 19l2.1-.9z"/>'),
  bolt: svg('<path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/>'),
  car: svg('<path d="M3 13l2.5-6h13L21 13"/><path d="M2 13h20v5H2z"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/>'),
  moto: svg('<circle cx="5.5" cy="17" r="3.5"/><circle cx="18.5" cy="17" r="3.5"/><path d="M14 6h3.5l3 5.5M5.5 17 9.5 9.5h4l2.5 5h2.5M9.5 9.5 8 6h3"/>'),
  gauge: svg('<path d="M12 14l3.5-3.5"/><path d="M20.5 15.5A9 9 0 1 0 3.5 15.5"/>'),
  calendar: svg('<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>'),
  fuel: svg('<path d="M3 22V6a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v16M3 22h10M6 12h4"/><path d="M13 9h2a2 2 0 0 1 2 2v6a1.5 1.5 0 0 0 3 0V8l-2-2"/>'),
  gear: svg('<circle cx="6" cy="5" r="2"/><circle cx="12" cy="5" r="2"/><circle cx="18" cy="5" r="2"/><path d="M6 7v12M12 7v12M18 7v5H6"/>'),
  shield: svg('<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/>'),
  check: svg('<path d="m5 12 5 5L20 7"/>'),
  wa: svg('<path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2z"/><path d="M9 8.5c.2-.5.4-.5.7-.5h.5c.2 0 .4 0 .6.4l.8 1.9c.1.2.1.4 0 .6l-.5.6c-.1.2-.2.3 0 .6.5.9 1.4 1.8 2.4 2.3.3.1.4.1.6-.1l.7-.8c.2-.2.4-.2.6-.1l1.8.9c.3.1.4.2.4.4 0 .5-.2 1.4-.9 1.8-.6.4-1.3.5-2.3.2-2.4-.8-4.3-2.7-5.2-5-.4-1-.3-2 .1-2.6z"/>'),
  phone: svg('<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z"/>'),
  mail: svg('<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m2 7 10 7 10-7"/>'),
  pin: svg('<path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="3"/>'),
  clock: svg('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'),
  arrow: svg('<path d="M5 12h14M13 6l6 6-6 6"/>'),
  chevR: svg('<path d="m9 6 6 6-6 6"/>'), chevL: svg('<path d="m15 6-6 6 6 6"/>'), chevD: svg('<path d="m6 9 6 6 6-6"/>'),
  heart: svg('<path d="M19.5 12.6 12 20l-7.5-7.4a4.5 4.5 0 0 1 6.4-6.4L12 7.3l1.1-1.1a4.5 4.5 0 0 1 6.4 6.4z"/>'),
  share: svg('<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4"/>'),
  x: svg('<path d="M18 6 6 18M6 6l12 12"/>'),
  sliders: svg('<path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6"/>'),
  star: svg('<path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z"/>'),
  battery: svg('<rect x="2" y="7" width="16" height="10" rx="2"/><path d="M22 11v2M6 10v4M10 10v4M14 10v4"/>'),
  key: svg('<circle cx="7.5" cy="15.5" r="4.5"/><path d="m21 2-9.6 9.6M15.5 7.5l3 3M18.5 4.5l3 3"/>'),
  tag: svg('<path d="M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L2 12V2h10l8.6 8.6a2 2 0 0 1 0 2.8z"/><circle cx="7" cy="7" r="1.5"/>'),
  truck: svg('<path d="M14 18V6H2v12h12zm0-8h4l4 4v4h-8"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/>'),
  euro: svg('<path d="M4 10h12M4 14h9M19 6a7 7 0 1 0 0 12"/>'),
  menu: svg('<path d="M4 7h16M4 12h16M4 17h16"/>'),
  plus: svg('<path d="M12 5v14M5 12h14"/>'),
  route: svg('<circle cx="6" cy="19" r="3"/><circle cx="18" cy="5" r="3"/><path d="M8.5 17.5 15.5 6.5"/>'),
  leaf: svg('<path d="M11 20A7 7 0 0 1 4 13c0-7 7-9 16-10-1 9-3 16-9 17z"/><path d="M4 20c3-4 6-7 12-11"/>'),
  seats: svg('<path d="M5 11V6a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v5"/><path d="M4 11h16v5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-5zM7 18v2M17 18v2"/>'),
  palette: svg('<path d="M12 3a9 9 0 0 0 0 18c1.2 0 2-.8 2-1.8 0-.5-.2-.9-.5-1.3-.3-.4-.5-.8-.5-1.3 0-1 .8-1.8 1.8-1.8H17a4 4 0 0 0 4-4c0-4.4-4-7.8-9-7.8z"/><circle cx="7.5" cy="10.5" r="1"/><circle cx="12" cy="7.5" r="1"/><circle cx="16.5" cy="10.5" r="1"/>'),
  info: svg('<circle cx="12" cy="12" r="9"/><path d="M12 8h.01M11 12h1v4h1"/>'),
  wrench: svg('<path d="M14.7 6.3a4 4 0 0 0 5 5L22 9l-1-4-3 1-2-2 1-3-4-1-2.3 2.3a4 4 0 0 0 0 5.7L3 17l4 4 7.7-7.7z"/>'),
  ig: svg('<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor"/>'),
  tiktok: svg('<path d="M16 3c.4 2.5 2 4 4.5 4.3v3.2c-1.7 0-3.2-.5-4.5-1.4v6.4a5.5 5.5 0 1 1-5.5-5.5c.3 0 .7 0 1 .1v3.3a2.3 2.3 0 1 0 1.3 2.1V3H16z"/>'),
  fb: svg('<path d="M14 8h3V4h-3a4 4 0 0 0-4 4v2H7v4h3v8h4v-8h3l1-4h-4V8z"/>'),
  zap: svg('<path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/>'),
  home: svg('<path d="m3 11 9-8 9 8v9a2 2 0 0 1-2 2h-4v-6h-6v6H5a2 2 0 0 1-2-2z"/>'),
  eye: svg('<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>'),
  filter: svg('<path d="M3 5h18l-7 8v6l-4 2v-8z"/>'),
  cmp: svg('<path d="M12 3v18M3 7h18M5 7l-3 7a3 3 0 0 0 6 0L5 7zm14 0-3 7a3 3 0 0 0 6 0l-3-7z"/>'),
  print: svg('<path d="M6 9V3h12v6M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="7"/>'),
  camera: svg('<path d="M4 8h3l2-3h6l2 3h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z"/><circle cx="12" cy="13" r="3.5"/>'),
  user: svg('<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>'),
  send: svg('<path d="m22 2-7 20-4-9-9-4z"/><path d="M22 2 11 13"/>'),
  doc: svg('<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6M8 13h8M8 17h6"/>'),
  trash: svg('<path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14"/>'),
  bike2: svg('<circle cx="5.5" cy="17" r="3.5"/><circle cx="18.5" cy="17" r="3.5"/><path d="M14 6h3.5l3 5.5M5.5 17 9.5 9.5h4l2 5h3.5M9.5 9.5 8 6h3"/>'),
  sun: svg('<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>'),
  moon: svg('<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>'),
  play: svg('<path d="M6 4l14 8-14 8z"/>'),
};

/* ---------- tema oscuro / claro ---------- */
const THEME_KEY='pa_tema';
function applyTheme(t){ if(t==='dark') document.documentElement.setAttribute('data-theme','dark'); else document.documentElement.removeAttribute('data-theme'); try{ localStorage.setItem(THEME_KEY,t); }catch(e){} const m=document.querySelector('meta[name=theme-color]'); if(m) m.content = t==='dark' ? '#0B0F19' : '#FFFFFF'; }
function initTheme(){
  const q=new URLSearchParams(location.search).get('tema');
  let t=null; try{ t=localStorage.getItem(THEME_KEY); }catch(e){}
  if(q==='claro') t='light'; else if(q==='oscuro') t='dark';
  if(t) applyTheme(t);
  const flip=()=>{ const cur=document.documentElement.getAttribute('data-theme')==='dark'?'dark':'light'; applyTheme(cur==='dark'?'light':'dark'); toast(cur==='dark'?'Fondo claro':'Fondo oscuro'); };
  ['themeBtn','themeBtn2'].forEach(id=>{ const b=document.getElementById(id); if(b) b.addEventListener('click',flip); });
}

/* ---------- cabecera y pie comunes ---------- */
const NAV=[['/ejemplos/plusauto-web-widy/vehiculos','Vehículos'],['/ejemplos/plusauto-web-widy/motos','Motos eléctricas','nav__hl'],['/ejemplos/plusauto-web-widy/financiacion','Financiación'],['/ejemplos/plusauto-web-widy/tasacion','Tasación'],['/ejemplos/plusauto-web-widy/taller','Taller'],['/ejemplos/plusauto-web-widy/contacto','Contacto']];
const DRAWER=[['/','Inicio'],['/ejemplos/plusauto-web-widy/vehiculos','Todos los vehículos'],['/ejemplos/plusauto-web-widy/motos','Motos eléctricas'],['/ejemplos/plusauto-web-widy/vehiculos?tipo=coche','Coches de ocasión'],['/ejemplos/plusauto-web-widy/comparar','Comparador'],['/ejemplos/plusauto-web-widy/financiacion','Financiación'],['/ejemplos/plusauto-web-widy/tasacion','Tasación · vende tu coche'],['/ejemplos/plusauto-web-widy/coches-a-la-carta','Coches a la carta'],['/ejemplos/plusauto-web-widy/taller','Taller y cita'],['/ejemplos/plusauto-web-widy/servicios','Servicios'],['/ejemplos/plusauto-web-widy/contacto','Contacto']];
function renderChrome(){
  const h=document.getElementById('siteHeader'), f=document.getElementById('siteFooter');
  const brand=`<a class="brand" href="/ejemplos/plusauto-web-widy/" aria-label="PlusAuto Motor, inicio"><img class="brand__logo brand__logo--dark" src="/ejemplos/plusauto-web-widy/img/logo-blanco.png" alt="" width="38" height="47"><img class="brand__logo brand__logo--light" src="/ejemplos/plusauto-web-widy/img/logo-negro.png" alt="" width="38" height="47"><span class="brand__name">PLUSAUTO <b>MOTOR</b></span></a>`;
  if(h) h.innerHTML=`<a class="skip" href="#main">Saltar al contenido</a>
<header class="nav"><div class="wrap nav__in">${brand}
<nav class="nav__links" aria-label="Principal">${NAV.map(([u,t,c])=>`<a href="${u}"${c?` class="${c}"`:''}>${t}</a>`).join('')}</nav>
<div class="nav__cta"><button class="theme-btn" id="themeBtn" type="button" aria-label="Cambiar entre fondo oscuro y claro" title="Oscuro / claro">${I.sun.replace('class="i','class="i i--sun')}${I.moon.replace('class="i','class="i i--moon')}</button><a class="btn btn--ghost btn--icon" data-tel href="#" aria-label="Llamar al 624 078 107">${I.phone}</a><a class="btn btn--wa btn--sm" data-wa href="#">${I.wa}WhatsApp</a><button class="burger" id="burger" aria-label="Abrir menú" type="button">${I.menu}</button></div></div></header>
<div class="drawer" id="drawer"><div class="drawer__bg"></div><div class="drawer__panel" role="dialog" aria-label="Menú"><button class="drawer__close" type="button" aria-label="Cerrar menú">${I.x}</button>${DRAWER.map(([u,t])=>`<a href="${u}">${t} ${I.chevR}</a>`).join('')}<div class="drawer__foot"><button type="button" class="drawer__theme" id="themeBtn2"><span>Fondo claro / oscuro</span>${I.sun.replace('class="i','class="i i--sun')}${I.moon.replace('class="i','class="i i--moon')}</button><a class="btn btn--wa" data-wa href="#">${I.wa}Escríbenos por WhatsApp</a><a class="btn btn--ghost" data-tel href="#">${I.phone}624 078 107</a></div></div></div>`;
  const page=document.body.dataset.page;
  const third = page==='catalogo' ? `<a class="bar__main" href="/ejemplos/plusauto-web-widy/">${I.home}Inicio</a>` : `<a class="bar__main" href="/ejemplos/plusauto-web-widy/vehiculos">${I.search}Buscar</a>`;
  if(f) f.innerHTML=`<footer class="footer"><div class="wrap footer__in">
<div>${brand}<p style="margin-top:14px;max-width:34ch">Motos eléctricas y coches de ocasión revisados y garantizados en Dos Hermanas (Sevilla). Distribuidor oficial Silence.</p><div class="social"><a href="https://www.instagram.com/plusautomotor/" target="_blank" rel="noopener" aria-label="Instagram">${I.ig}</a><a href="https://www.tiktok.com/@plusauto.motor/" target="_blank" rel="noopener" aria-label="TikTok">${I.tiktok}</a><a href="https://www.facebook.com/plusautomotor/" target="_blank" rel="noopener" aria-label="Facebook">${I.fb}</a></div></div>
<div><h4>Vehículos</h4><ul><li><a href="/ejemplos/plusauto-web-widy/motos">Motos eléctricas</a></li><li><a href="/ejemplos/plusauto-web-widy/vehiculos?tipo=coche">Coches de ocasión</a></li><li><a href="/ejemplos/plusauto-web-widy/vehiculos?kmMax=100">Km 0 y nuevos</a></li><li><a href="/ejemplos/plusauto-web-widy/vehiculos?carroceria=SUV">SUV</a></li><li><a href="/ejemplos/plusauto-web-widy/vehiculos?cambio=Automático">Automáticos</a></li><li><a href="/ejemplos/plusauto-web-widy/comparar">Comparador</a></li></ul></div>
<div><h4>Servicios</h4><ul><li><a href="/ejemplos/plusauto-web-widy/financiacion">Financiación</a></li><li><a href="/ejemplos/plusauto-web-widy/tasacion">Tasación y compra</a></li><li><a href="/ejemplos/plusauto-web-widy/taller">Taller · pedir cita</a></li><li><a href="/ejemplos/plusauto-web-widy/coches-a-la-carta">Coches a la carta</a></li><li><a href="/ejemplos/plusauto-web-widy/servicios">Todos los servicios</a></li></ul></div>
<div><h4>Contacto</h4><ul><li>Av. Cristóbal Colón, 39<br>41701 Dos Hermanas (Sevilla)</li><li><a data-tel href="#">624 078 107</a></li><li><a href="mailto:info@plusauto.net">info@plusauto.net</a></li><li>Lunes a viernes, 9:00 – 19:00</li><li><span class="hours-badge" id="openNowFooter"><span class="dot"></span>Horario</span></li></ul></div></div>
<div class="wrap footer__bottom"><span>© 2026 PlusAuto Motor</span><span><a href="/ejemplos/plusauto-web-widy/legal#aviso">Aviso legal</a> · <a href="/ejemplos/plusauto-web-widy/legal#privacidad">Privacidad</a> · <a href="/ejemplos/plusauto-web-widy/legal#cookies">Cookies</a></span></div></footer>
<nav class="bar" aria-label="Acciones rápidas"><a data-tel href="#">${I.phone}Llamar</a><a class="bar__wa" data-wa href="#">${I.wa}WhatsApp</a>${third}</nav>`;
  // datos estructurados del concesionario (SEO)
  const ld={"@context":"https://schema.org","@type":"AutoDealer","name":"PlusAuto Motor","telephone":"+34624078107","email":"info@plusauto.net","url":"https://plusauto.net","address":{"@type":"PostalAddress","streetAddress":"Avenida Cristóbal Colón, 39","postalCode":"41701","addressLocality":"Dos Hermanas","addressRegion":"Sevilla","addressCountry":"ES"},"openingHours":"Mo-Fr 09:00-19:00","sameAs":["https://www.instagram.com/plusautomotor/","https://www.tiktok.com/@plusauto.motor/","https://www.facebook.com/plusautomotor/"]};
  const s=document.createElement('script'); s.type='application/ld+json'; s.textContent=JSON.stringify(ld); document.head.appendChild(s);
}

/* ---------- comparador ---------- */
const CMP_KEY='pa_cmp';
function getCmp(){ try{ return JSON.parse(localStorage.getItem(CMP_KEY)||'[]').filter(id=>byId(id)); }catch(e){ return []; } }
function setCmp(a){ try{ localStorage.setItem(CMP_KEY,JSON.stringify(a)); }catch(e){} renderCmpBar(); document.dispatchEvent(new CustomEvent('pa:cmp',{detail:a})); }
function toggleCmp(id){ const c=getCmp(); const i=c.indexOf(id); if(i>=0) c.splice(i,1); else { if(c.length>=3){ toast('Puedes comparar hasta 3 vehículos'); return false; } c.push(id); } setCmp(c); return i<0; }
function bindCmp(root=document){
  $$('[data-cmp]',root).forEach(b=>{ if(b.dataset.boundc) return; b.dataset.boundc='1'; b.classList.toggle('on',getCmp().includes(b.dataset.cmp)); b.addEventListener('click',e=>{ e.preventDefault(); e.stopPropagation(); const on=toggleCmp(b.dataset.cmp); if(on===false) return; $$(`[data-cmp="${b.dataset.cmp}"]`).forEach(x=>x.classList.toggle('on',on)); toast(on?'Añadido al comparador':'Quitado del comparador'); }); });
}
function renderCmpBar(){
  let bar=document.getElementById('cmpbar'); const c=getCmp();
  if(!c.length || document.body.dataset.page==='comparar'){ if(bar) bar.remove(); return; }
  if(!bar){ bar=document.createElement('div'); bar.id='cmpbar'; bar.className='cmpbar'; document.body.appendChild(bar); }
  bar.innerHTML=`<div class="cmpbar__imgs">${c.map(id=>`<img src="${byId(id).fotos[0]}" alt="">`).join('')}</div><a class="btn btn--primary btn--sm" href="/ejemplos/plusauto-web-widy/comparar">${I.cmp}Comparar (${c.length})</a><button type="button" class="cmpbar__x" aria-label="Vaciar comparador">${I.x}</button>`;
  $('.cmpbar__x',bar).addEventListener('click',()=>{ setCmp([]); $$('[data-cmp]').forEach(x=>x.classList.remove('on')); });
}

/* ---------- vistos recientemente ---------- */
const VIS_KEY='pa_vistos';
function getVistos(){ try{ return JSON.parse(localStorage.getItem(VIS_KEY)||'[]').filter(id=>byId(id)); }catch(e){ return []; } }
function addVisto(id){ const v=getVistos().filter(x=>x!==id); v.unshift(id); try{ localStorage.setItem(VIS_KEY,JSON.stringify(v.slice(0,8))); }catch(e){} }

/* ---------- formularios → WhatsApp ---------- */
function bindWaForm(form, build, okSel){
  if(!form) return;
  form.addEventListener('submit',e=>{
    e.preventDefault();
    if(!form.checkValidity()){ form.reportValidity(); return; }
    const d=Object.fromEntries(new FormData(form).entries());
    const msg=build(d);
    const ok=okSel?$(okSel):null;
    if(ok){ ok.classList.remove('hide'); const a=$('a[data-wa-out]',ok); if(a){ a.href=waLink(msg); } ok.scrollIntoView({behavior:'smooth',block:'nearest'}); }
    const sb=form.querySelector('button[type=submit]'); if(sb){ sb.disabled=true; sb.innerHTML=`${I.check} Enviado`; }
    window.open(waLink(msg),'_blank','noopener');
    toast('Te abrimos WhatsApp con la solicitud lista');
  });
}
function openNowBadge(el){
  if(!el) return; const d=new Date(), day=d.getDay(), h=d.getHours()+d.getMinutes()/60; const open=day>=1&&day<=5&&h>=9&&h<19;
  let txt='Abierto ahora · hasta las 19:00';
  if(!open){ const next=(day>=1&&day<=5&&h<9)?'hoy a las 9:00':(day>=1&&day<=4)?'mañana a las 9:00':'el lunes a las 9:00'; txt=`Cerrado ahora · abrimos ${next}`; el.style.cssText='background:var(--warn-soft);color:var(--warn)'; }
  el.innerHTML=`<span class="dot"${open?'':' style="background:var(--warn);box-shadow:0 0 0 4px rgba(183,121,31,.2)"'}></span>${txt}`;
}
function initNavOver(){ if(document.body.dataset.page!=='home') return; const nav=$('.nav'); if(!nav) return; const upd=()=>nav.classList.toggle('nav--over',window.scrollY<40); upd(); addEventListener('scroll',upd,{passive:true}); }
function initReveal(){
  if(matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) return;
  const els=$$('.sec > .wrap > :not(.bento):not(.cats), .bento > *, .cats > *'); els.forEach(e=>e.classList.add('reveal'));
  const io=new IntersectionObserver(en=>en.forEach(x=>{ if(x.isIntersecting){ x.target.classList.add('in'); io.unobserve(x.target); } }),{rootMargin:'0px 0px -8% 0px',threshold:.05});
  els.forEach(e=>{ const r=e.getBoundingClientRect(); if(r.top<innerHeight) e.classList.add('in'); else io.observe(e); });
}
function initImgFade(){
  const mark=img=>{ if(img.classList.contains('ld')) return; img.classList.add('ld'); if(img.complete&&img.naturalWidth) img.classList.add('ok'); else { img.addEventListener('load',()=>img.classList.add('ok'),{once:true}); img.addEventListener('error',()=>img.classList.add('ok'),{once:true}); } };
  const scan=root=>$$('.card__media img, .mosaic__tile img, .feat__media img, .sold__item img, .cmp__head img',root).forEach(mark);
  scan(document);
  new MutationObserver(ms=>ms.forEach(m=>m.addedNodes.forEach(n=>{ if(n.nodeType===1) scan(n); }))).observe(document.body,{childList:true,subtree:true});
}
function initFaq(){ $$('.faq details').forEach(d=>{ d.addEventListener('toggle',()=>{ if(d.open) $$('.faq details').forEach(o=>{ if(o!==d && o.parentElement===d.parentElement) o.open=false; }); }); }); }

/* ---------- utils ---------- */
const fmt = n => Math.round(n).toLocaleString('de-DE'); /* de-DE agrupa siempre los miles con punto (es-ES deja 2990 sin punto) */
const eur = n => fmt(n) + ' €';
const norm = s => (s||'').toString().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'');
const compact = s => norm(s).replace(/[.\-\s_]/g,'');
const esc = s => (s||'').toString().replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const $ = (sel,root=document) => root.querySelector(sel);
const $$ = (sel,root=document) => Array.from(root.querySelectorAll(sel));
const debounce = (fn,ms) => { let t; return (...a)=>{ clearTimeout(t); t=setTimeout(()=>fn(...a),ms); }; };
const params = new URLSearchParams(location.search);

const TIN = 0.0799;
function cuota(precio, meses, entrada=0){ const P=Math.max(0,precio-entrada); const r=TIN/12; if(P<=0) return 0; return P*r/(1-Math.pow(1+r,-meses)); }
function mesesDe(v){ return v.tipo==='moto' ? 60 : (v.precio<8000 ? 72 : 96); }
function cuotaDe(v){ return cuota(v.precioFin||v.precio, mesesDe(v)); }
const byId = id => S.find(v=>v.id===id);
const disponibles = () => S.filter(v=>v.estado==='disponible');
const titulo = v => `${v.marca} ${v.modelo}`;
function waLink(text){ return `https://wa.me/${WA_NUM}?text=${encodeURIComponent(text)}`; }
function waVehiculo(v){ return waLink(`Hola PlusAuto, me interesa el ${titulo(v)} ${v.version||''} (${eur(v.precio)}) que he visto en la web. ¿Sigue disponible?`); }

/* ---------- favoritos ---------- */
const FAV_KEY='pa_favs';
function getFavs(){ try{ return JSON.parse(localStorage.getItem(FAV_KEY)||'[]'); }catch(e){ return []; } }
function setFavs(a){ try{ localStorage.setItem(FAV_KEY,JSON.stringify(a)); }catch(e){} }
function toggleFav(id){ const f=getFavs(); const i=f.indexOf(id); if(i>=0) f.splice(i,1); else f.push(id); setFavs(f); document.dispatchEvent(new CustomEvent('pa:favs',{detail:f})); return i<0; }
function bindFavs(root=document){
  $$('[data-fav]',root).forEach(b=>{
    if(b.dataset.bound) return; b.dataset.bound='1';
    b.classList.toggle('on', getFavs().includes(b.dataset.fav));
    b.addEventListener('click',e=>{ e.preventDefault(); e.stopPropagation(); const on=toggleFav(b.dataset.fav); $$(`[data-fav="${b.dataset.fav}"]`).forEach(x=>x.classList.toggle('on',on)); toast(on?'Guardado en favoritos':'Quitado de favoritos'); });
  });
}

/* ---------- toast ---------- */
let toastEl;
function toast(msg){ if(!toastEl){ toastEl=document.createElement('div'); toastEl.className='toast'; toastEl.setAttribute('role','status'); toastEl.setAttribute('aria-live','polite'); document.body.appendChild(toastEl);} toastEl.textContent=msg; toastEl.classList.add('show'); clearTimeout(toastEl._t); toastEl._t=setTimeout(()=>toastEl.classList.remove('show'),2600); }

/* ---------- tarjetas ---------- */
function badgesHTML(v){
  const b=[];
  if(v.estado==='vendido') b.push('<span class="badge badge--sold">Vendido</span>');
  if(v.combustible==='Eléctrico') b.push(`<span class="badge badge--acc">${I.bolt}Eléctrico</span>`);
  if(v.estado!=='vendido'){
    if(v.km<=100) b.push(`<span class="badge">${v.condicion==='Nuevo'?'Nuevo':'Km 0'}</span>`);
    else if(v.condicion==='Seminuevo') b.push('<span class="badge">Seminuevo</span>');
    else if(v.km<=30000) b.push('<span class="badge">Pocos km</span>');
  }
  if(v.silence) b.push('<span class="badge">Distribuidor oficial</span>');
  return b.join('');
}
function specsHTML(v){
  const s = v.tipo==='moto'
    ? [[I.route, v.autonomia+' km'],[I.gauge, v.velocidad+' km/h'],[I.key,'Carnet '+v.carnet],[I.battery, v.bateria]]
    : [[I.calendar, v.anio],[I.gauge, fmt(v.km)+' km'],[I.fuel, v.combustible],[I.gear, v.cambio]];
  return s.map(([i,t])=>`<span>${i}${esc(t)}</span>`).join('');
}
function cardHTML(v){
  const foto=v.fotos[0]||'';
  const fit=v.silence?' card__media--fit':'';
  const sold=v.estado==='vendido';
  return `<article class="card${sold?' card--sold':''}" data-id="${v.id}">
    <a class="card__link" href="/ejemplos/plusauto-web-widy/vehiculo?id=${v.id}" aria-label="${esc(titulo(v))} ${esc(v.version)}"></a>
    <div class="card__media${fit}">
      <img src="${foto}" alt="${esc(titulo(v))} ${esc(v.version)}" loading="lazy" width="800" height="600">
      <div class="card__badges">${badgesHTML(v)}</div>
      <button class="card__fav" data-fav="${v.id}" aria-label="Guardar en favoritos" type="button">${I.heart}</button>
      <button class="card__fav card__cmp" data-cmp="${v.id}" aria-label="Añadir al comparador" type="button" title="Comparar">${I.cmp}</button>
      ${v.fotos.length>1?`<span class="badge card__count">${I.eye}${v.fotos.length} fotos</span><button type="button" class="card__arrow card__arrow--l" data-dir="-1" aria-label="Foto anterior">${I.chevL}</button><button type="button" class="card__arrow card__arrow--r" data-dir="1" aria-label="Foto siguiente">${I.chevR}</button><div class="card__dots" aria-hidden="true">${v.fotos.slice(0,6).map((f,i)=>`<i class="${i===0?'on':''}"></i>`).join('')}</div>`:''}
    </div>
    <div class="card__body">
      <h3 class="card__title">${esc(titulo(v))}<small>${esc(v.version||'')}</small></h3>
      <div class="card__specs">${specsHTML(v)}</div>
      <div class="card__foot">
        <div class="price num">${eur(v.precio)}${sold?'':`<small>desde ${fmt(cuotaDe(v))} €/mes*</small>`}</div>
        <span class="card__cta" aria-hidden="true">${I.arrow}</span>
      </div>
    </div>
  </article>`;
}
function renderGrid(el, list, emptyHTML){
  if(!el) return;
  el.innerHTML = list.length ? list.map(cardHTML).join('') : (emptyHTML||'');
  bindFavs(el); bindCmp(el); bindCardSlides(el);
}
function bindCardSlides(root){
  $$('.card',root).forEach(card=>{
    const v=byId(card.dataset.id); if(!v||v.fotos.length<2) return;
    const img=$('.card__media img',card), dots=$$('.card__dots i',card); const n=Math.min(v.fotos.length,6); let i=0;
    const go=d=>{ i=(i+d+n)%n; img.src=v.fotos[i]; dots.forEach((x,j)=>x.classList.toggle('on',j===i)); };
    $$('.card__arrow',card).forEach(b=>b.addEventListener('click',e=>{ e.preventDefault(); e.stopPropagation(); go(+b.dataset.dir); }));
  });
}

/* ---------- búsqueda inteligente ---------- */
const NUM='(\\d{1,3}(?:[.,]\\d{3})+|\\d+(?:[.,]\\d+)?)\\s*(k|mil)?';
function toN(s,suf){ let n; if(/^\d{1,3}(?:[.,]\d{3})+$/.test(s)) n=parseInt(s.replace(/[.,]/g,''),10); else n=parseFloat(s.replace(',','.')); if(suf) n*=1000; return Math.round(n); }
const isYear = (n,suf)=> !suf && n>=1995 && n<=2027;
function lev(a,b){ const m=a.length,n=b.length; if(!m) return n; if(!n) return m; const d=[]; for(let i=0;i<=m;i++){ d[i]=[i]; } for(let j=1;j<=n;j++) d[0][j]=j; for(let i=1;i<=m;i++) for(let j=1;j<=n;j++) d[i][j]=Math.min(d[i-1][j]+1,d[i][j-1]+1,d[i-1][j-1]+(a[i-1]===b[j-1]?0:1)); return d[m][n]; }
function fuzzyEq(tok,target){ if(tok===target) return true; if(tok.length<4||target.length<4) return false; const tol = target.length>=7 ? 2 : 1; return lev(tok,target)<=tol; }

const TIPO={moto:['moto','motos','scooter','scooters','ciclomotor','ciclomotores','motocicleta','motocicletas','maxiscooter','vespa','motillo'],coche:['coche','coches','turismo','turismos','automovil','automoviles','carro','furgoneta','furgonetas','todoterrenos']};
const COMB={'Gasolina':['gasolina','gasolinas'],'Diésel':['diesel','gasoil','gasoleo','tdi','dci','crdi','hdi'],'Híbrido':['hibrido','hibrida','hibridos','hibridas','hybrid','mhev','hev','ecohibrido'],'Híbrido enchufable':['enchufable','enchufables','phev','plugin'],'Eléctrico':['electrico','electrica','electricos','electricas','ev','bev','electric']};
const CAMBIO={'Automático':['automatico','automatica','automaticos','automaticas','automatic','dsg','cvt','dct','secuencial'],'Manual':['manual','manuales']};
const CARR={'SUV':['suv','suvs','todoterreno','4x4','crossover','todocamino','todocaminos'],'Compacto':['compacto','compactos','pequeno','pequena','pequenos','utilitario','utilitarios','berlina','hatchback'],'Maxi scooter':['maxiscooter'],'Naked':['naked','deportiva']};
const COLORES={'Blanco':['blanco','blanca'],'Negro':['negro','negra'],'Gris':['gris','plata','plateado','plateada'],'Azul':['azul'],'Rojo':['rojo','roja'],'Verde':['verde'],'Marrón':['marron'],'Menta':['menta']};
const OTRAS_MARCAS=['Mercedes','BMW','Audi','Tesla','Honda','Yamaha','Peugeot','Citroën','Fiat','Skoda','Mazda','Lexus','Cupra','Suzuki','Kawasaki','Ducati','Vespa','Piaggio','Volvo','MG','BYD','Omoda','Smart','Land Rover','Alfa Romeo','Mitsubishi','Subaru','Tesla','Lynk','Xpeng','Yadea','Niu','Super Soco','Zontes','Voge','CFMoto','Sym','Kymco'];
const ALIAS={vw:'Volkswagen',volks:'Volkswagen',merche:'Mercedes',mercedesbenz:'Mercedes',benz:'Mercedes',range:'Land Rover',rover:'Land Rover',landrover:'Land Rover',alfa:'Alfa Romeo',citroen:'Citroën',vag:'Volkswagen'};
const STOP=new Set('de un una unos unas el la los las que con para por y o u en me mi mis quiero busco necesito algo tipo tenga sea este esta esto sin muy mas menos del al lo le a e es son euros euro pavos km kms kilometros anos ano segunda mano ocasion hay teneis tienes tiene alguna algun alguno quisiera querria estoy buscando buscar ver enseñame ensename dame vale hola buenas por favor porfa como cual cuales precio precios barato caro que sea si no ok bueno buena bien mejor mejores opcion opciones vehiculo vehiculos'.split(' '));

function parseQuery(raw){
  const f={}; const chips=[]; let sort=null; const marcas=new Set(), modelos=new Set();
  let q=' '+norm(raw).replace(/[¿?¡!,;:()"«»]/g,' ').replace(/€/g,' € ').replace(/\s+/g,' ')+' ';
  q=q.replace(/ nuevo leon /g,' leon ').replace(/ hibrido enchufable /g,' enchufable ').replace(/ t cross /g,' tcross ').replace(/ id 5 /g,' id5 ').replace(/ x ceed /g,' xceed ');
  const eat=(re,fn)=>{ q=q.replace(re,(...m)=>{ fn(...m); return ' '; }); };
  const addCarr=c=>{ (f.carroceria=f.carroceria||[]); if(!f.carroceria.includes(c)) f.carroceria.push(c); };
  const addComb=c=>{ (f.combustible=f.combustible||[]); if(!f.combustible.includes(c)) f.combustible.push(c); };
  const setMaxKm=n=>{ f.kmMax = f.kmMax==null ? n : Math.min(f.kmMax,n); };
  const setMaxP=n=>{ f.precioMax = f.precioMax==null ? n : Math.min(f.precioMax,n); };
  const setMinY=n=>{ f.anioMin = Math.max(f.anioMin||0,n); };

  /* --- números con contexto --- */
  eat(new RegExp('entre '+NUM+'\\s*(?:€|euros?)?\\s*y '+NUM+'\\s*(?:€|euros?)?','g'),(m,a,ak,b,bk)=>{ const x=toN(a,ak),y=toN(b,bk); if(isYear(x,ak)&&isYear(y,bk)){ setMinY(x); f.anioMax=y; } else { f.precioMin=Math.min(x,y); setMaxP(Math.max(x,y)); } });
  eat(new RegExp('(?:de|desde) '+NUM+' a '+NUM+'\\s*(?:€|euros?)','g'),(m,a,ak,b,bk)=>{ f.precioMin=toN(a,ak); setMaxP(toN(b,bk)); });
  eat(new RegExp('(?:menos de|hasta|maximo|max|por debajo de|no mas de|con menos de|inferior a|que no pase de|que no supere) '+NUM+'\\s*(?:km|kms|kilometros)','g'),(m,a,ak)=>setMaxKm(toN(a,ak)));
  eat(new RegExp('(?:mas de|desde|a partir de|minimo|superior a|con mas de) '+NUM+'\\s*(?:km|kms|kilometros)','g'),(m,a,ak)=>{ f.kmMin=toN(a,ak); });
  eat(new RegExp('(?:menos de|hasta|maximo|max|por debajo de|no mas de|que no pase de|que no supere|unos|sobre|alrededor de|cerca de) '+NUM+'\\s*(?:€|euros?|e)?\\s*(?:al mes|/mes|mensuales?|por mes|de cuota|la cuota|cada mes)','g'),(m,a,ak)=>{ f.cuotaMax=toN(a,ak); });
  eat(new RegExp('(?:menos de|hasta|maximo|max|por debajo de|no mas de|inferior a|que no pase de|que no supere|tope) '+NUM+'\\s*(€|euros?|e)?','g'),(m,a,ak,e)=>{ const n=toN(a,ak); if(!e && isYear(n,ak)) f.anioMax=n; else if(n<1000 && !ak) f.cuotaMax=n; else setMaxP(n); });
  eat(new RegExp('(?:mas de|desde|a partir de|a partir del|minimo|superior a|posterior a|del|de el|mas nuevo que|ano|year) '+NUM+'\\s*(€|euros?)?','g'),(m,a,ak,e)=>{ const n=toN(a,ak); if(!e && isYear(n,ak)) setMinY(n); else if(e||ak||n>=1000) f.precioMin=n; });
  eat(/ (20[0-2]\d) (?:o mas|o posterior|en adelante|para arriba|o superior|o mas nuevo|o mas nuevos|o mas reciente) /g,(m,a)=>setMinY(parseInt(a,10)));
  eat(new RegExp(NUM+'\\s*(?:km|kms|kilometros)','g'),(m,a,ak)=>setMaxKm(toN(a,ak)));
  eat(new RegExp(NUM+'\\s*(?:€|euros?|e)?\\s*(?:al mes|/mes|mensuales?|por mes|de cuota|cada mes)','g'),(m,a,ak)=>{ f.cuotaMax=toN(a,ak); });
  eat(new RegExp(NUM+'\\s*(?:€|euros?|pavos)','g'),(m,a,ak)=>{ const n=toN(a,ak); setMaxP(Math.round(n*1.1)); f.aprox=n; });
  eat(/ (20[0-2]\d) /g,(m,a)=>setMinY(parseInt(a,10)));
  eat(/ (\d{1,3}(?:[.,]\d{3})+|\d{4,6})\s*(k|mil)? /g,(m,a,ak)=>{ const n=toN(a,ak); if(n>=1000) setMaxP(n); });
  eat(/ (\d{1,2}) ?k /g,(m,a)=>setMaxP(parseInt(a,10)*1000));
  eat(/ 125 /g,()=>{ f.tipo='moto'; f.carnet='A1'; });
  eat(/ (?:15|16|17) anos /g,()=>{ f.tipo='moto'; f.carnet='AM'; });

  /* --- frases --- */
  eat(/ (?:o mas nuevos?|o mas recientes?|en adelante|o posterior|o superior|para arriba|o mas modernos?) /g,()=>{});
  const PH=[
    [/ (?:sin carnet|carnet am|licencia am|para mi hij[oa]|para un adolescente|para el instituto|para el insti|ciclomotor) /g,()=>{ f.tipo='moto'; f.carnet='AM'; }],
    [/ (?:carnet b|carnet de coche|con el carnet de coche|con carnet de coche|carnet a1|carne b|carne de coche) /g,()=>{ f.tipo='moto'; f.carnet='A1'; }],
    [/ (?:km 0|km0|kilometro 0|kilometro cero|a estrenar|sin estrenar|nuev[oa]s?|de fabrica) /g,()=>setMaxKm(100)],
    [/ (?:pocos km|pocos kilometros|poco kilometraje|poco usad[oa]|poco rodad[oa]|bajo kilometraje) /g,()=>setMaxKm(40000)],
    [/ (?:etiqueta cero|etiqueta 0|etiqueta azul) /g,()=>{ f.etiqueta='0'; }],
    [/ (?:etiqueta eco) /g,()=>{ f.etiqueta='ECO'; }],
    [/ (?:para (?:la )?ciudad|urban[oa]|para ir al trabajo|para el dia a dia|para el trabajo|para moverme|para aparcar) /g,()=>{ f.urbano=true; }],
    [/ (?:primer coche|primer vehiculo|para empezar|para novel|recien sacado) /g,()=>{ f.tipo='coche'; setMaxP(15000); sort='precio-asc'; }],
    [/ (?:barat[oa]s?|economic[oa]s?|asequibles?|lowcost|low cost|ajustad[oa]s?|lo mas barato|el mas barato|la mas barata) /g,()=>{ sort='precio-asc'; }],
    [/ (?:potentes?|rapid[oa]s?|deportiv[oa]s?|con caballos|muchos caballos|lo mas potente) /g,()=>{ sort='cv-desc'; }],
    [/ (?:familiar|familia|grandes?|espacios[oa]s?|ampli[oa]s?|con maletero|para viajar|con espacio) /g,()=>addCarr('SUV')],
    [/ (?:recientes?|modern[oa]s?|actual|lo mas nuevo|los mas nuevos) /g,()=>setMinY(2022)],
    [/ (?:segunda mano|de ocasion|usad[oa]s?|seminuev[oa]s?) /g,()=>{ if(!f.tipo) f.tipo='coche'; }],
    [/ (?:financiad[oa]|financiar|a plazos|con cuota|financiacion|en cuotas) /g,()=>{ f.financiado=true; }],
    [/ (?:premium|de lujo|lujo|alta gama|gama alta) /g,()=>{ f.precioMin=Math.max(f.precioMin||0,25000); sort='precio-desc'; }],
    [/ (?:ultimas unidades|oferta|ofertas|rebajad[oa]s?) /g,()=>{ sort='precio-asc'; }],
  ];
  PH.forEach(([re,fn])=>{ if(re.test(q)){ eat(re,fn); } });

  /* --- tokens --- */
  const toks=q.trim().split(' ').filter(Boolean);
  const rest=[];
  const brandsStock=[...new Set(S.map(v=>v.marca))];
  const modelsStock=[]; S.forEach(v=>{ if(!modelsStock.some(m=>m.marca===v.marca&&m.modelo===v.modelo)) modelsStock.push({marca:v.marca,modelo:v.modelo}); });
  const findIn=(map,tok)=>{ for(const k in map){ if(map[k].some(s=>s===tok || (tok.length>=5 && fuzzyEq(tok,s)))) return k; } return null; };
  toks.forEach(tok=>{
    if(tok==='€'||tok==='e') return;
    let k;
    if((k=findIn(TIPO,tok))){ f.tipo=k; if(tok.startsWith('scooter')) { f.scooter=true; } return; }
    if((k=findIn(COMB,tok))){ addComb(k); return; }
    if((k=findIn(CAMBIO,tok))){ f.cambio=k; return; }
    if((k=findIn(CARR,tok))){ addCarr(k); return; }
    if((k=findIn(COLORES,tok))){ (f.colores=f.colores||[]).push(k); return; }
    if(ALIAS[tok]){ marcas.add(ALIAS[tok]); return; }
    const ct=compact(tok);
    const b=brandsStock.find(x=>fuzzyEq(ct,compact(x)));
    if(b){ marcas.add(b); return; }
    const mo=modelsStock.find(x=>{ const cm=compact(x.modelo); return cm.length>=2 && (ct===cm || (ct.length>=4 && cm.length>=4 && fuzzyEq(ct,cm))); });
    if(mo){ modelos.add(mo.modelo); marcas.add(mo.marca); return; }
    const ob=OTRAS_MARCAS.find(x=>fuzzyEq(ct,compact(x)));
    if(ob){ marcas.add(ob); return; }
    if(STOP.has(tok)||tok.length<3) return;
    rest.push(tok);
  });
  if(marcas.size) f.marcas=[...marcas];
  if(modelos.size) f.modelos=[...modelos];
  if(f.urbano){ if(f.tipo!=='moto' && !f.carroceria) addCarr('Compacto'); }
  if(f.carnet||f.scooter) f.tipo='moto';
  const nothing = !Object.keys(f).some(k=>!['aprox','financiado','urbano','scooter'].includes(k)) && !sort;
  if(nothing && rest.length) f.texto=rest.join(' ');

  /* --- chips (lo que hemos entendido) --- */
  if(f.tipo) chips.push({k:'tipo',t:f.tipo==='moto'?'Motos':'Coches',i:f.tipo==='moto'?'moto':'car'});
  (f.marcas||[]).forEach(m=>chips.push({k:'marcas',v:m,t:m,i:'tag'}));
  (f.modelos||[]).forEach(m=>chips.push({k:'modelos',v:m,t:m,i:'tag'}));
  (f.combustible||[]).forEach(c=>chips.push({k:'combustible',v:c,t:c,i:c==='Eléctrico'?'bolt':'fuel'}));
  if(f.cambio) chips.push({k:'cambio',t:f.cambio,i:'gear'});
  (f.carroceria||[]).forEach(c=>chips.push({k:'carroceria',v:c,t:c,i:'car'}));
  (f.colores||[]).forEach(c=>chips.push({k:'colores',v:c,t:'Color '+c.toLowerCase(),i:'palette'}));
  if(f.precioMin!=null && f.precioMax!=null) chips.push({k:'precio',t:`${fmt(f.precioMin)} – ${fmt(f.precioMax)} €`,i:'euro'});
  else if(f.aprox!=null) chips.push({k:'precio',t:`alrededor de ${eur(f.aprox)}`,i:'euro'});
  else if(f.precioMax!=null) chips.push({k:'precio',t:`hasta ${eur(f.precioMax)}`,i:'euro'});
  else if(f.precioMin!=null) chips.push({k:'precio',t:`desde ${eur(f.precioMin)}`,i:'euro'});
  if(f.cuotaMax!=null) chips.push({k:'cuotaMax',t:`hasta ${fmt(f.cuotaMax)} €/mes`,i:'euro'});
  if(f.kmMax!=null) chips.push({k:'kmMax',t:f.kmMax<=100?'Nuevo / Km 0':`menos de ${fmt(f.kmMax)} km`,i:'gauge'});
  if(f.kmMin!=null) chips.push({k:'kmMin',t:`más de ${fmt(f.kmMin)} km`,i:'gauge'});
  if(f.anioMin && f.anioMax) chips.push({k:'anio',t:`de ${f.anioMin} a ${f.anioMax}`,i:'calendar'});
  else if(f.anioMin) chips.push({k:'anio',t:`del ${f.anioMin} o más nuevo`,i:'calendar'});
  else if(f.anioMax) chips.push({k:'anio',t:`hasta el ${f.anioMax}`,i:'calendar'});
  if(f.carnet) chips.push({k:'carnet',t:f.carnet==='AM'?'carnet AM (desde 15 años)':'carnet A1 o B',i:'key'});
  if(f.etiqueta) chips.push({k:'etiqueta',t:'etiqueta '+f.etiqueta,i:'leaf'});
  if(f.financiado) chips.push({k:'financiado',t:'con financiación',i:'check'});
  if(f.texto) chips.push({k:'texto',t:`"${f.texto}"`,i:'search'});
  if(sort==='precio-asc') chips.push({k:'sort',t:'los más baratos primero',i:'sliders'});
  if(sort==='precio-desc') chips.push({k:'sort',t:'los de más precio primero',i:'sliders'});
  if(sort==='cv-desc') chips.push({k:'sort',t:'los más potentes primero',i:'sliders'});
  return {f, chips, sort};
}

function applyFilters(list,f){
  return list.filter(v=>{
    if(f.tipo && v.tipo!==f.tipo) return false;
    if(f.marcas && f.marcas.length && !f.marcas.includes(v.marca)) return false;
    if(f.modelos && f.modelos.length && !f.modelos.includes(v.modelo)) return false;
    if(f.combustible && f.combustible.length && !f.combustible.includes(v.combustible)) return false;
    if(f.cambio && v.cambio!==f.cambio) return false;
    if(f.carroceria && f.carroceria.length && !f.carroceria.includes(v.carroceria)) return false;
    if(f.colores && f.colores.length && !f.colores.some(c=>c===v.color || (v.colores||[]).some(x=>x.nombre===c))) return false;
    if(f.precioMax!=null && v.precio>f.precioMax) return false;
    if(f.precioMin!=null && v.precio<f.precioMin) return false;
    if(f.kmMax!=null && v.km>f.kmMax) return false;
    if(f.kmMin!=null && v.km<f.kmMin) return false;
    if(f.anioMin && (v.anio||2026)<f.anioMin) return false;
    if(f.anioMax && (v.anio||2026)>f.anioMax) return false;
    if(f.cuotaMax!=null && cuotaDe(v)>f.cuotaMax) return false;
    if(f.etiqueta && (v.etiqueta||'')!==f.etiqueta) return false;
    if(f.carnet){ if(v.tipo!=='moto') return false; if(f.carnet==='AM' && v.carnet!=='AM') return false; }
    if(f.condicion && v.condicion!==f.condicion) return false;
    if(f.favs && !getFavs().includes(v.id)) return false;
    if(f.texto){ const h=compact([v.marca,v.modelo,v.version,v.color,v.combustible,v.carroceria].join(' ')); if(!f.texto.split(' ').every(t=>h.includes(compact(t)))) return false; }
    return true;
  });
}
function sortList(list,sort){
  const a=list.slice();
  switch(sort){
    case 'precio-asc': return a.sort((x,y)=>x.precio-y.precio);
    case 'precio-desc': return a.sort((x,y)=>y.precio-x.precio);
    case 'km-asc': return a.sort((x,y)=>x.km-y.km);
    case 'anio-desc': return a.sort((x,y)=>(y.anio||2026)-(x.anio||2026));
    case 'cv-desc': return a.sort((x,y)=>(y.cv||0)-(x.cv||0));
    default: return a.sort((x,y)=>(y.destacado?1:0)-(x.destacado?1:0));
  }
}

/* ---------- componente buscador ---------- */
const EJEMPLOS=['Moto eléctrica sin carnet','SUV automático hasta 20.000 €','Coche para ciudad por menos de 12.000 €','Híbrido con pocos kilómetros','Diésel 4x4 para viajar','Algo por menos de 200 € al mes','Km 0 automático','Un coche del 2022 o más nuevo','Scooter para mi hijo de 15 años','Porsche'];
function initSmartSearch(root, opts={}){
  if(!root) return;
  const input=$('.ss__input',root), btn=$('.ss__btn',root), drop=$('.ss__drop',root);
  let active=-1, items=[];
  const submit=q=>{ q=(q??input.value).trim(); if(!q) { location.href='/ejemplos/plusauto-web-widy/vehiculos'; return; } if(opts.onSubmit) opts.onSubmit(q); else location.href='/ejemplos/plusauto-web-widy/vehiculos?q='+encodeURIComponent(q); };
  const close=()=>{ drop.classList.remove('open'); active=-1; };
  const render=()=>{
    const q=input.value.trim();
    const {f,chips,sort}=q?parseQuery(q):{f:{},chips:[]};
    let matches=q?sortList(applyFilters(disponibles(),f),sort||'reco').slice(0,4):[];
    const sug=(q?EJEMPLOS.filter(e=>norm(e).includes(norm(q))&&norm(e)!==norm(q)):EJEMPLOS).slice(0,q?3:5);
    items=[];
    let html='';
    if(q && chips.length){ html+=`<div class="ss__group"><div class="ss__label">He entendido</div><div class="chips" style="padding:4px 10px 8px">${chips.map(c=>`<span class="chip">${I[c.i]||''}${esc(c.t)}</span>`).join('')}</div></div>`; }
    if(matches.length){ html+=`<div class="ss__group"><div class="ss__label">Coincidencias</div>${matches.map(v=>{ items.push({type:'v',id:v.id}); return `<button type="button" class="ss__item" data-i="${items.length-1}"><img src="${v.fotos[0]}" alt="" loading="lazy"><span class="t"><b>${esc(titulo(v))} ${esc(v.version||'')}</b><small>${v.tipo==='moto'?esc(v.carnetTxt||''):esc(`${v.anio} · ${fmt(v.km)} km · ${v.combustible} · ${v.cambio}`)}</small></span><span class="p num">${eur(v.precio)}</span></button>`; }).join('')}</div>`; }
    if(q){ items.push({type:'q',q}); html+=`<div class="ss__group"><button type="button" class="ss__item" data-i="${items.length-1}">${I.search}<span class="t"><b>Ver todos los resultados de «${esc(q)}»</b><small>${applyFilters(disponibles(),f).length} vehículos</small></span>${I.arrow}</button></div>`; }
    if(sug.length){ html+=`<div class="ss__group"><div class="ss__label">${q?'Prueba también':'Prueba a escribir'}</div>${sug.map(s=>{ items.push({type:'q',q:s}); return `<button type="button" class="ss__item" data-i="${items.length-1}">${I.spark}<span class="t"><b>${esc(s)}</b></span></button>`; }).join('')}</div>`; }
    drop.innerHTML=html; drop.classList.toggle('open',!!html);
    $$('.ss__item',drop).forEach(b=>b.addEventListener('mousedown',e=>{ e.preventDefault(); go(items[+b.dataset.i]); }));
  };
  const go=it=>{ if(!it) return submit(); if(it.type==='v') location.href='/ejemplos/plusauto-web-widy/vehiculo?id='+it.id; else { input.value=it.q; submit(it.q); } };
  input.addEventListener('input',debounce(render,110));
  input.addEventListener('focus',render);
  input.addEventListener('blur',()=>setTimeout(close,150));
  input.addEventListener('keydown',e=>{
    const els=$$('.ss__item',drop);
    if(e.key==='ArrowDown'){ e.preventDefault(); active=Math.min(active+1,els.length-1); els.forEach((x,i)=>x.classList.toggle('active',i===active)); }
    else if(e.key==='ArrowUp'){ e.preventDefault(); active=Math.max(active-1,-1); els.forEach((x,i)=>x.classList.toggle('active',i===active)); }
    else if(e.key==='Enter'){ e.preventDefault(); if(active>=0 && els[active]) go(items[+els[active].dataset.i]); else submit(); }
    else if(e.key==='Escape'){ close(); input.blur(); }
  });
  btn.addEventListener('click',()=>submit());
  $$('.ss__ex button',root).forEach(b=>b.addEventListener('click',()=>{ input.value=b.textContent.trim(); submit(); }));
  // placeholder rotativo
  if(!opts.staticPlaceholder){ let i=0; const base=input.getAttribute('placeholder'); setInterval(()=>{ if(document.activeElement===input||input.value) return; i=(i+1)%EJEMPLOS.length; input.setAttribute('placeholder', i===0?base:`Ej.: ${EJEMPLOS[i]}`); },3400); }
}

/* ---------- nav ---------- */
function initNav(){
  const path=location.pathname.replace(/\.html$/,'').replace(/\/$/,'')||'/';
  $$('.nav__links a, .drawer__panel a').forEach(a=>{ const h=a.getAttribute('href').split('?')[0].split('#')[0]; if(h===path || (h!=='/' && path.startsWith(h))) a.setAttribute('aria-current','page'); });
  const burger=$('#burger'), drawer=$('#drawer');
  if(burger&&drawer){
    const open=()=>{ drawer.classList.add('open'); document.body.style.overflow='hidden'; $('.drawer__close',drawer)?.focus(); };
    const close=()=>{ drawer.classList.remove('open'); document.body.style.overflow=''; };
    burger.addEventListener('click',open);
    $('.drawer__bg',drawer).addEventListener('click',close);
    $('.drawer__close',drawer).addEventListener('click',close);
    $$('a',drawer).forEach(a=>a.addEventListener('click',close));
    document.addEventListener('keydown',e=>{ if(e.key==='Escape') close(); });
  }
  $$('[data-wa]').forEach(a=>{ a.href=waLink(a.dataset.wa||'Hola PlusAuto, quiero información sobre un vehículo.'); a.target='_blank'; a.rel='noopener'; });
  $$('[data-tel]').forEach(a=>a.href='tel:'+TEL);
  $$('[data-icon]').forEach(el=>{ el.innerHTML=I[el.dataset.icon]||''; });
  $$('[data-cuota]').forEach(el=>{ const v=byId(el.dataset.cuota); if(v) el.textContent=`desde ${fmt(cuotaDe(v))} €/mes*`; });
  $$('[data-catcount]').forEach(el=>{ try{ const f=JSON.parse(el.dataset.catcount); const n=applyFilters(disponibles(),f).length; el.textContent=`${n} ${n===1?'vehículo':'vehículos'}`; }catch(e){} });
}

/* ---------- visor Silence (color + giro) ---------- */
function initSilenceViewer(root){
  if(!root) return;
  const base=byId('silence-s02-l3e'); if(!base) return;
  const img=$('.silence__img',root), sw=$('.swatches',root), spin=$('.spin',root);
  let c=0, fr=0;
  const cols=base.colores;
  const set=(nc,nf,fade=true)=>{ c=(nc+cols.length)%cols.length; fr=(nf+cols[c].fotos.length)%cols[c].fotos.length; const src=cols[c].fotos[fr]; if(fade){ img.classList.add('fade'); setTimeout(()=>{ img.src=src; img.classList.remove('fade'); },120); } else img.src=src; $$('.swatch',sw).forEach((b,i)=>{ b.classList.toggle('on',i===c); b.setAttribute('aria-pressed',i===c); }); $$('[data-color-name]',root).forEach(e=>e.textContent=cols[c].nombre); };
  if(sw){ sw.innerHTML=cols.map((x,i)=>`<button type="button" class="swatch" aria-label="Color ${x.nombre}" title="${x.nombre}"><i style="background:${x.hex}"></i></button>`).join('')+`<span class="muted" style="font-size:.86rem">Color: <b data-color-name></b></span>`; $$('.swatch',sw).forEach((b,i)=>b.addEventListener('click',()=>set(i,fr))); }
  if(spin){ $('.spin__l',spin)?.addEventListener('click',()=>set(c,fr-1,false)); $('.spin__r',spin)?.addEventListener('click',()=>set(c,fr+1,false)); }
  // arrastrar para girar
  let sx=null; const box=$('.silence__visual',root)||root;
  box.addEventListener('pointerdown',e=>{ sx=e.clientX; });
  box.addEventListener('pointermove',e=>{ if(sx==null) return; const dx=e.clientX-sx; if(Math.abs(dx)>40){ set(c,fr+(dx>0?-1:1),false); sx=e.clientX; } });
  ['pointerup','pointercancel','pointerleave'].forEach(ev=>box.addEventListener(ev,()=>{ sx=null; }));
  // precarga
  cols.forEach(x=>x.fotos.forEach(s=>{ const im=new Image(); im.src=s; }));
  root.silenceSet=(nc,nf)=>set(nc,nf,true);
  set(0,+(root.dataset.frame||0),false);
}

/* ---------- calculadora ---------- */
function initCalc(root, precioInicial){
  if(!root) return;
  const rPrecio=$('[data-calc-precio]',root), rEntrada=$('[data-calc-entrada]',root), seg=$('[data-calc-meses]',root), out=$('[data-calc-out]',root), lp=$('[data-calc-precio-l]',root), le=$('[data-calc-entrada-l]',root), lt=$('[data-calc-total]',root);
  let meses=+($('.on',seg)?.dataset.m||96);
  if(rPrecio && precioInicial){ rPrecio.value=precioInicial; }
  const upd=()=>{
    const p=rPrecio?+rPrecio.value:precioInicial; const e=rEntrada?Math.round(p*(+rEntrada.value)/100):0;
    if(lp) lp.textContent=eur(p); if(le) le.textContent=eur(e)+(rEntrada?` (${rEntrada.value} %)`:'');
    const q=cuota(p,meses,e); out.innerHTML=`${fmt(q)} <small>€/mes</small>`;
    if(lt) lt.textContent=`${meses} meses · sin comisión de apertura · TIN ${(TIN*100).toFixed(2).replace('.',',')} %`;
  };
  rPrecio?.addEventListener('input',upd); rEntrada?.addEventListener('input',upd);
  $$('button',seg).forEach(b=>b.addEventListener('click',()=>{ $$('button',seg).forEach(x=>x.classList.remove('on')); b.classList.add('on'); meses=+b.dataset.m; upd(); }));
  upd();
}

/* ---------- home ---------- */
function initStory(){
  const st=$('#story'); if(!st) return;
  const steps=$$('.story__step',st), viewer=$('#silenceHome');
  const activate=i=>{ st.dataset.active=i; steps.forEach((s,k)=>s.classList.toggle('on',k===i)); const s=steps[i]; if(s && !s.dataset.alt && viewer && viewer.silenceSet && s.dataset.color!=null) viewer.silenceSet(+s.dataset.color, +(s.dataset.frame||0)); };
  activate(0);
  const mobile=matchMedia('(max-width:1023px)');
  // móvil: las tarjetas se deslizan en horizontal; el punto activo sigue al scroll y el visor no cambia solo
  const track=$('.story__steps',st);
  const onScroll=()=>{ if(!mobile.matches||!steps.length) return; const c=track.scrollLeft+track.clientWidth/2; let best=0,bd=1e9; steps.forEach((s,i)=>{ const d=Math.abs(s.offsetLeft+s.offsetWidth/2-c); if(d<bd){ bd=d; best=i; } }); st.dataset.active=best; };
  track.addEventListener('scroll',onScroll,{passive:true});
  if(!('IntersectionObserver' in window)) return;
  const io=new IntersectionObserver(en=>{ if(mobile.matches) return; en.forEach(x=>{ if(x.isIntersecting) activate(+x.target.dataset.step); }); },{rootMargin:'-42% 0px -42% 0px',threshold:0});
  steps.forEach(s=>io.observe(s));
  mobile.addEventListener('change',()=>{ if(mobile.matches){ onScroll(); if(viewer&&viewer.silenceSet) viewer.silenceSet(2,1); } else activate(0); });
  if(mobile.matches && viewer && viewer.silenceSet) viewer.silenceSet(2,1);
}
function initHome(){
  initSmartSearch($('#heroSearch'));
  renderGrid($('#motosGrid'), S.filter(v=>v.tipo==='moto' && v.estado==='disponible'));
  const coches=S.filter(v=>v.tipo==='coche' && v.estado==='disponible').slice(0,6);
  renderGrid($('#cochesGrid'), coches);
  const soldEl=$('#soldStrip'); if(soldEl){ const sold=S.filter(v=>v.estado==='vendido'); soldEl.innerHTML=sold.map(v=>`<div class="sold__item"><img src="${v.fotos[0]}" alt="" loading="lazy"><span class="badge badge--sold">Vendido</span><div><b>${esc(titulo(v))}</b><span class="muted">${v.anio} · ${fmt(v.km)} km</span></div></div>`).join(''); }
  const rf=$('#ribFotos'); if(rf) rf.textContent=fmt(S.reduce((n,v)=>n+v.fotos.length,0));
  $$('[data-count]').forEach(e=>{ const k=e.dataset.count; e.textContent = k==='total'?disponibles().length : k==='motos'?disponibles().filter(v=>v.tipo==='moto').length : disponibles().filter(v=>v.tipo==='coche').length; });
  initSilenceViewer($('#silenceHome'));
  initCalc($('#calcHome'));
  // marquesina con lo que hay hoy en exposición
  const mq=$('#marquee'); if(mq){ const motos=disponibles().filter(v=>v.tipo==='moto'); const nCoches=disponibles().filter(v=>v.tipo==='coche').length; const seen=new Set(); const items=[...motos.filter(v=>{ const t=titulo(v); if(seen.has(t)) return false; seen.add(t); return true; }).map(v=>`<span>${esc(titulo(v))}${(v.km<100||v.condicion==='Nuevo')?' <i>nueva</i>':''}</span>`),`<span>${nCoches} coches de ocasión y km 0</span>`,`<span>Financiación hasta el 100 %</span>`,`<span>Tasamos tu coche en 24 h</span>`,`<span>Taller propio</span>`,`<span>Entrega en toda España</span>`]; const set=`<div class="marquee__set">${items.join('')}</div>`; mq.innerHTML=set+set; }
  // tarjeta de lanzamiento: va cambiando de color sola
  const li=$('#launchImg'), ld=$('#launchDots'), lc=$('#launchCard'), base=byId('silence-s02-l3e');
  if(li&&ld&&base&&base.colores){ const cols=base.colores; let ci=Math.max(0,cols.findIndex(c=>/menta/i.test(c.nombre))); ld.innerHTML=cols.map((c,i)=>`<i style="--c:${c.hex}" class="${i===ci?'on':''}"></i>`).join(''); cols.forEach(c=>{ const im=new Image(); im.src=c.fotos[1]; }); const show=i=>{ ci=(i+cols.length)%cols.length; li.classList.add('fade'); setTimeout(()=>{ li.src=cols[ci].fotos[1]; li.classList.remove('fade'); },320); $$('i',ld).forEach((d,k)=>d.classList.toggle('on',k===ci)); }; if(!matchMedia('(prefers-reduced-motion: reduce)').matches){ let t=setInterval(()=>show(ci+1),3600); lc.addEventListener('mouseenter',()=>clearInterval(t)); lc.addEventListener('mouseleave',()=>{ clearInterval(t); t=setInterval(()=>show(ci+1),3600); }); } }
  // cuotas grandes del bento
  $$('[data-cuota-big]').forEach(e=>{ const v=byId(e.dataset.cuotaBig); if(v) e.textContent=`${fmt(cuotaDe(v))}\u00a0€/mes`; });
  const mc=$('[data-cuota-min-coche]'); if(mc){ const cs=disponibles().filter(v=>v.tipo==='coche'); if(cs.length) mc.textContent=`${fmt(Math.min(...cs.map(v=>cuotaDe(v))))}\u00a0€/mes`; }
  initStory();
  // muro de vídeos de TikTok (portadas + previsualización muda al pasar el ratón o al estar a la vista)
  const wall=$('#socialWall'); if(wall && window.SOCIAL){
    const PLAY='<svg class="i" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13l11-6.5z" fill="currentColor" stroke="none"/></svg>';
    const fv=x=>/k$/i.test(x)?x.replace('.',',').replace(/k$/i,' K'):fmt(+x||0);
    wall.innerHTML=window.SOCIAL.map(v=>`<a class="vt" href="https://www.tiktok.com/@plusauto.motor/video/${v.id}" target="_blank" rel="noopener" aria-label="Ver en TikTok: ${esc(v.title)}"><img src="/ejemplos/plusauto-web-widy/img/social/${v.id}.webp" alt="" loading="lazy" width="480" height="853">${v.video?`<video muted loop playsinline preload="none" data-src="/ejemplos/plusauto-web-widy/img/social/${v.id}.mp4"></video>`:''}<span class="vt__views">${PLAY}${fv(v.views)}</span><span class="vt__tt">${I.tiktok}</span><span class="vt__title">${esc(v.title)}</span></a>`).join('');
    const tiles=$$('.vt',wall);
    const play=t=>{ const vd=$('video',t); if(!vd) return; if(!vd.getAttribute('src')) vd.src=vd.dataset.src; vd.play().then(()=>t.classList.add('playing')).catch(()=>{}); };
    const stop=t=>{ const vd=$('video',t); if(!vd) return; vd.pause(); t.classList.remove('playing'); };
    const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
    if(matchMedia('(hover:hover) and (pointer:fine)').matches){ tiles.forEach(t=>{ t.addEventListener('mouseenter',()=>{ if(!reduced) play(t); }); t.addEventListener('mouseleave',()=>stop(t)); }); }
    else if('IntersectionObserver' in window && !reduced){ const io=new IntersectionObserver(en=>en.forEach(x=>{ if(x.intersectionRatio>=.75) play(x.target); else stop(x.target); }),{threshold:[0,.75]}); tiles.forEach(t=>io.observe(t)); }
  }
  const vis=getVistos(); if(vis.length && $('#vistosSec')){ $('#vistosSec').classList.remove('hide'); renderGrid($('#vistosGrid'),vis.map(byId).slice(0,4)); }
  // destacado de la semana
  const fe=$('[data-feat]'); if(fe){ const v=byId(fe.dataset.feat)||disponibles().filter(x=>x.tipo==='coche')[0]; if(v){ fe.innerHTML=`<a class="feat__media" href="/ejemplos/plusauto-web-widy/vehiculo?id=${v.id}" aria-label="${esc(titulo(v))}">${v.fotos.slice(0,3).map((f,i)=>`<img src="${f}" alt="" loading="lazy">`).join('')}</a><div class="feat__body"><span class="eyebrow">Destacado de la semana</span><h3>${esc(titulo(v))}<br><span class="muted" style="font-family:var(--font-b);font-weight:400;font-size:1.05rem">${esc(v.version||'')}</span></h3><div class="feat__specs">${specsHTML(v)}</div><div class="price num">${eur(v.precio)}<small>desde ${fmt(cuotaDe(v))} €/mes* · ${v.fotos.length} fotos</small></div><div class="row-actions"><a class="btn btn--primary" href="/ejemplos/plusauto-web-widy/vehiculo?id=${v.id}">Ver ficha ${I.arrow}</a><a class="btn btn--wa" target="_blank" rel="noopener" href="${waVehiculo(v)}">${I.wa}Preguntar</a></div></div>`; } }
  const br=$('#brands'); if(br){ const marcas=[...new Set(disponibles().map(v=>v.marca))].sort(); br.innerHTML=marcas.map(m=>`<span>${esc(m)}</span>`).join(''); }
  const tf=$('#tasForm'); if(tf){ tf.addEventListener('submit',e=>{ e.preventDefault(); const d=Object.fromEntries(new FormData(tf).entries()); const msg=`Hola PlusAuto, quiero tasar mi coche: ${d.marca||''} ${d.modelo||''}, año ${d.anio||''}, ${d.km||''} km. Me llamo ${d.nombre||''}.`; $('#tasOk').classList.remove('hide'); $('#tasWa').href=waLink(msg); tf.querySelector('button[type=submit]').disabled=true; }); }
}

/* ---------- arranque ---------- */
// Vídeos de fondo (portada y banda de /motos): arrancan SIEMPRE, sin sonido, y se
// reintentan si el navegador los para (ventana o pestaña oculta, ahorro de batería en
// iOS, «reducir movimiento», vuelta atrás con bfcache…). Al primer toque, clic o scroll
// se vuelve a intentar: es el momento en que iOS en ahorro de batería sí lo permite.
function initAutoVideos(){
  const vids=Array.from(document.querySelectorAll('video[autoplay]'));
  if(!vids.length) return;
  const play=v=>{ if(!v.paused&&!v.ended) return; v.muted=true; v.defaultMuted=true; const p=v.play(); if(p&&p.catch) p.catch(()=>{}); };
  const all=()=>vids.forEach(play);
  vids.forEach(v=>{
    v.muted=true; v.defaultMuted=true; v.loop=true;
    v.setAttribute('playsinline',''); v.setAttribute('webkit-playsinline','');
    v.addEventListener('ended',()=>{ try{ v.currentTime=0; }catch(e){} play(v); });
    ['loadedmetadata','loadeddata','canplay','canplaythrough'].forEach(e=>v.addEventListener(e,()=>play(v)));
    play(v);
  });
  document.addEventListener('visibilitychange',()=>{ if(!document.hidden) all(); });
  window.addEventListener('pageshow',all);
  window.addEventListener('focus',all);
  ['touchstart','touchend','pointerdown','click','keydown','scroll'].forEach(e=>window.addEventListener(e,all,{passive:true}));
  if('IntersectionObserver' in window){
    const io=new IntersectionObserver(es=>es.forEach(en=>{ if(en.isIntersecting) play(en.target); }),{threshold:.05});
    vids.forEach(v=>io.observe(v));
  }
}

document.addEventListener('DOMContentLoaded',()=>{
  renderChrome();
  initTheme();
  initNav();
  initNavOver();
  initFaq();
  openNowBadge(document.getElementById('openNowFooter'));
  initImgFade();
  initAutoVideos();
  renderCmpBar();
  const page=document.body.dataset.page;
  if(page==='home') initHome();
  document.dispatchEvent(new CustomEvent('pa:ready'));
  initReveal();
});

window.PA={I,S,fmt,eur,norm,esc,$,$$,params,cuota,cuotaDe,mesesDe,TIN,byId,disponibles,titulo,waLink,waVehiculo,getFavs,toggleFav,bindFavs,toast,cardHTML,renderGrid,parseQuery,applyFilters,sortList,initSmartSearch,initSilenceViewer,initCalc,debounce,EJEMPLOS,getCmp,setCmp,toggleCmp,bindCmp,getVistos,addVisto,bindWaForm,initFaq,openNowBadge};
})();
