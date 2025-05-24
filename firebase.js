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
  getDocs,
  serverTimestamp // Firestore serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-storage.js";
import {
  getDatabase,
  ref,
  set,
  onDisconnect,
  serverTimestamp as rtdbServerTimestamp, // Alias for RTDB serverTimestamp to avoid naming conflict
  remove
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-database.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";

// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyAr_YalGc9rlZijAY17uQPAT2PyxfMiD-8", // IMPORTANT: Hide this in a real app
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
// User Presence (Combined RTDB for onDisconnect and Firestore for querying online status)
// -------------------------------
async function updateUserStatus(isOnline) {
  if (!auth.currentUser) {
    // console.log("updateUserStatus: No current user to update status for.");
    return;
  }

  const userId = auth.currentUser.uid;
  const userFirestoreRef = doc(db, "users", userId);
  const userRtdbRef = ref(rtdb, `onlineUsers/${userId}`);

  const firestoreUpdateData = {
    online: isOnline,
    lastSeen: serverTimestamp() // Firestore's serverTimestamp
  };

  const rtdbUpdateData = {
    online: isOnline,
    lastSeen: rtdbServerTimestamp // RTDB's serverTimestamp
    // You could add other info here if needed by RTDB listeners, e.g., username
  };

  try {
    // Update Firestore
    // Check if the document exists before trying to update, or handle potential error
    const userDocSnap = await getDoc(userFirestoreRef);
    if (userDocSnap.exists()) {
        await updateDoc(userFirestoreRef, firestoreUpdateData);
        // console.log(`${userId} status updated to ${isOnline ? 'online' : 'offline'} (Firestore).`);
    } else {
        console.warn(`Firestore document for user ${userId} does not exist. Cannot update presence.`);
        // Optionally, you could create it here if appropriate for your app logic
        // await setDoc(userFirestoreRef, { ...firestoreUpdateData, /* other initial fields */ });
    }


    // Update Realtime Database
    if (isOnline) {
      await set(userRtdbRef, rtdbUpdateData);
      // When the client disconnects (e.g., closes tab/browser), remove their entry from RTDB
      // or set their status to offline. remove() is simpler if RTDB is purely for onDisconnect.
      onDisconnect(userRtdbRef).remove();
      // console.log(`${userId} status set to online (RTDB) and onDisconnect handler attached.`);
    } else {
      // If going offline, update or remove the RTDB entry.
      // If onDisconnect is set to .remove(), this explicit set might be redundant
      // for abrupt disconnects but good for graceful logouts/tab blurs.
      await set(userRtdbRef, rtdbUpdateData); // Or await remove(userRtdbRef);
      // console.log(`${userId} status set to offline (RTDB).`);
    }
  } catch (error) {
    console.error(`Error updating user ${userId} status to ${isOnline ? 'online' : 'offline'}:`, error);
  }
}

// -------------------------------
// Site Visits Counter (Firestore)
// -------------------------------
const siteStatsRef = doc(db, "analytics", "siteStats");

async function incrementSiteVisits() {
  try {
    await updateDoc(siteStatsRef, { visits: increment(1) });
    // console.log("Site visits incremented by 1.");
  } catch (err) {
    // console.warn("Could not update siteStats doc. It might not exist. Creating it...", err);
    try {
      await setDoc(siteStatsRef, { visits: 1 });
      // console.log("SiteStats document created with visits = 1.");
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
      // console.log("Retrieved site visits:", visits);
      return visits;
    }
    // console.warn("SiteStats document does not exist.");
    return 0;
  } catch (error) {
    console.error("Error getting siteStats document:", error);
    return 0;
  }
}

// -------------------------------
// Authentication Functions
// -------------------------------
async function signUp(email, password, username) {
  // Username validation (length, allowed characters) should ideally be here or in the UI
  if (!username || username.trim().length === 0) {
      alert("Username cannot be empty.");
      return;
  }
  const normalizedUsername = username.trim().toLowerCase(); // Trim and normalize

  try {
    // Check if username is already taken in Firestore (case-insensitive)
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("username", "==", normalizedUsername)); // Query by normalized username
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      alert("Username is already taken. Please choose another one.");
      return null; // Indicate failure
    }

    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Determine if the user is an admin (example hardcoded logic)
    const isAdmin = (email === "metallicfarts867@gmail.com" && normalizedUsername === "muzdog");

    // Create user document in Firestore
    await setDoc(doc(db, "users", user.uid), {
      username: username.trim(), // Store the originally cased username if desired, or normalizedUsername
      normalizedUsername: normalizedUsername, // For case-insensitive checks
      email: email,
      isAdmin: isAdmin,
      banned: false,
      online: false, // Initial online status
      lastSeen: serverTimestamp(), // Initial lastSeen timestamp
      createdAt: serverTimestamp() // Record creation time
    });

    console.log("User created and Firestore document set:", user.uid);
    // alert("Account created successfully! Please check your email for verification."); // Moved verification to main script
    return user; // Return user object on success
  } catch (error) {
    console.error("Signup Error:", error);
    // Provide more user-friendly error messages based on error.code
    if (error.code === 'auth/email-already-in-use') {
        alert("This email address is already registered. Please try logging in.");
    } else if (error.code === 'auth/weak-password') {
        alert("Password is too weak. Please choose a stronger password (at least 6 characters).");
    } else {
        alert("Signup failed: " + error.message);
    }
    return null; // Indicate failure
  }
}

async function login(email, password) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    // console.log("User logged in:", user.uid);
    // The onAuthStateChanged listener in your main script will handle UI updates and online status.
    // No need to alert "Login successful!" here, let the main script handle UI flow.
    return user; // Return user object on success
  } catch (error) {
    console.error("Login Error:", error);
    if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        alert("Login failed: Invalid email or password.");
    } else if (error.code === 'auth/too-many-requests') {
        alert("Access to this account has been temporarily disabled due to many failed login attempts. You can immediately restore it by resetting your password or you can try again later.");
    } else {
        alert("Login failed: " + error.message);
    }
    return null; // Indicate failure
  }
}

async function logout() {
  try {
    if (auth.currentUser) {
      // Set user offline before signing out
      await updateUserStatus(false);
    }
    await signOut(auth);
    // console.log("User logged out.");
    // No need to alert "You have been logged out." here, let the main script handle UI flow.
  } catch (error) {
    console.error("Logout Error:", error);
    alert("Logout failed: " + error.message);
  }
}

// -------------------------------
// User Management (Admin)
// -------------------------------
async function banUser(userId) {
  try {
    await updateDoc(doc(db, "users", userId), {
      banned: true,
      online: false // Also mark as offline if banning
    });
    // console.log(`User ${userId} banned successfully.`);
    // alert("User banned successfully."); // UI feedback should be in the main script
  } catch (error) {
    console.error("Error banning user:", error);
    // alert("Failed to ban user: " + error.message);
    throw error; // Re-throw for the caller to handle UI
  }
}

async function unbanUser(userId) {
  try {
    await updateDoc(doc(db, "users", userId), {
      banned: false
    });
    // console.log(`User ${userId} unbanned successfully.`);
    // alert("User unbanned successfully."); // UI feedback should be in the main script
  } catch (error) {
    console.error("Error unbanning user:", error);
    // alert("Failed to unban user: " + error.message);
    throw error; // Re-throw for the caller to handle UI
  }
}

export {
  db,
  storage,
  auth,
  rtdb, // Export RTDB instance if needed elsewhere
  updateUserStatus,
  incrementSiteVisits,
  getSiteVisits,
  signUp,
  login,
  logout,
  banUser,
  unbanUser
};