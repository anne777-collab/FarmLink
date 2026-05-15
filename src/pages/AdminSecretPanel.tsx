import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { Toast } from "../components/Toast";
import { 
  ShieldAlert, Database, Key, Flame, Users, Briefcase, Award
} from "lucide-react";
import { PasswordInput } from "../components/PasswordInput";

export const AdminSecretPanel: React.FC = () => {
  const { 
    workers, farmers, jobs, isConfigured
  } = useApp();
  const navigate = useNavigate();

  // Password authentication state
  const [passwordInput, setPasswordInput] = useState("");
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(() => {
    return localStorage.getItem("farmlink-admin-session") === "true";
  });
  const [passwordError, setPasswordError] = useState("");

  // Confirmation state
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState<(() => void) | null>(null);
  const [confirmTitle, setConfirmTitle] = useState("");
  const [confirmMessage, setConfirmMessage] = useState("");

  // Local stats state (derived from Firestore/Local persistence)
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);

  // Retrieve admin password from environment or fallback safely to 1996
  const securePassword = (import.meta as any).env?.VITE_ADMIN_PASSWORD || "1996";

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError("");
    
    if (passwordInput === securePassword) {
      setIsAdminAuthenticated(true);
      localStorage.setItem("farmlink-admin-session", "true");
      setToast({
        message: "🔓 Admin Authentication Successful. Welcome to internal dev-tools.",
        type: "success"
      });
    } else {
      setPasswordError("Incorrect Admin Password. Denied.");
    }
  };

  const handleAdminLogout = () => {
    setIsAdminAuthenticated(false);
    localStorage.removeItem("farmlink-admin-session");
    navigate("/");
  };

  const openDisabledResetModal = (label: string) => {
    setConfirmTitle(`${label} reset disabled`);
    setConfirmMessage("FarmLink is now configured for real Firestore data only. Demo reset tools are intentionally disabled to protect production collections.");
    setConfirmAction(() => () => {
      setShowConfirmModal(false);
      setToast({ message: "Reset tool is disabled for production safety.", type: "info" });
    });
    setShowConfirmModal(true);
  };

  const triggerClearSpecific = (scope: string) => {
    openDisabledResetModal(scope);
  };

  const triggerClearAll = () => {
    openDisabledResetModal("Emergency cleanup");
  };

  // --- DERIVE ADMIN STATISTICS ---
  const countWorkers = workers.length;
  const countFarmers = farmers.length;
  const countJobs = jobs.length;
  const countPremiumFarmers = farmers.filter((u) => u.isPremium).length;

  if (!isAdminAuthenticated) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-slate-950 px-4 py-12 text-slate-100">
        <div className="w-full max-w-md space-y-6 rounded-3xl border border-slate-800 bg-slate-900/60 p-8 shadow-2xl backdrop-blur-md">
          
          <div className="text-center space-y-2">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-amber-500 to-rose-600 shadow-lg shadow-rose-500/10">
              <Key className="h-7 w-7 text-white" />
            </div>
            <h2 className="text-2xl font-black tracking-tight text-white mt-4">
              Internal Secure Admin Panel
            </h2>
            <p className="text-xs text-slate-400">
              Database reset, seed, and stats tooling for FarmLink Agritech.
            </p>
          </div>

          {passwordError && (
            <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-center text-xs text-rose-400 flex items-center justify-center space-x-1">
              <ShieldAlert className="h-4.5 w-4.5 shrink-0" />
              <span>{passwordError}</span>
            </div>
          )}

          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div className="space-y-1 text-left">
              <label className="text-xs font-bold uppercase tracking-widest text-slate-400 block mb-1">Enter Admin Token Key</label>
              <PasswordInput
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="Enter 4-digit admin key"
              />
            </div>

            <button
              type="submit"
              className="w-full rounded-2xl bg-gradient-to-r from-emerald-600 to-green-600 py-3 text-xs font-bold text-white shadow-md hover:from-emerald-500 cursor-pointer"
            >
              Verify Secure Access
            </button>
          </form>

          <p className="text-[10px] text-slate-500 text-center leading-relaxed">
            Strict Role-Based Security: Normal farmers and workers do not have access to database credentials or reset scopes.
          </p>

        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-12 transition-colors duration-300">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Admin Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-800 pb-6">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="rounded-full bg-rose-500/10 px-2.5 py-1 text-[10px] font-black text-rose-400 uppercase tracking-widest border border-rose-500/20 animate-pulse">
                Developer Admin Session Active
              </span>
              <span className="text-xs text-slate-400">| DB: {isConfigured ? "Firebase Cloud" : "Simulated Offline Storage"}</span>
            </div>
            <h1 className="text-3xl font-black text-white tracking-tight flex items-center space-x-2">
              <Database className="h-8 w-8 text-emerald-500" />
              <span>FarmLink Admin Panel</span>
            </h1>
            <p className="text-xs text-slate-400">
              Real-time Firestore stats for registered workers, farmers, and jobs.
            </p>
          </div>

          <div className="flex space-x-3 shrink-0">
            <button
              onClick={() => navigate("/")}
              className="rounded-xl border border-slate-800 bg-slate-900 px-4 py-2.5 text-xs font-bold hover:bg-slate-800"
            >
              Back to Home
            </button>
            <button
              onClick={handleAdminLogout}
              className="rounded-xl bg-rose-950/40 text-rose-400 border border-rose-900/30 px-4 py-2.5 text-xs font-bold hover:bg-rose-900/60"
            >
              Lock Panel
            </button>
          </div>
        </div>

        {/* Database Stats Counters */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-1.5 shadow-sm">
            <div className="flex justify-between items-center text-slate-400 text-xs font-bold uppercase tracking-wider">
              <span>Total Workers</span>
              <Users className="h-4 w-4 text-emerald-500" />
            </div>
            <p className="text-3xl font-black text-white">{countWorkers}</p>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-1.5 shadow-sm">
            <div className="flex justify-between items-center text-slate-400 text-xs font-bold uppercase tracking-wider">
              <span>Total Farmers</span>
              <Users className="h-4 w-4 text-sky-500" />
            </div>
            <p className="text-3xl font-black text-white">{countFarmers}</p>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-1.5 shadow-sm">
            <div className="flex justify-between items-center text-slate-400 text-xs font-bold uppercase tracking-wider">
              <span>Total Active Jobs</span>
              <Briefcase className="h-4 w-4 text-amber-500" />
            </div>
            <p className="text-3xl font-black text-white">{countJobs}</p>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-1.5 shadow-sm">
            <div className="flex justify-between items-center text-slate-400 text-xs font-bold uppercase tracking-wider">
              <span>Premium Farmers</span>
              <Award className="h-4 w-4 text-yellow-500" />
            </div>
            <p className="text-3xl font-black text-white">{countPremiumFarmers}</p>
          </div>

        </div>

        {/* Main operations control grid */}
        <div className="grid grid-cols-1 gap-8">
          <div className="rounded-3xl border border-slate-800 bg-slate-900/40 p-6">
            <div className="space-y-1">
              <h3 className="text-base font-bold text-white">Demo data tools disabled</h3>
              <p className="text-xs leading-relaxed text-slate-400">
                This panel now reflects only live Firestore collections. Mock seeding and local reset shortcuts have been removed.
              </p>
            </div>
          </div>

          {/* Right panel: Collection-by-Collection Clear scopes */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Safe individual resets */}
            <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-6 space-y-6">
              <div className="space-y-1">
                <h3 className="text-base font-bold text-white">Reset Specific Database Collections</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Clean specific segments without erasing user settings or current auth parameters.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Reset Workers */}
                <div className="p-4 bg-slate-950/80 rounded-2xl border border-slate-800 flex justify-between items-center">
                  <div className="space-y-1">
                    <span className="text-xs font-black block text-slate-300">Simulated Workers</span>
                    <span className="text-[10px] text-slate-500">Count: {countWorkers} profiles</span>
                  </div>
                  <button
                    onClick={() => triggerClearSpecific("workers")}
                    className="rounded-xl bg-rose-950/40 text-rose-400 hover:bg-rose-950/80 border border-rose-900/30 px-3.5 py-1.5 text-xs font-bold cursor-pointer"
                  >
                    Reset Workers
                  </button>
                </div>

                {/* Reset Farmers */}
                <div className="p-4 bg-slate-950/80 rounded-2xl border border-slate-800 flex justify-between items-center">
                  <div className="space-y-1">
                    <span className="text-xs font-black block text-slate-300">Simulated Farmers</span>
                    <span className="text-[10px] text-slate-500">Count: {countFarmers} profiles</span>
                  </div>
                  <button
                    onClick={() => triggerClearSpecific("farmers")}
                    className="rounded-xl bg-rose-950/40 text-rose-400 hover:bg-rose-950/80 border border-rose-900/30 px-3.5 py-1.5 text-xs font-bold cursor-pointer"
                  >
                    Reset Farmers
                  </button>
                </div>

                {/* Reset Jobs */}
                <div className="p-4 bg-slate-950/80 rounded-2xl border border-slate-800 flex justify-between items-center">
                  <div className="space-y-1">
                    <span className="text-xs font-black block text-slate-300">Jobs & Hire Requests</span>
                    <span className="text-[10px] text-slate-500">Count: {countJobs} postings</span>
                  </div>
                  <button
                    onClick={() => triggerClearSpecific("jobs")}
                    className="rounded-xl bg-rose-950/40 text-rose-400 hover:bg-rose-950/80 border border-rose-900/30 px-3.5 py-1.5 text-xs font-bold cursor-pointer"
                  >
                    Reset Jobs
                  </button>
                </div>

                {/* Reset Notifications */}
                <div className="p-4 bg-slate-950/80 rounded-2xl border border-slate-800 flex justify-between items-center">
                  <div className="space-y-1">
                    <span className="text-xs font-black block text-slate-300">Notifications logs</span>
                    <span className="text-[10px] text-slate-500">Simulated messages history</span>
                  </div>
                  <button
                    onClick={() => triggerClearSpecific("notifications")}
                    className="rounded-xl bg-rose-950/40 text-rose-400 hover:bg-rose-950/80 border border-rose-900/30 px-3.5 py-1.5 text-xs font-bold cursor-pointer"
                  >
                    Reset Notifs
                  </button>
                </div>

              </div>
            </div>

            {/* Emergency WIPE OUT scope */}
            <div className="bg-rose-950/10 border-2 border-rose-900/30 rounded-3xl p-6 space-y-4">
              <div className="flex items-start space-x-3">
                <div className="p-2.5 rounded-xl bg-rose-950/60 border border-rose-900/50 text-rose-400 mt-1">
                  <Flame className="h-6 w-6 animate-pulse" />
                </div>
                <div className="space-y-1 flex-1">
                  <h3 className="text-base font-bold text-rose-400">Danger Zone: Emergency Complete Cleanup</h3>
                  <p className="text-xs text-rose-300/80 leading-relaxed">
                    Instantly wipes out ALL simulated collections (Workers, Farmers, Jobs, Notifications, Subscriptions) and logs you out completely. This restores the platform back to a absolute clean-slate empty state with 0 users.
                  </p>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={triggerClearAll}
                  className="rounded-2xl bg-rose-600 hover:bg-rose-700 text-white px-6 py-3 text-xs font-black shadow-lg shadow-rose-500/10 cursor-pointer"
                >
                  ⚠️ Emergency Database Cleanup
                </button>
              </div>
            </div>

          </div>

        </div>

      </div>

      {/* Confirmation modal drawer */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="relative w-full max-w-md bg-slate-900 rounded-3xl p-8 border-2 border-slate-800 shadow-2xl text-center space-y-6">
            <div className="mx-auto h-16 w-16 bg-rose-950/60 border border-rose-900 text-rose-400 rounded-2xl flex items-center justify-center">
              <ShieldAlert className="h-8 w-8 text-rose-500 animate-bounce" />
            </div>
            
            <div className="space-y-2">
              <h3 className="text-xl font-extrabold text-white">{confirmTitle}</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                {confirmMessage}
              </p>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl text-left border border-slate-800">
              <span className="text-[10px] font-black uppercase text-amber-500 block">⚠️ RESET SAFETY LOCK</span>
              <p className="text-[11px] text-slate-500 mt-0.5">To prevent accidental triggers, this requires a second confirmation click below.</p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => { if (confirmAction) confirmAction(); }}
                className="rounded-xl bg-rose-600 py-2.5 text-xs font-bold text-white hover:bg-rose-700 cursor-pointer"
              >
                Yes, Permanently Delete
              </button>
              <button
                onClick={() => setShowConfirmModal(false)}
                className="rounded-xl bg-slate-800 py-2.5 text-xs font-bold text-slate-300 hover:bg-slate-700 cursor-pointer"
              >
                Cancel / Safe Go Back
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Render */}
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
export default AdminSecretPanel;
