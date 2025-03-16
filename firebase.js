import { 
  initializeApp 
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  onSnapshot, 
  serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

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

// Generate a random user ID (ensuring uniqueness)
const userId = `user_${Math.floor(Math.random() * 1000000)}`;

// Function to update online users count
function updateOnlineUsersCount() {
  onSnapshot(collection(db, "onlineUsers"), (snapshot) => {
    const onlineCount = snapshot.size;
    const onlineCountEl = document.getElementById("onlineCount");
    if (onlineCountEl) {
      onlineCountEl.textContent = onlineCount;
    }
    console.log("Online users count updated:", onlineCount);
  });
}

// Add user to the onlineUsers collection
async function setUserOnline() {
  try {
    await setDoc(doc(db, "onlineUsers", userId), {
      online: true,
      timestamp: serverTimestamp()
    });
    console.log("User added to online users:", userId);
  } catch (error) {
    console.error("Error adding user:", error);
  }
}

// Remove user when they leave the page
async function setUserOffline() {
  try {
    await deleteDoc(doc(db, "onlineUsers", userId));
    console.log("User removed from online users:", userId);
  } catch (error) {
    console.error("Error removing user:", error);
  }
}

// Call functions when the page loads
setUserOnline();
updateOnlineUsersCount();

// Remove user when the page unloads
window.addEventListener("beforeunload", setUserOffline);

export { db, setUserOnline, setUserOffline, updateOnlineUsersCount };

