import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getFirestore, collection, doc, setDoc, deleteDoc, onSnapshot, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyAr_YalGc9rlZijAY17uQPAT2PyxfMiD-8",
  authDomain: "chatroom-80c45.firebaseapp.com",
  projectId: "chatroom-80c45",
  storageBucket: "chatroom-80c45.firebasestorage.app",
  messagingSenderId: "810230295758",
  appId: "1:810230295758:web:d736c80d30f0d83b19749f"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Generate a unique user ID (based on timestamp to avoid duplicates)
const userId = `user_${Date.now()}`;

// Reference to onlineUsers collection
const onlineUsersRef = collection(db, "onlineUsers");

// Function to update online users count
function updateOnlineUsersCount() {
  onSnapshot(onlineUsersRef, (snapshot) => {
    const onlineCount = snapshot.size;
    document.getElementById("onlineCount").textContent = onlineCount; // Fix ID mismatch
  });
}

// Add user to onlineUsers collection
async function setUserOnline() {
  try {
    await setDoc(doc(db, "onlineUsers", userId), {
      online: true,
      timestamp: serverTimestamp(),
    });
    console.log("✅ User added to online users.");
  } catch (error) {
    console.error("❌ Error adding user:", error);
  }
}

// Remove user when they leave
async function setUserOffline() {
  try {
    await deleteDoc(doc(db, "onlineUsers", userId));
    console.log("✅ User removed from online users.");
  } catch (error) {
    console.error("❌ Error removing user:", error);
  }
}

// Call functions when the page loads
setUserOnline();
updateOnlineUsersCount();

// Remove user when they close the page
window.addEventListener("beforeunload", setUserOffline);

