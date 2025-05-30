import { initializeApp } from "https://www.gstatic.com/firebasejs/11.8.1/firebase-app.js";
import { getFirestore, doc, setDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/11.8.1/firebase-firestore.js";

// --- FIREBASE ---
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

// --- User/Demo Logic ---
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

// --- Navigation ---
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
  // Баланс во всех кроме настроек
  document.getElementById('paw-balance').style.display = (currentPage !== "settings" && (currentUser || isDemo())) ? "flex" : "none";
  document.getElementById('paw-balance-val').textContent = (allData.points[currentUser] || 0);
}

// --- Категории ---
function getQuestCats() {
  return ["Care", "Home", "Study", ...allData.customQuestCats.filter(c=>c)];
}
function getRewardCats() {
  return ["Food", "Fun", ...allData.customRewardCats.filter(c=>c)];
}
window.addQuestCat = function(cat) {
  if (!cat) return;
  if (!allData.customQuestCats.includes(cat)) allData.customQuestCats.push(cat);
  syncToFirebase();
  renderAll();
}
window.addRewardCat = function(cat) {
  if (!cat) return;
  if (!allData.customRewardCats.includes(cat)) allData.customRewardCats.push(cat);
  syncToFirebase();
  renderAll();
}

// --- Modal category select handlers ---
window.questCatSelectHandler = function(sel) {
  if (sel.value === "__custom__") {
    document.getElementById("taskCatCustom").style.display = "";
  } else {
    document.getElementById("taskCatCustom").style.display = "none";
  }
};
window.rewardCatSelectHandler = function(sel) {
  if (sel.value === "__custom__") {
    document.getElementById("rewardCatCustom").style.display = "";
  } else {
    document.getElementById("rewardCatCustom").style.display = "none";
  }
};

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
    { type: 'daily', name: 'Feed the cat', emoji: '🧑‍🍳', desc: 'Give breakfast to your cat', pts: 3, cat: 'Care' },
    { type: 'weekly', name: 'Clean up room', emoji: '🧹', desc: 'Tidy up your room on Saturday', pts: 5, cat: 'Home' }
  ] : allData.quests;
  page.innerHTML = `<div class="section" style="text-align: center;"><h2 style="font-size: 2rem; color: var(--text-dark);">Quests</h2></div>`;
  const section = document.createElement('div');
  section.className = 'section';
  if (!quests || quests.length === 0) section.innerHTML = '<p>No quests yet.</p>';
  else {
    quests.forEach((q, i) => {
      const showBtns = !isDemo() && userRole()==="user";
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
            ${showBtns ? `<button onclick="completeTask(${i})" title="Complete"><img src='image5' width='22' height='22' alt="complete"></button>` : ''}
            ${!isDemo() && userRole()==="admin" ? `<button onclick="deleteQuest(${i})" title="Delete"><img src='image4' width='22' height='22' alt="delete"></button>` : ''}
          </div>
        </div>
      `;
      section.appendChild(card);
    });
  }
  page.appendChild(section);
  if (!isDemo()) renderCompleted();
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
            ${!isDemo() && userRole()==="admin"?`
              <div style="margin-top:8px;">
                <button onclick="deleteReward(${i})" style="background:#ffb2b2;color:#a00;padding:3px 14px;border-radius:5px;margin-right:10px;">
                  <img src="image4" width="18" height="18" style="vertical-align:middle;" alt="delete"> Delete</button>
                <button onclick="changeRewardAmount(${i})" style="background:#ffe177;color:#65430a;padding:3px 14px;border-radius:5px;">
                  <img src="image6" width="18" height="18" style="vertical-align:middle;" alt="edit"> Change cost</button>
              </div>
            `:''}
          </div>
          ${!isDemo() && userRole()==="user"?`
            <button onclick="claimReward(${i})" style="background: #6fedd1; color: white; border: none; border-radius: 8px; padding: 6px 16px; font-weight: bold;" ${pts < r.cost ? 'disabled style="opacity:0.6;cursor:not-allowed"' : ''}>-${r.cost}</button>
          `:''}
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
    section.innerHTML = '<p>Демо: ваши полученные награды будут тут.</p>';
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
                <div style="color: #666; font-size: 0.9rem;">${r.desc}</div>
              </div>
              ${
                r.done
                ? `<button class="paw-btn done" disabled title="Received"><img src="image10" width="18" height="18" style="vertical-align:middle;" alt="done"> Received</button>`
                : userRole()==='user'
                  ? `<button class="paw-btn" disabled title="Only Questmaster can mark"><img src="image10" width="18" height="18" style="vertical-align:middle;" alt="done"> Mark as received</button>`
                  : `<button class="paw-btn" onclick="markRewardDone(${i})" title="Mark as received"><img src="image10" width="18" height="18" style="vertical-align:middle;" alt="done"> Mark as received</button>`
              }
            </div>
            <small>Claimed: ${new Date(r.claimedAt).toLocaleString()}</small>
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
          <button type="submit"><img src="image5" width="16" height="16" style="vertical-align:middle;"/> Add</button>
        </form>
      </div>
      <div>
        <b>Rewards:</b> ${getRewardCats().join(', ')}
        <form onsubmit="event.preventDefault();addRewardCat(this.cat.value);this.cat.value='';">
          <input name="cat" placeholder="Add reward category..." required style="margin:6px 0;"/>
          <button type="submit"><img src="image6" width="16" height="16" style="vertical-align:middle;"/> Add</button>
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

// --- CRUD ---
window.addTask = function addTask() {
  if (userRole() !== 'admin') return;
  const type = document.getElementById('questType').value;
  const name = document.getElementById('taskName').value.trim();
  let cat = document.getElementById('taskCat').value;
  if (cat === "__custom__") {
    cat = document.getElementById('taskCatCustom').value.trim();
    if (cat) window.addQuestCat(cat);
  }
  const desc = document.getElementById('taskDesc').value.trim();
  const pts = parseInt(document.getElementById('taskPoints').value);
  if (!name || isNaN(pts)) return alert('Please enter valid quest data.');
  allData.quests.push({ type, name, emoji: '', desc, pts, cat });
  syncToFirebase();
  renderAll();
};
window.addReward = function addReward() {
  if (userRole() !== 'admin') return;
  const name = document.getElementById('rewardName').value.trim();
  let cat = document.getElementById('rewardCat').value;
  if (cat === "__custom__") {
    cat = document.getElementById('rewardCatCustom').value.trim();
    if (cat) window.addRewardCat(cat);
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
  if ((allData.points[currentUser]||0) < r.cost
