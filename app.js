// ======= Основные переменные и структура =======
let currentUser = localStorage.getItem('pawCurrentUser') || "";
let userRole = "performer"; // performer | questmaster
let data = {}; // { [username]: { profile, points, role, quests, rewards, completed, claimed, categories, archive } }
let DEMO_USER = "demo";
let DEFAULT_CATEGORIES = [
  { emoji: "🎯", name: "Goal" },
  { emoji: "📚", name: "Study" },
  { emoji: "🧹", name: "Cleaning" },
  { emoji: "💪", name: "Sport" },
  { emoji: "🌿", name: "Nature" },
  { emoji: "📝", name: "Note" },
  { emoji: "🧠", name: "Growth" },
  { emoji: "🎁", name: "Gift" },
  { emoji: "🍫", name: "Sweets" },
  { emoji: "☕", name: "Coffee" },
  { emoji: "🛋️", name: "Rest" },
  { emoji: "🎮", name: "Games" },
  { emoji: "🧸", name: "Cute" }
];

// ======= Демо-данные и инициализация =======
function getDemoData() {
  return {
    profile: { username: DEMO_USER, password: "demo", role: "performer" },
    points: 12,
    quests: [
      { type: 'daily', name: 'Feed the cat', emoji: '🧑‍🍳', category: "Goal", desc: 'Give breakfast to your cat', pts: 3 },
      { type: 'daily', name: 'Morning walk', emoji: '🚶‍♂️', category: "Sport", desc: '10 min walk in the park', pts: 2 },
      { type: 'weekly', name: 'Clean up room', emoji: '🧹', category: "Cleaning", desc: 'Tidy up your room', pts: 5 },
      { type: 'event', name: 'Birthday surprise', emoji: '🎉', category: "Gift", desc: 'Organize a surprise', pts: 10 }
    ],
    completed: [
      { type: 'daily', name: 'Brush teeth', emoji: '🦷', category: "Goal", desc: 'Morning and evening', pts: 1, completedAt: Date.now() - 864e5 }
    ],
    rewards: [
      { name: 'Chocolate bar', emoji: '🍫', category: "Sweets", desc: 'Sweet treat', cost: 6, bonus: "" },
      { name: 'Coffee break', emoji: '☕', category: "Coffee", desc: 'Nice coffee', cost: 8, bonus: "" },
      { name: 'Movie night', emoji: '🎬', category: "Rest", desc: 'Movie with popcorn', cost: 14, bonus: "" },
      { name: 'Cute sticker', emoji: '🧸', category: "Cute", desc: 'Sticker for notebook', cost: 2, bonus: "" }
    ],
    claimed: [
      { name: 'Donut', emoji: '🍩', category: "Sweets", desc: 'Yummy donut', cost: 5, claimedAt: Date.now() - 6 * 3600e3, done: true, bonus: "" }
    ],
    archive: [],
    categories: [...DEFAULT_CATEGORIES]
  };
}

// ======= Хранилище данных =======
function loadData() {
  let raw = localStorage.getItem('pawData');
  if (raw) {
    data = JSON.parse(raw);
  } else {
    data = {};
    data[DEMO_USER] = getDemoData();
    saveData();
  }
}
function saveData() {
  localStorage.setItem('pawData', JSON.stringify(data));
}
function getUserData() {
  if (!currentUser || !data[currentUser]) return data[DEMO_USER];
  return data[currentUser];
}
function setUser(username) {
  currentUser = username;
  localStorage.setItem('pawCurrentUser', currentUser);
}
function logout() {
  currentUser = "";
  localStorage.removeItem('pawCurrentUser');
  renderAll();
}

// ======= Авторизация =======
function showLoginModal() {
  openModal(`
    <h3>Sign In</h3>
    <label>Username <input id="login-username" type="text" autocomplete="username"></label>
    <label>Password <input id="login-password" type="password" autocomplete="current-password"></label>
    <button onclick="doLogin()">Sign In</button>
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
    document.getElementById('login-error').textContent = "Enter both fields";
    return;
  }
  if (!data[username] || data[username].profile.password !== password) {
    document.getElementById('login-error').textContent = "Wrong username or password";
    return;
  }
  setUser(username);
  closeModal();
  renderAll();
};

function showRegisterModal() {
  openModal(`
    <h3>Register</h3>
    <label>Username <input id="register-username" type="text" autocomplete="username"></label>
    <label>Password <input id="register-password" type="password" autocomplete="new-password"></label>
    <button onclick="doRegister()">Register</button>
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
    document.getElementById('register-error').textContent = "Enter both fields";
    return;
  }
  if (data[username]) {
    document.getElementById('register-error').textContent = "User already exists";
    return;
  }
  data[username] = {
    profile: { username, password, role: "performer" },
    points: 0,
    quests: [],
    completed: [],
    rewards: [],
    claimed: [],
    archive: [],
    categories: [...DEFAULT_CATEGORIES]
  };
  saveData();
  setUser(username);
  closeModal();
  renderAll();
};

// ======= Категории =======
function getAllCategories() {
  let userData = getUserData();
  return userData.categories || [...DEFAULT_CATEGORIES];
}
function addCategory(emoji, name) {
  let userData = getUserData();
  userData.categories.push({ emoji, name });
  saveData();
  renderAll();
}

// ======= Демо-режим =======
function isDemo() {
  return !currentUser || currentUser === DEMO_USER;
}

// ======= UI: обновление баланса и меню =======
function updateUIUser() {
  // Баланс
  document.getElementById('paw-balance-val').textContent = getUserData().points ?? 0;
  // User menu (show/hide)
  if (isDemo()) {
    document.getElementById('user-menu').style.display = "none";
    document.getElementById('show-user-menu').disabled = true;
  } else {
    document.getElementById('show-user-menu').disabled = false;
  }
}

// ======= Render: запуск приложения =======
function renderAll() {
  loadData();
  updateUIUser();
  // Если не залогинен — показать логин
  if (!currentUser || !data[currentUser]) {
    showLoginModal();
    return;
  }
  // (В дальнейшем — остальные страницы и данные)
}

// ======= Навигация и модалки (оставляем из прошлого этапа) =======
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
function closeModal() {
  modalBg.style.display = "none";
}
modalBg.addEventListener('click', e => {
  if (e.target === modalBg) closeModal();
});

const emojiPickerModal = document.getElementById('emoji-picker-modal');
function openEmojiPicker() {
  emojiPickerModal.style.display = "flex";
  document.getElementById('emoji-input').focus();
}
function closeEmojiPicker() {
  emojiPickerModal.style.display = "none";
}
emojiPickerModal.addEventListener('click', e => {
  if (e.target === emojiPickerModal) closeEmojiPicker();
});
document.addEventListener('keydown', e => {
  if (e.key === "Escape") {
    closeModal();
    closeUserMenu();
    closeEmojiPicker();
  }
});

// ======= CRUD Quests =======

function renderQuests() {
  const userData = getUserData();
  const list = userData.quests || [];
  const completed = userData.completed || [];
  const isAdmin = userData.profile.role === 'questmaster';
  let html = "";

  html += `<button class="paw-action-btn" onclick="openQuestModal()">+ Add quest</button>`;
  html += `<div>`;
  if (list.length === 0) html += `<div>No quests yet.</div>`;
  list.forEach((q, i) => {
    html += `
    <div class="card ${q.type}">
      <div style="display:flex;justify-content:space-between;align-items:center;">
        <div>
          <span style="font-size:1.5em;">${q.emoji}</span>
          <b>${q.name}</b>
        </div>
        <div>
          <span style="font-size:1em;">${q.pts} 🐾</span>
        </div>
      </div>
      <div style="margin:4px 0 0 0; font-size:0.97em; color:#35776e;">
        <span>${q.desc}</span>
      </div>
      <div style="font-size:0.92em; color:#888;">${q.type}, ${q.category}</div>
      <div style="margin-top:6px;">`;
    if (isAdmin) {
      html += `<button onclick="editQuest(${i})">Edit</button>
               <button onclick="deleteQuest(${i})">Delete</button>`;
    } else {
      html += `<button onclick="completeQuest(${i})">Mark done</button>`;
    }
    html += `</div></div>`;
  });
  html += `</div>`;

  // Completed list
  html += `<h3>Completed today</h3><div>`;
  const today = new Date();
  const dayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  let todayCompleted = completed.filter(c => c.completedAt >= dayStart);
  if (todayCompleted.length === 0) html += `<div>No quests completed today.</div>`;
  todayCompleted.forEach(c =>
    html += `<div class="card ${c.type}">
      <span style="font-size:1.4em;">${c.emoji}</span>
      <span>${c.name}</span>
      <span style="font-size:0.95em;color:#888;">(${c.type}, ${c.category})</span>
    </div>`);
  html += `</div>`;

  document.getElementById('page-quests').innerHTML = `<h2>Quests</h2>${html}`;
}

// Добавление/редактирование квеста
window.openQuestModal = function(idx) {
  const userData = getUserData();
  let isEdit = (typeof idx === "number");
  let quest = isEdit ? userData.quests[idx] : { type: 'daily', name: '', emoji: '', category: '', desc: '', pts: 1 };
  let cats = (userData.categories || []).map(c => `<option>${c.emoji} ${c.name}</option>`).join('');
  let types = ["daily","weekly","event"].map(t => `<option${quest.type===t?" selected":""}>${t}</option>`).join('');
  let html = `
    <h3>${isEdit ? "Edit" : "Add"} Quest</h3>
    <label>Type <select id="quest-type">${types}</select></label>
    <label>Name <input id="quest-name" value="${quest.name||""}"></label>
    <label>Category 
      <select id="quest-cat">${cats}</select>
      <button type="button" onclick="openEmojiPickerForCategory()">+ New</button>
    </label>
    <label>Emoji <input id="quest-emoji" value="${quest.emoji||""}" maxlength="2"></label>
    <label>Description <input id="quest-desc" value="${quest.desc||""}"></label>
    <label>Points <input id="quest-pts" type="number" min="1" value="${quest.pts||1}"></label>
    <button onclick="${isEdit ? `saveQuest(${idx})` : 'saveQuest()'}">Save</button>
    <button onclick="closeModal()">Cancel</button>
  `;
  openModal(html);
};

window.saveQuest = function(idx) {
  const userData = getUserData();
  let quest = {
    type: document.getElementById('quest-type').value,
    name: document.getElementById('quest-name').value,
    category: document.getElementById('quest-cat').value.replace(/^.*?\s/,''),
    emoji: document.getElementById('quest-emoji').value,
    desc: document.getElementById('quest-desc').value,
    pts: parseInt(document.getElementById('quest-pts').value)
  };
  if (!quest.name || !quest.emoji) return alert("Fill all fields");
  if (typeof idx === "number") userData.quests[idx] = quest;
  else userData.quests.push(quest);
  saveData(); closeModal(); renderQuests();
};
window.editQuest = function(idx) { openQuestModal(idx); }
window.deleteQuest = function(idx) {
  if (!confirm("Delete this quest?")) return;
  const userData = getUserData();
  userData.quests.splice(idx, 1);
  saveData(); renderQuests();
}
window.completeQuest = function(idx) {
  const userData = getUserData();
  let quest = userData.quests[idx];
  userData.points += quest.pts;
  userData.completed.push({...quest, completedAt: Date.now() });
  saveData();
  renderQuests(); updateUIUser();
};

// ======= CRUD Rewards =======

function renderRewards() {
  const userData = getUserData();
  const rewards = userData.rewards || [];
  const claimed = userData.claimed || [];
  const isAdmin = userData.profile.role === 'questmaster';
  let html = "";

  html += `<button class="paw-action-btn" onclick="openRewardModal()">+ Add reward</button>`;
  html += `<div>`;
  if (rewards.length === 0) html += `<div>No rewards yet.</div>`;
  rewards.forEach((r, i) => {
    html += `
    <div class="card">
      <div style="display:flex;justify-content:space-between;align-items:center;">
        <div>
          <span style="font-size:1.5em;">${r.emoji}</span>
          <b>${r.name}</b>
        </div>
        <div>
          <span style="font-size:1em;">${r.cost} 🐾</span>
        </div>
      </div>
      <div style="margin:4px 0 0 0; font-size:0.97em; color:#35776e;">
        <span>${r.desc}</span>
      </div>
      <div style="font-size:0.92em; color:#888;">${r.category}</div>
      <div style="font-size:0.9em; color:#665;">${r.bonus ? 'Bonus: '+r.bonus : ''}</div>
      <div style="margin-top:6px;">`;
    if (isAdmin) {
      html += `<button onclick="editReward(${i})">Edit</button>
               <button onclick="deleteReward(${i})">Delete</button>`;
    } else {
      html += `<button onclick="claimReward(${i})">Claim</button>`;
    }
    html += `</div></div>`;
  });
  html += `</div>`;

  // Claimed list
  html += `<h3>Claimed rewards</h3><div>`;
  if (claimed.length === 0) html += `<div>No rewards claimed yet.</div>`;
  claimed.forEach(c =>
    html += `<div class="card">
      <span style="font-size:1.4em;">${c.emoji}</span>
      <span>${c.name}</span>
      <span style="font-size:0.95em;color:#888;">(${c.category})</span>
    </div>`);
  html += `</div>`;

  document.getElementById('page-rewards').innerHTML = `<h2>Claimed Rewards</h2>${html}`;
}

// Добавление/редактирование награды
window.openRewardModal = function(idx) {
  const userData = getUserData();
  let isEdit = (typeof idx === "number");
  let r = isEdit ? userData.rewards[idx] : { name: '', emoji: '', category: '', desc: '', cost: 1, bonus: '' };
  let cats = (userData.categories || []).map(c => `<option>${c.emoji} ${c.name}</option>`).join('');
  let html = `
    <h3>${isEdit ? "Edit" : "Add"} Reward</h3>
    <label>Name <input id="reward-name" value="${r.name||""}"></label>
    <label>Category 
      <select id="reward-cat">${cats}</select>
      <button type="button" onclick="openEmojiPickerForCategory()">+ New</button>
    </label>
    <label>Emoji <input id="reward-emoji" value="${r.emoji||""}" maxlength="2"></label>
    <label>Description <input id="reward-desc" value="${r.desc||""}"></label>
    <label>Cost <input id="reward-cost" type="number" min="1" value="${r.cost||1}"></label>
    <label>Bonus <input id="reward-bonus" value="${r.bonus||""}"></label>
    <button onclick="${isEdit ? `saveReward(${idx})` : 'saveReward()'}">Save</button>
    <button onclick="closeModal()">Cancel</button>
  `;
  openModal(html);
};

window.saveReward = function(idx) {
  const userData = getUserData();
  let reward = {
    name: document.getElementById('reward-name').value,
    category: document.getElementById('reward-cat').value.replace(/^.*?\s/,''),
    emoji: document.getElementById('reward-emoji').value,
    desc: document.getElementById('reward-desc').value,
    cost: parseInt(document.getElementById('reward-cost').value),
    bonus: document.getElementById('reward-bonus').value
  };
  if (!reward.name || !reward.emoji) return alert("Fill all fields");
  if (typeof idx === "number") userData.rewards[idx] = reward;
  else userData.rewards.push(reward);
  saveData(); closeModal(); renderRewards();
};
window.editReward = function(idx) { openRewardModal(idx); }
window.deleteReward = function(idx) {
  if (!confirm("Delete this reward?")) return;
  const userData = getUserData();
  userData.rewards.splice(idx, 1);
  saveData(); renderRewards();
}
window.claimReward = function(idx) {
  const userData = getUserData();
  let reward = userData.rewards[idx];
  if (userData.points < reward.cost) return alert("Not enough paws!");
  userData.points -= reward.cost;
  userData.claimed.push({...reward, claimedAt: Date.now() });
  saveData();
  renderRewards(); updateUIUser();
};

// ======= Категории (создание через emoji picker) =======
window.openEmojiPickerForCategory = function() {
  closeModal();
  openEmojiPicker();
  document.getElementById('emoji-picker-confirm').onclick = function() {
    let emoji = document.getElementById('emoji-input').value;
    if (!emoji) { alert("Choose emoji"); return; }
    let name = prompt("Category name:");
    if (!name) { alert("Enter name"); return; }
    addCategory(emoji, name);
    closeEmojiPicker();
    // Перерисуй модалку где была открыта
    renderAll();
  }
};

// ======= Роли =======
window.toggleRole = function() {
  const userData = getUserData();
  userData.profile.role = (userData.profile.role === 'questmaster') ? 'performer' : 'questmaster';
  saveData();
  renderAll();
};

// ======= Статистика (Home) =======
function renderStats() {
  const userData = getUserData();
  const completed = userData.completed || [];
  const claimed = userData.claimed || [];
  let html = `<div style="display:flex;gap:18px;justify-content:center;">
    <div><b>Completed quests:</b> ${completed.length}</div>
    <div><b>Claimed rewards:</b> ${claimed.length}</div>
  </div>`;
  document.getElementById('short-stats').innerHTML = html;
}

// ======= Перерисовка страниц =======
function renderAll() {
  loadData();
  updateUIUser();
  if (!currentUser || !data[currentUser]) {
    showLoginModal();
    return;
  }
  renderStats();
  renderQuests();
  renderRewards();
  // Можно добавить аналогичные render-функции для shop/archive/statistics/settings
}

// ======= On Page Load =======
window.onload = function () {
  loadData();
  renderAll();
  // User menu demo actions
  document.getElementById('user-menu-edit-profile').onclick = function() {
    openModal(`<h3>Edit Profile</h3>
      <label>Username <input type="text" value="${getUserData().profile.username}" disabled></label>
      <button onclick="closeModal()">Close</button>
    `); closeUserMenu();
  };
  document.getElementById('user-menu-change-password').onclick = function() {
    openModal(`<h3>Change Password</h3>
      <label>New Password <input type="password"></label>
      <button onclick="alert('Change not implemented')">Change</button>
    `); closeUserMenu();
  };
  document.getElementById('user-menu-statistics').onclick = function() {
    showPage('statistics'); closeUserMenu();
  };
  document.getElementById('user-menu-logout').onclick = function() {
    openModal(`<h3>Logout</h3>
      <p>Are you sure you want to logout?</p>
      <button onclick="window.logout()">Yes, logout</button>
      <button onclick="closeModal()">Cancel</button>
    `); closeUserMenu();
  };
  document.getElementById('emoji-picker-confirm').onclick = function() {
    let emoji = document.getElementById('emoji-input').value;
    alert('Selected emoji: ' + emoji);
    closeEmojiPicker();
  };
};

// ======= Для теста в консоли =======
window.showLoginModal = showLoginModal;
window.showRegisterModal = showRegisterModal;
window.openEmojiPicker = openEmojiPicker;
window.logout = logout;
