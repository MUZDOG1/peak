import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  onSnapshot,
  getDoc,
  updateDoc,
  increment
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-storage.js";
import { getDatabase, ref, set, onDisconnect } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-database.js";

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

// ===============================
// 1) Online User Tracking (RTDB)
// ===============================
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

// Reference to onlineUsers collection in Firestore
const onlineUsersRef = collection(db, "onlineUsers");

// Function to update online users count (listens for changes in the Firestore collection)
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

// Add user to Firestore `onlineUsers` collection
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

// ===============================
// 2) Site Visits Counter (Firestore)
// ===============================
const siteStatsRef = doc(db, "analytics", "siteStats");

/**
 * Increments the site visits by 1. If the document doesn't exist yet,
 * it creates it with `visits = 1`.
 */
async function incrementSiteVisits() {
  try {
    await updateDoc(siteStatsRef, {
      visits: increment(1)
    });
  } catch (err) {
    // If doc doesn't exist, create it with visits=1
    await setDoc(siteStatsRef, {
      visits: 1
    });
  }
}

/** Retrieves the current total of visits. */
async function getSiteVisits() {
  const docSnap = await getDoc(siteStatsRef);
  if (docSnap.exists()) {
    return docSnap.data().visits || 0;
  }
  return 0;
}

// ===============================
// 3) Setup: DOMContentLoaded & Window events
// ===============================
// (Note: We moved these event listeners into index.html to keep logic separate.)
// You can keep or remove these from firebase.js if desired,
// but in the above index.html, we already do the final calls.

// Export modules
export { 
  db, 
  storage, 
  updateUserStatus, 
  setUserOnline, 
  setUserOffline,
  updateOnlineUsersCount,
  incrementSiteVisits,
  getSiteVisits
};

