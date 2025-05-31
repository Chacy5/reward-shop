// === Firebase full sync + English interface + quest categories UI ===
import {
  registerNewUser, loginUser, logoutUser,
  getUserData as fetchUserData, updateUserData,
  getQuests, addQuest, updateQuest, deleteQuest,
  getRewards, addReward, updateReward, deleteReward
} from "./firestore-api.js";

// ====== Clean Object (No undefineds for Firestore) ======
function cleanObject(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  let out = Array.isArray(obj) ? [] : {};
  for (let k in obj) {
    if (obj[k] !== undefined) {
      out[k] = (typeof obj[k] === 'object' && obj[k] !== null) ? cleanObject(obj[k]) : obj[k];
    }
  }
  return out;
}

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

// ====== Set User ======
function setUser(username) {
  currentUser = username;
  localStorage.setItem('pawCurrentUser', username);
}

// ====== DEMO/DATA ======
function isDemo() { return !currentUser || currentUser === DEMO_USER; }

function getDemoData() {
  return {
    profile: { username: DEMO_USER, password: "demo", role: "Performer" },
    points: 100,
    quests: [
      { id: 1, type: 'daily', name: '🟢 Complete this quest', emoji: '🐾', category: "Goal", desc: 'Click "Mark done" to complete this daily quest', pts: 6, done: false, lastDone: null },
      { id: 2, type: 'event', name: '🔵 Claim a reward', emoji: '🎁', category: "Gift", desc: 'Visit the Reward Store to claim a reward', pts: 5, done: false, lastDone: null },
      { id: 3, type: 'weekly', name: '🟣 Open statistics', emoji: '📊', category: "Growth", desc: 'See your progress in the stats page', pts: 4, done: false, lastDone: null }
    ],
    completed: [],
    rewards: [
      { id: 1, name: '🏆 Motivation & Support', emoji: '🐾', category: "Sweets", desc: 'The app helps people with ADHD structure tasks, get rewarded, and see progress!', cost: 1, bonus: "Stimulates regularity", quantity: 99 },
      { id: 2, name: '🤝 Better Relationships', emoji: '💖', category: "Gift", desc: 'Joint quests and rewards teach positive reinforcement and care.', cost: 1, bonus: "Friendship & love", quantity: 99 },
      { id: 3, name: '✨ Achievements', emoji: '⭐', category: "Growth", desc: 'Feel proud — every action brings you closer to your goal!', cost: 1, bonus: "Visible growth", quantity: 99 }
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
  // Ensure categories and customEmojis exist (for old accounts)
  if (!data[currentUser].categories) data[currentUser].categories = [...DEFAULT_CATEGORIES];
  if (!data[currentUser].customEmojis) data[currentUser].customEmojis = [];
  quests = await getQuests(familyId);
  rewards = await getRewards(familyId);
}

async function saveData() {
  if (!isDemo() && currentUser && data[currentUser]) {
    await updateUserData(familyId, currentUser, cleanObject(data[currentUser]));
  }
}

// ====== Quest/Reward Periodic Reset ======
function resetDailiesAndWeeklies() {
  let user = getUserData();
  if (!user || !Array.isArray(user.quests)) return;
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

// ====== Categories Table for Quests Page ======
function renderCategoriesTable() {
  let user = getUserData();
  if (!user || !user.categories || user.categories.length === 0) return "";
  return `
    <div style="margin:10px 0 18px 0; font-size:1.08em;">
      <b>Categories:</b>
      <span style="display:inline-block; vertical-align:middle;">
        ${user.categories.map(
          c => `<span style="margin-right:12px;display:inline-block;">
                  <span style="font-size:1.36em;">${c.emoji}</span> <span>${c.name}</span>
                </span>`
        ).join('')}
        <button class="fancy-btn" style="padding:2px 10px;font-size:1em;" onclick="openCategoriesEditor()">✏️ Edit Categories</button>
      </span>
    </div>
  `;
}
function renderCategoryLabel(catName) {
  let user = getUserData();
  if (!user || !user.categories) return catName || "";
  let cat = user.categories.find(c => c.name === catName);
  if (cat) return `<span style="font-size:1.2em;">${cat.emoji}</span> ${cat.name}`;
  return catName || "";
}

// ====== Categories Editor ======
function openCategoriesEditor() {
  let user = getUserData();
  let categories = user.categories || [];
  let html = `<h3>Edit Categories</h3>
    <ul style="list-style:none;padding:0;">${
      categories.map((c,i)=>`
        <li style="margin-bottom:8px;">
          <span style="font-size:1.4em;">${c.emoji}</span>
          <input type="text" value="${c.name}" id="cat-name-${i}" style="width:70px;">
          <button onclick="removeCategory(${i})" style="margin-left:6px;">🗑️</button>
        </li>
      `).join('')
    }</ul>
    <button class="fancy-btn" onclick="addCategoryPrompt()">Add Category</button>
    <button class="fancy-btn" onclick="saveCategories()">Save</button>
    <button class="fancy-btn" onclick="closeModal()">Cancel</button>
  `;
  openModal(html);
}
window.openCategoriesEditor = openCategoriesEditor;
window.addCategoryPrompt = function addCategoryPrompt() {
  let emoji = prompt("Enter emoji:");
  let name = prompt("Category name:");
  if (emoji && name) {
    let user = getUserData();
    user.categories.push({emoji, name});
    openCategoriesEditor();
  }
};
window.removeCategory = function removeCategory(idx) {
  let user = getUserData();
  user.categories.splice(idx, 1);
  openCategoriesEditor();
};
window.saveCategories = function saveCategories() {
  let user = getUserData();
  let categories = user.categories;
  for (let i = 0; i < categories.length; ++i) {
    let val = document.getElementById(`cat-name-${i}`).value.trim();
    categories[i].name = val;
  }
  saveData();
  closeModal();
  renderAll();
};

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
  if (!data[username] || !(data[username].profile && data[username].profile.password === password)) {
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
  let emojis = [...DEFAULT_EMOJI, ...((user && user.customEmojis) || [])];
  return `<select id="emoji-select">${emojis.map(e=>`<option${selected===e?' selected':''}>${e}</option>`).join("")}
    <option value="add-custom">➕ Add custom</option></select>`;
}
function categoryDropdown(selected) {
  let cats = (getUserData() && getUserData().categories) || [];
  return `<select id="cat-select">${cats.map(c=>`<option${selected===c.name?' selected':''}>${c.emoji} ${c.name}</option>`).join("")}
    <option value="add-cat">➕ Add category</option></select>`;
}

// ====== Filtering ======
function renderFilterBar(type) {
  const user = getUserData();
  const categories = (user && user.categories ? user.categories : []).map(c => c.name);
  let html = `<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:8px;">
    <button class="filter-btn" data-filter="all">All</button>`;
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
    completed: (user?.completed || []).length,
    claimed: (user?.claimed || []).length,
    balance: user?.points || 0
  };
  let html = "";
  if (isDemo()) {
    html += `
      <div class="demo-hint">
        <b>Demo mode!</b><br>
        <span style="font-size:1.1em;">
        This game is for two (or one) people, where you get "paws" 🐾 for completing quests,
        which you can exchange for rewards and pleasant bonuses.<br><br>
        The app helps structure everyday life, motivate yourself, and support each other!
        </span>
      </div>
      <button class="demo-big-btn" onclick="showRegisterModal()">Start playing — Register</button>
      <button class="demo-big-btn" onclick="showLoginModal()">Sign In</button>
    `;
    html += `
      <div class="infograph" style="margin-top:38px;">
        <div class="infocard">
          <span class="big">${stats.balance} 🐾</span>
          Your paw balance
        </div>
        <div class="infocard">
          <span class="big">3</span>
          Demo quests to try
        </div>
        <div class="infocard">
          <span class="big">3</span>
          Sample rewards
        </div>
      </div>
      <div style="margin:18px 0 0 0; color:#189d8a; text-align:center;">Register to unlock full functionality!</div>
    `;
  } else if (user && user.profile) {
    html += `
      <div class="greeting">🐾 Welcome, <b>${user.profile.username}</b>!</div>
      <div class="infograph">
        <div class="infocard">
          <span class="big">${stats.balance} 🐾</span>
          Paw balance
        </div>
        <div class="infocard">
          <span class="big">${stats.completed}</span>
          Quests completed
        </div>
        <div class="infocard">
          <span class="big">${stats.claimed}</span>
          Rewards claimed
        </div>
      </div>
    `;
  } else {
    html += `<div class="greeting">User data loading error.</div>`;
  }
  document.getElementById('page-home').innerHTML = html;
}

// ====== QUESTS ======
function renderQuests(activeCategory = null) {
  resetDailiesAndWeeklies();
  const user = getUserData();
  const isQM = user?.profile?.role === 'Questmaster';
  let html = renderFilterBar('quests');
  if (isDemo()) {
    html += `<div class="demo-hint">Demo quests show how the app works.<br>Try completing them!</div>`;
  } else if (isQM) {
    html += `<button class="paw-action-btn" onclick="openQuestModal()">+ Add quest</button>`;
  }
  // Show categories table at the top
  html += renderCategoriesTable();
  let list = (user?.quests || []).filter(q => !q.done || q.type === "event");
  if (activeCategory) list = list.filter(q => q.category === activeCategory);
  if (list.length === 0) html += `<div>No active quests.</div>`;
  list.forEach((q, i) => {
    if (q.type !== "event" && q.done) return;
    html += `
    <div class="card ${q.type}">
      <div style="display:flex;justify-content:space-between;align-items:center;">
        <div><span style="font-size:1.5em;">${q.emoji}</span> <b>${q.name}</b></div>
        <div><span style="font-size:1em;">${q.pts} 🐾</span></div>
      </div>
      <div style="margin:4px 0 0 0; font-size:0.97em; color:#35776e;">${q.desc}</div>
      <div style="font-size:0.92em; color:#888;">${q.type}, ${renderCategoryLabel(q.category)}</div>
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

// ====== SETTINGS =======
function renderSettings() {
  let html = "";
  if (isDemo()) {
    html += `<div class="demo-hint">Settings are available after registration.</div>
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

  if (!isDemo()) {
    document.getElementById('theme-switcher').onclick = switchTheme;
    document.getElementById('archive-open').onclick = () => showPage('archive');
    document.getElementById('edit-categories').onclick = openCategoriesEditor;
    document.getElementById('reset-all-data').onclick = resetAllData;
  }
}
function switchTheme() {
  document.body.classList.toggle('dark-theme');
}
function resetAllData() {
  let user = getUserData();
  if (!confirm("Are you sure you want to reset all your data? This cannot be undone!")) return;
  user.quests = [];
  user.completed = [];
  user.rewards = [];
  user.claimed = [];
  user.points = 0;
  user.archive = [];
  saveData();
  renderAll();
}

// ====== Modal helpers for dropdowns, etc ======
function setupQuestModalDropdowns() {
  document.getElementById('cat-select').addEventListener('change', function() {
    if(this.value==="add-cat") {
      let emoji = prompt("Enter emoji for new category:");
      let name = prompt("Category name:");
      if(emoji && name) {
        let user = getUserData();
        if (user && user.categories) {
          user.categories.push({emoji, name});
          saveData();
          openQuestModal();
        }
      }
    }
  });
  document.getElementById('emoji-select').addEventListener('change', function() {
    if(this.value==="add-custom") {
      let emoji = prompt("Enter custom emoji:");
      if(emoji) {
        let user = getUserData();
        if (user) {
          user.customEmojis = user.customEmojis || [];
          user.customEmojis.push(emoji);
          saveData();
          openQuestModal();
        }
      }
    }
  });
}
function setupRewardModalDropdowns() {
  document.getElementById('cat-select').addEventListener('change', function() {
    if(this.value==="add-cat") {
      let emoji = prompt("Enter emoji for new category:");
      let name = prompt("Category name:");
      if(emoji && name) {
        let user = getUserData();
        if (user && user.categories) {
          user.categories.push({emoji, name});
          saveData(); openRewardModal();
        }
      }
    }
  });
  document.getElementById('emoji-select').addEventListener('change', function() {
    if(this.value==="add-custom") {
      let emoji = prompt("Enter custom emoji:");
      if(emoji) {
        let user = getUserData();
        if (user) {
          user.customEmojis = user.customEmojis || [];
          user.customEmojis.push(emoji); saveData(); openRewardModal();
        }
      }
    }
  });
}

// ====== Make closeModal globally available for Cancel buttons ======
window.closeModal = closeModal;

// ====== The rest of your code (renderShop, renderClaimedRewards, etc) remains the same ======
// ... (see your current app.js logic for these sections)

// ====== On Load ======
window.onload = async function () {
  await renderAll();
};
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
