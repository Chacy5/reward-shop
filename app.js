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

// --- App State ---
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
    { type: 'daily', name: 'Feed the cat', emoji: '🧑‍🍳', desc: 'Give breakfast to your cat', pts: 3, cat: 'Care' },
    { type: 'weekly', name: 'Clean up room', emoji: '🧹', desc: 'Tidy up your room on Saturday', pts: 5, cat: 'Home' }
  ];
  allData.rewards = [
    { name: 'Chocolate bar', emoji: '🍫', desc: 'Sweet treat', cost: 6, cat: 'Food' },
    { name: 'Movie night', emoji: '🎬', desc: 'Watch a movie', cost: 14, cat: 'Fun' }
  ];
  allData.completed = [];
  allData.claimed = [];
  allData.points = { demo: 11 };
  allData.users.demo = { password: "demo", role: "user" };
  allData.customQuestCats = ['Care', 'Home'];
  allData.customRewardCats = ['Food', 'Fun'];
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

// --- NAVIGATION ---
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
  document.getElementById('paw-balance').style.display = (currentPage !== "settings" && (currentUser || isDemo())) ? "flex" : "none";
  document.getElementById('paw-balance-val').textContent = (allData.points[currentUser] || 0);
}

// --- Категории (кастомные) ---
function getQuestCats() {
  return ['Care', 'Home', 'Study', ...allData.customQuestCats.filter(c=>c)];
}
function getRewardCats() {
  return ['Food', 'Fun', ...allData.customRewardCats.filter(c=>c)];
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

// --- Modals & Auth ---
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
  renderQuestCatSelect();
  document.getElementById('quest-modal-bg').style.display = 'flex';
  setTimeout(() => { document.getElementById('taskName').focus(); }, 90);
}
window.closeQuestModal = function closeQuestModal() { document.getElementById('quest-modal-bg').style.display = 'none'; }
window.showRewardModal = function showRewardModal() {
  if (userRole() !== 'admin') return;
  closeAllModals();
  renderRewardCatSelect();
  document.getElementById('reward-modal-bg').style.display = 'flex';
  setTimeout(() => { document.getElementById('rewardName').focus(); }, 90);
}
window.closeRewardModal = function closeRewardModal() { document.getElementById('reward-modal-bg').style.display = 'none'; }
function closeAllModals() {
  ['login-modal-bg','register-modal-bg','quest-modal-bg','reward-modal-bg'].forEach(id => {
    let el = document.getElementById(id);
    if (el) el.style.display = 'none';
  });
}

// --- Custom Category Select Logic ---
window.questCatSelectHandler = function(sel) {
  let catInput = document.getElementById('taskCatCustom');
  if (sel.value === "__custom__") {
    catInput.style.display = "block";
    catInput.focus();
  } else {
    catInput.style.display = "none";
  }
};
window.rewardCatSelectHandler = function(sel) {
  let catInput = document.getElementById('rewardCatCustom');
  if (sel.value === "__custom__") {
    catInput.style.display = "block";
    catInput.focus();
  } else {
    catInput.style.display = "none";
  }
};
function renderQuestCatSelect() {
  let select = document.getElementById('taskCat');
  select.innerHTML = `<option value="">No category</option>`;
  getQuestCats().forEach(cat => select.innerHTML += `<option value="${cat}">${cat}</option>`);
  select.innerHTML += `<option value="__custom__">Add new...</option>`;
  document.getElementById('taskCatCustom').style.display = "none";
}
function renderRewardCatSelect() {
  let select = document.getElementById('rewardCat');
  select.innerHTML = `<option value="">No category</option>`;
  getRewardCats().forEach(cat => select.innerHTML += `<option value="${cat}">${cat}</option>`);
  select.innerHTML += `<option value="__custom__">Add new...</option>`;
  document.getElementById('rewardCatCustom').style.display = "none";
}

// --- Auth Logic ---
window.doLogin = function doLogin() {
  let login = document.getElementById('login-username').value.trim();
  let pass = document.getElementById('login-password').value.trim();
  if (!login || !pass) { document.getElementById('login-err').textContent = "Fill both fields"; return; }
  if (!allData.users[login] || allData.users[login].password !== pass) { document.getElementById('login-err').textContent = "Wrong login or password"; return; }
  setUser(login);
  closeAllModals();
  renderAll();
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
  renderAll();
}
window.signOut = function() {
  localStorage.removeItem('pawCurrentUser');
  currentUser = "";
  renderAll();
}

// --- Main ---
function renderMain() {
  if (isDemo()) {
    document.getElementById('page-main').innerHTML = `
    <div class="section" style="text-align: center;">
      <h2 style="font-size: 2rem; color: var(--text-dark);">Demo version</h2>
      <p style="font-size: 1.15rem; margin: 10px 0 20px 0;">This is a demo. For full access, <button class="paw-action-btn" style="margin:2px 0;display:inline-block;" onclick="showRegister()">Register</button></p>
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
    { type: 'daily', name: 'Feed the cat', emoji: '🧑‍🍳', desc: 'Give breakfast to your cat', pts: 3, cat: 'Care' },
    { type: 'weekly', name: 'Clean up room', emoji: '🧹', desc: 'Tidy up your room on Saturday', pts: 5, cat: 'Home' }
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
          <div>
            ${!isDemo() && userRole()==='user'?`<button onclick="completeTask(${i})" title="Complete">✔️</button>`:''}
            ${!isDemo() && userRole()==='admin'?`<button onclick="deleteQuest(${i})" title="Delete">❌</button>`:''}
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
    { name: 'Chocolate bar', emoji: '🍫', desc: 'Sweet treat', cost: 6, cat: 'Food' },
    { name: 'Movie night', emoji: '🎬', desc: 'Watch a movie', cost: 14, cat: 'Fun' }
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
          <div>
            ${!isDemo() && userRole()==='user'?`<button onclick="claimReward(${i})" ${pts<r.cost?'disabled':''}>-${r.cost}</button>`:''}
            ${!isDemo() && userRole()==='admin'?`<button onclick="deleteReward(${i})" style="background:#ffb2b2;color:#a00;">Delete</button>`:''}
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
  if (isDemo()) {
    section.innerHTML = '<p>Demo: your claimed rewards will appear here.</p>';
  } else {
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
                <div style="color: #666; font-size: 0.9rem;">${r.desc}<span style="font-size:0.9em;color:#888;"> [${r.cat||''}]</span></div>
              </div>
              ${
                r.done
                ? `<button class="paw-action-btn" style="background:#d0ffd0;color:#0b8f57;" disabled>Received</button>`
                : userRole()==='user'
                  ? `<button class="paw-action-btn" disabled>Waiting...</button>`
                  : `<button class="paw-action-btn" onclick="markRewardDone(${i})">Mark as received</button>`
              }
            </div>
            <small>Claimed: ${r.claimedAt?new Date(r.claimedAt).toLocaleString():"-"}</small>
          </div>
        `;
      });
    }
  }
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
    <button class="logout-btn" onclick="signOut()">Sign out</button>
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

// --- CRUD ---
window.addTask = function addTask() {
  if (userRole() !== 'admin') return;
  const type = document.getElementById('questType').value;
  const name = document.getElementById('taskName').value.trim();
  let cat = document.getElementById('taskCat').value;
  if (cat === "__custom__") {
    cat = document.getElementById('taskCatCustom').value.trim();
    if (cat) addQuestCat(cat);
  }
  const desc = document.getElementById('taskDesc').value.trim();
  const pts = parseInt(document.getElementById('taskPoints').value);
  if (!name || isNaN(pts)) return alert('Please enter valid quest data.');
  const createdAt = new Date().toISOString();
  allData.quests.push({ type, name, emoji: '', desc, pts, cat, createdAt });
  syncToFirebase();
  renderAll();
};
window.addReward = function addReward() {
  if (userRole() !== 'admin') return;
  const name = document.getElementById('rewardName').value.trim();
  let cat = document.getElementById('rewardCat').value;
  if (cat === "__custom__") {
    cat = document.getElementById('rewardCatCustom').value.trim();
    if (cat) addRewardCat(cat);
  }
  const desc = document.getElementById('rewardDesc').value.trim();
  const cost = parseInt(document.getElementById('rewardCost').value);
  if (!name || isNaN(cost)) return alert('Please enter valid reward data.');
  allData.rewards.push({ name, emoji: '', desc, cost, cat });
  syncToFirebase();
  renderAll();
};
window.completeTask = function completeTask(index) {
  if (userRole() !== 'user') return;
  const q = allData.quests[index];
  allData.points[currentUser] = (allData.points[currentUser] || 0) + q.pts;
  allData.completed.push({ ...q, completedAt: new Date().toISOString(), username: currentUser });
  allData.quests.splice(index, 1);
  syncToFirebase();
  renderAll();
};
window.deleteQuest = function deleteQuest(index) {
  if (userRole() !== 'admin') return;
  if (confirm('Delete this quest?')) {
    allData.quests.splice(index, 1);
    syncToFirebase();
    renderAll();
  }
};
window.claimReward = function claimReward(index) {
  if (userRole() !== 'user') return;
  const r = allData.rewards[index];
  if ((allData.points[currentUser]||0) < r.cost) return alert('Not enough paw points.');
  allData.points[currentUser] -= r.cost;
  allData.claimed.push({ ...r, claimedAt: new Date().toISOString(), done: false, username: currentUser });
  syncToFirebase();
  renderAll();
};
window.markRewardDone = function markRewardDone(index) {
  if (userRole() !== 'admin') return;
  const userClaimed = (allData.claimed||[]).filter(r=>r.username===currentUser);
  if (!userClaimed[index].done) {
    userClaimed[index].done = true;
    syncToFirebase();
    renderAll();
  }
};
window.deleteReward = function deleteReward(index) {
  if (userRole() !== 'admin') return;
  if (confirm('Delete this reward?')) {
    allData.rewards.splice(index, 1);
    syncToFirebase();
    renderAll();
  }
};

// --- Render All ---
function renderAll() {
  renderMain();
  renderShop();
  renderQuests();
  renderClaimed();
  renderSettings();
  updatePages();
}

// --- Start ---
window.addEventListener('DOMContentLoaded', () => {
  if (isInitialSync && Object.keys(allData.users).length === 0 && allData.quests.length === 0 && allData.rewards.length === 0) addDemoData();
  renderAll();
  document.getElementById('loader').style.display = 'none';
});
