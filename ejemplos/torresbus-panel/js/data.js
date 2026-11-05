/* Datos de demostración — Panel Torres Bus
   Flota, condiciones de cobro y cancelación tomadas de torresbus.es */

const PRESUS = [
 {id:1,tipo:'Boda',plazas:55,ruta:'Getafe → Toledo',fecha:'14 dic',valor:1450,canal:'WhatsApp',estado:'follow',rec:'2/3',cli:'Marta R.',tel:'+34 6•• ••• •12',bus:'Autocar 55'},
 {id:2,tipo:'Traslado empresa',plazas:30,ruta:'Aeropuerto T4 → Hotel',fecha:'22 nov',valor:640,canal:'Web',estado:'exp',cli:'Grupo Nabla',tel:'+34 6•• ••• •88',bus:'Autocar 35'},
 {id:3,tipo:'Excursión colegio',plazas:71,ruta:'Getafe → Segovia',fecha:'3 ene',valor:1980,canal:'Teléfono',estado:'won',cli:'CEIP Cervantes',tel:'+34 6•• ••• •04',bus:'Autocar 71'},
 {id:4,tipo:'Despedida soltero',plazas:19,ruta:'Madrid centro',fecha:'30 nov',valor:410,canal:'WhatsApp',estado:'send',cli:'Javier P.',tel:'+34 6•• ••• •57',bus:'Minibús 19'},
 {id:5,tipo:'Boda',plazas:35,ruta:'Alcalá → finca El Encín',fecha:'20 dic',valor:890,canal:'bodas.net',estado:'follow',rec:'1/3',cli:'Lucía & Dani',tel:'+34 6•• ••• •33',bus:'Autocar 35'},
 {id:6,tipo:'City tour VIP',plazas:16,ruta:'Madrid — 8 h',fecha:'25 nov',valor:520,canal:'Web',estado:'exp',cli:'TravelCorp',tel:'+34 6•• ••• •71',bus:'Minibús 16'},
 {id:7,tipo:'Traslado evento',plazas:50,ruta:'IFEMA → hoteles',fecha:'12 ene',valor:1240,canal:'WhatsApp',estado:'follow',rec:'3/3',cli:'Eventos Sur',tel:'+34 6•• ••• •29',bus:'Autocar 50'},
 {id:8,tipo:'Excursión senior',plazas:54,ruta:'Getafe → Aranjuez',fecha:'5 dic',valor:760,canal:'Teléfono',estado:'won',cli:'Asoc. La Alegría',tel:'+34 6•• ••• •95',bus:'Autocar 54'},
 {id:9,tipo:'Viaje escolar',plazas:50,ruta:'Móstoles → Cuenca',fecha:'18 ene',valor:1620,canal:'Web',estado:'follow',rec:'1/3',cli:'IES Los Olivos',tel:'+34 6•• ••• •40',bus:'Autocar 50'},
 {id:10,tipo:'Traslado ejecutivo',plazas:7,ruta:'Barajas → Chamartín',fecha:'21 nov',valor:180,canal:'WhatsApp',estado:'won',cli:'Delta Consulting',tel:'+34 6•• ••• •66',bus:'Microbús 7'},
 {id:11,tipo:'Boda',plazas:25,ruta:'Pozuelo → El Escorial',fecha:'27 dic',valor:690,canal:'bodas.net',estado:'send',cli:'Ana & Carlos',tel:'+34 6•• ••• •18',bus:'Microbús 25'},
 {id:12,tipo:'Excursión empresa',plazas:22,ruta:'Getafe → Chinchón',fecha:'9 dic',valor:540,canal:'Teléfono',estado:'exp',cli:'Nortec Ibérica',tel:'+34 6•• ••• •73',bus:'Minibús 22'},
];

const BADGE = {
 send:['Enviado hoy','b-send'], follow:['Recordatorio','b-follow'],
 exp:['Caduca en 24 h','b-exp'], won:['Ganado','b-won'], lost:['Perdido','b-lost']
};

const KPIS = [
 {kl:'Presupuestos abiertos',kv:37,fmt:'n',kd:'en seguimiento activo',cls:'',sp:[20,24,22,28,31,34,37]},
 {kl:'€ en juego',kv:42300,fmt:'e',kd:'valor de lo abierto',cls:'',sp:[28,31,30,36,38,40,42]},
 {kl:'Cerrados (mes)',kv:40,fmt:'n',kd:'▲ +10 vs. antes',cls:'up',sp:[22,26,28,30,34,37,40]},
 {kl:'Tasa de cierre',kv:40,fmt:'p',kd:'▲ +10 puntos',cls:'up',sp:[27,29,30,33,36,38,40]},
];

const SEMANAS = [22,28,31,40];

const CANALES = [
 ['WhatsApp',45,1],['Web / presupuestos',30,0],['Teléfono',15,0],['bodas.net',10,0]
];

/* Flota real: de 7 a 71 plazas (torresbus.es) */
const FLOTA = [
 {n:'Microbús 7',pl:7,mat:'4821 KTB',st:'ok',occ:52,tipo:'VIP ejecutivo'},
 {n:'Microbús 12',pl:12,mat:'6144 LTB',st:'go',occ:71,tipo:'Traslados'},
 {n:'Minibús 16',pl:16,mat:'3097 MTB',st:'ok',occ:64,tipo:'City tour'},
 {n:'Minibús 19',pl:19,mat:'8250 KTB',st:'go',occ:78,tipo:'Grupos'},
 {n:'Minibús 22',pl:22,mat:'1476 NTB',st:'ok',occ:58,tipo:'Grupos'},
 {n:'Microbús 25',pl:25,mat:'5903 LTB',st:'mt',occ:40,tipo:'Grupos'},
 {n:'Autocar 35',pl:35,mat:'2618 MTB',st:'go',occ:82,tipo:'Excursiones'},
 {n:'Autocar 50',pl:50,mat:'7355 KTB',st:'ok',occ:88,tipo:'Escolar / eventos'},
 {n:'Autocar 54',pl:54,mat:'4062 NTB',st:'go',occ:75,tipo:'Excursiones'},
 {n:'Autocar 71',pl:71,mat:'9184 MTB',st:'ok',occ:69,tipo:'Grandes grupos'},
];
const EST_VEH = {ok:['Disponible','st-ok'],go:['En ruta','st-go'],mt:['Mantenimiento','st-mt']};

const CLIENTES = [
 {n:'Eventos Sur',t:'Empresa de eventos',c:'WhatsApp',sv:12,eur:18600,ult:'12 oct',rep:1},
 {n:'CEIP Cervantes',t:'Centro escolar',c:'Teléfono',sv:8,eur:12400,ult:'3 oct',rep:1},
 {n:'Asoc. La Alegría',t:'Asociación senior',c:'Teléfono',sv:15,eur:9800,ult:'5 sept',rep:1},
 {n:'IES Los Olivos',t:'Centro escolar',c:'Web',sv:6,eur:7900,ult:'18 oct',rep:1},
 {n:'TravelCorp',t:'Agencia de viajes',c:'Web',sv:6,eur:4100,ult:'25 ago',rep:1},
 {n:'Grupo Nabla',t:'Empresa',c:'Web',sv:5,eur:3200,ult:'22 ago',rep:1},
 {n:'Nortec Ibérica',t:'Empresa',c:'Teléfono',sv:3,eur:1900,ult:'9 sept',rep:0},
 {n:'Delta Consulting',t:'Empresa',c:'WhatsApp',sv:2,eur:520,ult:'21 ago',rep:0},
 {n:'Marta R.',t:'Particular · boda',c:'WhatsApp',sv:1,eur:1450,ult:'14 sept',rep:0},
 {n:'Lucía & Dani',t:'Particular · boda',c:'bodas.net',sv:1,eur:890,ult:'20 sept',rep:0},
];

const PROXIMOS = [
 {d:'21',m:'nov',t:'Traslado ejecutivo · 7 plazas',r:'Barajas → Chamartín · 08:30',b:'Microbús 7'},
 {d:'22',m:'nov',t:'Traslado empresa · 30 plazas',r:'Aeropuerto T4 → Hotel · 11:00',b:'Autocar 35'},
 {d:'25',m:'nov',t:'City tour VIP · 16 plazas',r:'Madrid — 8 h · 09:00',b:'Minibús 16'},
 {d:'30',m:'nov',t:'Despedida soltero · 19 plazas',r:'Madrid centro · 21:00',b:'Minibús 19'},
 {d:'05',m:'sep',t:'Excursión senior · 54 plazas',r:'Getafe → Aranjuez · 09:30',b:'Autocar 54'},
];

/* Secuencia de seguimiento automático */
const SECUENCIA = [
 {n:1,t:'Presupuesto enviado',w:'Al instante',via:[['WhatsApp',1],['Email',0]],
  msg:'Hola {nombre}, soy {agente} de Torres Bus.\nTe paso el presupuesto para el {servicio} del {fecha}: {importe} €, IVA incluido, con conductor.\n\nCualquier duda me dices y lo ajustamos. ¿Te reservo la fecha?',
  st:[['Enviados',248],['Responden',62,1]]},
 {n:2,t:'Recordatorio 1',w:'+48 horas',via:[['WhatsApp',1]],
  msg:'Hola {nombre}, ¿pudiste ver el presupuesto del {fecha}?\n\nSi te encaja lo dejamos cerrado, y si necesitas cambiar plazas u horario lo vemos sin problema.',
  st:[['Enviados',186],['Responden',54,1]]},
 {n:3,t:'Recordatorio 2',w:'+5 días',via:[['WhatsApp',1],['Email',0]],
  msg:'{nombre}, te escribo por el autocar del {fecha}.\n\nEsa fecha se nos está llenando y no quiero que te quedes sin vehículo. ¿Lo bloqueamos?',
  st:[['Enviados',132],['Responden',41,1]]},
 {n:4,t:'Aviso de caducidad de tarifa',w:'+7 días',via:[['WhatsApp',1],['Email',0]],
  msg:'{nombre}, aviso rápido: la tarifa de {importe} € del {fecha} vence hoy.\n\nA partir de mañana el precio se recalcula según disponibilidad. Si lo confirmas ahora te lo mantengo.',
  st:[['Enviados',91],['Responden',38,1]]},
 {n:5,t:'Última oportunidad',w:'+12 días',via:[['WhatsApp',1]],
  msg:'{nombre}, cierro tu solicitud del {fecha} salvo que me digas lo contrario.\n\nSi lo retomas más adelante, escríbeme y te hago presupuesto nuevo. Un saludo.',
  st:[['Enviados',58],['Recuperados',12,1]]},
];

/* Condiciones reales publicadas por Torres Bus */
const COND = [
 ['Señal al reservar','40 % con tarjeta'],
 ['Resto del importe','60 % · 3 días laborables antes'],
 ['Cancelación +3 días laborables','Sin coste'],
 ['Cancelación entre 3 días y 24 h','20 % del importe'],
 ['Cancelación menos de 24 h','50 % del importe'],
 ['Validez del presupuesto','7 días · luego se recalcula'],
];

const CONEXIONES = [
 ['WhatsApp Business','607 372 252 · conectado','#25D366','#E8F9EF','W'],
 ['Web y portal de presupuestos','torresbus.es · conectado','#E3166F','#FDEBF3','T'],
 ['Correo','info@torresbus.es · conectado','#2D6BE4','#EAF0FE','@'],
 ['bodas.net','Perfil de bodas · conectado','#E3166F','#FDEBF3','B'],
 ['Teléfono','Alta manual desde el panel','#6B6B76','#F5F5F8','☎'],
];

const AVISOS = [
 ['Recordatorio automático antes de cada servicio','Al cliente, 24 h antes de la salida',1],
 ['Aviso al equipo de presupuestos que caducan','Cada mañana a las 9:00',1],
 ['Resumen semanal por correo','Lunes · presupuestos, cierres y € en juego',1],
 ['Aviso de vehículo en mantenimiento','Cuando un vehículo cambia de estado',0],
];

const LIVE_FEED = [
 ['g','Recordatorio enviado','Boda 55 plazas · WhatsApp'],
 ['g','Nuevo presupuesto','City tour 16 plazas · Web'],
 ['r','Tarifa caduca pronto','Traslado empresa · avisa el sistema'],
 ['g','Presupuesto cerrado 🎉','Excursión 54 plazas · 760 €'],
 ['g','Cliente responde','IES Los Olivos · pide cambio de hora'],
];
