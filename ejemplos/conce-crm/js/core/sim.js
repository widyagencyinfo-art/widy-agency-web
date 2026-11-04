/* =====================================================================
   «Lead en directo»: simula que entra un cliente por un portal o por
   Instagram, la IA le contesta en segundos, resuelve dudas y agenda
   la prueba de conducción. Todo queda guardado como si fuera real.
   ===================================================================== */
(function(){
const App = window.App;
const {db} = App;

const NOMBRES = ['Marta Salas Rivero','Javier Nieto Luque','Ana Belén Ruiz','Sergio Castaño Gil','Carmen Robles Díaz','Iván Pozo Moreno','Raquel Sosa Martín','Álvaro Cortés Vela','Noelia Gálvez Ramos','Diego Barrera León','Lorena Vidal Ortiz','Pablo Aranda Soto'];
const ORIGENES = [['wallapop', 'Wallapop'], ['cochesnet', 'coches.net'], ['meta', 'Instagram'], ['web', 'la web'], ['fbmarket', 'Marketplace']];
const PUEBLOS = ['Dos Hermanas','Mairena del Aljarafe','Alcalá de Guadaíra','Tomares','Sevilla','Utrera','Bormujos'];
let n = 0, corriendo = false;

function ding() {
  try {
    const ac = new (window.AudioContext || window.webkitAudioContext)();
    [[880, 0], [1320, .12]].forEach(([f, t]) => {
      const o = ac.createOscillator(), g = ac.createGain();
      o.type = 'sine'; o.frequency.value = f;
      g.gain.setValueAtTime(0.0001, ac.currentTime + t);
      g.gain.exponentialRampToValueAtTime(0.08, ac.currentTime + t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + t + 0.35);
      o.connect(g).connect(ac.destination); o.start(ac.currentTime + t); o.stop(ac.currentTime + t + 0.4);
    });
    setTimeout(() => ac.close(), 800);
  } catch (e) {}
}

const typing = (cid, on) => { if (on) App.T.typing[cid] = true; else delete App.T.typing[cid]; App.emit('change', 'typing'); };
const viendo = cid => location.hash.startsWith('#/whatsapp/' + cid);

async function cliente(cid, texto, espera) {
  await App.sleep(espera);
  db.addMessage(cid, {from: 'cliente', texto, leido: viendo(cid)});
}
async function ia(cid, texto, {pensar = 2600, extra = {}} = {}) {
  typing(cid, true);
  await App.sleep(pensar);
  typing(cid, false);
  const segundos = Math.max(3, Math.round(pensar / 1000) + Math.round(Math.random() * 3));
  db.addMessage(cid, Object.assign({from: 'ia', texto, ia: true, segundos}, extra));
  return segundos;
}

App.sim = {
  get corriendo() { return corriendo; },
  async lead({vehicleId, nombre} = {}) {
    if (corriendo) { App.toast('Ya hay un lead entrando', {sub: 'Espera a que termine la conversación', tipo: 'info'}); return; }
    corriendo = true;
    try {
      const usados = new Set(App.S.contacts.map(c => c.nombre));
      nombre = nombre || NOMBRES.find(x => !usados.has(x)) || NOMBRES[n % NOMBRES.length] + ' ' + (++n);
      const candidatos = db.stock().filter(v => v.estado === 'disponible' && v.fotos.length && v.precio < 35000);
      const v = db.veh(vehicleId) || candidatos[Math.floor(Math.random() * candidatos.length)];
      const [origen, origenTxt] = ORIGENES[Math.floor(Math.random() * ORIGENES.length)];
      const comerciales = ['u2', 'u3'];
      const asignado = comerciales[App.S.contacts.filter(c => c.etapa === 'nuevo').length % 2];
      const com = db.user(asignado).nombre.split(' ')[0];
      const primero = nombre.split(' ')[0];
      const tel = '6' + Math.floor(10 + Math.random() * 89) + ' ' + Math.floor(10 + Math.random() * 89) + ' ' + Math.floor(10 + Math.random() * 89) + ' ' + Math.floor(10 + Math.random() * 89);

      // 1 · entra el lead
      const c = db.addContact({nombre, tel, email: App.norm(primero) + '.' + Math.floor(Math.random() * 90 + 10) + '@gmail.com', ciudad: PUEBLOS[Math.floor(Math.random() * PUEBLOS.length)], origen, etapa: 'nuevo', temperatura: 'caliente', interes: [v.id], presupuesto: Math.round(v.precio / 1000) * 1000, financiar: true, asignado, iaActiva: true, autor: 'sistema', etiquetas: ['Financiación']});
      App.S.contacts[0].timeline[0] = Object.assign(App.S.contacts[0].timeline[0], {texto: `Lead desde ${origenTxt} · ${v.marca} ${v.modelo}`, autor: 'sistema'});
      if (v.portales[origen]) v.portales[origen].leads++;
      await cliente(c.id, `Hola! He visto el ${v.marca} ${v.modelo} en ${origenTxt}. ¿Sigue disponible? ¿Se puede financiar?`, 150);
      ding();
      db.notify({tipo: 'lead', titulo: `Nuevo lead de ${App.C.origen(origen).label}`, texto: `${primero} pregunta por el ${v.marca} ${v.modelo}`, link: '#/whatsapp/' + c.id});
      App.toast(`Nuevo lead · ${App.C.origen(origen).label}`, {sub: `${nombre.split(' ').slice(0, 2).join(' ')} pregunta por el ${v.marca} ${v.modelo}`, tipo: 'lead', accion: viendo(c.id) ? '' : 'Ver en directo', onAccion: () => App.open.whatsapp(c.id), ms: 7000});

      // 2 · la IA contesta
      await App.sleep(900);
      const s1 = await ia(c.id, `¡Hola ${primero}! 👋 Sí, el ${v.marca} ${v.modelo} ${v.version.split(' ').slice(0, 3).join(' ')} sigue disponible.\n\n• ${v.anio} · ${App.km(v.km)} · ${v.cambio.toLowerCase()}\n• ${App.eur(v.precio)} al contado\n• Desde ${App.num(db.cuota(v.precio))} €/mes financiado (hasta 96 meses)\n• ${v.garantia} meses de garantía y transferencia incluida\n\n¿Te gustaría venir a verlo y probarlo?`, {pensar: 3200});
      App.S.contacts.find(x => x.id === c.id).etapa = 'contactado';
      db.addTimeline(c.id, {tipo: 'ia', texto: `La IA contestó en ${s1} s con precio, cuota y garantía`, autor: 'ia'});
      App.toast(`La IA contestó a ${primero} en ${s1} s`, {sub: 'Con precio, cuota y garantía', tipo: 'wa', icon: 'bot'});

      // 3 · el cliente pregunta cuota con entrada
      await cliente(c.id, 'Sí! ¿Y con 3.000 de entrada cuánto se quedaría?', 3800);
      await App.sleep(400);
      const cuota = App.num(db.cuota(v.precio, 3000, 96));
      const man = App.addDays(App.today(), 1); if (man.getDay() === 0) man.setDate(man.getDate() + 1);
      const h1 = new Date(man); h1.setHours(17, 30, 0, 0);
      const cuando = App.daysBetween(new Date(), h1) === 1 ? 'mañana' : 'el ' + App.DIAS[h1.getDay()];
      await ia(c.id, `Con 3.000 € de entrada, a 96 meses, se queda en unos ${cuota} €/mes (TIN ${App.dec(App.S.dealer.tin)} %, orientativo). Si traes el DNI y la última nómina te lo dejamos preaprobado el mismo día.\n\n${App.cap(cuando)} tengo libre a las 17:30 o a las 19:00. ¿Cuál te viene mejor?`, {pensar: 2800});

      // 4 · elige hora → la IA agenda
      await cliente(c.id, 'A las 17:30 perfecto 👌', 3600);
      await App.sleep(300);
      typing(c.id, true);
      await App.sleep(2000);
      typing(c.id, false);
      const ev = db.addEvent({tipo: 'prueba', contactId: c.id, vehicleId: v.id, userId: asignado, inicio: h1.toISOString(), fin: App.addMin(h1, 45).toISOString(), estado: 'confirmada', origen: 'ia', recordatorio: true, notas: 'Agendada por la IA por WhatsApp. Quiere financiar con 3.000 € de entrada.'});
      db.addMessage(c.id, {from: 'ia', ia: true, segundos: 3, texto: `¡Hecho! ✅ Te espero ${cuando} a las 17:30 para probar el ${v.marca} ${v.modelo}. Te atenderá ${com} en ${App.S.dealer.direccion}.\n\nTe mando un recordatorio 2 horas antes. ¡Hasta ${cuando === 'mañana' ? 'mañana' : 'el ' + App.DIAS[h1.getDay()]}!`});
      db.addTimeline(c.id, {tipo: 'ia', texto: `La IA agendó la prueba de conducción para ${cuando} a las 17:30 con ${com}`, autor: 'ia'});
      db.updateContact(c.id, {proxima: {fecha: ev.inicio, texto: `Prueba del ${v.marca} ${v.modelo}`}});
      db.notify({tipo: 'cita', titulo: 'Cita agendada por la IA', texto: `${primero} · Prueba del ${v.marca} ${v.modelo} ${cuando} a las 17:30`, link: '#/agenda'});
      ding();
      App.toast('Prueba de conducción agendada', {sub: `${primero} · ${App.diaRel(h1)} 17:30 · ${com} · en Google Calendar`, tipo: 'ok', icon: 'calendar-check', accion: 'Ver agenda', onAccion: () => App.go('#/agenda'), ms: 7000});
      return c;
    } catch (e) {
      console.error(e);
    } finally {
      corriendo = false;
    }
  }
};
})();
