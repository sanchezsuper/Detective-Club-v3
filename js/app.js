/* Детективний клуб · справа № 003 — логіка прототипу.
   Стан гри — у localStorage. Якщо в js/firebase-config.js вставлено конфіг
   Firebase, вмикається спільне лобі: всі бачать одне одного, СТАРТ ведучого
   синхронний, ведучий може видаляти гравців. Без конфігу — автономний режим. */

'use strict';

/* Відповіді зберігаються як SHA-256-хеші — у відкритому коді сайту
   їх не підглянути (важливо для публічного хостингу, напр. GitHub Pages).
   Згенерувати новий хеш: node -e "console.log(require('crypto').createHash('sha256').update('відповідь').digest('hex'))" */
const HASHES = {
  admission: ['998795fd01c3cda2449704a593afd7223ceadb0529291c5d349cc0fe875161cc', 'b5bafb841c38abead8f92342d362352a4270c7b475a990366f25d0830b304277'],
  login: ['bf0d358aeed8f1720d028b9b9533530b33eac1ac25a93c37c1b3a8fa4c6d5921', 'e58c835dddd245b7b3e5aad030fb65528ee1473994623f1de4dfc67fb123bac4', '9d117f3cd34688120987aae10d416ba208aa5fa22aefee92556198b1ac57518a'],
  password: ['c13ed9078122113319066d8dd192e261ab3b2ad5af9b07cd69b2d9b7b4f53b2e', '61c858e619fbef9d80662ce46917c331515d1feadf44b391dcf7255616377b7c'],
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
  salt: 'tk8enGGH9rcViWkUCtmevQ==',
  iv: '4VeSN3+Bzlv0oP4d',
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
let hostPending = !!hostParam; // true, поки асинхронно перевіряється ключ

/* ---------- Спільне лобі (Firebase RTDB, опційно) ----------
   Дані живуть під /rooms/case003: players/<id> + game/startedAt.
   Все нижче — за guard'ом sync.on: без конфігу жодного ефекту. */
const sync = {
  on: false, room: null, offset: 0, players: null, sawSelf: false, resetting: false, prelaunch: false,
  // Статус набору «відомий» одразу лише без Firebase; інакше чекаємо
  // першої відповіді бази (вуаль замість блимання лендінга)
  gateKnown: !(typeof firebase !== 'undefined' && window.FIREBASE_CONFIG),
};

function syncInit() {
  if (typeof firebase === 'undefined' || !window.FIREBASE_CONFIG) return;
  try {
    firebase.initializeApp(window.FIREBASE_CONFIG);
    sync.room = firebase.database().ref('rooms/case003');
  } catch (err) {
    console.warn('Firebase недоступний, працюю автономно:', err);
    sync.gateKnown = true;
    route();
    return;
  }
  sync.on = true;

  // Страховка вуалі: якщо база не відповіла за 2.5 с — показуємо як є
  setTimeout(() => {
    if (!sync.gateKnown) { sync.gateKnown = true; route(); }
  }, 2500);

  // Поправка на розбіжність годинника клієнта з сервером
  firebase.database().ref('.info/serverTimeOffset').on('value', (sn) => {
    sync.offset = sn.val() || 0;
  });

  // Синхронний старт: серверний timestamp дзеркалиться в localStorage,
  // тож updateClock і охорона маршрутів працюють без змін
  sync.room.child('game/startedAt').on('value', (sn) => {
    const t = sn.val();
    if (t && load().startedAt !== t) {
      save({ startedAt: t });
      if (document.body.dataset.screen === 'cabinet') updateClock();
    }
  });

  // Заглушка «справа готується»: вмикається/вимикається кнопкою ведучого,
  // у гостей екран змінюється наживо без оновлення сторінки
  sync.room.child('prelaunch').on('value', (sn) => {
    sync.prelaunch = !!sn.val();
    sync.gateKnown = true;
    updateHostGate();
    route();
  });

  // Лобі + самовидалення (ведучий видалив мій запис → профіль скидається)
  sync.room.child('players').on('value', (sn) => {
    sync.players = sn.val() || {};
    const me = load();
    if (me.playerId) {
      if (sync.players[me.playerId]) {
        sync.sawSelf = true;
      } else if (sync.sawSelf && !sync.resetting) {
        syncKicked();
        return;
      }
    }
    if (document.body.dataset.screen === 'cabinet') renderLobby();
  });

  syncPublish();
}

function syncKicked() {
  sync.sawSelf = false;
  localStorage.removeItem('dc3');
  alert('Ведучий оновив склад групи — ваш профіль скинуто. Зареєструйтеся, будь ласка, знову.');
  location.hash = '#/register';
  location.reload();
}

/* Кнопка ведучого «Набір: …» — видима лише зі спільною базою */
function updateHostGate() {
  const b = $('#hostGate');
  if (!isHost || !sync.on) return;
  b.hidden = false;
  b.textContent = sync.prelaunch ? 'Набір: ЗАКРИТО 🔒' : 'Набір: ВІДКРИТО ✓';
  b.title = sync.prelaunch
    ? 'Гості бачать «справа готується». Натисніть, щоб відкрити лендінг усім.'
    : 'Лендінг відкритий. Натисніть, щоб показувати гостям «справа готується».';
}

/* Публікує/оновлює власний запис у лобі (ідемпотентно) */
function syncPublish(isNew) {
  if (!sync.on) return;
  const s = load();
  if (!s.playerId || !s.name) return;
  const ref = sync.room.child('players/' + s.playerId);
  const data = { name: s.name, avatar: s.avatar || '', admitted: !!s.admitted, online: true, blockedUntil: s.blockedUntil || null };
  if (isNew) data.joinedAt = firebase.database.ServerValue.TIMESTAMP;
  ref.update(data);
  ref.child('online').onDisconnect().set(false);
}

/* ---------- Пастка «ДОСТУП ЗАБОРОНЕНО» ----------
   Гравець, що відсканував QR-обманку, блокується на BLOCK_MS:
   всі екрани примусово ведуть на denied, іде зворотний відлік. */
const BLOCK_MS = 3 * 60000;
let deniedInt = null;

function renderDenied() {
  const t = $('#deniedTimer');
  const s = load();
  // Таймер і автоповернення — лише при АКТИВНОМУ блокуванні;
  // прострочений blockedUntil (чи ведучий) — просто статичний екран
  if (isHost || !s.blockedUntil || s.blockedUntil <= Date.now()) { t.hidden = true; return; }
  t.hidden = false;
  const tick = () => {
    const left = (load().blockedUntil || 0) - Date.now();
    if (left <= 0) {
      clearInterval(deniedInt);
      const s2 = load();
      location.hash = s2.gateOpen ? '#/dossier' : (s2.admitted ? '#/cabinet' : '#/');
      return;
    }
    const mm = String(Math.floor(left / 60000)).padStart(2, '0');
    const ss = String(Math.floor((left % 60000) / 1000)).padStart(2, '0');
    $('#deniedLeft').textContent = `${mm}:${ss}`;
  };
  clearInterval(deniedInt);
  tick();
  deniedInt = setInterval(tick, 500);
}

const newPlayerId = () =>
  (crypto.randomUUID ? crypto.randomUUID() : 'p' + Math.random().toString(36).slice(2) + Date.now().toString(36));

/* ---------- Роутер ---------- */
const SCREENS = ['prelaunch', 'landing', 'register', 'task', 'cabinet', 'terminal', 'dossier', 'phone', 'denied', 'solved'];

function route() {
  const hash = location.hash || '#/';
  let name = hash.replace('#/', '') || 'landing';
  if (!SCREENS.includes(name)) name = 'landing';

  // Охорона маршрутів (ведучий ходить вільно)
  const s = load();

  // Статус набору ще летить з бази: гостям — вуаль, без блимання лендінга
  const veil = !isHost && !s.name && !sync.gateKnown;
  $('#bootVeil').hidden = !veil;
  if (veil) {
    SCREENS.forEach((id) => { $('#screen-' + id).hidden = true; });
    return;
  }

  if (!isHost) {
    // Набір ще не відкрито: гості з візиток бачать «справа готується».
    // Зареєстрованих (та ведучого) заглушка не стосується.
    if (sync.prelaunch && !s.name) name = 'prelaunch';
    else if (name === 'prelaunch') name = 'landing';
    if (['task'].includes(name) && !s.name) name = 'register';
    if (['cabinet'].includes(name) && !s.admitted) name = s.name ? 'task' : 'landing';
    if (['terminal'].includes(name) && !gameRunning(s)) name = 'cabinet';
    if (['dossier'].includes(name) && !s.gateOpen) name = s.startedAt ? 'terminal' : 'cabinet';
    if (name === 'cabinet' && !s.admitted) name = 'landing';

    // Пастка «ДОСТУП ЗАБОРОНЕНО»: скан QR-обманки блокує детектива.
    // hostPending: ключ ведучого ще перевіряється — пастку не зводимо,
    // інакше ведучий із профілем гравця блокує сам себе.
    if (name === 'denied' && s.name && !hostPending && (!s.blockedUntil || s.blockedUntil <= Date.now())) {
      save({ blockedUntil: Date.now() + BLOCK_MS });
      syncPublish();
    }
    if (s.name && load().blockedUntil > Date.now()) name = 'denied';

    // Сканування QR з рапорта відкриває вкладку ДОПОВІДЬ назавжди
    if (name === 'solved' && s.name && !hostPending && !s.reportOpen) save({ reportOpen: true });
  }

  SCREENS.forEach((id) => { $('#screen-' + id).hidden = (id !== name); });
  document.body.dataset.screen = name;
  updateNav(name);
  window.scrollTo(0, 0);

  if (name === 'cabinet') renderCabinet();
  if (name === 'terminal') bootTerminal();
  if (name === 'dossier') renderDossier();
  if (name === 'phone') renderPhone();
  if (name === 'denied') renderDenied();
}
window.addEventListener('hashchange', route);

/* Нижні вкладки: з'являються після допуску і ростуть по мірі прогресу */
function updateNav(name) {
  const s = load();
  const hideOn = ['prelaunch', 'landing', 'register', 'task', 'denied'];
  const show = !!s.admitted && !hideOn.includes(name);
  $('#gameNav').hidden = !show;
  document.body.classList.toggle('has-nav', show);
  if (!show) return;
  $('#navDossier').hidden = !s.gateOpen;
  $('#navPhone').hidden = !s.pin;
  $('#navSolved').hidden = !s.reportOpen;
  [['#navCabinet', 'cabinet'], ['#navDossier', 'dossier'], ['#navPhone', 'phone'], ['#navSolved', 'solved']]
    .forEach(([sel, scr]) => $(sel).classList.toggle('act', scr === name));
}

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
  // playerId живе в localStorage: повторний вхід з того ж браузера
  // не створює дубля в лобі
  const isNew = !load().playerId;
  save({ name, avatar: pickedAvatar, playerId: load().playerId || newPlayerId() });
  syncPublish(isNew);
  location.hash = '#/task';
});

/* ---------- Завдання-допуск ---------- */
$('#taskForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  if (await matches($('#taskAnswer').value, 'admission')) {
    save({ admitted: true });
    syncPublish();
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

  renderLobby();

  updateClock();
  if (clockTimer) clearInterval(clockTimer);
  clockTimer = setInterval(updateClock, 1000);
}

/* Лобі: зі спільною базою — всі детективи (імена від інших гравців
   рендеряться лише через textContent); автономно — тільки локальний. */
function renderLobby() {
  const lobby = $('#lobbyList');
  lobby.innerHTML = '';
  const s = load();

  const addRow = (id, p) => {
    const li = document.createElement('li');
    const who = document.createElement('span');
    who.className = 'pl';
    who.textContent = `${p.avatar || ''} ${p.name || 'Детектив'}${id && id === s.playerId ? ' (ви)' : ''}`;
    const st = document.createElement('span');
    const blocked = p.blockedUntil && p.blockedUntil > Date.now();
    st.className = 'st' + (blocked ? ' bad' : p.admitted ? ' ok' : '');
    st.textContent = blocked ? 'заблоковано'
      : p.online === false ? 'не на зв’язку'
      : (p.admitted ? 'допуск отримано' : 'проходить допуск');
    li.append(who, st);
    if (isHost && sync.on && id) {
      const del = document.createElement('button');
      del.type = 'button';
      del.className = 'kick';
      del.textContent = '✕';
      del.title = 'Видалити детектива зі складу групи';
      del.addEventListener('click', () => {
        if (confirm(`Видалити «${p.name || 'Детектив'}» зі складу групи? Його профіль скинеться.`)) {
          sync.room.child('players/' + id).remove();
        }
      });
      li.appendChild(del);
    }
    lobby.appendChild(li);
  };

  if (sync.on && sync.players && Object.keys(sync.players).length) {
    Object.entries(sync.players)
      .sort((a, b) => (a[1].joinedAt || 0) - (b[1].joinedAt || 0))
      .forEach(([id, p]) => addRow(id, p));
  } else if (s.name) {
    addRow(null, { name: s.name, avatar: s.avatar, admitted: !!s.admitted });
  }
}

/* СТАРТ призначає startedAt на 10 с у майбутнє — до того моменту
   у всіх іде синхронний відлік 10…1 (sync.offset вирівнює годинники) */
const gameRunning = (s) => !!s.startedAt && Date.now() + sync.offset >= s.startedAt;

function updateClock() {
  const s = load();
  const now = Date.now() + sync.offset;
  const started = !!s.startedAt;
  const running = started && now >= s.startedAt;
  $('#waitBlock').hidden = started;
  $('#countBlock').hidden = !started || running;
  $('#runBlock').hidden = !running;
  $('#secretLock').hidden = !running;
  if (!started) return;
  if (!running) {
    $('#countNum').textContent = Math.max(1, Math.ceil((s.startedAt - now) / 1000));
    return;
  }

  // Хронометр без дедлайну: просто фіксує тривалість операції
  const elapsed = now - s.startedAt;
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
  // якщо доступ уже надано (повернення/перезавантаження) — одразу кнопка досьє
  if (load().gateOpen) {
    const lines = [...BOOT_LINES.slice(0, -1), 'СЕСІЮ ВІДНОВЛЕНО. ДОСТУП НАДАНО.'];
    typeLines($('#termLog'), lines, () => {
      $('#termLog').textContent = lines.join('\n');
      $('#openDossier').hidden = false;
    });
    return;
  }
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
    updateNav(document.body.dataset.screen);
    $('#termForm').hidden = true;
    typeLines(log, [...BOOT_LINES, '', '> ДОСТУП НАДАНО.', '> СПРАВУ № 003 ЗНАЙДЕНО В АРХІВІ.'], () => {
      $('#openDossier').hidden = false;
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
    updateNav(document.body.dataset.screen);
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
      updateNav(document.body.dataset.screen);
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
  if (!hostParam || !crypto.subtle) { hostPending = false; return; }
  if (!(await matches(hostParam, 'hostKey'))) { hostPending = false; route(); return; }
  hostPending = false;
  isHost = true;
  $('#hostbar').hidden = false;
  $('#hostStart').addEventListener('click', () => {
    // старт через 10 с: у всіх гравців синхронно йде відлік 10…1
    const at = Date.now() + sync.offset + 10000;
    save({ startedAt: at });
    if (sync.on) sync.room.child('game/startedAt').set(at);
    updateClock();
  });
  $('#hostReset').addEventListener('click', () => {
    if (sync.on) {
      if (!confirm('Скинути гру для ВСІХ гравців? Профілі всіх детективів буде видалено.')) return;
      sync.resetting = true; // щоб ведучому не показалось власне «вас видалено»
      sync.room.remove(); // гравці отримають скидання через слухач players
    }
    localStorage.removeItem('dc3');
    location.hash = '#/';
    location.reload();
  });
  $('#hostGate').addEventListener('click', () => {
    if (sync.on) sync.room.child('prelaunch').set(!sync.prelaunch);
  });
  updateHostGate();
  route(); // перерахувати охорону маршрутів уже як ведучий
  if (document.body.dataset.screen === 'cabinet') renderLobby(); // домалювати кнопки ✕
}

/* ---------- Старт ---------- */
renderAvatars();
route();
initHost();
syncInit();
