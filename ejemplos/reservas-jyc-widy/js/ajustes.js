/* Widy · ajustes del panel: avisos al móvil, instalar como app, contraseña y enlaces */
(function () {
  'use strict';
  var S = window.Store;
  if (!S || !S.panel) return;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var el = function (t, c, h) { var e = document.createElement(t); if (c) e.className = c; if (h != null) e.innerHTML = h; return e; };
  var aviso = function (t) { if (window.Panel) window.Panel.pop(t); };

  var ua = navigator.userAgent;
  var esAndroid = /android/i.test(ua);
  /* el iPad moderno se hace pasar por Mac: se reconoce por el táctil. Android manda siempre. */
  var esIOS = !esAndroid && (/iphone|ipad|ipod/i.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1));
  var instalada = window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
  var promptInstalar = null;
  window.addEventListener('beforeinstallprompt', function (e) { e.preventDefault(); promptInstalar = e; });

  function claveB64(b64) {
    var pad = '='.repeat((4 - b64.length % 4) % 4);
    var raw = atob((b64 + pad).replace(/-/g, '+').replace(/_/g, '/'));
    var out = new Uint8Array(raw.length);
    for (var i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
    return out;
  }
  function registro() {
    return navigator.serviceWorker.register('/ejemplos/reservas-jyc-widy/sw.js').then(function () { return navigator.serviceWorker.ready; });
  }

  /* ---------------- avisos ---------------- */
  function pintarAvisos(box) {
    box.innerHTML = '<div class="p-h"><b>Avisos de citas nuevas</b></div>';
    var p = el('p', 'aj-p'); box.appendChild(p);
    var acts = el('div', 'aj-acts'); box.appendChild(acts);

    if (!S.datos.push) { p.textContent = 'Los avisos todavía no están configurados en el servidor.'; return; }
    var soporta = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
    if (!soporta) {
      p.innerHTML = esIOS && !instalada
        ? 'En el iPhone los avisos solo funcionan con el panel <b>instalado como app</b>. Mira la tarjeta de abajo, instálalo y vuelve aquí desde el icono nuevo.'
        : 'Este navegador no permite avisos. En Android abre el panel con <b>Chrome</b>; en iPhone, con Safari.';
      return;
    }
    if (Notification.permission === 'denied') {
      p.innerHTML = esAndroid
        ? 'Has <b>bloqueado</b> los avisos para esta página. Vuelve a activarlos así: toca el <b>candado</b> (o la ⓘ) que hay al lado de la dirección, entra en <b>Permisos</b> → <b>Notificaciones</b> y ponlo en Permitir. Luego recarga esta página.'
        : 'Has <b>bloqueado</b> los avisos para esta página. Actívalos en los ajustes del navegador (en el iPhone: Ajustes → Notificaciones) y vuelve aquí.';
      return;
    }
    registro().then(function (reg) { return reg.pushManager.getSubscription(); }).then(function (sub) {
      if (sub) {
        p.innerHTML = '✅ <b>Activados en este móvil.</b> Cada vez que alguien reserve o anule en la web te llega un aviso, aunque tengas el panel cerrado.';
        acts.appendChild(btn('Mandar un aviso de prueba', 'prim', function (b) {
          b.disabled = true;
          S.pedir('/ejemplos/reservas-jyc-widy/api/panel', { accion: 'pushProbar' }).then(function (j) {
            aviso(j.enviados ? 'Aviso de prueba enviado a ' + j.enviados + (j.enviados === 1 ? ' móvil.' : ' móviles.') : '⚠️ No hay ningún móvil con avisos activados' + (j.motivo ? ' (' + j.motivo + ')' : '') + '.');
          })
            .catch(function (e) { aviso('⚠️ ' + e.message); }).then(function () { b.disabled = false; });
        }));
        acts.appendChild(btn('Desactivar en este móvil', '', function () {
          sub.unsubscribe().then(function () { return S.pedir('/ejemplos/reservas-jyc-widy/api/panel', { accion: 'pushQuitar', endpoint: sub.endpoint }); })
            .catch(function () {}).then(function () { pintarAvisos(box); });
        }));
      } else {
        p.innerHTML = 'Recibe un aviso en <b>este móvil</b> cada vez que alguien reserve o anule una cita en la web, aunque tengas el panel cerrado.' +
          (esAndroid ? ' Al pulsar, Chrome te preguntará: elige <b>Permitir</b>.' : '') + ' Puedes activarlo en todos los móviles que quieras.';
        acts.appendChild(btn('🔔 Activar avisos en este móvil', 'prim', function (b) {
          b.disabled = true; b.textContent = 'Activando…';
          Notification.requestPermission().then(function (perm) {
            if (perm !== 'granted') throw new Error('Sin permiso no podemos avisarte. Pulsa «Permitir» cuando lo pregunte.');
            return registro();
          }).then(function (reg) {
            return reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: claveB64(S.datos.push) });
          }).then(function (s) {
            return S.pedir('/ejemplos/reservas-jyc-widy/api/panel', { accion: 'push', sub: s.toJSON() });
          }).then(function () {
            return S.pedir('/ejemplos/reservas-jyc-widy/api/panel', { accion: 'pushProbar' });
          }).then(function () {
            aviso('✓ Avisos activados. Te hemos mandado uno de prueba.');
            pintarAvisos(box);
          }).catch(function (e) {
            aviso('⚠️ ' + (e.message || 'No se pudieron activar.'));
            pintarAvisos(box);
          });
        }));
      }
    }).catch(function () { p.textContent = 'No se pudieron comprobar los avisos en este navegador.'; });
  }

  function btn(txt, cls, fn) {
    var b = el('button', 'eb ' + (cls || ''), txt); b.type = 'button';
    b.onclick = function () { fn(b); };
    return b;
  }

  /* ---------------- instalar ---------------- */
  function pintarInstalar(box) {
    box.innerHTML = '<div class="p-h"><b>El panel como una app</b></div>';
    if (instalada) { box.appendChild(el('p', 'aj-p', '✅ Ya lo estás usando como app.')); return; }
    if (esIOS) {
      box.appendChild(el('p', 'aj-p', 'Para tenerlo en la pantalla del iPhone (y recibir avisos):'));
      box.appendChild(el('ol', 'aj-ol', '<li>Abre esta página en <b>Safari</b>.</li><li>Pulsa el botón <b>Compartir</b> (el cuadrado con la flecha).</li>' +
        '<li>Elige <b>«Añadir a pantalla de inicio»</b>.</li><li>Abre el panel desde el icono nuevo y activa los avisos.</li>'));
      return;
    }
    box.appendChild(el('p', 'aj-p', esAndroid
      ? 'Los avisos ya te funcionan sin instalar nada. Si además lo pones en la pantalla de inicio, abres tu agenda de un toque, como una app.'
      : 'Ponlo en la pantalla de inicio para abrir tu agenda con un toque.'));
    var acts = el('div', 'aj-acts'); box.appendChild(acts);
    acts.appendChild(btn('Ponerlo en mi pantalla de inicio', 'prim', function () {
      if (promptInstalar) { promptInstalar.prompt(); promptInstalar = null; }
      else aviso('Abre el menú del navegador (los tres puntos ⋮) y elige «Instalar aplicación» o «Añadir a pantalla de inicio».');
    }));
  }

  /* ---------------- contraseña ---------------- */
  function pintarClave(box) {
    box.innerHTML = '<div class="p-h"><b>Cambiar la contraseña</b></div>';
    var f = el('div', 'aj-form');
    f.innerHTML = '<input type="password" id="ajAct" placeholder="Contraseña actual" autocomplete="current-password">' +
      '<input type="password" id="ajNue" placeholder="Nueva (mínimo 8 caracteres)" autocomplete="new-password">' +
      '<input type="password" id="ajRep" placeholder="Repite la nueva" autocomplete="new-password">';
    box.appendChild(f);
    var acts = el('div', 'aj-acts'); box.appendChild(acts);
    acts.appendChild(btn('Guardar contraseña', 'prim', function (b) {
      var a = $('#ajAct').value, n = $('#ajNue').value, r = $('#ajRep').value;
      if (n.length < 8) return aviso('La nueva contraseña necesita al menos 8 caracteres.');
      if (n !== r) return aviso('Las dos contraseñas nuevas no coinciden.');
      b.disabled = true;
      S.pedir('/ejemplos/reservas-jyc-widy/api/panel', { accion: 'clave', actual: a, nueva: n }).then(function () {
        aviso('✓ Contraseña cambiada. Los demás móviles tendrán que volver a entrar.');
        pintarClave(box);
      }).catch(function (e) { aviso('⚠️ ' + e.message); b.disabled = false; });
    }));
  }

  /* ---------------- enlaces ---------------- */
  function pintarEnlaces(box) {
    var url = location.origin;
    box.innerHTML = '<div class="p-h"><b>Tus enlaces</b></div>' +
      '<div class="aj-link"><span>Web</span><a href="/ejemplos/reservas-jyc-widy/" target="_blank" rel="noopener">' + url.replace(/^https?:\/\//, '') + '</a></div>' +
      '<div class="aj-link"><span>Reservar</span><a href="/ejemplos/reservas-jyc-widy/reservar" target="_blank" rel="noopener">' + url.replace(/^https?:\/\//, '') + '/reservar</a></div>';
    var acts = el('div', 'aj-acts'); box.appendChild(acts);
    acts.appendChild(btn('Copiar enlace para reservar', '', function () {
      var t = url + '/ejemplos/reservas-jyc-widy/reservar';
      (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(function () { aviso('✓ Copiado. Pégalo en tu Instagram, WhatsApp o Google.'); })
        .catch(function () { prompt('Copia este enlace:', t); });
    }));
    var kit = el('a', 'eb', '📣 Carteles con QR'); kit.href = '/ejemplos/reservas-jyc-widy/kit'; kit.target = '_blank';
    acts.appendChild(kit);
  }

  function abrir() {
    var box = $('#ajustes'); if (!box) return;
    box.innerHTML = '';
    var a = el('div', 'p-card'); box.appendChild(a); pintarAvisos(a);
    var i = el('div', 'p-card'); box.appendChild(i); pintarInstalar(i);
    var e = el('div', 'p-card'); box.appendChild(e); pintarEnlaces(e);
    var c = el('div', 'p-card'); box.appendChild(c); pintarClave(c);
    var s = el('div', 'p-card aj-salir');
    s.appendChild(btn('Cerrar sesión en este móvil', 'no', function () {
      S.pedir('/ejemplos/reservas-jyc-widy/api/panel', { accion: 'salir' }).catch(function () {}).then(function () { location.reload(); });
    }));
    box.appendChild(s);
  }

  window.Ajustes = { abrir: abrir };
})();
