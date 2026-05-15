import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext";
import { useApp, UserProfile } from "../context/AppContext";
import { useLiveLocation } from "../hooks/useLiveLocation";
import { formatVillagePin } from "../utils/location";
import { MapPin, Check, IndianRupee, ShieldAlert, Loader } from "lucide-react";

export const RegistrationPage: React.FC = () => {
  const { t } = useLanguage();
  const { user, completeUserProfile } = useApp();
  const navigate = useNavigate();

  // Redirect if profile already completed
  useEffect(() => {
    if (user && user.profileCompleted) {
      navigate(user.role === "farmer" ? "/farmer-dashboard" : "/worker-dashboard");
    }
  }, [user, navigate]);

  const [fullName, setFullName] = useState("");
  const [mobileNum, setMobileNum] = useState("");
  const [villagePin, setVillagePin] = useState("");
  const {
    location: gpsData,
    status: locatingStatus,
    error: gpsError,
    isDetecting,
    refreshLocation,
    clearError,
  } = useLiveLocation();

  // Worker-specific fields
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [wageExpectation, setWageExpectation] = useState<number>(450);
  const [experience, setExperience] = useState<string>("Experienced (3-5 years)");
  const [availability, setAvailability] = useState<UserProfile["availability"]>("Available Today");
  const [profilePhoto, setProfilePhoto] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const skillsList = [
    { key: "Wheat Cutting", label: t("wheatCutting"), emoji: "🌾" },
    { key: "Rice Planting", label: t("ricePlanting"), emoji: "🌱" },
    { key: "Harvesting", label: t("harvesting"), emoji: "🚜" },
    { key: "Tractor Driving", label: t("tractorDriving"), emoji: "🚜" },
    { key: "Pesticide Spraying", label: t("pesticideSpraying"), emoji: "🧪" },
    { key: "Irrigation Work", label: t("irrigationWork"), emoji: "💧" },
  ];

  const handleToggleSkill = (skill: string) => {
    if (selectedSkills.includes(skill)) {
      setSelectedSkills(selectedSkills.filter(s => s !== skill));
    } else {
      setSelectedSkills([...selectedSkills, skill]);
    }
  };

  const handleAcquireGPS = async () => {
    try {
      clearError();
      const location = await refreshLocation();
      setVillagePin(formatVillagePin(location));
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!fullName || !mobileNum) {
      setError("Please fill in your name and active mobile number.");
      return;
    }

    if (mobileNum.length !== 10 || isNaN(Number(mobileNum))) {
      setError("Please enter a valid 10-digit Indian mobile number.");
      return;
    }

    if (!villagePin) {
      setError("Please specify your Village/PIN code.");
      return;
    }

    if (user?.role === "worker" && selectedSkills.length === 0) {
      setError("Please select at least one agricultural skill.");
      return;
    }

    setSubmitting(true);

    try {
      // Assemble profiles
      const submissionData: Partial<UserProfile> = {
        fullName,
        mobileNum,
        village: gpsData?.village || villagePin.split("(")[0].trim(),
        district: gpsData?.district || "Local Region",
        state: gpsData?.state || "Haryana",
        pincode: gpsData?.pincode || villagePin.match(/\d+/)?.[0] || "123401",
        latitude: gpsData?.latitude || 28.2044,
        longitude: gpsData?.longitude || 76.6155,
      };

      if (user?.role === "worker") {
        submissionData.skills = selectedSkills;
        submissionData.wageExpectation = Number(wageExpectation);
        submissionData.experience = experience;
        submissionData.availability = availability;
        submissionData.profilePhoto = profilePhoto.trim() || undefined;
        submissionData.photoURL = submissionData.profilePhoto;
      } else {
        // Farmer initial parameters
        submissionData.isPremium = false;
        submissionData.savedWorkers = [];
      }

      await completeUserProfile(submissionData);
      
      // Navigate to respective dashboard
      navigate(user?.role === "farmer" ? "/farmer-dashboard" : "/worker-dashboard");
    } catch (err: any) {
      setError(err.message || "Failed to update profile. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-slate-50 py-12 dark:bg-slate-950 transition-colors duration-300">
      <div className="mx-auto max-w-3xl px-4">
        
        {/* Onboarding Box */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 shadow-xl space-y-8">
          
          {/* Header */}
          <div className="text-center space-y-2">
            <span className="text-3xl">🌾</span>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              {t("fillProfile")} ({user.role === "farmer" ? t("farmer") : t("worker")})
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Only fields necessary to connect you directly. No complex paperwork.
            </p>
          </div>

          {/* Form Error */}
          {error && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 dark:border-rose-900/30 dark:bg-rose-950/20 text-xs text-rose-800 dark:text-rose-400 flex items-center space-x-2">
              <ShieldAlert className="h-5 w-5 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Onboarding fields */}
          <form onSubmit={handleFormSubmit} className="space-y-6">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Full Name */}
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  {t("fullName")}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Ramesh Kumar"
                    className="block w-full rounded-2xl border border-slate-200 py-3.5 px-4 text-sm bg-white dark:border-slate-800 dark:bg-slate-950 text-slate-900 dark:text-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Mobile Number */}
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  {t("mobileNum")}
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 text-sm font-bold border-r border-slate-100 pr-2 dark:border-slate-800">
                    +91
                  </div>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    value={mobileNum}
                    onChange={(e) => setMobileNum(e.target.value)}
                    placeholder="Enter 10 digit number"
                    className="block w-full rounded-2xl border border-slate-200 py-3.5 pl-14 pr-4 text-sm bg-white dark:border-slate-800 dark:bg-slate-950 text-slate-900 dark:text-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

            </div>

            {/* Location Module */}
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50/20 p-6 dark:border-emerald-900/30 dark:bg-emerald-950/10 space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Village & Location Verification</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    For direct matching, FarmLink requires accurate village-level GPS.
                  </p>
                </div>
                
                  <button
                  type="button"
                  onClick={handleAcquireGPS}
                  disabled={isDetecting}
                  className="rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-emerald-700 transition flex items-center justify-center space-x-1.5 cursor-pointer shrink-0"
                >
                  <span>{isDetecting ? t("detectingGPS") : t("detectGPS")}</span>
                </button>
              </div>

              {/* Locator Progress Logs */}
              {locatingStatus && (
                <div className="flex items-center space-x-2 text-xs text-emerald-800 dark:text-emerald-400 font-medium">
                  <Loader className="h-4 w-4 animate-spin shrink-0" />
                  <span>{locatingStatus}</span>
                </div>
              )}

              {gpsError && (
                <div className="text-xs text-rose-600 dark:text-rose-400 font-medium flex items-center space-x-1">
                  <span>⚠️ {gpsError}</span>
                </div>
              )}

              {/* Coordinates display */}
              {gpsData && (
                <div className="grid grid-cols-2 gap-4 rounded-xl bg-white dark:bg-slate-950 p-4 border border-slate-100 dark:border-slate-800 text-xs">
                  <div>
                    <span className="text-slate-400 block font-medium">Village / PIN</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{gpsData.village} ({gpsData.pincode})</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-medium">District & State</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{gpsData.district}, {gpsData.state}</span>
                  </div>
                  <div className="col-span-2 pt-2 border-t border-slate-50 dark:border-slate-900 flex justify-between items-center text-[10px] text-slate-400">
                    <span>GPS: {gpsData.latitude.toFixed(5)}, {gpsData.longitude.toFixed(5)}</span>
                    <span className="text-emerald-600 font-bold">Accuracy: ±{gpsData.accuracy.toFixed(1)}m</span>
                  </div>
                </div>
              )}

              {/* Manual/Fallback field */}
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  {t("villagePin")}
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <MapPin className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    type="text"
                    required
                    value={villagePin}
                    onChange={(e) => setVillagePin(e.target.value)}
                    placeholder={t("villagePinPlaceholder")}
                    className="block w-full rounded-2xl border border-slate-200 py-3.5 pl-10 pr-4 text-sm bg-white dark:border-slate-800 dark:bg-slate-950 text-slate-900 dark:text-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Worker-Specific Onboarding sections */}
            {user.role === "worker" && (
              <div className="space-y-6 pt-4 border-t border-slate-100 dark:border-slate-800">
                
                {/* Skills Grid */}
                <div className="space-y-3">
                  <div className="space-y-0.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                      {t("skills")}
                    </label>
                    <p className="text-xs text-slate-400">{t("skillsDesc")}</p>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {skillsList.map((skill) => {
                      const selected = selectedSkills.includes(skill.key);
                      return (
                        <button
                          key={skill.key}
                          type="button"
                          onClick={() => handleToggleSkill(skill.key)}
                          className={`flex items-center space-x-2.5 rounded-2xl border p-3.5 text-left text-xs font-bold transition-all cursor-pointer ${
                            selected
                              ? "border-emerald-500 bg-emerald-50/50 text-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-300 shadow-sm"
                              : "border-slate-100 bg-slate-50/50 hover:border-slate-200 text-slate-700 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300"
                          }`}
                        >
                          <span className="text-lg">{skill.emoji}</span>
                          <span className="flex-1 truncate">{skill.label}</span>
                          {selected && (
                            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-600 text-white">
                              <Check className="h-2.5 w-2.5" />
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Wage expectation & experience */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Wage expect */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                      {t("wageExpectation")}
                    </label>
                    <div className="relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <IndianRupee className="h-4 w-4 text-slate-400" />
                      </div>
                      <input
                        type="number"
                        min={100}
                        max={5000}
                        required
                        value={wageExpectation}
                        onChange={(e) => setWageExpectation(Number(e.target.value))}
                        className="block w-full rounded-2xl border border-slate-200 py-3.5 pl-10 pr-4 text-sm bg-white dark:border-slate-800 dark:bg-slate-950 text-slate-900 dark:text-white focus:border-emerald-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Experience */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                      {t("experienceLevel")}
                    </label>
                    <select
                      value={experience}
                      onChange={(e) => setExperience(e.target.value)}
                      className="block w-full rounded-2xl border border-slate-200 py-3.5 px-4 text-sm bg-white dark:border-slate-800 dark:bg-slate-950 text-slate-900 dark:text-white focus:border-emerald-500 focus:outline-none"
                    >
                      <option value="Beginner (1-2 years)">{t("beginner")}</option>
                      <option value="Experienced (3-5 years)">{t("intermediate")}</option>
                      <option value="Expert (5+ years)">{t("expert")}</option>
                    </select>
                  </div>

                </div>

                {/* Availability status */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Availability */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                      {t("availability")}
                    </label>
                    <select
                      value={availability}
                      onChange={(e) => setAvailability(e.target.value as any)}
                      className="block w-full rounded-2xl border border-slate-200 py-3.5 px-4 text-sm bg-white dark:border-slate-800 dark:bg-slate-950 text-slate-900 dark:text-white focus:border-emerald-500 focus:outline-none"
                    >
                      <option value="Available Today">{t("availableToday")}</option>
                      <option value="Busy / Booked">{t("busy")}</option>
                      <option value="Available This Week">{t("availableThisWeek")}</option>
                    </select>
                  </div>

                  {/* Optional Profile Photo URL */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                      {t("profilePhoto")}
                    </label>
                    <input
                      type="url"
                      value={profilePhoto}
                      onChange={(e) => setProfilePhoto(e.target.value)}
                      placeholder="e.g. https://unsplash.com/your-photo"
                      className="block w-full rounded-2xl border border-slate-200 py-3.5 px-4 text-sm bg-white dark:border-slate-800 dark:bg-slate-950 text-slate-900 dark:text-white focus:border-emerald-500 focus:outline-none"
                    />
                  </div>

                </div>

              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting}
              className="flex w-full items-center justify-center rounded-2xl bg-gradient-to-r from-emerald-600 to-green-600 py-4 text-sm font-bold text-white shadow-md shadow-emerald-500/10 hover:from-emerald-500 hover:to-green-500 focus:outline-none disabled:opacity-50 cursor-pointer"
            >
              {submitting ? (
                <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
              ) : (
                t("finishReg")
              )}
            </button>

          </form>

        </div>

      </div>
    </div>
  );
};
export default RegistrationPage;
