// ============================================================
// Pri Ruke — app.js
// No frameworks, no build step — same convention as SlovAhoj Kids.
// ============================================================

// ---------- DATA ----------
// avatar: 'zuzana' | 'marek' — fixed per topic, no user choice (see
// architecture decision: hard-assigning avatars to topics keeps the app
// and the advertising promise identical, and removes a whole screen).
const TOPICS = [
  {
    id: 'apteka', name: 'Аптека', icon: '💊', avatar: 'zuzana', free: true,
    phrases: [
      { sk: 'Dobrý deň.', uk: 'Добрий день.', audio: 'audio/apteka_01.mp3' },
      { sk: 'Potrebujem niečo na bolesť hlavy.', uk: 'Мені потрібно щось від головного болю.', audio: 'audio/apteka_02.mp3' },
      { sk: 'Máte niečo na horúčku?', uk: 'У вас є щось від температури?', audio: 'audio/apteka_03.mp3' },
      { sk: 'Máte niečo na hnačku?', uk: 'У вас є щось від діареї?', audio: 'audio/apteka_04.mp3' },
      { sk: 'Máte niečo na kašeľ?', uk: 'У вас є щось від кашлю?', audio: 'audio/apteka_05.mp3' },
      { sk: 'Máte niečo na bolesť v krku?', uk: 'У вас є щось від болю в горлі?', audio: 'audio/apteka_06.mp3' },
      { sk: 'Je to na predpis?', uk: 'Це за рецептом?', audio: 'audio/apteka_07.mp3' },
      { sk: 'Ako to mám užívať?', uk: 'Як мені це приймати?', audio: 'audio/apteka_08.mp3' },
      { sk: 'Koľkokrát denne?', uk: 'Скільки разів на день?', audio: 'audio/apteka_09.mp3' },
      { sk: 'Máte to aj pre deti?', uk: 'У вас є це і для дітей?', audio: 'audio/apteka_10.mp3' },
      { sk: 'Koľko to stojí?', uk: 'Скільки це коштує?', audio: 'audio/apteka_11.mp3' },
      { sk: 'Ďakujem, dovidenia.', uk: 'Дякую, до побачення.', audio: 'audio/apteka_12.mp3' },
    ],
  },
  {
    id: 'magazin', name: 'Продуктовий магазин', icon: '🛒', avatar: 'zuzana', free: true,
    phrases: [
      { sk: 'Prepáčte, kde nájdem chlieb?', uk: 'Перепрошую, де я знайду хліб?', audio: 'audio/magazin_01.mp3' },
      { sk: 'Kde je mlieko?', uk: 'Де молоко?', audio: 'audio/magazin_02.mp3' },
      { sk: 'Predáva sa to na kusy, alebo na váhu?', uk: 'Це продається штуками чи на вагу?', audio: 'audio/magazin_03.mp3' },
      { sk: 'Chcela by som pol kila syra.', uk: 'Я хотіла б пів кіло сиру.', audio: 'audio/magazin_04.mp3' },
      { sk: 'Máte vrecko?', uk: 'У вас є пакет?', audio: 'audio/magazin_05.mp3' },
      { sk: 'Kde je pokladňa?', uk: 'Де каса?', audio: 'audio/magazin_06.mp3' },
      { sk: 'Môžem platiť kartou?', uk: 'Можу я платити картою?', audio: 'audio/magazin_07.mp3' },
      { sk: 'Máte drobné?', uk: 'У вас є дрібні? (питання від касира)', audio: 'audio/magazin_08.mp3' },
      { sk: 'To je všetko, ďakujem.', uk: 'Це все, дякую.', audio: 'audio/magazin_09.mp3' },
    ],
  },
  {
    id: 'transport', name: 'Громадський транспорт', icon: '🚌', avatar: 'marek', free: true,
    phrases: [
      { sk: 'Prepáčte, ide tento autobus do centra?', uk: 'Перепрошую, цей автобус їде в центр?', audio: 'audio/transport_01.mp3' },
      { sk: 'Kde kúpim lístok?', uk: 'Де купити квиток?', audio: 'audio/transport_02.mp3' },
      { sk: 'Jeden lístok, prosím.', uk: 'Один квиток, будь ласка.', audio: 'audio/transport_03.mp3' },
      { sk: 'Musím prestupovať?', uk: 'Мені потрібно робити пересадку?', audio: 'audio/transport_04.mp3' },
      { sk: 'Na ktorej zastávke mám vystúpiť?', uk: 'На якій зупинці мені виходити?', audio: 'audio/transport_05.mp3' },
      { sk: 'Kedy odchádza najbližší autobus?', uk: 'Коли відходить найближчий автобус?', audio: 'audio/transport_06.mp3' },
      { sk: 'Musím si lístok označiť?', uk: 'Мені потрібно провалідувати квиток?', audio: 'audio/transport_07.mp3' },
      { sk: 'Ďakujem, dovidenia.', uk: 'Дякую, до побачення.', audio: 'audio/transport_08.mp3' },
    ],
  },
  {
    id: 'pomoc', name: 'Екстрена допомога / 112', icon: '🚨', avatar: 'zuzana', free: true,
    phrases: [
      { sk: 'Potrebujem pomoc!', uk: 'Мені потрібна допомога!', audio: 'audio/pomoc_01.mp3' },
      { sk: 'Zavolajte záchranku!', uk: 'Викличте швидку!', audio: 'audio/pomoc_02.mp3' },
      { sk: 'Adresa je...', uk: 'Адреса: ... (назвіть вулицю і номер)', audio: 'audio/pomoc_03.mp3' },
      { sk: 'Stala sa nehoda.', uk: 'Сталася аварія.', audio: 'audio/pomoc_04.mp3' },
      { sk: 'Niekto je zranený.', uk: 'Хтось травмований.', audio: 'audio/pomoc_05.mp3' },
      { sk: 'Nedá sa mu dýchať.', uk: 'Він/вона не може дихати.', audio: 'audio/pomoc_06.mp3' },
      { sk: 'Bolí ho hrudník.', uk: 'У нього/неї болить грудна клітка.', audio: 'audio/pomoc_07.mp3' },
      { sk: 'Potrebujem policiu.', uk: 'Мені потрібна поліція.', audio: 'audio/pomoc_08.mp3' },
      { sk: 'Horí!', uk: 'Пожежа!', audio: 'audio/pomoc_09.mp3' },
      { sk: 'Dieťa je choré.', uk: 'Дитина хвора.', audio: 'audio/pomoc_10.mp3' },
    ],
  },
  {
    id: 'posta', name: 'Пошта', icon: '📮', avatar: 'marek', free: true,
    phrases: [
      { sk: 'Chcel by som poslať tento balík.', uk: 'Я хотів би відправити цю посилку.', audio: 'audio/posta_01.mp3' },
      { sk: 'Do akej krajiny to ide?', uk: 'До якої країни це йде? (питання від працівника)', audio: 'audio/posta_02.mp3' },
      { sk: 'Chcem doporučený list.', uk: 'Мені потрібен рекомендований лист.', audio: 'audio/posta_03.mp3' },
      { sk: 'Koľko to bude stáť?', uk: 'Скільки це коштуватиме?', audio: 'audio/posta_04.mp3' },
      { sk: 'Máte poštové známky?', uk: 'У вас є поштові марки?', audio: 'audio/posta_05.mp3' },
      { sk: 'Prišlo mi oznámenie o zásielke.', uk: 'Мені прийшло повідомлення про посилку.', audio: 'audio/posta_06.mp3' },
      { sk: 'Tu je môj občiansky preukaz.', uk: 'Ось моє посвідчення особи.', audio: 'audio/posta_07.mp3' },
      { sk: 'Ďakujem, dovidenia.', uk: 'Дякую, до побачення.', audio: 'audio/posta_08.mp3' },
    ],
  },

  // --- Locked preview topics (Block 2) — content coming later, tiles show
  // the paywall flow so it can be tested end-to-end before all 20 topics
  // are written. ---
  { id: 'likar', name: 'Лікар', icon: '🩺', avatar: 'zuzana', free: false, phrases: [] },
  { id: 'bank', name: 'Банк', icon: '🏦', avatar: 'zuzana', free: false, phrases: [] },
  { id: 'majster', name: 'Виклик майстра', icon: '🔧', avatar: 'marek', free: false, phrases: [] },
];

const UNIVERSAL_PHRASES = [
  { sk: 'Prepáčte, nerozumiem.', uk: 'Перепрошую, я не розумію.', audio: 'audio/pomoc_slovo_01.mp3' },
  { sk: 'Môžete to zopakovať?', uk: 'Можете повторити?', audio: 'audio/pomoc_slovo_02.mp3' },
  { sk: 'Hovorte pomalšie, prosím.', uk: 'Говоріть повільніше, будь ласка.', audio: 'audio/pomoc_slovo_03.mp3' },
  { sk: 'Môžete to napísať?', uk: 'Можете це написати?', audio: 'audio/pomoc_slovo_04.mp3' },
  { sk: 'Hovoríte po anglicky?', uk: 'Ви говорите англійською?', audio: 'audio/pomoc_slovo_05.mp3' },
  { sk: 'Ešte raz, prosím.', uk: 'Ще раз, будь ласка.', audio: 'audio/pomoc_slovo_06.mp3' },
  { sk: 'Čo to znamená?', uk: 'Що це означає?', audio: 'audio/pomoc_slovo_07.mp3' },
  { sk: 'Chvíľu, pozriem si to v telefóne.', uk: 'Хвилинку, я перевірю це в телефоні.', audio: 'audio/pomoc_slovo_08.mp3' },
];

const AVATAR_LABEL = { zuzana: 'З', marek: 'М' };

// ---------- STATE ----------
let userEmail = localStorage.getItem('priruke_email') || null;
let userPin = localStorage.getItem('priruke_pin') || null;
let subscriptionActive = localStorage.getItem('priruke_active') === 'true';
let currentAudio = null;
let currentPlayBtn = null;

// ---------- RENDER: HOME ----------
function renderHome() {
  const freeTopics = TOPICS.filter(t => t.free);
  const lockedTopics = TOPICS.filter(t => !t.free);

  const tile = (t) => `
    <button class="tile ${t.free ? '' : 'locked'}" onclick="${t.free ? `openTopic('${t.id}')` : `openPaywall()`}">
      ${t.free ? `<div class="avatar-badge">${AVATAR_LABEL[t.avatar]}</div>` : `<div class="lock-badge">🔒</div>`}
      <div class="icon">${t.icon}</div>
      <div class="name">${t.name}</div>
    </button>`;

  document.getElementById('home-sections').innerHTML = `
    <div class="section-title">Безкоштовно назавжди</div>
    <div class="tile-grid">${freeTopics.map(tile).join('')}</div>
    <div class="section-title">Повний доступ — €5/міс</div>
    <div class="tile-grid">${lockedTopics.map(tile).join('')}</div>
  `;
}

function goHome() {
  document.getElementById('topic-view').classList.add('hidden');
  document.getElementById('home-view').style.display = 'block';
  document.getElementById('search-input').value = '';
  document.getElementById('search-results').classList.remove('active');
  window.scrollTo(0, 0);
}

// ---------- RENDER: TOPIC ----------
function openTopic(topicId) {
  const topic = TOPICS.find(t => t.id === topicId);
  if (!topic) return;
  if (!topic.free && !subscriptionActive) { openPaywall(); return; }

  document.getElementById('home-view').style.display = 'none';
  document.getElementById('topic-view').classList.remove('hidden');
  document.getElementById('topic-icon').innerText = topic.icon;
  document.getElementById('topic-title').innerText = topic.name;
  document.getElementById('topic-phrase-list').innerHTML = topic.phrases.map((p, i) => phraseCardHtml(p, `topic_${topicId}_${i}`)).join('');
  window.scrollTo(0, 0);
}
window.openTopic = openTopic;
window.goHome = goHome;

function phraseCardHtml(p, uid) {
  return `
    <div class="phrase-card" onclick="playPhrase('${p.audio}', this)">
      <button class="play-btn" id="play-${uid}">▶</button>
      <div class="phrase-text">
        <div class="sk">${p.sk}</div>
        <div class="uk">${p.uk}</div>
      </div>
    </div>`;
}

// ---------- AUDIO ----------
function playPhrase(src, cardEl) {
  const audio = document.getElementById('phrase-audio');
  const btn = cardEl.querySelector('.play-btn');

  if (currentPlayBtn) currentPlayBtn.classList.remove('playing');

  if (currentAudio === src && !audio.paused) {
    audio.pause();
    btn.classList.remove('playing');
    currentPlayBtn = null;
    return;
  }

  audio.src = src;
  audio.play().catch(e => console.warn('Playback failed:', e));
  btn.classList.add('playing');
  currentAudio = src;
  currentPlayBtn = btn;

  audio.onended = () => {
    btn.classList.remove('playing');
    currentPlayBtn = null;
  };
}
window.playPhrase = playPhrase;

// ---------- SEARCH ----------
function handleSearch(query) {
  const q = query.trim().toLowerCase();
  const resultsBox = document.getElementById('search-results');
  const homeSections = document.getElementById('home-sections');

  if (!q) {
    resultsBox.classList.remove('active');
    homeSections.style.display = 'block';
    return;
  }

  homeSections.style.display = 'none';
  resultsBox.classList.add('active');

  const matches = [];
  TOPICS.forEach(topic => {
    if (!topic.free && !subscriptionActive) return;
    topic.phrases.forEach((p, i) => {
      if (p.sk.toLowerCase().includes(q) || p.uk.toLowerCase().includes(q)) {
        matches.push({ ...p, topicName: topic.name, uid: `search_${topic.id}_${i}` });
      }
    });
  });
  UNIVERSAL_PHRASES.forEach((p, i) => {
    if (p.sk.toLowerCase().includes(q) || p.uk.toLowerCase().includes(q)) {
      matches.push({ ...p, topicName: 'Не зрозумів відповідь', uid: `search_universal_${i}` });
    }
  });

  document.getElementById('search-results-title').innerText = matches.length
    ? `Знайдено: ${matches.length}`
    : 'Нічого не знайдено';

  document.getElementById('search-results-list').innerHTML = matches.map(p => `
    <div class="phrase-card" onclick="playPhrase('${p.audio}', this)">
      <button class="play-btn" id="play-${p.uid}">▶</button>
      <div class="phrase-text">
        <div class="sk">${p.sk}</div>
        <div class="uk">${p.uk} · <em>${p.topicName}</em></div>
      </div>
    </div>`).join('');
}
window.handleSearch = handleSearch;

// ---------- UNIVERSAL MODULE ----------
function openUniversalModal() {
  document.getElementById('universal-phrase-list').innerHTML =
    UNIVERSAL_PHRASES.map((p, i) => phraseCardHtml(p, `universal_${i}`)).join('');
  document.getElementById('universal-modal').classList.remove('hidden');
}
window.openUniversalModal = openUniversalModal;

// ---------- MODAL HELPERS ----------
function closeModal(id) { document.getElementById(id).classList.add('hidden'); }
window.closeModal = closeModal;

function openPaywall() { document.getElementById('paywall-modal').classList.remove('hidden'); }
window.openPaywall = openPaywall;

function openLoginModal() { document.getElementById('login-modal').classList.remove('hidden'); }
window.openLoginModal = openLoginModal;

function openAccountEntry() {
  if (userEmail && subscriptionActive) {
    document.getElementById('account-status-text').innerText =
      `Ви увійшли як ${userEmail}. Повний доступ активний.`;
    document.getElementById('account-modal').classList.remove('hidden');
  } else if (userEmail) {
    document.getElementById('account-status-text').innerText =
      `Email ${userEmail} збережено, але підписка не активна.`;
    document.getElementById('account-modal').classList.remove('hidden');
  } else {
    openLoginModal();
  }
}
window.openAccountEntry = openAccountEntry;

function logout() {
  localStorage.removeItem('priruke_email');
  localStorage.removeItem('priruke_pin');
  localStorage.removeItem('priruke_active');
  location.reload();
}
window.logout = logout;

// ---------- CHECKOUT ----------
function startCheckout() {
  const email = document.getElementById('checkout-email').value.trim();
  const errorEl = document.getElementById('checkout-error');
  errorEl.classList.add('hidden');

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errorEl.innerText = 'Введіть коректний email.';
    errorEl.classList.remove('hidden');
    return;
  }

  fetch('/api/create-checkout-session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  })
    .then(res => res.json())
    .then(data => {
      if (data.url) {
        localStorage.setItem('priruke_email', email); // so we can check status on return
        window.location.href = data.url;
      } else {
        errorEl.innerText = 'Не вдалося почати оплату. Спробуйте ще раз.';
        errorEl.classList.remove('hidden');
      }
    })
    .catch(() => {
      errorEl.innerText = "Помилка з'єднання.";
      errorEl.classList.remove('hidden');
    });
}
window.startCheckout = startCheckout;

// ---------- LOGIN BY PIN ----------
function loginWithPin() {
  const email = document.getElementById('login-email').value.trim();
  const pin = document.getElementById('login-pin').value.trim();
  const errorEl = document.getElementById('login-error');
  errorEl.classList.add('hidden');

  if (!email || !pin) {
    errorEl.innerText = 'Введіть email та код доступу.';
    errorEl.classList.remove('hidden');
    return;
  }

  fetch('/api/pin', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'login', email, pin }),
  })
    .then(res => res.json().then(data => ({ ok: res.ok, status: res.status, data })))
    .then(({ ok, status, data }) => {
      if (!ok || !data.success) {
        errorEl.innerText = status === 429
          ? 'Забагато спроб. Спробуйте пізніше.'
          : 'Невірний email або код доступу.';
        errorEl.classList.remove('hidden');
        return;
      }
      userEmail = data.email;
      userPin = pin;
      subscriptionActive = !!data.active;
      localStorage.setItem('priruke_email', userEmail);
      localStorage.setItem('priruke_pin', userPin);
      localStorage.setItem('priruke_active', subscriptionActive ? 'true' : 'false');
      closeModal('login-modal');
      renderHome();
    })
    .catch(() => {
      errorEl.innerText = "Помилка з'єднання.";
      errorEl.classList.remove('hidden');
    });
}
window.loginWithPin = loginWithPin;

function requestPinResend() {
  const email = document.getElementById('login-email').value.trim();
  const statusEl = document.getElementById('resend-status');
  statusEl.classList.remove('hidden');

  if (!email) {
    statusEl.innerText = 'Спочатку введіть email.';
    return;
  }
  statusEl.innerText = 'Надсилаємо...';

  fetch('/api/pin', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'resend', email }),
  })
    .then(res => res.json())
    .then(() => {
      statusEl.innerText = 'Якщо цей email оплачував підписку — код вже надіслано. Перевірте пошту.';
    })
    .catch(() => { statusEl.innerText = "Помилка з'єднання."; });
}
window.requestPinResend = requestPinResend;

// ---------- SYNC ON LOAD ----------
function syncSubscriptionStatus() {
  if (!userEmail) return;
  fetch(`/api/subscription-status?email=${encodeURIComponent(userEmail)}`)
    .then(res => res.json())
    .then(data => {
      subscriptionActive = !!data.active;
      localStorage.setItem('priruke_active', subscriptionActive ? 'true' : 'false');
      renderHome();
    })
    .catch(e => console.warn('Failed to sync subscription status:', e));
}

// ---------- INIT ----------
window.addEventListener('DOMContentLoaded', () => {
  renderHome();
  syncSubscriptionStatus();

  // After returning from Stripe Checkout, immediately re-check status so
  // the paid topics unlock without waiting for a page reload later.
  const params = new URLSearchParams(window.location.search);
  if (params.get('payment') === 'success') {
    setTimeout(syncSubscriptionStatus, 1500); // small delay for webhook to land
    history.replaceState({}, '', '/');
  }
});
