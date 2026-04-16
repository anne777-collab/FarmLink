// src/pages/LoginPage.js
import React, { useState, useRef, useEffect, useCallback } from "react";
import { RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";
import { auth } from "../firebase/config";
import { getUser, createUser } from "../firebase/firestore";
import { useAuth } from "../context/AuthContext";
import { Button, Input } from "../components/UI";
import toast from "react-hot-toast";

// ─────────────────────────────────────────────────────────────────────────────
// PHONE OTP LOGIN (unchanged)
// ─────────────────────────────────────────────────────────────────────────────
function PhoneOtpLogin({ onNeedProfile }) {
  const [step, setStep] = useState("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [confirmResult, setConfirmResult] = useState(null);

  const otpRefs = useRef([]);
  const recaptchaVerifierRef = useRef(null);
  const { refreshProfile } = useAuth();

  const clearRecaptcha = useCallback(() => {
    try { if (recaptchaVerifierRef.current) recaptchaVerifierRef.current.clear(); }
    catch (_) {}
    finally { recaptchaVerifierRef.current = null; }
  }, []);

  const initRecaptcha = useCallback(() => {
    clearRecaptcha();
    if (!document.getElementById("recaptcha-container"))
      throw new Error("[FarmLink] #recaptcha-container not found");
    recaptchaVerifierRef.current = new RecaptchaVerifier(auth, "recaptcha-container", {
      size: "invisible",
      callback: () => {},
      "expired-callback": () => clearRecaptcha(),
    });
    return recaptchaVerifierRef.current;
  }, [clearRecaptcha]);

  useEffect(() => () => clearRecaptcha(), [clearRecaptcha]);

  const sendOTP = async () => {
    const cleaned = phone.replace(/\D/g, "");
    if (cleaned.length < 10) { toast.error("Enter a valid 10-digit phone number"); return; }
    setLoading(true);
    try {
      const verifier = initRecaptcha();
      const formatted = cleaned.startsWith("91") ? `+${cleaned}` : `+91${cleaned}`;
      const result = await signInWithPhoneNumber(auth, formatted, verifier);
      setConfirmResult(result);
      setStep("otp");
      toast.success("OTP sent!");
    } catch (err) {
      clearRecaptcha();
      const msg = err?.code === "auth/invalid-phone-number" ? "Invalid phone number."
        : err?.code === "auth/too-many-requests" ? "Too many attempts. Try later."
        : err?.message || "Failed to send OTP.";
      toast.error(msg);
    } finally { setLoading(false); }
  };

  const verifyOTP = async () => {
    const code = otp.join("");
    if (code.length < 6) { toast.error("Enter 6-digit OTP"); return; }
    if (!confirmResult) { toast.error("Session expired. Resend OTP."); goBackToPhone(); return; }
    setLoading(true);
    try {
      const result = await confirmResult.confirm(code);
      clearRecaptcha();
      const profile = await getUser(result.user.uid);
      await refreshProfile();
      if (!profile) onNeedProfile(result.user.uid);
      toast.success("Login successful!");
    } catch (err) {
      const msg = err?.code === "auth/invalid-verification-code" ? "Wrong OTP. Try again."
        : err?.code === "auth/code-expired" ? "OTP expired. Request a new one."
        : "Verification failed.";
      toast.error(msg);
    } finally { setLoading(false); }
  };

  const handleOtpChange = (value, idx) => {
    const v = value.replace(/\D/g, "").slice(-1);
    const next = [...otp]; next[idx] = v; setOtp(next);
    if (v && idx < 5) otpRefs.current[idx + 1]?.focus();
    if (!v && idx > 0) otpRefs.current[idx - 1]?.focus();
  };

  const handleOtpKeyDown = (e, idx) => {
    if (e.key === "Backspace" && !otp[idx] && idx > 0) otpRefs.current[idx - 1]?.focus();
  };

  const goBackToPhone = () => {
    clearRecaptcha(); setConfirmResult(null);
    setOtp(["", "", "", "", "", ""]); setStep("phone");
  };

  return (
    <>
      {step === "phone" ? (
        <>
          <h2 className="text-2xl font-bold text-gray-800 mb-1">Login / Sign In</h2>
          <p className="text-gray-500 text-sm mb-6">Enter your mobile number to continue</p>
          <div className="flex gap-2 mb-5">
            <div className="bg-gray-100 rounded-xl px-3 py-3 text-gray-600 font-semibold text-base
                            flex items-center select-none">+91</div>
            <Input
              placeholder="10-digit mobile number"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
              maxLength={10} type="tel" inputMode="numeric" autoComplete="tel-national"
            />
          </div>
          <Button variant="primary" size="lg" onClick={sendOTP} loading={loading}>
            Send OTP / OTP Bhejein
          </Button>
        </>
      ) : (
        <>
          <h2 className="text-2xl font-bold text-gray-800 mb-1">Enter OTP</h2>
          <p className="text-gray-500 text-sm mb-6">Sent to +91 {phone.replace(/\D/g,"").slice(-10)}</p>
          <div className="flex gap-2 justify-between mb-6">
            {otp.map((digit, i) => (
              <input key={i}
                ref={(el) => (otpRefs.current[i] = el)}
                value={digit}
                onChange={(e) => handleOtpChange(e.target.value, i)}
                onKeyDown={(e) => handleOtpKeyDown(e, i)}
                maxLength={1} type="tel" inputMode="numeric" autoComplete="one-time-code"
                className="w-12 h-14 text-center text-2xl font-bold border-2 rounded-xl
                           outline-none transition-all focus:border-green-500 bg-gray-50 caret-transparent"
              />
            ))}
          </div>
          <Button variant="primary" size="lg" onClick={verifyOTP} loading={loading}>
            Verify OTP
          </Button>
          <button type="button" onClick={goBackToPhone}
            className="w-full mt-3 text-center text-green-600 text-sm font-medium py-2">
            Change number
          </button>
        </>
      )}
      <div id="recaptcha-container" />
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// GOOGLE LOGIN BUTTON
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
      if (!profile) {
        // New Google user — create a basic users doc with email, then go to setup
        onNeedProfile(user.uid);
      }
      // Existing user: AppRouter will re-route automatically via onAuthStateChanged
    } catch (err) {
      if (err?.code === "auth/popup-closed-by-user") return; // silent — user closed popup
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
        /* Google G logo — inline SVG, no external deps */
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
// EMAIL LOGIN / SIGNUP
// ─────────────────────────────────────────────────────────────────────────────
function EmailAuthForm({ onNeedProfile }) {
  const { signUpWithEmail, signInWithEmail, refreshProfile } = useAuth();
  const [mode,     setMode]     = useState("login"); // "login" | "signup"
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [loading,  setLoading]  = useState(false);

  const handleSubmit = async () => {
    if (!email.trim())    { toast.error("Enter your email");    return; }
    if (password.length < 6) { toast.error("Password must be at least 6 characters"); return; }
    setLoading(true);
    try {
      if (mode === "signup") {
        const user = await signUpWithEmail(email, password);
        const profile = await getUser(user.uid);
        await refreshProfile();
        if (!profile) onNeedProfile(user.uid);
        toast.success("Account created!");
      } else {
        await signInWithEmail(email, password);
        await refreshProfile();
        toast.success("Login successful!");
      }
    } catch (err) {
      const msg = err?.code === "auth/email-already-in-use" ? "Email already registered."
        : err?.code === "auth/user-not-found"    ? "No account found with this email."
        : err?.code === "auth/wrong-password"    ? "Incorrect password."
        : err?.code === "auth/invalid-email"     ? "Invalid email address."
        : "Authentication failed. Try again.";
      toast.error(msg);
      console.error("[EmailAuthForm]", err);
    } finally {
      setLoading(false);
    }
  };

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
      <Input
        label="Password"
        type="password"
        autoComplete={mode === "signup" ? "new-password" : "current-password"}
        placeholder={mode === "signup" ? "At least 6 characters" : "Your password"}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <Button variant="primary" size="lg" onClick={handleSubmit} loading={loading}>
        {mode === "signup" ? "Create Account" : "Login with Email"}
      </Button>
      <p className="text-center text-sm text-gray-500">
        {mode === "signup" ? "Already have an account?" : "Don't have an account?"}{" "}
        <button type="button"
          onClick={() => setMode(mode === "signup" ? "login" : "signup")}
          className="text-green-600 font-semibold hover:underline">
          {mode === "signup" ? "Login" : "Sign up"}
        </button>
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN LOGIN PAGE
// ─────────────────────────────────────────────────────────────────────────────
export default function LoginPage({ onNeedProfile }) {
  // "phone" | "email" — which login method is shown
  const [method, setMethod] = useState("phone");

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
      <div className="bg-white rounded-t-3xl px-6 pt-6 pb-10">
        {/* Method tabs */}
        <div className="flex bg-gray-100 rounded-xl p-1 mb-6">
          {[
            { id: "phone", label: "&#128222; Phone" },
            { id: "email", label: "&#128140; Email" },
          ].map(({ id, label }) => (
            <button key={id} type="button" onClick={() => setMethod(id)}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all
                ${method === id
                  ? "bg-white shadow text-green-700"
                  : "text-gray-500 hover:text-gray-700"}`}
              dangerouslySetInnerHTML={{ __html: label }}
            />
          ))}
        </div>

        {/* Login form */}
        {method === "phone" ? (
          <PhoneOtpLogin onNeedProfile={onNeedProfile} />
        ) : (
          <EmailAuthForm onNeedProfile={onNeedProfile} />
        )}

        {/* Divider */}
        <div className="flex items-center gap-3 my-5">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-gray-400 text-xs font-medium">OR</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        {/* Google login — always visible regardless of method */}
        <GoogleLoginButton onNeedProfile={onNeedProfile} />
      </div>
    </div>
  );
}