/* Детективний клуб · справа № 003 — логіка прототипу.
   Стан гри — у localStorage (один пристрій). Мультиплеєрна
   синхронізація лобі/таймера — наступний етап (потрібен бекенд). */

'use strict';

const GAME_HOURS = 3;

/* Відповіді зберігаються як SHA-256-хеші — у відкритому коді сайту
   їх не підглянути (важливо для публічного хостингу, напр. GitHub Pages).
   Згенерувати новий хеш: node -e "console.log(require('crypto').createHash('sha256').update('відповідь').digest('hex'))" */
const HASHES = {
  admission: ['998795fd01c3cda2449704a593afd7223ceadb0529291c5d349cc0fe875161cc', 'b5bafb841c38abead8f92342d362352a4270c7b475a990366f25d0830b304277'],
  login: ['bf0d358aeed8f1720d028b9b9533530b33eac1ac25a93c37c1b3a8fa4c6d5921', 'e58c835dddd245b7b3e5aad030fb65528ee1473994623f1de4dfc67fb123bac4', '9d117f3cd34688120987aae10d416ba208aa5fa22aefee92556198b1ac57518a'],
  password: ['8eec27653c19ed078b2f3bae16ff901d16347d7917d2b8e2317914e2437bf324'],
  finalCode: ['6dd6d77794056ba92bc53c43a5dd1b0149d7e88e4273e880d693baec4ff45860', 'bb6bdb0c73ceb13ee7074dcdd2af0d3c652b3a657bc8d343fbf336064c8f29ba', '26eb51352cab37e6c6ca1c476a4ea172d20814d6a1a89097dbfaace21695abdf'],
  hostKey: ['01d85a117ed108b491612374331112b338b6be3a978261f0a01fd9de57cbb6be'],
};

async function sha256hex(s) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}
async function matches(value, group) {
  return HASHES[group].includes(await sha256hex(norm(value)));
}
/* Лише одиночні емодзі (без ZWJ-послідовностей) — інакше Windows
   малює їх двома гліфами і виходить «нашарування». */
const AVATARS = [
  '🕵️', '🦊', '🦉', '🐺', '🦅', '🐈', '🗝️', '♠️',
  '👽', '🐐', '😈', '👹', '💀', '👻', '🐢', '🦖',
  '🐙', '🦇', '🐸', '🧙', '🥷', '🤖', '🎃', '🦄',
];

/* Розсекречена частина досьє зашифрована AES-GCM ключем із PIN:
   без правильного PIN тексту фізично немає на сторінці. */
const SECRET = {
  salt: 'pRXrf7KPgTd/Ytbsb5T2ng==',
  iv: 'cYSIcScTf1noAYrH',
  data: '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',
};

const $ = (sel) => document.querySelector(sel);
const norm = (s) => s.trim().toLowerCase().replace(/[.!?\s]+$/g, '');

/* ---------- Стан ---------- */
const load = () => JSON.parse(localStorage.getItem('dc3') || '{}');
const save = (patch) => {
  const s = { ...load(), ...patch };
  localStorage.setItem('dc3', JSON.stringify(s));
  return s;
};
/* Режим ведучого вмикається лише правильним ключем: ?host=<ключ> */
let isHost = false;
const hostParam = new URLSearchParams(location.search).get('host');

/* ---------- Роутер ---------- */
const SCREENS = ['landing', 'register', 'task', 'cabinet', 'terminal', 'dossier', 'phone', 'denied', 'solved'];

function route() {
  const hash = location.hash || '#/';
  let name = hash.replace('#/', '') || 'landing';
  if (!SCREENS.includes(name)) name = 'landing';

  // Охорона маршрутів (ведучий ходить вільно)
  const s = load();
  if (!isHost) {
    if (['task'].includes(name) && !s.name) name = 'register';
    if (['cabinet'].includes(name) && !s.admitted) name = s.name ? 'task' : 'landing';
    if (['terminal'].includes(name) && !s.startedAt) name = 'cabinet';
    if (['dossier'].includes(name) && !s.gateOpen) name = s.startedAt ? 'terminal' : 'cabinet';
    if (name === 'cabinet' && !s.admitted) name = 'landing';
  }

  SCREENS.forEach((id) => { $('#screen-' + id).hidden = (id !== name); });
  document.body.dataset.screen = name;
  window.scrollTo(0, 0);

  if (name === 'cabinet') renderCabinet();
  if (name === 'terminal') bootTerminal();
  if (name === 'dossier') renderDossier();
}
window.addEventListener('hashchange', route);

/* Кнопки-переходи */
document.addEventListener('click', (e) => {
  const go = e.target.closest('[data-go]');
  if (go) location.hash = go.dataset.go;
});

/* ---------- Реєстрація ---------- */
let pickedAvatar = AVATARS[0];
function renderAvatars() {
  const grid = $('#avatarGrid');
  grid.innerHTML = '';
  AVATARS.forEach((a) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = a;
    if (a === pickedAvatar) b.classList.add('sel');
    b.addEventListener('click', () => {
      pickedAvatar = a;
      renderAvatars();
    });
    grid.appendChild(b);
  });
}
$('#regForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const name = $('#regName').value.trim();
  if (!name) return;
  save({ name, avatar: pickedAvatar });
  location.hash = '#/task';
});

/* ---------- Завдання-допуск ---------- */
$('#taskForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  if (await matches($('#taskAnswer').value, 'admission')) {
    save({ admitted: true });
    $('#taskForm').hidden = true;
    $('#taskFail').hidden = true;
    $('#taskGranted').hidden = false;
  } else {
    $('#taskFail').hidden = false;
  }
});

/* ---------- Кабінет ---------- */
let clockTimer = null;

function renderCabinet() {
  const s = load();
  $('#cabName').textContent = s.name || 'Детектив';
  $('#cabAvatar').textContent = s.avatar || AVATARS[0];

  const lobby = $('#lobbyList');
  lobby.innerHTML = '';
  const li = document.createElement('li');
  li.innerHTML = `<span>${s.avatar || ''} ${s.name || 'Детектив'}</span><span class="st ok">допуск отримано</span>`;
  lobby.appendChild(li);

  updateClock();
  if (clockTimer) clearInterval(clockTimer);
  clockTimer = setInterval(updateClock, 1000);
}

function updateClock() {
  const s = load();
  const started = !!s.startedAt;
  $('#waitBlock').hidden = started;
  $('#runBlock').hidden = !started;
  $('#secretLock').hidden = !started;
  if (!started) return;

  const end = s.startedAt + GAME_HOURS * 3600 * 1000;
  let left = end - Date.now();
  const overtime = left < 0;
  if (overtime) left = -left;
  const hh = String(Math.floor(left / 3600000)).padStart(2, '0');
  const mm = String(Math.floor((left % 3600000) / 60000)).padStart(2, '0');
  const ss = String(Math.floor((left % 60000) / 1000)).padStart(2, '0');
  const clock = $('#clock');
  clock.textContent = (overtime ? '+' : '') + `${hh}:${mm}:${ss}`;
  clock.classList.toggle('overtime', overtime);
  $('#clockNote').textContent = overtime
    ? 'Час вийшов. Операція триває, але рейтинг агентства падає.'
    : 'До кінця операції. Після нуля гра триває — падає рейтинг агентства.';
}

$('#secretLock').addEventListener('click', () => { location.hash = '#/terminal'; });

/* ---------- Термінал ---------- */
const BOOT_LINES = [
  'SLUZHBA-X SECURE GATEWAY v2.4',
  'З’ЄДНАННЯ ШИФРОВАНЕ. СЕСІЮ ЗАПИСАНО.',
  'НЕСАНКЦІОНОВАНИЙ ДОСТУП ПЕРЕСЛІДУЄТЬСЯ.',
  '',
  'ВВЕДІТЬ ОБЛІКОВІ ДАНІ:',
];
let termBooted = false;

function typeLines(el, lines, done) {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) {
    el.textContent = lines.join('\n');
    done && done();
    return;
  }
  el.textContent = '';
  let li = 0, ci = 0;
  (function tick() {
    if (li >= lines.length) { done && done(); return; }
    const line = lines[li];
    if (ci <= line.length) {
      const doneLines = lines.slice(0, li).join('\n');
      el.textContent = (doneLines ? doneLines + '\n' : '') + line.slice(0, ci) + '▊';
      ci++;
      setTimeout(tick, 18);
    } else {
      li++; ci = 0;
      setTimeout(tick, 140);
    }
  })();
}

function bootTerminal() {
  if (termBooted) return;
  termBooted = true;
  typeLines($('#termLog'), BOOT_LINES, () => {
    $('#termLog').textContent = BOOT_LINES.join('\n');
    $('#termForm').hidden = false;
    $('#termLogin').focus();
  });
}

$('#termForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const log = $('#termLog');
  const ok = (await matches($('#termLogin').value, 'login')) && (await matches($('#termPass').value, 'password'));
  if (ok) {
    save({ gateOpen: true });
    $('#termForm').hidden = true;
    typeLines(log, [...BOOT_LINES, '', '> ДОСТУП НАДАНО.', '> ВІДКРИВАЮ СПРАВУ № 003…'], () => {
      setTimeout(() => { location.hash = '#/dossier'; }, 700);
    });
  } else {
    log.textContent = BOOT_LINES.join('\n') + '\n\n> ДОСТУП ВІДХИЛЕНО. СПРОБУ ЗАФІКСОВАНО.';
  }
});

$('#infoBtn').addEventListener('click', () => { $('#helpDlg').hidden = false; });
$('#helpClose').addEventListener('click', () => { $('#helpDlg').hidden = true; });

/* ---------- Досьє та розсекречення ---------- */
const b64buf = (b64) => Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));

async function decryptSecret(pin) {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey('raw', enc.encode(pin), 'PBKDF2', false, ['deriveKey']);
  const key = await crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: b64buf(SECRET.salt), iterations: 100000, hash: 'SHA-256' },
    keyMaterial, { name: 'AES-GCM', length: 256 }, false, ['decrypt'],
  );
  const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: b64buf(SECRET.iv) }, key, b64buf(SECRET.data));
  return new TextDecoder().decode(plain);
}

async function tryDeclassify(pin) {
  if (!crypto.subtle) {
    $('#pinFail').textContent = 'Браузеру потрібен захищений контекст: відкрийте сайт через http://localhost або https.';
    $('#pinFail').hidden = false;
    return;
  }
  try {
    const html = await decryptSecret(pin);
    save({ pin });
    $('#secretMount').innerHTML = html;
    $('#pinPanel').hidden = true;
    document.querySelectorAll('#dossierBody .blk').forEach((el) => { el.style.opacity = '.25'; });
  } catch {
    $('#pinFail').hidden = false;
  }
}

function renderDossier() {
  const s = load();
  if (s.pin) tryDeclassify(s.pin); // уже розсекречено раніше
}

$('#pinBtn').addEventListener('click', () => {
  $('#pinFail').hidden = true;
  tryDeclassify($('#pinInput').value.trim());
});

/* ---------- Фінал ---------- */
$('#finForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  if (await matches($('#finInput').value, 'finalCode')) {
    save({ solvedAt: Date.now() });
    $('#solvedForm').hidden = true;
    $('#solvedDone').hidden = false;
    const s = load();
    const overtime = s.startedAt && (s.solvedAt - s.startedAt) > GAME_HOURS * 3600 * 1000;
    $('#ratingLine').textContent = overtime ? '★★★★☆ (понаднормово)' : '★★★★★';
    // Твіст 2: бігучий рядок «випадково» виповзає за кілька секунд
    setTimeout(() => { $('#newsTicker').hidden = false; }, 4000);
  } else {
    $('#finFail').hidden = false;
  }
});

/* ---------- Панель ведучого ---------- */
async function initHost() {
  if (!hostParam || !crypto.subtle) return;
  if (!(await matches(hostParam, 'hostKey'))) return;
  isHost = true;
  $('#hostbar').hidden = false;
  $('#hostStart').addEventListener('click', () => {
    save({ startedAt: Date.now() });
    updateClock();
  });
  $('#hostReset').addEventListener('click', () => {
    localStorage.removeItem('dc3');
    location.hash = '#/';
    location.reload();
  });
  route(); // перерахувати охорону маршрутів уже як ведучий
}

/* ---------- Старт ---------- */
renderAvatars();
route();
initHost();
