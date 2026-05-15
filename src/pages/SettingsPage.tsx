import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext";
import { useApp } from "../context/AppContext";
import { Toast } from "../components/Toast";
import { ArrowLeft, User, RefreshCw } from "lucide-react";

export const SettingsPage: React.FC = () => {
  const { t } = useLanguage();
  const { user, completeUserProfile, refreshUserLocation, logout } = useApp();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState(user?.fullName || "");
  const [mobileNum, setMobileNum] = useState(user?.mobileNum || "");
  const [village, setVillage] = useState(user?.village || "");
  
  const [updating, setUpdating] = useState(false);
  const [refreshingGPS, setRefreshingGPS] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);

  if (!user) return null;

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdating(true);
    try {
      await completeUserProfile({
        fullName,
        mobileNum,
        village,
      });
      setToast({
        message: "Profile settings updated successfully!",
        type: "success"
      });
    } catch (err: any) {
      setToast({
        message: err.message || "Failed to update profile",
        type: "error"
      });
    } finally {
      setUpdating(false);
    }
  };

  const handleRefreshGPS = async () => {
    setRefreshingGPS(true);
    try {
      const loc = await refreshUserLocation();
      setVillage(loc.village);
      setToast({
        message: "Location Updated Successfully",
        type: "success"
      });
    } catch (err) {
      setToast({
        message: "Failed to acquire highly accurate GPS. Please allow device permissions.",
        type: "error"
      });
    } finally {
      setRefreshingGPS(false);
    }
  };

  const handleSignOut = async () => {
    await logout();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12 dark:bg-slate-950 transition-colors duration-300">
      <div className="mx-auto max-w-2xl px-4 space-y-6">
        
        {/* Navigation */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center space-x-1 text-xs font-bold text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back</span>
        </button>

        {/* Card Box */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-xl space-y-8">
          
          <div className="border-b border-slate-100 dark:border-slate-800/80 pb-4 flex justify-between items-center">
            <div className="space-y-1">
              <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center space-x-2">
                <User className="h-6 w-6 text-emerald-600" />
                <span>{t("settings")} / Profile</span>
              </h1>
              <p className="text-xs text-slate-400">Manage direct communication settings</p>
            </div>
            
            <button
              onClick={handleSignOut}
              className="rounded-xl bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-600 hover:bg-rose-100 dark:bg-rose-950/20 dark:text-rose-400 cursor-pointer"
            >
              Sign Out
            </button>
          </div>

          {/* GPS Refresh Box */}
          <div className="bg-emerald-50/30 border border-emerald-100 dark:bg-emerald-950/10 dark:border-emerald-900/30 p-6 rounded-2xl space-y-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="space-y-1 text-center sm:text-left">
                <h3 className="text-sm font-bold text-emerald-800 dark:text-emerald-400">Live GPS Location Sync</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Workers and Farmers move frequently. Refresh to sync coordinates and update nearby search filters instantly.
                </p>
              </div>
              <button
                type="button"
                onClick={handleRefreshGPS}
                disabled={refreshingGPS}
                className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 text-xs font-bold cursor-pointer disabled:opacity-50 flex items-center space-x-1 shrink-0"
              >
                <RefreshCw className={`h-4 w-4 shrink-0 ${refreshingGPS ? "animate-spin text-white" : ""}`} />
                <span>{refreshingGPS ? "Syncing GPS..." : "📍 Refresh Live Location"}</span>
              </button>
            </div>

            {user.lastUpdated && (
              <p className="text-[10px] text-slate-400 text-center sm:text-left">
                Last synchronized: {new Date(user.lastUpdated).toLocaleDateString()} at {new Date(user.lastUpdated).toLocaleTimeString()}
              </p>
            )}
          </div>

          {/* Form edit fields */}
          <form onSubmit={handleUpdateProfile} className="space-y-5 text-slate-700 dark:text-slate-300">
            
            {/* Full Name */}
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Full Name</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="block w-full rounded-2xl border border-slate-200 py-3.5 px-4 text-sm bg-white dark:border-slate-800 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none"
              />
            </div>

            {/* Mobile Number */}
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Mobile Phone</label>
              <input
                type="tel"
                required
                maxLength={10}
                value={mobileNum}
                onChange={(e) => setMobileNum(e.target.value)}
                className="block w-full rounded-2xl border border-slate-200 py-3.5 px-4 text-sm bg-white dark:border-slate-800 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none"
              />
            </div>

            {/* Village */}
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Primary Village / District</label>
              <input
                type="text"
                required
                value={village}
                onChange={(e) => setVillage(e.target.value)}
                className="block w-full rounded-2xl border border-slate-200 py-3.5 px-4 text-sm bg-white dark:border-slate-800 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none"
              />
            </div>

            {/* Submit settings change */}
            <button
              type="submit"
              disabled={updating}
              className="flex w-full items-center justify-center rounded-2xl bg-gradient-to-r from-emerald-600 to-green-600 py-3.5 text-sm font-bold text-white shadow-md shadow-emerald-500/10 hover:from-emerald-500 hover:to-green-500 disabled:opacity-50 cursor-pointer"
            >
              {updating ? (
                <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
              ) : (
                "Save Profile Changes"
              )}
            </button>

          </form>

        </div>

      </div>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

    </div>
  );
};
export default SettingsPage;
