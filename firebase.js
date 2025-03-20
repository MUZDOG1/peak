import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { 
  getFirestore, 
  doc, 
  getDoc, 
  updateDoc, 
  setDoc, 
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

// -------------------------------
// User Presence (RTDB)
// -------------------------------
// Note: Although we're removing the online users UI,
// the updateUserStatus function can remain for other purposes.
function updateUserStatus(isOnline) {
  const currentNickname = localStorage.getItem("nickname") || "Guest";
  const userStatusRef = ref(rtdb, `onlineUsers/${currentNickname}`);
  if (isOnline) {
    set(userStatusRef, true)
      .then(() => console.log(`${currentNickname} is online (RTDB).`))
      .catch((err) => console.error("Error updating online status:", err));
    onDisconnect(userStatusRef).remove();
  } else {
    set(userStatusRef, false)
      .then(() => console.log(`${currentNickname} is offline (RTDB).`))
      .catch((err) => console.error("Error updating online status:", err));
  }
}

// -------------------------------
// Site Visits Counter (Firestore)
// -------------------------------
const siteStatsRef = doc(db, "analytics", "siteStats");

/**
 * Increments the site visits count by 1.
 * If the document doesn't exist, creates it with visits = 1.
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

/**
 * Retrieves the current total site visits.
 */
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

export { db, storage, updateUserStatus, incrementSiteVisits, getSiteVisits };



