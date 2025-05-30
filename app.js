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

let currentUser = localStorage.getItem('pawCurrentUser') || "";
let groupId = "demo-family";
let allData = {
  users: {},
  quests: [],
  completed: [],
  rewards: [],
  claimed: [],
  points: {}
};
let isInitialSync = true;
let currentPage = "main";

// === Firestore Sync ===
function syncToFirebase() {
  setDoc(doc(db, "groups", groupId), allData);
}
function listenFromFirebase() {
  onSnapshot(doc(db, "groups", groupId), (docSnap) => {
    if (docSnap.exists()) {
      const prevUser = currentUser;
      Object.assign(allData, docSnap.data());
      if (isInitialSync && Object.keys(allData.users).length === 0 && allData.quests.length === 0 && allData.rewards.length === 0) {
        addDemoData();
      }
      isInitialSync = false;
      if (prevUser && allData.users[prevUser]) {
        currentUser = prevUser;
        localStorage.setItem('pawCurrentUser', currentUser);
      }
      renderAll();
    }
  });
}
listenFromFirebase();

// === Demo Data ===
function addDemoData() {
  allData.quests = [
    { type: 'daily', name: 'Feed the cat', emoji: '🧑‍🍳', desc: 'Give breakfast to your cat', pts: 3 },
    { type: 'daily', name: 'Morning walk', emoji: '🚶‍♂️', desc: '10 min walk in the park', pts: 2 },
    { type: 'weekly', name: 'Clean up room', emoji: '🧹', desc: 'Tidy up your room on Saturday', pts: 5 },
    { type: 'weekly', name: 'Call grandma', emoji: '☎️', desc: 'Check in on your grandma', pts: 4 },
    { type: 'event', name: 'Birthday surprise', emoji: '🎉', desc: 'Organize a surprise for a friend', pts: 10 }
  ];
  allData.completed = [
    { username: "demo", type: 'daily', name: 'Brush teeth', emoji: '🦷', desc: 'Morning and evening', pts: 1, completedAt: new Date(Date.now() - 86400000).toISOString() }
  ];
  allData.rewards = [
    { name: 'Chocolate bar', emoji: '🍫', desc: 'Sweet treat', cost: 6 },
    { name: 'Coffee break', emoji: '☕', desc: 'Buy yourself a nice coffee', cost: 8 },
    { name: 'Movie night', emoji: '🎬', desc: 'Watch a movie with popcorn', cost: 14 },
    { name: 'Game hour', emoji: '🎮', desc: 'Play your favorite game for 1 hour', cost: 10 },
    { name: 'Cute sticker', emoji: '🧸', desc: 'Get a cute sticker for your notebook', cost: 2 }
  ];
  allData.claimed = [
    { username: "demo", name: 'Donut', emoji: '🍩', desc: 'Yummy donut', cost: 5, claimedAt: new Date(Date.now() - 3600 * 1000 * 6).toISOString(), done: true }
  ];
  allData.points = { demo: 11 };
  allData.users.demo = { password: "demo", role: "user" };
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
  renderAll();
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

// === Modal Windows ===
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
  document.getElementById('quest-modal-bg').style.display = 'flex';
  setTimeout(() => { document.getElementById('taskName').focus(); }, 90);
}
window.closeQuestModal = function closeQuestModal() { document.getElementById('quest-modal-bg').style.display = 'none'; }
window.showRewardModal = function showRewardModal() {
  if (userRole() !== 'admin') return;
  closeAllModals();
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
window.signOut = function signOut() {
  localStorage.removeItem('pawCurrentUser');
  currentUser = "";
  renderAll();
}

// === Navigation and Page Switch ===
const pages = document.querySelectorAll('.page');
const navLinks = document.querySelectorAll('nav.bottom a');
navLinks.forEach(link => {
  link.addEventListener('click', () => {
    const target = link.getAttribute('data-page');
    currentPage = target;
    renderAll();
  });
});

// === Filters/Search ===
let questFilterType = "", questFilterText = "";
let rewardFilterText = "";
function renderQuestFilters() {
  const bar = document.createElement('div');
  bar.className = "filter-bar";
  bar.innerHTML = `
    <label>Type:
      <select onchange="window.setQuestFilterType(this.value)">
        <option value="">All</option>
        <option value="daily"${questFilterType==='daily'?' selected':''}>Daily</option>
        <option value="weekly"${questFilterType==='weekly'?' selected':''}>Weekly</option>
        <option value="event"${questFilterType==='event'?' selected':''}>Event</option>
      </select>
    </label>
    <label>Search:
      <input type="text" placeholder="Name/desc" value="${questFilterText}" oninput="window.setQuestFilterText(this.value)" />
    </label>
  `;
  return bar;
}
window.setQuestFilterType = function(v) { questFilterType = v; renderAll(); }
window.setQuestFilterText = function(v) { questFilterText = v; renderAll(); }
function filterQuests() {
  let arr = allData.quests || [];
  if (questFilterType) arr = arr.filter(q=>q.type===questFilterType);
  if (questFilterText) arr = arr.filter(q=>(q.name+q.desc).toLowerCase().includes(questFilterText.toLowerCase()));
  return arr;
}
function renderRewardFilters() {
  const bar = document.createElement('div');
  bar.className = "filter-bar";
  bar.innerHTML = `
    <label>Search:
      <input type="text" placeholder="Reward..." value="${rewardFilterText}" oninput="window.setRewardFilterText(this.value)" />
    </label>
  `;
  return bar;
}
window.setRewardFilterText = function(v) { rewardFilterText = v; renderAll(); }
function filterRewards() {
  let arr = allData.rewards || [];
  if (rewardFilterText) arr = arr.filter(r=>(r.name+r.desc).toLowerCase().includes(rewardFilterText.toLowerCase()));
  return arr;
}

// === Main, Quests, Shop, Claimed, Settings Pages ===
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
    ${
      userRole() === 'admin' ?
      `<div class="section" style="text-align: center;display:flex;flex-wrap:wrap;justify-content:center;gap:16px;">
        <button class="paw-action-btn" type="button" onclick="showQuestModal()">
          <img src="image6" width="28" height="28" style="vertical-align:middle;" alt="Quest"/> New Quest
        </button>
        <button class="paw-action-btn" type="button" onclick="showRewardModal()">
          <img src="image2" width="28" height="28" style="vertical-align:middle;" alt="Reward"/> New Reward
        </button>
      </div>`
      : ''
    }
  `;
}
function renderQuests() {
  const page = document.getElementById('page-tasks');
  page.innerHTML = `<div class="section" style="text-align: center;"><h2 style="font-size: 2rem; color: var(--text-dark);">Quests</h2></div>`;
  page.appendChild(renderQuestFilters());
  const section = document.createElement('div');
  section.className = 'section';
  let quests = filterQuests();
  if (!quests || quests.length === 0) section.innerHTML = '<p>No quests yet.</p>';
  else {
    ['daily', 'weekly', 'event'].forEach(type => {
      const filtered = quests.filter(q => q.type === type);
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
        <small>Completed: ${new Date(q.completedAt).toLocaleString()}</small>
      `;
      completedSection.appendChild(card);
    });
  }
  page.appendChild(completedSection);
}
function renderShop() {
  const pts = allData.points[currentUser] || 0;
  const page = document.getElementById('page-shop');
  page.innerHTML = `
    <div class="section" style="text-align: center;">
      <h2 style="font-size: 2rem; color: var(--text-dark);">Reward Store</h2>
      <p style="font-size: 1.1rem; color: #333; margin: 8px 0;">🐾 Balance: <strong id="points">${pts}</strong></p>
    </div>
  `;
  page.appendChild(renderRewardFilters());
  const section = document.createElement('div');
  section.className = 'section';
  let rewards = filterRewards();
  if (!rewards || rewards.length === 0) {
    section.innerHTML = '<p>No rewards yet.</p>';
  } else {
    rewards.forEach((r, i) => {
      section.innerHTML += `
        <div style="border: 2px solid #6fedd1; border-radius: 12px; padding: 12px; margin-bottom: 12px; display: flex; justify-content: space-between; align-items: center;">
          <div>
            <strong>${r.emoji ? r.emoji + ' ' : ''}${r.name}</strong>
            <div style="color: #666; font-size: 0.9rem;">${r.desc}</div>
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
            </div>
            ${
              r.done
              ? `<button class="paw-action-btn" style="background:#d0ffd0;color:#0b8f57;display:flex;align-items:center;gap:6px;" disabled>
                  <svg width="28" height="28" viewBox="0 0 24 24"><use href="#paw"/></svg> Received
                </button>`
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
  page.appendChild(section);
}
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
      <div style="margin-bottom:12px;display:flex;gap:30px;align-items:center;justify-content:center;">
        <label style="display:flex;align-items:center;gap:7px;">
          <input type="radio" name="role" value="user" ${role==='user'?'checked':''} onchange="switchRole('user')" />
          <span style="display:inline-block;width:12px;height:12px;border-radius:50%;background:#f6edd1;box-shadow:0 0 2px #aaa;margin-right:5px;"></span>
          Performer
        </label>
        <label style="display:flex;align-items:center;gap:7px;">
          <input type="radio" name="role" value="admin" ${role==='admin'?'checked':''} onchange="switchRole('admin')" />
          <span style="display:inline-block;width:12px;height:12px;border-radius:50%;background:#f9e28e;box-shadow:0 0 2px #aaa;margin-right:5px;"></span>
          Questmaster
        </label>
      </div>
      <div style="font-size:0.97em;color:#777;">Performer: mark quests as done, buy rewards<br>Questmaster: create/delete quests and rewards, change reward cost, mark received</div>
    </div>
    <div class="settings-section">
      <h3>About</h3>
      <div style="color:#065f54;">Talk to my paw — локальное приложение для квестов и наград 🐾</div>
    </div>
    <button class="logout-btn" onclick="signOut()">Sign out</button>
  `;
}
window.switchRole = function switchRole(role) {
  if (!currentUser) return;
  if (!allData.users[currentUser]) allData.users[currentUser] = { password: "", role: "user" };
  allData.users[currentUser].role = role;
  syncToFirebase();
  renderAll();
};
window.resetAllData = function resetAllData() {
  if (confirm('Are you sure you want to reset all data?')) {
    if (!currentUser) return;
    Object.keys(allData.points).forEach(u=>{if(u===currentUser)allData.points[u]=0;});
    allData.completed = allData.completed.filter(q=>q.username!==currentUser);
    allData.claimed = allData.claimed.filter(r=>r.username!==currentUser);
    syncToFirebase();
    renderAll();
  }
}

// === CRUD ===
window.addTask = function addTask() {
  if (userRole() !== 'admin') return;
  const type = document.getElementById('questType').value;
  const name = document.getElementById('taskName').value.trim();
  const emoji = document.getElementById('taskEmoji').value.trim() || '';
  const desc = document.getElementById('taskDesc').value.trim();
  const pts = parseInt(document.getElementById('taskPoints').value);
  if (!name || isNaN(pts)) return alert('Please enter valid quest data.');
  allData.quests.push({ type, name, emoji, desc, pts });
  syncToFirebase();
  renderAll();
};
window.addReward = function addReward() {
  if (userRole() !== 'admin') return;
  const name = document.getElementById('rewardName').value.trim();
  const emoji = document.getElementById('rewardEmoji').value.trim() || '';
  const desc = document.getElementById('rewardDesc').value.trim();
  const cost = parseInt(document.getElementById('rewardCost').value);
  if (!name || isNaN(cost)) return alert('Please enter valid reward data.');
  allData.rewards.push({ name, emoji, desc, cost });
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
window.changeRewardAmount = function changeRewardAmount(index) {
  if (userRole() !== 'admin') return;
  const val = prompt('Enter new cost (number of paw points):', allData.rewards[index].cost);
  if (val !== null && !isNaN(parseInt(val))) {
    allData.rewards[index].cost = parseInt(val);
    syncToFirebase();
    renderAll();
  }
};

// === Render All and Navigation ===
function renderAll() {
  updateUserUI();
  pages.forEach(p => p.classList.remove('active'));
  navLinks.forEach(l => l.classList.remove('active'));
  if (!currentUser) {
    showLogin();
    return;
  }
  renderMain();
  renderShop();
  renderQuests();
  renderClaimed();
  renderSettings();
  document.getElementById(`page-${currentPage}`).classList.add('active');
  navLinks.forEach(l => { if (l.getAttribute('data-page') === currentPage) l.classList.add('active'); });
  document.getElementById('paw-balance').style.display = (currentPage !== "settings" && (currentUser)) ? "flex" : "none";
  document.getElementById('paw-balance-val').textContent = (allData.points[currentUser] || 0);
}

window.addEventListener('DOMContentLoaded', () => {
  if (currentUser && !allData.users[currentUser]) {
    setUser(currentUser);
  } else {
    renderAll();
  }
  document.getElementById('loader').style.display = 'none';
});