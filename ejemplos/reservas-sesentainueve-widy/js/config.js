/* Sesentainueve Tattoo & Piercing · Casco Antiguo (Sevilla) */
window.BIZ = {
  id: 's69',
  name: 'Sesentainueve Tattoo',
  short: '69',
  phone: '605242473',
  phonePretty: '605 24 24 73',
  whatsapp: '34605242473',
  address: 'C. Arjona, 10 · Casco Antiguo, Sevilla',
  url: 'https://widy.agency/ejemplos/reservas-sesentainueve-widy/',
  rating: '4,7',
  reviews: 201,
  pin: '1234',
  slotMin: 30,
  /* 0 = domingo */
  hours: {
    0: [],
    1: [['11:00', '14:00'], ['17:00', '21:00']],
    2: [['11:00', '14:00'], ['17:00', '21:00']],
    3: [['11:00', '14:00'], ['17:00', '21:00']],
    4: [['11:00', '14:00'], ['17:00', '21:00']],
    5: [['11:00', '14:00'], ['17:00', '21:00']],
    6: [['11:00', '14:00'], ['17:00', '21:00']]
  },
  /* carteles imprimibles: negro rotundo + rojo tinta */
  poster: {
    ink: '#0B0B0C', accent: '#C42A24', wash: '#F4F1EC', line: '#E0DBD3',
    kicker: 'Tattoo & Piercing · Sevilla · desde 1999',
    head: 'Tu cita,<br>a un escaneo',
    headShort: 'Reserva<br>tu cita',
    sub: 'Valoración gratis, presupuesto cerrado y el hueco reservado a tu nombre. Sin esperar a que abramos.',
    subShort: 'Valoración gratis. Elige día y hora.',
    bullets: ['Valoración y presupuesto gratis', 'A cualquier hora, también de noche', 'La señal bloquea tu hueco']
  },
  services: [
    { id: 'val', ic: '🖤', nm: 'Cita de valoración',    du: 20,  pr: 0,   cat: 'Antes de tatuar' },
    { id: 'dis', ic: '✏️', nm: 'Diseño personalizado',  du: 30,  pr: 0,   cat: 'Antes de tatuar' },
    { id: 'peq', ic: '🖊️', nm: 'Tatuaje pequeño',       du: 60,  pr: 50,  dep: 20, cat: 'Tatuaje' },
    { id: 'med', ic: '🎯', nm: 'Tatuaje mediano',       du: 120, pr: 120, dep: 30, cat: 'Tatuaje' },
    { id: 'ses', ic: '🎨', nm: 'Sesión completa',       du: 240, pr: 0, custom: true, dep: 40, cat: 'Tatuaje' },
    { id: 'cov', ic: '🔥', nm: 'Cover / tapado',        du: 180, pr: 0, custom: true, dep: 40, cat: 'Tatuaje' },
    { id: 'ret', ic: '🩹', nm: 'Retoque o revisión',    du: 20,  pr: 0,   cat: 'Tatuaje' },
    { id: 'pie', ic: '💎', nm: 'Piercing',              du: 15,  pr: 25,  cat: 'Piercing' },
    { id: 'or2', ic: '👂', nm: 'Piercing oreja (varios)', du: 30, pr: 40, cat: 'Piercing' },
    { id: 'joy', ic: '✨', nm: 'Cambio de joya',        du: 10,  pr: 15,  cat: 'Piercing' }
  ]
};
