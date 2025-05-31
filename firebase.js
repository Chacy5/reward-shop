import { initializeApp } from "https://www.gstatic.com/firebasejs/11.8.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.8.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.8.1/firebase-firestore.js";

// !!! ВСТАВЬ СВОЙ КОНФИГ ЕСЛИ НАДО !!!
export const firebaseConfig = {
  apiKey: "AIzaSyBDHjCE7CYC_jxL7EPjUApVvrd8avHmcNA",
  authDomain: "talk-to-my-paw.firebaseapp.com",
  databaseURL: "https://talk-to-my-paw-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "talk-to-my-paw",
  storageBucket: "talk-to-my-paw.appspot.com",
  messagingSenderId: "1023228484299",
  appId: "1:1023228484299:web:df2f42b4bebff7c82b194e",
  measurementId: "G-X51RCW3ND0"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);