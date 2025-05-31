import { auth, db } from "./firebase.js";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut
} from "https://www.gstatic.com/firebasejs/11.8.1/firebase-auth.js";
import {
  doc, setDoc, getDoc, updateDoc, collection, addDoc, getDocs, deleteDoc
} from "https://www.gstatic.com/firebasejs/11.8.1/firebase-firestore.js";

// Регистрация: создает пользователя и новую семью (family)
export async function registerNewUser({ username, email, password }) {
  // 1. Firebase Auth
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;
  const familyId = user.uid;

  // 2. Создать документ семьи
  await setDoc(doc(db, "families", familyId), {
    created: Date.now(),
    admin: user.uid,
    familyName: `${username}'s family`
  });

  // 3. Добавить юзера в подколлекцию users
  await setDoc(doc(db, "families", familyId, "users", user.uid), {
    username,
    email,
    role: "Performer",
    joined: Date.now(),
    points: 0
  });

  // 4. Сохранить familyId локально
  localStorage.setItem("pawFamilyId", familyId);
  localStorage.setItem("pawCurrentUser", user.uid);

  return { familyId, user };
}

// Вход по email/password
export async function loginUser({ email, password }) {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;

  // Узнать familyId (поискать в families/*/users/user.uid)
  let familyId = await findFamilyIdByUserId(user.uid);
  if (familyId) {
    localStorage.setItem("pawFamilyId", familyId);
    localStorage.setItem("pawCurrentUser", user.uid);
  }
  return { familyId, user };
}

// Поиск familyId по userId
export async function findFamilyIdByUserId(userId) {
  const familiesSnap = await getDocs(collection(db, "families"));
  for (const famDoc of familiesSnap.docs) {
    const userDoc = await getDoc(doc(db, "families", famDoc.id, "users", userId));
    if (userDoc.exists()) return famDoc.id;
  }
  return null;
}

// Получить данные пользователя
export async function getUserData(familyId, userId) {
  const docRef = doc(db, "families", familyId, "users", userId);
  const snap = await getDoc(docRef);
  return snap.exists() ? snap.data() : null;
}

// Обновить данные пользователя
export async function updateUserData(familyId, userId, data) {
  const docRef = doc(db, "families", familyId, "users", userId);
  await updateDoc(docRef, data);
}

// Получить квесты семьи
export async function getQuests(familyId) {
  const snap = await getDocs(collection(db, "families", familyId, "quests"));
  return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

// Добавить квест
export async function addQuest(familyId, quest) {
  const ref = await addDoc(collection(db, "families", familyId, "quests"), quest);
  return ref.id;
}

// Обновить квест
export async function updateQuest(familyId, questId, quest) {
  await setDoc(doc(db, "families", familyId, "quests", questId), quest);
}

// Удалить квест
export async function deleteQuest(questId) {
  if (!confirm("Delete this quest?")) return;

  // Обновление локальных данных пользователя
  let user = getUserData();
  user.quests = user.quests.filter(q => q.id !== questId);

  // Сохранение изменений и обновление интерфейса
  saveData();
  renderQuests();
}

// Получить награды семьи
export async function getRewards(familyId) {
  const snap = await getDocs(collection(db, "families", familyId, "rewards"));
  return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

// Добавить награду
export async function addReward(familyId, reward) {
  const ref = await addDoc(collection(db, "families", familyId, "rewards"), reward);
  return ref.id;
}

// Обновить награду
export async function updateReward(familyId, rewardId, reward) {
  await setDoc(doc(db, "families", familyId, "rewards", rewardId), reward);
}

// Удалить награду
export async function deleteReward(familyId, rewardId) {
  if (!confirm("Delete this reward?")) return;

  // Удаление награды из Firebase
  await deleteDoc(doc(db, "families", familyId, "rewards", rewardId));

  // Обновление локальных данных пользователя
  let user = getUserData();
  user.rewards = user.rewards.filter(r => r.id !== rewardId);

  // Сохранение изменений и обновление интерфейса
  saveData();
  renderRewards();
}

// Выход
export async function logoutUser() {
  await signOut(auth);
  localStorage.removeItem("pawFamilyId");
  localStorage.removeItem("pawCurrentUser");
}