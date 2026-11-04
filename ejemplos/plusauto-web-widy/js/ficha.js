/* PlusAuto Motor — ficha de vehículo v2 (mosaico, resumen, lo mejor, compra fija) */
document.addEventListener('pa:ready',()=>{
  const {I,S,fmt,eur,esc,$,$$,params,byId,disponibles,titulo,waVehiculo,waLink,cuotaDe,mesesDe,initCalc,renderGrid,bindFavs,toast}=window.PA;
  const v=byId(params.get('id'));
  if(!v){ location.replace('/ejemplos/plusauto-web-widy/vehiculos'); return; }
  document.title=`${titulo(v)} ${v.version||''} · ${eur(v.precio)} · PlusAuto Motor`;
  const sold=v.estado==='vendido';

  /* --- cabecera --- */
  $('#crumbTipo').textContent=v.tipo==='moto'?'Motos':'Coches'; $('#crumbTipo').href='/ejemplos/plusauto-web-widy/vehiculos?tipo='+v.tipo;
  $('#crumbName').textContent=titulo(v);
  $('#bTitle').textContent=titulo(v);
  $('#bSub').textContent=v.version||'';
  $('#bBadges').innerHTML=[ sold?'<span class="badge badge--sold">Vendido</span>':'', v.combustible==='Eléctrico'?`<span class="badge badge--acc">${I.bolt}Eléctrico</span>`:'', `<span class="badge">${esc(v.condicion)}</span>`, v.km<=100&&!sold?'<span class="badge">Km 0</span>':'', v.garantia?`<span class="badge">${I.shield}${v.garantia} meses de garantía</span>`:'', v.etiqueta?`<span class="badge">${I.leaf}Etiqueta ${esc(v.etiqueta)}</span>`:'', v.silence?'<span class="badge">Distribuidor oficial Silence</span>':'' ].join('');

  /* --- galería en mosaico + lightbox --- */
  let fotos=v.fotos.slice(), idx=0;
  const grid=$('#mosaicGrid'), mAll=$('#mosaicAll'), mCount=$('#mCount');
  if(v.silence) $('#mosaic').classList.add('mosaic--fit');
  const lb=$('#lightbox'), lbImg=$('#lbImg'), lbCount=$('#lbCount');
  const showLb=i=>{ idx=(i+fotos.length)%fotos.length; lbImg.src=fotos[idx]; lbImg.alt=`${titulo(v)} — foto ${idx+1} de ${fotos.length}`; lbCount.textContent=`${idx+1} / ${fotos.length}`; };
  const openLb=i=>{ showLb(i); lb.classList.add('open'); document.body.style.overflow='hidden'; };
  const closeLb=()=>{ lb.classList.remove('open'); document.body.style.overflow=''; };
  const renderMosaic=()=>{
    grid.innerHTML=fotos.map((f,i)=>`<button type="button" class="mosaic__tile${i===0?' mosaic__tile--main':''}" data-i="${i}" aria-label="Ver foto ${i+1}"><img src="${f}" alt="${esc(titulo(v))} — foto ${i+1}" ${i>0?'loading="lazy"':'fetchpriority="high"'} width="1200" height="900"></button>`).join('');
    $$('.mosaic__tile',grid).forEach(b=>b.addEventListener('click',()=>openLb(+b.dataset.i)));
    $('#mosaicAllTxt').textContent=`Ver las ${fotos.length} fotos`;
    mCount.textContent=`1 / ${fotos.length}`;
    grid.scrollTo({left:0});
  };
  renderMosaic();
  mAll.addEventListener('click',()=>openLb(0));
  // contador en el carrusel móvil
  grid.addEventListener('scroll',()=>{ const i=Math.round(grid.scrollLeft/grid.clientWidth); mCount.textContent=`${Math.min(i+1,fotos.length)} / ${fotos.length}`; },{passive:true});
  $('#lbClose').addEventListener('click',closeLb); lb.addEventListener('click',e=>{ if(e.target===lb) closeLb(); });
  $('#lbPrev').addEventListener('click',e=>{ e.stopPropagation(); showLb(idx-1); });
  $('#lbNext').addEventListener('click',e=>{ e.stopPropagation(); showLb(idx+1); });
  let tx=null; lb.addEventListener('touchstart',e=>{ tx=e.touches[0].clientX; },{passive:true}); lb.addEventListener('touchend',e=>{ if(tx==null) return; const dx=e.changedTouches[0].clientX-tx; if(Math.abs(dx)>40) showLb(idx+(dx<0?1:-1)); tx=null; });
  document.addEventListener('keydown',e=>{ if(!lb.classList.contains('open')) return; if(e.key==='Escape') closeLb(); if(e.key==='ArrowRight') showLb(idx+1); if(e.key==='ArrowLeft') showLb(idx-1); });
  // colores (Silence)
  if(v.colores){ const cw=$('#colorRow'); cw.classList.remove('hide'); cw.innerHTML=`<span class="muted" style="font-size:.92rem">Elige color:</span>`+v.colores.map((c,i)=>`<button type="button" class="swatch${i===0?' on':''}" aria-label="Color ${c.nombre}" title="${c.nombre}"><i style="background:${c.hex}"></i></button>`).join('')+`<b id="colorName">${v.colores[0].nombre}</b>`; $$('.swatch',cw).forEach((b,i)=>b.addEventListener('click',()=>{ fotos=v.colores[i].fotos.slice(); $$('.swatch',cw).forEach((x,j)=>x.classList.toggle('on',j===i)); $('#colorName').textContent=v.colores[i].nombre; renderMosaic(); })); }

  if(v.silence){ const sp=$('#spin360'); sp.classList.remove('hide'); window.PA.initSilenceViewer(sp); }

  /* --- de un vistazo --- */
  const glance = v.tipo==='moto'
    ? [[I.route,'Autonomía',v.autonomia+' km'],[I.gauge,'Velocidad',v.velocidad+' km/h'],[I.battery,'Batería',v.bateria],[I.key,'Carnet',v.carnet],[I.zap,'Carga',v.silence?'En casa':v.carga],[I.shield,'Garantía',v.garantia?v.garantia+' meses':'Oficial']]
    : [[I.calendar,'Año',v.anio],[I.gauge,'Kilómetros',fmt(v.km)+' km'],[I.fuel,'Combustible',v.combustible],[I.gear,'Cambio',v.cambio],[I.zap,'Potencia',v.cv?v.cv+' CV':'—'],[I.shield,'Garantía',v.garantia?v.garantia+' meses':'Incluida']];
  $('#glance').innerHTML=glance.map(([i,k,x])=>`<div class="glance__item">${i}<small>${k}</small><b>${esc(String(x))}</b></div>`).join('');

  /* --- lo mejor de este vehículo (reglas sobre los datos) --- */
  const hl=[];
  if(v.tipo==='coche'){
    if(v.km<=100) hl.push(['Sin estrenar','Kilómetro cero: coche nuevo con precio de ocasión.']);
    else if(v.km<30000) hl.push([`Solo ${fmt(v.km)} km`,'Muy por debajo de la media para su edad.']);
    else if(v.km<60000) hl.push([`${fmt(v.km)} km`,'Kilometraje contenido para su año.']);
    if(v.anio>=2023) hl.push([`Del ${v.anio}`,'Uno de los más recientes de la exposición.']);
    if(v.cambio==='Automático') hl.push(['Cambio automático','Más cómodo en ciudad y en atascos.']);
    if(v.etiqueta==='0'||v.etiqueta==='ECO') hl.push([`Etiqueta ${v.etiqueta}`,'Sin restricciones en zonas de bajas emisiones y ventajas fiscales.']);
    if(v.combustible.includes('Híbrido')||v.combustible==='Eléctrico') hl.push([v.combustible,'Consumos y mantenimiento más bajos.']);
    if(v.cv>=140) hl.push([`${v.cv} CV`,'Potencia de sobra para carretera.']);
    if(v.garantia>=24) hl.push([`${v.garantia} meses de garantía`,'Por escrito y con nuestro taller detrás.']);
    if(v.precioFin&&v.precioFin<v.precio) hl.push([`Ahorra ${eur(v.precio-v.precioFin)} financiando`,`Precio financiado: ${eur(v.precioFin)}.`]);
    if(v.carroceria==='SUV') hl.push(['SUV','Posición alta y maletero para la familia.']);
  } else {
    hl.push(['0 € de gasolina','Cargar la batería cuesta alrededor de 1 €.']);
    if(v.carnet==='AM') hl.push(['Desde los 15 años','Con el carnet AM, o con el B de coche.']); else hl.push(['Con tu carnet de coche','Carnet A1, o B con 3 años de antigüedad.']);
    if(v.silence) hl.push(['Batería que subes a casa','Extraíble y con ruedas: se carga en cualquier enchufe.']);
    if(v.autonomia>=200) hl.push([`${v.autonomia} km de autonomía`,'Para toda la semana sin pensar en cargar.']); else hl.push([`${v.autonomia} km de autonomía`,'De sobra para el día a día en Dos Hermanas y Sevilla.']);
    if(v.ayudas) hl.push([v.ayudas,'Te gestionamos la solicitud.']);
    if(v.garantia) hl.push([`${v.garantia} meses de garantía oficial`,'Servicio técnico en nuestro taller.']);
    hl.push(['Etiqueta 0 emisiones','Aparca y circula sin restricciones.']);
  }
  const hlIcon=t=>{ const x=t.toLowerCase(); if(/autonom/.test(x)) return I.route; if(/estrenar|\bkm\b/.test(x)) return I.gauge; if(/^del 20/.test(x)) return I.calendar; if(/autom/.test(x)) return I.gear; if(/etiqueta/.test(x)) return I.tag; if(/híbrido|eléctric/.test(x)) return I.bolt; if(/\bcv\b/.test(x)) return I.zap; if(/garant/.test(x)) return I.shield; if(/ahorra|ayuda|plan/.test(x)) return I.euro; if(/suv/.test(x)) return I.route; if(/gasolina/.test(x)) return I.fuel; if(/carnet|años/.test(x)) return I.key; if(/bater/.test(x)) return I.battery; return I.check; };
  if(hl.length){ $('#highlights').innerHTML=hl.slice(0,6).map(([b,s])=>`<li><button type="button" aria-expanded="false"><span class="hl__ic">${hlIcon(b)||I.check}</span><b>${esc(b)}</b><span class="hl__more">${I.chevD}</span></button><p>${esc(s)}</p></li>`).join(''); $$('#highlights li > button').forEach(b=>b.addEventListener('click',()=>{ const on=b.parentElement.classList.toggle('on'); b.setAttribute('aria-expanded',on); })); } else $('#highlightsSec').classList.add('hide');
  /* --- pestañas de la ficha (se marcan solas al hacer scroll) --- */
  const tabs=$('#ftabs'); if(tabs){ const links=$$('a',tabs); const targets=links.map(a=>$(a.getAttribute('href'))).filter(Boolean); const setOn=id=>{ links.forEach(a=>a.classList.toggle('on',a.getAttribute('href')==='#'+id)); const on=$('a.on',tabs); if(on){ const r=on.getBoundingClientRect(), t=tabs.getBoundingClientRect(); if(r.left<t.left||r.right>t.right) tabs.scrollTo({left:on.offsetLeft-tabs.clientWidth/2+on.offsetWidth/2,behavior:'smooth'}); } }; if('IntersectionObserver' in window){ const io=new IntersectionObserver(en=>{ en.forEach(x=>{ if(x.isIntersecting) setOn(x.target.id); }); },{rootMargin:'-80px 0px -62% 0px',threshold:0}); targets.forEach(t=>io.observe(t)); } links.forEach(a=>a.addEventListener('click',e=>{ const t=$(a.getAttribute('href')); if(t){ e.preventDefault(); const y=t.getBoundingClientRect().top+window.scrollY-68; window.scrollTo({top:y,behavior:'smooth'}); setOn(t.id); } })); }

  /* --- precio y CTAs (caja fija + barra móvil) --- */
  const cuotaTxt=`${fmt(cuotaDe(v))} €/mes`;
  $('#bPrice').textContent=eur(v.precio); $('#bPrice3').textContent=eur(v.precio);
  $('#bCuota3').textContent=sold?'Vendido':`desde ${cuotaTxt}*`;
  const finEl=$('#bFin');
  if(sold) finEl.innerHTML='Este vehículo ya se ha vendido. Te buscamos uno parecido.';
  else if(v.precioFin&&v.precioFin<v.precio) finEl.innerHTML=`Financiado: <b>${eur(v.precioFin)}</b> · desde <b>${cuotaTxt}</b>*`;
  else finEl.innerHTML=`Desde <b>${cuotaTxt}</b>* financiando a ${mesesDe(v)} meses${v.ayudas?` · <b>${esc(v.ayudas)}</b>`:''}`;
  const wa=sold?waLink(`Hola PlusAuto, he visto que el ${titulo(v)} ya está vendido. ¿Tenéis algo parecido?`):waVehiculo(v);
  $('#bWa').href=wa; $('#bWa2').href=wa;
  $('#bReserva').href=waLink(`Hola PlusAuto, quiero RESERVAR el ${titulo(v)} ${v.version||''} (${eur(v.precio)}) hasta que pueda ir a verlo. ¿Cómo lo hacemos?`);
  $('#bFinanciar').href=`/ejemplos/plusauto-web-widy/financiacion?v=${v.id}#estudio`;
  $('#bVideo').href=waLink(`Hola PlusAuto, ¿me podéis mandar un vídeo del ${titulo(v)} ${v.version||''} (${eur(v.precio)})? Gracias.`);
  if(sold) $('#bVideo').classList.add('hide');
  if(sold){ $('#bReserva').classList.add('hide'); $('#calc').classList.add('hide'); }
  const favBtn=$('#bFav'); favBtn.dataset.fav=v.id; bindFavs(document);
  const cmpBtn=$('#bCmp'); cmpBtn.dataset.cmp=v.id; window.PA.bindCmp(document);
  $('#bPrint').addEventListener('click',()=>window.print());
  $('#bShare').addEventListener('click',async()=>{ const data={title:`${titulo(v)} · PlusAuto Motor`,text:`${titulo(v)} ${v.version||''} por ${eur(v.precio)}`,url:location.href}; try{ if(navigator.share) await navigator.share(data); else { await navigator.clipboard.writeText(location.href); toast('Enlace copiado'); } }catch(e){} });
  window.PA.addVisto(v.id);

  /* --- características --- */
  const kv=v.tipo==='moto'
    ? [['Autonomía',v.autonomia+' km'],['Velocidad máx.',v.velocidad+' km/h'],['Batería',v.bateria],['Carga',v.carga],['Carnet',v.carnetTxt||v.carnet],['Potencia',v.cv?v.cv+' CV':null],['Peso',v.peso?v.peso+' kg':null],['Plazas',v.plazas],['Color',v.colores?'3 colores a elegir':v.color],['Garantía',v.garantia?v.garantia+' meses':null],['Etiqueta',v.etiqueta?'Etiqueta '+v.etiqueta:null],['Estado',v.condicion]]
    : [['Año',v.anio],['Kilómetros',fmt(v.km)+' km'],['Combustible',v.combustible],['Cambio',v.cambio],['Potencia',v.cv?v.cv+' CV':null],['Carrocería',v.carroceria],['Puertas',v.puertas],['Plazas',v.plazas],['Color',v.color],['Etiqueta',v.etiqueta?'Etiqueta '+v.etiqueta:null],['Garantía',v.garantia?v.garantia+' meses':null],['Estado',v.condicion]];
  $('#kv').innerHTML=kv.filter(([k,x])=>x!=null&&x!=='').map(([k,x])=>`<div><small>${k}</small><b>${esc(String(x))}</b></div>`).join('');

  /* --- descripción --- */
  const desc = v.descripcion || (v.tipo==='moto'
    ? `${titulo(v)} ${v.version||''}: moto eléctrica nueva con ${v.autonomia} km de autonomía y ${v.velocidad} km/h de velocidad máxima. Se conduce con carnet ${v.carnetTxt||v.carnet}. Garantía oficial de ${v.garantia} meses y entrega inmediata en nuestra exposición de Dos Hermanas (Sevilla).`
    : `${titulo(v)} ${v.version||''}, ${v.condicion.toLowerCase()} de ${v.anio} con ${fmt(v.km)} km, motor ${v.combustible.toLowerCase()} y cambio ${v.cambio.toLowerCase()}${v.cv?` (${v.cv} CV)`:''}. Revisado en nuestro taller y con ${v.garantia||12} meses de garantía. Disponible en nuestra exposición de Dos Hermanas (Sevilla), con financiación hasta el 100 % y entrega en toda España.`);
  const pr=$('#desc'); pr.textContent=desc;
  if(desc.length>520){ pr.classList.add('prose--clamp'); const m=$('#more'); m.classList.remove('hide'); m.addEventListener('click',()=>{ pr.classList.remove('prose--clamp'); m.classList.add('hide'); }); }

  /* --- calculadora --- */
  const calc=$('#calc'); if(calc){ const p=v.precioFin||v.precio; $$('[data-calc-meses] button',calc).forEach(b=>b.classList.toggle('on',+b.dataset.m===mesesDe(v))); $('[data-calc-precio-fixed]',calc).textContent=eur(p); initCalc(calc,p); }

  /* --- modal prueba --- */
  const modal=$('#modal'); const form=$('#pruebaForm');
  $('#mTitle').textContent=`Reservar prueba · ${titulo(v)}`;
  function openModal(){ modal.classList.add('open'); document.body.style.overflow='hidden'; setTimeout(()=>$('input',form).focus(),50); }
  function closeModal(){ modal.classList.remove('open'); document.body.style.overflow=''; }
  ['bPrueba','bPrueba2','bPrueba3'].forEach(id=>{ const b=$('#'+id); if(b) b.addEventListener('click',openModal); });
  $('#mClose').addEventListener('click',closeModal); $('.modal__bg',modal).addEventListener('click',closeModal);
  form.addEventListener('submit',e=>{ e.preventDefault(); const d=Object.fromEntries(new FormData(form).entries()); const msg=`Hola PlusAuto, soy ${d.nombre}. Quiero probar el ${titulo(v)} ${v.version||''} (${eur(v.precio)}). Me viene bien: ${d.dia||'cualquier día'}${d.hora?' '+d.hora:''}. Mi teléfono: ${d.tel}.`; window.open(waLink(msg),'_blank','noopener'); closeModal(); toast('Te abrimos WhatsApp con la solicitud lista'); });

  /* --- similares --- */
  const sim=disponibles().filter(x=>x.id!==v.id && x.tipo===v.tipo).sort((a,b)=>Math.abs(a.precio-v.precio)-Math.abs(b.precio-v.precio)).slice(0,4);
  renderGrid($('#simGrid'),sim);

  /* --- datos estructurados --- */
  try{ const ld={"@context":"https://schema.org","@type":v.tipo==='moto'?'Motorcycle':'Car',"name":`${titulo(v)} ${v.version||''}`.trim(),"brand":{"@type":"Brand","name":v.marca},"model":v.modelo,"vehicleModelDate":String(v.anio),"mileageFromOdometer":{"@type":"QuantitativeValue","value":v.km,"unitCode":"KMT"},"fuelType":v.combustible,"vehicleTransmission":v.cambio,"color":v.color,"image":v.fotos.map(f=>location.origin+f),"offers":{"@type":"Offer","price":v.precio,"priceCurrency":"EUR","availability":sold?"https://schema.org/SoldOut":"https://schema.org/InStock","seller":{"@type":"AutoDealer","name":"PlusAuto Motor"}}}; const s=document.createElement('script'); s.type='application/ld+json'; s.textContent=JSON.stringify(ld); document.head.appendChild(s); }catch(e){}
});
