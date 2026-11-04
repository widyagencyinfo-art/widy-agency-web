/* PlusAuto Motor — páginas interiores: financiación, tasación, taller, a la carta, contacto, comparador */
document.addEventListener('pa:ready',()=>{
  const {I,S,fmt,eur,esc,$,$$,params,cuota,cuotaDe,mesesDe,byId,disponibles,titulo,waLink,renderGrid,initCalc,bindWaForm,toast,getCmp,setCmp,toggleCmp,TIN}=window.PA;
  const page=document.body.dataset.page;

  /* ---------- utilidades ---------- */
  const row=(k,v)=>v?`<div><span>${esc(k)}</span><b>${esc(String(v))}</b></div>`:'';
  function optsSingle(root,hidden){ if(!root) return; $$('.opt',root).forEach(b=>b.addEventListener('click',()=>{ $$('.opt',root).forEach(x=>x.classList.remove('on')); b.classList.add('on'); hidden.value=b.dataset.v; hidden.dispatchEvent(new Event('change')); })); }
  function optsMulti(root,hidden){ if(!root) return; $$('.opt',root).forEach(b=>b.addEventListener('click',()=>{ b.classList.toggle('on'); hidden.value=$$('.opt.on',root).map(x=>x.dataset.v).join(', '); hidden.dispatchEvent(new Event('change')); })); }
  function openNow(){
    const el=$('#openNow'); if(!el) return;
    const d=new Date(), day=d.getDay(), h=d.getHours()+d.getMinutes()/60;
    const open=day>=1&&day<=5&&h>=9&&h<19;
    let txt='Abierto ahora · hasta las 19:00';
    if(!open){ const next=(day>=1&&day<=5&&h<9)?'hoy a las 9:00':(day>=1&&day<=4)?'mañana a las 9:00':'el lunes a las 9:00'; txt=`Cerrado ahora · abrimos ${next}`; el.style.cssText='background:var(--warn-soft);color:var(--warn)'; }
    el.innerHTML=`<span class="dot"${open?'':' style="background:var(--warn);box-shadow:0 0 0 4px rgba(183,121,31,.2)"'}></span>${txt}`;
  }
  function wizard(form,opts={}){
    const steps=$$('.wz__step',form), navs=$$('.wz__nav span',form), prev=$('[data-prev]',form), next=$('[data-next]',form), sub=$('[data-submit]',form);
    let i=0;
    const show=(n,scroll=true)=>{
      i=n; steps.forEach((s,j)=>s.classList.toggle('on',j===i)); navs.forEach((s,j)=>{ s.classList.toggle('on',j===i); s.classList.toggle('done',j<i); });
      prev.disabled=i===0; const last=i===steps.length-1; next.classList.toggle('hide',last); sub.classList.toggle('hide',!last);
      if(last&&opts.summary){ const sm=$('[data-summary]',form); if(sm) sm.innerHTML=opts.summary(Object.fromEntries(new FormData(form).entries())); }
      if(scroll) form.scrollIntoView({behavior:'smooth',block:'start'});
    };
    const valid=()=>{ for(const f of $$('input,select,textarea',steps[i])){ if(!f.checkValidity()){ f.reportValidity(); return false; } } return true; };
    next.addEventListener('click',()=>{ if(valid()) show(i+1); });
    prev.addEventListener('click',()=>show(Math.max(0,i-1)));
    navs.forEach((s,j)=>s.addEventListener('click',()=>{ if(j<i) show(j); }));
    form.addEventListener('keydown',e=>{ if(e.key==='Enter' && e.target.tagName!=='TEXTAREA' && i<steps.length-1){ e.preventDefault(); if(valid()) show(i+1); } });
    show(0,false);
    return {show,get step(){ return i; }};
  }
  const MARCAS=['Abarth','Alfa Romeo','Audi','BMW','BYD','Citroën','Cupra','Dacia','DS','Fiat','Ford','Honda','Hyundai','Jaecoo','Jeep','KIA','Land Rover','Lexus','Mazda','Mercedes','MG','MINI','Mitsubishi','Nissan','Omoda','Opel','Peugeot','Porsche','Renault','SEAT','Skoda','Smart','Subaru','Suzuki','Tesla','Toyota','Volkswagen','Volvo'];

  /* ---------- FINANCIACIÓN ---------- */
  if(page==='financiacion'){
    initCalc($('#calcFin'));
    // ¿qué puedo comprar con X €/mes?
    const rng=$('#affRange'), val=$('#affVal'), cnt=$('#affCount'), grid=$('#affGrid'); let tipo='';
    const renderAff=()=>{ const b=+rng.value; val.textContent=fmt(b); let list=disponibles().filter(v=>cuotaDe(v)<=b && (!tipo||v.tipo===tipo)).sort((x,y)=>y.precio-x.precio); cnt.textContent=list.length?`${list.length} ${list.length===1?'vehículo te sale':'vehículos te salen'} por ${fmt(b)} €/mes o menos`:'Con esa cuota no llegamos a nada todavía: sube un poco'; renderGrid(grid,list.slice(0,9),`<div class="empty">${I.euro}<h3>Sube la cuota un poco</h3><p>Nuestra moto más económica sale desde ${fmt(Math.min(...disponibles().map(cuotaDe)))} €/mes.</p></div>`); };
    rng.addEventListener('input',renderAff);
    $$('#affTipo button').forEach(b=>b.addEventListener('click',()=>{ $$('#affTipo button').forEach(x=>x.classList.remove('on')); b.classList.add('on'); tipo=b.dataset.t; renderAff(); }));
    renderAff();
    // asistente
    const form=$('#finWizard'), sel=$('#fVeh'), imp=$('#fImp'), ent=$('#fEnt'), plazoH=$('input[name=plazo]',form), out=$('#fCuota');
    const coches=disponibles().filter(v=>v.tipo==='coche'), motos=disponibles().filter(v=>v.tipo==='moto');
    sel.innerHTML+=`<optgroup label="Coches">${coches.map(v=>`<option value="${v.id}">${esc(titulo(v))} ${esc(v.version||'')} · ${eur(v.precio)}</option>`).join('')}</optgroup><optgroup label="Motos">${motos.map(v=>`<option value="${v.id}">${esc(titulo(v))} ${esc(v.version||'')} · ${eur(v.precio)}</option>`).join('')}</optgroup>`;
    const upd=()=>{ const P=+imp.value||0, E=+ent.value||0, n=+plazoH.value; out.textContent=P>E?`${fmt(cuota(P,n,E))} €/mes · ${n} meses`:'—'; };
    sel.addEventListener('change',()=>{ const v=byId(sel.value); if(v){ imp.value=v.precioFin||v.precio; const m=mesesDe(v); $$('#fPlazo button').forEach(b=>b.classList.toggle('on',+b.dataset.m===m)); plazoH.value=m; } upd(); });
    imp.addEventListener('input',upd); ent.addEventListener('input',upd);
    $$('#fPlazo button').forEach(b=>b.addEventListener('click',()=>{ $$('#fPlazo button').forEach(x=>x.classList.remove('on')); b.classList.add('on'); plazoH.value=b.dataset.m; upd(); }));
    if(params.get('v') && byId(params.get('v'))){ sel.value=params.get('v'); sel.dispatchEvent(new Event('change')); }
    upd();
    wizard(form,{summary:d=>{ const v=byId(d.vehiculo); const P=+d.importe||0,E=+d.entrada||0,n=+d.plazo; return row('Vehículo',v?`${titulo(v)} ${v.version||''}`:'Por decidir')+row('Importe',eur(P))+row('Entrada',eur(E))+row('Plazo',n+' meses')+row('Cuota orientativa',P>E?`${fmt(cuota(P,n,E))} €/mes`:'')+row('Situación',d.situacion)+row('Ingresos',d.ingresos); }});
    bindWaForm(form,d=>{ const v=byId(d.vehiculo); const P=+d.importe||0,E=+d.entrada||0,n=+d.plazo; return `Hola PlusAuto, quiero un estudio de financiación.\n• Vehículo: ${v?`${titulo(v)} ${v.version||''} (${eur(v.precio)})`:'todavía por decidir'}\n• Importe: ${eur(P)} · Entrada: ${eur(E)} · Plazo: ${n} meses\n• Cuota orientativa: ${P>E?fmt(cuota(P,n,E))+' €/mes':'—'}\n• Situación: ${d.situacion} (${d.antiguedad}) · Ingresos: ${d.ingresos} · Otras financiaciones: ${d.otras}\n• Nombre: ${d.nombre} · Tel: ${d.tel}${d.email?' · Email: '+d.email:''}`; },'#finOk');
    if(location.hash==='#estudio') setTimeout(()=>form.scrollIntoView({behavior:'smooth'}),300);
  }

  /* ---------- TASACIÓN ---------- */
  if(page==='tasacion'){
    $('#marcasList').innerHTML=MARCAS.map(m=>`<option value="${m}">`).join('');
    const form=$('#tasWizard');
    optsSingle($('#tEstado'),$('input[name=estado]',form));
    const fotos=$('#tFotos'), prev=$('#tPreviews'); let nFotos=0;
    fotos.addEventListener('change',()=>{ prev.innerHTML=''; const files=[...fotos.files].slice(0,10); nFotos=files.length; files.forEach(f=>{ const r=new FileReader(); r.onload=e=>{ const im=new Image(); im.src=e.target.result; im.alt=''; prev.appendChild(im); }; r.readAsDataURL(f); }); toast(`${nFotos} ${nFotos===1?'foto añadida':'fotos añadidas'}`); });
    wizard(form,{summary:d=>row('Coche',`${d.marca} ${d.modelo} ${d.version||''}`)+row('Año / km',`${d.anio} · ${fmt(+d.km||0)} km`)+row('Motor',`${d.combustible} · ${d.cambio}`)+row('Estado',d.estado)+row('ITV / propietarios',`${d.itv} · ${d.propietarios}`)+row('Financiación pendiente',d.financiado)+row('Fotos',nFotos?`${nFotos} (te las pedimos por WhatsApp)`:'Sin fotos por ahora')+row('Quiero',d.objetivo)});
    bindWaForm(form,d=>`Hola PlusAuto, quiero tasar mi coche.\n• ${d.marca} ${d.modelo} ${d.version||''}\n• Año ${d.anio} · ${fmt(+d.km||0)} km · ${d.combustible} · ${d.cambio}\n• Estado: ${d.estado} · ITV ${d.itv} · ${d.propietarios} propietario(s) · Libro: ${d.libro}\n• Financiación pendiente: ${d.financiado}${d.extras?'\n• Extras/notas: '+d.extras:''}\n• Objetivo: ${d.objetivo}\n• Nombre: ${d.nombre} · Tel: ${d.tel}${d.email?' · Email: '+d.email:''}${d.zona?' · Zona: '+d.zona:''}\n${nFotos?'Os adjunto '+nFotos+' fotos a continuación.':'Si queréis fotos, decidme y os las mando.'}`,'#tasOk');
  }

  /* ---------- TALLER ---------- */
  if(page==='taller'){
    window.PA.openNowBadge($('#openNow'));
    const form=$('#citaForm'), servH=$('input[name=servicios]',form), dia=$('#cDia'), slots=$('#cSlots'), horaH=$('input[name=hora]',form), note=$('#cSlotsNote'), res=$('#cResumen');
    optsMulti($('#cServ'),servH);
    const pad=n=>String(n).padStart(2,'0'); const iso=d=>`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
    const today=new Date(); let def=new Date(today); def.setDate(def.getDate()+1); while(def.getDay()===0||def.getDay()===6) def.setDate(def.getDate()+1);
    const max=new Date(today); max.setDate(max.getDate()+60);
    dia.min=iso(today); dia.max=iso(max); dia.value=iso(def);
    const fmtDia=s=>{ const [y,m,d]=s.split('-').map(Number); return new Date(y,m-1,d).toLocaleDateString('es-ES',{weekday:'long',day:'numeric',month:'long'}); };
    const renderSlots=()=>{
      horaH.value=''; slots.innerHTML='';
      if(!dia.value){ note.textContent='Elige primero un día.'; return; }
      const [y,m,d]=dia.value.split('-').map(Number); const dt=new Date(y,m-1,d); const wd=dt.getDay();
      if(wd===0||wd===6){ note.textContent='Los fines de semana el taller está cerrado. Elige de lunes a viernes.'; resumen(); return; }
      const isToday=iso(dt)===iso(today); const nowH=today.getHours()+today.getMinutes()/60+1;
      let html='';
      for(let h=9;h<19;h+=.5){ const t=`${pad(Math.floor(h))}:${h%1?'30':'00'}`; const past=isToday && h<nowH; html+=`<button type="button" class="opt" data-v="${t}" ${past?'disabled':''}>${t}</button>`; }
      slots.innerHTML=html; note.textContent=isToday?'Para hoy solo quedan los huecos a partir de una hora vista.':'Huecos de media hora, de 9:00 a 18:30.';
      $$('.opt',slots).forEach(b=>b.addEventListener('click',()=>{ $$('.opt',slots).forEach(x=>x.classList.remove('on')); b.classList.add('on'); horaH.value=b.dataset.v; resumen(); }));
      resumen();
    };
    const resumen=()=>{ res.innerHTML=row('Día',dia.value?fmtDia(dia.value):'')+row('Hora',horaH.value)+row('Servicios',servH.value)||'<div><span>Resumen</span><b>Elige servicio, día y hora</b></div>'; };
    dia.addEventListener('change',renderSlots); servH.addEventListener('change',resumen);
    renderSlots();
    form.addEventListener('submit',e=>{ if(!servH.value){ e.preventDefault(); e.stopImmediatePropagation(); toast('Elige al menos un servicio'); $('#cServ').scrollIntoView({behavior:'smooth',block:'center'}); return; } if(!horaH.value){ e.preventDefault(); e.stopImmediatePropagation(); toast('Elige una hora'); slots.scrollIntoView({behavior:'smooth',block:'center'}); } },true);
    bindWaForm(form,d=>`Hola PlusAuto, quiero cita en el taller.\n• Día: ${fmtDia(d.dia)} a las ${d.hora}\n• Servicio: ${d.servicios}\n• Vehículo: ${d.vehiculo} · Matrícula ${(d.matricula||'').toUpperCase()}${d.mensaje?'\n• Notas: '+d.mensaje:''}\n• Nombre: ${d.nombre} · Tel: ${d.tel}`,'#citaOk');
  }

  /* ---------- COCHES A LA CARTA ---------- */
  if(page==='alacarta'){
    const form=$('#cartaForm');
    optsSingle($('#aComb'),$('input[name=combustible]',form)); optsSingle($('#aCambio'),$('input[name=cambio]',form));
    bindWaForm(form,d=>`Hola PlusAuto, quiero que me busquéis un coche a la carta.\n• Marca: ${d.marca}${d.modelo?' · Modelo: '+d.modelo:''}\n• Presupuesto: hasta ${eur(+d.presupuesto||0)}${d.cuota?' (o unos '+d.cuota+' €/mes)':''}\n• ${d.combustible} · ${d.cambio}${d.km?' · máx. '+fmt(+d.km)+' km':''}${d.anio?' · del '+d.anio+' o más nuevo':''}${d.otros?'\n• Imprescindible: '+d.otros:''}\n• Nombre: ${d.nombre} · Tel: ${d.tel}`,'#cartaOk');
  }

  /* ---------- CONTACTO ---------- */
  if(page==='contacto'){
    window.PA.openNowBadge($('#openNow'));
    bindWaForm($('#contactForm'),d=>`Hola PlusAuto (${d.asunto}).\n${d.mensaje}\n• ${d.nombre} · Tel: ${d.tel}${d.email?' · Email: '+d.email:''}`,'#contactOk');
  }

  /* ---------- COMPARADOR ---------- */
  if(page==='comparar'){
    const sel=$('#cmpSel'), area=$('#cmpArea'), pick=$('#cmpPick');
    const ROWS=[
      {k:'Precio',f:v=>eur(v.precio),n:v=>v.precio,best:'min'},
      {k:'Cuota / mes *',f:v=>fmt(cuotaDe(v))+' €',n:cuotaDe,best:'min'},
      {k:'Tipo',f:v=>v.tipo==='moto'?'Moto':'Coche'},
      {k:'Estado',f:v=>v.condicion},
      {k:'Año',f:v=>v.anio,n:v=>v.anio,best:'max'},
      {k:'Kilómetros',f:v=>fmt(v.km)+' km',n:v=>v.km,best:'min'},
      {k:'Combustible',f:v=>v.combustible},
      {k:'Cambio',f:v=>v.cambio},
      {k:'Potencia',f:v=>v.cv?v.cv+' CV':'—',n:v=>v.cv||0,best:'max'},
      {k:'Carrocería',f:v=>v.carroceria},
      {k:'Puertas',f:v=>v.puertas||'—',only:'coche'},
      {k:'Plazas',f:v=>v.plazas||'—'},
      {k:'Etiqueta DGT',f:v=>v.etiqueta?'Etiqueta '+v.etiqueta:'—'},
      {k:'Color',f:v=>v.colores?'3 a elegir':v.color},
      {k:'Garantía',f:v=>v.garantia?v.garantia+' meses':'—',n:v=>v.garantia||0,best:'max'},
      {k:'Autonomía',f:v=>v.autonomia?v.autonomia+' km':'—',n:v=>v.autonomia||0,best:'max',only:'moto'},
      {k:'Velocidad máx.',f:v=>v.velocidad?v.velocidad+' km/h':'—',n:v=>v.velocidad||0,best:'max',only:'moto'},
      {k:'Batería',f:v=>v.bateria||'—',only:'moto'},
      {k:'Carnet',f:v=>v.carnetTxt||'—',only:'moto'},
      {k:'Fotos',f:v=>v.fotos.length,n:v=>v.fotos.length,best:'max'},
    ];
    const render=()=>{
      const list=getCmp().map(byId);
      sel.innerHTML='<option value="">Añadir un vehículo…</option>'+disponibles().filter(v=>!list.includes(v)).map(v=>`<option value="${v.id}">${esc(titulo(v))} ${esc(v.version||'')} · ${eur(v.precio)}</option>`).join('');
      sel.disabled=list.length>=3;
      const sug=disponibles().filter(v=>!list.includes(v)).filter(v=>v.destacado||['78a89628','e56da08f','1acbced5','d0b68c4c'].includes(v.id)).slice(0,4);
      pick.innerHTML=list.length>=3?'':`<span class="muted" style="font-size:.86rem;align-self:center">Sugerencias:</span>`+sug.map(v=>`<button type="button" class="chip chip--n" data-add="${v.id}">${I.plus}${esc(titulo(v))}</button>`).join('');
      $$('[data-add]',pick).forEach(b=>b.addEventListener('click',()=>{ toggleCmp(b.dataset.add); }));
      if(!list.length){ area.innerHTML=`<div class="empty">${I.cmp}<h3>Todavía no has elegido nada</h3><p>Añade hasta 3 vehículos con el desplegable de arriba, con las sugerencias, o desde el catálogo pulsando el icono de la balanza en cada tarjeta.</p><a class="btn btn--primary" href="/ejemplos/plusauto-web-widy/vehiculos">${I.search} Ir al catálogo</a></div>`; return; }
      const hasMoto=list.some(v=>v.tipo==='moto'), hasCoche=list.some(v=>v.tipo==='coche');
      let html=`<div class="cmp"><table><thead><tr><th>Vehículo</th>${list.map(v=>`<th><div class="cmp__head"><img src="${v.fotos[0]}" alt=""><b>${esc(titulo(v))}</b><small>${esc(v.version||'')}</small><span class="price num">${eur(v.precio)}<small>desde ${fmt(cuotaDe(v))} €/mes*</small></span><div class="row-actions"><a class="btn btn--ghost btn--sm" href="/ejemplos/plusauto-web-widy/vehiculo?id=${v.id}">Ver ficha</a><a class="btn btn--wa btn--sm" target="_blank" rel="noopener" href="${window.PA.waVehiculo(v)}">${I.wa}</a></div><button type="button" class="cmp__rm" data-rm="${v.id}">${I.x} Quitar</button></div></th>`).join('')}</tr></thead><tbody>`;
      ROWS.forEach(r=>{
        if(r.only==='moto'&&!hasMoto) return; if(r.only==='coche'&&!hasCoche) return;
        const vals=list.map(r.f); const same=vals.every(x=>x===vals[0]);
        let bestIdx=-1; if(r.best&&list.length>1&&!same){ const nums=list.map(r.n); const target=r.best==='min'?Math.min(...nums):Math.max(...nums); if(nums.filter(x=>x===target).length===1) bestIdx=nums.indexOf(target); }
        html+=`<tr class="${same?'':'diff'}"><td>${r.k}</td>${vals.map((x,i)=>`<td class="${i===bestIdx?'best':''}">${esc(String(x))}${i===bestIdx?' '+I.check.replace('class="i','class="i i--s'):''}</td>`).join('')}</tr>`;
      });
      html+='</tbody></table></div>';
      area.innerHTML=html;
      $$('[data-rm]',area).forEach(b=>b.addEventListener('click',()=>toggleCmp(b.dataset.rm)));
    };
    $('#cmpAddBtn').addEventListener('click',()=>{ if(sel.value){ toggleCmp(sel.value); } });
    sel.addEventListener('change',()=>{ if(sel.value){ toggleCmp(sel.value); } });
    $('#cmpClear').addEventListener('click',()=>{ setCmp([]); toast('Comparador vaciado'); });
    document.addEventListener('pa:cmp',render);
    if(params.get('ids')){ setCmp(params.get('ids').split(',').filter(id=>byId(id)).slice(0,3)); }
    render();
  }
});
