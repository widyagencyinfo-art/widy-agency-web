/* Configuración de la tienda. Esto es lo único que hay que tocar
   para cambiar datos, precios o textos de contacto. */

window.CONFIG = {
  marca: 'KUKI',
  marcaSub: 'MODS',
  ciudad: 'Álora',
  provincia: 'Málaga',
  direccion: 'Av. Cervantes, 21 · 29500 Álora (Málaga)',
  telefono: '640219302',
  telefonoBonito: '640 21 93 02',
  instagram: 'kuki_modas',
  email: 'hola@kukimods.es',

  horario: [
    { dias: 'Lunes a viernes', horas: '10:30 – 20:30' },
    { dias: 'Sábado', horas: '10:30 – 13:30' },
    { dias: 'Domingo', horas: 'Cerrado' }
  ],

  google: { nota: '5,0', resenas: 13 },

  envio: {
    gratisDesde: 60,
    coste: 4.95,
    recogida: 'Recogida gratis en la tienda de Álora'
  },

  // Poner en false para enseñar la web sin precios (todo pasa a "Precio por WhatsApp")
  MOSTRAR_PRECIOS: true,

  mapa: 'https://www.google.com/maps?q=KUKI+Av.+Cervantes+21+%C3%81lora&output=embed',
  mapaEnlace: 'https://www.google.com/maps/place/KUKI/data=!4m7!3m6!1s0xd72ebf605a80089:0x1939df2821d17a64!8m2!3d36.8284332!4d-4.7042232'
};
