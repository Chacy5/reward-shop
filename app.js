// Импорт Firebase и Firestore (замените конфиг на свой!)
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.8.1/firebase-app.js";
import { getFirestore, doc, setDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/11.8.1/firebase-firestore.js";

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

let currentUser = localStorage.getItem('pawCurrentUser') || "";
let groupId = "demo-family";
let allData = {
  users: {},
  quests: [],
  completed: [],
  rewards: [],
  claimed: [],
  points: {},
  customQuestCats: [],
  customRewardCats: []
};
let isInitialSync = true;
let currentPage = "main";

// --- Firestore Sync ---
function syncToFirebase() {
  setDoc(doc(db, "groups", groupId), allData);
}
function listenFromFirebase() {
  onSnapshot(doc(db, "groups", groupId), (docSnap) => {
    if (docSnap.exists()) {
      Object.assign(allData, docSnap.data());
      isInitialSync = false;
      renderAll();
    }
  });
}
listenFromFirebase();

// --- DEMO DATA ---
function addDemoData() {
  allData.quests = [
    { type: 'daily', name: 'Feed the cat', emoji: '🧑‍🍳', desc: 'Give breakfast to your cat', pts: 3, cat: 'Уход' },
    { type: 'weekly', name: 'Clean up room', emoji: '🧹', desc: 'Tidy up your room on Saturday', pts: 5, cat: 'Дом' }
  ];
  allData.rewards = [
    { name: 'Chocolate bar', emoji: '🍫', desc: 'Sweet treat', cost: 6, cat: 'Еда' },
    { name: 'Movie night', emoji: '🎬', desc: 'Watch a movie', cost: 14, cat: 'Развлечения' }
  ];
  allData.completed = [];
  allData.claimed = [];
  allData.points = { demo: 11 };
  allData.users.demo = { password: "demo", role: "user" };
  allData.customQuestCats = ['Уход', 'Дом'];
  allData.customRewardCats = ['Еда', 'Развлечения'];
  syncToFirebase();
}

// --- User Logic, Demo Mode ---
function isDemo() { return !currentUser; }
function userRole() {
  return (allData.users[currentUser] && allData.users[currentUser].role) || "user";
}
function setUser(login) {
  currentUser = login;
  localStorage.setItem('pawCurrentUser', login);
  if (!allData.users[login]) {
    allData.users[login] = { role: "user", password: "" };
    allData.points[login] = 0;
    syncToFirebase();
  }
  renderAll();
}

// --- Навигация ---
const pages = document.querySelectorAll('.page');
const navLinks = document.querySelectorAll('nav.bottom a');
navLinks.forEach(link => {
  link.addEventListener('click', () => {
    const target = link.getAttribute('data-page');
    currentPage = target;
    updatePages();
  });
});
function updatePages() {
  pages.forEach(p => p.classList.remove('active'));
  navLinks.forEach(l => l.classList.remove('active'));
  if (currentPage === "settings" && isDemo()) {
    document.getElementById('page-settings').classList.remove('active');
    navLinks.forEach(l => { if (l.getAttribute('data-page') === "settings") l.classList.remove('active'); });
    currentPage = "main";
    document.getElementById('page-main').classList.add('active');
    navLinks.forEach(l => { if (l.getAttribute('data-page') === "main") l.classList.add('active'); });
  } else {
    document.getElementById('page-' + currentPage).classList.add('active');
    navLinks.forEach(l => { if (l.getAttribute('data-page') === currentPage) l.classList.add('active'); });
  }
  // Баланс виден на всех, кроме settings и если есть пользователь или демо
  document.getElementById('paw-balance').style.display = (currentPage !== "settings" && (currentUser || isDemo())) ? "flex" : "none";
  document.getElementById('paw-balance-val').textContent = (allData.points[currentUser] || 0);
}

// --- Категории (кастомные) ---
function getQuestCats() {
  return ['Уход', 'Дом', 'Учёба', ...allData.customQuestCats.filter(c=>c)];
}
function getRewardCats() {
  return ['Еда', 'Развлечения', ...allData.customRewardCats.filter(c=>c)];
}
window.addQuestCat = function addQuestCat(cat) {
  if (!cat) return;
  if (!allData.customQuestCats.includes(cat)) allData.customQuestCats.push(cat);
  syncToFirebase();
  renderAll();
}
window.addRewardCat = function addRewardCat(cat) {
  if (!cat) return;
  if (!allData.customRewardCats.includes(cat)) allData.customRewardCats.push(cat);
  syncToFirebase();
  renderAll();
}

// --- Main ---
function renderMain() {
  if (isDemo()) {
    document.getElementById('page-main').innerHTML = `
    <div class="section" style="text-align: center;">
      <h2 style="font-size: 2rem; color: var(--text-dark);">Демо-версия</h2>
      <p style="font-size: 1.15rem; margin: 10px 0 20px 0;">Сейчас вы смотрите демо-версию приложения.<br>Чтобы использовать все возможности, <button class="paw-action-btn" style="margin:2px 0;display:inline-block;" onclick="showRegister()">Зарегистрируйтесь</button></p>
    </div>
    `;
  } else {
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
    `;
  }
}

// --- Quests ---
function renderQuests() {
  const page = document.getElementById('page-tasks');
  const quests = isDemo() ? [
    { type: 'daily', name: 'Feed the cat', emoji: '🧑‍🍳', desc: 'Give breakfast to your cat', pts: 3, cat: 'Уход' },
    { type: 'weekly', name: 'Clean up room', emoji: '🧹', desc: 'Tidy up your room on Saturday', pts: 5, cat: 'Дом' }
  ] : allData.quests;
  page.innerHTML = `<div class="section" style="text-align: center;"><h2 style="font-size: 2rem; color: var(--text-dark);">Quests</h2></div>`;
  const section = document.createElement('div');
  section.className = 'section';
  if (!quests || quests.length === 0) section.innerHTML = '<p>No quests yet.</p>';
  else {
    quests.forEach((q, i) => {
      const card = document.createElement('div');
      card.className = 'card ' + q.type;
      card.innerHTML = `
        <div class="flex">
          <div>
            <b>${q.emoji ? q.emoji + ' ' : ''}${q.name}</b>
            <span>(${q.pts} points)</span>
            <p class="desc">${q.desc || ''} <span style="font-size:0.9em;color:#888;">[${q.cat||''}]</span></p>
          </div>
        </div>
      `;
      section.appendChild(card);
    });
  }
  page.appendChild(section);
}

// --- Rewards (Shop) ---
function renderShop() {
  const page = document.getElementById('page-shop');
  const rewards = isDemo() ? [
    { name: 'Chocolate bar', emoji: '🍫', desc: 'Sweet treat', cost: 6, cat: 'Еда' },
    { name: 'Movie night', emoji: '🎬', desc: 'Watch a movie', cost: 14, cat: 'Развлечения' }
  ] : allData.rewards;
  let pts = isDemo() ? 11 : (allData.points[currentUser] || 0);
  page.innerHTML = `<div class="section" style="text-align: center;">
    <h2 style="font-size: 2rem; color: var(--text-dark);">Reward Store</h2>
    <p style="font-size: 1.1rem; color: #333; margin: 8px 0;">🐾 Balance: <strong id="points">${pts}</strong></p>
  </div>`;
  const section = document.createElement('div');
  section.className = 'section';
  if (!rewards || rewards.length === 0) {
    section.innerHTML = '<p>No rewards yet.</p>';
  } else {
    rewards.forEach((r, i) => {
      section.innerHTML += `
        <div style="border: 2px solid #6fedd1; border-radius: 12px; padding: 12px; margin-bottom: 12px; display: flex; justify-content: space-between; align-items: center;">
          <div>
            <strong>${r.emoji ? r.emoji + ' ' : ''}${r.name}</strong>
            <div style="color: #666; font-size: 0.9rem;">${r.desc} <span style="font-size:0.9em;color:#888;">[${r.cat||''}]</span></div>
          </div>
        </div>
      `;
    });
  }
  page.appendChild(section);
}

// --- Claimed ---
function renderClaimed() {
  const page = document.getElementById('page-claimed');
  page.innerHTML = `<div class="section" style="text-align: center;"><h2 style="font-size: 2rem; color: var(--text-dark);">Claimed Rewards</h2></div>`;
  const section = document.createElement('div');
  section.className = 'section';
  section.innerHTML = isDemo()
    ? '<p>Демо: ваши полученные награды будут тут.</p>'
    : '<p>Здесь будут ваши полученные награды.</p>';
  page.appendChild(section);
}

// --- Settings ---
function renderSettings() {
  if (isDemo()) {
    document.getElementById('page-settings').innerHTML = '';
    return;
  }
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
      <h3>Custom Categories</h3>
      <div style="margin-bottom:8px;">
        <b>Quests:</b> ${getQuestCats().join(', ')}
        <form onsubmit="event.preventDefault();addQuestCat(this.cat.value);this.cat.value='';">
          <input name="cat" placeholder="Add quest category..." required style="margin:6px 0;"/>
          <button type="submit">Add</button>
        </form>
      </div>
      <div>
        <b>Rewards:</b> ${getRewardCats().join(', ')}
        <form onsubmit="event.preventDefault();addRewardCat(this.cat.value);this.cat.value='';">
          <input name="cat" placeholder="Add reward category..." required style="margin:6px 0;"/>
          <button type="submit">Add</button>
        </form>
      </div>
    </div>
    <button class="logout-btn" onclick="signOut()">Выйти из аккаунта</button>
  `;
}
window.switchRole = function(role) {
  if (!currentUser) return;
  if (!allData.users[currentUser]) allData.users[currentUser] = { password: "", role: "user" };
  allData.users[currentUser].role = role;
  syncToFirebase();
  renderAll();
};
window.resetAllData = function() {
  if (confirm('Are you sure you want to reset all data?')) {
    if (!currentUser) return;
    Object.keys(allData.points).forEach(u=>{if(u===currentUser)allData.points[u]=0;});
    allData.completed = allData.completed.filter(q=>q.username!==currentUser);
    allData.claimed = allData.claimed.filter(r=>r.username!==currentUser);
    syncToFirebase();
    renderAll();
  }
}

// --- Auth ---
window.signOut = function() {
  localStorage.removeItem('pawCurrentUser');
  currentUser = "";
  renderAll();
}
window.showRegister = function showRegister() { alert("Окно регистрации (реализуйте свой modal)"); }
window.showLogin = function showLogin() { alert("Окно логина (реализуйте свой modal)"); }

// --- Render ---
function renderAll() {
  renderMain();
  renderShop();
  renderQuests();
  renderClaimed();
  renderSettings();
  updatePages();
}

window.addEventListener('DOMContentLoaded', () => {
  if (isInitialSync && Object.keys(allData.users).length === 0 && allData.quests.length === 0 && allData.rewards.length === 0) addDemoData();
  renderAll();
  document.getElementById('loader').style.display = 'none';
});
