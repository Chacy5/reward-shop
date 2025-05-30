import { initializeApp } from "https://www.gstatic.com/firebasejs/11.8.1/firebase-app.js";
import { getFirestore, doc, setDoc, onSnapshot, getDoc } from "https://www.gstatic.com/firebasejs/11.8.1/firebase-firestore.js";

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
let unsubscribe = null;
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

// === Firebase UserDoc Management ===
function groupDocId() {
  // Один пользователь = одна база
  if (!currentUser) return "demo-family";
  return currentUser;
}

function syncToFirebase() {
  setDoc(doc(db, "groups", groupDocId()), allData);
}
function listenFromFirebase() {
  if (unsubscribe) unsubscribe();
  unsubscribe = onSnapshot(doc(db, "groups", groupDocId()), (docSnap) => {
    if (docSnap.exists()) {
      Object.assign(allData, docSnap.data());
      isInitialSync = false;
      renderAll();
    }
  });
}
function stopListenFromFirebase() {
  if (unsubscribe) unsubscribe();
  unsubscribe = null;
}

// === DEMO DATA ===
function addDemoData() {
  allData.quests = [
    { type: 'daily', name: 'Feed the cat', emoji: '🧑‍🍳', desc: 'Give breakfast to your cat', pts: 3 },
    { type: 'daily', name: 'Morning walk', emoji: '🚶‍♂️', desc: '10 min walk in the park', pts: 2 },
    { type: 'weekly', name: 'Clean up room', emoji: '🧹', desc: 'Tidy up your room on Saturday', pts: 5 },
    { type: 'weekly', name: 'Call grandma', emoji: '☎️', desc: 'Check in on your grandma', pts: 4 },
    { type: 'event', name: 'Birthday surprise', emoji: '🎉', desc: 'Organize a surprise for a friend', pts: 10 }
  ];
  allData.completed = [];
  allData.rewards = [
    { name: 'Chocolate bar', emoji: '🍫', desc: 'Sweet treat', cost: 6 },
    { name: 'Coffee break', emoji: '☕', desc: 'Buy yourself a nice coffee', cost: 8 },
    { name: 'Movie night', emoji: '🎬', desc: 'Watch a movie with popcorn', cost: 14 },
    { name: 'Game hour', emoji: '🎮', desc: 'Play your favorite game for 1 hour', cost: 10 },
    { name: 'Cute sticker', emoji: '🧸', desc: 'Get a cute sticker for your notebook', cost: 2 }
  ];
  allData.claimed = [];
  allData.points = { demo: 11 };
  allData.users.demo = { password: "demo", role: "user" };
  syncToFirebase();
}

// === User Logic ===
function setUser(login) {
  currentUser = login;
  localStorage.setItem('pawCurrentUser', login);
  stopListenFromFirebase();
  isInitialSync = true;
  allData = {
    users: {},
    quests: [],
    completed: [],
    rewards: [],
    claimed: [],
    points: {}
  };
  listenFromFirebase();
}
function userRole() {
  return (allData.users[currentUser] && allData.users[currentUser].role) || "user";
}

// === Auth ===
window.doLogin = async function doLogin() {
  let login = document.getElementById('login-username').value.trim();
  let pass = document.getElementById('login-password').value.trim();
  if (!login || !pass) { document.getElementById('login-err').textContent = "Fill both fields"; return; }
  // check if user exists in Firestore
  const userDoc = await getDoc(doc(db, "groups", login));
  if (!userDoc.exists() || !userDoc.data().users[login] || userDoc.data().users[login].password !== pass) {
    document.getElementById('login-err').textContent = "Wrong login or password";
    return;
  }
  setUser(login);
  closeAllModals();
  renderAll();
}
window.doRegister = async function doRegister() {
  let login = document.getElementById('register-username').value.trim();
  let pass = document.getElementById('register-password').value.trim();
  if (!login || !pass) { document.getElementById('register-err').textContent = "Fill both fields"; return; }
  // Проверка уникальности
  const userDoc = await getDoc(doc(db, "groups", login));
  if (userDoc.exists()) { document.getElementById('register-err').textContent = "User exists"; return; }
  // Новый пользователь = новая база (группа)
  allData = {
    users: {},
    quests: [],
    completed: [],
    rewards: [],
    claimed: [],
    points: {}
  };
  allData.users[login] = { password: pass, role: "user" };
  allData.points[login] = 0;
  setUser(login);
  syncToFirebase();
  closeAllModals();
  renderAll();
}
window.signOut = function signOut() {
  stopListenFromFirebase();
  localStorage.removeItem('pawCurrentUser');
  currentUser = "";
  allData = {
    users: {},
    quests: [],
    completed: [],
    rewards: [],
    claimed: [],
    points: {}
  };
  renderAll();
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

// === Переменная и фильтры/поиск ===
// (аналогично предыдущему коду, см. предыдущий ответ, сюда полностью переносится фильтрация, CRUD, страницы)

... // (Вставьте сюда тело renderQuestFilters, renderRewardFilters, filterQuests, filterRewards и рендеринг страниц)

window.addEventListener('DOMContentLoaded', () => {
  if (!currentUser) {
    // DEMO mode
    stopListenFromFirebase();
    isInitialSync = true;
    groupId = "demo-family";
    allData = {
      users: {},
      quests: [],
      completed: [],
      rewards: [],
      claimed: [],
      points: {}
    };
    listenFromFirebase();
  } else {
    setUser(currentUser);
  }
  document.getElementById('loader').style.display = 'none';
});