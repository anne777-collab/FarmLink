// src/context/AuthContext.js
import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import {
  onAuthStateChanged,
  signInWithPopup,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { auth, googleProvider } from "../firebase/config";
import { getUser } from "../firebase/firestore";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser]   = useState(undefined); // undefined = not yet known
  const [userProfile, setUserProfile]   = useState(null);
  const [loading, setLoading]           = useState(true);

  useEffect(() => {
    // onAuthStateChanged fires once immediately with the persisted session
    // (or null if logged out). We MUST call setLoading(false) in every
    // possible code path — including error cases — otherwise the app
    // stays on the PageLoader forever.
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user ?? null);

      if (!user) {
        // Logged out — no Firestore fetch needed
        setUserProfile(null);
        setLoading(false);
        return;
      }

      // Logged in — fetch the Firestore profile.
      // We do NOT make the onAuthStateChanged callback itself async because
      // any uncaught rejection inside an async callback swallowed by Firebase
      // will leave loading=true permanently. Use a plain Promise chain instead.
      getUser(user.uid)
        .then((profile) => {
          setUserProfile(profile ?? null);
        })
        .catch((err) => {
          // Profile fetch failed (network error, Firestore rules, etc.)
          // Log it but do NOT leave the app stuck — clear the profile and
          // let AppRouter decide what to render (it will show SetupPage).
          console.error("[AuthContext] getUser failed:", err);
          setUserProfile(null);
        })
        .finally(() => {
          // Guaranteed to run regardless of success or failure
          setLoading(false);
        });
    });

    return unsubscribe; // clean up the listener on unmount
  }, []);

  /**
   * Call this after saving a new profile to Firestore so AuthContext
   * re-fetches and AppRouter re-routes to the correct dashboard.
   */
  const refreshProfile = useCallback(async () => {
    if (!currentUser) return;
    try {
      const profile = await getUser(currentUser.uid);
      setUserProfile(profile ?? null);
    } catch (err) {
      console.error("[AuthContext] refreshProfile failed:", err);
    }
  }, [currentUser]);

  // ── Google Sign-In ───────────────────────────────────────────────────────
  // Returns the Firebase user. AppRouter/SetupPage handles new-user routing
  // automatically because onAuthStateChanged fires after signInWithPopup.
  const signInWithGoogle = async () => {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  };

  // ── Email / Password ─────────────────────────────────────────────────────
  const signUpWithEmail = async (email, password) => {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    return result.user;
  };

  const signInWithEmail = async (email, password) => {
    const result = await signInWithEmailAndPassword(auth, email, password);
    return result.user;
  };

  const value = {
    currentUser,
    userProfile,
    loading,
    refreshProfile,
    setUserProfile,    // escape hatch for optimistic updates
    signInWithGoogle,
    signUpWithEmail,
    signInWithEmail,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
};