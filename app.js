import { initializeApp } from "https://www.gstatic.com/firebasejs/11.8.1/firebase-app.js";
import { getFirestore, doc, setDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/11.8.1/firebase-firestore.js";

// === Firebase Config ===
const firebaseConfig = {
  apiKey: "AIzaSyBDHjCE7CYC_jxL7EPjUApVvrd8avHmcNA",
  authDomain: "talk-to-my-paw.firebaseapp.com",
  projectId: "talk-to-my-paw",
  storageBucket: "talk-to-my-paw.appspot.com",
  messagingSenderId: "1023228484299",
  appId: "1:1023228484299:web:df2f42b4bebff7c82b194e",
  measurementId: "G-X51RCW3ND0"
};
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// === State ===
let currentUser = localStorage.getItem('pawCurrentUser') || "";
let groupId = "demo-family";
let allData = {
  users: {},
  quests: [],
  completed: [],
  rewards: [],
  claimed: [],
  points: {},
  customTaskCategories: [],
  customRewardCategories: []
};
let isInitialSync = true;
let currentPage = "main"; // track current page

// === Firestore Sync ===
function syncToFirebase() {
  setDoc(doc(db, "groups", groupId), allData);
}
function listenFromFirebase() {
  onSnapshot(doc(db, "groups", groupId), (docSnap) => {
    if (docSnap.exists()) {
      const prevUser = currentUser;
      Object.assign(allData, docSnap.data());
      // Примеры только если база пуста
      if (isInitialSync && Object.keys(allData.users).length === 0 && allData.quests.length === 0 && allData.rewards.length === 0) {
        addDemoData();
      }
      isInitialSync = false;
      if (prevUser && allData.users[prevUser]) {
        currentUser = prevUser;
        localStorage.setItem('pawCurrentUser', currentUser);
      }
      renderAll(currentPage);
    }
  });
}
listenFromFirebase();

// === Примеры при первом запуске ===
function addDemoData() {
  allData.quests = [
    { type: 'daily', name: 'Feed the cat', emoji: '🧑‍🍳', desc: 'Give breakfast to your cat', pts: 3, createdAt: new Date().toISOString(), category: "🧑‍🍳" },
    { type: 'daily', name: 'Morning walk', emoji: '🚶‍♂️', desc: '10 min walk in the park', pts: 2, createdAt: new Date().toISOString(), category: "🚶‍♂️" },
    { type: 'weekly', name: 'Clean up room', emoji: '🧹', desc: 'Tidy up your room on Saturday', pts: 5, createdAt: new Date().toISOString(), category: "🧹" },
    { type: 'weekly', name: 'Call grandma', emoji: '☎️', desc: 'Check in on your grandma', pts: 4, createdAt: new Date().toISOString(), category: "☎️" },
    { type: 'event', name: 'Birthday surprise', emoji: '🎉', desc: 'Organize a surprise for a friend', pts: 10, createdAt: new Date().toISOString(), category: "🎉" },
  ];
  allData.completed = [
    { username: "demo", type: 'daily', name: 'Brush teeth', emoji: '🦷', desc: 'Morning and evening', pts: 1, createdAt: new Date().toISOString(), completedAt: new Date(Date.now() - 86400000).toISOString(), category: "🦷" }
  ];
  allData.rewards = [
    { name: 'Chocolate bar', emoji: '🍫', desc: 'Sweet treat', cost: 6, category: "🍫" },
    { name: 'Coffee break', emoji: '☕', desc: 'Buy yourself a nice coffee', cost: 8, category: "☕" },
    { name: 'Movie night', emoji: '🎬', desc: 'Watch a movie with popcorn', cost: 14, category: "🎬" },
    { name: 'Game hour', emoji: '🎮', desc: 'Play your favorite game for 1 hour', cost: 10, category: "🎮" },
    { name: 'Cute sticker', emoji: '🧸', desc: 'Get a cute sticker for your notebook', cost: 2, category: "🧸" },
  ];
  allData.claimed = [
    { username: "demo", name: 'Donut', emoji: '🍩', desc: 'Yummy donut', cost: 5, claimedAt: new Date(Date.now() - 3600 * 1000 * 6).toISOString(), done: true, category: "🍩" }
  ];
  allData.points = { demo: 11 };
  allData.users.demo = { password: "demo", role: "user" };
  allData.customTaskCategories = ['💼 Работа', '🏠 Дом'];
  allData.customRewardCategories = ['🍕 Еда', '👕 Одежда'];
  syncToFirebase();
}

// === User ===
function setUser(login) {
  currentUser = login;
  localStorage.setItem('pawCurrentUser', login);
  if (!allData.users[login]) {
    allData.users[login] = { role: "user", password: "" };
    allData.points[login] = 0;
    syncToFirebase();
  }
  renderAll(currentPage);
}
function updateUserUI() {
  const userProfile = document.getElementById('user-profile');
  const showLoginBtn = document.getElementById('show-login-btn');
  const signoutBtn = document.getElementById('signout-btn');
  if (currentUser) {
    showLoginBtn.style.display = 'none';
    userProfile.style.display = '';
    document.getElementById('user-name').textContent = currentUser;
    signoutBtn.style.display = '';
  } else {
    showLoginBtn.style.display = '';
    userProfile.style.display = 'none';
    signoutBtn.style.display = 'none';
  }
}
function userRole() {
  return (allData.users[currentUser] && allData.users[currentUser].role) || "user";
}

// === Глобальный баланс ===
function renderGlobalBalance(page) {
  const bal = document.getElementById('global-balance');
  if (page === 'settings' || !currentUser) { bal.style.display = 'none'; return; }
  bal.style.display = 'block';
  bal.innerHTML = `🐾 <strong>${allData.points[currentUser]||0}</strong> paw points`;
}

// === Модальные окна ===
window.showLogin = function showLogin() {
  closeAllModals();
  document.getElementById('login-modal-bg').style.display = 'flex';
  document.getElementById('login-username').focus();
  document.getElementById('login-err').textContent = '';
}
window.closeLoginModal = function closeLoginModal() { document.getElementById('login-modal-bg').style.display = 'none'; }
window.showRegister = function showRegister() {
  closeAllModals();
  document.getElementById('register-modal-bg').style.display = 'flex';
  document.getElementById('register-username').focus();
  document.getElementById('register-err').textContent = '';
}
window.closeRegisterModal = function closeRegisterModal() { document.getElementById('register-modal-bg').style.display = 'none'; }
window.showQuestModal = function showQuestModal() {
  if (userRole() !== 'admin') return;
  closeAllModals();
  // Добавим кастомные категории в select
  setTimeout(() => {
    const sel = document.getElementById('taskEmoji');
    const custom = allData.customTaskCategories || [];
    if (custom.length) {
      sel.innerHTML = `<option value="">No category</option>
        <option value="🎯">🎯 Goal</option>
        <option value="📚">📚 Study</option>
        <option value="🧹">🧹 Cleaning</option>
        <option value="💪">💪 Sport</option>
        <option value="🌿">🌿 Nature</option>
        <option value="📝">📝 Note</option>
        <option value="🧠">🧠 Growth</option>
        <option value="CUSTOM" class="custom-category" disabled>─────────</option>
        ${custom.map(c => `<option value="${c}">${c}</option>`).join("")}`;
    }
    document.getElementById('taskName').focus();
  }, 90);
  document.getElementById('quest-modal-bg').style.display = 'flex';
}
window.closeQuestModal = function closeQuestModal() { document.getElementById('quest-modal-bg').style.display = 'none'; }
window.showRewardModal = function showRewardModal() {
  if (userRole() !== 'admin') return;
  closeAllModals();
  setTimeout(() => {
    const sel = document.getElementById('rewardEmoji');
    const custom = allData.customRewardCategories || [];
    if (custom.length) {
      sel.innerHTML = `<option value="">No category</option>
        <option value="🎁">🎁 Gift</option>
        <option value="🍫">🍫 Sweets</option>
        <option value="☕">☕ Coffee</option>
        <option value="🛋️">🛋️ Rest</option>
        <option value="🎮">🎮 Games</option>
        <option value="🧸">🧸 Cute</option>
        <option value="CUSTOM" class="custom-category" disabled>─────────</option>
        ${custom.map(c => `<option value="${c}">${c}</option>`).join("")}`;
    }
    document.getElementById('rewardName').focus();
  }, 90);
  document.getElementById('reward-modal-bg').style.display = 'flex';
}
window.closeRewardModal = function closeRewardModal() { document.getElementById('reward-modal-bg').style.display = 'none'; }
function closeAllModals() {
  ['login-modal-bg','register-modal-bg','quest-modal-bg','reward-modal-bg'].forEach(id => {
    let el = document.getElementById(id);
    if (el) el.style.display = 'none';
  });
}
document.getElementById('show-login-btn').onclick = showLogin;
window.onclick = function(event) {
  [
    {modal: 'login-modal-bg', close: closeLoginModal},
    {modal: 'register-modal-bg', close: closeRegisterModal},
    {modal: 'quest-modal-bg', close: closeQuestModal},
    {modal: 'reward-modal-bg', close: closeRewardModal}
  ].forEach(({modal, close}) => {
    const el = document.getElementById(modal);
    if (event.target === el) close();
  });
};
window.addEventListener('keydown', function(e) {
  if (e.key === "Escape") closeAllModals();
});

// === Auth ===
window.doLogin = function doLogin() {
  let login = document.getElementById('login-username').value.trim();
  let pass = document.getElementById('login-password').value.trim();
  if (!login || !pass) { document.getElementById('login-err').textContent = "Fill both fields"; return; }
  if (!allData.users[login] || allData.users[login].password !== pass) { document.getElementById('login-err').textContent = "Wrong login or password"; return; }
  setUser(login);
  closeAllModals();
  renderAll(currentPage);
}
window.doRegister = function doRegister() {
  let login = document.getElementById('register-username').value.trim();
  let pass = document.getElementById('register-password').value.trim();
  if (!login || !pass) { document.getElementById('register-err').textContent = "Fill both fields"; return; }
  if (allData.users[login]) { document.getElementById('register-err').textContent = "User exists"; return; }
  allData.users[login] = { password: pass, role: 'user' };
  allData.points[login] = 0;
  syncToFirebase();
  setUser(login);
  closeAllModals();
  renderAll(currentPage);
}
window.signOut = function signOut() {
  localStorage.removeItem('pawCurrentUser');
  currentUser = "";
  renderAll(currentPage);
}

// === Главная ===
function renderMain() {
  let pts = allData.points[currentUser] || 0;
  document.getElementById('page-main').innerHTML = `
    <div class="section" style="text-align: center;">
      <h2 style="font-size: 2rem; color: var(--text-dark);">Welcome${currentUser ? ', ' + currentUser : ''}!</h2>
      <p style="font-size: 1.2rem; margin-top: 10px;">You have</p>
      <div style="font-size: 3rem; color: var(--main-color); margin: 10px 0;">
        🐾 <strong id="points">${pts}</strong>
      </div>
      <p style="font-size: 1rem; color: #777">paw points</p>
    </div>
    <div class="section" style="display: flex; justify-content: space-around; text-align: center;">
      <div style="flex: 1; padding: 10px;">
        <div style="font-size: 1.8rem; color: var(--main-color);">📅</div>
        <div style="font-weight: bold; margin-top: 5px;">Today: <span id="count-today">0</span></div>
      </div>
      <div style="flex: 1; padding: 10px;">
        <div style="font-size: 1.8rem; color: var(--main-color);">🗓️</div>
        <div style="font-weight: bold; margin-top: 5px;">This Week: <span id="count-week">0</span></div>
      </div>
      <div style="flex: 1; padding: 10px;">
        <div style="font-size: 1.8rem; color: var(--main-color);">📈</div>
        <div style="font-weight: bold; margin-top: 5px;">All Time: <span id="count-all">0</span></div>
      </div>
    </div>
    ${
      userRole() === 'admin' ?
      `<div class="section" style="text-align: center;display:flex;flex-wrap:wrap;justify-content:center;gap:16px;">
        <button class="paw-action-btn" type="button" onclick="showQuestModal()">
          <svg class="paw-emoji icon-svg" width="28" height="28" viewBox="0 0 24 24"><use href="#solar-list-check"/></svg> New Quest
        </button>
        <button class="paw-action-btn" type="button" onclick="showRewardModal()">
          <svg class="paw-emoji icon-svg" width="28" height="28" viewBox="0 0 24 24"><use href="#solar-gift"/></svg> New Reward
        </button>
      </div>`
      : ''
    }
  `;
  renderStats();
}

// === Квесты ===
function renderQuests() {
  const page = document.getElementById('page-tasks');
  page.innerHTML = `
    <div class="section" style="text-align: center;">
      <h2 style="font-size: 2rem; color: var(--text-dark);">Quests</h2>
      <p style="color: #666; margin: 10px 0;">Complete quests to earn paw points!</p>
    </div>
  `;
  const section = document.createElement('div');
  section.className = 'section';
  if (!allData.quests || allData.quests.length === 0) section.innerHTML = '<p>No quests yet.</p>';
  else {
    ['daily', 'weekly', 'event'].forEach(type => {
      const filtered = allData.quests.filter(q => q.type === type);
      if (filtered.length === 0) return;
      const h = document.createElement('h3');
      h.textContent = type === 'daily' ? 'Daily' : type === 'weekly' ? 'Weekly' : 'Events';
      section.appendChild(h);
      filtered.forEach((q, i) => {
        const globalIndex = allData.quests.indexOf(q);
        const card = document.createElement('div');
        card.className = 'card ' + type;
        card.innerHTML = `
          <div class="flex">
            <div>
              <b>${q.emoji ? q.emoji + ' ' : ''}${q.name}</b> <span>(${q.pts} points)</span>
              <p class="desc">${q.desc || ''}</p>
              <span style="color:#888;font-size:0.93em;">${q.category ? `Category: ${q.category}` : ''}</span>
            </div>
            <div>
              ${userRole()==='user'?`
                <button onclick="completeTask(${globalIndex})" title="Complete">✔️</button>
              `:''}
              ${userRole()==='admin'?`
                <button onclick="deleteQuest(${globalIndex})" title="Delete">❌</button>
              `:''}
            </div>
          </div>
        `;
        section.appendChild(card);
      });
    });
  }
  page.appendChild(section);
  renderCompleted();
}
function renderCompleted() {
  let page = document.getElementById('page-tasks');
  let completedSection = document.createElement('div');
  completedSection.className = 'section';
  completedSection.innerHTML = `<h2 style="color:var(--text-dark);margin-bottom:10px;">✅ Completed Quests</h2>`;
  const userCompleted = (allData.completed||[]).filter(q => q.username === currentUser);
  if (userCompleted.length === 0) {
    completedSection.innerHTML += '<p>No completed quests yet.</p>';
  } else {
    userCompleted.forEach(q => {
      const card = document.createElement('div');
      card.className = 'card daily';
      card.innerHTML = `
        <b>${q.emoji ? q.emoji + ' ' : ''}${q.name}</b> <span>(${q.pts} points)</span>
        <p class="desc">${q.desc || ''}</p>
        <span style="color:#888;font-size:0.93em;">${q.category ? `Category: ${q.category}` : ''}</span>
        <small>Completed: ${new Date(q.completedAt).toLocaleString()}</small>
      `;
      completedSection.appendChild(card);
    });
  }
  page.appendChild(completedSection);
}

// === Награды и Магазин ===
function renderShop() {
  const pts = allData.points[currentUser] || 0;
  const page = document.getElementById('page-shop');
  page.innerHTML = `
    <div class="section" style="text-align: center;">
      <h2 style="font-size: 2rem; color: var(--text-dark);">Reward Store</h2>
      <p style="font-size: 1.1rem; color: #333; margin: 8px 0;">🐾 Balance: <strong id="points">${pts}</strong></p>
    </div>
  `;
  const section = document.createElement('div');
  section.className = 'section';
  if (!allData.rewards || allData.rewards.length === 0) {
    section.innerHTML = '<p>No rewards yet.</p>';
  } else {
    allData.rewards.forEach((r, i) => {
      section.innerHTML += `
        <div style="border: 2px solid #6fedd1; border-radius: 12px; padding: 12px; margin-bottom: 12px; display: flex; justify-content: space-between; align-items: center;">
          <div>
            <strong>${r.emoji ? r.emoji + ' ' : ''}${r.name}</strong>
            <div style="color: #666; font-size: 0.9rem;">${r.desc}</div>
            <span style="color:#888;font-size:0.93em;">${r.category ? `Category: ${r.category}` : ''}</span>
            ${userRole()==='admin'?`
              <div style="margin-top:8px;">
                <button onclick="deleteReward(${i})" style="background:#ffb2b2;color:#a00;padding:3px 14px;border-radius:5px;margin-right:10px;">Delete</button>
                <button onclick="changeRewardAmount(${i})" style="background:#ffe177;color:#65430a;padding:3px 14px;border-radius:5px;">Change cost</button>
              </div>
            `:''}
          </div>
          ${userRole()==='user'?`
            <button onclick="claimReward(${i})" style="background: #6fedd1; color: white; border: none; border-radius: 8px; padding: 6px 16px; font-weight: bold;" ${pts < r.cost ? 'disabled style="opacity:0.6;cursor:not-allowed"' : ''}>-${r.cost}</button>
          `:''}
        </div>
      `;
    });
  }
  page.appendChild(section);
}

// === Полученные награды ===
function renderClaimed() {
  const page = document.getElementById('page-claimed');
  page.innerHTML = `
    <div class="section" style="text-align: center;">
      <h2 style="font-size: 2rem; color: var(--text-dark);">Claimed Rewards</h2>
      <p style="color: #666; margin: 10px 0;">Your purchased rewards:</p>
    </div>
  `;
  const section = document.createElement('div');
  section.className = 'section';
  const claimed = (allData.claimed||[]).filter(r => r.username === currentUser);
  if (claimed.length === 0) {
    section.innerHTML = '<p>No claimed rewards.</p>';
  } else {
    claimed.forEach((r, i) => {
      section.innerHTML += `
        <div style="border: 2px solid #fdd36a; border-radius: 12px; padding: 12px; margin-bottom: 12px;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div>
              <strong>${r.emoji ? r.emoji + ' ' : ''}${r.name}</strong>
              <div style="color: #666; font-size: 0.9rem;">${r.desc}</div>
              <span style="color:#888;font-size:0.93em;">${r.category ? `Category: ${r.category}` : ''}</span>
            </div>
            ${
              r.done
              ? `<button class="paw-btn done" disabled title="Received">🐾 Received</button>`
              : userRole()==='user'
                ? `<button class="paw-btn" disabled title="Only Questmaster can mark">🐾 Mark as received</button>`
                : `<button class="paw-btn" onclick="markRewardDone(${i})" title="Mark as received">🐾 Mark as received</button>`
            }
          </div>
          <small>Claimed: ${new Date(r.claimedAt).toLocaleString()}</small>
        </div>
      `;
    });
  }
  page.appendChild(section);
}

// === Настройки ===
function renderSettings() {
  const role = userRole();
  document.getElementById('page-settings').innerHTML = `
    <div class="settings-section">
      <h3>General</h3>
      <button onclick="resetAllData()">Reset all data</button>
      <div style="font-size:0.98em; color:#a4067b; margin-top:7px;">Warning: this clears all quests, rewards and history for this account</div>
    </div>
    <div class="settings-section">
      <h3>Role</h3>
      <div style="margin-bottom:12px;">
        <label>
          <input type="radio" name="role" value="user" ${role==='user'?'checked':''} onchange="switchRole('user')" />
          Performer
        </label>
        <label style="margin-left:24px;">
          <input type="radio" name="role" value="admin" ${role==='admin'?'checked':''} onchange="switchRole('admin')" />
          Questmaster
        </label>
      </div>
      <div style="font-size:0.97em;color:#777;">Performer: mark quests as done, buy rewards<br>Questmaster: create/delete quests and rewards, change reward cost, mark received</div>
    </div>
    <div class="settings-section">
      <h3>Custom categories</h3>
      <div>
        <b>Tasks:</b>
        <ul id="custom-task-list">${(allData.customTaskCategories||[]).map(c=>`<li>${c}</li>`).join('')}</ul>
        <input id="custom-task-input" type="text" maxlength="18" placeholder="Add custom task category" style="width:80%;margin:5px 0;">
        <button onclick="addCustomTaskCategory()">Add</button>
      </div>
      <div style="margin-top:10px;">
        <b>Rewards:</b>
        <ul id="custom-reward-list">${(allData.customRewardCategories||[]).map(c=>`<li>${c}</li>`).join('')}</ul>
        <input id="custom-reward-input" type="text" maxlength="18" placeholder="Add custom reward category" style="width:80%;margin:5px 0;">
        <button onclick="addCustomRewardCategory()">Add</button>
      </div>
    </div>
    <div class="settings-section" style="text-align:center;">
      <h3>About</h3>
      <div style="color:#065f54;">Talk to my paw — локальное приложение для квестов и наград 🐾</div>
    </div>
    <div style="text-align:center;">
      <button class="logout-btn" onclick="signOut()">Выйти из аккаунта</button>
    </div>
  `;
}
window.switchRole = function switchRole(role) {
  if (!currentUser) return;
  if (!allData.users[currentUser]) allData.users[currentUser] = { password: "", role: "user" };
  allData.users[currentUser].role = role;
  syncToFirebase();
  renderAll(currentPage);
};
window.resetAllData = function resetAllData() {
  if (confirm('Are you sure you want to reset all data?')) {
    if (!currentUser) return;
    Object.keys(allData.points).forEach(u=>{if(u===currentUser)allData.points[u]=0;});
    allData.completed = allData.completed.filter(q=>q.username!==currentUser);
    allData.claimed = allData.claimed.filter(r=>r.username!==currentUser);
    syncToFirebase();
    renderAll(currentPage);
  }
}
window.addCustomTaskCategory = function() {
  const val = document.getElementById('custom-task-input').value.trim();
  if (!val) return;
  if (!allData.customTaskCategories.includes(val)) {
    allData.customTaskCategories.push(val);
    syncToFirebase();
    renderSettings();
  }
}
window.addCustomRewardCategory = function() {
  const val = document.getElementById('custom-reward-input').value.trim();
  if (!val) return;
  if (!allData.customRewardCategories.includes(val)) {
    allData.customRewardCategories.push(val);
    syncToFirebase();
    renderSettings();
  }
}

// === CRUD ===
window.addTask = function addTask() {
  if (userRole() !== 'admin') return;
  const type = document.getElementById('questType').value;
  const name = document.getElementById('taskName').value.trim();
  let category = document.getElementById('taskEmoji').value.trim();
  const desc = document.getElementById('taskDesc').value.trim();
  const pts = parseInt(document.getElementById('taskPoints').value);
  // Проверяем кастомную категорию
  if (category === "CUSTOM" || !category) {
    category = prompt("Введите свою категорию для задания (например, 🚗 Машина, 📈 Работа и т.д.):", "");
    if (category && !allData.customTaskCategories.includes(category)) {
      allData.customTaskCategories.push(category);
    }
  }
  if (!name || isNaN(pts)) return alert('Please enter valid quest data.');
  const createdAt = new Date().toISOString();
  allData.quests.push({ type, name, emoji: category, desc, pts, createdAt, category });
  syncToFirebase();
  renderQuests();
  renderGlobalBalance(currentPage);
};
window.addReward = function addReward() {
  if (userRole() !== 'admin') return;
  const name = document.getElementById('rewardName').value.trim();
  let category = document.getElementById('rewardEmoji').value.trim();
  const desc = document.getElementById('rewardDesc').value.trim();
  const cost = parseInt(document.getElementById('rewardCost').value);
  // Проверяем кастомную категорию
  if (category === "CUSTOM" || !category) {
    category = prompt("Введите свою категорию для награды (например, 🏖️ Отдых, 🍔 Еда и т.д.):", "");
    if (category && !allData.customRewardCategories.includes(category)) {
      allData.customRewardCategories.push(category);
    }
  }
  if (!name || isNaN(cost)) return alert('Please enter valid reward data.');
  allData.rewards.push({ name, emoji: category, desc, cost, category });
  syncToFirebase();
  renderShop();
  renderGlobalBalance(currentPage);
};
window.completeTask = function completeTask(index) {
  if (userRole() !== 'user') return;
  const q = allData.quests[index];
  allData.points[currentUser] = (allData.points[currentUser] || 0) + q.pts;
  allData.completed.push({ ...q, completedAt: new Date().toISOString(), username: currentUser });
  allData.quests.splice(index, 1);
  syncToFirebase();
  renderQuests();
  renderGlobalBalance(currentPage);
};
window.deleteQuest = function deleteQuest(index) {
  if (userRole() !== 'admin') return;
  if (confirm('Delete this quest?')) {
    allData.quests.splice(index, 1);
    syncToFirebase();
    renderQuests();
    renderGlobalBalance(currentPage);
  }
};
window.claimReward = function claimReward(index) {
  if (userRole() !== 'user') return;
  const r = allData.rewards[index];
  if ((allData.points[currentUser]||0) < r.cost) return alert('Not enough paw points.');
  allData.points[currentUser] -= r.cost;
  allData.claimed.push({ ...r, claimedAt: new Date().toISOString(), done: false, username: currentUser });
  syncToFirebase();
  renderClaimed();
  renderGlobalBalance(currentPage);
};
window.markRewardDone = function markRewardDone(index) {
  if (userRole() !== 'admin') return;
  const userClaimed = (allData.claimed||[]).filter(r=>r.username===currentUser);
  if (!userClaimed[index].done) {
    userClaimed[index].done = true;
    syncToFirebase();
    renderClaimed();
    renderGlobalBalance(currentPage);
  }
};
window.deleteReward = function deleteReward(index) {
  if (userRole() !== 'admin') return;
  if (confirm('Delete this reward?')) {
    allData.rewards.splice(index, 1);
    syncToFirebase();
    renderShop();
    renderGlobalBalance(currentPage);
  }
};
window.changeRewardAmount = function changeRewardAmount(index) {
  if (userRole() !== 'admin') return;
  const val = prompt('Enter new cost (number of paw points):', allData.rewards[index].cost);
  if (val !== null && !isNaN(parseInt(val))) {
    allData.rewards[index].cost = parseInt(val);
    syncToFirebase();
    renderShop();
    renderGlobalBalance(currentPage);
  }
};

// === Статистика ===
function renderStats() {
  const today = new Date().toDateString();
  const week = new Date();
  week.setDate(week.getDate() - 7);
  const userCompleted = (allData.completed||[]).filter(q => q.username === currentUser);
  const countToday = userCompleted.filter(q => new Date(q.completedAt).toDateString() === today).length;
  const countWeek = userCompleted.filter(q => new Date(q.completedAt) > week).length;
  const countAll = userCompleted.length;
  document.querySelectorAll('#count-today').forEach(el => el.innerText = countToday);
  document.querySelectorAll('#count-week').forEach(el => el.innerText = countWeek);
  document.querySelectorAll('#count-all').forEach(el => el.innerText = countAll);
  document.querySelectorAll('#points').forEach(el => el.innerText = allData.points[currentUser] || 0);
}

// === Навигация ===
const pages = document.querySelectorAll('.page');
const navLinks = document.querySelectorAll('nav.bottom a');
navLinks.forEach(link => {
  link.addEventListener('click', () => {
    const target = link.getAttribute('data-page');
    currentPage = target;
    pages.forEach(p => p.classList.remove('active'));
    document.getElementById(`page-${target}`).classList.add('active');
    navLinks.forEach(l => l.classList.remove('active'));
    link.classList.add('active');
    renderAll(target);
  });
});

// === Рендерить всё ===
function renderAll(page) {
  if (!page) page = currentPage;
  currentPage = page;
  updateUserUI();
  renderGlobalBalance(page);
  if (!currentUser) {
    showLogin();
    pages.forEach(p => p.classList.remove('active'));
    return;
  }
  if (page === "main") renderMain();
  else if (page === "shop") renderShop();
  else if (page === "tasks") renderQuests();
  else if (page === "claimed") renderClaimed();
  else if (page === "settings") renderSettings();
  pages.forEach(p => p.classList.remove('active'));
  const activePage = `page-${page}`;
  document.getElementById(activePage).classList.add('active');
  navLinks.forEach(l => l.classList.remove('active'));
  navLinks.forEach(l => { if (l.getAttribute('data-page') === page) l.classList.add('active'); });
  renderStats();
}

// === On load ===
window.addEventListener('DOMContentLoaded', () => {
  if (currentUser && !allData.users[currentUser]) {
    setUser(currentUser);
  } else {
    renderAll(currentPage);
  }
  document.getElementById('loader').style.display = 'none';
});
