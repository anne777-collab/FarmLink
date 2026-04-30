// src/context/AuthContext.js
import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import {
  onAuthStateChanged,
  signInWithPopup,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,           // NEW: for Forgot Password feature
} from "firebase/auth";
import { auth, googleProvider } from "../firebase/config";
import { getUser } from "../firebase/firestore";

// NOTE: RecaptchaVerifier and signInWithPhoneNumber are intentionally removed.
// Phone authentication has been replaced by Google + Email/Password login.

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(undefined); // undefined = not yet resolved
  const [userProfile, setUserProfile] = useState(null);
  const [loading,     setLoading]     = useState(true);

  // ── Auth state listener ────────────────────────────────────────────────────
  // Must call setLoading(false) in EVERY code path — never leave it as true.
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user ?? null);

      if (!user) {
        setUserProfile(null);
        setLoading(false);
        return;
      }

      getUser(user.uid)
        .then((profile) => {
          setUserProfile(profile ?? null);
        })
        .catch((err) => {
          console.error("[AuthContext] getUser failed:", err);
          setUserProfile(null);
        })
        .finally(() => {
          setLoading(false);
        });
    });

    return unsubscribe;
  }, []);

  // ── Refresh profile after Firestore writes ────────────────────────────────
  const refreshProfile = useCallback(async () => {
    if (!currentUser) return;
    try {
      const profile = await getUser(currentUser.uid);
      setUserProfile(profile ?? null);
    } catch (err) {
      console.error("[AuthContext] refreshProfile failed:", err);
    }
  }, [currentUser]);

  // ── Google Sign-In ─────────────────────────────────────────────────────────
  const signInWithGoogle = async () => {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  };

  // ── Email / Password ───────────────────────────────────────────────────────
  const signUpWithEmail = async (email, password) => {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    return result.user;
  };

  const signInWithEmail = async (email, password) => {
    const result = await signInWithEmailAndPassword(auth, email, password);
    return result.user;
  };

  // ── Forgot Password ────────────────────────────────────────────────────────
  // Sends a Firebase password-reset email. Throws on error so the caller
  // can handle it and show a user-friendly message.
  const resetPassword = async (email) => {
    await sendPasswordResetEmail(auth, email.trim());
  };

  const value = {
    currentUser,
    userProfile,
    loading,
    refreshProfile,
    setUserProfile,
    signInWithGoogle,
    signUpWithEmail,
    signInWithEmail,
    resetPassword,              // NEW: exposed for EmailAuthForm → Forgot Password
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