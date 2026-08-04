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
  salt: 'OFLl2Qik/YVCiewWcSeM9g==',
  iv: 'QRyAvYX7DEDSpLIk',
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

/* Екранна клавіатура — щоб на мобільному не вилазила системна */
let phoneEntry = '';
function updPhoneDots() {
  [...$('#phoneDots').children].forEach((d, i) => d.classList.toggle('on', i < phoneEntry.length));
}
$('#phonePadKeys').addEventListener('click', async (e) => {
  const b = e.target.closest('button');
  if (!b) return;
  $('#phoneErr').hidden = true;
  const k = b.dataset.k;
  if (k === 'del') {
    phoneEntry = phoneEntry.slice(0, -1);
    updPhoneDots();
    return;
  }
  if (phoneEntry.length >= 4) return;
  phoneEntry += k;
  updPhoneDots();
  if (phoneEntry.length === 4) {
    const ok = await matches(phoneEntry, 'phoneCode');
    phoneEntry = '';
    if (ok) {
      save({ phoneUnlocked: true });
      updPhoneDots();
      renderPhone();
    } else {
      $('#phoneErr').hidden = false;
      setTimeout(updPhoneDots, 350);
    }
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
