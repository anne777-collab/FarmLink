// src/firebase/config.js
// ─────────────────────────────────────────────────────────────────────────────
// STEP 1 — Replace every value below with your real Firebase project config.
// Firebase Console → Project Settings → Your apps → Web app → SDK snippet
// ─────────────────────────────────────────────────────────────────────────────

import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// const firebaseConfig = {
//   apiKey:            process.env.REACT_APP_FIREBASE_API_KEY            || "YOUR_API_KEY",
//   authDomain:        process.env.REACT_APP_FIREBASE_AUTH_DOMAIN        || "YOUR_PROJECT_ID.firebaseapp.com",
//   projectId:         process.env.REACT_APP_FIREBASE_PROJECT_ID         || "YOUR_PROJECT_ID",
//   storageBucket:     process.env.REACT_APP_FIREBASE_STORAGE_BUCKET     || "YOUR_PROJECT_ID.appspot.com",
//   messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID|| "YOUR_MESSAGING_SENDER_ID",
//   appId:             process.env.REACT_APP_FIREBASE_APP_ID             || "YOUR_APP_ID",
// };

const firebaseConfig = {
  apiKey: "AIzaSyCzI1l4xrvz6xWruHX1mkaoZnoZYocBkbE",
  authDomain: "farm-link-777.firebaseapp.com",
  projectId: "farm-link-777",
  storageBucket: "farm-link-777.firebasestorage.app",
  messagingSenderId: "453676958479",
  appId: "1:453676958479:web:e31f78c5fc417106e1747a",
};

// ─── Guard: detect placeholder config at startup ──────────────────────────────
// If the projectId is still a placeholder string, every Firestore write will
// silently hang (the SDK connects to a non-existent project and the Promise
// never resolves), making the Save button spin forever with no error shown.
if (
  firebaseConfig.projectId === "farm-link-777" ||
  firebaseConfig.apiKey    === "AIzaSyCzI1l4xrvz6xWruHX1mkaoZnoZYocBkbE"
) {
  console.error(
    "⚠️  [FarmLink] Firebase is using placeholder config values.\n" +
    "    Open src/firebase/config.js and replace the YOUR_* values\n" +
    "    with your real Firebase project credentials, OR set the\n" +
    "    REACT_APP_FIREBASE_* environment variables in a .env file.\n" +
    "    Until you do this, all Firestore writes will hang silently."
  );
}

// ─── Singleton init — safe to import from multiple modules ───────────────────
// getApps() returns [] on first load, so we only call initializeApp once.
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const auth           = getAuth(app);
export const db             = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
export default app;