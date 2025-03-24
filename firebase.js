// firebase.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { 
  getFirestore, 
  doc, 
  getDoc, 
  updateDoc, 
  setDoc, 
  increment,
  collection,
  query,
  where,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-storage.js";
import { getDatabase, ref, set, onDisconnect } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-database.js";
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut 
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";

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
const auth = getAuth(app);
const rtdb = getDatabase(app);

// -------------------------------
// User Presence (RTDB)
// -------------------------------
function updateUserStatus(isOnline) {
  // Using uid if logged in; otherwise fallback to "Guest"
  const userKey = auth.currentUser ? auth.currentUser.uid : "Guest";
  const userStatusRef = ref(rtdb, `onlineUsers/${userKey}`);
  if (isOnline) {
    set(userStatusRef, true)
      .then(() => console.log(`${userKey} is online (RTDB).`))
      .catch((err) => console.error("Error updating online status:", err));
    onDisconnect(userStatusRef).remove();
  } else {
    set(userStatusRef, false)
      .then(() => console.log(`${userKey} is offline (RTDB).`))
      .catch((err) => console.error("Error updating online status:", err));
  }
}

// -------------------------------
// Site Visits Counter (Firestore)
// -------------------------------
const siteStatsRef = doc(db, "analytics", "siteStats");

async function incrementSiteVisits() {
  try {
    await updateDoc(siteStatsRef, { visits: increment(1) });
    console.log("Site visits incremented by 1.");
  } catch (err) {
    console.warn("Could not update siteStats doc. It might not exist. Creating it...", err);
    try {
      await setDoc(siteStatsRef, { visits: 1 });
      console.log("SiteStats document created with visits = 1.");
    } catch (error) {
      console.error("Error creating siteStats document:", error);
    }
  }
}

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

// -------------------------------
// Authentication Functions with Admin Check
// -------------------------------
/**
 * Sign Up a new user with email, password, and username.
 * If the email is "metallicfarts867@gmail.com" and username is "muzdog",
 * the user document will be created with an admin flag.
 */
async function signUp(email, password, username) {
  try {
    const normalizedUsername = username.toLowerCase();

    // Check if the username already exists.
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("username", "==", normalizedUsername));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      alert("Username is already taken. Please choose another one.");
      return;
    }

    // Create the user account.
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Determine admin status based on provided details.
    const isAdmin = (email === "metallicfarts867@gmail.com" && normalizedUsername === "muzdog");

    // Store the new user's data in Firestore.
    await setDoc(doc(db, "users", user.uid), {
      username: normalizedUsername,
      email: email,
      isAdmin: isAdmin,  // will be true for the specified admin
      banned: false      // default to not banned
    });

    console.log("User created:", user);
    alert("Account created successfully!");
  } catch (error) {
    console.error("Signup Error:", error.message);
    alert(error.message);
  }
}

/**
 * Log in an existing user.
 */
async function login(email, password) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    console.log("User logged in:", user);
    alert("Login successful!");
  } catch (error) {
    console.error("Login Error:", error.message);
    alert(error.message);
  }
}

/**
 * Log out the current user.
 */
async function logout() {
  try {
    await signOut(auth);
    console.log("User logged out.");
    alert("You have been logged out.");
  } catch (error) {
    console.error("Logout Error:", error.message);
    alert(error.message);
  }
}

/**
 * Ban a user by setting the "banned" flag to true.
 * Only admins should be able to call this function.
 */
async function banUser(userId) {
  try {
    await updateDoc(doc(db, "users", userId), {
      banned: true
    });
    alert("User banned successfully.");
  } catch (error) {
    console.error("Error banning user:", error.message);
    alert("Failed to ban user.");
  }
}

/**
 * Unban a user by setting the "banned" flag to false.
 * Only admins should be able to call this function.
 */
async function unbanUser(userId) {
  try {
    await updateDoc(doc(db, "users", userId), {
      banned: false
    });
    alert("User unbanned successfully.");
  } catch (error) {
    console.error("Error unbanning user:", error.message);
    alert("Failed to unban user.");
  }
}

export { 
  db, 
  storage, 
  auth, 
  updateUserStatus, 
  incrementSiteVisits, 
  getSiteVisits, 
  signUp, 
  login, 
  logout,
  banUser,
  unbanUser
};
