// Firebase-powered full app based on original UI logic
import {
  registerNewUser, loginUser, logoutUser,
  getUserData as fetchUserData, updateUserData,
  getQuests, addQuest, updateQuest, deleteQuest,
  getRewards, addReward, updateReward, deleteReward
} from "./firestore-api.js";

// ========== Globals ==========
let familyId = localStorage.getItem("pawFamilyId") || "";
let currentUser = localStorage.getItem("pawCurrentUser") || "";
let userData = null;
let quests = [];
let rewards = [];

function getUserData() {
  return userData;
}

async function saveData() {
  if (familyId && currentUser && userData) {
    await updateUserData(familyId, currentUser, userData);
  }
}

async function loadAllData() {
  if (!familyId || !currentUser) return;
  userData = await fetchUserData(familyId, currentUser);
  quests = await getQuests(familyId);
  rewards = await getRewards(familyId);
}

// ========== Auth ==========
window.showLoginModal = function () {
  openModal(`
    <h3>Sign In</h3>
    <label>Email <input id="login-email" type="email"></label>
    <label>Password <input id="login-password" type="password"></label>
    <button class="fancy-btn" onclick="doLogin()">Sign In</button>
    <div style="margin-top:8px;font-size:0.97em;">
      <span>Don't have an account? <a href="#" onclick="showRegisterModal()">Register</a></span>
    </div>
    <div id="login-error" style="color:#c00;font-size:0.97em;"></div>
  `);
  document.getElementById("login-email").focus();
};

window.doLogin = async function () {
  const email = document.getElementById("login-email").value.trim();
  const password = document.getElementById("login-password").value.trim();
  try {
    const { familyId: fId, user } = await loginUser({ email, password });
    if (!fId) throw new Error("Family not found!");
    familyId = fId;
    currentUser = user.uid;
    localStorage.setItem("pawFamilyId", familyId);
    localStorage.setItem("pawCurrentUser", currentUser);
    await loadAllData();
    closeModal();
    renderAll();
  } catch (e) {
    document.getElementById("login-error").textContent = e.message;
  }
};

window.showRegisterModal = function () {
  openModal(`
    <h3>Register</h3>
    <label>Email <input id="register-email" type="email"></label>
    <label>Username <input id="register-username" type="text"></label>
    <label>Password <input id="register-password" type="password"></label>
    <button class="fancy-btn" onclick="doRegister()">Register</button>
    <div style="margin-top:8px;font-size:0.97em;">
      <span>Already have an account? <a href="#" onclick="showLoginModal()">Sign In</a></span>
    </div>
    <div id="register-error" style="color:#c00;font-size:0.97em;"></div>
  `);
  document.getElementById("register-email").focus();
};

window.doRegister = async function () {
  const email = document.getElementById("register-email").value.trim();
  const username = document.getElementById("register-username").value.trim();
  const password = document.getElementById("register-password").value.trim();
  try {
    const { familyId: fId, user } = await registerNewUser({ email, username, password });
    familyId = fId;
    currentUser = user.uid;
    localStorage.setItem("pawFamilyId", familyId);
    localStorage.setItem("pawCurrentUser", currentUser);
    await loadAllData();
    closeModal();
    renderAll();
  } catch (e) {
    document.getElementById("register-error").textContent = e.message;
  }
};

window.logout = async function () {
  await logoutUser();
  familyId = "";
  currentUser = "";
  userData = null;
  quests = [];
  rewards = [];
  localStorage.removeItem("pawFamilyId");
  localStorage.removeItem("pawCurrentUser");
  renderAll();
};

// ========== UI rendering ==========
function renderAll() {
  if (!familyId || !currentUser || !userData) {
    document.getElementById("page-home").innerHTML = `
      <div class="demo-hint">
        <b>Вы в демо-режиме!</b> Зарегистрируйтесь, чтобы создать свою группу и сохранять прогресс.
      </div>
      <button class="demo-big-btn" onclick="showRegisterModal()">Регистрация</button>
    `;
    document.getElementById("paw-balance-val").textContent = "0";
    ["shop", "quests", "rewards", "settings", "statistics"].forEach(page =>
      document.getElementById("page-" + page).innerHTML = ""
    );
    return;
  }

  document.getElementById("paw-balance-val").textContent = userData.points ?? 0;

  // Home
  document.getElementById("page-home").innerHTML = `
    <div class="greeting">🐾 Добро пожаловать, <b>${userData.username}</b>!</div>
    <div class="infograph">
      <div class="infocard"><span class="big">${userData.points ?? 0} 🐾</span>Баланс лапок</div>
      <div class="infocard"><span class="big">${quests.filter(q=>q.done).length}</span>Квестов выполнено</div>
      <div class="infocard"><span class="big">—</span>Наград получено</div>
    </div>
  `;

  renderQuests();
  renderShop();
  renderClaimedRewards();
  renderStatsPage();
  renderSettings();
}

function renderQuests() {
  let html = `<button class="paw-action-btn" onclick="openQuestModal()">+ Add quest</button>`;
  if (!quests.length) html += `<div>No quests yet.</div>`;
  quests.forEach(q => {
    html += `
      <div class="card">
        <div><span style="font-size:1.5em;">${q.emoji || "🐾"}</span> <b>${q.name}</b></div>
        <div style="font-size:0.92em;">${q.desc || ""}</div>
        <div>${q.pts || 1} 🐾</div>
        <button class="edit-btn" onclick="editQuest('${q.id}')">✏️ Edit</button>
        <button class="delete-btn" onclick="deleteQuestAction('${q.id}')">🗑️ Delete</button>
      </div>
    `;
  });
  document.getElementById("page-quests").innerHTML = html;
}

window.openQuestModal = function (id) {
  let q = id ? quests.find(q => q.id === id) : { name: "", desc: "", emoji: "🐾", pts: 1 };
  openModal(`
    <h3>${id ? "Edit" : "Add"} Quest</h3>
    <label>Name <input id="quest-name" value="${q.name}"></label>
    <label>Emoji <input id="quest-emoji" value="${q.emoji}" maxlength="2"></label>
    <label>Description <input id="quest-desc" value="${q.desc}"></label>
    <label>Points <input id="quest-pts" type="number" min="1" value="${q.pts}"></label>
    <button class="fancy-btn" onclick="${id ? `saveQuest('${id}')` : "saveQuest()"}">Save</button>
    <button class="fancy-btn" onclick="closeModal()">Cancel</button>
  `);
};

window.saveQuest = async function (id) {
  const quest = {
    name: document.getElementById("quest-name").value,
    emoji: document.getElementById("quest-emoji").value,
    desc: document.getElementById("quest-desc").value,
    pts: parseInt(document.getElementById("quest-pts").value, 10),
    done: false
  };
  if (id) await updateQuest(familyId, id, quest);
  else await addQuest(familyId, quest);
  await loadAllData();
  closeModal();
  renderAll();
};

window.editQuest = function (id) {
  openQuestModal(id);
};

window.deleteQuestAction = async function (id) {
  if (!confirm("Delete this quest?")) return;
  await deleteQuest(familyId, id);
  await loadAllData();
  renderAll();
};

function renderShop() {
  let html = `<button class="paw-action-btn" onclick="openRewardModal()">+ Add reward</button>`;
  if (!rewards.length) html += `<div>No rewards yet.</div>`;
  rewards.forEach(r => {
    html += `
      <div class="card">
        <div><span style="font-size:1.5em;">${r.emoji || "🎁"}</span> <b>${r.name}</b></div>
        <div style="font-size:0.92em;">${r.desc || ""}</div>
        <div>${r.cost || 1} 🐾</div>
        <button class="edit-btn" onclick="editReward('${r.id}')">✏️ Edit</button>
        <button class="delete-btn" onclick="deleteRewardAction('${r.id}')">🗑️ Delete</button>
      </div>
    `;
  });
  document.getElementById("page-shop").innerHTML = html;
}

window.openRewardModal = function (id) {
  let r = id ? rewards.find(r => r.id === id) : { name: "", desc: "", emoji: "🎁", cost: 1 };
  openModal(`
    <h3>${id ? "Edit" : "Add"} Reward</h3>
    <label>Name <input id="reward-name" value="${r.name}"></label>
    <label>Emoji <input id="reward-emoji" value="${r.emoji}" maxlength="2"></label>
    <label>Description <input id="reward-desc" value="${r.desc}"></label>
    <label>Cost <input id="reward-cost" type="number" min="1" value="${r.cost}"></label>
    <button class="fancy-btn" onclick="${id ? `saveReward('${id}')` : "saveReward()"}">Save</button>
    <button class="fancy-btn" onclick="closeModal()">Cancel</button>
  `);
};

window.saveReward = async function (id) {
  const reward = {
    name: document.getElementById("reward-name").value,
    emoji: document.getElementById("reward-emoji").value,
    desc: document.getElementById("reward-desc").value,
    cost: parseInt(document.getElementById("reward-cost").value, 10)
  };
  if (id) await updateReward(familyId, id, reward);
  else await addReward(familyId, reward);
  await loadAllData();
  closeModal();
  renderAll();
};

window.editReward = function (id) {
  openRewardModal(id);
};

window.deleteRewardAction = async function (id) {
  if (!confirm("Delete this reward?")) return;
  await deleteReward(familyId, id);
  await loadAllData();
  renderAll();
};

function renderClaimedRewards() {
  document.getElementById("page-rewards").innerHTML = `<h2>Claimed Rewards</h2><div>—</div>`;
}
function renderStatsPage() {
  document.getElementById("page-statistics").innerHTML = "<h2>Statistics</h2><div>—</div>";
}
function renderSettings() {
  document.getElementById("page-settings").innerHTML = "<h2>Settings</h2><div>—</div>";
}

// Modal helpers
function openModal(contentHtml = "") {
  document.getElementById('modal-content').innerHTML = contentHtml;
  document.getElementById('modal-bg').style.display = "flex";
}
function closeModal() {
  document.getElementById('modal-bg').style.display = "none";
}

// Navigation
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
  closeModal();
}
navLinks.forEach(link => {
  link.addEventListener('click', e => {
    e.preventDefault();
    const page = link.getAttribute('data-page');
    showPage(page);
  });
});

// Init
window.onload = async function () {
  if (familyId && currentUser) await loadAllData();
  renderAll();
};
