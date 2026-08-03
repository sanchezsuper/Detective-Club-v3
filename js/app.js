/* Детективний клуб · справа № 003 — логіка прототипу.
   Стан гри — у localStorage (один пристрій). Мультиплеєрна
   синхронізація лобі/таймера — наступний етап (потрібен бекенд). */

'use strict';

/* Відповіді зберігаються як SHA-256-хеші — у відкритому коді сайту
   їх не підглянути (важливо для публічного хостингу, напр. GitHub Pages).
   Згенерувати новий хеш: node -e "console.log(require('crypto').createHash('sha256').update('відповідь').digest('hex'))" */
const HASHES = {
  admission: ['998795fd01c3cda2449704a593afd7223ceadb0529291c5d349cc0fe875161cc', 'b5bafb841c38abead8f92342d362352a4270c7b475a990366f25d0830b304277'],
  login: ['bf0d358aeed8f1720d028b9b9533530b33eac1ac25a93c37c1b3a8fa4c6d5921', 'e58c835dddd245b7b3e5aad030fb65528ee1473994623f1de4dfc67fb123bac4', '9d117f3cd34688120987aae10d416ba208aa5fa22aefee92556198b1ac57518a'],
  password: ['8eec27653c19ed078b2f3bae16ff901d16347d7917d2b8e2317914e2437bf324'],
  finalCode: ['6dd6d77794056ba92bc53c43a5dd1b0149d7e88e4273e880d693baec4ff45860', 'bb6bdb0c73ceb13ee7074dcdd2af0d3c652b3a657bc8d343fbf336064c8f29ba', '26eb51352cab37e6c6ca1c476a4ea172d20814d6a1a89097dbfaace21695abdf'],
  phoneCode: ['00f6112fe58387958ef80793a34746429f40c97fe7b51d6a576705acbf8fc6af'],
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
  '🐙', '🦇', '🐸', '🧙', '🧛', '🤖', '🎃', '🦄',
];

/* Розсекречена частина досьє зашифрована AES-GCM ключем із PIN:
   без правильного PIN тексту фізично немає на сторінці. */
const SECRET = {
  salt: 'dOGc5Y3nA32o9G3GOCEvpQ==',
  iv: 'u8LBcNi9C+5r+B2e',
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
  if (name === 'phone') renderPhone();
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

  // Хронометр без дедлайну: просто фіксує тривалість операції
  const elapsed = Date.now() - s.startedAt;
  const hh = String(Math.floor(elapsed / 3600000)).padStart(2, '0');
  const mm = String(Math.floor((elapsed % 3600000) / 60000)).padStart(2, '0');
  const ss = String(Math.floor((elapsed % 60000) / 1000)).padStart(2, '0');
  $('#clock').textContent = `${hh}:${mm}:${ss}`;
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

/* ---------- Телефон жертви ---------- */
function renderPhone() {
  const unlocked = !!load().phoneUnlocked;
  $('#phoneLocked').hidden = unlocked;
  $('#phoneHome').hidden = !unlocked;
}

$('#phoneForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  $('#phoneErr').hidden = true;
  if (await matches($('#phoneCode').value, 'phoneCode')) {
    save({ phoneUnlocked: true });
    renderPhone();
  } else {
    $('#phoneErr').hidden = false;
  }
});

/* ---------- Фінал ---------- */
$('#finForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  if (await matches($('#finInput').value, 'finalCode')) {
    save({ solvedAt: Date.now() });
    $('#solvedForm').hidden = true;
    $('#solvedDone').hidden = false;
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
