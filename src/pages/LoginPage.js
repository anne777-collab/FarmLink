// src/pages/LoginPage.js
// Changes from previous version:
//   - PhoneOtpLogin component removed (phone auth discontinued)
//   - Method tab switcher removed (no longer needed with only one method)
//   - ForgotPasswordView added inside EmailAuthForm
//   - All phone-related imports (RecaptchaVerifier, signInWithPhoneNumber) removed
//   - Google login and Email/Password login are fully preserved

import React, { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { getUser } from "../firebase/firestore";
import { useAuth } from "../context/AuthContext";
import { Button, Input } from "../components/UI";
import toast from "react-hot-toast";

// ─────────────────────────────────────────────────────────────────────────────
// GOOGLE LOGIN BUTTON (unchanged)
// ─────────────────────────────────────────────────────────────────────────────
function GoogleLoginButton({ onNeedProfile }) {
  const { signInWithGoogle, refreshProfile } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleGoogle = async () => {
    setLoading(true);
    try {
      const user = await signInWithGoogle();
      const profile = await getUser(user.uid);
      await refreshProfile();
      if (!profile) onNeedProfile(user.uid);
      // Existing users: AppRouter re-routes automatically via onAuthStateChanged
    } catch (err) {
      if (err?.code === "auth/popup-closed-by-user") return; // user closed popup — silent
      toast.error("Google sign-in failed. Please try again.");
      console.error("[GoogleLoginButton]", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleGoogle}
      disabled={loading}
      className="w-full flex items-center justify-center gap-3 bg-white border-2 border-gray-200
                 hover:border-gray-300 rounded-xl py-3 px-4 font-semibold text-gray-700
                 transition-all active:scale-95 disabled:opacity-50">
      {loading ? (
        <span className="w-5 h-5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
      ) : (
        /* Google G logo — inline SVG, no external dependencies */
        <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden="true">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
      )}
      Continue with Google
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// EMAIL LOGIN / SIGNUP  (with inline Forgot Password)
// ─────────────────────────────────────────────────────────────────────────────
function EmailAuthForm({ onNeedProfile }) {
  const { signUpWithEmail, signInWithEmail, resetPassword, refreshProfile } = useAuth();

  // "login" | "signup" | "forgot" — controls which view is shown
  const [view,         setView]        = useState("login");
  const [email,        setEmail]       = useState("");
  const [password,     setPassword]    = useState("");
  const [loading,      setLoading]     = useState(false);
  const [showPassword, setShowPassword] = useState(false); // Task 1: eye toggle

  // ── Email / Password submit ─────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!email.trim())        { toast.error("Enter your email");                     return; }
    if (password.length < 6)  { toast.error("Password must be at least 6 characters"); return; }

    setLoading(true);
    try {
      if (view === "signup") {
        const user = await signUpWithEmail(email.trim(), password);
        const profile = await getUser(user.uid);
        await refreshProfile();
        if (!profile) onNeedProfile(user.uid);
        toast.success("Account created!");
      } else {
        await signInWithEmail(email.trim(), password);
        await refreshProfile();
        toast.success("Login successful!");
      }
    } catch (err) {
      const msg =
        err?.code === "auth/email-already-in-use"  ? "Email already registered. Try logging in."
        : err?.code === "auth/user-not-found"       ? "No account found. Sign up first."
        : err?.code === "auth/wrong-password"       ? "Incorrect password."
        : err?.code === "auth/invalid-email"        ? "Invalid email address."
        : err?.code === "auth/invalid-credential"   ? "Invalid email or password."
        : "Authentication failed. Try again.";
      toast.error(msg);
      console.error("[EmailAuthForm]", err);
    } finally {
      setLoading(false);
    }
  };

  // ── Forgot Password submit ──────────────────────────────────────────────
  const handleForgotPassword = async () => {
    if (!email.trim()) { toast.error("Enter your email address first"); return; }

    setLoading(true);
    try {
      await resetPassword(email.trim());
      toast.success("Password reset email sent. Check your inbox.");
      // Return to login view after a short delay so the user sees the toast
      setTimeout(() => setView("login"), 1500);
    } catch (err) {
      const msg =
        err?.code === "auth/user-not-found"  ? "No account found with this email."
        : err?.code === "auth/invalid-email" ? "Invalid email address."
        : "Could not send reset email. Try again.";
      toast.error(msg);
      console.error("[ForgotPassword]", err);
    } finally {
      setLoading(false);
    }
  };

  // ── Forgot Password view ────────────────────────────────────────────────
  if (view === "forgot") {
    return (
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Reset Password</h2>
          <p className="text-gray-500 text-sm mt-1">
            Enter your email and we'll send a reset link.
          </p>
        </div>

        <Input
          label="Email"
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <Button variant="primary" size="lg" onClick={handleForgotPassword} loading={loading}>
          Send Reset Email
        </Button>

        <button
          type="button"
          onClick={() => setView("login")}
          className="w-full text-center text-sm text-green-600 font-semibold hover:underline py-1">
          &#8592; Back to Login
        </button>
      </div>
    );
  }

  // ── Login / Signup view ─────────────────────────────────────────────────
  return (
    <div className="space-y-3">
      <Input
        label="Email"
        type="email"
        inputMode="email"
        autoComplete="email"
        placeholder="you@example.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <div>
        {/* Password field with show/hide toggle */}
        <div className="relative">
          <Input
            label="Password"
            type={showPassword ? "text" : "password"}
            autoComplete={view === "signup" ? "new-password" : "current-password"}
            placeholder={view === "signup" ? "At least 6 characters" : "Your password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-3 top-[38px] text-gray-400 hover:text-gray-600
                       transition-colors focus:outline-none"
            aria-label={showPassword ? "Hide password" : "Show password"}>
            {showPassword
              ? <EyeOff className="w-5 h-5" />
              : <Eye    className="w-5 h-5" />}
          </button>
        </div>

        {/* Forgot Password link — only shown on login view */}
        {view === "login" && (
          <div className="flex justify-end mt-1">
            <button
              type="button"
              onClick={() => setView("forgot")}
              className="text-xs text-green-600 font-medium hover:underline">
              Forgot Password?
            </button>
          </div>
        )}
      </div>

      <Button variant="primary" size="lg" onClick={handleSubmit} loading={loading}>
        {view === "signup" ? "Create Account" : "Login with Email"}
      </Button>

      <p className="text-center text-sm text-gray-500">
        {view === "signup" ? "Already have an account?" : "Don't have an account?"}{" "}
        <button
          type="button"
          onClick={() => setView(view === "signup" ? "login" : "signup")}
          className="text-green-600 font-semibold hover:underline">
          {view === "signup" ? "Login" : "Sign up"}
        </button>
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN LOGIN PAGE
// ─────────────────────────────────────────────────────────────────────────────
export default function LoginPage({ onNeedProfile }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-green-600 to-green-800 flex flex-col">
      {/* Hero */}
      <div className="flex-1 flex flex-col items-center justify-center text-white px-6 pt-16 pb-8">
        <div className="text-7xl mb-4">&#127807;</div>
        <h1 className="text-4xl font-black tracking-tight">FarmLink</h1>
        <p className="text-green-200 mt-2 text-lg font-medium text-center">
          Kisan aur Mazdoor &mdash; Seedha Judav
        </p>
        <p className="text-green-300 text-sm text-center mt-1">
          Farmer &amp; Worker Connection Platform
        </p>
      </div>

      {/* Bottom sheet */}
      <div className="bg-white rounded-t-3xl px-6 pt-8 pb-10">
        {/* Email / Password form */}
        <EmailAuthForm onNeedProfile={onNeedProfile} />

        {/* Divider */}
        <div className="flex items-center gap-3 my-5">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-gray-400 text-xs font-medium">OR</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        {/* Google login */}
        <GoogleLoginButton onNeedProfile={onNeedProfile} />
      </div>
    </div>
  );
}