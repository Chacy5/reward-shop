let points = parseInt(localStorage.getItem('pawPoints') || '0');
let quests = JSON.parse(localStorage.getItem('pawQuests') || '[]');
let completed = JSON.parse(localStorage.getItem('pawCompleted') || '[]');
let rewards = JSON.parse(localStorage.getItem('pawRewards') || '[]');
let claimed = JSON.parse(localStorage.getItem('pawClaimed') || '[]');
let user_role = localStorage.getItem('pawRole') || 'user'; // 'user' or 'admin'
let partnerRole = localStorage.getItem('pawPartnerRole') || 'admin'; // demo: for paired session
let user = null;
let googleAccessToken = null;

// ---- Utility ----
function saveAll() {
  localStorage.setItem('pawPoints', points);
  localStorage.setItem('pawQuests', JSON.stringify(quests));
  localStorage.setItem('pawCompleted', JSON.stringify(completed));
  localStorage.setItem('pawRewards', JSON.stringify(rewards));
  localStorage.setItem('pawClaimed', JSON.stringify(claimed));
  localStorage.setItem('pawRole', user_role);
  localStorage.setItem('pawPartnerRole', partnerRole);
}

// Google Auth (stub demo)
function updateUserUI() {
  const userProfile = document.getElementById('user-profile');
  const authBtn = document.getElementById('auth-btn');
  const signoutBtn = document.getElementById('signout-btn');
  if (user) {
    authBtn.style.display = 'none';
    userProfile.style.display = '';
    document.getElementById('user-avatar').src = user.picture;
    document.getElementById('user-name').textContent = user.name;
    signoutBtn.style.display = '';
  } else {
    authBtn.style.display = '';
    userProfile.style.display = 'none';
    signoutBtn.style.display = 'none';
  }
}
function startGoogleAuth() {
  google.accounts.id.initialize({
    client_id: 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com',
    callback: handleGoogleCredentialResponse
  });
  google.accounts.id.prompt();
}
function handleGoogleCredentialResponse(response) {
  const base64Url = response.credential.split('.')[1];
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  const payload = JSON.parse(decodeURIComponent(escape(window.atob(base64))));
  user = payload;
  googleAccessToken = response.credential;
  updateUserUI();
  syncFromGoogle();
}
function signOut() {
  user = null;
  googleAccessToken = null;
  updateUserUI();
}
function syncToGoogle() {
  // stub, implement your backend or Google Drive sync here
  if (!user || !googleAccessToken) return;
}
function syncFromGoogle() {
  // stub
}

// ---- Role Switch ----
function renderRolesBar() {
  const bar = document.getElementById('roles-bar');
  if (!bar) return;
  bar.innerHTML = `
    <span class="role-chip${user_role==='user' ? ' selected' : ''}" onclick="switchRole('user')" aria-selected="${user_role==='user'}">
      <svg class="role-icon"><use href="#role-user"/></svg>
      Performer
    </span>
    <span class="role-chip${user_role==='admin' ? ' selected' : ''}" onclick="switchRole('admin')" aria-selected="${user_role==='admin'}">
      <svg class="role-icon"><use href="#role-admin"/></svg>
      Questmaster
    </span>
  `;
}
function switchRole(role) {
  user_role = role;
  partnerRole = (role === 'admin' ? 'user' : 'admin');
  saveAll();
  renderAll();
}

// ---- Main Page ----
function renderMain() {
  document.getElementById('page-main').innerHTML = `
    <div class="section" style="text-align: center;">
      <h2 style="font-size: 2rem; color: var(--text-dark);">Welcome back!</h2>
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
      <button class="paw-action-btn" onclick="showQuestModal()">
        <svg class="paw-emoji" width="28" height="28"><use href="#nav-tasks"/></svg> New Quest
      </button>
      <button class="paw-action-btn" onclick="showRewardModal()">
        <svg class="paw-emoji" width="28" height="28"><use href="#nav-shop"/></svg> New Reward
      </button>
      `:`
      <button class="paw-action-btn" disabled title="Only Questmaster can add">
        <svg class="paw-emoji" width="28" height="28"><use href="#nav-tasks"/></svg> New Quest
      </button>
      <button class="paw-action-btn" disabled title="Only Questmaster can add">
        <svg class="paw-emoji" width="28" height="28"><use href="#nav-shop"/></svg> New Reward
      </button>
      `}
    </div>
    <div class="roles-bar" id="roles-bar"></div>
  `;
  renderRolesBar();
  renderStats();
}

// ---- Quests Page ----
let questFilter = { type: 'all', emoji: '', search: '' };
function renderQuestFilters(container) {
  container.innerHTML = `
    <div class="filter-bar">
      <label>
        Type
        <select id="questFilterType">
          <option value="all">All</option>
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
          <option value="event">Event</option>
        </select>
      </label>
      <label>
        Category
        <select id="questFilterEmoji">
          <option value="">Any category</option>
          <option value="🎯">🎯 Goal</option>
          <option value="📚">📚 Study</option>
          <option value="🧹">🧹 Cleaning</option>
          <option value="💪">💪 Sport</option>
          <option value="🌿">🌿 Nature</option>
          <option value="📝">📝 Note</option>
          <option value="🧠">🧠 Growth</option>
        </select>
      </label>
      <label>
        Search
        <input type="text" id="questFilterSearch" placeholder="Search..." />
      </label>
    </div>
  `;
  document.getElementById('questFilterType').value = questFilter.type;
  document.getElementById('questFilterEmoji').value = questFilter.emoji;
  document.getElementById('questFilterSearch').value = questFilter.search;
  document.getElementById('questFilterType').onchange = e => { questFilter.type = e.target.value; renderQuests(); };
  document.getElementById('questFilterEmoji').onchange = e => { questFilter.emoji = e.target.value; renderQuests(); };
  document.getElementById('questFilterSearch').oninput = e => { questFilter.search = e.target.value.toLowerCase(); renderQuests(); };
}
function filterQuests(q) {
  if (questFilter.type !== 'all' && q.type !== questFilter.type) return false;
  if (questFilter.emoji && q.emoji !== questFilter.emoji) return false;
  if (questFilter.search && !(q.name.toLowerCase().includes(questFilter.search) || q.desc.toLowerCase().includes(questFilter.search))) return false;
  return true;
}
function renderQuests() {
  const page = document.getElementById('page-tasks');
  page.innerHTML = `
    <div class="section" style="text-align: center;">
      <h2 style="font-size: 2rem; color: var(--text-dark);">Quests</h2>
      <p style="color: #666; margin: 10px 0;">Complete quests to earn paw points!</p>
      <div id="questFilters"></div>
    </div>
  `;
  renderQuestFilters(document.getElementById('questFilters'));
  const section = document.createElement('div');
  section.className = 'section';
  let hasAny = false;
  ['daily', 'weekly', 'event'].forEach(type => {
    const filtered = quests.filter(q => q.type === type && filterQuests(q));
    if (filtered.length === 0) return;
    hasAny = true;
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
  if (!hasAny) section.innerHTML = '<p>No quests matching filter.</p>';
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

// ---- Rewards Shop ----
let rewardFilter = { emoji: '', search: '' };
function renderRewardFilters(container) {
  container.innerHTML = `
    <div class="filter-bar">
      <label>
        Category
        <select id="rewardFilterEmoji">
          <option value="">Any category</option>
          <option value="🎁">🎁 Gift</option>
          <option value="🍫">🍫 Sweets</option>
          <option value="☕">☕ Coffee</option>
          <option value="🛋️">🛋️ Rest</option>
          <option value="🎮">🎮 Games</option>
          <option value="🧸">🧸 Cute</option>
        </select>
      </label>
      <label>
        Search
        <input type="text" id="rewardFilterSearch" placeholder="Search..." />
      </label>
    </div>
  `;
  document.getElementById('rewardFilterEmoji').value = rewardFilter.emoji;
  document.getElementById('rewardFilterSearch').value = rewardFilter.search;
  document.getElementById('rewardFilterEmoji').onchange = e => { rewardFilter.emoji = e.target.value; renderShop(); };
  document.getElementById('rewardFilterSearch').oninput = e => { rewardFilter.search = e.target.value.toLowerCase(); renderShop(); };
}
function filterRewards(r) {
  if (rewardFilter.emoji && r.emoji !== rewardFilter.emoji) return false;
  if (rewardFilter.search && !(r.name.toLowerCase().includes(rewardFilter.search) || r.desc.toLowerCase().includes(rewardFilter.search))) return false;
  return true;
}
function renderShop() {
  const page = document.getElementById('page-shop');
  page.innerHTML = `
    <div class="section" style="text-align: center;">
      <h2 style="font-size: 2rem; color: var(--text-dark);">Reward Store</h2>
      <p style="font-size: 1.1rem; color: #333; margin: 8px 0;">🐾 Balance: <strong id="points">${points}</strong></p>
      <div id="rewardFilters"></div>
    </div>
  `;
  renderRewardFilters(document.getElementById('rewardFilters'));
  const section = document.createElement('div');
  section.className = 'section';
  const filtered = rewards.filter(filterRewards);
  if (filtered.length === 0) {
    section.innerHTML = '<p>No rewards matching filter.</p>';
  } else {
    filtered.forEach((r, i) => {
      const realIndex = rewards.indexOf(r);
      const border = '#6fedd1';
      section.innerHTML += `
        <div style="border: 2px solid ${border}; border-radius: 12px; padding: 12px; margin-bottom: 12px; display: flex; justify-content: space-between; align-items: center;">
          <div>
            <strong>${r.emoji ? r.emoji + ' ' : ''}${r.name}</strong>
            <div style="color: #666; font-size: 0.9rem;">${r.desc}</div>
            ${user_role==='admin'?`
              <div style="margin-top:8px;">
                <button onclick="deleteReward(${realIndex})" style="background:#ffb2b2;color:#a00;padding:3px 14px;border-radius:5px;margin-right:10px;">Delete</button>
                <button onclick="changeRewardAmount(${realIndex})" style="background:#ffe177;color:#65430a;padding:3px 14px;border-radius:5px;">Change cost</button>
              </div>
            `:''}
          </div>
          ${user_role==='user'?`
            <button onclick="claimReward(${realIndex})" style="background: ${border}; color: white; border: none; border-radius: 8px; padding: 6px 16px; font-weight: bold;" ${points < r.cost ? 'disabled style="opacity:0.6;cursor:not-allowed"' : ''}>-${r.cost}</button>
          `:''}
        </div>
      `;
    });
  }
  page.appendChild(section);
}

// ---- Claimed Rewards ----
let claimedFilter = { emoji: '', status: 'all', search: '' };
function renderClaimedFilters(container) {
  container.innerHTML = `
    <div class="filter-bar">
      <label>
        Status
        <select id="claimedFilterStatus">
          <option value="all">All</option>
          <option value="pending">Pending</option>
          <option value="received">Received</option>
        </select>
      </label>
      <label>
        Category
        <select id="claimedFilterEmoji">
          <option value="">Any category</option>
          <option value="🎁">🎁 Gift</option>
          <option value="🍫">🍫 Sweets</option>
          <option value="☕">☕ Coffee</option>
          <option value="🛋️">🛋️ Rest</option>
          <option value="🎮">🎮 Games</option>
          <option value="🧸">🧸 Cute</option>
        </select>
      </label>
      <label>
        Search
        <input type="text" id="claimedFilterSearch" placeholder="Search..." />
      </label>
    </div>
  `;
  document.getElementById('claimedFilterStatus').value = claimedFilter.status;
  document.getElementById('claimedFilterEmoji').value = claimedFilter.emoji;
  document.getElementById('claimedFilterSearch').value = claimedFilter.search;
  document.getElementById('claimedFilterStatus').onchange = e => { claimedFilter.status = e.target.value; renderClaimed(); };
  document.getElementById('claimedFilterEmoji').onchange = e => { claimedFilter.emoji = e.target.value; renderClaimed(); };
  document.getElementById('claimedFilterSearch').oninput = e => { claimedFilter.search = e.target.value.toLowerCase(); renderClaimed(); };
}
function filterClaimed(r) {
  if (claimedFilter.emoji && r.emoji !== claimedFilter.emoji) return false;
  if (claimedFilter.status === 'pending' && r.done) return false;
  if (claimedFilter.status === 'received' && !r.done) return false;
  if (claimedFilter.search && !(r.name.toLowerCase().includes(claimedFilter.search) || r.desc.toLowerCase().includes(claimedFilter.search))) return false;
  return true;
}
function renderClaimed() {
  const page = document.getElementById('page-claimed');
  page.innerHTML = `
    <div class="section" style="text-align: center;">
      <h2 style="font-size: 2rem; color: var(--text-dark);">Claimed Rewards</h2>
      <p style="color: #666; margin: 10px 0;">Your purchased rewards:</p>
      <div id="claimedFilters"></div>
    </div>
  `;
  renderClaimedFilters(document.getElementById('claimedFilters'));
  const section = document.createElement('div');
  section.className = 'section';
  const filtered = claimed.filter(filterClaimed);
  if (filtered.length === 0) {
    section.innerHTML = '<p>No claimed rewards matching filter.</p>';
  } else {
    filtered.forEach((r, i) => {
      const realIndex = claimed.indexOf(r);
      const border = '#fdd36a';
      section.innerHTML += `
        <div style="border: 2px solid ${border}; border-radius: 12px; padding: 12px; margin-bottom: 12px;">
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
                : `<button class="paw-btn" onclick="markRewardDone(${realIndex})" title="Mark as received">🐾 Mark as received</button>`
            }
          </div>
          <small>Claimed: ${new Date(r.claimedAt).toLocaleString()}</small>
        </div>
      `;
    });
  }
  page.appendChild(section);
}

// ---- Settings Page ----
function renderSettings() {
  document.getElementById('page-settings').innerHTML = `
    <div class="settings-section">
      <h3>General</h3>
      <button onclick="resetAllData()">Reset all data</button>
      <div style="font-size:0.98em; color:#a4067b; margin-top:7px;">Warning: this clears all quests, rewards and history for BOTH roles</div>
    </div>
    <div class="settings-section">
      <h3>About</h3>
      <div style="color:#065f54;">Cute quest/reward shop for two roles.<br>
      Performer: mark quests as done, buy rewards.<br>
      Questmaster: create/delete quests and rewards, change reward cost, mark received.<br>
      </div>
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

// ---- Quest/Reward CRUD ----
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

// ---- Modal Show/Hide ----
function showQuestModal() {
  if (user_role !== 'admin') return;
  document.getElementById('quest-modal-bg').style.display = 'flex';
  setTimeout(() => {
    document.getElementById('taskName').focus();
  }, 90);
}
function closeQuestModal() { document.getElementById('quest-modal-bg').style.display = 'none'; }
function showRewardModal() {
  if (user_role !== 'admin') return;
  document.getElementById('reward-modal-bg').style.display = 'flex';
  setTimeout(() => {
    document.getElementById('rewardName').focus();
  }, 90);
}
function closeRewardModal() { document.getElementById('reward-modal-bg').style.display = 'none'; }
window.onclick = function(event) {
  if (event.target === document.getElementById('quest-modal-bg')) closeQuestModal();
  if (event.target === document.getElementById('reward-modal-bg')) closeRewardModal();
};
window.addEventListener('keydown', function(e) {
  if (e.key === "Escape") {
    closeQuestModal();
    closeRewardModal();
  }
});

// ---- Stats ----
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
  saveAll();
}

// ---- Navigation ----
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

// ---- Render All Pages ----
function renderAll(page) {
  updateUserUI();
  renderMain();
  renderShop();
  renderQuests();
  renderClaimed();
  renderSettings();
  // Show only the active page
  pages.forEach(p => p.classList.remove('active'));
  const activePage = page ? `page-${page}` : 'page-main';
  document.getElementById(activePage).classList.add('active');
  navLinks.forEach(l => l.classList.remove('active'));
  navLinks.forEach(l => { if (l.getAttribute('data-page') === (page||'main')) l.classList.add('active'); });
}

// ---- Initial ----
window.addEventListener('DOMContentLoaded', () => {
  renderAll();
  document.getElementById('loader').style.display = 'none';
});