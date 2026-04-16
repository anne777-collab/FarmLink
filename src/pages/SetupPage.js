// src/pages/SetupPage.js
import React, { useState } from "react";
import { User, Users, MapPin, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { createUser, createWorkerProfile } from "../firebase/firestore";
import { useAuth } from "../context/AuthContext";
import { Button, Input, Select } from "../components/UI";
import { WORK_TYPES, getLocation } from "../utils/helpers";
import toast from "react-hot-toast";

// ─── Friendly error messages for known Firebase error codes ───────────────────
const friendlyError = (err) => {
  const code = err?.code || "";
  if (code === "permission-denied")
    return "Permission denied. Check your Firestore security rules.";
  if (code === "unavailable" || code === "failed-precondition")
    return "No internet connection. Please check your network and try again.";
  if (code === "not-found")
    return "Database not found. Ensure Firestore is enabled in Firebase Console.";
  if (err?.message?.includes("timed out"))
    return err.message; // already friendly from withTimeout
  if (process.env.NODE_ENV === "development")
    return err?.message || "Unknown error";
  return "Could not save profile. Please try again.";
};

// ─── Step 1: Role picker ──────────────────────────────────────────────────────
function RolePicker({ onSelect }) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-6">
      <div className="text-5xl mb-4">&#127807;</div>
      <h1 className="text-3xl font-black text-gray-800 mb-2">You are a…</h1>
      <p className="text-gray-500 text-sm mb-8 text-center">
        Select your role to continue
      </p>

      <div className="w-full max-w-sm space-y-4">
        <button
          type="button"
          onClick={() => onSelect("farmer")}
          className="w-full bg-white border-2 border-green-200 hover:border-green-500
                     rounded-2xl p-6 flex items-center gap-4 transition-all
                     hover:shadow-md active:scale-95">
          <div className="w-14 h-14 bg-green-100 rounded-2xl flex items-center justify-center flex-shrink-0">
            <User className="w-8 h-8 text-green-600" />
          </div>
          <div className="text-left">
            <p className="font-bold text-gray-800 text-lg">Farmer</p>
            <p className="text-gray-500 text-sm">Find workers for your farm</p>
          </div>
        </button>

        <button
          type="button"
          onClick={() => onSelect("worker")}
          className="w-full bg-white border-2 border-blue-200 hover:border-blue-500
                     rounded-2xl p-6 flex items-center gap-4 transition-all
                     hover:shadow-md active:scale-95">
          <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center flex-shrink-0">
            <Users className="w-8 h-8 text-blue-600" />
          </div>
          <div className="text-left">
            <p className="font-bold text-gray-800 text-lg">Worker</p>
            <p className="text-gray-500 text-sm">Find farm work near you</p>
          </div>
        </button>
      </div>
    </div>
  );
}

// ─── Step 2: Profile details form ────────────────────────────────────────────
function ProfileForm({ role, uid, onBack }) {
  const { refreshProfile, currentUser } = useAuth();

  const [name, setName]         = useState("");
  const [address, setAddress]   = useState("");
  const [coords, setCoords]     = useState(null);
  const [workType, setWorkType] = useState(WORK_TYPES[0]?.value || "cutting");
  const [wage, setWage]         = useState("");
  const [phone, setPhone]         = useState("");  // NEW: mandatory phone field

  const [locLoading, setLocLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null); // shown inline below button
  const [errors, setErrors]         = useState({});

  // ── Validation ──────────────────────────────────────────────────────────────
  const validate = () => {
    const e = {};
    if (!name.trim()) e.name = "Name is required";

    // Phone is mandatory for Google/Email users (phone users already have it)
    const hasFirebasePhone = !!(currentUser?.phoneNumber);
    if (!hasFirebasePhone) {
      const cleaned = phone.replace(/\D/g, "");
      if (!phone.trim()) {
        e.phone = "Phone number is required";
      } else if (cleaned.length < 10) {
        e.phone = "Enter a valid 10-digit number";
      }
    }

    if (role === "worker") {
      if (!workType) e.workType = "Select a work type";
      const w = Number(wage);
      if (!wage || isNaN(w) || w <= 0)
        e.wage = "Enter a valid daily wage (e.g. 400)";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // ── GPS detect ──────────────────────────────────────────────────────────────
  const detectLocation = async () => {
    setLocLoading(true);
    try {
      const c = await getLocation();
      setCoords(c);
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${c.lat}&lon=${c.lng}&format=json`,
        { headers: { "Accept-Language": "en" } }
      );
      if (!res.ok) throw new Error("Reverse geocode failed");
      const json = await res.json();
      const parts = json.display_name?.split(",") ?? [];
      setAddress(parts.slice(0, 3).join(", ").trim());
      toast.success("Location detected!");
    } catch {
      toast.error("Could not detect location. Please enter manually.");
    } finally {
      setLocLoading(false);
    }
  };

  // ── Submit ──────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    setSubmitError(null);
    if (!validate()) return;

    // Guard: uid must exist before we attempt any Firestore write
    if (!uid) {
      const msg = "User session not found. Please log in again.";
      setSubmitError(msg);
      toast.error(msg);
      return;
    }

    setSubmitting(true);
    try {
      // For phone-OTP users, take the verified number; for Google/Email users use the form input
      const resolvedPhone = currentUser?.phoneNumber
        ? currentUser.phoneNumber
        : "+91" + phone.replace(/\D/g, "").slice(-10);

      // ── Write 1: users collection ──────────────────────────────────────────
      await createUser(uid, {
        role,
        name: name.trim(),
        phone: resolvedPhone,
        location: coords
          ? { lat: coords.lat, lng: coords.lng, address }
          : { address },
      });

      // ── Write 2: workers collection (worker role only) ─────────────────────
      if (role === "worker") {
        await createWorkerProfile(uid, {
          workType,
          wage: Number(wage),
          availability: true,
        });
      }

      // ── Write 3: refresh context so router moves to dashboard ──────────────
      // refreshProfile() fetches the newly created users doc and sets
      // userProfile in AuthContext, triggering a re-render in AppRouter.
      await refreshProfile();

      toast.success("Profile created! Welcome to FarmLink");
      // No need to navigate — AuthContext update triggers AppRouter to re-route
    } catch (err) {
      const msg = friendlyError(err);
      setSubmitError(msg);
      toast.error(msg);
      console.error("[SetupPage] handleSubmit failed:", err);
    } finally {
      // ⚠️  This MUST run even if refreshProfile() throws — otherwise the
      //     button stays in loading state permanently.
      setSubmitting(false);
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  const accentColor = role === "farmer" ? "bg-green-600" : "bg-blue-600";

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className={`px-6 py-8 text-white ${accentColor}`}>
        <button
          type="button"
          onClick={onBack}
          disabled={submitting}
          className="text-white/70 text-sm mb-3 flex items-center gap-1
                     hover:text-white transition-colors disabled:opacity-50">
          &#8592; Back
        </button>
        <h1 className="text-2xl font-black">Complete Your Profile</h1>
        <p className="text-white/70 text-sm mt-1">
          {role === "farmer" ? "Farmer Profile" : "Worker Profile"}
        </p>
      </div>

      {/* Form */}
      <div className="flex-1 px-5 py-6 space-y-5 overflow-y-auto pb-28">

        {/* Inline error banner */}
        {submitError && (
          <div className="flex items-start gap-2 bg-red-50 border border-red-200
                          rounded-xl p-3 text-sm text-red-700">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>{submitError}</span>
          </div>
        )}

        {/* Name */}
        <Input
          label="Full Name"
          placeholder="Your full name"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (errors.name) setErrors((p) => ({ ...p, name: undefined }));
          }}
          error={errors.name}
        />

        {/* Phone — shown only for Google/Email users; phone-OTP users already verified */}
        {!currentUser?.phoneNumber && (
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">
              Mobile Number <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2">
              <div className="bg-gray-100 rounded-xl px-3 py-3 text-gray-600 font-semibold text-sm flex items-center flex-shrink-0 select-none">
                +91
              </div>
              <Input
                placeholder="10-digit mobile number"
                type="tel"
                inputMode="numeric"
                maxLength={10}
                value={phone}
                error={errors.phone}
                onChange={(e) => {
                  setPhone(e.target.value.replace(/\D/g, "").slice(0, 10));
                  if (errors.phone) setErrors((p) => ({ ...p, phone: undefined }));
                }}
              />
            </div>
            {errors.phone && (
              <p className="text-xs text-red-500 mt-1">{errors.phone}</p>
            )}
          </div>
        )}

        {/* Location */}
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1">
            Location
          </label>
          <div className="flex gap-2">
            <Input
              placeholder="Village, District, State"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
            <button
              type="button"
              onClick={detectLocation}
              disabled={locLoading || submitting}
              title="Detect my location"
              className="px-3 py-3 bg-green-100 text-green-600 rounded-xl flex-shrink-0
                         hover:bg-green-200 active:scale-95 transition-all
                         disabled:opacity-50 disabled:cursor-not-allowed">
              {locLoading
                ? <Loader2 className="w-5 h-5 animate-spin" />
                : <MapPin className="w-5 h-5" />}
            </button>
          </div>
          {coords && (
            <p className="flex items-center gap-1 text-xs text-green-600 mt-1.5">
              <CheckCircle className="w-3.5 h-3.5" />
              GPS location saved
            </p>
          )}
        </div>

        {/* Worker-only fields */}
        {role === "worker" && (
          <>
            <Select
              label="Work Type"
              options={WORK_TYPES}
              value={workType}
              onChange={(e) => {
                setWorkType(e.target.value);
                if (errors.workType)
                  setErrors((p) => ({ ...p, workType: undefined }));
              }}
              error={errors.workType}
            />

            <div>
              <Input
                label="Expected Wage per day (Rs.)"
                type="number"
                inputMode="numeric"
                placeholder="e.g. 400"
                value={wage}
                onChange={(e) => {
                  setWage(e.target.value);
                  if (errors.wage)
                    setErrors((p) => ({ ...p, wage: undefined }));
                }}
                error={errors.wage}
              />
              {wage && Number(wage) > 0 && (
                <p className="text-xs text-gray-400 mt-1">
                  Approx. Rs.&nbsp;
                  {(Number(wage) * 26).toLocaleString("en-IN")} per month
                </p>
              )}
            </div>
          </>
        )}

        <Button
          variant="primary"
          size="lg"
          onClick={handleSubmit}
          loading={submitting}
          disabled={submitting}
          className="mt-4">
          {submitting ? "Saving…" : "Save & Continue"}
        </Button>

        {/* Debug hint visible only in development */}
        {process.env.NODE_ENV === "development" && (
          <p className="text-[10px] text-gray-300 text-center">
            uid: {uid || "MISSING"} | role: {role}
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Phone-only form for existing users missing a phone number ───────────────
function PhoneOnlyForm({ uid }) {
  const { refreshProfile, currentUser } = useAuth();
  const [phone, setPhone]       = useState("");
  const [error, setError]       = useState("");
  const [saving, setSaving]     = useState(false);

  const handleSave = async () => {
    const cleaned = phone.replace(/\D/g, "");
    if (!phone.trim() || cleaned.length < 10) {
      setError("Enter a valid 10-digit mobile number");
      return;
    }
    setSaving(true);
    try {
      const { updateUser } = await import("../firebase/firestore");
      await updateUser(uid, { phone: "+91" + cleaned.slice(-10) });
      await refreshProfile();
      // refreshProfile re-routes AppRouter away from this screen
    } catch (err) {
      setError(friendlyError(err));
      console.error("[PhoneOnlyForm]", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-6">
      <div className="text-5xl mb-4">&#128222;</div>
      <h1 className="text-2xl font-black text-gray-800 mb-1 text-center">Add Your Phone Number</h1>
      <p className="text-gray-500 text-sm mb-8 text-center max-w-xs">
        Your account needs a mobile number so farmers and workers can contact you.
      </p>

      <div className="w-full max-w-sm space-y-4">
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1">
            Mobile Number <span className="text-red-500">*</span>
          </label>
          <div className="flex gap-2">
            <div className="bg-gray-100 rounded-xl px-3 py-3 text-gray-600 font-semibold
                            text-sm flex items-center flex-shrink-0 select-none">
              +91
            </div>
            <Input
              placeholder="10-digit mobile number"
              type="tel"
              inputMode="numeric"
              maxLength={10}
              value={phone}
              error={error}
              onChange={(e) => {
                setPhone(e.target.value.replace(/\D/g, "").slice(0, 10));
                if (error) setError("");
              }}
            />
          </div>
          {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
        </div>
        <Button variant="primary" size="lg" onClick={handleSave} loading={saving}>
          Save &amp; Continue
        </Button>
      </div>
    </div>
  );
}

// ─── Main export ─────────────────────────────────────────────────────────────
export default function SetupPage({ uid, requirePhoneOnly = false }) {
  const [role, setRole] = useState(null);

  // Phone-only mode: existing user just needs to add phone
  if (requirePhoneOnly) {
    return <PhoneOnlyForm uid={uid} />;
  }

  if (!role) {
    return <RolePicker onSelect={setRole} />;
  }

  return (
    <ProfileForm
      role={role}
      uid={uid}
      onBack={() => setRole(null)}
    />
  );
}