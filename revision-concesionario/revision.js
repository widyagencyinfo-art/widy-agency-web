/* Autorrevisión de /revision-concesionario: cuenta las casillas, dice por dónde empezar
   y deja el mensaje de WhatsApp escrito con el resultado. */
(function () {
  var list = document.getElementById('revList');
  if (!list) return;
  var n = document.getElementById('revN');
  var bar = document.getElementById('revBar');
  var txt = document.getElementById('revTxt');
  var wa = document.getElementById('revWa');

  // orden en el que lo arreglaríamos
  var PRIORIDAD = [
    ['tae', 'la cuota: ponerle al lado el ejemplo representativo con la TAE', 'Es obligatorio y se hace en una tarde con los datos de tu financiera.'],
    ['carga', 'la web: que cargue rápido y con candado', 'Si no carga, todo lo demás da igual.'],
    ['crm', 'juntar todos los contactos en un solo sitio', 'Es donde más ventas se pierden sin que nadie se entere.'],
    ['whatsapp', 'el botón de WhatsApp en cada coche', 'Casi nadie llama a las once de la noche; escribir, sí.'],
    ['movil', 'que la web se vea bien en el móvil', 'Es desde donde te van a mirar casi siempre.'],
    ['tasacion', 'ofrecer la tasación de su coche', 'Es la conversación más fácil de abrir con quien viene a cambiar de coche.'],
    ['legal', 'el aviso legal y la privacidad', 'Es obligatorio y lo tienes gratis con el generador.'],
    ['pixel', 'instalar el píxel de Meta', 'Para poder volver a enseñarle el coche a quien lo miró.']
  ];
  var NOMBRES = { tae: 'cuota con TAE', carga: 'web rápida y con candado', crm: 'contactos en un solo sitio',
    whatsapp: 'WhatsApp en cada coche', movil: 'versión móvil', tasacion: 'tasación', legal: 'aviso legal', pixel: 'píxel de Meta' };

  function pintar() {
    var marcadas = {};
    var total = 0;
    list.querySelectorAll('input[type=checkbox]').forEach(function (c) {
      if (c.checked) { marcadas[c.value] = true; total++; }
    });
    n.textContent = total;
    bar.style.width = (total / 8 * 100) + '%';
    var faltan = PRIORIDAD.filter(function (p) { return !marcadas[p[0]]; });
    var msg;
    if (total === 0) {
      txt.textContent = 'Marca lo que ya tienes en tu web.';
      msg = 'Quiero la revisión gratis de mi web.';
    } else if (!faltan.length) {
      txt.innerHTML = '<b>8 de 8: tu web está mejor que la de casi todas.</b> El siguiente paso son los anuncios de tus coches.';
      msg = 'He hecho la revisión: 8/8. Me interesa anunciar mis coches.';
    } else {
      var f = faltan[0];
      txt.innerHTML = '<b>Nosotros empezaríamos por ' + f[1] + '.</b> ' + f[2];
      msg = 'He hecho la revisión: ' + total + '/8. Me falta: ' +
        faltan.map(function (p) { return NOMBRES[p[0]]; }).join(', ') + '. Quiero la revisión completa de mi web.';
    }
    wa.href = 'https://wa.me/34624869847?text=' + encodeURIComponent(
      'Hola Widy, te escribo desde widy.agency/revision-concesionario. ' + msg + ' Mi web es: ');
  }
  list.addEventListener('change', pintar);
  pintar();
})();
