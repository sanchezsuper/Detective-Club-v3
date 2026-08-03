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
  salt: 'YbgC9qcWnUuulyqE9wE6pQ==',
  iv: 'POhuYjXjDoBbZvvQ',
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
