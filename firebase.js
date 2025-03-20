// firebase.js

import { 
  initializeApp 
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { 
  getFirestore, 
  doc, 
  setDoc, 
  deleteDoc, 
  onSnapshot, 
  collection, 
  Timestamp 
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

// Firebase configuration (replace with your actual config)
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

// Use the Firestore collection "onlineUsers" for presence tracking
const onlineUsersRef = collection(db, "onlineUsers");

// Retrieve or create a nickname (stored in localStorage)
function getNickname() {
  let nickname = localStorage.getItem("nickname");
  if (!nickname) {
    // If no nickname exists, generate one and store it
    nickname = "Guest" + Math.floor(Math.random() * 10000);
    localStorage.setItem("nickname", nickname);
  }
  return nickname;
}

// Set the user as online by creating/updating their document with a timestamp
async function setUserOnline() {
  const nickname = getNickname();
  try {
    await setDoc(doc(onlineUsersRef, nickname), {
      online: true,
      // Use Firestore's Timestamp so we can compare later
      timestamp: Timestamp.now()
    });
    console.log("✅ User marked as online:", nickname);
    // Start sending heartbeat updates so our document stays fresh
    startHeartbeat();
  } catch (error) {
    console.error("❌ Error adding user:", error);
  }
}

// Remove the user's online document when they leave
async function setUserOffline() {
  const nickname = getNickname();
  try {
    await deleteDoc(doc(onlineUsersRef, nickname));
    console.log("✅ User removed from online users:", nickname);
    stopHeartbeat();
  } catch (error) {
    console.error("❌ Error removing user:", error);
  }
}

// Heartbeat variables and functions
let heartbeatIntervalId;

// Update our online document every 10 seconds so our timestamp stays current
function startHeartbeat() {
  // Clear any existing heartbeat first
  stopHeartbeat();
  heartbeatIntervalId = setInterval(async () => {
    const nickname = getNickname();
    try {
      await setDoc(doc(onlineUsersRef, nickname), {
        online: true,
        timestamp: Timestamp.now()
      }, { merge: true });
      console.log("Heartbeat updated for", nickname);
    } catch (error) {
      console.error("Heartbeat error:", error);
    }
  }, 10000); // 10 seconds interval
}

function stopHeartbeat() {
  if (heartbeatIntervalId) {
    clearInterval(heartbeatIntervalId);
    heartbeatIntervalId = null;
  }
}

// Listen in real time to the onlineUsers collection and update the count
function updateOnlineUsersCount() {
  onSnapshot(onlineUsersRef, (snapshot) => {
    const now = Date.now();
    let onlineCount = 0;
    snapshot.forEach((doc) => {
      const data = doc.data();
      if (data.timestamp) {
        // Convert Firestore Timestamp to a JS Date in milliseconds
        const docTime = data.timestamp.toDate().getTime();
        // Only count users whose timestamp is within the last 15 seconds
        if (now - docTime < 15000) {
          onlineCount++;
        }
      }
    });
    const onlineCountEl = document.getElementById("onlineCount");
    if (onlineCountEl) {
      onlineCountEl.textContent = `Users online: ${onlineCount}`;
    } else {
      console.error("❌ onlineCount element not found");
    }
  }, (error) => {
    console.error("❌ Error listening to onlineUsers:", error);
  });
}

// Automatically mark user online on window load and start listening for changes
window.addEventListener("load", () => {
  setUserOnline();
  updateOnlineUsersCount();
});

// Remove user from online list when the window unloads
window.addEventListener("beforeunload", () => {
  setUserOffline();
});

// Export the modules you need in your other scripts
export { db, setUserOnline, setUserOffline, updateOnlineUsersCount };


