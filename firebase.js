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
    set(userStatusRef, true)
      .then(() => console.log(`Realtime DB: ${currentNickname} is online.`))
      .catch((err) => console.error("RTDB set error:", err));
    onDisconnect(userStatusRef).remove();
  } else {
    set(userStatusRef, false)
      .then(() => console.log(`Realtime DB: ${currentNickname} is offline.`))
      .catch((err) => console.error("RTDB set error:", err));
  }
}

// Generate a random user ID for Firestore online users tracking
const userId = `user_${Math.floor(Math.random() * 1000000)}`;

// Reference to Firestore onlineUsers collection
const onlineUsersRef = collection(db, "onlineUsers");

// Function to update online users count (listens for changes in the Firestore collection)
function updateOnlineUsersCount() {
  onSnapshot(onlineUsersRef, (snapshot) => {
    const onlineCount = snapshot.size;
    const onlineCountEl = document.getElementById("onlineCount");
    if (onlineCountEl) {
      onlineCountEl.textContent = onlineCount;
      console.log("Online users updated:", onlineCount);
    } else {
      console.error("onlineCount element not found");
    }
  }, (error) => {
    console.error("Error listening to onlineUsers:", error);
  });
}

// Add user to Firestore `onlineUsers` collection
async function setUserOnline() {
  try {
    await setDoc(doc(onlineUsersRef, userId), {
      online: true,
      timestamp: new Date()
    });
    console.log("Firestore: User added to onlineUsers with ID:", userId);
  } catch (error) {
    console.error("Error adding user to onlineUsers:", error);
  }
}

// Remove user from Firestore `onlineUsers` collection when they leave
async function setUserOffline() {
  try {
    await deleteDoc(doc(onlineUsersRef, userId));
    console.log("Firestore: User removed from onlineUsers with ID:", userId);
  } catch (error) {
    console.error("Error removing user from onlineUsers:", error);
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
    console.log("Site visits incremented by 1.");
  } catch (err) {
    console.warn("Could not update siteStats doc. It might not exist. Creating it...", err);
    try {
      await setDoc(siteStatsRef, {
        visits: 1
      });
      console.log("SiteStats document created with visits = 1.");
    } catch (error) {
      console.error("Error creating siteStats document:", error);
    }
  }
}

/** Retrieves the current total of visits. */
async function getSiteVisits() {
  try {
    const docSnap = await getDoc(siteStatsRef);
    if (docSnap.exists()) {
      const visits = docSnap.data().visits || 0;
      console.log("Retrieved site visits:", visits);
      return visits;
    }
    console.warn("SiteStats document does not exist.");
    return 0;
  } catch (error) {
    console.error("Error getting siteStats document:", error);
    return 0;
  }
}

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

