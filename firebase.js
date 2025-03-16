// firebase.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-storage.js";
import { getDatabase, ref, set, onDisconnect, onValue } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-database.js";

// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyAr_YalGc9rlZijAY17uQPAT2PyxfMiD-8",
  authDomain: "chatroom-80c45.firebaseapp.com",
  projectId: "chatroom-80c45",
  storageBucket: "chatroom-80c45.firebasestorage.app",
  messagingSenderId: "810230295758",
  appId: "1:810230295758:web:d736c80d30f0d83b19749f",
  measurementId: "G-4973KL5NCN"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);
const rtdb = getDatabase(app);

// Online User Tracking
function updateUserStatus(isOnline) {
  const currentNickname = localStorage.getItem("nickname") || "Guest";
  const userStatusRef = ref(rtdb, `onlineUsers/${currentNickname}`);
  if (isOnline) {
    set(userStatusRef, true);
    onDisconnect(userStatusRef).remove();
  } else {
    // Optionally mark as offline immediately
    set(userStatusRef, false);
  }
}

// Listen for online users count and update the element with id "onlineCount"
const onlineCountRef = ref(rtdb, "onlineUsers");
onValue(onlineCountRef, (snapshot) => {
  const usersOnline = snapshot.exists() ? Object.keys(snapshot.val()).length : 0;
  const onlineCountEl = document.getElementById("onlineCount");
  if (onlineCountEl) {
    onlineCountEl.textContent = usersOnline;
  }
});

export { db, storage, updateUserStatus };
