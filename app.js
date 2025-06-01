// === Firebase full sync + English interface ===
import {
  registerNewUser, loginUser, logoutUser,
  getUserData as fetchUserData, updateUserData,
  getQuests, addQuest, updateQuest, deleteQuest,
  getRewards, addReward, updateReward, deleteReward,
  getFriends, getFriendRequests, sendFriendRequest,
  acceptFriendRequest, declineFriendRequest, removeFriend,
  setFriendAsQuestmaster, findUserByUsernameOrEmail, findFamilyIdByUserId
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
let userData = null;
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

// ====== FRIENDS/VIEW MODE ======
let viewingUserId = null; // if not null, we're viewing a friend's account
let viewingFamilyId = null;

// ====== DEMO MODE ======
function isDemo() {
  return !currentUser || currentUser === DEMO_USER;
}
function getDemoData() {
  return {
    username: DEMO_USER,
    role: "Performer",
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

async function renderFriendsPage() {
  let html = `<h2>Friends</h2>`;
  if (isDemo()) {
    html += `<div class="demo-hint">Friendship available after registration.</div>`;
    document.getElementById('page-friends').innerHTML = html;
    return;
  }
  html += `
    <div>
      <input id="friend-uid-input" placeholder="Username or Email" style="width:60%;">
      <button class="fancy-btn" id="add-friend-btn">Add friend</button>
    </div>
    <div id="friend-add-status" style="color:#189d8a;margin:6px 0 12px 0;"></div>
  `;

  let { incoming, outgoing } = await getFriendRequests(familyId, currentUser);
  if (incoming.length) {
    html += `<div><b>Incoming requests:</b><ul>`;
    for (let uid of incoming) {
      html += `<li>${uid} <button class="fancy-btn" onclick="acceptFriendUI('${uid}')">Accept</button>
        <button class="fancy-btn" onclick="declineFriendUI('${uid}')">Decline</button></li>`;
    }
    html += `</ul></div>`;
  }
  if (outgoing.length) {
    html += `<div><b>Outgoing requests:</b><ul>`;
    for (let uid of outgoing) {
      html += `<li>${uid}</li>`;
    }
    html += `</ul></div>`;
  }

  // Список друзей
  const friends = await getFriends(familyId, currentUser);
  let friendInfos = {};
  for (const f of friends) {
    let fid = await findFamilyIdByUserId(f.uid);
    let data = fid ? await fetchUserData(fid, f.uid) : null;
    friendInfos[f.uid] = data;
  }
  html += `<div><b>Your friends:</b><ul>`;
  for (const f of friends) {
    const info = friendInfos[f.uid];
    const name = info ? (info.username || info.email || f.uid) : f.uid;
    html += `<li>
      <b>${name}</b>
      <span style="color:#888;font-size:0.95em;">[${f.status}${f.asQuestmaster ? ', Questmaster' : ''}]</span>
      <button class="fancy-btn" onclick="removeFriendUI('${f.uid}')">Remove</button>
      <button class="fancy-btn" onclick="toggleQMUI('${f.uid}', ${!f.asQuestmaster})">
        ${f.asQuestmaster ? 'Remove QM' : 'Make QM'}
      </button>
      </li>`;
  }
  html += `</ul></div>`;

  document.getElementById('page-friends').innerHTML = html;

  document.getElementById('add-friend-btn').onclick = async () => {
    let v = document.getElementById('friend-uid-input').value.trim();
    if (!v) return;
    try {
      const user = await findUserByUsernameOrEmail(v);
      if (!user) {
        document.getElementById('friend-add-status').textContent = "User not found!";
        return;
      }
      if (user.uid === currentUser) {
        document.getElementById('friend-add-status').textContent = "It's you!";
        return;
      }
      await sendFriendRequest(familyId, currentUser, user.uid);
      document.getElementById('friend-add-status').textContent = "Request sent!";
      renderFriendsPage();
    } catch (e) {
      document.getElementById('friend-add-status').textContent = "Error: " + e.message;
    }
  };
}
window.renderFriendsPage = renderFriendsPage;
window.acceptFriendUI = async function(uid) {
  await acceptFriendRequest(familyId, currentUser, uid);
  renderFriendsPage();
};
window.declineFriendUI = async function(uid) {
  await declineFriendRequest(familyId, currentUser, uid);
  renderFriendsPage();
};
window.removeFriendUI = async function(uid) {
  await removeFriend(familyId, currentUser, uid);
  renderFriendsPage();
};
window.toggleQMUI = async function(uid, asQM) {
  await setFriendAsQuestmaster(familyId, currentUser, uid, asQM);
  renderFriendsPage();
};

// ====== LOAD/SAVE DATA ======
async function loadAllData() {
  if (isDemo()) {
    userData = getDemoData();
    quests = userData.quests;
    rewards = userData.rewards;
    return;
  }
  let targetUid = viewingUserId || currentUser;
  let targetFamilyId = viewingFamilyId || familyId;
  if (!targetFamilyId || !targetUid) return;
  userData = await fetchUserData(targetFamilyId, targetUid);
  quests = await getQuests(targetFamilyId);
  rewards = await getRewards(targetFamilyId);
}
async function saveUserData() {
  if (!isDemo() && currentUser && userData && !viewingUserId) {
    await updateUserData(familyId, currentUser, cleanObject(userData));
  }
}

// ====== Periodic Quest Reset ======
function resetDailiesAndWeeklies() {
  if (!userData || !Array.isArray(userData.quests)) return;
  let todayStart = new Date(); todayStart.setHours(0,0,0,0);
  if (!userData.lastDailyReset || userData.lastDailyReset < todayStart.getTime()) {
    userData.quests.forEach(q => { if(q.type==='daily') q.done = false; });
    userData.lastDailyReset = todayStart.getTime();
  }
  let monday = new Date();
  let day = monday.getDay()||7;
  monday.setHours(0,0,0,0); monday.setDate(monday.getDate() - day + 1);
  if (!userData.lastWeeklyReset || userData.lastWeeklyReset < monday.getTime()) {
    userData.quests.forEach(q => { if(q.type==='weekly') q.done = false; });
    userData.lastWeeklyReset = monday.getTime();
  }
  saveUserData();
}

// ====== Auth ======
window.showLoginModal = function showLoginModal() {
  openModal(`
    <h3>Sign In</h3>
    <label>Email <input id="login-email" type="email" autocomplete="username"></label>
    <label>Password <input id="login-password" type="password" autocomplete="current-password"></label>
    <button class="fancy-btn" onclick="doLogin()">Sign In</button>
    <div style="margin-top:8px;font-size:0.97em;">
      <span>Don't have an account? <a href="#" onclick="showRegisterModal()">Register</a></span>
    </div>
    <div id="login-error" style="color:#c00;font-size:0.97em;"></div>
  `);
  document.getElementById('login-email').focus();
};
window.doLogin = async function doLogin() {
  const email = document.getElementById("login-email").value.trim();
  const password = document.getElementById("login-password").value.trim();
  try {
    const { familyId: fId, user } = await loginUser({ email, password });
    if (!fId) throw new Error("Family not found!");
    familyId = fId;
    currentUser = user.uid;
    await loadAllData();
    closeModal();
    renderAll();
  } catch (e) {
    document.getElementById("login-error").textContent = e.message;
  }
};
window.showRegisterModal = function showRegisterModal() {
  openModal(`
    <h3>Register</h3>
    <label>Email <input id="register-email" type="email"></label>
    <label>Username <input id="register-username" type="text"></label>
    <label>Password <input id="register-password" type="password" autocomplete="new-password"></label>
    <button class="fancy-btn" onclick="doRegister()">Register</button>
    <div style="margin-top:8px;font-size:0.97em;">
      <span>Already have an account? <a href="#" onclick="showLoginModal()">Sign In</a></span>
    </div>
    <div id="register-error" style="color:#c00;font-size:0.97em;"></div>
  `);
  document.getElementById('register-email').focus();
};
window.doRegister = async function doRegister() {
  const username = document.getElementById("register-username").value.trim();
  const email = document.getElementById("register-email").value.trim();
  const password = document.getElementById("register-password").value.trim();
  try {
    const { familyId: fId, user } = await registerNewUser({ username, email, password });
    familyId = fId;
    currentUser = user.uid;
    await loadAllData();
    closeModal();
    renderAll();
  } catch (e) {
    document.getElementById("register-error").textContent = e.message;
  }
};
window.logout = async function logout() {
  await logoutUser();
  familyId = "";
  currentUser = "";
  userData = null;
  quests = [];
  rewards = [];
  renderAll();
};

// ====== Emoji/Category Dropdowns ======
function emojiDropdown(selected) {
  let emojis = [...DEFAULT_EMOJI, ...(userData && userData.customEmojis ? userData.customEmojis : [])];
  return `<select id="emoji-select">${emojis.map(e=>`<option${selected===e?' selected':''}>${e}</option>`).join("")}
    <option value="add-custom">➕ Add custom</option></select>`;
}
function categoryDropdown(selected) {
  let cats = [...DEFAULT_CATEGORIES, ...(userData && userData.categories ? userData.categories : [])];
  return `<select id="cat-select">${cats.map(c=>`<option${selected===c.name?' selected':''}>${c.emoji} ${c.name}</option>`).join("")}
    <option value="add-cat">➕ Add category</option></select>`;
}

// ====== Filtering ======
function renderFilterBar(type) {
  const categories = (userData && userData.categories ? userData.categories : []).map(c => c.name);
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

// ====== HOME (с учетом режима просмотра чужого аккаунта) ======
function renderHome() {
  const stats = {
    completed: (userData?.completed || []).length,
    claimed: (userData?.claimed || []).length,
    balance: userData?.points || 0
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
  } else if (userData && userData.username) {
    if (viewingUserId) {
      html += `<div class="greeting">🐾 Добро пожаловать на страницу вашего друга <b>${userData.username}</b>!</div>
      <button class="fancy-btn" onclick="viewMyAccount()">Вернуться к своему аккаунту</button>
      `;
    } else {
      html += `<div class="greeting">🐾 Welcome, <b>${userData.username}</b>!</div>`;
    }
    html += `
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
  const isQM = userData?.role === 'Questmaster';
  let html = renderFilterBar('quests');
  if (isDemo()) {
    html += `<div class="demo-hint">Demo quests show how the app works.<br>Try completing them!</div>`;
  } else if (isQM) {
    html += `<button class="paw-action-btn" onclick="openQuestModal()">+ Add quest</button>`;
  }
  let list = (isDemo() ? userData.quests : quests).filter(q => !q.done || q.type === "event");
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
      <div style="font-size:0.92em; color:#888;">${q.type}, ${q.category}</div>
      <div style="margin-top:10px;">`;
    if (!isDemo() && isQM) {
      html += `<button class="edit-btn" onclick="editQuest('${q.id}')">✏️ Edit</button>
               <button class="delete-btn" onclick="deleteQuestAction('${q.id}')">🗑️ Delete</button>`;
    } else if (!q.done) {
      html += `<button class="paw-action-btn" onclick="completeQuest('${q.id}')">Mark done</button>`;
    }
    html += `</div></div>`;
  });
  document.getElementById('page-quests').innerHTML = `<h2>Quests</h2>${html}`;
  document.getElementById('page-quests').onclick = filterHandler('quests', renderQuests);
}
window.openQuestModal = function openQuestModal(id) {
  let isEdit = !!id;
  let quest = isEdit
    ? (isDemo() ? userData.quests.find(q => q.id === id) : quests.find(q => q.id === id))
    : { type: 'daily', name: '', emoji: DEFAULT_EMOJI[0], category: userData?.categories?.[0]?.name||"Goal", desc: '', pts: 1, done: false };
  let types = ["daily","weekly","event"].map(t => `<option${quest.type===t?" selected":""}>${t}</option>`).join('');
  let html = `<h3>${isEdit ? "Edit" : "Add"} Quest</h3>
    <label>Type <select id="quest-type">${types}</select></label>
    <label>Name <input id="quest-name" value="${quest.name||""}"></label>
    <label>Category ${categoryDropdown(quest.category)}</label>
    <label>Emoji ${emojiDropdown(quest.emoji)}</label>
    <label>Description <input id="quest-desc" value="${quest.desc||""}"></label>
    <label>Points <input id="quest-pts" type="number" min="1" value="${quest.pts||1}"></label>
    <button class="fancy-btn" onclick="${isEdit ? `saveQuest('${quest.id}')` : 'saveQuest()'}">Save</button>
    <button class="fancy-btn" onclick="closeModal()">Cancel</button>
    <div id="emoji-picker-anchor"></div>`;
  openModal(html);
  setupQuestModalDropdowns();
};
window.saveQuest = async function saveQuest(id) {
  let quest = {
    type: document.getElementById('quest-type').value,
    name: document.getElementById('quest-name').value,
    category: document.getElementById('cat-select').value.replace(/^.*?\s/,''),
    emoji: document.getElementById('emoji-select').value,
    desc: document.getElementById('quest-desc').value,
    pts: parseInt(document.getElementById('quest-pts').value,10),
    done: false,
    lastDone: null
  };
  if (!quest.name || !quest.emoji) return alert("Fill all fields");
  if (isDemo()) {
    if (id) {
      let idx = userData.quests.findIndex(q=>q.id===id);
      if (idx !== -1) userData.quests[idx] = {...quest, id};
    } else {
      quest.id = (Math.random()*1e8)|0;
      userData.quests.push(quest);
    }
    closeModal(); renderQuests();
    return;
  }
  if (id) {
    await updateQuest(familyId, id, quest);
  } else {
    await addQuest(familyId, quest);
  }
  await loadAllData();
  closeModal();
  renderAll();
};
window.editQuest = function editQuest(id) { openQuestModal(id); };
window.deleteQuestAction = async function deleteQuestAction(id) {
  if (isDemo()) {
    userData.quests = userData.quests.filter(q => q.id !== id);
    renderQuests();
    return;
  }
  await deleteQuest(familyId, id);
  await loadAllData();
  renderAll();
};
window.completeQuest = async function completeQuest(id) {
  if (isDemo()) {
    let q = userData.quests.find(q => q.id === id);
    if (!q || q.done) return;
    q.done = true; q.lastDone = Date.now();
    userData.points += q.pts;
    userData.completed.push({...q, completedAt: Date.now()});
    if(q.type==="event") userData.quests = userData.quests.filter(qq=>qq.id!==id);
    renderQuests(); updateUIUser(); renderStatsPage();
    return;
  }
  let q = quests.find(q => q.id === id);
  if (!q || q.done) return;
  q.done = true; q.lastDone = Date.now();
  userData.points = (userData.points||0) + (q.pts||1);
  userData.completed = userData.completed || [];
  userData.completed.push({...q, completedAt: Date.now()});
  await updateQuest(familyId, id, q);
  await saveUserData();
  await loadAllData();
  renderAll();
};

// ====== CRUD Rewards ======
function renderShop(activeCategory = null) {
  const isQM = userData?.role === 'Questmaster';
  let html = renderFilterBar('rewards');
  if (isDemo()) {
    html += `<div class="demo-hint">Rewards in the game are pleasant or useful bonuses you can "buy" with paws.<br>
      Here are some reasons why this can help:</div>`;
  } else if (isQM) {
    html += `<button class="paw-action-btn" onclick="openRewardModal()">+ Add reward</button>`;
  }
  let list = isDemo() ? userData.rewards : rewards;
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
      html += `<button class="edit-btn" onclick="editReward('${r.id}')">✏️ Edit</button>
               <button class="delete-btn" onclick="deleteRewardAction('${r.id}')">🗑️ Delete</button>`;
    } else if (!isDemo() && (r.quantity??1)>0) {
      html += `<button class="paw-action-btn" onclick="claimReward('${r.id}')">Claim</button>`;
    }
    html += `</div></div>`;
  });
  document.getElementById('page-shop').innerHTML = `<h2>Reward Store</h2>${html}`;
  document.getElementById('page-shop').onclick = filterHandler('rewards', renderShop);
}
window.openRewardModal = function openRewardModal(id) {
  let isEdit = !!id;
  let r = isEdit
    ? (isDemo() ? userData.rewards.find(r => r.id === id) : rewards.find(r => r.id === id))
    : { name: '', emoji: DEFAULT_EMOJI[0], category: userData?.categories?.[0]?.name||"Goal", desc: '', cost: 1, bonus: '', quantity: 1 };
  let html = `<h3>${isEdit ? "Edit" : "Add"} Reward</h3>
    <label>Name <input id="reward-name" value="${r.name||""}"></label>
    <label>Category ${categoryDropdown(r.category)}</label>
    <label>Emoji ${emojiDropdown(r.emoji)}</label>
    <label>Description <input id="reward-desc" value="${r.desc||""}"></label>
    <label>Cost <input id="reward-cost" type="number" min="1" value="${r.cost||1}"></label>
    <label>Bonus <input id="reward-bonus" value="${r.bonus||""}"></label>
    <label>Quantity <input id="reward-quantity" type="number" min="0" value="${r.quantity??1}"></label>
    <button class="fancy-btn" onclick="${isEdit ? `saveReward('${r.id}')` : 'saveReward()'}">Save</button>
    <button class="fancy-btn" onclick="closeModal()">Cancel</button>`;
  openModal(html);
  setupRewardModalDropdowns();
};
window.saveReward = async function saveReward(id) {
  let reward = {
    name: document.getElementById('reward-name').value,
    category: document.getElementById('cat-select').value.replace(/^.*?\s/,''),
    emoji: document.getElementById('emoji-select').value,
    desc: document.getElementById('reward-desc').value,
    cost: parseInt(document.getElementById('reward-cost').value,10),
    bonus: document.getElementById('reward-bonus').value,
    quantity: parseInt(document.getElementById('reward-quantity').value,10)
  };
  if (!reward.name || !reward.emoji) return alert("Fill all fields");
  if (isDemo()) {
    if (id) {
      let idx = userData.rewards.findIndex(r=>r.id===id);
      if (idx !== -1) userData.rewards[idx] = {...reward, id};
    } else {
      reward.id = (Math.random()*1e8)|0;
      userData.rewards.push(reward);
    }
    closeModal(); renderShop();
    return;
  }
  if (id) {
    await updateReward(familyId, id, reward);
  } else {
    await addReward(familyId, reward);
  }
  await loadAllData();
  closeModal();
  renderAll();
};
window.editReward = function editReward(id) { openRewardModal(id); };
window.deleteRewardAction = async function deleteRewardAction(id) {
  if (isDemo()) {
    userData.rewards = userData.rewards.filter(r => r.id !== id);
    renderShop();
    return;
  }
  await deleteReward(familyId, id);
  await loadAllData();
  renderAll();
};
window.claimReward = async function claimReward(id) {
  let r = isDemo() ? userData.rewards.find(r => r.id === id) : rewards.find(r => r.id === id);
  if (!r) return;
  if (userData.points < r.cost) return alert("Not enough paws!");
  if (r.quantity !== undefined && r.quantity <= 0) return alert("Out of stock!");
  userData.points -= r.cost;
  r.quantity = (r.quantity ?? Infinity) - 1;
  userData.claimed = userData.claimed || [];
  userData.claimed.push({
    id: (Math.random()*1e8)|0,
    name: r.name, emoji: r.emoji, category: r.category, desc: r.desc,
    cost: r.cost, bonus: r.bonus, claimedAt: Date.now(), received: false
  });
  if (!isDemo()) await saveUserData();
  renderShop(); updateUIUser(); renderStatsPage();
};

// ====== CLAIMED REWARDS =======
function renderClaimedRewards() {
  const isQM = userData?.role === 'Questmaster';
  let claimed = userData?.claimed || [];
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
window.markRewardReceived = function markRewardReceived(id) {
  let reward = userData.claimed.find(r => r.id === id);
  if (reward) {
    reward.received = true;
    saveUserData();
    renderClaimedRewards();
  }
};

// ====== ROLES ======
function renderUserMenuRoleSwitch() {
  if (isDemo()) return '';
  let role = userData?.role;
  if (!role) return '';
  let other = role === "Questmaster" ? "Performer" : "Questmaster";
  return `<button class="user-menu-item" id="switch-role" type="button">${role} (Switch to ${other})</button>`;
}

// ====== STATISTICS ======
function renderStatsPage() {
  let catStats = {};
  (userData.completed || []).forEach(c => { catStats[c.category]=catStats[c.category]||0; catStats[c.category]++; });
  (userData.claimed || []).forEach(c => { catStats[c.category]=catStats[c.category]||0; });
  let html = `<h2>Statistics</h2>
    <div><b>Completed quests by category:</b><ul>${
      Object.entries(catStats).map(([cat,qty])=>`<li>${cat}: ${qty}</li>`).join('')
    }</ul></div>
    <div><b>Total rewards claimed:</b> ${(userData.claimed||[]).length}</div>
    <button class="fancy-btn" onclick="showPage('home')">Back</button>`;
  document.getElementById('page-statistics').innerHTML = html;
}

// ====== SETTINGS ======
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
}

// ====== UI & NAV ======
function updateUIUser() {
  document.getElementById('paw-balance-val').textContent = userData && userData.points !== undefined ? userData.points : 0;
  if (isDemo()) {
    document.getElementById('user-menu').style.display = "none";
    document.getElementById('show-user-menu').disabled = true;
  } else {
    document.getElementById('show-user-menu').disabled = false;
  }
}
async function renderAll() {
  await loadAllData();
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
    openModal(`<h3>Edit Profile</h3>
      <label>Username <input type="text" value="${userData?.username||''}" disabled></label>
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
    userData.role = userData.role === "Questmaster" ? "Performer" : "Questmaster";
    saveUserData(); renderAll(); closeUserMenu();
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
  if (pageId === "friends") renderFriendsPage();
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

// ====== Modal helpers for dropdowns ======
function setupQuestModalDropdowns() {
  document.getElementById('cat-select').addEventListener('change', function() {
    if(this.value==="add-cat") {
      let emoji = prompt("Enter an emoji for the new category:");
      let name = prompt("Category name:");
      if(emoji && name) {
        userData.categories.push({emoji, name});
        saveUserData();
        openQuestModal();
      }
    }
  });
  document.getElementById('emoji-select').addEventListener('change', function() {
    if(this.value==="add-custom") {
      let emoji = prompt("Enter a custom emoji:");
      if(emoji) {
        userData.customEmojis = userData.customEmojis || [];
        userData.customEmojis.push(emoji);
        saveUserData();
        openQuestModal();
      }
    }
  });
}
function setupRewardModalDropdowns() {
  document.getElementById('cat-select').addEventListener('change', function() {
    if(this.value==="add-cat") {
      let emoji = prompt("Enter an emoji for the new category:");
      let name = prompt("Category name:");
      if(emoji && name) {
        userData.categories.push({emoji, name});
        saveUserData(); openRewardModal();
      }
    }
  });
  document.getElementById('emoji-select').addEventListener('change', function() {
    if(this.value==="add-custom") {
      let emoji = prompt("Enter a custom emoji:");
      if(emoji) {
        userData.customEmojis = userData.customEmojis || [];
        userData.customEmojis.push(emoji); saveUserData(); openRewardModal();
      }
    }
  });
}

// ====== On Load ======
window.closeModal = closeModal;
window.onload = function () { renderAll(); };
window.openQuestModal = openQuestModal;
window.openRewardModal = openRewardModal;
window.saveQuest = saveQuest;
window.editQuest = editQuest;
window.deleteQuestAction = deleteQuestAction;
window.saveReward = saveReward;
window.editReward = editReward;
window.deleteRewardAction = deleteRewardAction;
window.claimReward = claimReward;
window.logout = logout;
