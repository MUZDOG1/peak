// Import Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getFirestore, doc, setDoc, deleteDoc, onSnapshot, collection } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

// 🔥 Firebase configuration
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const onlineUsersRef = collection(db, "onlineUsers");

// 🔹 Get nickname (or assign guest)
function getNickname() {
  let nickname = localStorage.getItem("nickname");
  if (!nickname) {
    nickname = "Guest" + Math.floor(Math.random() * 10000);
    localStorage.setItem("nickname", nickname);
  }
  return nickname;
}

// 🔹 Set user as online
async function setUserOnline() {
  const nickname = getNickname();
  try {
    await setDoc(doc(onlineUsersRef, nickname), {
      online: true,
      timestamp: new Date()
    });
    console.log("✅ User marked as online.");
  } catch (error) {
    console.error("❌ Error adding user:", error);
  }
}

// 🔹 Remove user when they leave
async function setUserOffline() {
  const nickname = getNickname();
  try {
    await deleteDoc(doc(onlineUsersRef, nickname));
    console.log("✅ User removed from online users.");
  } catch (error) {
    console.error("❌ Error removing user:", error);
  }
}

// 🔹 Listen for real-time online user count updates
function updateOnlineUsersCount() {
  onSnapshot(onlineUsersRef, (snapshot) => {
    const onlineCount = snapshot.size;
    const onlineCountEl = document.getElementById("onlineCount");
    if (onlineCountEl) {
      onlineCountEl.textContent = `Users online: ${onlineCount}`;
    } else {
      console.error("❌ onlineCount element not found");
    }
  });
}

// 🟢 Mark user online when they join
window.addEventListener("load", () => {
  setUserOnline();
  updateOnlineUsersCount();
});

// 🔴 Remove user when they leave or close the tab
window.addEventListener("beforeunload", () => {
  setUserOffline();
});


