/* PlusAuto Motor — landing motos eléctricas */
document.addEventListener('pa:ready',()=>{
  const {S,$,$$,renderGrid,initSilenceViewer,byId,eur,fmt,cuotaDe}=window.PA;
  initSilenceViewer($('#silenceMotos'));
  renderGrid($('#otrasMotos'), S.filter(v=>v.tipo==='moto' && !v.silence && v.estado==='disponible'));
  const l1=byId('silence-s02-l1e'), l3=byId('silence-s02-l3e');
  // calculadora de ahorro
  const km=$('#ahKm'); if(km){
    let dias=5; const upd=()=>{ const kmMes=+km.value*dias*4.33; $('#ahKmL').textContent=km.value+' km'; const gas=kmMes*3.2/100*1.65, ev=kmMes*5.6/138*0.20; const ah=gas-ev; $('#ahGas').textContent=fmt(gas)+' €/mes'; $('#ahEv').textContent=(ev<1?'1':fmt(ev))+' €/mes'; $('#ahEvBar').style.width=Math.max(4,ev/gas*100)+'%'; $('#ahMes').textContent=fmt(ah)+' €'; $('#ahAnio').textContent=`${fmt(ah*12)} € al año · ${fmt(kmMes)} km al mes`; const c=l3?cuotaDe(l3):0; $('#ahCuota').textContent=c?`La cuota de la S02 L3e financiada sale desde ${fmt(c)} €/mes: ${ah>=c?'solo con la gasolina que te ahorras ya la tienes pagada':'con lo que te ahorras cubres '+Math.round(ah/c*100)+' % de la cuota'}.`:''; };
    km.addEventListener('input',upd); $$('#ahDias button').forEach(b=>b.addEventListener('click',()=>{ $$('#ahDias button').forEach(x=>x.classList.remove('on')); b.classList.add('on'); dias=+b.dataset.d; upd(); })); upd();
  }
  if(l1&&l3){ $('#pL1').textContent=eur(l1.precio); $('#pL3').textContent=eur(l3.precio); $('#cL1').textContent=fmt(cuotaDe(l1))+' €/mes*'; $('#cL3').textContent=fmt(cuotaDe(l3))+' €/mes*'; }
});
