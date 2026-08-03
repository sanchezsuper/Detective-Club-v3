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
  salt: 'OtesDxMdFG19jpy+vNpIgA==',
  iv: '1Mf5mSEFhqlj3bpY',
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

/* ---------- Телефон жертви (СХОВИЩЕ-7) ----------
   До розсекречення досьє (s.pin ще нема) — мертвий чорний екран.
   Після — хмарне дзеркало за кодом 1908. */
function renderPhone() {
  const s = load();
  const dead = !s.pin && !isHost;
  const unlocked = !!s.phoneUnlocked;
  $('#phoneDead').hidden = !dead;
  $('#phoneLocked').hidden = dead || unlocked;
  $('#phoneHome').hidden = dead || !unlocked;
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
