// ========== LOCAL STORAGE STRUCTURES ==========
let users = JSON.parse(localStorage.getItem('pawUsers') || '{}');
let currentUser = localStorage.getItem('pawCurrentUser') || '';
let points = parseInt(localStorage.getItem('pawPoints_' + currentUser) || '0');
let quests = JSON.parse(localStorage.getItem('pawQuests_' + currentUser) || '[]');
let completed = JSON.parse(localStorage.getItem('pawCompleted_' + currentUser) || '[]');
let rewards = JSON.parse(localStorage.getItem('pawRewards_' + currentUser) || '[]');
let claimed = JSON.parse(localStorage.getItem('pawClaimed_' + currentUser) || '[]');
let user_role = localStorage.getItem('pawRole_' + currentUser) || 'user';

// ========== SAVE/LOAD HELPERS ==========
function saveAll() {
  localStorage.setItem('pawPoints_' + currentUser, points);
  localStorage.setItem('pawQuests_' + currentUser, JSON.stringify(quests));
  localStorage.setItem('pawCompleted_' + currentUser, JSON.stringify(completed));
  localStorage.setItem('pawRewards_' + currentUser, JSON.stringify(rewards));
  localStorage.setItem('pawClaimed_' + currentUser, JSON.stringify(claimed));
  localStorage.setItem('pawRole_' + currentUser, user_role);
}

function setUser(login) {
  currentUser = login;
  localStorage.setItem('pawCurrentUser', login);
  points = parseInt(localStorage.getItem('pawPoints_' + login) || '0');
  quests = JSON.parse(localStorage.getItem('pawQuests_' + login) || '[]');
  completed = JSON.parse(localStorage.getItem('pawCompleted_' + login) || '[]');
  rewards = JSON.parse(localStorage.getItem('pawRewards_' + login) || '[]');
  claimed = JSON.parse(localStorage.getItem('pawClaimed_' + login) || '[]');
  user_role = localStorage.getItem('pawRole_' + login) || 'user';
  saveAll();
}

// ========== UI AUTH ==========
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

// ========== MODALS ==========
function showLogin() {
  closeAllModals();
  document.getElementById('login-modal-bg').style.display = 'flex';
  document.getElementById('login-username').focus();
  document.getElementById('login-err').textContent = '';
}
function closeLoginModal() { document.getElementById('login-modal-bg').style.display = 'none'; }
function showRegister() {
  closeAllModals();
  document.getElementById('register-modal-bg').style.display = 'flex';
  document.getElementById('register-username').focus();
  document.getElementById('register-err').textContent = '';
}
function closeRegisterModal() { document.getElementById('register-modal-bg').style.display = 'none'; }
function showQuestModal() {
  if (user_role !== 'admin') return;
  closeAllModals();
  document.getElementById('quest-modal-bg').style.display = 'flex';
  setTimeout(() => { document.getElementById('taskName').focus(); }, 90);
}
function closeQuestModal() { document.getElementById('quest-modal-bg').style.display = 'none'; }
function showRewardModal() {
  if (user_role !== 'admin') return;
  closeAllModals();
  document.getElementById('reward-modal-bg').style.display = 'flex';
  setTimeout(() => { document.getElementById('rewardName').focus(); }, 90);
}
function closeRewardModal() { document.getElementById('reward-modal-bg').style.display = 'none'; }
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

// ========== AUTH LOGIC ==========
function doLogin() {
  let login = document.getElementById('login-username').value.trim();
  let pass = document.getElementById('login-password').value.trim();
  if (!login || !pass) { document.getElementById('login-err').textContent = "Fill both fields"; return; }
  if (!users[login] || users[login].password !== pass) { document.getElementById('login-err').textContent = "Wrong login or password"; return; }
  setUser(login);
  closeAllModals();
  renderAll();
}
function doRegister() {
  let login = document.getElementById('register-username').value.trim();
  let pass = document.getElementById('register-password').value.trim();
  if (!login || !pass) { document.getElementById('register-err').textContent = "Fill both fields"; return; }
  if (users[login]) { document.getElementById('register-err').textContent = "User exists"; return; }
  users[login] = { password: pass, role: 'user' };
  localStorage.setItem('pawUsers', JSON.stringify(users));
  setUser(login);
  closeAllModals();
  renderAll();
}
function signOut() {
  setUser('');
  updateUserUI();
  renderAll();
}

// ========== MAIN PAGE ==========
function renderMain() {
  document.getElementById('page-main').innerHTML = `
    <div class="section" style="text-align: center;">
      <h2 style="font-size: 2rem; color: var(--text-dark);">Welcome${currentUser ? ', ' + currentUser : ''}!</h2>
      <p style="font-size: 1.2rem; margin-top: 10px;">You have</p>
      <div style="font-size: 3rem; color: var(--main-color); margin: 10px 0;">
        🐾 <strong id="points">${points}</strong>
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
    <div class="section" style="text-align: center;display:flex;flex-wrap:wrap;justify-content:center;gap:16px;">
      ${user_role==='admin'?`
      <button class="paw-action-btn" type="button" onclick="showQuestModal()">
        <svg class="paw-emoji icon-svg" width="28" height="28" viewBox="0 0 24 24"><use href="#solar-list-check"/></svg> New Quest
      </button>
      <button class="paw-action-btn" type="button" onclick="showRewardModal()">
        <svg class="paw-emoji icon-svg" width="28" height="28" viewBox="0 0 24 24"><use href="#solar-gift"/></svg> New Reward
      </button>
      `:`
      <button class="paw-action-btn" type="button" disabled title="Only Questmaster can add">
        <svg class="paw-emoji icon-svg" width="28" height="28" viewBox="0 0 24 24"><use href="#solar-list-check"/></svg> New Quest
      </button>
      <button class="paw-action-btn" type="button" disabled title="Only Questmaster can add">
        <svg class="paw-emoji icon-svg" width="28" height="28" viewBox="0 0 24 24"><use href="#solar-gift"/></svg> New Reward
      </button>
      `}
    </div>
  `;
  renderStats();
}

// ========== QUESTS ==========
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
  if (quests.length === 0) section.innerHTML = '<p>No quests yet.</p>';
  else {
    ['daily', 'weekly', 'event'].forEach(type => {
      const filtered = quests.filter(q => q.type === type);
      if (filtered.length === 0) return;
      const h = document.createElement('h3');
      h.textContent = type === 'daily' ? 'Daily' : type === 'weekly' ? 'Weekly' : 'Events';
      section.appendChild(h);
      filtered.forEach((q, i) => {
        const globalIndex = quests.indexOf(q);
        const card = document.createElement('div');
        card.className = 'card ' + type;
        card.innerHTML = `
          <div class="flex">
            <div>
              <b>${q.emoji ? q.emoji + ' ' : ''}${q.name}</b> <span>(${q.pts} points)</span>
              <p class="desc">${q.desc || ''}</p>
            </div>
            <div>
              ${user_role==='user'?`
                <button onclick="completeTask(${globalIndex})" title="Complete">✔️</button>
              `:''}
              ${user_role==='admin'?`
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
  if (completed.length === 0) {
    completedSection.innerHTML += '<p>No completed quests yet.</p>';
  } else {
    completed.forEach(q => {
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

// ========== REWARDS ==========
function renderShop() {
  const page = document.getElementById('page-shop');
  page.innerHTML = `
    <div class="section" style="text-align: center;">
      <h2 style="font-size: 2rem; color: var(--text-dark);">Reward Store</h2>
      <p style="font-size: 1.1rem; color: #333; margin: 8px 0;">🐾 Balance: <strong id="points">${points}</strong></p>
    </div>
  `;
  const section = document.createElement('div');
  section.className = 'section';
  if (rewards.length === 0) {
    section.innerHTML = '<p>No rewards yet.</p>';
  } else {
    rewards.forEach((r, i) => {
      section.innerHTML += `
        <div style="border: 2px solid #6fedd1; border-radius: 12px; padding: 12px; margin-bottom: 12px; display: flex; justify-content: space-between; align-items: center;">
          <div>
            <strong>${r.emoji ? r.emoji + ' ' : ''}${r.name}</strong>
            <div style="color: #666; font-size: 0.9rem;">${r.desc}</div>
            ${user_role==='admin'?`
              <div style="margin-top:8px;">
                <button onclick="deleteReward(${i})" style="background:#ffb2b2;color:#a00;padding:3px 14px;border-radius:5px;margin-right:10px;">Delete</button>
                <button onclick="changeRewardAmount(${i})" style="background:#ffe177;color:#65430a;padding:3px 14px;border-radius:5px;">Change cost</button>
              </div>
            `:''}
          </div>
          ${user_role==='user'?`
            <button onclick="claimReward(${i})" style="background: #6fedd1; color: white; border: none; border-radius: 8px; padding: 6px 16px; font-weight: bold;" ${points < r.cost ? 'disabled style="opacity:0.6;cursor:not-allowed"' : ''}>-${r.cost}</button>
          `:''}
        </div>
      `;
    });
  }
  page.appendChild(section);
}

// ========== CLAIMED ==========
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
              ? `<button class="paw-btn done" disabled title="Received">🐾 Received</button>`
              : user_role==='user'
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

// ========== SETTINGS ==========
function renderSettings() {
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
          <input type="radio" name="role" value="user" ${user_role==='user'?'checked':''} onchange="switchRole('user')" />
          Performer
        </label>
        <label style="margin-left:24px;">
          <input type="radio" name="role" value="admin" ${user_role==='admin'?'checked':''} onchange="switchRole('admin')" />
          Questmaster
        </label>
      </div>
      <div style="font-size:0.97em;color:#777;">Performer: mark quests as done, buy rewards<br>Questmaster: create/delete quests and rewards, change reward cost, mark received</div>
    </div>
    <div class="settings-section">
      <h3>About</h3>
      <div style="color:#065f54;">Talk to my paw — локальное приложение для квестов и наград 🐾</div>
    </div>
  `;
}
function resetAllData() {
  if (confirm('Are you sure you want to reset all data?')) {
    points = 0; quests = []; completed = []; rewards = []; claimed = [];
    saveAll();
    renderAll();
  }
}

// ========== CRUD ==========
function addTask() {
  if (user_role !== 'admin') return;
  const type = document.getElementById('questType').value;
  const name = document.getElementById('taskName').value.trim();
  const emoji = document.getElementById('taskEmoji').value.trim() || '';
  const desc = document.getElementById('taskDesc').value.trim();
  const pts = parseInt(document.getElementById('taskPoints').value);
  if (!name || isNaN(pts)) return alert('Please enter valid quest data.');
  const createdAt = new Date().toISOString();
  quests.push({ type, name, emoji, desc, pts, createdAt });
  saveAll(); renderQuests(); renderStats();
}
function addReward() {
  if (user_role !== 'admin') return;
  const name = document.getElementById('rewardName').value.trim();
  const emoji = document.getElementById('rewardEmoji').value.trim() || '';
  const desc = document.getElementById('rewardDesc').value.trim();
  const cost = parseInt(document.getElementById('rewardCost').value);
  if (!name || isNaN(cost)) return alert('Please enter valid reward data.');
  rewards.push({ name, emoji, desc, cost });
  saveAll(); renderShop();
}
function completeTask(index) {
  if (user_role !== 'user') return;
  const q = quests[index];
  points += q.pts;
  completed.push({ ...q, completedAt: new Date().toISOString() });
  quests.splice(index, 1);
  saveAll();
  renderQuests(); renderStats();
}
function deleteQuest(index) {
  if (user_role !== 'admin') return;
  if (confirm('Delete this quest?')) {
    quests.splice(index, 1);
    saveAll(); renderQuests();
  }
}
function claimReward(index) {
  if (user_role !== 'user') return;
  const r = rewards[index];
  if (points < r.cost) return alert('Not enough paw points.');
  points -= r.cost;
  claimed.push({ ...r, claimedAt: new Date().toISOString(), done: false });
  saveAll();
  renderClaimed(); renderShop(); renderStats();
}
function markRewardDone(index) {
  if (user_role !== 'admin') return;
  if (!claimed[index].done) {
    claimed[index].done = true;
    saveAll(); renderClaimed();
  }
}
function deleteReward(index) {
  if (user_role !== 'admin') return;
  if (confirm('Delete this reward?')) {
    rewards.splice(index, 1);
    saveAll(); renderShop();
  }
}
function changeRewardAmount(index) {
  if (user_role !== 'admin') return;
  const val = prompt('Enter new cost (number of paw points):', rewards[index].cost);
  if (val !== null && !isNaN(parseInt(val))) {
    rewards[index].cost = parseInt(val);
    saveAll(); renderShop();
  }
}

// ========== STATS ==========
function renderStats() {
  const today = new Date().toDateString();
  const week = new Date();
  week.setDate(week.getDate() - 7);
  const countToday = completed.filter(q => new Date(q.completedAt).toDateString() === today).length;
  const countWeek = completed.filter(q => new Date(q.completedAt) > week).length;
  const countAll = completed.length;
  document.querySelectorAll('#count-today').forEach(el => el.innerText = countToday);
  document.querySelectorAll('#count-week').forEach(el => el.innerText = countWeek);
  document.querySelectorAll('#count-all').forEach(el => el.innerText = countAll);
  document.querySelectorAll('#points').forEach(el => el.innerText = points);
}

// ========== NAVIGATION ==========
const pages = document.querySelectorAll('.page');
const navLinks = document.querySelectorAll('nav.bottom a');
navLinks.forEach(link => {
  link.addEventListener('click', () => {
    const target = link.getAttribute('data-page');
    pages.forEach(p => p.classList.remove('active'));
    document.getElementById(`page-${target}`).classList.add('active');
    navLinks.forEach(l => l.classList.remove('active'));
    link.classList.add('active');
    renderAll(target);
  });
});

// ========== RENDER ALL ==========
function renderAll(page) {
  updateUserUI();
  if (!currentUser) {
    showLogin();
    pages.forEach(p => p.classList.remove('active'));
    return;
  }
  renderMain();
  renderShop();
  renderQuests();
  renderClaimed();
  renderSettings();
  pages.forEach(p => p.classList.remove('active'));
  const activePage = page ? `page-${page}` : 'page-main';
  document.getElementById(activePage).classList.add('active');
  navLinks.forEach(l => l.classList.remove('active'));
  navLinks.forEach(l => { if (l.getAttribute('data-page') === (page||'main')) l.classList.add('active'); });
  renderStats();
}

// ========== ON LOAD ==========
window.addEventListener('DOMContentLoaded', () => {
  renderAll();
  document.getElementById('loader').style.display = 'none';
});