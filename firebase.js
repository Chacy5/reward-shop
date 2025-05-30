
import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc, setDoc, updateDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
};
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Пример: создать новую группу и пользователя
async function registerUser(groupName, userName, password) {
  const groupRef = doc(db, "groups", groupName);
  const groupSnap = await getDoc(groupRef);
  if (!groupSnap.exists()) {
    // Создаём группу и первого пользователя
    await setDoc(groupRef, {
      users: { [userName]: { password, role: "user" } },
      points: { [userName]: 0 },
      quests: [],
      rewards: [],
      claimed: [],
      completed: []
    });
  } else {
    // Добавляем пользователя в существующую группу
    const data = groupSnap.data();
    if (data.users && data.users[userName]) throw "User already exists";
    await updateDoc(groupRef, {
      [`users.${userName}`]: { password, role: "user" },
      [`points.${userName}`]: 0
    });
  }
}
