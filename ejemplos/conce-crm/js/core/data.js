/* =====================================================================
   Datos de ejemplo. Se generan con fechas RELATIVAS a hoy, así la demo
   siempre parece "de esta mañana". Semilla fija → mismos datos siempre.
   App.seed() devuelve el estado inicial completo.
   ===================================================================== */
(function(){
const App = window.App;

function rng(seed){ return function(){ seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

App.seed = function(){
  const R = rng(20260915);
  const ri = (a, b) => Math.floor(a + R() * (b - a + 1));
  const pick = arr => arr[Math.floor(R() * arr.length)];
  const at = App.at, ago = App.ago;
  const round = (n, s = 10) => Math.round(n / s) * s;

  /* ---------- concesionario y equipo ---------- */
  const dealer = {
    nombre: 'AutoSur Ocasión', corto: 'AutoSur', siglas: 'AS', ciudad: 'Sevilla',
    direccion: 'Av. de Andalucía 112, 41007 Sevilla', tel: '954 000 112', whatsapp: '722 494 080',
    email: 'ventas@autosurocasion.es', web: 'autosurocasion.es', cif: 'B-41000000',
    razon: 'AutoSur Ocasión S.L.', horario: 'L-V 9:30-14:00 y 17:00-20:30 · S 10:00-14:00',
    color: '#1A56DB', garantia: 12, tin: 7.99
  };
  const users = [
    {id:'u1', nombre:'Laura Gómez', rol:'Gerente', email:'laura@autosurocasion.es', tel:'600 112 233', color:'#6366F1', activo:true},
    {id:'u2', nombre:'Javier Morales', rol:'Comercial', email:'javier@autosurocasion.es', tel:'600 223 344', color:'#1A56DB', activo:true},
    {id:'u3', nombre:'Rocío Fernández', rol:'Comercial', email:'rocio@autosurocasion.es', tel:'600 334 455', color:'#0E9F6E', activo:true},
    {id:'u4', nombre:'Elena Castro', rol:'Administración', email:'elena@autosurocasion.es', tel:'600 445 566', color:'#7E3AF2', activo:true},
    {id:'u5', nombre:'Manuel Ortega', rol:'Taller y preparación', email:'taller@autosurocasion.es', tel:'600 556 677', color:'#D97706', activo:true}
  ];
  const COM = ['u2', 'u3'];

  /* ---------- stock ---------- */
  // [id, marca, modelo, version, año, km, precio, combustible, cambio, cv, carrocería, color, etiqueta, fotos(indices), garantía]
  const BASE = [
    ['78a89628','Porsche','Panamera','4 E-Hybrid Executive',2020,62500,67990,'Híbrido enchufable','Automático',462,'Berlina','Gris',  '0',[0,1,2],12],
    ['23def3cf','Jaecoo','7','Select 1.6 TGDI 145 CV',2024,24450,27990,'Gasolina','Automático',147,'SUV','Verde','C',[0,1,2],84],
    ['45881480','Volkswagen','T-Cross','Life 1.0 TSI 95 CV',2024,19150,19990,'Gasolina','Manual',95,'SUV','Rojo','C',[0,1,2],24],
    ['65a38035','Ford','Puma','1.0 EcoBoost MHEV ST-Line X Auto',2023,37798,21925,'Híbrido','Automático',125,'SUV','Gris','ECO',[0,1,2],12],
    ['5f0a38a0','Hyundai','i20','1.0 TGDI 100 CV Klass',2024,16798,15649,'Gasolina','Manual',100,'Compacto','Gris','C',[0,2],24],
    ['024d1e64','Kia','Stonic','1.2 DPi 84 CV Concept',2024,15093,15995,'Gasolina','Manual',84,'SUV','Gris oscuro','C',[0,1],60],
    ['971e0d25','Volkswagen','ID.5','Pro Performance 204 CV',2023,27401,32900,'Eléctrico','Automático',204,'SUV coupé','Plata','0',[1,0,2],24],
    ['fe23ea7a','SEAT','Ibiza','1.0 TSI 110 CV FR XL',2023,37216,17500,'Gasolina','Manual',110,'Compacto','Rojo','C',[2,0,1],12],
    ['58fde280','Nissan','Juke','1.6 Hybrid 145 CV N-Design',2024,17158,24400,'Híbrido','Automático',145,'SUV','Amarillo','ECO',[1,2],36],
    ['e852f25d','SEAT','Arona','1.0 TSI 115 CV FR Special Edition',2024,4492,21700,'Gasolina','Manual',115,'SUV','Blanco','C',[1,0,2],24],
    ['a6f79ac4','Nissan','Pulsar','DIG-T 115 CV Acenta',2018,71276,11300,'Gasolina','Manual',115,'Compacto','Blanco','C',[0,1,2],12],
    ['46a31cc0','Jeep','Renegade','1.3G 150 CV Limited DDCT',2019,87150,15900,'Gasolina','Automático',150,'SUV','Gris oscuro','C',[0,2,1],12],
    ['1d85bc1a','MINI','Cooper','5 puertas 136 CV',2019,61443,19950,'Gasolina','Manual',136,'Compacto','Blanco','C',[0,1,2],12],
    ['76025c77','Opel','Corsa','1.2T 130 CV GS-Line Auto',2021,43859,15500,'Gasolina','Automático',130,'Compacto','Gris','C',[0,1],12],
    ['9c3bb448','Ford','Focus','1.0 EcoBoost 125 CV ST-Line X Auto',2020,66124,17700,'Gasolina','Automático',125,'Compacto','Rojo','C',[0],12],
    ['e56da08f','Dacia','Duster','Extreme TCe 130 CV 4x4',2024,15519,23900,'Gasolina','Manual',130,'SUV','Beige','C',[1,0,2],36],
    ['007696f2','Hyundai','i10','1.0 Klass',2023,17494,12600,'Gasolina','Manual',67,'Urbano','Verde lima','C',[1,0,2],24],
    ['d0b68c4c','Kia','Picanto','1.0 DPi 67 CV GT-Line',2023,11355,14500,'Gasolina','Manual',67,'Urbano','Gris','C',[0,1,2],60],
    ['eda1228b','Nissan','Qashqai','1.3 DIG-T MHEV 158 CV N-Connecta',2022,52246,22400,'Híbrido','Automático',158,'SUV','Gris','ECO',[0,2],12],
    ['2ad54c77','SEAT','Arona','1.0 TSI 95 CV Style XM',2023,7548,18100,'Gasolina','Manual',95,'SUV','Rojo','C',[0,2,1],24],
    ['d69d7e95','SEAT','León','1.5 TSI 150 CV FR Go L',2021,54746,21600,'Gasolina','Automático',150,'Compacto','Blanco','C',[1,2,0],12],
    ['9b0e66c8','Opel','Mokka','1.2 T 130 CV GS Line',2021,40539,17900,'Gasolina','Manual',130,'SUV','Azul turquesa','C',[0,1,2],12],
    ['1acbced5','SEAT','Ibiza','1.0 MPI 80 CV Style',2021,42300,12650,'Gasolina','Manual',80,'Compacto','Azul','C',[0,1],12],
    ['3bd66c0d','Toyota','Yaris','120H Active Tech',2021,37065,17950,'Híbrido','Automático',116,'Compacto','Azul','ECO',[0],36],
    ['1e83b1b5','Renault','Clio','Techno TCe 90 CV',2023,21364,16850,'Gasolina','Manual',91,'Compacto','Blanco','C',[0,1,2],24],
    ['144b15bb','Kia','XCeed','1.0 T-GDi 120 CV Drive',2024,25000,21900,'Gasolina','Manual',120,'SUV','Verde','C',[0,2,1],60]
  ];
  const plateLetter = y => ({2018:'K',2019:'K',2020:'L',2021:'L',2022:'M',2023:'M',2024:'N'})[y] || 'N';
  const CONS = 'BCDFGHJKLMNPRSTVWXYZ';
  const plate = y => ri(1000, 9999) + ' ' + plateLetter(y) + CONS[ri(0, 19)] + CONS[ri(0, 19)];
  const VINP = {Porsche:'WP0ZZZ97', Jaecoo:'LVVDB21B', Volkswagen:'WVWZZZAW', Ford:'WF0FXXWP', Hyundai:'NLHBN51A', Kia:'U5YHB813', SEAT:'VSSZZZKJ', Nissan:'SJNFAAF1', Jeep:'1C4NJCB0', MINI:'WMWXU310', Opel:'W0VPC5HP', Dacia:'UU1HSDCD', Toyota:'VNKKL3D3', Renault:'VF1RJA00'};
  const vin = m => (VINP[m] || 'VF1XXXXX') + Array.from({length: 9}, () => '0123456789ABCDEFGHJKLMNPRSTUVWXYZ'[ri(0, 32)]).join('');
  const EQ = {
    base: ['Aire acondicionado','Bluetooth','Control de crucero','Sensores de aparcamiento traseros','Apple CarPlay y Android Auto','Faros LED','Llantas de aleación','Elevalunas eléctricos'],
    plus: ['Climatizador bizona','Cámara de visión trasera','Navegador','Arranque sin llave','Asientos calefactables','Carga inalámbrica','Detector de ángulo muerto','Asistente de mantenimiento de carril','Techo panorámico','Portón eléctrico','Cuadro digital','Control de crucero adaptativo']
  };
  const estadoPlan = {'e852f25d':'reservado','3bd66c0d':'reservado','9c3bb448':'preparacion','d0b68c4c':'preparacion'};
  const diasPlan = {'a6f79ac4':142,'46a31cc0':118,'78a89628':97,'1acbced5':84,'9b0e66c8':71,'76025c77':66,'d69d7e95':58};
  const PORT = ['web','cochesnet','wallapop','milanuncios','autoscout','fbmarket'];

  const vehicles = BASE.map((b, i) => {
    const [id, marca, modelo, version, anio, km, precio, combustible, cambio, cv, carroceria, color, etiqueta, fotos, garantia] = b;
    const dias = diasPlan[id] || ri(3, 52);
    const estado = estadoPlan[id] || 'disponible';
    const compra = round(precio * (0.8 + R() * 0.06), 50);
    const gastos = [
      {concepto:'Transporte', importe: ri(0, 1) ? 180 : 0},
      {concepto:'Preparación y limpieza', importe: 120},
      {concepto:'ITV y revisión', importe: ri(90, 260)},
      {concepto: pick(['Neumáticos','Chapa y pintura','Pastillas y discos','Cambio de aceite y filtros']), importe: ri(140, 520)}
    ].filter(g => g.importe);
    const on = estado === 'preparacion' ? {} : {web:true, cochesnet:true, wallapop: R() > .2, milanuncios: R() > .45, autoscout: R() > .7, fbmarket: R() > .35};
    const portales = {};
    PORT.forEach(p => {
      const activo = !!on[p];
      const peso = {web: 1, cochesnet: 1.35, wallapop: 1.1, milanuncios: .55, autoscout: .3, fbmarket: .7}[p];
      portales[p] = {on: activo, visitas: activo ? Math.round(dias * peso * ri(6, 16) * (precio > 25000 ? .8 : 1)) : 0, leads: 0, favoritos: activo ? ri(0, Math.round(dias * peso / 4)) : 0, desde: activo ? ago((dias - ri(0, 2)) * 1440) : null};
    });
    const eq = EQ.base.slice(0, ri(5, 8)).concat(EQ.plus.filter(() => R() > (precio > 20000 ? .45 : .7)));
    const entrada = ago(dias * 1440 + ri(0, 600));
    const bajada = dias > 60 ? [{fecha: ago((dias - 35) * 1440), precio: precio + round(precio * .05, 100)}] : [];
    return {
      id, marca, modelo, version, anio, km, precio, combustible, cambio, cv, carroceria, color, etiqueta, garantia,
      tipo:'coche', puertas: carroceria === 'SUV coupé' || carroceria === 'Berlina' ? 5 : (modelo === 'i10' || modelo === 'Picanto' ? 5 : 5), plazas: modelo === 'Panamera' ? 4 : 5,
      matricula: plate(anio), bastidor: vin(marca), fechaMatriculacion: `${anio}-${String(ri(1, 12)).padStart(2, '0')}-${String(ri(1, 28)).padStart(2, '0')}`,
      itv: anio <= 2021 ? `${2027 + (anio % 2)}-${String(ri(1, 12)).padStart(2, '0')}` : `${anio + 4}-${String(ri(1, 12)).padStart(2, '0')}`,
      duenos: anio < 2021 ? ri(1, 2) : 1, libroRevisiones: true, estadoGeneral: pick(['Excelente','Muy bueno','Muy bueno','Bueno']),
      precioCompra: compra, gastos, precioMin: round(precio * .955, 100), precioHistorial: bajada,
      estado, ubicacion: estado === 'preparacion' ? 'Taller' : pick(['Exposición','Exposición','Campa']),
      fechaEntrada: entrada, fotos: fotos.map(n => `${id}-${n}`), equipamiento: eq, portales,
      descripcion: `${marca} ${modelo} ${version} de ${anio} con ${App.num(km)} km, ${combustible.toLowerCase()} y cambio ${cambio.toLowerCase()}. Revisado en nuestro taller, con libro de mantenimiento y ${garantia} meses de garantía. Financiación a medida y aceptamos tu coche como parte del pago.`,
      notas: '', destacado: ['78a89628','971e0d25','144b15bb','58fde280'].includes(id),
      fotosMejoradas: R() > .35
    };
  });
  const V = Object.fromEntries(vehicles.map(v => [v.id, v]));

  /* ---------- vehículos ya vendidos (historial de ventas) ---------- */
  const SOLD = [
    // [idFotoBase, marca, modelo, version, año, km, precio, días hasta venta, hace días, comercial, financiado]
    ['2ad54c77','SEAT','Arona','1.0 TSI 110 CV FR',2022,28400,18900,24,2,'u2',true],
    ['65a38035','Ford','Puma','1.0 EcoBoost 125 CV Titanium',2022,41200,19400,31,4,'u3',true],
    ['45881480','Volkswagen','T-Cross','Advance 1.0 TSI 110 CV',2022,38900,18600,18,6,'u2',false],
    ['3bd66c0d','Toyota','Yaris','120H Style',2022,29800,18400,12,9,'u3',true],
    ['eda1228b','Nissan','Qashqai','1.3 DIG-T 140 CV Acenta',2021,61200,19900,45,11,'u2',true],
    ['1e83b1b5','Renault','Clio','Zen TCe 90 CV',2022,33100,14300,22,13,'u3',false],
    ['d69d7e95','SEAT','León','1.0 eTSI 110 CV Style',2022,39800,19600,27,16,'u2',true],
    ['144b15bb','Kia','XCeed','1.5 T-GDi 160 CV Tech',2023,19800,23400,19,19,'u3',true],
    ['5f0a38a0','Hyundai','i20','1.0 TGDI 100 CV Tecno',2022,27900,14900,33,22,'u2',false],
    ['9b0e66c8','Opel','Mokka','1.2 T 130 CV Elegance',2022,29600,19200,29,25,'u3',true],
    ['e56da08f','Dacia','Duster','Journey TCe 130 CV',2023,22100,20900,15,27,'u2',true],
    ['1d85bc1a','MINI','Cooper','3 puertas 136 CV',2020,54300,18200,41,33,'u3',false],
    ['58fde280','Nissan','Juke','1.0 DIG-T 114 CV N-Connecta',2021,44800,17800,26,38,'u2',true],
    ['971e0d25','Volkswagen','ID.4','Pro 204 CV',2022,36700,29900,52,46,'u3',true],
    ['fe23ea7a','SEAT','Ibiza','1.0 TSI 95 CV Style',2022,31900,13900,21,53,'u2',false],
    ['024d1e64','Kia','Stonic','1.0 T-GDi MHEV 100 CV Drive',2023,18700,17600,17,58,'u3',true]
  ];
  SOLD.forEach((s, i) => {
    const [base, marca, modelo, version, anio, km, precio, diasVenta, hace, com, fin] = s;
    const compra = round(precio * (0.8 + R() * 0.05), 50);
    const b = V[base];
    vehicles.push({
      id: 'vs' + (i + 1), marca, modelo, version, anio, km, precio, combustible: b.combustible, cambio: b.cambio, cv: b.cv, carroceria: b.carroceria, color: b.color, etiqueta: b.etiqueta, garantia: 12,
      tipo:'coche', puertas: 5, plazas: 5, matricula: plate(anio), bastidor: vin(marca), fechaMatriculacion: `${anio}-05-10`, itv: `${anio + 4}-05`, duenos: 1, libroRevisiones: true, estadoGeneral:'Muy bueno',
      precioCompra: compra, gastos: [{concepto:'Preparación y limpieza', importe:120}, {concepto:'ITV y revisión', importe: ri(90, 220)}, {concepto:'Neumáticos', importe: ri(0, 1) ? 280 : 0}].filter(g => g.importe), precioMin: round(precio * .96, 100), precioHistorial: [],
      estado:'vendido', ubicacion:'Entregado', fechaEntrada: ago((hace + diasVenta) * 1440), fechaVenta: ago(hace * 1440 + ri(0, 500)), precioVenta: precio - pick([0, 0, 200, 300, 500]),
      vendedor: com, financiado: fin, fotos: b.fotos.slice(0, 2), equipamiento: b.equipamiento.slice(0, 8),
      portales: Object.fromEntries(PORT.map(p => [p, {on:false, visitas: ri(80, 900), leads: 0, favoritos: ri(0, 30), desde: null}])),
      descripcion:'', notas:'', destacado:false, fotosMejoradas:true
    });
  });

  /* ---------- contactos / leads ---------- */
  const NOMBRES = ['Lucía Pérez Romero','Carlos Martín Ruiz','Marta López Vega','Antonio Sánchez Gil','Paula Díaz Moreno','Francisco Jiménez Ortiz','Cristina Navarro Soto','José Luis Romero Cano','Alba Torres Medina','David Ramos Herrera','Sara Molina Castro','Miguel Ángel Delgado','Nuria Suárez Iglesias','Rafael Ortega Blanco','Irene Castillo Rubio','Álvaro Morales Peña','Carmen Vázquez León','Pablo Gutiérrez Marín','Elena Serrano Prieto','Jorge Domínguez Lozano','Laura Cabrera Nieto','Sergio Pastor Calvo','Rocío Benítez Arias','Manuel Fuentes Reyes','Andrea Carrasco Luna','Iván Márquez Durán','Beatriz Aguilar Soler','Rubén Vidal Campos','Patricia Guerrero Mora','Óscar Herrera Parra','Silvia Rojas Bravo','Adrián Méndez Gallardo','Inmaculada Cano Rivas','Fernando Lorenzo Pardo','Verónica Esteban Crespo','Daniel Montero Vicente','Pilar Santana Ibáñez','Alejandro Rey Vera','Mercedes Paredes Román','Hugo Ferrer Salas','Natalia Bermúdez Ruano','Enrique Varela Núñez','Claudia Lara Hidalgo','Juan Carlos Pineda','Rosario Mateos Galán','Tomás Espinosa Rivero','Lorena Carmona Toledo','Raúl Villalba Moya'];
  const PUEBLOS = ['Sevilla','Dos Hermanas','Alcalá de Guadaíra','Mairena del Aljarafe','Utrera','Tomares','Écija','Los Palacios','Bormujos','Coria del Río','Camas','La Rinconada','Carmona','San Juan de Aznalfarache','Lebrija','Montequinto'];
  const tel = () => '6' + ri(0, 9) + ri(0, 9) + ' ' + String(ri(10, 99)) + ' ' + String(ri(10, 99)) + ' ' + String(ri(10, 99));
  const disponibles = vehicles.filter(v => v.estado !== 'vendido');

  const contacts = [];
  const messages = [];
  const events = [];
  let cN = 0;
  const addC = (o) => {
    const nombre = NOMBRES[cN % NOMBRES.length]; cN++;
    const email = App.norm(nombre.split(' ')[0] + '.' + nombre.split(' ')[1]).replace(/[^a-z.]/g, '') + ri(1, 99) + '@' + pick(['gmail.com','gmail.com','hotmail.com','outlook.es','yahoo.es']);
    const c = Object.assign({
      id: 'c' + cN, nombre, tel: tel(), email, ciudad: pick(PUEBLOS), origen: 'cochesnet', etapa: 'nuevo', temperatura: 'templado',
      interes: [], presupuesto: 0, financiar: false, cocheACuenta: null, asignado: pick(COM), creado: ago(ri(60, 4000)), ultimoContacto: null,
      proxima: null, notas: '', etiquetas: [], iaActiva: true, sinLeer: 0, timeline: [], motivoPerdida: '', valoracion: 0
    }, o);
    if (!c.ultimoContacto) c.ultimoContacto = c.creado;
    contacts.push(c);
    return c;
  };
  const tl = (c, tipo, texto, fecha, autor = 'ia', extra = {}) => c.timeline.push(Object.assign({id: App.uid('t'), tipo, texto, fecha, autor}, extra));
  const msg = (c, from, texto, fecha, extra = {}) => { messages.push(Object.assign({id: App.uid('m'), contactId: c.id, from, texto, fecha, leido: true}, extra)); if (fecha > c.ultimoContacto) c.ultimoContacto = fecha; };
  const ORIG_LBL = {cochesnet:'coches.net', wallapop:'Wallapop', milanuncios:'Milanuncios', autoscout:'AutoScout24', web:'la web', fbmarket:'Marketplace', meta:'un anuncio de Instagram', whatsapp:'WhatsApp', google:'Google', exposicion:'exposición', telefono:'teléfono', recomendado:'recomendación'};
  const vname = v => `${v.marca} ${v.modelo}`;
  const cuotaDe = (v, entrada = 0, meses = 96) => Math.round(App.cuota(v.precio - entrada, dealer.tin, meses));

  /* --- 1. Conversaciones "estrella" (se ven en WhatsApp) --- */
  // a) Lead de anoche contestado por la IA a las 23:14 → cita hoy
  {
    const v = V['144b15bb'];
    const c = addC({nombre:'Lucía Pérez Romero', origen:'meta', etapa:'cita', temperatura:'caliente', interes:[v.id], presupuesto: 22000, financiar:true, asignado:'u3', creado: at(-1, 23, 12), etiquetas:['Financiación'], ciudad:'Dos Hermanas'});
    cN = Math.max(cN, 1);
    msg(c, 'cliente', `Hola! He visto el anuncio del Kia XCeed. ¿Sigue disponible?`, at(-1, 23, 12));
    msg(c, 'ia', `¡Hola Lucía! Sí, el Kia XCeed 1.0 T-GDi Drive de 2024 sigue disponible 🙌\n\n• 25.000 km · manual · 120 CV\n• ${App.eur(v.precio)} al contado\n• Desde ${cuotaDe(v)} €/mes financiado\n• 5 años de garantía de fábrica restante\n\n¿Quieres venir a verlo y probarlo?`, at(-1, 23, 13), {ia:true, segundos: 38});
    msg(c, 'cliente', 'Sí, me interesa financiarlo. ¿Mañana por la tarde podría?', at(-1, 23, 19));
    msg(c, 'ia', 'Perfecto. Mañana tengo libre a las 17:30 o a las 18:30. ¿Cuál te viene mejor?', at(-1, 23, 19), {ia:true, segundos: 21});
    msg(c, 'cliente', 'A las 17:30 👌', at(-1, 23, 21));
    msg(c, 'ia', `Hecho ✅ Te espero mañana a las 17:30 en ${dealer.direccion}. Te atenderá Rocío. Si traes DNI y una nómina, te dejamos la financiación preaprobada ese mismo día.\n\nTe mando un recordatorio 2 horas antes.`, at(-1, 23, 21), {ia:true, segundos: 17});
    tl(c, 'lead', `Lead desde un anuncio de Instagram · ${vname(v)}`, at(-1, 23, 12), 'sistema');
    tl(c, 'ia', 'La IA contestó en 38 s y agendó una prueba de conducción', at(-1, 23, 21), 'ia');
    events.push({id: App.uid('e'), tipo:'prueba', titulo:'Prueba · Kia XCeed', contactId: c.id, vehicleId: v.id, userId:'u3', inicio: at(0, 17, 30), fin: at(0, 18, 15), estado:'confirmada', gcal:true, recordatorio:true, origen:'ia', notas:'Quiere financiar. Traer DNI y nómina.'});
    c.proxima = {fecha: at(0, 17, 30), texto:'Prueba de conducción del Kia XCeed'};
  }
  // b) Wallapop: la IA contesta y pide pasar con persona (precio) → SIN LEER, necesita humano
  {
    const v = V['46a31cc0'];
    const c = addC({nombre:'Carlos Martín Ruiz', origen:'wallapop', etapa:'contactado', temperatura:'caliente', interes:[v.id], presupuesto: 14500, asignado:'u2', creado: ago(52), cocheACuenta:{marca:'Renault', modelo:'Mégane', anio:2012, km:168000}, sinLeer: 2, necesitaHumano: true, etiquetas:['Coche a cuenta']});
    msg(c, 'cliente', 'Buenas, el Jeep Renegade. ¿Cuánto es lo último? Tengo un Mégane del 2012 para dejar', ago(52));
    msg(c, 'ia', `¡Buenas, Carlos! El Jeep Renegade Limited automático de 2019 está a ${App.eur(v.precio)}, con 12 meses de garantía y la ITV recién pasada.\n\nTu Mégane lo podemos tasar: si me mandas 4 fotos (frontal, trasera, interior y cuentakilómetros) te doy una valoración hoy.`, ago(51), {ia:true, segundos: 44});
    msg(c, 'cliente', '[4 fotos]', ago(40), {fotos: 4});
    msg(c, 'cliente', 'Ahí van. Si me hacéis buen precio por los dos lo cierro esta semana', ago(39), {leido:false});
    msg(c, 'ia', 'Gracias Carlos 🙏 Para hablar de precio final te paso con Javier, que es quien lleva tu coche. Te escribe en unos minutos.', ago(39), {ia:true, segundos: 12, leido:false, handoff:true});
    tl(c, 'lead', `Lead desde Wallapop · ${vname(v)}`, ago(52), 'sistema');
    tl(c, 'ia', 'La IA pidió fotos del coche a cuenta y pasó la conversación a Javier (negociación de precio)', ago(39), 'ia');
    c.proxima = {fecha: ago(-20), texto:'Contestar a Carlos: precio final + tasación del Mégane'};
  }
  // c) coches.net anoche (sábado) → IA → pregunta financiación → cita mañana
  {
    const v = V['971e0d25'];
    const c = addC({nombre:'Marta López Vega', origen:'cochesnet', etapa:'cita', temperatura:'caliente', interes:[v.id], presupuesto: 33000, financiar:true, asignado:'u2', creado: at(-1, 21, 40), etiquetas:['Eléctrico']});
    msg(c, 'cliente', 'Hola, me interesa el ID.5. ¿Qué autonomía real tiene y si tiene la batería con garantía?', at(-1, 21, 40));
    msg(c, 'ia', 'Hola Marta 👋 El Volkswagen ID.5 Pro Performance tiene una autonomía homologada de hasta 520 km (en uso real, unos 400-450 km). La batería tiene garantía de Volkswagen de 8 años o 160.000 km, y el coche está con 27.401 km.\n\nAdemás, carga rápida hasta 135 kW: del 5 al 80 % en unos 30 min.', at(-1, 21, 41), {ia:true, segundos: 51});
    msg(c, 'cliente', '¿Y financiado cuánto se queda?', at(-1, 21, 46));
    msg(c, 'ia', `Con 5.000 € de entrada, a 96 meses se queda en unos ${cuotaDe(v, 5000)} €/mes (TIN ${App.dec(dealer.tin)} %, cálculo orientativo). ¿Quieres que te lo preparemos por escrito y lo vienes a probar?`, at(-1, 21, 46), {ia:true, segundos: 28});
    msg(c, 'cliente', 'Vale, mañana a las 11 puedo', at(-1, 21, 52));
    msg(c, 'ia', 'Genial, reservado mañana a las 11:00 ✅ Te lo tendremos cargado al 100 %. ¡Hasta mañana!', at(-1, 21, 52), {ia:true, segundos: 14});
    tl(c, 'lead', `Lead desde coches.net · ${vname(v)}`, at(-1, 21, 40), 'sistema');
    tl(c, 'ia', 'La IA resolvió dudas de autonomía y cuota, y agendó una prueba', at(-1, 21, 52), 'ia');
    events.push({id: App.uid('e'), tipo:'prueba', titulo:'Prueba · Volkswagen ID.5', contactId: c.id, vehicleId: v.id, userId:'u2', inicio: at(1, 11, 0), fin: at(1, 12, 0), estado:'confirmada', gcal:true, recordatorio:true, origen:'ia', notas:'Cargar al 100 % antes. Quiere la oferta de financiación por escrito.'});
    c.proxima = {fecha: at(1, 11, 0), texto:'Prueba del ID.5 + presupuesto con financiación'};
  }
  // d) Web → pregunta taller/garantía → está en negociación con presupuesto enviado
  {
    const v = V['58fde280'];
    const c = addC({nombre:'Antonio Sánchez Gil', origen:'web', etapa:'negociacion', temperatura:'caliente', interes:[v.id], presupuesto: 23500, financiar:false, asignado:'u3', creado: ago(5 * 1440), cocheACuenta:{marca:'Peugeot', modelo:'308', anio:2016, km:132000}, etiquetas:['Coche a cuenta','Presupuesto enviado']});
    msg(c, 'cliente', 'Hola, ayer probé el Juke con Rocío. ¿Me podéis mandar el presupuesto con mi 308 descontado?', ago(1 * 1440 + 300));
    msg(c, 'agente', `Hola Antonio, claro. Te lo mando ahora en PDF: Nissan Juke Hybrid ${App.eur(v.precio)} − 5.200 € por tu Peugeot 308 = ${App.eur(v.precio - 5200)}, con transferencia y 36 meses de garantía incluidos.`, ago(1 * 1440 + 280), {autor:'u3'});
    msg(c, 'agente', '📄 Presupuesto P-2026-0147.pdf', ago(1 * 1440 + 279), {autor:'u3', pdf:'P-2026-0147'});
    msg(c, 'cliente', 'Recibido. Lo hablo con mi mujer y os digo, ¿vale?', ago(1 * 1440 + 200));
    msg(c, 'agente', 'Perfecto, sin prisa. Si tenéis cualquier duda me llamáis 😊', ago(1 * 1440 + 198), {autor:'u3'});
    msg(c, 'ia', 'Hola Antonio, soy el asistente de AutoSur 👋 ¿Pudisteis ver el presupuesto del Juke? Esta semana tenemos otro interesado en ese mismo coche; si queréis os lo podemos dejar reservado con 300 € de señal, que se descuentan del precio.', ago(90), {ia:true, auto:'seguimiento48h'});
    tl(c, 'lead', `Formulario de la web · ${vname(v)}`, ago(5 * 1440), 'sistema');
    tl(c, 'cita', 'Prueba de conducción hecha con Rocío', ago(2 * 1440), 'u3');
    tl(c, 'tasacion', 'Tasación del Peugeot 308: 5.200 €', ago(2 * 1440 - 30), 'u3');
    tl(c, 'presupuesto', 'Presupuesto P-2026-0147 enviado por WhatsApp', ago(1 * 1440 + 279), 'u3');
    tl(c, 'automatizacion', 'Seguimiento automático a las 48 h («me lo pienso»)', ago(90), 'ia');
    c.proxima = {fecha: at(1, 10, 0), texto:'Llamar si no contesta al seguimiento'};
  }
  // e) Milanuncios de madrugada → no contesta aún (IA en espera)
  {
    const v = V['1acbced5'];
    const c = addC({nombre:'Paula Díaz Moreno', origen:'milanuncios', etapa:'nuevo', temperatura:'templado', interes:[v.id], presupuesto: 12000, asignado:'u2', creado: at(0, 7, 48), sinLeer: 0});
    msg(c, 'cliente', 'Hola, ¿el Ibiza blanco tiene los papeles al día? Es para mi hijo que se acaba de sacar el carnet', at(0, 7, 48));
    msg(c, 'ia', `¡Hola Paula! Sí, el SEAT Ibiza Style de 2021 tiene la ITV en vigor, libro de revisiones sellado y un solo dueño. Para un conductor novel es ideal: 80 CV, consumo de unos 5 l/100 km y un seguro barato.\n\nEstá a ${App.eur(V['1acbced5'].precio)} o desde ${cuotaDe(V['1acbced5'])} €/mes. ¿Queréis venir a verlo esta semana?`, at(0, 7, 48), {ia:true, segundos: 33});
    tl(c, 'lead', `Lead desde Milanuncios · ${vname(v)}`, at(0, 7, 48), 'sistema');
    tl(c, 'ia', 'La IA contestó en 33 s', at(0, 7, 48), 'ia');
  }
  // f) Recordatorio de cita + confirmación (entrega de hoy)
  {
    const v = V['e852f25d'];
    const c = addC({nombre:'Francisco Jiménez Ortiz', origen:'cochesnet', etapa:'reservado', temperatura:'caliente', interes:[v.id], presupuesto: 22000, financiar:true, asignado:'u2', creado: ago(9 * 1440), etiquetas:['Financiación aprobada','Señal pagada']});
    msg(c, 'ia', `Hola Francisco 👋 Te recuerdo que hoy a las 12:30 te entregamos tu SEAT Arona FR. Trae el DNI; el seguro ya está activado. ¡Nos vemos!\n📍 ${dealer.direccion}`, at(0, 9, 0), {ia:true, auto:'recordatorio'});
    msg(c, 'cliente', '¡Allí estaré! Qué ganas 🚗', at(0, 9, 6));
    tl(c, 'lead', `Lead desde coches.net · ${vname(v)}`, ago(9 * 1440), 'sistema');
    tl(c, 'financiacion', 'Financiación aprobada por Santander Consumer · 72 meses', ago(4 * 1440), 'u4');
    tl(c, 'etapa', 'Reservado con 500 € de señal', ago(4 * 1440 - 60), 'u2');
    events.push({id: App.uid('e'), tipo:'entrega', titulo:'Entrega · SEAT Arona FR', contactId: c.id, vehicleId: v.id, userId:'u2', inicio: at(0, 12, 30), fin: at(0, 13, 15), estado:'confirmada', gcal:true, recordatorio:true, notas:'Lavado hecho. Placas y alfombrillas puestas. Foto de entrega para redes.'});
    c.proxima = {fecha: at(0, 12, 30), texto:'Entrega del SEAT Arona FR'};
  }
  // g) Instagram: IA reconoce que quiere tasar → tasación agendada
  {
    const c = addC({nombre:'Cristina Navarro Soto', origen:'meta', etapa:'contactado', temperatura:'templado', interes:[V['e56da08f'].id], presupuesto: 24000, financiar:true, asignado:'u3', creado: ago(3 * 1440), cocheACuenta:{marca:'Dacia', modelo:'Sandero', anio:2019, km:74000}, etiquetas:['Coche a cuenta']});
    msg(c, 'cliente', 'Hola, ¿cuánto me daríais por un Sandero del 2019 si me llevo el Duster?', ago(3 * 1440));
    msg(c, 'ia', '¡Hola Cristina! Para darte un precio justo necesito ver el coche 🙂 ¿Te viene bien pasarte y en 20 minutos lo tasamos y te decimos la cifra? Tengo hueco el jueves a las 10:00 o a las 18:00.', ago(3 * 1440 - 1), {ia:true, segundos: 29});
    msg(c, 'cliente', 'Jueves a las 18', ago(3 * 1440 - 40));
    msg(c, 'ia', 'Apuntado ✅ Jueves a las 18:00 tasación del Sandero y verás el Duster. Trae la ficha técnica si puedes.', ago(3 * 1440 - 41), {ia:true, segundos: 11});
    tl(c, 'lead', 'Mensaje por Instagram (anuncio) · Dacia Duster', ago(3 * 1440), 'sistema');
    events.push({id: App.uid('e'), tipo:'tasacion', titulo:'Tasación · Dacia Sandero', contactId: c.id, vehicleId: 'e56da08f', userId:'u3', inicio: at(2, 18, 0), fin: at(2, 18, 30), estado:'confirmada', gcal:true, recordatorio:true, origen:'ia', notas:'Trae ficha técnica. Interesada en el Duster.'});
    c.proxima = {fecha: at(2, 18, 0), texto:'Tasación del Sandero'};
  }
  // h) Cliente de hace meses: revisión + reseña (postventa)
  {
    const sold = vehicles.find(v => v.id === 'vs2');
    const c = addC({nombre:'José Luis Romero Cano', origen:'recomendado', etapa:'vendido', temperatura:'templado', interes:[sold.id], asignado: sold.vendedor, creado: ago(40 * 1440), etiquetas:['Cliente'], valoracion: 5});
    sold.cliente = c.id;
    msg(c, 'ia', `Hola José Luis 😊 Hace unos días te entregamos tu ${vname(sold)}. ¿Qué tal va? Si estás contento, nos ayudaría muchísimo una reseña en Google: ⭐ g.page/autosur/review`, ago(1 * 1440 + 100), {ia:true, auto:'resena'});
    msg(c, 'cliente', 'Genial, va de lujo. Ahora mismo os la dejo 👍', ago(1 * 1440 + 40));
    msg(c, 'cliente', 'Hecho, 5 estrellas', ago(1 * 1440 + 32));
    msg(c, 'ia', '¡Muchísimas gracias! 🙌 Cualquier cosa del coche, aquí nos tienes.', ago(1 * 1440 + 32), {ia:true, segundos: 6});
    tl(c, 'venta', `Compró el ${vname(sold)} · ${App.eur(sold.precioVenta)}`, sold.fechaVenta, sold.vendedor);
    tl(c, 'automatizacion', 'Petición de reseña automática → dejó 5 ★ en Google', ago(1 * 1440 + 32), 'ia');
  }

  /* --- 2. Resto de pipeline (generado) --- */
  const plan = [
    ['nuevo', 6], ['contactado', 6], ['cita', 3], ['prueba', 5], ['negociacion', 4], ['reservado', 2], ['perdido', 6]
  ];
  const ORIGS = ['cochesnet','cochesnet','cochesnet','wallapop','wallapop','web','meta','meta','milanuncios','fbmarket','exposicion','telefono','google','autoscout','recomendado'];
  const PREGUNTAS = [
    v => `Hola, ¿sigue disponible el ${vname(v)}?`,
    v => `Buenas, ¿el ${vname(v)} admite financiación sin entrada?`,
    v => `Hola! ¿Qué garantía tiene el ${vname(v)}?`,
    v => `¿Se puede ver el ${vname(v)} este sábado?`,
    v => `Hola, ¿el precio del ${vname(v)} es negociable?`,
    v => `Me interesa el ${vname(v)}. ¿Tiene cámara trasera?`,
    v => `¿Cuánto sería la cuota del ${vname(v)} a 8 años?`,
    v => `Buenas tardes, ¿aceptáis coche a cuenta para el ${vname(v)}?`
  ];
  const PERDIDO = ['Compró en otro concesionario','No le aprobaron la financiación','Buscaba algo más barato','No contesta tras 3 intentos','Decidió no cambiar de coche','Se fue a un coche nuevo (km 0)'];
  plan.forEach(([etapa, n]) => {
    for (let k = 0; k < n; k++) {
      const v = pick(disponibles);
      const origen = pick(ORIGS);
      const dias = {nuevo: 0, contactado: ri(1, 4), cita: ri(1, 5), prueba: ri(3, 9), negociacion: ri(5, 14), reservado: ri(6, 15), perdido: ri(8, 40)}[etapa];
      const creado = etapa === 'nuevo' ? ago(ri(8, 600)) : ago(dias * 1440 + ri(0, 600));
      const temp = etapa === 'perdido' ? 'frio' : ['negociacion','reservado','prueba'].includes(etapa) ? pick(['caliente','caliente','templado']) : pick(['caliente','templado','templado','frio']);
      const c = addC({origen, etapa, temperatura: temp, interes: [v.id].concat(R() > .75 ? [pick(disponibles).id] : []).filter((x, i, a) => a.indexOf(x) === i),
        presupuesto: round(v.precio * (0.85 + R() * .3), 500), financiar: R() > .45, creado,
        cocheACuenta: R() > .72 ? {marca: pick(['Seat','Renault','Peugeot','Ford','Opel','Citroën','Volkswagen']), modelo: pick(['León','Clio','308','Fiesta','Astra','C4','Golf']), anio: ri(2008, 2018), km: ri(90, 220) * 1000} : null,
        motivoPerdida: etapa === 'perdido' ? pick(PERDIDO) : '', iaActiva: etapa !== 'perdido'});
      if (c.cocheACuenta) c.etiquetas.push('Coche a cuenta');
      if (c.financiar) c.etiquetas.push('Financiación');
      const q = pick(PREGUNTAS)(v);
      const origTxt = ORIG_LBL[origen];
      tl(c, 'lead', `Lead desde ${origTxt} · ${vname(v)}`, creado, 'sistema');
      if (['exposicion','telefono'].includes(origen)) {
        tl(c, origen === 'telefono' ? 'llamada' : 'nota', origen === 'telefono' ? `Llamó preguntando por el ${vname(v)}` : `Vino a exposición a ver el ${vname(v)}`, creado, c.asignado);
      } else {
        msg(c, 'cliente', q, creado);
        const s = ri(12, 58);
        msg(c, 'ia', `¡Hola ${c.nombre.split(' ')[0]}! Sí, el ${vname(v)} ${v.version.split(' ').slice(0, 3).join(' ')} de ${v.anio} está disponible: ${App.km(v.km)}, ${App.eur(v.precio)} o desde ${cuotaDe(v)} €/mes. ¿Te gustaría venir a verlo?`, App.addMin(creado, 1).toISOString(), {ia:true, segundos: s});
        tl(c, 'ia', `La IA contestó en ${s} s`, App.addMin(creado, 1).toISOString(), 'ia');
        if (etapa === 'nuevo' && k < 2) { msg(c, 'cliente', pick(['¿Y tiene algún extra más?','Vale, ¿qué horario tenéis?','¿Tenéis más fotos del interior?']), ago(ri(3, 7)), {leido:false}); c.sinLeer = 1; }
      }
      if (['cita','prueba','negociacion','reservado'].includes(etapa)) tl(c, 'cita', 'Cita agendada para ver el coche', App.addMin(creado, 30).toISOString(), 'ia');
      if (['prueba','negociacion','reservado'].includes(etapa)) tl(c, 'cita', `Prueba de conducción hecha con ${users.find(u => u.id === c.asignado).nombre.split(' ')[0]}`, ago((dias - 1) * 1440 + ri(0, 500)), c.asignado);
      if (['negociacion','reservado'].includes(etapa)) tl(c, 'presupuesto', 'Presupuesto enviado por WhatsApp', ago((dias - 2) * 1440), c.asignado);
      if (etapa === 'reservado') tl(c, 'etapa', 'Reservado con señal de 300 €', ago(ri(1, 3) * 1440), c.asignado);
      if (etapa === 'perdido') tl(c, 'etapa', 'Marcado como perdido: ' + c.motivoPerdida, ago(ri(2, 7) * 1440), c.asignado);
      // próximas acciones
      if (etapa === 'contactado') c.proxima = {fecha: App.at(ri(0, 2), pick([10, 11, 12, 17, 18]), pick([0, 30])), texto: pick(['Llamar para agendar visita','Mandar más fotos del interior','Enviar cuota a 72 y 96 meses'])};
      if (etapa === 'cita') { const d = ri(0, 4), h = pick([10, 11, 12, 17, 18, 19]); const tipo = pick(['prueba','visita']); events.push({id: App.uid('e'), tipo, titulo: (tipo === 'prueba' ? 'Prueba · ' : 'Visita · ') + vname(v), contactId: c.id, vehicleId: v.id, userId: c.asignado, inicio: at(d, h, pick([0, 30])), fin: at(d, h + 1, 0), estado: d === 0 ? 'confirmada' : pick(['pendiente','confirmada']), gcal:true, recordatorio:true, origen: pick(['ia','ia','manual'])}); c.proxima = {fecha: at(d, h, 0), texto: (tipo === 'prueba' ? 'Prueba de conducción del ' : 'Visita para ver el ') + vname(v)}; }
      if (etapa === 'prueba') c.proxima = {fecha: App.at(ri(0, 2), pick([10, 12, 17]), 0), texto: pick(['Mandar presupuesto','Llamar para saber qué le pareció','Preparar estudio de financiación'])};
      if (etapa === 'negociacion') c.proxima = {fecha: App.at(ri(-1, 2), pick([10, 13, 18]), 0), texto: pick(['Cerrar precio final','Esperando respuesta de la financiera','Llamar: lo estaba hablando en casa'])};
      if (etapa === 'reservado') { const d = ri(1, 6); events.push({id: App.uid('e'), tipo:'entrega', titulo:'Entrega · ' + vname(v), contactId: c.id, vehicleId: v.id, userId: c.asignado, inicio: at(d, pick([11, 12, 18]), 0), fin: at(d, 13, 0), estado:'confirmada', gcal:true, recordatorio:true}); c.proxima = {fecha: at(d, 12, 0), texto:'Entrega del ' + vname(v)}; }
    }
  });

  /* --- 3. Clientes que ya compraron (enlazados a las ventas) --- */
  vehicles.filter(v => v.estado === 'vendido' && !v.cliente).forEach(v => {
    const c = addC({origen: pick(ORIGS), etapa:'vendido', temperatura:'templado', interes:[v.id], asignado: v.vendedor, creado: ago(App.daysSince(v.fechaVenta) * 1440 + ri(5, 25) * 1440), financiar: v.financiado, etiquetas:['Cliente'].concat(v.financiado ? ['Financiado'] : []), iaActiva:false, valoracion: pick([0, 0, 5, 5, 4])});
    v.cliente = c.id;
    tl(c, 'lead', `Lead desde ${ORIG_LBL[c.origen]} · ${vname(v)}`, c.creado, 'sistema');
    tl(c, 'cita', 'Prueba de conducción', App.addMin(c.creado, 60 * 24 * 3).toISOString(), v.vendedor);
    tl(c, 'venta', `Compró el ${vname(v)} · ${App.eur(v.precioVenta)}`, v.fechaVenta, v.vendedor);
  });

  /* reservados en stock → su cliente */
  const cReservaYaris = contacts.find(c => c.etapa === 'reservado' && c.id !== 'c6');
  if (cReservaYaris) { cReservaYaris.interes = ['3bd66c0d']; V['3bd66c0d'].reservadoPor = cReservaYaris.id; }
  V['e852f25d'].reservadoPor = 'c6';

  /* ---------- leads por coche y por portal (a partir de los contactos) ---------- */
  contacts.forEach(c => c.interes.forEach(id => { const v = vehicles.find(x => x.id === id); if (v && v.portales[c.origen]) v.portales[c.origen].leads++; }));
  vehicles.forEach(v => { if (v.estado !== 'vendido') PORT.forEach(p => { if (v.portales[p].on) v.portales[p].leads += ri(0, 2); }); });

  /* ---------- agenda extra (taller, llamadas, visitas, firmas, pasadas) ---------- */
  const extraEv = [
    ['visita', 0, 10, 0, 'Visita · Opel Mokka', 'u2', 'hecha'],
    ['tasacion', 0, 11, 0, 'Tasación · Seat León 2015', 'u3', 'hecha'],
    ['firma', 0, 13, 30, 'Firma financiación · Cetelem', 'u4', 'confirmada'],
    ['taller', 0, 16, 0, 'Revisión 1 año · Toyota Yaris', 'u5', 'confirmada'],
    ['prueba', 0, 19, 0, 'Prueba · Ford Puma', 'u2', 'pendiente'],
    ['llamada', 1, 9, 30, 'Llamada · banco (stock financiado)', 'u1', 'pendiente'],
    ['taller', 1, 10, 0, 'Preparación · Kia Picanto', 'u5', 'confirmada'],
    ['visita', 1, 17, 30, 'Visita · MINI Cooper', 'u3', 'pendiente'],
    ['prueba', 2, 11, 30, 'Prueba · Porsche Panamera', 'u2', 'confirmada'],
    ['entrega', 3, 12, 0, 'Entrega · Toyota Yaris', 'u3', 'confirmada'],
    ['taller', 3, 9, 30, 'ITV · Ford Focus', 'u5', 'confirmada'],
    ['visita', 4, 10, 30, 'Visita · Hyundai i20', 'u2', 'pendiente'],
    ['prueba', 5, 11, 0, 'Prueba · Volkswagen T-Cross', 'u3', 'pendiente'],
    ['prueba', -1, 12, 0, 'Prueba · Nissan Juke', 'u3', 'hecha'],
    ['visita', -1, 18, 0, 'Visita · Jeep Renegade', 'u2', 'no_vino'],
    ['entrega', -2, 12, 30, 'Entrega · SEAT Arona FR', 'u2', 'hecha'],
    ['prueba', -2, 17, 0, 'Prueba · SEAT León', 'u2', 'hecha'],
    ['tasacion', -3, 10, 0, 'Tasación · Peugeot 308', 'u3', 'hecha'],
    ['prueba', -4, 11, 0, 'Prueba · Kia XCeed', 'u3', 'hecha'],
    ['entrega', -4, 13, 0, 'Entrega · Ford Puma', 'u3', 'hecha'],
    ['visita', -5, 17, 30, 'Visita · Dacia Duster', 'u2', 'hecha'],
    ['taller', -6, 9, 0, 'Revisión · Renault Clio', 'u5', 'hecha'],
    ['entrega', -6, 12, 0, 'Entrega · Toyota Yaris', 'u3', 'hecha'],
    ['prueba', 6, 10, 0, 'Prueba · Volkswagen ID.5', 'u2', 'pendiente'],
    ['visita', 7, 18, 30, 'Visita · Opel Corsa', 'u3', 'pendiente'],
    ['entrega', 8, 12, 0, 'Entrega · SEAT Ibiza', 'u2', 'pendiente'],
    ['taller', 9, 9, 0, 'Revisión · Nissan Qashqai', 'u5', 'pendiente']
  ];
  const DUR = {prueba: 45, visita: 45, entrega: 45, tasacion: 30, firma: 45, taller: 90, llamada: 15};
  const pool = contacts.filter(c => !['perdido'].includes(c.etapa));
  extraEv.forEach(([tipo, d, h, m, titulo, uid, estado], i) => {
    const modelo = titulo.split(' · ')[1] || '';
    const v = vehicles.find(x => modelo.includes(x.modelo) && x.estado !== 'vendido') || null;
    const c = tipo === 'llamada' ? null : pool[(i * 7) % pool.length];
    const ini = at(d, h, m);
    events.push({id: App.uid('e'), tipo, titulo, contactId: c ? c.id : null, vehicleId: v ? v.id : null, userId: uid, inicio: ini, fin: App.addMin(ini, DUR[tipo]).toISOString(), estado, gcal:true, recordatorio: tipo !== 'llamada', origen: pick(['ia','manual','manual'])});
  });

  /* ---------- presupuestos ---------- */
  const quotes = [];
  let qn = 128;
  const EXTRAS = [{concepto:'Transferencia y gestoría', importe: 250}, {concepto:'Garantía ampliada a 24 meses', importe: 390}, {concepto:'Kit de alfombrillas y cortinillas', importe: 90}, {concepto:'Tratamiento cerámico de pintura', importe: 290}];
  const qFor = (c, estado, fechaMin) => {
    const v = vehicles.find(x => x.id === c.interes[0]); if (!v) return;
    qn++;
    const tas = c.cocheACuenta ? round(1500 + (2024 - c.cocheACuenta.anio) * -120 + 5200 - c.cocheACuenta.km / 60, 100) : 0;
    const extras = [EXTRAS[0]].concat(R() > .5 ? [EXTRAS[1]] : []).concat(R() > .7 ? [EXTRAS[2]] : []);
    const precio = v.precioVenta || v.precio;
    const descuento = pick([0, 0, 200, 300, 500]);
    const total = precio - descuento + App.sum(extras, e => e.importe) - Math.max(tas, 0);
    const fin = c.financiar ? {entrada: pick([0, 2000, 3000, 5000]), plazo: pick([60, 72, 84, 96]), tin: dealer.tin} : null;
    if (fin) fin.cuota = Math.round(App.cuota(total - fin.entrada, fin.tin, fin.plazo));
    quotes.push({id: App.uid('q'), numero: 'P-2026-' + String(qn).padStart(4, '0'), tipo: estado === 'aceptado' && R() > .5 ? 'reserva' : 'presupuesto', contactId: c.id, vehicleId: v.id, userId: c.asignado,
      fecha: ago(fechaMin), precio, descuento, extras, tasacion: tas > 0 ? {importe: Math.max(tas, 600), vehiculo: `${c.cocheACuenta.marca} ${c.cocheACuenta.modelo} ${c.cocheACuenta.anio}`} : null,
      financiacion: fin, senal: estado === 'aceptado' ? pick([300, 500]) : 0, estado, validez: 15, vistas: estado === 'borrador' ? 0 : ri(1, 6), notas:''});
  };
  contacts.filter(c => c.etapa === 'vendido').slice(0, 8).forEach(c => qFor(c, 'aceptado', App.daysSince(vehicles.find(v => v.id === c.interes[0]).fechaVenta) * 1440 + 2 * 1440));
  contacts.filter(c => c.etapa === 'reservado').forEach(c => qFor(c, 'aceptado', ri(4, 8) * 1440));
  contacts.filter(c => c.etapa === 'negociacion').forEach((c, i) => qFor(c, i % 2 ? 'visto' : 'enviado', ri(1, 4) * 1440));
  contacts.filter(c => c.etapa === 'prueba').slice(0, 3).forEach(c => qFor(c, pick(['borrador','enviado']), ri(0, 2) * 1440 + ri(30, 500)));
  contacts.filter(c => c.etapa === 'perdido').slice(0, 3).forEach(c => qFor(c, 'rechazado', ri(10, 30) * 1440));
  // El de Antonio con número fijo
  const qa = quotes.find(q => q.contactId === 'c4'); if (qa) { const dup = quotes.find(q => q.numero === 'P-2026-0147'); if (dup && dup !== qa) dup.numero = qa.numero; qa.numero = 'P-2026-0147'; qa.estado = 'visto'; qa.tasacion = {importe: 5200, vehiculo:'Peugeot 308 2016'}; qa.descuento = 0; qa.extras = [EXTRAS[0], {concepto:'Garantía 36 meses', importe:0}]; qa.financiacion = null; qa.vistas = 4; qa.fecha = ago(1 * 1440 + 279); }
  quotes.sort((a, b) => b.fecha.localeCompare(a.fecha));

  /* ---------- tasaciones ---------- */
  const TAS = [
    ['c4', 'Peugeot','308','1.6 BlueHDi 120 Allure',2016,132000,'Diésel','aceptada',5600,5200, 'Rayón en paragolpes trasero. Neumáticos al 60 %.', 2],
    ['c2', 'Renault','Mégane','1.5 dCi 110 Limited',2012,168000,'Diésel','pendiente',0,0, 'Ha mandado 4 fotos por WhatsApp. Pendiente de ver en persona.', 0],
    ['c7', 'Dacia','Sandero','Stepway TCe 90',2019,74000,'Gasolina','pendiente',0,0, 'Cita el jueves a las 18:00.', 0],
    [null, 'Seat','León','1.6 TDI 110 Style',2015,121000,'Diésel','valorada',8200,7100, 'Buen estado general. Distribución hecha a los 110.000 km.', 0],
    [null, 'Volkswagen','Golf','1.4 TSI 125 Advance',2017,98000,'Gasolina','valorada',11800,10300, 'Una rueda con llanta rozada. Libro de revisiones completo.', 1],
    [null, 'Citroën','C4 Picasso','BlueHDi 120 Feel',2016,145000,'Diésel','rechazada',6900,5400, 'El cliente esperaba 7.500 €. No aceptó.', 4],
    [null, 'Toyota','Auris','Hybrid 140H Active',2017,112000,'Híbrido','aceptada',10900,9600, 'Entra a stock tras preparación.', 6],
    [null, 'Ford','Fiesta','1.0 EcoBoost 100 Trend',2018,76000,'Gasolina','valorada',8900,7800, 'Pendiente de respuesta del cliente.', 1],
    [null, 'BMW','Serie 1','118d Advantage',2015,154000,'Diésel','compra',9800,8300, 'Compra directa (sin venta asociada). Bueno para exportar a stock.', 3]
  ];
  const appraisals = TAS.map((t, i) => {
    const [cid, marca, modelo, version, anio, km, combustible, estado, mercado, oferta, notas, hace] = t;
    const c = cid ? contacts.find(x => x.id === cid) : contacts.filter(x => ['prueba','negociacion','perdido','contactado'].includes(x.etapa))[i];
    return {id: App.uid('ta'), contactId: c ? c.id : null, marca, modelo, version, anio, km, combustible, matricula: plate(Math.min(anio, 2018)).replace(/ [A-Z]/, ' ' + ({2012:'H',2015:'J',2016:'J',2017:'K',2018:'K',2019:'K'}[anio] || 'J')),
      estado: estado === 'compra' ? 'aceptada' : estado, valorMercado: mercado, oferta, reacondicionado: mercado ? round(mercado * .09, 50) : 0,
      danos: notas.includes('Rayón') ? ['Paragolpes trasero'] : notas.includes('llanta') ? ['Llanta delantera derecha'] : [],
      fotos: estado === 'pendiente' && i === 1 ? 4 : ri(6, 14), fecha: ago(hace * 1440 + ri(60, 600)), userId: pick(COM), notas, compraDirecta: estado === 'compra',
      comparables: mercado ? [round(mercado * 1.08, 100), round(mercado * .97, 100), round(mercado * 1.02, 100)] : []};
  });

  /* ---------- financiaciones ---------- */
  const ENT = ['Santander Consumer','Cetelem','BBVA Consumer','Sofinco','CaixaBank Payments'];
  const financings = [];
  const finFor = (c, estado, hace) => {
    const v = vehicles.find(x => x.id === c.interes[0]); if (!v) return;
    const entrada = pick([0, 1500, 2000, 3000, 5000]), plazo = pick([60, 72, 84, 96]), importe = (v.precioVenta || v.precio) - entrada;
    financings.push({id: App.uid('f'), contactId: c.id, vehicleId: v.id, entidad: pick(ENT), importe, entrada, plazo, tin: dealer.tin, cuota: Math.round(App.cuota(importe, dealer.tin, plazo)),
      estado, fecha: ago(hace * 1440 + ri(30, 400)), comision: round(importe * .025, 10), userId:'u4', docs: {dni: estado !== 'estudio', nomina: estado !== 'estudio' || R() > .5, banco: ['aprobada','firmada'].includes(estado)}, notas: estado === 'denegada' ? 'Endeudamiento alto. Probar con Sofinco con avalista.' : ''});
  };
  contacts.filter(c => c.etapa === 'vendido' && c.financiar).slice(0, 7).forEach(c => finFor(c, 'firmada', App.daysSince(vehicles.find(v => v.id === c.interes[0]).fechaVenta) + 2));
  contacts.filter(c => c.etapa === 'reservado').forEach(c => finFor(c, 'aprobada', ri(3, 5)));
  contacts.filter(c => c.etapa === 'negociacion' && c.financiar).forEach((c, i) => finFor(c, i ? 'enviada' : 'estudio', ri(0, 2)));
  finFor(contacts.find(c => c.id === 'c1'), 'estudio', 0);
  finFor(contacts.find(c => c.id === 'c3'), 'estudio', 0);
  const perd = contacts.find(c => c.motivoPerdida === 'No le aprobaron la financiación') || contacts.find(c => c.etapa === 'perdido');
  if (perd) finFor(perd, 'denegada', 9);
  financings.sort((a, b) => b.fecha.localeCompare(a.fecha));

  /* ---------- tareas ---------- */
  const tasks = [
    ['Contestar a Carlos (Wallapop): precio final Renegade + tasación Mégane', 0, 'u2', 'c2', '46a31cc0', false, 'whatsapp'],
    ['Preparar papeles de la entrega del Arona (Francisco)', 0, 'u4', 'c6', 'e852f25d', true, 'doc'],
    ['Llamar al banco para liberar la reserva de dominio del Qashqai', 0, 'u4', null, 'eda1228b', false, 'llamar'],
    ['Subir fotos nuevas del Ford Focus cuando salga de chapa', 0, 'u5', null, '9c3bb448', false, 'foto'],
    ['Cargar el ID.5 al 100 % para la prueba de mañana', 0, 'u5', 'c3', '971e0d25', false, 'taller'],
    ['Revisar precio del Nissan Pulsar (142 días en stock)', 0, 'u1', null, 'a6f79ac4', false, 'precio'],
    ['Mandar presupuesto con financiación a Marta (ID.5)', 1, 'u2', 'c3', '971e0d25', false, 'doc'],
    ['Llamar a Antonio si no responde al seguimiento del Juke', 1, 'u3', 'c4', '58fde280', false, 'llamar'],
    ['Pedir a Cetelem la documentación firmada de la venta del Mokka', 2, 'u4', null, null, false, 'doc'],
    ['Renovar anuncio destacado del Panamera en coches.net', -1, 'u1', null, '78a89628', true, 'portal']
  ].map(([texto, d, userId, contactId, vehicleId, hecha, tipo]) => ({id: App.uid('k'), texto, fecha: at(d, 20, 0), userId, contactId, vehicleId, hecha, tipo}));

  /* ---------- automatizaciones ---------- */
  const automations = [
    {id:'ia_whatsapp', nombre:'WhatsApp con IA 24/7', desc:'Contesta cada mensaje en menos de un minuto con el stock, el precio y la cuota. Agenda pruebas y pasa a una persona cuando hace falta.', icono:'bot', on:true, n30: 312, metrica:'conversaciones', ahorro: 26, grupo:'Atención'},
    {id:'portales_crm', nombre:'Leads de los portales al CRM', desc:'coches.net, Wallapop, Milanuncios, AutoScout24, Marketplace y la web entran solos, con el coche que les interesa y el comercial asignado.', icono:'inbox', on:true, n30: 184, metrica:'leads', ahorro: 9, grupo:'Atención'},
    {id:'reparto', nombre:'Reparto de leads entre comerciales', desc:'Por turnos y según quién está trabajando. Si nadie lo atiende en 15 minutos, avisa al gerente.', icono:'users', on:true, n30: 184, metrica:'repartos', ahorro: 3, grupo:'Atención'},
    {id:'recordatorio', nombre:'Recordatorio de cita', desc:'WhatsApp al cliente 24 h y 2 h antes, con la ubicación. Si no confirma, avisa al comercial.', icono:'bell-ring', on:true, n30: 61, metrica:'recordatorios', ahorro: 4, grupo:'Citas', impacto:'Las ausencias bajan de 1 de cada 4 a 1 de cada 10'},
    {id:'seguimiento48', nombre:'Seguimiento del «me lo pienso»', desc:'Si alguien recibió presupuesto o probó el coche y no contesta en 48 h, le escribe con una razón para volver.', icono:'repeat', on:true, n30: 38, metrica:'seguimientos', ahorro: 6, grupo:'Ventas'},
    {id:'bajada_precio', nombre:'Aviso de bajada de precio', desc:'Cuando rebajas un coche, avisa por WhatsApp a todos los que preguntaron por él.', icono:'trending-down', on:true, n30: 12, metrica:'avisos', ahorro: 2, grupo:'Ventas'},
    {id:'stock_parado', nombre:'Alerta de coche parado', desc:'A los 60 días en stock te avisa y te sugiere precio comparando con portales.', icono:'hourglass', on:true, n30: 5, metrica:'alertas', ahorro: 2, grupo:'Stock'},
    {id:'publicacion', nombre:'Publicación automática en portales', desc:'Al dar de alta un coche se publica en los portales elegidos. Al venderlo, se retira de todos a la vez.', icono:'globe', on:true, n30: 41, metrica:'publicaciones', ahorro: 8, grupo:'Stock'},
    {id:'resena', nombre:'Reseña en Google tras la entrega', desc:'A los 3 días de la entrega pregunta qué tal va el coche y, si está contento, le pide la reseña.', icono:'star', on:true, n30: 9, metrica:'reseñas conseguidas', ahorro: 1, grupo:'Postventa', impacto:'4,8 ★ de media en Google'},
    {id:'revision', nombre:'Revisión e ITV', desc:'Avisa al cliente cuando le toca revisión o ITV y le da cita en el taller.', icono:'wrench', on:true, n30: 14, metrica:'avisos', ahorro: 2, grupo:'Postventa'},
    {id:'informe', nombre:'Informe semanal al gerente', desc:'Cada lunes a las 8:00: ventas, leads, citas, margen y coches que no se mueven.', icono:'bar-chart-3', on:true, n30: 4, metrica:'informes', ahorro: 3, grupo:'Gestión'},
    {id:'cumple', nombre:'Aniversario de compra', desc:'Al año de la compra, felicita y ofrece tasar su coche para cambiarlo.', icono:'gift', on:false, n30: 0, metrica:'mensajes', ahorro: 0, grupo:'Postventa'}
  ];

  /* ---------- notificaciones ---------- */
  const notifications = [
    {id: App.uid('n'), tipo:'humano', titulo:'Carlos quiere negociar el precio', texto:'La IA le ha pasado la conversación a Javier · Jeep Renegade', fecha: ago(39), leida:false, link:'#/whatsapp/c2', icon:'user-check'},
    {id: App.uid('n'), tipo:'lead', titulo:'Nuevo lead de Milanuncios', texto:'Paula pregunta por el SEAT Ibiza · contestado por la IA en 33 s', fecha: at(0, 7, 48), leida:false, link:'#/whatsapp/c5'},
    {id: App.uid('n'), tipo:'cita', titulo:'Cita agendada por la IA', texto:'Lucía · Prueba del Kia XCeed hoy a las 17:30', fecha: at(-1, 23, 21), leida:false, link:'#/agenda'},
    {id: App.uid('n'), tipo:'cita', titulo:'Cita agendada por la IA', texto:'Marta · Prueba del VW ID.5 mañana a las 11:00', fecha: at(-1, 21, 52), leida:true, link:'#/agenda'},
    {id: App.uid('n'), tipo:'presupuesto', titulo:'Antonio ha abierto el presupuesto', texto:'P-2026-0147 · Nissan Juke · 4 veces', fecha: ago(130), leida:true, link:'#/presupuestos'},
    {id: App.uid('n'), tipo:'stock', titulo:'El Nissan Pulsar lleva 142 días', texto:'Precio sugerido: 10.600 € (−700 €) según 14 anuncios parecidos', fecha: at(0, 8, 0), leida:true, link:'#/stock/a6f79ac4'},
    {id: App.uid('n'), tipo:'financiacion', titulo:'Financiación aprobada', texto:'Santander Consumer · Francisco · SEAT Arona FR', fecha: ago(4 * 1440), leida:true, link:'#/financiacion'},
    {id: App.uid('n'), tipo:'resena', titulo:'Nueva reseña de 5 ★ en Google', texto:'José Luis · «Trato de diez y el coche impecable»', fecha: ago(1 * 1440 + 30), leida:true, link:'#/automatizaciones'}
  ];

  /* ---------- actividad reciente ---------- */
  const activity = [
    {fecha: ago(39), texto:'La IA pasó a Javier la conversación de Carlos (negociación)', icon:'bot', link:'#/whatsapp/c2'},
    {fecha: ago(52), texto:'Nuevo lead de Wallapop: Carlos · Jeep Renegade', icon:'zap', link:'#/leads/c2'},
    {fecha: ago(90), texto:'Seguimiento automático enviado a Antonio (48 h sin respuesta)', icon:'repeat', link:'#/leads/c4'},
    {fecha: at(0, 9, 0), texto:'Recordatorio de entrega enviado a Francisco', icon:'bell-ring', link:'#/leads/c6'},
    {fecha: at(0, 8, 0), texto:'Alerta: Nissan Pulsar lleva 142 días en stock', icon:'hourglass', link:'#/stock/a6f79ac4'},
    {fecha: at(0, 7, 48), texto:'La IA contestó a Paula (Milanuncios) en 33 s', icon:'message-circle', link:'#/whatsapp/c5'},
    {fecha: at(-1, 23, 21), texto:'La IA agendó una prueba con Lucía a las 23:21', icon:'calendar-check', link:'#/agenda'},
    {fecha: at(-1, 21, 52), texto:'La IA agendó una prueba con Marta (ID.5)', icon:'calendar-check', link:'#/agenda'},
    {fecha: vehicles.find(v => v.id === 'vs1').fechaVenta, texto:'Javier cerró la venta del SEAT Arona FR (financiado)', icon:'badge-euro', link:'#/informes'}
  ];
  activity.sort((a, b) => b.fecha.localeCompare(a.fecha));

  /* ---------- histórico mensual (12 meses) para informes ---------- */
  const hoy = new Date();
  const hist = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1);
    const conIA = i <= 3; // los últimos 4 meses con el sistema
    const mes = App.MESES_C[d.getMonth()];
    const verano = [6, 7].includes(d.getMonth());
    const ventas = conIA ? ri(15, 19) : ri(9, 13) - (verano ? 2 : 0);
    const leads = conIA ? ri(165, 205) : ri(110, 140);
    hist.push({mes, anio: d.getFullYear(), ventas, leads, citas: Math.round(leads * (conIA ? .31 : .17)), facturacion: ventas * ri(17200, 19800), margen: ventas * ri(1850, 2300),
      respuestaMin: conIA ? +(0.6 + R() * .6).toFixed(1) : ri(95, 240), diasStock: conIA ? ri(34, 41) : ri(52, 63),
      origen: {cochesnet: Math.round(leads * .31), wallapop: Math.round(leads * .19), web: Math.round(leads * (conIA ? .14 : .08)), meta: conIA ? Math.round(leads * .17) : Math.round(leads * .04), milanuncios: Math.round(leads * .07), fbmarket: Math.round(leads * .05), otros: Math.round(leads * .07)}});
  }
  // mes actual: parcial (hasta hoy)
  const frac = hoy.getDate() / 30;
  const last = hist[hist.length - 1];
  const vendidosMes = vehicles.filter(v => v.estado === 'vendido' && new Date(v.fechaVenta).getMonth() === hoy.getMonth()).length;
  last.ventas = Math.max(vendidosMes, Math.round(last.ventas * frac)); last.leads = Math.round(last.leads * frac); last.citas = Math.round(last.citas * frac);
  last.facturacion = Math.round(last.facturacion * frac); last.margen = Math.round(last.margen * frac);
  Object.keys(last.origen).forEach(k => last.origen[k] = Math.round(last.origen[k] * frac));

  // si se abre muy temprano, nada puede quedar «en el futuro»
  const ahora = new Date().toISOString();
  const clamp = o => { if (o.fecha > ahora) o.fecha = ago(1); };
  messages.forEach(clamp); notifications.forEach(clamp); activity.forEach(clamp); contacts.forEach(c => { c.timeline.forEach(clamp); if (c.creado > ahora) c.creado = ago(2); if (c.ultimoContacto > ahora) c.ultimoContacto = ago(1); });
  contacts.forEach(c => c.timeline.sort((a, b) => b.fecha.localeCompare(a.fecha)));
  messages.sort((a, b) => a.fecha.localeCompare(b.fecha));
  events.sort((a, b) => a.inicio.localeCompare(b.inicio));

  return {
    version: 3, creado: new Date().toISOString(), dealer, users, me: 'u1',
    vehicles, contacts, messages, events, quotes, appraisals, financings, tasks, automations, notifications, activity, hist,
    integraciones: {gcal: true, whatsapp: true, meta: true, cochesnet: true, wallapop: true, milanuncios: true, autoscout: false, fbmarket: true, google: true, holded: false},
    prefs: {tema: 'light', vistaLeads: 'kanban', vistaStock: 'grid', vistaAgenda: 'semana', sidebar: 'open'}
  };
};
})();
