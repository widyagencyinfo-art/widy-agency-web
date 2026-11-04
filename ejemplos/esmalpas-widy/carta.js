/* ===== Es Mal Pas — carta digital =====
   Para editar la carta solo hay que tocar el objeto MENU de abajo.
   tags: veg (vegetariano) · vegano · sg (sin gluten) · top (recomendado)
*/
(function () {
  'use strict';

  var MENU = [
    {
      id: 'empezar',
      es: 'Para empezar', en: 'To start',
      noteEs: 'Para compartir', noteEn: 'To share',
      items: [
        { es: 'Pan de la casa, aceite y aceitunas', en: 'House bread, olive oil & olives',
          dEs: 'Pan recién hecho, aceite de oliva virgen extra y aceitunas de la isla.',
          dEn: 'Freshly baked bread, extra virgin olive oil and island olives.',
          p: 6.5, tags: ['veg'] },
        { es: 'Ensaladilla de gamba roja', en: 'Red prawn "ensaladilla"',
          dEs: 'Patata confitada, mayonesa de sus cabezas y gamba de la isla.',
          dEn: 'Confit potato, prawn-head mayonnaise and local red prawn.',
          p: 16, tags: ['sg', 'top'] },
        { es: 'Buñuelos de bacalao y anguila ahumada', en: 'Cod & smoked eel fritters',
          dEs: 'Con alioli suave de ajo asado.',
          dEn: 'With mild roasted-garlic aioli.',
          p: 15 },
        { es: 'Croquetas de sobrasada y miel', en: 'Sobrasada & honey croquettes',
          dEs: 'Cremosas, cinco unidades.',
          dEn: 'Creamy, five pieces.',
          p: 12 }
      ]
    },
    {
      id: 'entrantes',
      es: 'Entrantes', en: 'Starters',
      noteEs: 'Frescos y de temporada', noteEn: 'Fresh & seasonal',
      items: [
        { es: 'Gazpacho de remolacha y sardina ahumada', en: 'Beetroot gazpacho & smoked sardine',
          dEs: 'Servido bien frío, con aceite de albahaca.',
          dEn: 'Served ice-cold with basil oil.',
          p: 14, tags: ['sg'] },
        { es: 'Tiradito de lubina ahumada', en: 'Smoked sea bass tiradito',
          dEs: 'Salsa cítrica de coco, cebolla encurtida y cilantro.',
          dEn: 'Citrus-coconut sauce, pickled onion and coriander.',
          p: 19, tags: ['sg', 'top'] },
        { es: 'Carpaccio de calabacín y vinagreta de mango', en: 'Courgette carpaccio, mango vinaigrette',
          dEs: 'Calabacín de la huerta, almendra tostada y brotes.',
          dEn: 'Garden courgette, toasted almond and sprouts.',
          p: 15, tags: ['veg', 'vegano', 'sg'] },
        { es: 'Steak tartar de solomillo', en: 'Beef fillet steak tartare',
          dEs: 'Cortado a cuchillo, mostaza antigua y pan de cristal.',
          dEn: 'Hand-cut, wholegrain mustard and crystal bread.',
          p: 22 },
        { es: 'Burrata, tomate de temporada y pesto', en: 'Burrata, seasonal tomato & pesto',
          dEs: 'Con aceite de albahaca y piñón.',
          dEn: 'With basil oil and pine nuts.',
          p: 17, tags: ['veg', 'sg'] }
      ]
    },
    {
      id: 'arroces',
      es: 'Arroces', en: 'Rice dishes',
      noteEs: 'Mínimo 2 personas · 35 min', noteEn: 'Minimum 2 people · 35 min',
      items: [
        { es: 'Arroz meloso de bogavante', en: 'Creamy lobster rice',
          dEs: 'Fondo de marisco de la casa. Precio por persona.',
          dEn: 'House shellfish stock. Price per person.',
          p: 34, tags: ['sg', 'top'] },
        { es: 'Arroz de pulpo y gambas', en: 'Octopus & prawn rice',
          dEs: 'Seco, con alioli aparte. Precio por persona.',
          dEn: 'Dry style, aioli on the side. Price per person.',
          p: 28, tags: ['sg'] },
        { es: 'Arroz marinero', en: 'Fisherman’s rice',
          dEs: 'Con el pescado que entre ese día. Precio por persona.',
          dEn: 'With the day’s catch. Price per person.',
          p: 26, tags: ['sg'] },
        { es: 'Arroz de verduras de la huerta', en: 'Garden vegetable rice',
          dEs: 'Alcachofa, espárrago y setas. Precio por persona.',
          dEn: 'Artichoke, asparagus and mushrooms. Price per person.',
          p: 22, tags: ['veg', 'vegano', 'sg'] }
      ]
    },
    {
      id: 'mar',
      es: 'Del mar', en: 'From the sea',
      items: [
        { es: 'Corvina, cebolla encurtida y caviar', en: 'Meagre, pickled onion & caviar',
          dEs: 'Sobre crema tibia de azafrán y aceites de temporada.',
          dEn: 'On a warm saffron cream with seasonal oils.',
          p: 27, tags: ['sg', 'top'] },
        { es: 'Pescado del día a la brasa', en: 'Grilled catch of the day',
          dEs: 'Al peso, con verduras y aceite de hierbas. Pregunta al equipo.',
          dEn: 'By weight, with vegetables and herb oil. Ask our team.',
          p: null, tags: ['sg'] },
        { es: 'Calamar de potera a la plancha', en: 'Grilled line-caught squid',
          dEs: 'Con su tinta, ajo tierno y limón asado.',
          dEn: 'With its ink, young garlic and roasted lemon.',
          p: 24, tags: ['sg'] }
      ]
    },
    {
      id: 'carnes',
      es: 'Carnes', en: 'Meat',
      items: [
        { es: 'Carrillera de ternera y parmentier de boletus', en: 'Beef cheek, boletus parmentier',
          dEs: 'Guisada a baja temperatura durante 12 horas.',
          dEn: 'Slow-cooked for 12 hours.',
          p: 24, tags: ['sg', 'top'] },
        { es: 'Magret de pato con crema de boniato', en: 'Duck magret, sweet potato cream',
          dEs: 'Con reducción de vino tinto y frutos rojos.',
          dEn: 'Red wine and berry reduction.',
          p: 26, tags: ['sg'] },
        { es: 'Costillar de cordero a la brasa', en: 'Grilled lamb rack',
          dEs: 'Con hierbas de la isla y patata al romero.',
          dEn: 'Island herbs and rosemary potatoes.',
          p: 29, tags: ['sg'] }
      ]
    },
    {
      id: 'postres',
      es: 'Postres', en: 'Desserts',
      items: [
        { es: 'Flaó de la casa', en: 'House flaó',
          dEs: 'El pastel de queso y hierbabuena de las Pitiusas.',
          dEn: 'The traditional Pitiusas cheese and mint tart.',
          p: 9, tags: ['veg', 'top'] },
        { es: 'Coulant de chocolate 70%', en: '70% chocolate coulant',
          dEs: 'Con helado de vainilla de Madagascar.',
          dEn: 'With Madagascar vanilla ice cream.',
          p: 10, tags: ['veg'] },
        { es: 'Sorbete de limón y hierbas', en: 'Lemon & herb sorbet',
          dEs: 'Refrescante, con toque de hierbas ibicencas.',
          dEn: 'Refreshing, with a hint of Ibizan herbs.',
          p: 8, tags: ['veg', 'vegano', 'sg'] },
        { es: 'Café de especialidad', en: 'Specialty coffee',
          dEs: 'Tueste de origen, molido al momento.',
          dEn: 'Single-origin roast, ground to order.',
          p: 3.5, tags: ['veg', 'sg'] }
      ]
    },
    {
      id: 'cocteles',
      es: 'Coctelería', en: 'Cocktails',
      noteEs: 'Desde las 18:00', noteEn: 'From 6 pm',
      items: [
        { es: 'Mal Pas Sour', en: 'Mal Pas Sour',
          dEs: 'Nuestra versión de la casa: cítricos, hierbas y espuma sedosa.',
          dEn: 'Our house take: citrus, herbs and a silky foam.',
          p: 14, tags: ['top'] },
        { es: 'Spritz de hierbas ibicencas', en: 'Ibizan herb spritz',
          dEs: 'Con cava, soda y piel de naranja.',
          dEn: 'Cava, soda and orange peel.',
          p: 12 },
        { es: 'Gin tonic de la casa', en: 'House gin & tonic',
          dEs: 'Ginebra premium, romero y enebro.',
          dEn: 'Premium gin, rosemary and juniper.',
          p: 13 },
        { es: 'Copa de cava brut nature', en: 'Glass of brut nature cava',
          dEs: 'Para brindar antes de que caiga el sol.',
          dEn: 'To toast before sunset.',
          p: 7 }
      ]
    },
    {
      id: 'vinos',
      es: 'Vinos', en: 'Wines',
      noteEs: 'Carta completa en sala', noteEn: 'Full list at the table',
      items: [
        { es: 'Blanco de la isla — Formentera', en: 'Island white — Formentera',
          dEs: 'Vino de la tierra, fresco y salino. Copa / botella.',
          dEn: 'Local wine, fresh and saline. Glass / bottle.',
          p: 6, tags: ['vegano'] },
        { es: 'Albariño — Rías Baixas', en: 'Albariño — Rías Baixas',
          dEs: 'Perfecto con los arroces de mar. Copa / botella.',
          dEn: 'Perfect with our seafood rice. Glass / bottle.',
          p: 7 },
        { es: 'Tinto joven — Ribera del Duero', en: 'Young red — Ribera del Duero',
          dEs: 'Fruta madura y taninos suaves. Copa / botella.',
          dEn: 'Ripe fruit, soft tannins. Glass / bottle.',
          p: 7 },
        { es: 'Selección del sumiller', en: 'Sommelier’s selection',
          dEs: 'Referencias nacionales e internacionales elegidas plato a plato.',
          dEn: 'National and international references chosen dish by dish.',
          p: null, tags: ['top'] }
      ]
    }
  ];

  var TAGS = {
    veg:    { es: 'Vegetariano', en: 'Vegetarian', cls: 'tag--veg' },
    vegano: { es: 'Vegano',      en: 'Vegan',      cls: 'tag--veg' },
    sg:     { es: 'Sin gluten',  en: 'Gluten free', cls: 'tag--sg' },
    top:    { es: 'Recomendado', en: 'Chef’s pick', cls: 'tag--top' }
  };

  var I18N = {
    es: { tagline: 'Carta · Formentera', search: 'Buscar plato…', empty: 'No encontramos nada con ese nombre.',
          alergTitle: 'Alérgenos', alergTxt: 'Informamos con gusto de los alérgenos de cada plato. Consulta a nuestro equipo antes de pedir.',
          reserveWa: 'Reservar por WhatsApp', call: 'Llamar · 971 321 670',
          qrTxt: 'Escanea para abrir esta carta en tu móvil', mkt: 'Precio de mercado' },
    en: { tagline: 'Menu · Formentera', search: 'Search a dish…', empty: 'Nothing matches that search.',
          alergTitle: 'Allergens', alergTxt: 'We are happy to inform you about the allergens in every dish. Just ask our team.',
          reserveWa: 'Book via WhatsApp', call: 'Call · +34 971 321 670',
          qrTxt: 'Scan to open this menu on your phone', mkt: 'Market price' }
  };

  var lang = (navigator.language || 'es').slice(0, 2) === 'en' ? 'en' : 'es';
  var activeTags = [];
  var query = '';

  var $menu = document.getElementById('menu');
  var $tabs = document.getElementById('tabs');
  var $filters = document.getElementById('filters');
  var $empty = document.getElementById('empty');
  var $q = document.getElementById('q');

  function t(k) { return I18N[lang][k]; }

  function matches(item) {
    if (activeTags.length && !activeTags.every(function (tg) { return (item.tags || []).indexOf(tg) > -1; })) return false;
    if (!query) return true;
    var hay = (item.es + ' ' + item.en + ' ' + (item.dEs || '') + ' ' + (item.dEn || '')).toLowerCase();
    return hay.indexOf(query) > -1;
  }

  function renderTabs() {
    $tabs.innerHTML = MENU.map(function (c) {
      return '<a href="#' + c.id + '" data-cat="' + c.id + '">' + c[lang] + '</a>';
    }).join('');
  }

  function renderFilters() {
    $filters.innerHTML = Object.keys(TAGS).map(function (k) {
      return '<button class="chip' + (activeTags.indexOf(k) > -1 ? ' is-on' : '') +
             '" data-tag="' + k + '">' + TAGS[k][lang] + '</button>';
    }).join('');
  }

  function renderMenu() {
    var any = false;
    $menu.innerHTML = MENU.map(function (c) {
      var items = c.items.filter(matches);
      if (!items.length) return '';
      any = true;
      var note = c[lang === 'es' ? 'noteEs' : 'noteEn'];
      return '<section class="cat" id="' + c.id + '">' +
        '<div class="cat__head"><h2>' + c[lang] + '</h2>' +
        (note ? '<span class="cat__note">' + note + '</span>' : '') + '</div>' +
        items.map(function (i) {
          var tags = (i.tags || []).map(function (k) {
            return '<span class="tag ' + TAGS[k].cls + '">' + TAGS[k][lang] + '</span>';
          }).join('');
          var star = (i.tags || []).indexOf('top') > -1 ? '<span class="star">★</span>' : '';
          var price = i.p === null ? '<span style="font-size:.8rem">' + t('mkt') + '</span>' : i.p.toFixed(2).replace('.', ',') + ' €';
          return '<article class="item">' +
            '<h3 class="item__name">' + i[lang] + star + '</h3>' +
            '<span class="item__price">' + price + '</span>' +
            '<p class="item__desc">' + i[lang === 'es' ? 'dEs' : 'dEn'] + '</p>' +
            (tags ? '<div class="item__tags">' + tags + '</div>' : '') +
            '</article>';
        }).join('') +
        '</section>';
    }).join('');
    $empty.hidden = any;
  }

  function applyI18n() {
    document.documentElement.lang = lang;
    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      el.textContent = t(el.dataset.i18n);
    });
    document.querySelectorAll('[data-i18n-ph]').forEach(function (el) {
      el.placeholder = t(el.dataset.i18nPh);
    });
    document.getElementById('langNow').textContent = lang.toUpperCase();
  }

  function renderAll() {
    applyI18n();
    renderTabs();
    renderFilters();
    renderMenu();
    observeCats();
  }

  // scrollspy
  var spy;
  function observeCats() {
    if (spy) spy.disconnect();
    spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        $tabs.querySelectorAll('a').forEach(function (a) {
          a.classList.toggle('is-active', a.dataset.cat === e.target.id);
        });
        var on = $tabs.querySelector('a.is-active');
        if (on) on.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    document.querySelectorAll('.cat').forEach(function (c) { spy.observe(c); });
  }

  // eventos
  $filters.addEventListener('click', function (e) {
    var b = e.target.closest('.chip');
    if (!b) return;
    var k = b.dataset.tag;
    var i = activeTags.indexOf(k);
    if (i > -1) activeTags.splice(i, 1); else activeTags.push(k);
    renderFilters();
    renderMenu();
    observeCats();
  });

  $q.addEventListener('input', function () {
    query = $q.value.trim().toLowerCase();
    renderMenu();
    observeCats();
  });

  document.getElementById('langBtn').addEventListener('click', function () {
    lang = lang === 'es' ? 'en' : 'es';
    renderAll();
  });

  $tabs.addEventListener('click', function (e) {
    var a = e.target.closest('a');
    if (!a) return;
    e.preventDefault();
    var el = document.getElementById(a.dataset.cat);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  var $top = document.getElementById('totop');
  window.addEventListener('scroll', function () {
    $top.classList.toggle('is-on', window.scrollY > 700);
  }, { passive: true });
  $top.addEventListener('click', function (e) {
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  renderAll();
})();
