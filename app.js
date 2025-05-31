// === Firebase full sync + English interface + quest categories editor and all CRUD functionality ===
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

// ====== Modal helpers for dropdowns ======
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

// ====== CRUD Quests ======
function openQuestModal(id) {
  let user = getUserData(), isEdit = !!id;
  let quest = isEdit && user?.quests ? user.quests.find(q=>q.id===id) : { type: 'daily', name: '', emoji: DEFAULT_EMOJI[0], category: user?.categories?.[0]?.name||"Goal", desc: '', pts: 1, done: false };
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
window.openQuestModal = openQuestModal;

function saveQuest(id) {
  let user = getUserData();
  if (!user) return;
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
  if(id && user.quests) {
    let idx = user.quests.findIndex(q=>q.id===id);
    if (idx !== -1) user.quests[idx]=quest;
  } else if (user.quests) user.quests.push(quest);
  saveData(); closeModal(); renderQuests();
}
window.saveQuest = saveQuest;

function editQuest(id) { openQuestModal(id); }
window.editQuest = editQuest;

function deleteQuest(id) {
  let user = getUserData();
  if (!user || !user.quests) return;
  if (!confirm("Delete this quest?")) return;
  user.quests = user.quests.filter(q => q.id !== id);
  saveData(); renderQuests();
}
window.deleteQuest = deleteQuest;

function completeQuest(id) {
  let user = getUserData();
  if (!user) return;
  let q = user.quests ? user.quests.find(q=>q.id===id) : null;
  if (!q) return;
  q.done = true; q.lastDone = Date.now();
  user.points += q.pts;
  user.completed = user.completed || [];
  user.completed.push({...q, completedAt: Date.now() });
  if(q.type==="event" && user.quests) user.quests = user.quests.filter(qq=>qq.id!==id);
  saveData(); renderQuests(); updateUIUser(); renderStatsPage();
}
window.completeQuest = completeQuest;

// ====== CRUD Rewards ======
function openRewardModal(id) {
  let user = getUserData();
  let isEdit = !!id;
  let r = isEdit && user?.rewards ? user.rewards.find(r=>r.id===id) : { name: '', emoji: DEFAULT_EMOJI[0], category: user?.categories?.[0]?.name||"Goal", desc: '', cost: 1, bonus: '', quantity: 1 };
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
window.openRewardModal = openRewardModal;

function saveReward(id) {
  const user = getUserData();
  if (!user) return;
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
  if(id && user.rewards) {
    let idx = user.rewards.findIndex(r=>r.id===id);
    if (idx !== -1) user.rewards[idx] = reward;
  } else if (user.rewards) user.rewards.push(reward);
  saveData(); closeModal(); renderShop();
}
window.saveReward = saveReward;

function editReward(id) { openRewardModal(id); }
window.editReward = editReward;

function deleteReward(id) {
  let user = getUserData();
  if (!user || !user.rewards) return;
  if (!confirm("Delete this reward?")) return;
  user.rewards = user.rewards.filter(r => r.id !== id);
  saveData(); renderShop();
}
window.deleteReward = deleteReward;

function claimReward(id) {
  let user = getUserData();
  if (!user) return;
  let r = user.rewards ? user.rewards.find(r=>r.id===id) : null;
  if (!r) return;
  if (user.points < r.cost) return alert("Not enough paws!");
  if (r.quantity !== undefined && r.quantity <= 0) return alert("Out of stock!");
  user.points -= r.cost;
  r.quantity = (r.quantity ?? Infinity) - 1;
  user.claimed = user.claimed || [];
  user.claimed.push({
    id: (Math.random()*1e8)|0,
    name: r.name, emoji: r.emoji, category: r.category, desc: r.desc,
    cost: r.cost, bonus: r.bonus, claimedAt: Date.now(), received: false
  });
  saveData(); renderShop(); updateUIUser(); renderStatsPage();
}
window.claimReward = claimReward;

// ====== CLAIMED REWARD BUTTON ======
function markRewardReceived(id) {
  const user = getUserData();
  if (!user || !user.claimed) return;
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
  let user = getUserData();
  let role = user?.profile?.role;
  if (!role) return '';
  let other = role === "Questmaster" ? "Performer" : "Questmaster";
  return `<button class="user-menu-item" id="switch-role" type="button">${role} (Switch to ${other})</button>`;
}

// ====== Статистика ======
function renderStatsPage() {
  let user = getUserData();
  if (!user) return;
  let catStats = {};
  (user.completed || []).forEach(c => { catStats[c.category]=catStats[c.category]||0; catStats[c.category]++; });
  (user.claimed || []).forEach(c => { catStats[c.category]=catStats[c.category]||0; });
  let html = `<h2>Statistics</h2>
    <div><b>Completed quests by category:</b><ul>${
      Object.entries(catStats).map(([cat,qty])=>`<li>${cat}: ${qty}</li>`).join('')
    }</ul></div>
    <div><b>Total rewards claimed:</b> ${(user.claimed||[]).length}</div>
    <button class="fancy-btn" onclick="showPage('home')">Back</button>`;
  document.getElementById('page-statistics').innerHTML = html;
}

// ====== UI & NAV ======
function updateUIUser() {
  const user = getUserData();
  document.getElementById('paw-balance-val').textContent = user && user.points !== undefined ? user.points : 0;
  if (isDemo()) {
    document.getElementById('user-menu').style.display = "none";
    document.getElementById('show-user-menu').disabled = true;
  } else {
    document.getElementById('show-user-menu').disabled = false;
  }
}

async function renderAll() {
  await loadData();
  resetDailiesAndWeeklies();
  updateUIUser();
  renderHome();
  renderQuests();
  renderShop();
  renderClaimedRewards();
  renderStatsPage();
  renderSettings();

  let menu = document.getElementById('user-menu');
  if (!menu) return;
  menu.innerHTML = `
    <button class="user-menu-item" id="user-menu-edit-profile" type="button">Edit profile</button>
    <button class="user-menu-item" id="user-menu-change-password" type="button">Change password</button>
    <button class="user-menu-item" id="user-menu-statistics" type="button">Statistics</button>
    ${renderUserMenuRoleSwitch()}
    <button class="user-menu-item" id="user-menu-logout" type="button">Logout</button>
  `;
  document.getElementById('user-menu-edit-profile').onclick = function(e) {
    e.stopPropagation();
    let user = getUserData();
    openModal(`<h3>Edit Profile</h3>
      <label>Username <input type="text" value="${user?.profile?.username||''}" disabled></label>
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
    if (user && user.profile) {
      user.profile.role = user.profile.role === "Questmaster" ? "Performer" : "Questmaster";
      saveData(); renderAll(); closeUserMenu();
    }
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
window.closeModal = closeModal;
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
window.onload = async function () {
  await renderAll();
};
window.logout = logout;
function logout() {
  logoutUser();
  localStorage.removeItem('pawFamilyId');
  localStorage.removeItem('pawCurrentUser');
  location.reload();
}
window.logout = logout;
