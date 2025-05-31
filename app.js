import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, updateDoc } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";

// --- Firebase config ---
const firebaseConfig = {
  apiKey: "AIzaSyBDHjCE7CYC_jxL7EPjUApVvrd8avHmcNA",
  authDomain: "talk-to-my-paw.firebaseapp.com",
  databaseURL: "https://talk-to-my-paw-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "talk-to-my-paw",
  storageBucket: "talk-to-my-paw.appspot.com",
  messagingSenderId: "1023228484299",
  appId: "1:1023228484299:web:df2f42b4bebff7c82b194e"
};
// --- Init Firebase ---
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

let user = null;
let groupId = null;
let quests = [];
let rewards = [];
let pawBalance = 0;

// --- Навигация между разделами ---
window.showTab = function(tab) {
  document.querySelectorAll('.page').forEach(x => x.classList.remove('active'));
  document.getElementById('page-' + tab).classList.add('active');
  document.querySelectorAll('nav.bottom a').forEach(x => x.classList.remove('active'));
  document.querySelector('nav.bottom a[data-page="'+tab+'"]').classList.add('active');
}

// --- Боттом-меню ---
document.querySelectorAll('nav.bottom a').forEach(a => {
  a.onclick = function() {
    showTab(this.getAttribute('data-page'));
  };
});

// --- Баланс ---
function updateBalance() {
  document.getElementById('paw-balance-val').textContent = pawBalance;
}

// --- User menu ---
document.getElementById('show-user-menu').onclick = function() {
  const menu = document.getElementById('user-menu');
  menu.style.display = (menu.style.display === "block") ? "none" : "block";
  if (user) {
    menu.innerHTML = `<p>${user.email}</p><button class="fancy-btn" id="signout-btn">Выйти</button>`;
    document.getElementById('signout-btn').onclick = signOutUser;
  } else {
    menu.innerHTML = `<button class="fancy-btn" id="show-auth-modal">Войти/Регистрация</button>`;
    document.getElementById('show-auth-modal').onclick = showAuthModal;
  }
};

// --- Авторизация ---
function showAuthModal() {
  showModal(`
    <h3>Вход или регистрация</h3>
    <input id="email" type="email" placeholder="Email" />
    <input id="password" type="password" placeholder="Пароль" />
    <input id="group" placeholder="Название группы (семьи)" />
    <button class="fancy-btn" id="signup-btn">Зарегистрироваться</button>
    <button class="fancy-btn" id="signin-btn">Войти</button>
  `);
  document.getElementById('signup-btn').onclick = signUp;
  document.getElementById('signin-btn').onclick = signIn;
}
async function signUp() {
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value.trim();
  const group = document.getElementById('group').value.trim();
  if (!email || !password || !group) return alert('Заполните все поля!');
  try {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    user = cred.user;
    groupId = group.replace(/[^\w-]/g,'').toLowerCase();
    await saveUserGroup(email, groupId);
    closeModal();
  } catch(e) { alert(e.message); }
}
async function signIn() {
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value.trim();
  const group = document.getElementById('group').value.trim();
  if (!email || !password || !group) return alert('Заполните все поля!');
  try {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    user = cred.user;
    groupId = group.replace(/[^\w-]/g,'').toLowerCase();
    await saveUserGroup(email, groupId, false);
    closeModal();
  } catch(e) { alert(e.message); }
}
function signOutUser() {
  signOut(auth);
  user = null; groupId = null; quests = []; rewards = [];
  pawBalance = 0;
  renderAll();
  document.getElementById('user-menu').style.display = "none";
}
onAuthStateChanged(auth, u => {
  user = u;
  renderAll();
  if (user && groupId) loadData();
});

// --- Создать группу и загрузить данные ---
async function saveUserGroup(email, group, create=true) {
  groupId = group;
  const groupRef = doc(db, "groups", groupId);
  const docSnap = await getDoc(groupRef);
  if (!docSnap.exists() && create) {
    await setDoc(groupRef, {
      users: { [user.uid]: email },
      quests: [],
      rewards: [],
      pawBalance: 0
    });
    await loadData();
  } else {
    await loadData();
  }
}
async function loadData() {
  if (!user || !groupId) return;
  const ref = doc(db, "groups", groupId);
  const docSnap = await getDoc(ref);
  const data = docSnap.data();
  quests = data.quests || [];
  rewards = data.rewards || [];
  pawBalance = data.pawBalance || 0;
  renderAll();
}
async function saveAll() {
  if (!user || !groupId) return;
  const ref = doc(db, "groups", groupId);
  await updateDoc(ref, { quests, rewards, pawBalance });
}

// --- Модальное окно ---
window.showModal = function(html) {
  document.getElementById('modal-content').innerHTML = html;
  document.getElementById('modal-bg').style.display = "flex";
};
window.closeModal = function() {
  document.getElementById('modal-bg').style.display = "none";
};

document.getElementById('modal-bg').onclick = function(e) {
  if (e.target === this) closeModal();
};

// --- Emoji picker modal (заглушка) ---
window.showEmojiPicker = function(onPick) {
  document.getElementById('emoji-picker-modal').style.display = "flex";
  document.getElementById('emoji-picker-confirm').onclick = () => {
    const emoji = document.getElementById('emoji-input').value.trim();
    document.getElementById('emoji-picker-modal').style.display = "none";
    if (emoji && onPick) onPick(emoji);
  };
};
document.getElementById('emoji-picker-modal').onclick = function(e) {
  if (e.target === this) this.style.display = "none";
};

// --- Рендер всех секций ---
function renderAll() {
  updateBalance();
  // page-home: welcome, инструкции, и быстрые кнопки
  document.getElementById('page-home').innerHTML = `<h2>Welcome!</h2><p>Выберите раздел снизу.</p>`;
  // page-shop: магазин (можно расширить)
  document.getElementById('page-shop').innerHTML = `<h2>Shop</h2><p>Скоро...</p>`;
  // page-quests: список квестов
  document.getElementById('page-quests').innerHTML = `
    <h2>Quests</h2>
    <ul>${quests.map(q => `<li>${q.name} <button onclick="deleteQuest(${q.id})">Удалить</button></li>`).join("")}</ul>
    <button class="fancy-btn" onclick="showAddQuest()">+ Добавить квест</button>`;
  // page-rewards: список наград
  document.getElementById('page-rewards').innerHTML = `
    <h2>Rewards</h2>
    <ul>${rewards.map(r => `<li>${r.emoji||"🎁"} ${r.name} <button onclick="deleteReward(${r.id})">Удалить</button></li>`).join("")}</ul>
    <button class="fancy-btn" onclick="showAddReward()">+ Добавить награду</button>`;
  // page-settings: настройки
  document.getElementById('page-settings').innerHTML = `<h2>Settings</h2><p>Скоро...</p>`;
  // archive/statistics - заглушки
}

// --- Добавление/удаление квеста ---
window.showAddQuest = function() {
  showModal(`
    <h3>Добавить квест</h3>
    <input id="quest-name" placeholder="Название" />
    <button class="fancy-btn" id="add-quest-confirm">OK</button>
  `);
  document.getElementById('add-quest-confirm').onclick = async function() {
    const name = document.getElementById('quest-name').value.trim();
    if (!name) return;
    quests.push({id: Date.now(), name});
    await saveAll();
    closeModal();
    renderAll();
  };
};
window.deleteQuest = async function(id) {
  quests = quests.filter(q => q.id !== id);
  await saveAll();
  renderAll();
};

// --- Добавление/удаление награды ---
window.showAddReward = function() {
  showModal(`
    <h3>Добавить награду</h3>
    <input id="reward-name" placeholder="Название" />
    <button class="fancy-btn" onclick="window.pickEmojiReward()">Выбрать эмодзи</button>
    <span id="picked-emoji"></span>
    <button class="fancy-btn" id="add-reward-confirm">OK</button>
  `);
  let rewardEmoji = "";
  window.pickEmojiReward = function() {
    showEmojiPicker(function(emoji) {
      rewardEmoji = emoji;
      document.getElementById('picked-emoji').textContent = emoji;
    });
  };
  document.getElementById('add-reward-confirm').onclick = async function() {
    const name = document.getElementById('reward-name').value.trim();
    if (!name) return;
    rewards.push({id: Date.now(), name, emoji: rewardEmoji});
    await saveAll();
    closeModal();
    renderAll();
  };
};
window.deleteReward = async function(id) {
  rewards = rewards.filter(r => r.id !== id);
  await saveAll();
  renderAll();
};

// --- Инициализация ---
window.addEventListener('DOMContentLoaded', () => {
  renderAll();
  showTab('home');
});