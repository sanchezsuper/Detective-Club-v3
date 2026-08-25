/* Дошка розслідування — нитки, лайтбокс і жива стіна коментарів.
   Коментарі живуть у Firebase RTDB: /rooms/case003/wall.
   Без конфігу в js/firebase-config.js сторінка працює як звичайний колаж. */

'use strict';

const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];

/* ---------- Червоні нитки ---------- */
const svg = $('#threads');
const board = $('#board');

function drawThreads() {
  if (!svg || !board) return;
  const nodes = $$('.node').sort((a, b) => +a.dataset.step - +b.dataset.step);
  const br = board.getBoundingClientRect();
  svg.setAttribute('viewBox', `0 0 ${br.width} ${br.height}`);
  svg.innerHTML = '';

  const pinPos = (n) => {
    const p = n.querySelector('.pin').getBoundingClientRect();
    return { x: p.left - br.left + p.width / 2, y: p.top - br.top + p.height / 2 };
  };

  // головка шпильки малюється в тому ж SVG — щоб нитка йшла під нею
  const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
  defs.innerHTML = '<radialGradient id="pinG" cx="34%" cy="30%">' +
    '<stop offset="0%" stop-color="#ff9083"/><stop offset="62%" stop-color="#b3241c"/>' +
    '<stop offset="100%" stop-color="#6f120d"/></radialGradient>';
  svg.appendChild(defs);

  for (let i = 0; i < nodes.length - 1; i++) {
    const a = pinPos(nodes[i]);
    const b = pinPos(nodes[i + 1]);
    const dist = Math.hypot(b.x - a.x, b.y - a.y);
    // провисання нитки під власною вагою
    const sag = Math.min(60, 14 + dist * 0.07);
    let mx = (a.x + b.x) / 2;
    let my = (a.y + b.y) / 2 + sag;
    // майже вертикальна нитка (мобільна стрічка): вертикальний sag непомітний,
    // тому відводимо середину вбік — виходить жива провисла петля
    if (Math.abs(b.x - a.x) < 40) {
      mx += (i % 2 ? 40 : 26);
      my = (a.y + b.y) / 2;
    }
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', `M ${a.x} ${a.y} Q ${mx} ${my} ${b.x} ${b.y}`);
    path.dataset.from = nodes[i].dataset.step;
    path.dataset.to = nodes[i + 1].dataset.step;
    svg.appendChild(path);
  }

  nodes.forEach((n) => {
    const c = pinPos(n);
    const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    dot.setAttribute('cx', c.x); dot.setAttribute('cy', c.y); dot.setAttribute('r', 9.5);
    dot.setAttribute('fill', 'url(#pinG)');
    dot.setAttribute('stroke', 'rgba(0,0,0,.35)'); dot.setAttribute('stroke-width', '.8');
    svg.appendChild(dot);
  });
}

function highlight(step, on) {
  $$('#threads path').forEach((p) => {
    if (p.dataset.from === step || p.dataset.to === step) p.classList.toggle('hl', on);
  });
}

$$('.node').forEach((n) => {
  n.addEventListener('mouseenter', () => highlight(n.dataset.step, true));
  n.addEventListener('mouseleave', () => highlight(n.dataset.step, false));
});

const threadsBtn = $('#threadsBtn');
threadsBtn && threadsBtn.addEventListener('click', () => {
  const off = document.body.classList.toggle('no-threads');
  threadsBtn.textContent = off ? 'Нитки: вимкнено' : 'Нитки: увімкнено';
});

let redrawTimer = null;
const scheduleRedraw = () => { clearTimeout(redrawTimer); redrawTimer = setTimeout(drawThreads, 120); };
window.addEventListener('resize', scheduleRedraw);
window.addEventListener('load', drawThreads);
document.addEventListener('DOMContentLoaded', drawThreads);
// картинки вантажаться ліниво і зсувають розкладку — перемальовуємо
$$('.shot').forEach((img) => img.addEventListener('load', scheduleRedraw));
if (window.ResizeObserver && board) new ResizeObserver(scheduleRedraw).observe(board);

/* ---------- Лайтбокс ---------- */
const lb = $('#lb'), lbImg = $('#lbImg'), lbCap = $('#lbCap');
$$('.shot').forEach((img) => {
  img.addEventListener('click', () => {
    lbImg.src = img.src;
    lbImg.alt = img.alt || '';
    lbCap.textContent = img.dataset.cap || '';
    lb.classList.add('on');
  });
});
const closeLb = () => { lb.classList.remove('on'); lbImg.src = ''; };
lb && lb.addEventListener('click', (e) => { if (e.target === lb || e.target.id === 'lbX') closeLb(); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeLb(); });

/* ---------- Стіна коментарів (лише якщо секція є на сторінці) ---------- */
if (document.querySelector('#wallForm')) {
  const STICKERS = ['🕵️', '🔥', '😂', '💀', '🏆', '🔦', '🧠', '🐕', '🍀', '💣'];
  let picked = STICKERS[0];

  const stickersBox = $('#stickers');
  function renderStickers() {
    stickersBox.innerHTML = '';
    STICKERS.forEach((s) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = s;
      if (s === picked) b.classList.add('sel');
      b.addEventListener('click', () => { picked = s; renderStickers(); });
      stickersBox.appendChild(b);
    });
  }
  renderStickers();

  // запам'ятовуємо ім'я між візитами
  const savedName = localStorage.getItem('dc3-wall-name');
  if (savedName) $('#wName').value = savedName;

  const NOTE_COLORS = ['#fdf3a8', '#ffd9b0', '#c9f0c0', '#ffcfd6', '#cfe4ff', '#ecd9ff'];
  const TILTS = [-2.4, -1.2, 1.5, 2.6, -1.8, .9];
  const hashOf = (s) => [...s].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);

  const wall = { on: false, ref: null, isHost: false, items: {} };

  function renderNotes() {
    const box = $('#notes');
    const entries = Object.entries(wall.items).sort((a, b) => (b[1].ts || 0) - (a[1].ts || 0));
    box.innerHTML = '';
    $('#wallEmpty').hidden = entries.length > 0 || !wall.on;
    entries.forEach(([id, n]) => {
      const h = hashOf(id);
      const el = document.createElement('div');
      el.className = 'note';
      el.style.background = NOTE_COLORS[h % NOTE_COLORS.length];
      el.style.transform = `rotate(${TILTS[h % TILTS.length]}deg)`;

      const pin = document.createElement('span');
      pin.className = 'pin';
      const st = document.createElement('span');
      st.className = 'sticker';
      st.textContent = n.sticker || '📌';
      const txt = document.createElement('p');
      txt.className = 'txt';
      txt.textContent = n.text || '';           // тільки текст — жодного HTML із бази
      const who = document.createElement('p');
      who.className = 'who';
      who.textContent = '— ' + (n.name || 'невідомий детектив');

      el.append(pin, st, txt, who);

      if (wall.isHost) {
        const kill = document.createElement('button');
        kill.className = 'kill';
        kill.type = 'button';
        kill.textContent = '✕';
        kill.title = 'Видалити записку';
        kill.addEventListener('click', () => {
          if (confirm('Видалити цю записку?')) wall.ref.child(id).remove();
        });
        el.appendChild(kill);
      }
      box.appendChild(el);
    });
    scheduleRedraw();
  }

  function wallInit() {
    if (typeof firebase === 'undefined' || !window.FIREBASE_CONFIG) {
      $('#wallMsg').textContent = "Коментарі тимчасово недоступні — немає зв'язку з базою.";
      $('#wallMsg').hidden = false;
      return;
    }
    try {
      firebase.initializeApp(window.FIREBASE_CONFIG);
      wall.ref = firebase.database().ref('rooms/case003/wall');
    } catch (err) {
      console.warn('Firebase недоступний:', err);
      return;
    }
    wall.on = true;
    wall.ref.on('value', (sn) => { wall.items = sn.val() || {}; renderNotes(); });
  }

  /* Режим ведучого: ?host=<ключ> — ключ звіряється з SHA-256, як у грі */
  const HOST_HASH = '01d85a117ed108b491612374331112b338b6be3a978261f0a01fd9de57cbb6be';
  async function initHost() {
    const key = new URLSearchParams(location.search).get('host');
    if (!key || !crypto.subtle) return;
    const norm = key.trim().toLowerCase();
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(norm));
    const hex = [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
    if (hex !== HOST_HASH) return;
    wall.isHost = true;
    renderNotes();
  }

  $('#wallForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const msg = $('#wallMsg');
    msg.hidden = true;
    const name = $('#wName').value.trim().slice(0, 24);
    const text = $('#wText').value.trim().slice(0, 200);
    if (!name || !text) return;
    if (!wall.on) {
      msg.textContent = "Немає зв'язку з базою — записка не збережеться.";
      msg.hidden = false;
      return;
    }
    const last = +(localStorage.getItem('dc3-wall-last') || 0);
    if (Date.now() - last < 10000) {
      msg.textContent = 'Зачекайте кілька секунд перед наступною запискою.';
      msg.hidden = false;
      return;
    }
    wall.ref.push({ name, text, sticker: picked, ts: firebase.database.ServerValue.TIMESTAMP });
    localStorage.setItem('dc3-wall-name', name);
    localStorage.setItem('dc3-wall-last', String(Date.now()));
    $('#wText').value = '';
    msg.style.color = '#2f6b2a';
    msg.textContent = 'Готово — вашу записку приколото до дошки.';
    msg.hidden = false;
    setTimeout(() => { msg.hidden = true; msg.style.color = ''; }, 4000);
  });

  wallInit();
  initHost();

}
