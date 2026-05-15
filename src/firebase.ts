import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from "firebase/auth";
import { getFirestore, collection, doc, setDoc, getDoc, getDocs, updateDoc, query, where, addDoc } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Load environment variables
const metaEnv = (import.meta as any).env || {};

const firebaseConfig = {
  apiKey: metaEnv.VITE_FIREBASE_API_KEY,
  authDomain: metaEnv.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: metaEnv.VITE_FIREBASE_PROJECT_ID,
  storageBucket: metaEnv.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: metaEnv.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: metaEnv.VITE_FIREBASE_APP_ID,
};

// Check if actual configuration exists (not empty and not placeholders)
const isFirebaseConfigured =
  firebaseConfig.apiKey &&
  firebaseConfig.apiKey !== "your_api_key" &&
  firebaseConfig.projectId;

let app;
let auth: any;
let db: any;
let storage: any;

if (isFirebaseConfigured) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);
    console.log("🔥 Firebase initialized successfully with configuration keys!");
  } catch (error) {
    console.error("❌ Failed to initialize real Firebase:", error);
  }
} else {
  console.warn(
    "📡 FarmLink Notice: Firebase configuration environment variables are missing or default placeholders.\n" +
      "Falling back to high-fidelity, client-side Simulated Firestore and Authentication.\n" +
      "Once you provide VITE_FIREBASE_* keys in your .env, FarmLink will auto-switch to your real Firebase cloud!"
  );
}

// Export real or null, let simulated clients handle fallbacks.
export { app, auth, db, storage, isFirebaseConfigured };
export { GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut };
export { collection, doc, setDoc, getDoc, getDocs, updateDoc, query, where, addDoc };
