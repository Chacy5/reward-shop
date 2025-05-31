// === Firebase-подключение + полный интерфейс ===
import {
  registerNewUser, loginUser, logoutUser,
  getUserData as fetchUserData, updateUserData,
  getQuests, addQuest, updateQuest, deleteQuest,
  getRewards, addReward, updateReward, deleteReward
} from "./firestore-api.js";

// ====== Globals and Data ======
let familyId = localStorage.getItem('pawFamilyId') || "";
let currentUser = localStorage.getItem('pawCurrentUser') || "";
let data = {};
let quests = [];
let rewards = [];
let DEMO_USER = "demo";
let DEFAULT_CATEGORIES = [
  { emoji: "🎯", name: "Goal" }, { emoji: "📚", name: "Study" },
  { emoji: "🧹", name: "Cleaning" }, { emoji: "💪", name: "Sport" },
  { emoji: "🌿", name: "Nature" }, { emoji: "📝", name: "Note" },
  { emoji: "🧠", name: "Growth" }, { emoji: "🎁", name: "Gift" },
  { emoji: "🍫", name: "Sweets" }, { emoji: "☕", name: "Coffee" },
  { emoji: "🛋️", name: "Rest" }, { emoji: "🎮", name: "Games" },
  { emoji: "🧸", name: "Cute" }
];
let DEFAULT_EMOJI = [
  "🎯","📚","🧹","💪","🌿","📝","🧠","🎁","🍫","☕","🛋️","🎮","🧸","❤️","🐾","🔥","⭐","🔔","🚀","🎉"
];

function isDemo() { return !currentUser || currentUser === DEMO_USER; }

function getDemoData() {
  return {
    profile: { username: DEMO_USER, password: "demo", role: "Performer" },
    points: 100,
    quests: [
      { id: 1, type: 'daily', name: '🟢 Завершите этот квест', emoji: '🐾', category: "Goal", desc: 'Кликните "Mark done", чтобы выполнить ежедневную задачу', pts: 6, done: false, lastDone: null },
      { id: 2, type: 'event', name: '🔵 Получите награду', emoji: '🎁', category: "Gift", desc: 'Зайдите в Reward Store, чтобы получить награду за баллы', pts: 5, done: false, lastDone: null },
      { id: 3, type: 'weekly', name: '🟣 Откройте статистику', emoji: '📊', category: "Growth", desc: 'Посмотрите, как отслеживается прогресс', pts: 4, done: false, lastDone: null }
    ],
    completed: [],
    rewards: [
      { id: 1, name: '🏆 Мотивация и поддержка', emoji: '🐾', category: "Sweets", desc: 'Игра помогает людям с СДВГ структурировать задачи, получать награды и видеть свой прогресс!', cost: 1, bonus: "Стимулирует регулярность", quantity: 99 },
      { id: 2, name: '🤝 Улучшение отношений', emoji: '💖', category: "Gift", desc: 'Совместные квесты и награды учат позитивному подкреплению и заботе друг о друге.', cost: 1, bonus: "Дружба и любовь", quantity: 99 },
      { id: 3, name: '✨ Достижения', emoji: '⭐', category: "Growth", desc: 'Почувствуйте гордость за себя — каждое действие приближает к цели!', cost: 1, bonus: "Видимый рост", quantity: 99 }
    ],
    claimed: [],
    lastDailyReset: 0,
    lastWeeklyReset: 0,
    archive: [],
    categories: [...DEFAULT_CATEGORIES],
    customEmojis: []
  };
}

function getUserData() {
  if (isDemo()) return data[DEMO_USER];
  return data[currentUser];
}

async function loadData() {
  if (isDemo()) {
    data[DEMO_USER] = getDemoData();
    return;
  }
  data[currentUser] = await fetchUserData(familyId, currentUser);
  quests = await getQuests(familyId);
  rewards = await getRewards(familyId);
}

async function saveData() {
  if (!isDemo() && currentUser && data[currentUser]) {
    await updateUserData(familyId, currentUser, data[currentUser]);
  }
}  

// ====== Quest/Reward Periodic Reset ======
function resetDailiesAndWeeklies() {
  let user = getUserData();
  let now = Date.now();
  let todayStart = new Date(); todayStart.setHours(0,0,0,0);
  if (!user.lastDailyReset || user.lastDailyReset < todayStart.getTime()) {
    user.quests.forEach(q => { if(q.type==='daily') q.done = false; });
    user.lastDailyReset = todayStart.getTime();
  }
  let monday = new Date(); let day = monday.getDay()||7;
  monday.setHours(0,0,0,0); monday.setDate(monday.getDate() - day + 1);
  if (!user.lastWeeklyReset || user.lastWeeklyReset < monday.getTime()) {
    user.quests.forEach(q => { if(q.type==='weekly') q.done = false; });
    user.lastWeeklyReset = monday.getTime();
  }
  saveData();
}

// ====== Auth ======
function showLoginModal() {
  openModal(`
    <h3>Sign In</h3>
    <label>Username <input id="login-username" type="text" autocomplete="username"></label>
    <label>Password <input id="login-password" type="password" autocomplete="current-password"></label>
    <button class="fancy-btn" onclick="doLogin()">Sign In</button>
    <div style="margin-top:8px;font-size:0.97em;">
      <span>Don't have an account? <a href="#" onclick="showRegisterModal()">Register</a></span>
    </div>
    <div id="login-error" style="color:#c00;font-size:0.97em;"></div>
  `);
  document.getElementById('login-username').focus();
}
window.showLoginModal = showLoginModal;
window.doLogin = function doLogin() {
  let username = document.getElementById('login-username').value.trim();
  let password = document.getElementById('login-password').value.trim();
  if (!username || !password) {
    document.getElementById('login-error').textContent = "Enter both fields"; return;
  }
  if (!data[username] || data[username].profile.password !== password) {
    document.getElementById('login-error').textContent = "Wrong username or password"; return;
  }
  setUser(username); closeModal(); renderAll();
};
function showRegisterModal() {
  openModal(`
    <h3>Register</h3>
    <label>Username <input id="register-username" type="text" autocomplete="username"></label>
    <label>Password <input id="register-password" type="password" autocomplete="new-password"></label>
    <button class="fancy-btn" onclick="doRegister()">Register</button>
    <div style="margin-top:8px;font-size:0.97em;">
      <span>Already have an account? <a href="#" onclick="showLoginModal()">Sign In</a></span>
    </div>
    <div id="register-error" style="color:#c00;font-size:0.97em;"></div>
  `);
  document.getElementById('register-username').focus();
}
window.showRegisterModal = showRegisterModal;
window.doRegister = function doRegister() {
  let username = document.getElementById('register-username').value.trim();
  let password = document.getElementById('register-password').value.trim();
  if (!username || !password) {
    document.getElementById('register-error').textContent = "Enter both fields"; return;
  }
  if (data[username]) {
    document.getElementById('register-error').textContent = "User already exists"; return;
  }
  data[username] = {
    profile: { username, password, role: "Performer" },
    points: 0, quests: [], completed: [], rewards: [], claimed: [],
    lastDailyReset: 0, lastWeeklyReset: 0, archive: [],
    categories: [...DEFAULT_CATEGORIES], customEmojis: []
  };
  saveData(); setUser(username); closeModal(); renderAll();
};

// ====== Emoji/Category Dropdowns ======
function emojiDropdown(selected) {
  let user = getUserData();
  let emojis = [...DEFAULT_EMOJI, ...(user.customEmojis||[])];
  return `<select id="emoji-select">${emojis.map(e=>`<option${selected===e?' selected':''}>${e}</option>`).join("")}
    <option value="add-custom">➕ Add custom</option></select>`;
}
function categoryDropdown(selected) {
  let cats = getUserData().categories || [];
  return `<select id="cat-select">${cats.map(c=>`<option${selected===c.name?' selected':''}>${c.emoji} ${c.name}</option>`).join("")}
    <option value="add-cat">➕ Add category</option></select>`;
}

// ====== Filtering ======
function renderFilterBar(type) {
  const user = getUserData();
  const categories = user.categories.map(c => c.name);
  let html = `<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:8px;">
    <button class="filter-btn" data-filter="all">Все</button>`;
  categories.forEach(cat => {
    html += `<button class="filter-btn" data-filter="${cat}">${cat}</button>`;
  });
  html += `</div>`;
  return html;
}

function filterHandler(type, renderFunc) {
  return function(e) {
    if (e.target.classList.contains('filter-btn')) {
      const cat = e.target.getAttribute('data-filter');
      renderFunc(cat === "all" ? null : cat);
    }
  };
}

// ====== HOME ======
function renderHome() {
  const user = getUserData();
  const stats = {
    completed: user.completed.length,
    claimed: user.claimed.length,
    balance: user.points
  };
  let html = "";
  if (isDemo()) {
    html += `
      <div class="demo-hint">
        <b>Вы находитесь в демо-режиме!</b><br>
        <span style="font-size:1.1em;">
        Это игра для двоих (или одного), где за выполнение квестов вы получаете "лапки" 🐾,
        которые можно обменять на награды и приятные бонусы.<br><br>
        Приложение помогает структурировать быт, мотивировать себя и поддерживать друг друга!
        </span>
      </div>
      <button class="demo-big-btn" onclick="showRegisterModal()">Начать играть — Регистрация</button>
      <button class="demo-big-btn" onclick="showLoginModal()">Войти</button>
    `;
    html += `
      <div class="infograph" style="margin-top:38px;">
        <div class="infocard">
          <span class="big">${stats.balance} 🐾</span>
          Ваш баланс лапок
        </div>
        <div class="infocard">
          <span class="big">3</span>
          Демо-квеста для знакомства
        </div>
        <div class="infocard">
          <span class="big">3</span>
          Примерные награды
        </div>
      </div>
      <div style="margin:18px 0 0 0; color:#189d8a; text-align:center;">Зарегистрируйтесь, чтобы открыть весь функционал!</div>
    `;
  } else {
    html += `
      <div class="greeting">🐾 Добро пожаловать, <b>${user.profile.username}</b>!</div>
      <div class="infograph">
        <div class="infocard">
          <span class="big">${stats.balance} 🐾</span>
          Баланс лапок
        </div>
        <div class="infocard">
          <span class="big">${stats.completed}</span>
          Квестов выполнено
        </div>
        <div class="infocard">
          <span class="big">${stats.claimed}</span>
          Наград получено
        </div>
      </div>
    `;
  }
  document.getElementById('page-home').innerHTML = html;
}

// ====== QUESTS ======
function renderQuests(activeCategory = null) {
  resetDailiesAndWeeklies();
  const user = getUserData();
  const isQM = user.profile.role === 'Questmaster';
  let html = renderFilterBar('quests');
  if (isDemo()) {
    html += `<div class="demo-hint">Демо-квесты показывают, как устроено приложение.<br>Попробуйте выполнить их!</div>`;
  } else if (isQM) {
    html += `<button class="paw-action-btn" onclick="openQuestModal()">+ Add quest</button>`;
  }
  let list = user.quests.filter(q=>!q.done || q.type==="event");
  if (activeCategory) list = list.filter(q => q.category === activeCategory);
  if (list.length === 0) html += `<div>No active quests.</div>`;
  list.forEach((q, i) => {
    if(q.type!=="event" && q.done) return;
    html += `
    <div class="card ${q.type}">
      <div style="display:flex;justify-content:space-between;align-items:center;">
        <div><span style="font-size:1.5em;">${q.emoji}</span> <b>${q.name}</b></div>
        <div><span style="font-size:1em;">${q.pts} 🐾</span></div>
      </div>
      <div style="margin:4px 0 0 0; font-size:0.97em; color:#35776e;">${q.desc}</div>
      <div style="font-size:0.92em; color:#888;">${q.type}, ${q.category}</div>
      <div style="margin-top:10px;">`;
    if (!isDemo() && isQM) {
      html += `<button class="edit-btn" onclick="editQuest(${q.id})">✏️ Edit</button>
               <button class="delete-btn" onclick="deleteQuest(${q.id})">🗑️ Delete</button>`;
    } else if (!q.done) {
      html += `<button class="paw-action-btn" onclick="completeQuest(${q.id})">Mark done</button>`;
    }
    html += `</div></div>`;
  });
  document.getElementById('page-quests').innerHTML = `<h2>Quests</h2>${html}`;
  document.getElementById('page-quests').onclick = filterHandler('quests', renderQuests);
}

// ====== SHOP ======
function renderShop(activeCategory = null) {
  const user = getUserData();
  const isQM = user.profile.role === 'Questmaster';
  let html = renderFilterBar('rewards');
  if (isDemo()) {
    html += `<div class="demo-hint">В игре награды — это приятные или полезные бонусы, которые можно "покупать" за лапки.<br>
      Вот несколько идей, почему такая игра может помочь:</div>`;
  } else if (isQM) {
    html += `<button class="paw-action-btn" onclick="openRewardModal()">+ Add reward</button>`;
  }
  let list = user.rewards || [];
  if (activeCategory) list = list.filter(r => r.category === activeCategory);
  if (list.length === 0) html += `<div>No rewards yet.</div>`;
  list.forEach((r, i) => {
    html += `
    <div class="card">
      <div style="display:flex;justify-content:space-between;align-items:center;">
        <div><span style="font-size:1.5em;">${r.emoji}</span> <b>${r.name}</b></div>
        <div><span style="font-size:1em;">${r.cost} 🐾</span></div>
      </div>
      <div style="margin:4px 0 0 0; font-size:1.1em; color:#35776e;">${r.desc}</div>
      <div style="font-size:0.92em; color:#888;">${r.category}</div>
      <div style="font-size:0.9em; color:#665;">${r.bonus ? 'Bonus: '+r.bonus : ''}</div>
      <div style="font-size:0.92em;color:#3c7779;">Left: ${r.quantity??'∞'}</div>
      <div style="margin-top:10px;">`;
    if (!isDemo() && isQM) {
      html += `<button class="edit-btn" onclick="editReward(${r.id})">✏️ Edit</button>
               <button class="delete-btn" onclick="deleteReward(${r.id})">🗑️ Delete</button>`;
    } else if (!isDemo() && (r.quantity??1)>0) {
      html += `<button class="paw-action-btn" onclick="claimReward(${r.id})">Claim</button>`;
    }
    html += `</div></div>`;
  });
  document.getElementById('page-shop').innerHTML = `<h2>Reward Store</h2>${html}`;
  document.getElementById('page-shop').onclick = filterHandler('rewards', renderShop);
}

// ====== CLAIMED REWARDS =======
function renderClaimedRewards() {
  const user = getUserData();
  const isQM = user.profile.role === 'Questmaster';
  let claimed = user.claimed || [];
  let html = `<h2>Claimed Rewards</h2>`;
  if (claimed.length === 0) html += "<div>No claimed rewards.</div>";
  claimed.forEach((c, i) => {
    html += `<div class="card" style="position:relative;overflow:hidden;">
      <div><span style="font-size:1.5em">${c.emoji}</span> <b>${c.name}</b> (${c.category})</div>
      <div>${c.desc}</div>
      <div>Cost: ${c.cost} 🐾</div>
      <div>${c.bonus ? 'Bonus: ' + c.bonus : ''}</div>
      <div style="margin-top:6px;">`;
    if (c.received) {
      html += `<div style="margin:10px 0 0 0;display:flex;align-items:center;gap:8px;">
        <span style="
          display:inline-block;
          width:40px;height:40px;
          border-radius:50%;background:#eafff8;border:2.5px solid #74ccb3;
          transform: rotate(30deg);
          position:relative;
          box-shadow:0 2px 8px #6fedd140;">
          <span style="font-size:2em;position:absolute;top:2px;left:5px;">🐾</span>
        </span>
        <span style="font-size:1.1em;font-weight:bold;color:#388064;">Reward received</span>
      </div>`;
    } else {
      if (isQM) {
        html += `<button class="fancy-btn" onclick="markRewardReceived(${c.id})">Mark as received</button>`;
      } else {
        html += `<span style="color:#888;font-size:1.05em;">Waiting for confirmation...</span>`;
      }
    }
    html += `</div></div>`;
  });
  document.getElementById('page-rewards').innerHTML = html;
}

// ====== SETTINGS =======
function renderSettings() {
  let html = "";
  if (isDemo()) {
    html += `<div class="demo-hint">Настройки доступны только после регистрации.</div>
      <div>
        <button class="fancy-btn demo-disabled" disabled>Switch theme</button>
        <button class="fancy-btn demo-disabled" disabled>Open archive</button>
        <button class="fancy-btn demo-disabled" disabled>Edit categories</button>
        <button class="fancy-btn demo-disabled" disabled>Reset all data</button>
      </div>`;
  } else {
    html += `
      <div>
        <button class="fancy-btn" id="theme-switcher">Switch theme</button>
        <button class="fancy-btn" id="archive-open">Open archive</button>
        <button class="fancy-btn" id="edit-categories">Edit categories</button>
        <button class="fancy-btn" id="reset-all-data">Reset all data</button>
      </div>
    `;
  }
  document.getElementById('page-settings').innerHTML = `<h2>Settings</h2>${html}`;
}

// ====== CRUD Quests ======
function openQuestModal(id) {
  let user = getUserData(), isEdit = !!id;
  let quest = isEdit ? user.quests.find(q=>q.id===id) : { type: 'daily', name: '', emoji: DEFAULT_EMOJI[0], category: getUserData().categories[0]?.name||"Goal", desc: '', pts: 1, done: false };
  let types = ["daily","weekly","event"].map(t => `<option${quest.type===t?" selected":""}>${t}</option>`).join('');
  let html = `<h3>${isEdit ? "Edit" : "Add"} Quest</h3>
    <label>Type <select id="quest-type">${types}</select></label>
    <label>Name <input id="quest-name" value="${quest.name||""}"></label>
    <label>Category ${categoryDropdown(quest.category)}</label>
    <label>Emoji ${emojiDropdown(quest.emoji)}</label>
    <label>Description <input id="quest-desc" value="${quest.desc||""}"></label>
    <label>Points <input id="quest-pts" type="number" min="1" value="${quest.pts||1}"></label>
    <button class="fancy-btn" onclick="${isEdit ? `saveQuest(${quest.id})` : 'saveQuest()'}">Save</button>
    <button class="fancy-btn" onclick="closeModal()">Cancel</button>
    <div id="emoji-picker-anchor"></div>`;
  openModal(html);
  setupQuestModalDropdowns();
}
function setupQuestModalDropdowns() {
  document.getElementById('cat-select').addEventListener('change', function() {
    if(this.value==="add-cat") {
      let emoji = prompt("Enter emoji for new category:");
      let name = prompt("Category name:");
      if(emoji && name) {
        getUserData().categories.push({emoji, name});
        saveData();
        openQuestModal();
      }
    }
  });
  document.getElementById('emoji-select').addEventListener('change', function() {
    if(this.value==="add-custom") {
      let emoji = prompt("Enter custom emoji:");
      if(emoji) {
        getUserData().customEmojis = getUserData().customEmojis || [];
        getUserData().customEmojis.push(emoji);
        saveData();
        openQuestModal();
      }
    }
  });
}
function saveQuest(id) {
  let user = getUserData();
  let quest = {
    id: id || (Math.random()*1e8)|0,
    type: document.getElementById('quest-type').value,
    name: document.getElementById('quest-name').value,
    category: document.getElementById('cat-select').value.replace(/^.*?\s/,''),
    emoji: document.getElementById('emoji-select').value,
    desc: document.getElementById('quest-desc').value,
    pts: parseInt(document.getElementById('quest-pts').value,10),
    done: false,
    lastDone: null
  };
  if(!quest.name || !quest.emoji) return alert("Fill all fields");
  if(id) {
    let idx = user.quests.findIndex(q=>q.id===id);
    if (idx !== -1) user.quests[idx]=quest;
  } else user.quests.push(quest);
  saveData(); closeModal(); renderQuests();
}
function editQuest(id) { openQuestModal(id); }

function completeQuest(id) {
  let user = getUserData(); let q = user.quests.find(q=>q.id===id);
  q.done = true; q.lastDone = Date.now();
  user.points += q.pts;
  user.completed.push({...q, completedAt: Date.now() });
  if(q.type==="event") user.quests = user.quests.filter(qq=>qq.id!==id);
  saveData(); renderQuests(); updateUIUser(); renderStatsPage();
}
window.completeQuest = completeQuest;


// ====== CRUD Rewards ======
function openRewardModal(id) {
  let user = getUserData();
  let isEdit = !!id;
  let r = isEdit ? user.rewards.find(r=>r.id===id) : { name: '', emoji: DEFAULT_EMOJI[0], category: user.categories[0]?.name||"Goal", desc: '', cost: 1, bonus: '', quantity: 1 };
  let html = `<h3>${isEdit ? "Edit" : "Add"} Reward</h3>
    <label>Name <input id="reward-name" value="${r.name||""}"></label>
    <label>Category ${categoryDropdown(r.category)}</label>
    <label>Emoji ${emojiDropdown(r.emoji)}</label>
    <label>Description <input id="reward-desc" value="${r.desc||""}"></label>
    <label>Cost <input id="reward-cost" type="number" min="1" value="${r.cost||1}"></label>
    <label>Bonus <input id="reward-bonus" value="${r.bonus||""}"></label>
    <label>Quantity <input id="reward-quantity" type="number" min="0" value="${r.quantity??1}"></label>
    <button class="fancy-btn" onclick="${isEdit ? `saveReward(${r.id})` : 'saveReward()'}">Save</button>
    <button class="fancy-btn" onclick="closeModal()">Cancel</button>`;
  openModal(html);
  setupRewardModalDropdowns();
}
function setupRewardModalDropdowns() {
  document.getElementById('cat-select').addEventListener('change', function() {
    if(this.value==="add-cat") {
      let emoji = prompt("Enter emoji for new category:");
      let name = prompt("Category name:");
      if(emoji && name) {
        getUserData().categories.push({emoji, name});
        saveData(); openRewardModal();
      }
    }
  });
  document.getElementById('emoji-select').addEventListener('change', function() {
    if(this.value==="add-custom") {
      let emoji = prompt("Enter custom emoji:");
      if(emoji) {
        getUserData().customEmojis = getUserData().customEmojis || [];
        getUserData().customEmojis.push(emoji); saveData(); openRewardModal();
      }
    }
  });
}
function saveReward(id) {
  const user = getUserData();
  let reward = {
    id: id || (Math.random()*1e8)|0,
    name: document.getElementById('reward-name').value,
    category: document.getElementById('cat-select').value.replace(/^.*?\s/,''),
    emoji: document.getElementById('emoji-select').value,
    desc: document.getElementById('reward-desc').value,
    cost: parseInt(document.getElementById('reward-cost').value,10),
    bonus: document.getElementById('reward-bonus').value,
    quantity: parseInt(document.getElementById('reward-quantity').value,10)
  };
  if(!reward.name || !reward.emoji) return alert("Fill all fields");
  if(id) {
    let idx = user.rewards.findIndex(r=>r.id===id);
    if (idx !== -1) user.rewards[idx] = reward;
  } else user.rewards.push(reward);
  saveData(); closeModal(); renderShop();
}
function editReward(id) { openRewardModal(id); }

function claimReward(id) {
  let user = getUserData(); let r = user.rewards.find(r=>r.id===id);
  if (user.points < r.cost) return alert("Not enough paws!");
  if (r.quantity !== undefined && r.quantity <= 0) return alert("Out of stock!");
  user.points -= r.cost;
  r.quantity = (r.quantity ?? Infinity) - 1;
  user.claimed.push({
    id: (Math.random()*1e8)|0,
    name: r.name, emoji: r.emoji, category: r.category, desc: r.desc,
    cost: r.cost, bonus: r.bonus, claimedAt: Date.now(), received: false
  });
  saveData(); renderShop(); updateUIUser(); renderStatsPage();
}

// ====== CLAIMED REWARD BUTTON ======
function markRewardReceived(id) {
  const user = getUserData();
  let reward = user.claimed.find(r => r.id === id);
  if (reward) {
    reward.received = true;
    saveData();
    renderClaimedRewards();
  }
}
window.markRewardReceived = markRewardReceived;

// ====== Роли ======
function renderUserMenuRoleSwitch() {
  if (isDemo()) return '';
  let role = getUserData().profile.role;
  let other = role === "Questmaster" ? "Performer" : "Questmaster";
  return `<button class="user-menu-item" id="switch-role" type="button">${role} (Switch to ${other})</button>`;
}

// ====== Статистика ======
function renderStatsPage() {
  let user = getUserData();
  let catStats = {};
  user.completed.forEach(c => { catStats[c.category]=catStats[c.category]||0; catStats[c.category]++; });
  user.claimed.forEach(c => { catStats[c.category]=catStats[c.category]||0; });
  let html = `<h2>Statistics</h2>
    <div><b>Completed quests by category:</b><ul>${
      Object.entries(catStats).map(([cat,qty])=>`<li>${cat}: ${qty}</li>`).join('')
    }</ul></div>
    <div><b>Total rewards claimed:</b> ${user.claimed.length}</div>
    <button class="fancy-btn" onclick="showPage('home')">Back</button>`;
  document.getElementById('page-statistics').innerHTML = html;
}

// ====== UI & NAV ======
function updateUIUser() {
  document.getElementById('paw-balance-val').textContent = getUserData().points ?? 0;
  if (isDemo()) {
    document.getElementById('user-menu').style.display = "none";
    document.getElementById('show-user-menu').disabled = true;
  } else {
    document.getElementById('show-user-menu').disabled = false;
  }
}
function renderAll() {
  loadData(); resetDailiesAndWeeklies(); updateUIUser();
  renderHome();
  renderQuests();
  renderShop();
  renderClaimedRewards();
  renderStatsPage();
  renderSettings();

  let menu = document.getElementById('user-menu');
  menu.innerHTML = `
    <button class="user-menu-item" id="user-menu-edit-profile" type="button">Edit profile</button>
    <button class="user-menu-item" id="user-menu-change-password" type="button">Change password</button>
    <button class="user-menu-item" id="user-menu-statistics" type="button">Statistics</button>
    ${renderUserMenuRoleSwitch()}
    <button class="user-menu-item" id="user-menu-logout" type="button">Logout</button>
  `;
  document.getElementById('user-menu-edit-profile').onclick = function(e) {
    e.stopPropagation();
    openModal(`<h3>Edit Profile</h3>
      <label>Username <input type="text" value="${getUserData().profile.username}" disabled></label>
      <button class="fancy-btn" onclick="closeModal()">Close</button>
    `); closeUserMenu();
  };
  document.getElementById('user-menu-change-password').onclick = function(e) {
    e.stopPropagation();
    openModal(`<h3>Change Password</h3>
      <label>New Password <input type="password"></label>
      <button class="fancy-btn" onclick="alert('Change not implemented')">Change</button>
    `); closeUserMenu();
  };
  document.getElementById('user-menu-statistics').onclick = function(e) {
    e.stopPropagation();
    showPage('statistics'); closeUserMenu();
  };
  let switchRoleBtn = document.getElementById('switch-role');
  if (switchRoleBtn) switchRoleBtn.onclick = function(e) {
    e.stopPropagation();
    let user = getUserData();
    user.profile.role = user.profile.role === "Questmaster" ? "Performer" : "Questmaster";
    saveData(); renderAll(); closeUserMenu();
  };
  document.getElementById('user-menu-logout').onclick = function(e) {
    e.stopPropagation();
    openModal(`<h3>Logout</h3>
      <p>Are you sure you want to logout?</p>
      <button class="fancy-btn" onclick="window.logout()">Yes, logout</button>
      <button class="fancy-btn" onclick="closeModal()">Cancel</button>
    `); closeUserMenu();
  };
}

// ====== NAV & MODALS ======
const navLinks = document.querySelectorAll('nav.bottom a');
const pages = document.querySelectorAll('.page');
const pawBalance = document.getElementById('paw-balance');
function showPage(pageId) {
  pages.forEach(p => p.classList.remove('active'));
  navLinks.forEach(n => n.classList.remove('active'));
  document.getElementById('page-' + pageId).classList.add('active');
  navLinks.forEach(n => {
    if (n.getAttribute('data-page') === pageId) n.classList.add('active');
  });
  pawBalance.style.display = (pageId === "settings") ? "none" : "flex";
  closeUserMenu();
  closeModal();
  closeEmojiPicker();
}
navLinks.forEach(link => {
  link.addEventListener('click', e => {
    e.preventDefault();
    const page = link.getAttribute('data-page');
    showPage(page);
  });
});
const showUserMenuBtn = document.getElementById('show-user-menu');
const userMenu = document.getElementById('user-menu');
function openUserMenu() { userMenu.style.display = "block"; }
function closeUserMenu() { userMenu.style.display = "none"; }
showUserMenuBtn.addEventListener('click', e => {
  e.stopPropagation();
  if (userMenu.style.display === "block") closeUserMenu();
  else openUserMenu();
});
document.body.addEventListener('click', e => {
  if (userMenu.style.display === "block") closeUserMenu();
});
userMenu.addEventListener('click', e => e.stopPropagation());
const modalBg = document.getElementById('modal-bg');
function openModal(contentHtml = "") {
  document.getElementById('modal-content').innerHTML = contentHtml;
  modalBg.style.display = "flex";
}
function closeModal() { modalBg.style.display = "none"; }
modalBg.addEventListener('click', e => { if (e.target === modalBg) closeModal(); });
const emojiPickerModal = document.getElementById('emoji-picker-modal');
function openEmojiPicker() {
  emojiPickerModal.style.display = "flex";
  document.getElementById('emoji-input').focus();
}
function closeEmojiPicker() { emojiPickerModal.style.display = "none"; }
emojiPickerModal.addEventListener('click', e => { if (e.target === emojiPickerModal) closeEmojiPicker(); });
document.addEventListener('keydown', e => {
  if (e.key === "Escape") {
    closeModal(); closeUserMenu(); closeEmojiPicker();
  }
});

// ====== On Load ======
window.onload = function () { loadData(); renderAll(); };
window.openQuestModal = openQuestModal;
window.openRewardModal = openRewardModal;
window.logout = logout;
function logout() {
  logoutUser();
  localStorage.removeItem('pawFamilyId');
  localStorage.removeItem('pawCurrentUser');
  location.reload();
}
window.logout = logout;
