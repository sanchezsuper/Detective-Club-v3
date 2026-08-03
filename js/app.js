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
  salt: 'h+PTj1Ef0J/jFHdGDEK7BA==',
  iv: 'p7wi9dsH98ao1sJD',
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
