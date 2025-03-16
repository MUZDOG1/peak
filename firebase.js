import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getFirestore, collection, doc, setDoc, deleteDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
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
    set(userStatusRef, false);
  }
}

// Generate a random user ID
const userId = `user_${Math.floor(Math.random() * 1000000)}`;

// Reference to onlineUsers collection
const onlineUsersRef = collection(db, "onlineUsers");

// Function to update online users count
function updateOnlineUsersCount() {
  onSnapshot(onlineUsersRef, (snapshot) => {
    const onlineCount = snapshot.size;
    const onlineCountEl = document.getElementById("onlineCount");
    if (onlineCountEl) {
      onlineCountEl.textContent = onlineCount;
    } else {
      console.error("onlineCount element not found");
    }
  });
}

// Add user to onlineUsers collection
async function setUserOnline() {
  try {
    await setDoc(doc(onlineUsersRef, userId), {
      online: true,
      timestamp: new Date()
    });
    console.log("User added to online users.");
  } catch (error) {
    console.error("Error adding user:", error);
  }
}

// Remove user when they leave
async function setUserOffline() {
  try {
    await deleteDoc(doc(onlineUsersRef, userId));
    console.log("User removed from online users.");
  } catch (error) {
    console.error("Error removing user:", error);
  }
}

// Call functions when the page loads
document.addEventListener("DOMContentLoaded", () => {
  setUserOnline();
  updateOnlineUsersCount();
});

// Remove user when they close the page
window.addEventListener("beforeunload", setUserOffline);

// Export modules
export { db, storage, updateUserStatus, setUserOnline, setUserOffline };

