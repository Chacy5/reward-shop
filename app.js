// ====== Globals and Data ======
let currentUser = localStorage.getItem('pawCurrentUser') || "";
let data = {};
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

// ====== Data Model and Demo ======
function getDemoData() {
  return {
    profile: { username: DEMO_USER, password: "demo", role: "Performer" },
    points: 12,
    quests: [
      { id: 1, type: 'daily', name: 'Feed the cat', emoji: '🐾', category: "Goal", desc: 'Give breakfast to your cat', pts: 3, done: false, lastDone: null },
      { id: 2, type: 'daily', name: 'Morning walk', emoji: '🚶‍♂️', category: "Sport", desc: '10 min walk in the park', pts: 2, done: false, lastDone: null },
      { id: 3, type: 'weekly', name: 'Clean up room', emoji: '🧹', category: "Cleaning", desc: 'Tidy up your room', pts: 5, done: false, lastDone: null },
      { id: 4, type: 'event', name: 'Birthday surprise', emoji: '🎉', category: "Gift", desc: 'Organize a surprise', pts: 10, done: false, lastDone: null }
    ],
    completed: [],
    rewards: [
      { id: 1, name: 'Chocolate bar', emoji: '🍫', category: "Sweets", desc: 'Sweet treat', cost: 6, bonus: "", quantity: 5 },
      { id: 2, name: 'Coffee break', emoji: '☕', category: "Coffee", desc: 'Nice coffee', cost: 8, bonus: "", quantity: 1 },
      { id: 3, name: 'Movie night', emoji: '🎬', category: "Rest", desc: 'Movie with popcorn', cost: 14, bonus: "", quantity: 0 },
      { id: 4, name: 'Cute sticker', emoji: '🧸', category: "Cute", desc: 'Sticker for notebook', cost: 2, bonus: "", quantity: 10 }
    ],
    claimed: [
      { id: 100, name: 'Donut', emoji: '🍩', category: "Sweets", desc: 'Yummy donut', cost: 5, claimedAt: Date.now() - 6 * 3600e3, bonus: "" }
    ],
    lastDailyReset: 0,
    lastWeeklyReset: 0,
    archive: [],
    categories: [...DEFAULT_CATEGORIES],
    customEmojis: [],
  };
}

// ====== Storage ======
function loadData() {
  let raw = localStorage.getItem('pawData');
  if (raw) data = JSON.parse(raw);
  else { data = {}; data[DEMO_USER] = getDemoData(); saveData(); }
}
function saveData() { localStorage.setItem('pawData', JSON.stringify(data)); }
function getUserData() { return (!currentUser || !data[currentUser]) ? data[DEMO_USER] : data[currentUser]; }
function setUser(username) { currentUser = username; localStorage.setItem('pawCurrentUser', currentUser); }
function logout() { currentUser = ""; localStorage.removeItem('pawCurrentUser'); renderAll(); }
function isDemo() { return !currentUser || currentUser === DEMO_USER; }

// ====== Quest/Reward Periodic Reset ======
function resetDailiesAndWeeklies() {
  let user = getUserData();
  let now = Date.now();
  // Daily
  let todayStart = new Date(); todayStart.setHours(0,0,0,0);
  if (!user.lastDailyReset || user.lastDailyReset < todayStart.getTime()) {
    user.quests.forEach(q => { if(q.type==='daily') q.done = false; });
    user.lastDailyReset = todayStart.getTime();
  }
  // Weekly (Monday 00:00)
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

// ====== CRUD Quests ======
function renderQuests() {
  resetDailiesAndWeeklies();
  const user = getUserData();
  const isQM = user.profile.role === 'Questmaster';
  let html = isQM ? `<button class="paw-action-btn" onclick="openQuestModal()">+ Add quest</button>` : "";
  let list = user.quests.filter(q=>!q.done || q.type==="event");
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
      <div style="margin-top:6px;">`;
    if (isQM) {
      html += `<button onclick="editQuest(${q.id})">Edit</button>
               <button onclick="deleteQuest(${q.id})">Delete</button>`;
    } else if (!q.done) {
      html += `<button onclick="completeQuest(${q.id})">Mark done</button>`;
    }
    html += `</div></div>`;
  });
  document.getElementById('page-quests').innerHTML = `<h2>Quests</h2>${html}`;
}
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
    <button onclick="${isEdit ? `saveQuest(${quest.id})` : 'saveQuest()'}">Save</button>
    <button onclick="closeModal()">Cancel</button>
    <div id="emoji-picker-anchor"></div>`;
  openModal(html);
  setupQuestModalDropdowns();
}
function setupQuestModalDropdowns() {
  // Category dropdown
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
  // Emoji dropdown
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
    user.quests[idx]=quest;
  } else user.quests.push(quest);
  saveData(); closeModal(); renderQuests();
}
function editQuest(id) { openQuestModal(id); }
function deleteQuest(id) {
  if (!confirm("Delete this quest?")) return;
  let user = getUserData();
  user.quests = user.quests.filter(q=>q.id!==id);
  saveData(); renderQuests();
}
function completeQuest(id) {
  let user = getUserData(); let q = user.quests.find(q=>q.id===id);
  q.done = true; q.lastDone = Date.now();
  user.points += q.pts;
  user.completed.push({...q, completedAt: Date.now() });
  if(q.type==="event") user.quests = user.quests.filter(qq=>qq.id!==id); // event удаляется
  saveData(); renderQuests(); updateUIUser(); renderStats();
}

// ====== CRUD Rewards ======
function renderShop() {
  const user = getUserData();
  const isQM = user.profile.role === 'Questmaster';
  let html = isQM ? `<button class="paw-action-btn" onclick="openRewardModal()">+ Add reward</button>` : "";
  let list = user.rewards || [];
  if (list.length === 0) html += `<div>No rewards yet.</div>`;
  list.forEach((r, i) => {
    html += `
    <div class="card">
      <div style="display:flex;justify-content:space-between;align-items:center;">
        <div><span style="font-size:1.5em;">${r.emoji}</span> <b>${r.name}</b></div>
        <div><span style="font-size:1em;">${r.cost} 🐾</span></div>
      </div>
      <div style="margin:4px 0 0 0; font-size:0.97em; color:#35776e;">${r.desc}</div>
      <div style="font-size:0.92em; color:#888;">${r.category}</div>
      <div style="font-size:0.9em; color:#665;">${r.bonus ? 'Bonus: '+r.bonus : ''}</div>
      <div style="font-size:0.92em;color:#3c7779;">Left: ${r.quantity??'∞'}</div>
      <div style="margin-top:6px;">`;
    if (isQM) {
      html += `<button onclick="editReward(${r.id})">Edit</button> <button onclick="deleteReward(${r.id})">Delete</button>`;
    } else if ((r.quantity??1)>0) {
      html += `<button onclick="claimReward(${r.id})">Claim</button>`;
    } else {
      html += `<span style="color:#c44;">Out of stock</span>`;
    }
    html += `</div></div>`;
  });
  // Claimed history
  html += `<h3>Claimed rewards</h3><div>`;
  let claimed = user.claimed||[];
  if (claimed.length === 0) html += `<div>No rewards claimed yet.</div>`;
  claimed.slice(-5).reverse().forEach(c =>
    html += `<div class="card"><span style="font-size:1.4em;">${c.emoji}</span> <span>${c.name}</span>
      <span style="font-size:0.95em;color:#888;">(${c.category})</span></div>`);
  html += `</div>`;
  document.getElementById('page-shop').innerHTML = `<h2>Reward Store</h2>${html}`;
}
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
    <button onclick="${isEdit ? `saveReward(${r.id})` : 'saveReward()'}">Save</button>
    <button onclick="closeModal()">Cancel</button>`;
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
    let idx = user.rewards.findIndex(r=>r.id===id); user.rewards[idx]=reward;
  } else user.rewards.push(reward);
  saveData(); closeModal(); renderShop();
}
function editReward(id) { openRewardModal(id); }
function deleteReward(id) {
  if (!confirm("Delete this reward?")) return;
  let user = getUserData();
  user.rewards = user.rewards.filter(r=>r.id!==id);
  saveData(); renderShop();
}
function claimReward(id) {
  let user = getUserData(); let r = user.rewards.find(r=>r.id===id);
  if (user.points < r.cost) return alert("Not enough paws!");
  if (r.quantity !== undefined && r.quantity <= 0) return alert("Out of stock!");
  user.points -= r.cost;
  r.quantity = (r.quantity ?? Infinity) - 1;
  user.claimed.push({...r, claimedAt: Date.now()});
  saveData(); renderShop(); updateUIUser(); renderStats();
}

// ====== Роли ======
function renderUserMenuRoleSwitch() {
  if (isDemo()) return '';
  let role = getUserData().profile.role;
  let other = role === "Questmaster" ? "Performer" : "Questmaster";
  return `<div class="user-menu-item" id="switch-role">${role} (Switch to ${other})</div>`;
}
function setupRoleSwitch() {
  let node = document.getElementById('switch-role');
  if(node) node.onclick = function() {
    let user = getUserData();
    user.profile.role = user.profile.role === "Questmaster" ? "Performer" : "Questmaster";
    saveData(); renderAll(); closeUserMenu();
  };
}

// ====== Статистика ======
function renderStats() {
  let user = getUserData();
  let now = Date.now();
  let today = new Date(); today.setHours(0,0,0,0);
  let weekAgo = now - 7*86400e3;

  let completedToday = user.completed.filter(c => c.completedAt >= today.getTime());
  let claimedToday = user.claimed.filter(c => c.claimedAt >= today.getTime());
  let completedWeek = user.completed.filter(c => c.completedAt >= weekAgo);
  let claimedWeek = user.claimed.filter(c => c.claimedAt >= weekAgo);

  let html = `<div style="display:flex;gap:18px;justify-content:center;">
    <div><b>Today:</b> Quests: ${completedToday.length}, Rewards: ${claimedToday.length}</div>
    <div><b>Week:</b> Quests: ${completedWeek.length}, Rewards: ${claimedWeek.length}</div>
    <div><b>All:</b> Quests: ${user.completed.length}, Rewards: ${user.claimed.length}</div>
  </div>`;
  document.getElementById('short-stats').innerHTML = html;
}
function renderStatsPage() {
  let user = getUserData();
  // By category
  let catStats = {};
  user.completed.forEach(c => { catStats[c.category]=catStats[c.category]||0; catStats[c.category]++; });
  user.claimed.forEach(c => { catStats[c.category]=catStats[c.category]||0; });
  let html = `<h2>Statistics</h2>
    <div><b>Completed quests by category:</b><ul>${
      Object.entries(catStats).map(([cat,qty])=>`<li>${cat}: ${qty}</li>`).join('')
    }</ul></div>
    <div><b>Total rewards claimed:</b> ${user.claimed.length}</div>
    <button onclick="showPage('home')">Back</button>`;
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
  if (!currentUser || !data[currentUser]) { showLoginModal(); return; }
  // меню: учесть роль
  renderStats(); renderQuests(); renderShop(); renderStatsPage();
  // обновить user-menu с переключателем роли
  let menu = document.getElementById('user-menu');
  menu.innerHTML = `
    <div class="user-menu-item" id="user-menu-edit-profile">Edit profile</div>
    <div class="user-menu-item" id="user-menu-change-password">Change password</div>
    <div class="user-menu-item" id="user-menu-statistics">Statistics</div>
    ${renderUserMenuRoleSwitch()}
    <div class="user-menu-item" id="user-menu-logout">Logout</div>
  `;
  setupRoleSwitch();
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
