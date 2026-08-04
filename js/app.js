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
  salt: 'TdGKoMK1ipitFRF8V3EwwA==',
  iv: 'DUsekNnRm/z3oBhc',
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
