// src/pages/SetupPage.js
import React, { useEffect, useRef, useState } from "react";
import { User, Users, MapPin, CheckCircle, AlertCircle } from "lucide-react";
import { createUser, createWorkerProfile } from "../firebase/firestore";
import { useAuth } from "../context/AuthContext";
import { Button, Input, Select } from "../components/UI";
import { WORK_TYPES } from "../utils/helpers";
import { Geolocation } from '@capacitor/geolocation';
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
  const [address, setAddress]   = useState(() => localStorage.getItem("lastLocation") || "");
  const [coords, setCoords]     = useState(null);
  const [workType, setWorkType] = useState(WORK_TYPES[0]?.value || "cutting");
  const [wage, setWage]         = useState("");
  const [phone, setPhone]         = useState("");  // NEW: mandatory phone field

  const [locLoading, setLocLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState(null);
  const [submitError, setSubmitError] = useState(null); // shown inline below button
  const [errors, setErrors]         = useState({});
  const isFetchingLocation = useRef(false);

  useEffect(() => {
    if (!notice) return undefined;
    const timer = setTimeout(() => setNotice(null), 2000);
    return () => clearTimeout(timer);
  }, [notice]);

  const showError = (message) => {
    setSubmitError(null);
    setNotice({ type: "error", message });
  };

  const showSuccess = (message) => {
    setSubmitError(null);
    setNotice({ type: "success", message });
  };

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
  const handleLocationClick = async () => {
    if (isFetchingLocation.current) return;

    isFetchingLocation.current = true;
    setLocLoading(true);
    setSubmitError(null);
    let locationPromise = null;
    let applyLocation = () => {};
    try {
      // Step 1: Check permission
      let permission = await Geolocation.checkPermissions();

      if (permission.location !== 'granted') {
        permission = await Geolocation.requestPermissions();

        if (permission.location !== 'granted') {
          showError("Please allow location permission");
          return;
        }
      }

      // Step 2: Check GPS by trying a quick call
      let position;

      try {
        position = await Geolocation.getCurrentPosition({
          enableHighAccuracy: true,
          timeout: 5000
        });
      } catch (err) {
        showError("Please turn ON Location (GPS) and try again");

        return;
      }

      const lat = position.coords.latitude;
      const lng = position.coords.longitude;

      // Continue existing logic with lat/lng
      const c = { lat, lng };
      setCoords(c);
      setAddress("Fetching location...");
      showSuccess("Location detected");

      const apiUrl = `https://nominatim.openstreetmap.org/reverse?lat=${c.lat}&lon=${c.lng}&format=json&addressdetails=1`;
      locationPromise = fetch(apiUrl, { headers: { "Accept-Language": "en" } })
        .then((res) => {
          if (!res.ok) throw new Error("Reverse geocode failed");
          return res.json();
        })
        .then((json) => {
          // Extract structured address parts from the geocoder response.
          // Nominatim uses its own field names; Google Maps API uses different ones.
          // We try both so this works regardless of which geocoder is in use.
          const a = json.address ?? {};

          // Village — priority order per task spec + Nominatim fallbacks
          const village =
            a.sublocality           ||   // Google Maps sublocality
            a.sublocality_level_1   ||   // Google Maps sublocality level 1
            a.neighborhood          ||   // Google Maps neighborhood
            a.village               ||   // Nominatim village
            a.hamlet                ||   // Nominatim hamlet
            a.suburb                ||   // Nominatim suburb
            a.neighbourhood         ||   // Nominatim neighbourhood (British spelling)
            "";

          // City — locality (Google Maps) first, then Nominatim fallbacks
          const city =
            a.locality              ||   // Google Maps locality
            a.city                  ||   // Nominatim city
            a.town                  ||   // Nominatim town
            a.county                ||   // Nominatim county
            a.state_district        ||   // Nominatim state district
            "";

          // State — administrative_area_level_1 (Google Maps) first
          const state =
            a.administrative_area_level_1  ||   // Google Maps
            a.state                        ||   // Nominatim
            "";

          // Pincode — postal_code (Google Maps) first
          const pincode =
            a.postal_code           ||   // Google Maps
            a.postcode              ||   // Nominatim
            "";

          // Build human-readable string for display; fallback to display_name slice
          const parts = [village, city, state, pincode].filter(Boolean);
          const formatted = parts.length >= 2
            ? parts.join(", ")
            : (json.display_name?.split(",").slice(0, 3).join(", ").trim() ?? "");

          return { formatted, village, city, state, pincode };
        });

      applyLocation = ({ formatted, village, city, state, pincode }) => {
        if (!formatted) return;
        setAddress(formatted);
        localStorage.setItem("lastLocation", formatted);

        // Task 2: store structured breakdown alongside coords on the coords object
        // so handleSubmit can persist all fields without changing its call signature
        const updatedCoords = { ...c, village, city, state, pincode };
        setCoords(updatedCoords);
      };

      const timeout = new Promise((_, reject) =>
        setTimeout(() => reject("timeout"), 2000)
      );

      const location = await Promise.race([locationPromise, timeout]);
      applyLocation(location);
    } catch (err) {
      setAddress("Enter manually");
      locationPromise?.then(applyLocation).catch(() => {});
      if (locationPromise) {
        showError("Enter manually");
      } else {
        console.error(err);
        showError("Unable to detect location");
      }
    } finally {
      isFetchingLocation.current = false;
      setLocLoading(false);
    }
  };

  // ── Submit ──────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    setSubmitError(null);
    setNotice(null);
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
      // Task 2: if coords has structured fields (from handleLocationClick), include them
      // so distance calculations and display can use richer data later.
      const locationPayload = coords
        ? {
            lat:     coords.lat,
            lng:     coords.lng,
            address,
            // structured fields — only present when GPS was used; fall back to ""
            village: coords.village  || "",
            city:    coords.city     || "",
            state:   coords.state    || "",
            pincode: coords.pincode  || "",
          }
        : { address };

      await createUser(uid, {
        role,
        name: name.trim(),
        phone: resolvedPhone,
        location: locationPayload,
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

      showSuccess("Profile saved!");
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
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-[system-ui,sans-serif] overflow-x-hidden">
      {/* Header */}
      <div className="px-4 pb-6 pt-5 text-white bg-gradient-to-br from-green-500 to-green-600">
        <div className="mx-auto w-full max-w-md">
        <button
          type="button"
          onClick={onBack}
          disabled={submitting}
          className="mb-3 flex items-center gap-1 text-sm text-white/80 transition-all duration-200 ease-in-out
                     hover:text-white active:scale-[0.98] disabled:opacity-50">
          &#8592; Back
        </button>
        <h1 className="text-2xl font-black">Complete Your Profile</h1>
        <p className="mt-1 text-sm text-white/80">
          {role === "farmer" ? "Farmer Profile" : "Worker Profile"}
        </p>
        </div>
      </div>

      {/* Form */}
      <div className="mt-3 flex-1 overflow-y-auto px-4 py-4 pb-24">
        <div className="mx-auto w-full max-w-md rounded-2xl bg-white p-4 shadow-[0_8px_25px_rgba(0,0,0,0.05)] animate-page-enter">

        {notice && (
          <div className={`safe-fixed-banner rounded-xl px-4 py-3 text-sm font-medium shadow-sm animate-success-banner ${
            notice.type === "error"
              ? "bg-red-50 text-red-700"
              : "bg-green-50 text-green-700"
          }`}>
            {notice.message}
          </div>
        )}

        {/* Inline error banner */}
        {submitError && (
          <div className="mb-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50
                          p-3 text-sm text-red-700">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>{submitError}</span>
          </div>
        )}

        {/* Name */}
        <div className="mb-4">
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
        </div>

        {/* Phone — shown only for Google/Email users; phone-OTP users already verified */}
        {!currentUser?.phoneNumber && (
          <div className="mb-4">
            <label className="mb-1.5 block text-[13px] font-medium text-gray-700">
              Mobile Number <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2">
              <div className="flex h-[50px] flex-shrink-0 select-none items-center rounded-xl bg-gray-100 px-3 text-sm font-semibold text-gray-600">
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
          </div>
        )}

        {/* Location */}
        <div className="mb-4">
          <label className="mb-1.5 block text-[13px] font-medium text-gray-700">
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
              onClick={handleLocationClick}
              disabled={locLoading || submitting}
              title="Detect my location"
              className={`flex h-[50px] w-[50px] flex-shrink-0 items-center justify-center rounded-xl bg-green-100 text-green-600
                         transition-all duration-200 ease-in-out hover:bg-green-200 active:scale-[0.98]
                         disabled:opacity-50 disabled:cursor-not-allowed ${locLoading ? "animate-location-pulse" : ""}`}>
              {locLoading
                ? <span className="app-spinner" />
                : <MapPin className="w-5 h-5" />}
            </button>
          </div>
          {coords ? (
            <p className="mt-1.5 flex items-center gap-1 text-xs text-green-600">
              <CheckCircle className="w-3.5 h-3.5" />
              GPS location saved — not accurate? Edit your village above
            </p>
          ) : (
            <p className="mt-1.5 text-xs text-gray-400">
              Tap &#128205; to auto-detect, or type your village / area manually
            </p>
          )}
        </div>

        {/* Worker-only fields */}
        {role === "worker" && (
          <>
            <div className="mb-4">
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
            </div>

            <div className="mb-4">
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
                <p className="mt-1.5 text-xs text-gray-400">
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
          className="mt-0">
          {submitting ? "Saving…" : "Save & Continue"}
        </Button>

        {/* Debug hint visible only in development */}
        {process.env.NODE_ENV === "development" && (
          <p className="mt-4 text-center text-[10px] text-gray-300">
            uid: {uid || "MISSING"} | role: {role}
          </p>
        )}
        </div>
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
    <div className="min-h-screen overflow-x-hidden bg-gray-50 px-4 py-4 font-[system-ui,sans-serif]">
      <div className="mx-auto flex min-h-[calc(100vh-32px)] w-full max-w-md flex-col justify-center">
        <div className="rounded-2xl bg-white p-4 shadow-[0_8px_25px_rgba(0,0,0,0.05)] animate-page-enter">
          <div className="mb-4 text-center">
            <div className="mb-4 text-5xl">&#128222;</div>
            <h1 className="mb-1 text-2xl font-black text-gray-800">Add Your Phone Number</h1>
            <p className="mx-auto max-w-xs text-sm text-gray-500">
              Your account needs a mobile number so farmers and workers can contact you.
            </p>
          </div>

          <div className="mb-4">
            <label className="mb-1.5 block text-[13px] font-medium text-gray-700">
              Mobile Number <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2">
              <div className="flex h-[50px] flex-shrink-0 select-none items-center rounded-xl bg-gray-100 px-3 text-sm font-semibold text-gray-600">
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
          </div>

          <Button variant="primary" size="lg" onClick={handleSave} loading={saving}>
            Save &amp; Continue
          </Button>
        </div>
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
