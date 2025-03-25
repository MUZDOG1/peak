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

const firebaseConfig = {
  apiKey: "AIzaSyAr_YalGc9rlZijAY17uQPAT2PyxfMiD-8",
  authDomain: "chatroom-80c45.firebaseapp.com",
  projectId: "chatroom-80c45",
  storageBucket: "chatroom-80c45.appspot.com",
  messagingSenderId: "810230295758",
  appId: "1:810230295758:web:d736c80d30f0d83b19749f",
  measurementId: "G-4973KL5NCN"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);
const auth = getAuth(app);
const rtdb = getDatabase(app);

function updateUserStatus(isOnline) {
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

async function signUp(email, password, username) {
  try {
    const normalizedUsername = username.toLowerCase();
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("username", "==", normalizedUsername));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      alert("Username is already taken. Please choose another one.");
      return;
    }

    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    const isAdmin = (email === "metallicfarts867@gmail.com" && normalizedUsername === "muzdog");
    await setDoc(doc(db, "users", user.uid), {
      username: normalizedUsername,
      email: email,
      isAdmin: isAdmin,
      banned: false
    });

    console.log("User created:", user);
    alert("Account created successfully!");
  } catch (error) {
    console.error("Signup Error:", error.message);
    alert(error.message);
  }
}

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

// Add this new function
async function checkAdminStatus(userId) {
  try {
    const userDoc = await getDoc(doc(db, "users", userId));
    return userDoc.exists() && userDoc.data().isAdmin === true;
  } catch (error) {
    console.error("Error checking admin status:", error);
    return false;
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
  unbanUser,
  checkAdminStatus
};