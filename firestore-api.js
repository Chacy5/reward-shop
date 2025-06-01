import { auth, db } from "./firebase.js";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut
} from "https://www.gstatic.com/firebasejs/11.8.1/firebase-auth.js";
import {
  doc, setDoc, getDoc, updateDoc, collection, addDoc, getDocs, deleteDoc, arrayUnion, arrayRemove
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

// Поиск пользователя по username или email (по всем семьям)
export async function findUserByUsernameOrEmail(query) {
  const familiesSnap = await getDocs(collection(db, "families"));
  for (const famDoc of familiesSnap.docs) {
    const usersSnap = await getDocs(collection(db, "families", famDoc.id, "users"));
    for (const userDoc of usersSnap.docs) {
      const data = userDoc.data();
      if (
        data.username?.toLowerCase() === query.toLowerCase() ||
        data.email?.toLowerCase() === query.toLowerCase()
      ) {
        return { uid: userDoc.id, familyId: famDoc.id, ...data };
      }
    }
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

// ====== ДРУЗЬЯ и КВЕСТМАСТЕРЫ ======

// Структура в users: 
// friends: [{uid, status: 'pending'|'accepted', asQuestmaster: boolean }]
// incomingFriendRequests: [uid]
// outgoingFriendRequests: [uid]
// questmasters: [uid]  // те, кто квестмастер для этого пользователя

// -- Отправить заявку в друзья
export async function sendFriendRequest(myFamilyId, myUid, theirUid) {
  // Найти familyId друга
  let theirFamilyId = await findFamilyIdByUserId(theirUid);
  if (!theirFamilyId) throw new Error("User not found");

  // Добавить в outgoingFriendRequests отправителя
  await updateDoc(doc(db, "families", myFamilyId, "users", myUid), {
    outgoingFriendRequests: arrayUnion(theirUid)
  });
  // Добавить в incomingFriendRequests получателя
  await updateDoc(doc(db, "families", theirFamilyId, "users", theirUid), {
    incomingFriendRequests: arrayUnion(myUid)
  });
}

// -- Принять заявку
export async function acceptFriendRequest(myFamilyId, myUid, theirUid) {
  let theirFamilyId = await findFamilyIdByUserId(theirUid);
  if (!theirFamilyId) throw new Error("User not found");

  // Удалить заявку из incoming/outgoing
  await updateDoc(doc(db, "families", myFamilyId, "users", myUid), {
    incomingFriendRequests: arrayRemove(theirUid),
    friends: arrayUnion({ uid: theirUid, status: "accepted", asQuestmaster: false })
  });
  await updateDoc(doc(db, "families", theirFamilyId, "users", theirUid), {
    outgoingFriendRequests: arrayRemove(myUid),
    friends: arrayUnion({ uid: myUid, status: "accepted", asQuestmaster: false })
  });
}

// -- Отклонить заявку
export async function declineFriendRequest(myFamilyId, myUid, theirUid) {
  let theirFamilyId = await findFamilyIdByUserId(theirUid);
  if (!theirFamilyId) throw new Error("User not found");
  await updateDoc(doc(db, "families", myFamilyId, "users", myUid), {
    incomingFriendRequests: arrayRemove(theirUid)
  });
  await updateDoc(doc(db, "families", theirFamilyId, "users", theirUid), {
    outgoingFriendRequests: arrayRemove(myUid)
  });
}

// -- Удалить друга
export async function removeFriend(myFamilyId, myUid, theirUid) {
  let theirFamilyId = await findFamilyIdByUserId(theirUid);
  if (!theirFamilyId) throw new Error("User not found");
  // Удалить из friends
  const myDocRef = doc(db, "families", myFamilyId, "users", myUid);
  const theirDocRef = doc(db, "families", theirFamilyId, "users", theirUid);

  // Получить текущие friends для удаления по uid
  let myData = (await getDoc(myDocRef)).data();
  let theirData = (await getDoc(theirDocRef)).data();

  let myFriends = (myData.friends||[]).filter(f => f.uid !== theirUid);
  let theirFriends = (theirData.friends||[]).filter(f => f.uid !== myUid);

  await updateDoc(myDocRef, { friends: myFriends });
  await updateDoc(theirDocRef, { friends: theirFriends });
}

// -- Назначить/снять друга как квестмастера
export async function setFriendAsQuestmaster(myFamilyId, myUid, theirUid, asQuestmaster) {
  let myDocRef = doc(db, "families", myFamilyId, "users", myUid);
  // Обновить поле friends: asQuestmaster
  let myData = (await getDoc(myDocRef)).data();
  let friends = (myData.friends||[]).map(f =>
    f.uid === theirUid ? { ...f, asQuestmaster } : f
  );
  await updateDoc(myDocRef, { friends });
}

// -- Получить список друзей (с их статусами)
export async function getFriends(myFamilyId, myUid) {
  let user = (await getDoc(doc(db, "families", myFamilyId, "users", myUid))).data();
  return user?.friends || [];
}

// -- Получить входящие/исходящие заявки
export async function getFriendRequests(myFamilyId, myUid) {
  let user = (await getDoc(doc(db, "families", myFamilyId, "users", myUid))).data();
  return {
    incoming: user?.incomingFriendRequests || [],
    outgoing: user?.outgoingFriendRequests || []
  };
}

// -- Проверить, является ли пользователь квестмастером для кого-то
export async function isQuestmasterFor(targetFamilyId, targetUid, myUid) {
  let targetUser = (await getDoc(doc(db, "families", targetFamilyId, "users", targetUid))).data();
  return !!(targetUser?.friends || []).find(f => f.uid === myUid && f.asQuestmaster);
}

// Выход
export async function logoutUser() {
  await signOut(auth);
  localStorage.removeItem("pawFamilyId");
  localStorage.removeItem("pawCurrentUser");
}
