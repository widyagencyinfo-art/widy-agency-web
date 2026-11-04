/* PlusAuto Motor — catálogo con buscador inteligente + filtros */
document.addEventListener('pa:ready',()=>{
  const {I,S,fmt,eur,esc,$,$$,params,disponibles,parseQuery,applyFilters,sortList,renderGrid,initSmartSearch,getFavs,waLink,debounce}=window.PA;
  const grid=$('#grid'), countEl=$('#count'), interp=$('#interp'), sortSel=$('#sort'), filtersEl=$('#filters');
  const state={ q:params.get('q')||'', f:{}, manual:{}, sort:'reco' };

  /* --- filtros de URL --- */
  if(params.get('tipo')) state.manual.tipo=params.get('tipo');
  if(params.get('marca')) state.manual.marcas=[params.get('marca')];
  if(params.get('fav')) state.manual.favs=true;
  if(params.get('carroceria')) state.manual.carroceria=[params.get('carroceria')];
  if(params.get('cambio')) state.manual.cambio=params.get('cambio');
  if(params.get('precioMax')) state.manual.precioMax=+params.get('precioMax');
  if(params.get('kmMax')) state.manual.kmMax=+params.get('kmMax');
  if(params.get('combustible')) state.manual.combustible=[params.get('combustible')];

  const base=()=>disponibles();
  const merged=()=>{ const f=Object.assign({},state.f,state.manual); return f; };

  /* --- construir UI de filtros --- */
  const OPTS=[
    {k:'tipo',label:'Tipo',single:true,vals:[['coche','Coches'],['moto','Motos']]},
    {k:'marcas',label:'Marca',vals:()=>[...new Set(base().filter(v=>!merged().tipo||v.tipo===merged().tipo).map(v=>v.marca))].sort().map(m=>[m,m])},
    {k:'combustible',label:'Combustible',vals:()=>[...new Set(base().map(v=>v.combustible))].map(c=>[c,c])},
    {k:'cambio',label:'Cambio',single:true,vals:[['Manual','Manual'],['Automático','Automático']]},
    {k:'carroceria',label:'Carrocería',vals:()=>[...new Set(base().map(v=>v.carroceria))].map(c=>[c,c])},
    {k:'condicion',label:'Estado',single:true,vals:[['Nuevo','Nuevo'],['Seminuevo','Seminuevo'],['Ocasión','Ocasión']]},
  ];
  function countFor(k,val){ const f=Object.assign({},merged()); if(k==='tipo'||k==='cambio'||k==='condicion') f[k]=val; else f[k]=[val]; return applyFilters(base(),f).length; }
  function renderFilters(){
    const f=merged();
    let html=`<h3>Filtros <button type="button" id="clearAll">Limpiar</button></h3>`;
    OPTS.forEach(o=>{
      const vals=typeof o.vals==='function'?o.vals():o.vals;
      if(!vals.length) return;
      const rows=vals.map(([v,l])=>{ const on=o.single?f[o.k]===v:(f[o.k]||[]).includes(v); const n=countFor(o.k,v); return {v,l,on,n}; }).filter(r=>r.on||r.n||o.single);
      if(!rows.length) return;
      html+=`<div class="fgroup"><b>${o.label}</b><div class="opts">${rows.map(({v,l,on,n})=>`<button type="button" class="opt${on?' on':''}" data-k="${o.k}" data-v="${esc(v)}" ${!on&&!n?'disabled style="opacity:.35"':''}>${esc(l)}<span class="n">${n}</span></button>`).join('')}</div></div>`;
    });
    const pm=f.precioMax??70000, km=f.kmMax??120000;
    html+=`<div class="fgroup"><b>Precio máximo</b><div class="field"><label><span>Hasta</span><b id="pmL">${pm>=70000?'sin límite':eur(pm)}</b></label><input type="range" id="pm" min="2500" max="70000" step="500" value="${pm}" aria-label="Precio máximo"></div></div>`;
    html+=`<div class="fgroup"><b>Kilómetros máximos</b><div class="field"><label><span>Hasta</span><b id="kmL">${km>=120000?'sin límite':fmt(km)+' km'}</b></label><input type="range" id="km" min="0" max="120000" step="5000" value="${km}" aria-label="Kilómetros máximos"></div></div>`;
    html+=`<div class="fgroup"><b>Año mínimo</b><div class="select" style="display:flex"><select id="anio" aria-label="Año mínimo"><option value="">Cualquiera</option>${[2024,2023,2022,2021,2020,2019,2018].map(y=>`<option value="${y}" ${f.anioMin==y?'selected':''}>Del ${y} o más nuevo</option>`).join('')}</select>${I.chevD}</div></div>`;
    html+=`<div class="fgroup"><button type="button" class="opt${f.favs?' on':''}" id="favBtn">${I.heart} Solo mis favoritos<span class="n">${getFavs().length}</span></button></div>`;
    filtersEl.innerHTML=html;
    $$('.opt[data-k]',filtersEl).forEach(b=>b.addEventListener('click',()=>{
      const k=b.dataset.k, v=b.dataset.v, single=OPTS.find(o=>o.k===k).single;
      // el filtro manual manda sobre lo interpretado
      if(single){ state.manual[k]= merged()[k]===v ? null : v; if(state.manual[k]===null){ delete state.manual[k]; delete state.f[k]; } }
      else { const cur=(merged()[k]||[]).slice(); const i=cur.indexOf(v); if(i>=0) cur.splice(i,1); else cur.push(v); state.manual[k]=cur; if(!cur.length){ delete state.manual[k]; delete state.f[k]; } }
      if(k==='tipo'){ delete state.manual.marcas; delete state.f.marcas; }
      update();
    }));
    const pmR=$('#pm',filtersEl), kmR=$('#km',filtersEl);
    pmR.addEventListener('input',()=>{ $('#pmL',filtersEl).textContent=+pmR.value>=70000?'sin límite':eur(+pmR.value); });
    pmR.addEventListener('change',()=>{ if(+pmR.value>=70000){ delete state.manual.precioMax; delete state.f.precioMax; } else state.manual.precioMax=+pmR.value; update(); });
    kmR.addEventListener('input',()=>{ $('#kmL',filtersEl).textContent=+kmR.value>=120000?'sin límite':fmt(+kmR.value)+' km'; });
    kmR.addEventListener('change',()=>{ if(+kmR.value>=120000){ delete state.manual.kmMax; delete state.f.kmMax; } else state.manual.kmMax=+kmR.value; update(); });
    $('#anio',filtersEl).addEventListener('change',e=>{ if(e.target.value) state.manual.anioMin=+e.target.value; else { delete state.manual.anioMin; delete state.f.anioMin; } update(); });
    $('#favBtn',filtersEl).addEventListener('click',()=>{ if(merged().favs){ delete state.manual.favs; } else state.manual.favs=true; update(); });
    $('#clearAll',filtersEl).addEventListener('click',()=>{ state.manual={}; state.f={}; state.q=''; $('#catSearch .ss__input').value=''; history.replaceState(null,'','/ejemplos/plusauto-web-widy/vehiculos'); update(); });
  }

  /* --- interpretación de la búsqueda --- */
  function renderInterp(chips){
    if(!state.q || !chips.length){ interp.classList.add('hide'); return; }
    interp.classList.remove('hide');
    interp.innerHTML=`<span>${I.spark} He entendido:</span>${chips.map((c,i)=>`<button type="button" class="chip chip--x" data-chip="${i}" title="Quitar">${I[c.i]||''}${esc(c.t)}${I.x}</button>`).join('')}<button type="button" class="chip chip--n" id="clearQ">Borrar búsqueda</button>`;
    $$('[data-chip]',interp).forEach(b=>b.addEventListener('click',()=>{
      const c=chips[+b.dataset.chip];
      if(c.k==='sort'){ state.sort='reco'; sortSel.value='reco'; state.f._sort=null; }
      else if(c.k==='precio'){ delete state.f.precioMax; delete state.f.precioMin; delete state.f.aprox; }
      else if(c.k==='anio'){ delete state.f.anioMin; delete state.f.anioMax; }
      else if(c.v!==undefined){ state.f[c.k]=(state.f[c.k]||[]).filter(x=>x!==c.v); if(!state.f[c.k].length) delete state.f[c.k]; if(c.k==='modelos' && !state.f.modelos) {} }
      else delete state.f[c.k];
      if(c.k==='carnet' && state.f.tipo==='moto' && !chips.some(x=>x.k==='tipo')) delete state.f.tipo;
      chips.splice(+b.dataset.chip,1);
      update(chips);
    }));
    $('#clearQ',interp).addEventListener('click',()=>{ state.q=''; state.f={}; $('#catSearch .ss__input').value=''; history.replaceState(null,'','/ejemplos/plusauto-web-widy/vehiculos'+(location.search.includes('tipo=')?'?tipo='+state.manual.tipo:'')); update(); });
  }

  /* --- vacío --- */
  function emptyHTML(f){
    const relax=[];
    if(f.precioMax!=null) relax.push(['precioMax','Quitar el límite de precio']);
    if(f.cuotaMax!=null) relax.push(['cuotaMax','Quitar el límite de cuota']);
    if(f.kmMax!=null) relax.push(['kmMax','Quitar el límite de km']);
    if(f.anioMin) relax.push(['anioMin','Quitar el año mínimo']);
    if(f.cambio) relax.push(['cambio','Cualquier cambio']);
    if(f.combustible) relax.push(['combustible','Cualquier combustible']);
    if(f.carroceria) relax.push(['carroceria','Cualquier carrocería']);
    if(f.marcas) relax.push(['marcas','Cualquier marca']);
    if(f.colores) relax.push(['colores','Cualquier color']);
    if(f.texto) relax.push(['texto','Buscar de otra forma']);
    const msg=(f.marcas&&f.marcas.length&&!f.marcas.some(m=>S.some(v=>v.marca===m))) ? `Ahora mismo no tenemos ${f.marcas.join(' ni ')} en stock, pero lo buscamos por ti.` : 'No hay nada que encaje exactamente con lo que pides.';
    return `<div class="empty">${I.search}<h3>${esc(msg)}</h3><p>Prueba a relajar algún filtro o dinos qué buscas: con <b>Coches a la carta</b> te lo localizamos entre nuestros proveedores y te avisamos por WhatsApp cuando entre.</p><div class="row-actions">${relax.map(([k,l])=>`<button type="button" class="btn btn--ghost btn--sm" data-relax="${k}">${esc(l)}</button>`).join('')}</div><a class="btn btn--wa" target="_blank" rel="noopener" href="${waLink('Hola PlusAuto, estoy buscando: '+(state.q||'un vehículo concreto')+'. ¿Me avisáis cuando tengáis algo así?')}">${I.wa} Avisadme cuando entre</a></div>`;
  }

  /* --- render --- */
  function update(chipsOverride){
    const f=merged();
    let list=applyFilters(base(),f);
    const sort=(state.sort==='reco' && state.f._sort) ? state.f._sort : state.sort;
    list=sortList(list,sort);
    countEl.innerHTML=`${list.length} <span>${list.length===1?'vehículo':'vehículos'}${f.tipo?` · ${f.tipo==='moto'?'motos':'coches'}`:''}</span>`;
    renderGrid(grid,list,emptyHTML(f));
    $$('[data-relax]',grid).forEach(b=>b.addEventListener('click',()=>{ const k=b.dataset.relax; delete state.manual[k]; delete state.f[k]; if(k==='precioMax'){ delete state.f.aprox; } update(); }));
    renderFilters();
    if(chipsOverride) renderInterp(chipsOverride); else renderInterp(state.chips||[]);
    document.title=`${f.tipo==='moto'?'Motos':f.tipo==='coche'?'Coches':'Vehículos'}${state.q?` · «${state.q}»`:''} · PlusAuto Motor`;
    $('#pageTitle').textContent = f.tipo==='moto' ? 'Motos eléctricas' : f.tipo==='coche' ? 'Coches de ocasión y km 0' : 'Todo nuestro stock';
  }
  function runQuery(q){
    state.q=q; const r=parseQuery(q); state.f=r.f; state.chips=r.chips; state.f._sort=r.sort||null; state.sort='reco'; sortSel.value='reco';
    // si la búsqueda dice el tipo, manda sobre el manual
    if(r.f.tipo) delete state.manual.tipo;
    const u=new URL(location.href); u.searchParams.set('q',q); history.replaceState(null,'',u.pathname+'?'+u.searchParams.toString());
    update();
    window.scrollTo({top:$('#tools').offsetTop-90,behavior:'smooth'});
  }

  sortSel.addEventListener('change',()=>{ state.sort=sortSel.value; update(); });
  initSmartSearch($('#catSearch'),{onSubmit:runQuery,staticPlaceholder:true});
  if(state.q){ $('#catSearch .ss__input').value=state.q; const r=parseQuery(state.q); state.f=r.f; state.chips=r.chips; state.f._sort=r.sort||null; if(r.f.tipo) delete state.manual.tipo; }
  update();
  document.addEventListener('pa:favs',()=>{ if(merged().favs) update(); else renderFilters(); });

  /* --- filtros en móvil (bottom sheet) --- */
  const aside=$('#aside'), sheetBody=$('#sheetBody'), sheet=$('#sheet');
  const mq=matchMedia('(min-width:1024px)');
  const place=()=>{ (mq.matches?aside:sheetBody).appendChild(filtersEl); };
  mq.addEventListener('change',place); place();
  const openSheet=()=>{ sheet.classList.add('open'); document.body.style.overflow='hidden'; };
  const closeSheet=()=>{ sheet.classList.remove('open'); document.body.style.overflow=''; };
  $('#openFilters').addEventListener('click',openSheet);
  $('.sheet__bg',sheet).addEventListener('click',closeSheet);
  $('#sheetClose').addEventListener('click',closeSheet);
  $('#sheetApply').addEventListener('click',closeSheet);
  document.addEventListener('keydown',e=>{ if(e.key==='Escape') closeSheet(); });
  const updBadge=()=>{ const n=Object.keys(merged()).filter(k=>!['_sort','aprox','financiado','urbano','scooter'].includes(k)).length; $('#fCount').textContent=n?`(${n})`:''; };
  const _u=update; update=function(c){ _u(c); updBadge(); }; updBadge();
});
