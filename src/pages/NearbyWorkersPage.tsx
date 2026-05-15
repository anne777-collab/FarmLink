import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { Toast } from "../components/Toast";
import { ProfileAvatar } from "../components/ProfileAvatar";
import { MapPin, Bookmark, Phone, MessageSquare, ArrowLeft, SlidersHorizontal, User, Lock as LockIcon, Users, Sparkles } from "lucide-react";

export const NearbyWorkersPage: React.FC = () => {
  const { user, getNearbyWorkers, toggleSaveWorker } = useApp();
  const navigate = useNavigate();

  const [filterType, setFilterType] = useState<"all" | "saved">("all");
  const [skillFilter, setSkillFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);

  if (!user) return null;

  const allWorkers = getNearbyWorkers();
  const hasWorkers = allWorkers.length > 0;

  // Apply basic tab filters
  let filtered = allWorkers;
  if (filterType === "saved") {
    filtered = filtered.filter(w => user.savedWorkers?.includes(w.uid));
  }

  // Apply skill filter
  if (skillFilter !== "All") {
    filtered = filtered.filter(w => w.skills?.includes(skillFilter));
  }

  // Apply text search
  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter(w => w.fullName.toLowerCase().includes(q) || w.village.toLowerCase().includes(q));
  }

  const handlePremiumClick = () => {
    setShowPremiumModal(true);
  };

  const handleContactAction = (workerId: string) => {
    // Check limit
    const workerIndex = allWorkers.findIndex(w => w.uid === workerId);
    if (!user.isPremium && workerIndex >= 3) {
      setToast({
        message: "🔒 Free matching tier is limited to nearest 3 workers. Please upgrade to contact this worker.",
        type: "info"
      });
      return;
    }
  };

  const skillsList = [
    "All", "Wheat Cutting", "Rice Planting", "Harvesting", "Tractor Driving", "Pesticide Spraying", "Irrigation Work"
  ];

  return (
    <div className="min-h-screen bg-slate-50 py-12 dark:bg-slate-950 transition-colors duration-300">
      <div className="mx-auto max-w-5xl px-4 space-y-6">
        
        {/* Header Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center space-x-1 text-xs font-bold text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Dashboard</span>
          </button>
          
          <Link
            to="/post-job"
            className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 text-xs font-bold cursor-pointer"
          >
            Post Agriculture Job
          </Link>
        </div>

        {/* Banner Title */}
        <div className="space-y-1.5">
          <h1 className="text-3xl font-black text-slate-900 dark:text-white flex items-center space-x-2">
            <span>🧑‍🌾</span>
            <span>Agricultural Worker Directory</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Find direct assistance in <strong>{user.village || "your local village"}</strong> and surrounding districts.
          </p>
        </div>

        {/* Directory Controls */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 space-y-4 shadow-sm">
          
          {/* Tabs switch */}
          <div className="flex border-b border-slate-100 dark:border-slate-800/80 pb-3 gap-4">
            <button
              onClick={() => setFilterType("all")}
              className={`text-sm font-bold pb-2 border-b-2 transition-all cursor-pointer ${
                filterType === "all"
                  ? "border-emerald-600 text-emerald-600"
                  : "border-transparent text-slate-400 hover:text-slate-600"
              }`}
            >
              All Matched Workers ({allWorkers.length})
            </button>
            <button
              onClick={() => setFilterType("saved")}
              className={`text-sm font-bold pb-2 border-b-2 transition-all cursor-pointer ${
                filterType === "saved"
                  ? "border-emerald-600 text-emerald-600"
                  : "border-transparent text-slate-400 hover:text-slate-600"
              }`}
            >
              Saved Workers ({user.savedWorkers?.length || 0})
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
            {/* Search Input */}
            <div className="relative">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by worker name, pincode, village..."
                className="block w-full rounded-2xl border border-slate-200 py-3 px-4 text-xs bg-slate-50 dark:border-slate-800 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none"
              />
            </div>

            {/* Skill Selector */}
            <div className="flex items-center space-x-2">
              <SlidersHorizontal className="h-4 w-4 text-slate-400 shrink-0" />
              <select
                value={skillFilter}
                onChange={(e) => setSkillFilter(e.target.value)}
                className="block w-full rounded-2xl border border-slate-200 py-3 px-4 text-xs bg-slate-50 dark:border-slate-800 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none"
              >
                {skillsList.map((skill) => (
                  <option key={skill} value={skill}>{skill === "All" ? "Filter by Crop/Harvest Skill" : skill}</option>
                ))}
              </select>
            </div>
          </div>

        </div>

        {/* Worker directory cards rendering */}
        {!hasWorkers ? (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-12 text-center text-xs text-slate-400 space-y-2">
            <Users className="h-10 w-10 text-slate-300 mx-auto" />
            <p className="font-bold text-slate-600 dark:text-slate-300">No workers available nearby yet.</p>
            <p>Workers in your area will appear here automatically.</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-12 text-center text-xs text-slate-400 space-y-2">
            <User className="h-10 w-10 text-slate-300 mx-auto" />
            <p className="font-bold text-slate-600 dark:text-slate-300">No workers match your filters.</p>
            <p>Try a different skill, search term, or saved-worker filter.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filtered.map((worker) => {
              const globalIndex = allWorkers.findIndex(w => w.uid === worker.uid);
              const isLocked = !user.isPremium && globalIndex >= 3;

              return (
                <div
                  key={worker.uid}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 relative flex flex-col justify-between shadow-sm transition hover:shadow-md"
                >
                  <div className={`space-y-4 ${isLocked ? "blur-md pointer-events-none select-none" : ""}`}>
                    
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <ProfileAvatar
                          name={worker.fullName}
                          role={worker.role}
                          src={worker.profilePhoto || worker.photoURL}
                          size="sm"
                          className="shrink-0"
                        />
                        <div>
                          <div className="flex items-center space-x-1.5">
                            <h3 className="font-black text-sm text-slate-900 dark:text-white">{worker.fullName}</h3>
                            <span className="text-[9px] bg-emerald-50 text-emerald-800 dark:bg-emerald-950/20 px-1.5 py-0.5 rounded font-bold uppercase shrink-0">
                              {worker.availability || "Available"}
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-400 flex items-center space-x-1">
                            <MapPin className="h-3 w-3 text-rose-500" />
                            <span>{worker.village}, {(worker as any).distance !== undefined ? `${(worker as any).distance.toFixed(1)}km` : worker.state}</span>
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => toggleSaveWorker(worker.uid)}
                        className="p-2 border border-slate-100 rounded-xl bg-slate-50 dark:border-slate-800 dark:bg-slate-950 cursor-pointer"
                      >
                        <Bookmark className={`h-4 w-4 ${user.savedWorkers?.includes(worker.uid) ? "fill-emerald-500 text-emerald-500" : "text-slate-400"}`} />
                      </button>
                    </div>

                    {/* Skilltags */}
                    <div className="flex flex-wrap gap-1.5">
                      {worker.skills?.map(s => (
                        <span key={s} className="bg-slate-50 border border-slate-100 dark:bg-slate-950 dark:border-slate-800 text-[9px] px-2 py-0.5 rounded font-bold text-slate-500">
                          {s}
                        </span>
                      ))}
                    </div>

                    <div className="border-t border-slate-100 dark:border-slate-800/80 pt-3 flex justify-between items-center text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 block uppercase">Expected Wage</span>
                        <span className="font-black text-emerald-600 dark:text-emerald-400">₹{worker.wageExpectation || 450} / day</span>
                      </div>
                      <span className="text-[10px] text-slate-400">Exp: {worker.experience || "Experienced"}</span>
                    </div>

                  </div>

                  {/* Call/Message Controls */}
                  {!isLocked && (
                    <div className="mt-4 pt-3 border-t border-slate-50 dark:border-slate-800/80 flex gap-2">
                      <a
                        href={`tel:${worker.mobileNum}`}
                        onClick={() => handleContactAction(worker.uid)}
                        className="flex-1 rounded-xl border border-slate-200 text-center py-2 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300 flex items-center justify-center space-x-1"
                      >
                        <Phone className="h-3.5 w-3.5 text-emerald-500" />
                        <span>Call Direct</span>
                      </a>
                      <a
                        href={`https://wa.me/91${worker.mobileNum}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex-1 rounded-xl bg-emerald-50 border border-emerald-500/20 text-center py-2 text-xs font-bold text-emerald-800 hover:bg-emerald-100 flex items-center justify-center space-x-1"
                      >
                        <MessageSquare className="h-3.5 w-3.5 text-emerald-600" />
                        <span>WhatsApp</span>
                      </a>
                    </div>
                  )}

                  {/* Premium Lock overlay inside directory */}
                  {isLocked && (
                        <div className="absolute inset-0 bg-slate-50/50 dark:bg-slate-950/50 backdrop-blur-md flex flex-col items-center justify-center p-4 text-center z-10 rounded-3xl">
                      <LockIcon className="h-5 w-5 text-amber-500 mb-2" />
                      <span className="text-xs font-bold text-slate-900 dark:text-white">Matched workers locked</span>
                      <p className="text-[10px] text-slate-400 mt-0.5 leading-relaxed max-w-xs">Upgrade to Pro to unlock all nearby workers.</p>
                      <button
                        onClick={handlePremiumClick}
                        className="mt-2 rounded-lg bg-amber-500 text-white px-3 py-1 text-[10px] font-bold"
                      >
                        Upgrade
                      </button>
                    </div>
                  )}

                </div>
              );
            })}
          </div>
        )}

      </div>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {showPremiumModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-2xl dark:border-slate-800 dark:bg-slate-950">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50 dark:bg-amber-950/20">
              <Sparkles className="h-8 w-8 text-amber-500" />
            </div>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white">🚀 Premium plans coming soon</h3>
            <p className="mt-3 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
              Razorpay integration will be available soon.
            </p>
            <button
              onClick={() => setShowPremiumModal(false)}
              className="mt-6 w-full rounded-2xl bg-amber-500 py-3 text-sm font-bold text-white hover:bg-amber-600"
            >
              Close
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
export default NearbyWorkersPage;
