'use strict';

/* ===================== Estado ===================== */
const state = {
  month: new Date(),       // mes mostrado en el calendario
  selectedDate: null,      // 'YYYY-MM-DD'
  selectedTime: null,      // 'HH:MM'
  dias: null,              // { 'YYYY-MM-DD': ['10:00', ...] } huecos libres de /api/agenda
};

// Los huecos salen de la agenda de Widy (la misma que /agenda): lead + reunión + aviso al móvil
async function cargarAgenda() {
  const res = await fetch('https://widy-api.widyagency-info.workers.dev/api/agenda', { cache: 'no-store' });
  const data = await res.json();
  if (!res.ok || !data.ok) throw new Error('agenda');
  state.dias = {};
  data.dias.forEach((d) => { state.dias[d.fecha] = d.horas; });
}

const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const DIAS = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];

/* ===================== Utilidades ===================== */
const $ = (sel) => document.querySelector(sel);
const pad = (n) => String(n).padStart(2, '0');
const toKey = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

function fechaLarga(key) {
  const d = new Date(`${key}T00:00:00`);
  return `${DIAS[d.getDay()]} ${d.getDate()} de ${MESES[d.getMonth()]}`;
}

/* ===================== Video (YouTube) ===================== */
const unmutePill = $('#unmutePill');
const videoGuard = $('.video-guard');
const ytFrame = $('#ytFrame');
let ytPlayer = null;

// Estados de YT: 1=reproduciendo, 3=cargando (OK). Cualquier otro -> reanudar.
function ytIsPlaying(s) {
  return s === 1 || s === 3;
}

// La API se engancha al iframe que YA esta autoreproduciendose (no lo recrea),
// asi mantenemos el autoplay instantaneo del embed directo.
window.onYouTubeIframeAPIReady = function () {
  ytPlayer = new YT.Player('ytFrame', {
    events: {
      onReady: (e) => e.target.playVideo(),
      onStateChange: (e) => {
        if (!ytIsPlaying(e.data)) {
          if (e.data === 0) e.target.seekTo(0); // terminado -> reinicia (bucle)
          e.target.playVideo(); // detenido/miniatura -> vuelve a reproducir
        }
      },
    },
  });
};

// Carga la API de YouTube (solo para vigilar que el video no se detenga)
if (ytFrame) {
  const tag = document.createElement('script');
  tag.src = 'https://www.youtube.com/iframe_api';
  document.head.appendChild(tag);
}

// Red de seguridad: cada segundo comprueba que sigue en marcha
setInterval(() => {
  if (ytPlayer && typeof ytPlayer.getPlayerState === 'function') {
    try {
      if (!ytIsPlaying(ytPlayer.getPlayerState())) ytPlayer.playVideo();
    } catch (_) { /* aun no listo */ }
  }
}, 1000);

// Reproduce y activa el sonido (nunca pausa)
function startAndUnmute() {
  if (ytPlayer && typeof ytPlayer.unMute === 'function') {
    ytPlayer.unMute();
    ytPlayer.setVolume(100);
    ytPlayer.playVideo();
  }
  if (unmutePill) unmutePill.classList.add('is-hidden');
}

// La capa sobre el video: al hacer clic SOLO reproduce (no deja pausar)
if (videoGuard) videoGuard.addEventListener('click', startAndUnmute);
if (unmutePill) unmutePill.addEventListener('click', startAndUnmute);

// Activa el sonido al primer gesto real del visitante
const soundEvents = ['pointerdown', 'touchstart', 'keydown'];
function enableSound() {
  startAndUnmute();
  soundEvents.forEach((ev) => document.removeEventListener(ev, enableSound));
}
soundEvents.forEach((ev) =>
  document.addEventListener(ev, enableSound, { passive: true }));

/* ===================== Navegacion de pasos ===================== */
function goToStep(step) {
  document.querySelectorAll('.panel').forEach((p) => {
    p.classList.toggle('is-active', p.dataset.panel === String(step));
  });
  document.querySelectorAll('.step').forEach((s) => {
    const n = Number(s.dataset.step);
    s.classList.toggle('is-active', n === Number(step));
    s.classList.toggle('is-done', !Number.isNaN(Number(step)) && n < Number(step));
  });
}

document.querySelectorAll('[data-goto]').forEach((btn) => {
  btn.addEventListener('click', () => goToStep(btn.dataset.goto));
});

/* ===================== Calendario ===================== */
const calGrid = $('#calGrid');
const calTitle = $('#calTitle');

function renderCalendar() {
  const year = state.month.getFullYear();
  const month = state.month.getMonth();
  calTitle.textContent = `${MESES[month]} ${year}`;

  const today = startOfDay(new Date());

  // Desactiva la flecha de mes anterior si ya estamos en el mes actual
  const firstOfMonth = new Date(year, month, 1);
  $('#prevMonth').disabled =
    firstOfMonth <= new Date(today.getFullYear(), today.getMonth(), 1);

  calGrid.innerHTML = '';

  // Offset para que la semana empiece en lunes (getDay: 0=Dom)
  let offset = firstOfMonth.getDay() - 1;
  if (offset < 0) offset = 6;
  for (let i = 0; i < offset; i++) {
    const cell = document.createElement('div');
    cell.className = 'cal-day empty';
    calGrid.appendChild(cell);
  }

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    const key = toKey(date);
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'cal-day';
    btn.textContent = day;

    const libre = !!(state.dias && state.dias[key] && state.dias[key].length);

    if (date.getTime() === today.getTime()) btn.classList.add('today');

    if (libre) {
      btn.classList.add('available');
      if (key === state.selectedDate) btn.classList.add('selected');
      btn.addEventListener('click', () => selectDate(key));
    } else {
      btn.classList.add('disabled');
      btn.disabled = true;
    }
    calGrid.appendChild(btn);
  }
}

$('#prevMonth').addEventListener('click', () => {
  state.month = new Date(state.month.getFullYear(), state.month.getMonth() - 1, 1);
  renderCalendar();
});
$('#nextMonth').addEventListener('click', () => {
  state.month = new Date(state.month.getFullYear(), state.month.getMonth() + 1, 1);
  renderCalendar();
});

/* ===================== Seleccion de fecha ===================== */
async function selectDate(key) {
  state.selectedDate = key;
  state.selectedTime = null;
  renderCalendar();
  $('#slotsDate').textContent = fechaLarga(key);
  goToStep(2);
  await loadSlots(key);
}

/* ===================== Huecos ===================== */
const slotsEl = $('#slots');

async function loadSlots(key) {
  slotsEl.innerHTML = '<div class="slots-loading">Buscando huecos disponibles...</div>';
  try {
    await cargarAgenda();
    renderSlots((state.dias[key] || []).map((time) => ({ time, status: 'available' })));
  } catch {
    slotsEl.innerHTML = '<div class="slots-empty">No se han podido cargar los huecos. Reintenta.</div>';
  }
}

function renderSlots(slots) {
  slotsEl.innerHTML = '';

  if (!slots.length) {
    slotsEl.innerHTML =
      '<div class="slots-empty">No hay huecos este dia.<br>Prueba con otra fecha.</div>';
    return;
  }

  const libres = slots.filter((s) => s.status === 'available').length;
  if (libres === 0) {
    slotsEl.innerHTML =
      '<div class="slots-empty">Todo reservado este dia.<br>Prueba con otra fecha.</div>';
    return;
  }

  slots.forEach((slot) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = slot.time;

    if (slot.status === 'taken') {
      btn.className = 'slot taken';
      btn.disabled = true;
      btn.title = 'Hueco ya reservado';
      slotsEl.appendChild(btn);
      return;
    }

    btn.className = 'slot';
    btn.addEventListener('click', () => {
      state.selectedTime = slot.time;
      document.querySelectorAll('.slot').forEach((s) => s.classList.remove('selected'));
      btn.classList.add('selected');
      goToStep(3);
      renderSummary();
    });
    slotsEl.appendChild(btn);
  });
}

/* ===================== Resumen ===================== */
function renderSummary() {
  $('#summary').innerHTML = `
    <svg viewBox="0 0 24 24" width="22" height="22">
      <path d="M7 2v3M17 2v3M3.5 8.5h17M5 5h14a1.5 1.5 0 0 1 1.5 1.5V20A1.5 1.5 0 0 1 19 21.5H5A1.5 1.5 0 0 1 3.5 20V6.5A1.5 1.5 0 0 1 5 5Z"
        fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
    </svg>
    <span>Llamada de 30 min ·
      <span class="summary-when">${fechaLarga(state.selectedDate)} a las ${state.selectedTime}</span>
    </span>`;
}

/* ===================== Envio del formulario ===================== */
const form = $('#bookingForm');
const submitBtn = $('#submitBtn');
const formError = $('#formError');

function showError(msg) {
  formError.textContent = msg;
  formError.hidden = false;
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  formError.hidden = true;

  const name = $('#name');
  const email = $('#email');
  const phone = $('#phone');
  let valid = true;

  [name, email, phone].forEach((el) => {
    const v = el.value.trim();
    const ok = el.type === 'tel' ? v.replace(/\D/g, '').length >= 9
      : v.length > 1 && (el.type !== 'email' || /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v));
    el.classList.toggle('invalid', !ok);
    if (!ok) valid = false;
  });

  if (!valid) return showError('Revisa tu nombre, tu email y tu teléfono.');
  if (!state.selectedDate || !state.selectedTime) {
    return showError('Selecciona primero una fecha y una hora.');
  }

  const payload = {
    accion: 'reservar',
    s: 'tienda',
    nombre: name.value.trim(),
    email: email.value.trim(),
    telefono: phone.value.trim(),
    empresa: $('#company').value.trim(),
    notas: $('#notes').value.trim(),
    fecha: state.selectedDate,
    hora: state.selectedTime,
    acepto: true,
  };

  submitBtn.disabled = true;
  submitBtn.querySelector('.btn-text').textContent = 'Confirmando...';
  submitBtn.querySelector('.btn-spinner').hidden = false;

  try {
    const res = await fetch('https://widy-api.widyagency-info.workers.dev/api/agenda', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();

    if (!res.ok || !data.ok) {
      throw new Error(data.error || 'No se ha podido confirmar la llamada.');
    }

    $('#successDetail').textContent = data.cuando || `${fechaLarga(state.selectedDate)} a las ${state.selectedTime}`;
    goToStep('success');
  } catch (err) {
    showError(err.message);
    if (/ocupa|disponible/i.test(err.message)) {
      // El hueco se ocupo: refresca la lista
      await loadSlots(state.selectedDate);
      goToStep(2);
    }
  } finally {
    submitBtn.disabled = false;
    submitBtn.querySelector('.btn-text').textContent = 'Confirmar mi llamada';
    submitBtn.querySelector('.btn-spinner').hidden = true;
  }
});

/* ===================== Reservar otra ===================== */
$('#bookAnother').addEventListener('click', () => {
  state.selectedDate = null;
  state.selectedTime = null;
  form.reset();
  renderCalendar();
  goToStep(1);
  document.getElementById('agendar').scrollIntoView({ behavior: 'smooth' });
});

/* ===================== Inicializacion ===================== */
$('#year').textContent = new Date().getFullYear();

(async function init() {
  renderCalendar(); // se pinta ya (sin huecos) y se rellena al llegar la agenda
  try {
    await cargarAgenda();
  } catch {
    $('#slots').innerHTML = '';
    calGrid.insertAdjacentHTML('afterend', '<p class="slots-empty">No se ha podido cargar la agenda. Escríbenos al WhatsApp <a href="https://wa.me/34624869847">624 86 98 47</a>.</p>');
  }
  renderCalendar();
})();
