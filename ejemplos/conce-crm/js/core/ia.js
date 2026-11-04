/* =====================================================================
   Asistente IA de WhatsApp (simulado con reglas, sin API):
   entiende disponibilidad, precio, cuota, tasación, citas con día y hora,
   garantía, equipamiento, horario… usando el stock y la agenda reales.
   App.ia.responder(contactId, texto) → Promise<{texto, segundos, accion, vehicleId}>
   ===================================================================== */
(function(){
const App = window.App;
const {db} = App;
const ctx = {};   // contexto efímero por conversación: huecos ofrecidos, día hablado…

const N = s => App.norm(s).replace(/[¿?¡!.,;:()"]/g, ' ').replace(/\s+/g, ' ').trim();
const has = (t, re) => re.test(t);
const first = c => (c && c.nombre && !/^cliente\b/i.test(c.nombre) ? c.nombre.split(' ')[0] : '');
const nombreV = v => `${v.marca} ${v.modelo}`;
const eur = App.eur;

/* ---------- horario del concesionario ---------- */
const HORARIO = {1: [[9.5, 14], [17, 20.5]], 2: [[9.5, 14], [17, 20.5]], 3: [[9.5, 14], [17, 20.5]], 4: [[9.5, 14], [17, 20.5]], 5: [[9.5, 14], [17, 20.5]], 6: [[10, 14]], 0: []};
const abierto = d => { const h = d.getHours() + d.getMinutes() / 60; return (HORARIO[d.getDay()] || []).some(([a, b]) => h >= a && h + 0.75 <= b + 0.001); };
const ocupado = (d, userId) => App.S.events.some(e => e.estado !== 'cancelada' && (!userId || e.userId === userId) && new Date(e.inicio) < App.addMin(d, 45) && new Date(e.fin) > d);
function huecos(dia, userId, {n = 2, desde = null, tarde = null} = {}) {
  const out = [];
  const base = new Date(dia); base.setHours(0, 0, 0, 0);
  for (let m = 9 * 60 + 30; m <= 20 * 60; m += 30) {
    const d = new Date(base); d.setMinutes(m);
    if (desde && d < desde) continue;
    if (d < App.addMin(new Date(), 60)) continue;
    if (tarde === true && d.getHours() < 16) continue;
    if (tarde === false && d.getHours() >= 15) continue;
    if (!abierto(d) || ocupado(d, userId)) continue;
    // separa los huecos ofrecidos (no dos seguidos)
    if (out.length && (d - out[out.length - 1]) < 60 * 6e4) continue;
    out.push(d); if (out.length >= n) break;
  }
  return out;
}
function siguienteDiaConHueco(desde, userId, opts) {
  for (let i = 0; i < 8; i++) { const d = App.addDays(desde, i); const h = huecos(d, userId, opts); if (h.length) return {dia: d, huecos: h}; }
  return null;
}
const diaTxt = d => { const n = App.daysBetween(new Date(), d); return n === 0 ? 'hoy' : n === 1 ? 'mañana' : 'el ' + App.DIAS[d.getDay()] + ' ' + d.getDate(); };
const horaTxt = d => App.hora(d).replace(/^0/, '');

/* ---------- extracción ---------- */
const DIAS_RE = {domingo: 0, lunes: 1, martes: 2, miercoles: 3, jueves: 4, viernes: 5, sabado: 6};
function parseDia(t) {
  if (has(t, /pasado manana/)) return App.addDays(App.today(), 2);
  if (/\bmanana\b/.test(t.replace(/(por|de) la manana/g, ''))) return App.addDays(App.today(), 1);
  if (has(t, /\bhoy\b|esta tarde|esta manana/)) return App.today();
  for (const [k, v] of Object.entries(DIAS_RE)) if (new RegExp('\\b' + k + '\\b').test(t)) { const hoy = App.today(); let dd = (v - hoy.getDay() + 7) % 7; if (dd === 0) dd = 7; return App.addDays(hoy, dd); }
  if (has(t, /fin de semana|finde/)) { const hoy = App.today(); return App.addDays(hoy, (6 - hoy.getDay() + 7) % 7 || 7); }
  return null;
}
function parseHora(t, franjaTarde) {
  let m = t.match(/\ba las (\d{1,2})(?:[:.h ](\d{2}))?\b/) || t.match(/\b(\d{1,2})[:.h](\d{2})\b/) || t.match(/\bsobre las (\d{1,2})(?:[:.](\d{2}))?/) || t.match(/\b(\d{1,2}) (?:y media)\b/) || t.match(/\b(\d{1,2}) ?(?:h|horas)\b/);
  if (!m) { const solo = t.match(/^(?:vale |ok |perfecto |pues )?(?:a )?las? (\d{1,2})(?:[:.](\d{2}))?$/); if (solo) m = solo; }
  if (!m) return null;
  let h = +m[1], mi = m[2] ? +m[2] : (/y media/.test(t) ? 30 : 0);
  if (h > 23 || mi > 59) return null;
  if (h >= 1 && h <= 8) h += 12;                 // "a las 6" → 18:00
  if (franjaTarde && h < 12) h += 12;
  return {h, m: mi};
}
function nums(t) {
  // "3.000", "3000", "3 mil", "3k"
  const out = [];
  t.replace(/(\d{1,3}(?:\.\d{3})+|\d+)(\s?(mil|k)\b)?/g, (all, n, _, mil) => { let v = +n.replace(/\./g, ''); if (mil) v *= 1000; out.push(v); });
  return out;
}
function buscarVehiculo(t) {
  const stock = db.stock();
  const alias = v => [N(v.modelo), N(v.modelo).replace(/[\s.-]/g, ''), N(v.marca + ' ' + v.modelo)];
  const hits = stock.filter(v => alias(v).some(a => a.length > 1 && (new RegExp('\\b' + a.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b').test(t) || t.replace(/[\s.-]/g, '').includes(a.replace(/[\s.-]/g, '')) && a.replace(/[\s.-]/g, '').length > 3)));
  if (hits.length) return hits.sort((a, b) => (a.estado === 'disponible' ? 0 : 1) - (b.estado === 'disponible' ? 0 : 1))[0];
  const marcas = stock.filter(v => new RegExp('\\b' + N(v.marca) + '\\b').test(t));
  return marcas.length === 1 ? marcas[0] : null;
}

/* ---------- piezas de respuesta ---------- */
const cuotaTxt = (v, entrada = 0, meses = 96) => `${App.num(db.cuota(v.precio, entrada, meses))} €/mes`;
function ficha(v) {
  return `• ${v.anio} · ${App.km(v.km)} · ${v.cambio.toLowerCase()} · ${v.cv} CV\n• ${eur(v.precio)} al contado\n• Desde ${cuotaTxt(v)} financiado\n• ${v.garantia} meses de garantía`;
}
function ofrecerHuecos(c, v, dia, tarde) {
  const uid = c.asignado || 'u2';
  let r = dia ? {dia, huecos: huecos(dia, uid, {tarde})} : null;
  let cambio = '';
  if (!r || !r.huecos.length) {
    const desde = dia ? App.addDays(dia, 1) : App.today();
    if (dia && dia.getDay() === 0) cambio = 'Los domingos estamos cerrados. ';
    else if (dia) cambio = `${App.cap(diaTxt(dia))} ya no me quedan huecos${tarde === true ? ' por la tarde' : ''}. `;
    r = siguienteDiaConHueco(desde, uid, {tarde}) || siguienteDiaConHueco(desde, uid, {});
  }
  if (!r) return {texto: '¿Qué día te vendría bien pasarte? Te busco un hueco.'};
  ctx[c.id] = {dia: r.dia, huecos: r.huecos, vehicleId: v && v.id};
  const hs = r.huecos.map(horaTxt);
  const com = (db.user(uid) || {}).nombre?.split(' ')[0] || 'un compañero';
  return {texto: `${cambio}${App.cap(diaTxt(r.dia))} tengo libre a las ${hs.join(' o a las ')}${v ? ` para ver y probar el ${nombreV(v)}` : ''}. Te atendería ${com}. ${hs.length > 1 ? '¿Cuál te viene mejor?' : '¿Te viene bien?'}`};
}
function reservar(c, v, fecha) {
  const uid = c.asignado || 'u2';
  if (fecha.getDay() === 0) return {texto: 'Los domingos estamos cerrados 😅 ¿Te viene bien el lunes?'};
  if (!abierto(fecha)) {
    const alt = huecos(fecha, uid, {n: 2});
    if (alt.length) { ctx[c.id] = {dia: fecha, huecos: alt, vehicleId: v && v.id}; return {texto: `A las ${horaTxt(fecha)} estamos cerrados (${App.S.dealer.horario}). Ese día puedo a las ${alt.map(horaTxt).join(' o a las ')}. ¿Te cuadra alguna?`}; }
    return ofrecerHuecos(c, v, App.addDays(fecha, 1));
  }
  if (fecha < App.addMin(new Date(), 30)) return ofrecerHuecos(c, v, App.today());
  if (ocupado(fecha, uid)) {
    const alt = huecos(fecha, uid, {n: 2, desde: App.addMin(fecha, -120)});
    if (alt.length) { ctx[c.id] = {dia: fecha, huecos: alt, vehicleId: v && v.id}; return {texto: `A las ${horaTxt(fecha)} ya tengo otra prueba. Te puedo dar las ${alt.map(horaTxt).join(' o las ')}. ¿Te viene bien?`}; }
    return ofrecerHuecos(c, v, App.addDays(fecha, 1));
  }
  const com = (db.user(uid) || {}).nombre?.split(' ')[0] || 'nuestro comercial';
  ctx[c.id] = {vehicleId: v && v.id};
  const evento = {tipo: v ? 'prueba' : 'visita', contactId: c.id, vehicleId: v ? v.id : null, userId: uid, inicio: fecha.toISOString(), fin: App.addMin(fecha, 45).toISOString(), estado: 'confirmada', origen: 'ia', recordatorio: true, notas: 'Agendada por la IA por WhatsApp'};
  const extra = c.financiar || /financ/.test(N((db.mensajes(c.id).map(m => m.texto).join(' ')))) ? ' Si quieres financiar, trae el DNI y la última nómina y te lo dejamos preaprobado ese día.' : '';
  return {texto: `¡Hecho! ✅ Te espero ${diaTxt(fecha)} a las ${horaTxt(fecha)}${v ? ` para probar el ${nombreV(v)}` : ''}. Te atenderá ${com} en ${App.S.dealer.direccion}.${extra}\n\nTe mando un recordatorio unas horas antes.`, accion: {tipo: 'cita', evento}};
}

/* ---------- motor ---------- */
function construir(c, textoCliente) {
  const t = N(textoCliente);
  const tn = App.norm(textoCliente);
  const nombre = first(c);
  const suyo = has(t, /tengo un|tengo una|mi coche|dejar (mi|el)|a cuenta|vender (mi|el)|entregar (mi|el)/) && !has(t, /me interesa|quiero el|quiero la|vuestro/);
  const mencionado = suyo ? null : buscarVehiculo(t);
  let v = mencionado || db.veh((ctx[c.id] || {}).vehicleId) || db.veh(c.interes && c.interes[0]);
  if (v && v.estado === 'vendido') v = null;
  if (mencionado) ctx[c.id] = Object.assign(ctx[c.id] || {}, {vehicleId: mencionado.id});
  const partes = [];
  let accion = null;
  const tarde = has(t, /tarde/) ? true : has(t, /por la manana|temprano/) ? false : null;

  // 1) cita con hora (con o sin día) o eligiendo un hueco ofrecido
  const cx = ctx[c.id];
  const hora = parseHora(t, tarde === true);
  let dia = parseDia(t);
  if (cx && cx.huecos && !dia && (hora || has(t, /primera|segunda|la de las|esa|vale|perfecto|me viene bien|genial/))) {
    let elegido = null;
    if (hora) elegido = cx.huecos.find(h => h.getHours() === hora.h && h.getMinutes() === hora.m) || (() => { const d = new Date(cx.dia); d.setHours(hora.h, hora.m, 0, 0); return d; })();
    else if (has(t, /segunda/)) elegido = cx.huecos[1];
    else if (has(t, /primera|esa|vale|perfecto|me viene bien|genial/)) elegido = cx.huecos[0];
    if (elegido) { const r = reservar(c, v, elegido); return {texto: r.texto, accion: r.accion || null, vehicleId: v && v.id}; }
  }
  if (hora && (dia || has(t, /prueba|probar|ver|pasar|ir|cita|quedar|visita|voy|puedo/))) {
    const d = new Date(dia || App.today()); d.setHours(hora.h, hora.m, 0, 0);
    if (!dia && d < new Date()) d.setDate(d.getDate() + 1);
    const r = reservar(c, v, d); return {texto: r.texto, accion: r.accion || null, vehicleId: v && v.id};
  }

  // 2) intenciones
  const quiereCita = (dia && t.split(' ').length <= 4) || has(t, /prueba|probar|verlo|verla|ver el|ver la|pasarme|pasar a|ir a ver|visitar|cita|quedar|acercarme|me paso|puedo ir|podria ir|cuando puedo/) || (dia && has(t, /puedo|podria|ir|pasar|ver/));
  const precio = has(t, /ultimo precio|precio final|rebaja|descuento|negociable|negociar|mejor precio|lo dejais en|dejarmelo|me lo dejas|regatear|lo menos|ultimo/);
  const financia = has(t, /cuota|financ|al mes|mensual|a plazos|plazos|entrada|meses|anos|prestamo|pagar poco a poco/);
  const tasa = has(t, /tasa|a cuenta|dejar (mi|el) coche|entregar (mi|el)|vender (mi|el)|tengo un|tengo una|mi coche|cambio de coche|dar mi/);
  const disp = has(t, /disponible|sigue|todavia|aun lo|esta vendido|lo teneis|os queda/);
  const garantia = has(t, /garantia/);
  const horario = has(t, /horario|abris|abierto|cerrais|a que hora|donde estais|direccion|ubicacion|como llego|donde esta/);
  const equip = has(t, /extra|equipamiento|camara|navegador|carplay|android auto|sensores|climatizador|techo|asientos calefact|led|bluetooth|crucero|lleva|tiene/) && !financia && !disp;
  const fotos = has(t, /foto|video|interior|maletero|mas imagen/);
  const consumo = has(t, /consumo|gasta|autonomia|bateria|carga|etiqueta|eco|electrico|hibrido/);
  const docs = has(t, /papeles|itv|duenos|dueno|revisiones|cargas|embargo|libro|historial|accidente/);
  const entrega = has(t, /transferencia|entrega|cuanto tarda|cuando me lo|matricula|gestoria|seguro/);
  const km = has(t, /kilometro|\bkm\b|kms|ano tiene|de que ano/);
  const saludo = has(t, /^(hola|buenas|buenos dias|buenas tardes|buenas noches|hey|hello)( [a-z]+)?$/);
  const gracias = has(t, /^(gracias|muchas gracias|ok|vale|perfecto|genial|de acuerdo|estupendo|guay|entendido)( gracias| muchas gracias)?$/);

  const busca = !mencionado && !suyo && has(t, /busco|buscando|barato|economico|presupuesto|hasta \d|menos de \d|\bsuv\b|automatico|familiar|diesel|electrico|hibrido|pequeno|para mi hijo|para mi hija|que teneis|que coches/);
  if (busca && !precio) {
    const max = nums(tn).filter(n => n >= 3000).sort((a, b) => a - b)[0] || (has(t, /barato|economico/) ? 14000 : Infinity);
    let lista = db.stock().filter(x => x.estado === 'disponible' && x.precio <= max);
    if (has(t, /\bsuv\b/)) lista = lista.filter(x => /SUV/.test(x.carroceria));
    if (has(t, /automatico/)) lista = lista.filter(x => x.cambio === 'Automático');
    if (has(t, /electrico/)) lista = lista.filter(x => x.combustible === 'Eléctrico');
    if (has(t, /hibrido/)) lista = lista.filter(x => /Híbrido/.test(x.combustible));
    if (has(t, /diesel/)) lista = lista.filter(x => x.combustible === 'Diésel');
    if (has(t, /pequeno|para mi hijo|para mi hija/)) lista = lista.filter(x => /Urbano|Compacto/.test(x.carroceria));
    lista = lista.sort((a, b) => a.precio - b.precio).slice(0, 3);
    if (lista.length) { partes.push(`Te paso ${lista.length === 1 ? 'la opción que mejor encaja' : `las ${lista.length} opciones que mejor encajan`}:\n\n${lista.map(x => `• ${nombreV(x)} ${x.anio} · ${App.km(x.km)} · ${eur(x.precio)} (desde ${cuotaTxt(x)})`).join('\n')}\n\n¿Te cuento más de alguno o prefieres venir a verlos?`); v = lista[0]; ctx[c.id] = Object.assign(ctx[c.id] || {}, {vehicleId: v.id}); }
    else partes.push('Ahora mismo no tengo nada exactamente así en exposición, pero nos entran coches cada semana. ¿Te aviso en cuanto llegue uno que encaje?');
  }
  if (precio) {
    const com = (db.user(c.asignado) || {nombre: 'nuestro comercial'}).nombre.split(' ')[0];
    partes.push(`${v ? `El ${nombreV(v)} está a ${eur(v.precio)} y ya está muy ajustado a mercado, con ${v.garantia} meses de garantía y la transferencia incluida.` : 'Los precios ya están muy ajustados a mercado.'} Para hablar de precio final prefiero pasarte con ${com}, que lleva tu caso: te escribe en unos minutos 🙂`);
    accion = {tipo: 'humano'};
  }
  if (tasa && !precio) {
    const m = textoCliente.match(/\b(19|20)\d{2}\b/);
    const kmM = nums(tn).find(n => n >= 10000 && n < 500000);
    let orient = '';
    if (m) { const edad = new Date().getFullYear() - +m[0]; const base = Math.max(1200, 16000 * Math.pow(0.86, edad) - (kmM ? (kmM - edad * 15000) * 0.03 : 0)); orient = ` Por lo que me cuentas, orientativamente podría rondar los ${App.num(Math.round(base * .9 / 100) * 100)}-${App.num(Math.round(base * 1.1 / 100) * 100)} €, pero te lo confirmamos viéndolo.`; }
    partes.push(`¡Claro! Aceptamos tu coche como parte del pago.${orient} Mándame 4 fotos (delante, detrás, interior y cuentakilómetros) y te doy una valoración hoy mismo, o si prefieres lo tasamos aquí en 20 minutos.`);
  }
  if (financia && !precio) {
    const ns = nums(tn);
    const entrada = ns.find(n => n >= 300 && n < 60000 && (!v || n < v.precio)) || 0;
    let meses = 96; const mm = t.match(/(\d{2,3}) meses/); const aa = t.match(/(\d{1,2}) anos/);
    if (mm) meses = App.clamp(+mm[1], 12, 120); else if (aa) meses = App.clamp(+aa[1] * 12, 12, 120);
    if (v) partes.push(`Con ${entrada ? eur(entrada) + ' de entrada' : 'entrada 0'} y a ${meses} meses, el ${nombreV(v)} se queda en unos ${cuotaTxt(v, entrada, meses)} (TIN ${App.dec(App.S.dealer.tin)} %, cálculo orientativo). Con el DNI y la última nómina te lo dejamos preaprobado en el día.`);
    else partes.push(`Financiamos hasta 120 meses, con o sin entrada, y lo tramitamos con 5 financieras para darte la mejor cuota. ¿Qué coche te interesa y cuánto querrías pagar al mes?`);
  }
  if (disp && v && !precio) partes.unshift(`¡Hola${nombre ? ' ' + nombre : ''}! Sí, el ${nombreV(v)} ${v.version.split(' ').slice(0, 3).join(' ')} sigue disponible 🙌\n\n${ficha(v)}`);
  if (km && v && !disp && !suyo) partes.push(`Es de ${v.anio} y tiene ${App.km(v.km)}, con libro de revisiones al día.`);
  if (garantia) partes.push(`${v ? `El ${nombreV(v)} lleva` : 'Todos nuestros coches llevan'} ${v ? v.garantia : App.S.dealer.garantia} meses de garantía: motor, caja de cambios y electrónica. Y antes de entregarlo pasa revisión completa en nuestro taller.`);
  if (equip && v) {
    const EQL = {camara:'cámara trasera', navegador:'navegador', carplay:'Apple CarPlay', 'android auto':'Android Auto', sensores:'sensores de aparcamiento', climatizador:'climatizador', techo:'techo panorámico', 'asientos calefact':'asientos calefactables', led:'faros LED', bluetooth:'Bluetooth', crucero:'control de crucero'};
    const pedido = Object.keys(EQL).find(k => t.includes(k));
    const lista = v.equipamiento || [];
    const clave = {carplay:'carplay', 'android auto':'android'}[pedido] || (pedido || '').split(' ')[0];
    if (pedido) { const ok = lista.find(e => N(e).includes(clave)); const otra = !ok && db.stock().find(x => x.id !== v.id && x.estado === 'disponible' && (x.equipamiento || []).some(e => N(e).includes(clave)) && Math.abs(x.precio - v.precio) < 6000); partes.push(ok ? `Sí, el ${nombreV(v)} lleva ${ok.charAt(0).toLowerCase() + ok.slice(1)} 👍 Además: ${lista.filter(e => e !== ok).slice(0, 4).join(', ').toLowerCase()}.` : `Esa unidad no lleva ${EQL[pedido]}, pero sí ${lista.slice(0, 4).join(', ').toLowerCase()}.${otra ? ` Si es imprescindible, el ${nombreV(otra)} de ${otra.anio} (${eur(otra.precio)}) sí lo tiene.` : ''}`); }
    else partes.push(`Viene con ${lista.slice(0, 6).join(', ').toLowerCase()}.`);
  }
  if (fotos) partes.push(`Ahora mismo te grabo un vídeo del ${v ? nombreV(v) : 'coche'} por dentro y por fuera y te lo mando por aquí 📹`);
  if (consumo && v) partes.push(v.combustible === 'Eléctrico' ? `El ${nombreV(v)} tiene una autonomía real de unos 400-450 km y carga rápida del 5 al 80 % en unos 30 minutos. Etiqueta 0.` : /Híbrido/.test(v.combustible) ? `El ${nombreV(v)} es ${v.combustible.toLowerCase()}, gasta alrededor de 4,5-5,5 l/100 km y tiene etiqueta ${v.etiqueta}.` : `El ${nombreV(v)} gasta alrededor de ${v.combustible === 'Diésel' ? '4,8' : '5,6'} l/100 km en uso mixto y tiene etiqueta ${v.etiqueta}.`);
  if (docs && v) partes.push(`Tiene ${v.duenos} ${v.duenos > 1 ? 'dueños' : 'solo dueño'}, libro de revisiones, ITV en vigor hasta ${v.itv.split('-').reverse().join('/')} e informe de la DGT sin cargas ni embargos. Te lo mando si quieres.`);
  if (entrega) partes.push('La transferencia y la gestoría van incluidas. Desde que firmas, te lo llevas en 48-72 horas, revisado y lavado.');
  if (horario) partes.push(`Estamos en ${App.S.dealer.direccion}. Horario: ${App.S.dealer.horario}.`);

  if (quiereCita && !accion) {
    const r = ofrecerHuecos(c, v, dia, tarde);
    partes.push(r.texto);
  } else if (partes.length && !accion && !gracias && !has(t, /\?$/) && v && !partes.some(p => /\?/.test(p))) {
    partes.push(`¿Te gustaría venir a verlo${financia ? ' y dejar la financiación preaprobada' : ''}?`);
  }

  if (!partes.length) {
    if (gracias) partes.push('¡A ti! Cualquier cosa, aquí estoy 🙂');
    else if (saludo) partes.push(v ? `¡Hola${nombre ? ' ' + nombre : ''}! 👋 ¿Te interesa el ${nombreV(v)}? Está disponible a ${eur(v.precio)} o desde ${cuotaTxt(v)}. ¿Qué te gustaría saber?` : `¡Hola${nombre ? ' ' + nombre : ''}! 👋 Soy el asistente de ${App.S.dealer.nombre}. ¿Qué coche estás buscando? Tenemos ${db.stock().length} en exposición.`);
    else if (v) partes.push(`Te cuento del ${nombreV(v)}:\n\n${ficha(v)}\n\n¿Quieres venir a verlo o prefieres que te llame un compañero?`);
    else {
      const d = db.stock().filter(x => x.estado === 'disponible');
      const suv = d.filter(x => /SUV/.test(x.carroceria)).length;
      partes.push(`Ahora mismo tenemos ${d.length} coches disponibles (${suv} SUV), desde ${eur(Math.min(...d.map(x => x.precio)))}. Dime qué buscas (tipo de coche, presupuesto o cuota al mes) y te paso las mejores opciones.`);
    }
  }
  return {texto: partes.slice(0, 3).join('\n\n'), accion, vehicleId: v && v.id};
}

App.ia = {
  huecos,
  responder(contactId, texto) {
    const c = db.contact(contactId) || {id: contactId, nombre: '', interes: [], asignado: 'u2'};
    let r;
    try { r = construir(c, texto || ''); } catch (e) { console.error(e); r = {texto: 'Perdona, ¿me lo puedes repetir? Quiero asegurarme de darte la información correcta.', accion: null}; }
    const segundos = Math.round(6 + Math.random() * 30);
    return new Promise(res => setTimeout(() => res(Object.assign({segundos}, r)), 250));
  },
  _ctx: ctx
};
})();
