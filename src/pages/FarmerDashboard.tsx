import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext";
import { useApp } from "../context/AppContext";
import { Toast } from "../components/Toast";
import { ProfileAvatar } from "../components/ProfileAvatar";
import { JobStatusBadge, JobTimeline } from "../components/JobTimeline";
import { RatingModal } from "../components/RatingModal";
import { TrustBadges } from "../components/TrustBadges";
import { buildTrustProfile, rankWorkersForJob } from "../services/marketplaceIntelligence";
import { 
  MapPin, Search, Bookmark, Lock, 
  Sparkles, RefreshCw, Phone, MessageSquare, Plus, 
  Award, SlidersHorizontal, AlertCircle, CheckCircle, XCircle, Play, Star
} from "lucide-react";

export const FarmerDashboard: React.FC = () => {
  const { t } = useLanguage();
  const { 
    user, getNearbyWorkers, toggleSaveWorker, hireWorkerRequest, 
    jobs, jobApplications, ratings, refreshUserLocation, acceptJobApplication,
    rejectJobApplication, updateJobStatus, submitRating, getWorkerStats
  } = useApp();
  const navigate = useNavigate();

  // Local UI States
  const [skillFilter, setSkillFilter] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedJobId, setSelectedJobId] = useState<string>("");
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [ratingJobId, setRatingJobId] = useState<string | null>(null);
  const [ratingLoading, setRatingLoading] = useState(false);
  const [refreshingLocation, setRefreshingLocation] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);

  if (!user) return null;

  // Fetch nearby workers sorted by proximity
  const allNearby = getNearbyWorkers();

  // Apply Skill Filters
  let filteredWorkers = allNearby;
  if (skillFilter !== "All") {
    filteredWorkers = filteredWorkers.filter(w => w.skills?.includes(skillFilter));
  }

  // Apply Text Search Filters (ByName / ByVillage)
  if (searchQuery) {
    const query = searchQuery.toLowerCase();
    filteredWorkers = filteredWorkers.filter(
      w => w.fullName.toLowerCase().includes(query) || w.village.toLowerCase().includes(query)
    );
  }

  // Active jobs created by this farmer
  const myJobs = jobs.filter(j => j.farmerId === user.uid);
  const directJobs = myJobs.filter((job) => job.type === "direct");
  const publicJobs = myJobs.filter((job) => job.type !== "direct");
  const directPendingApprovalJobs = directJobs.filter((job) => job.directStatus === "worker_accepted");
  const directIncomingJobs = directJobs.filter((job) => job.directStatus === "sent");
  const directActiveJobs = directJobs.filter((job) => ["farmer_confirmed", "in_progress", "completed", "rated"].includes(job.directStatus || ""));
  const ratingJob = ratingJobId ? myJobs.find(job => job.id === ratingJobId) : null;
  // Fallback to select first job for hiring purposes if not selected
  const activeHiringJobId = selectedJobId || (myJobs.length > 0 ? myJobs[0].id : "");
  const completedJobsByWorker = jobs.reduce<Record<string, number>>((acc, job) => {
    if (job.workerId && ["completed", "rated"].includes(job.status)) {
      acc[job.workerId] = (acc[job.workerId] || 0) + 1;
    }
    return acc;
  }, {});
  const selectedJob = jobs.find(job => job.id === activeHiringJobId);
  const visibleWorkerCandidates = user.isPremium ? filteredWorkers : filteredWorkers.slice(0, 3);
  const bestMatches = rankWorkersForJob(
    visibleWorkerCandidates,
    ratings,
    completedJobsByWorker,
    skillFilter,
    selectedJob?.wage || selectedJob?.wageOffered
  ).slice(0, 3);

  const handleRefreshLocation = async () => {
    setRefreshingLocation(true);
    try {
      const loc = await refreshUserLocation();
      setToast({
        message: `${t("locationSuccess")} (Village: ${loc.village})`,
        type: "success"
      });
    } catch (err) {
      setToast({
        message: t("gpsFailed"),
        type: "error"
      });
    } finally {
      setRefreshingLocation(false);
    }
  };

  const handleHireWorker = async (workerId: string) => {
    if (!activeHiringJobId) {
      setToast({
        message: "Please post a job request first before sending direct hire requests!",
        type: "info"
      });
      navigate("/post-job");
      return;
    }

    try {
      await hireWorkerRequest(workerId, activeHiringJobId);
      setToast({
        message: "Hiring invitation sent directly to worker's mobile!",
        type: "success"
      });
    } catch (err) {
      setToast({ message: "Hiring request failed.", type: "error" });
    }
  };

  const handleSimulatePremiumUpgrade = () => {
    setShowPremiumModal(true);
  };

  const skillsList = [
    "All", "Wheat Cutting", "Rice Planting", "Harvesting", "Tractor Driving", "Pesticide Spraying", "Irrigation Work"
  ];

  const handleApplicationAction = async (applicationId: string, action: "accept" | "reject") => {
    try {
      if (action === "accept") {
        await acceptJobApplication(applicationId);
        setToast({ message: "Worker accepted. Their availability is now Busy.", type: "success" });
      } else {
        await rejectJobApplication(applicationId);
        setToast({ message: "Application rejected and worker notified.", type: "info" });
      }
    } catch (err: any) {
      setToast({ message: err.message || "Application action failed.", type: "error" });
    }
  };

  const handleStatusAction = async (jobId: string, status: "in_progress" | "completed") => {
    try {
      await updateJobStatus(jobId, status);
      setToast({ message: status === "in_progress" ? "Work started." : "Work completed. Worker is available again.", type: "success" });
    } catch (err: any) {
      setToast({ message: err.message || "Could not update job.", type: "error" });
    }
  };

  const handleDirectAction = async (jobId: string, status: "accepted" | "cancelled" | "in_progress" | "completed") => {
    try {
      await updateJobStatus(jobId, status);
      setToast({
        message:
          status === "accepted"
            ? "Direct request confirmed."
            : status === "cancelled"
              ? "Direct request rejected."
              : status === "in_progress"
                ? "Direct work started."
                : "Direct work completed.",
        type: "success",
      });
    } catch (err: any) {
      setToast({ message: err.message || "Could not update direct request.", type: "error" });
    }
  };

  const handleSubmitRating = async (rating: number, review: string) => {
    if (!ratingJob?.workerId) return;
    setRatingLoading(true);
    try {
      await submitRating(ratingJob.id, ratingJob.workerId, rating, review);
      setToast({ message: "Rating submitted. Thank you for closing the loop.", type: "success" });
      setRatingJobId(null);
    } catch (err: any) {
      setToast({ message: err.message || "Rating failed.", type: "error" });
    } finally {
      setRatingLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8 dark:bg-slate-950 transition-colors duration-300">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Welcome Header & Onboarding details */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
          <div className="space-y-1.5">
            <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest">{t("imFarmer")} Dashboard</span>
            <h1 className="text-3xl font-black text-slate-900 dark:text-white">
              {t("welcome")}, {user.fullName || "Friend"}!
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center space-x-1.5">
              <MapPin className="h-4.5 w-4.5 text-rose-500 shrink-0" />
              <span>Current GPS Center: <strong>{user.village || "Click GPS to set"}, {user.state}</strong></span>
              {user.lastUpdated && <span className="text-slate-400">• Synced: {new Date(user.lastUpdated).toLocaleTimeString()}</span>}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* GPS Refresh Coordinates */}
            <button
              onClick={handleRefreshLocation}
              disabled={refreshingLocation}
              className="rounded-xl border border-emerald-500 bg-emerald-50 px-4 py-2.5 text-xs font-bold text-emerald-800 hover:bg-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-300 flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`h-4.5 w-4.5 shrink-0 ${refreshingLocation ? "animate-spin text-emerald-600" : ""}`} />
              <span>{refreshingLocation ? t("refreshing") : "📍 Sync GPS Location"}</span>
            </button>

            {/* Post Job Quick CTA */}
            <Link
              to="/post-job"
              className="rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-emerald-500/10 hover:from-emerald-500 hover:to-green-500 flex items-center space-x-1.5 cursor-pointer"
            >
              <Plus className="h-4.5 w-4.5 shrink-0" />
              <span>{t("postJob")}</span>
            </Link>
          </div>
        </div>

        {/* Plan Account status and quick info */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-3 text-center sm:text-left">
            <div className="h-10 w-10 rounded-full bg-amber-50 dark:bg-amber-950/20 flex items-center justify-center">
              <Award className="h-5 w-5 text-amber-500" />
            </div>
            <div>
              <span className="text-xs font-black text-amber-600 uppercase tracking-wider block">
                {user.isPremium ? "🏆 Premium Plan Active" : "🆓 Free Matching Tier"}
              </span>
              <p className="text-xs text-slate-400 mt-0.5">
                {user.isPremium 
                  ? "You have full, unlimited access to nearby agricultural labor contacts!"
                  : "Currently viewing nearest 3 matched workers only. Upgrade to unlock full directory."
                }
              </p>
            </div>
          </div>
          {!user.isPremium && (
            <button
              onClick={handleSimulatePremiumUpgrade}
              className="rounded-xl bg-amber-500 hover:bg-amber-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm flex items-center space-x-1 shrink-0 cursor-pointer"
            >
              <Sparkles className="h-4.5 w-4.5" />
              <span>View Premium Plans</span>
            </button>
          )}
        </div>

        {/* Dashboard Grid split: Left is Worker directory and filters, Right is Job management */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Directory Column */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Header with Search and Skill Filter Row */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center space-x-2">
                  <span>🧑‍🌾</span>
                  <span>{t("searchWorkers")}</span>
                </h2>
                <span className="text-xs font-medium text-slate-400">Sorted by Nearest Distance</span>
              </div>

              {/* Filters Box */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 space-y-4 shadow-sm">
                
                {/* Text search & select */}
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <Search className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by worker name, village, or pincode..."
                    className="block w-full rounded-2xl border border-slate-200 py-3 pl-10 pr-4 text-sm bg-white dark:border-slate-800 dark:bg-slate-950 text-slate-900 dark:text-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                {/* Horizontal Skills Filters */}
                <div className="space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-1">
                    <SlidersHorizontal className="h-3 w-3" />
                    <span>Filter by Harvesting Skill / Crop cutting</span>
                  </span>
                  <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                    {skillsList.map((skill) => (
                      <button
                        key={skill}
                        onClick={() => setSkillFilter(skill)}
                        className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${
                          (skill === "All" && skillFilter === "All") || skillFilter === skill
                            ? "bg-emerald-600 text-white"
                            : "bg-slate-50 text-slate-600 hover:bg-slate-100 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-slate-900"
                        }`}
                      >
                        {skill}
                      </button>
                    ))}
                  </div>
                </div>

              </div>
            </div>

            {/* Workers Matching List (Empty state or actual cards) */}
            {filteredWorkers.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-12 text-center space-y-4">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50 dark:bg-slate-950">
                  <AlertCircle className="h-7 w-7 text-slate-400" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  {allNearby.length === 0 ? "No workers available nearby yet." : t("noWorkersFound")}
                </h3>
                <p className="mx-auto max-w-sm text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                  {allNearby.length === 0
                    ? "Workers in your area will appear here automatically."
                    : t("noWorkersFoundSub")}
                </p>
                <div className="pt-2 flex justify-center gap-3 flex-wrap">
                  <button 
                    onClick={handleRefreshLocation}
                    className="inline-flex items-center space-x-1.5 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-emerald-700 cursor-pointer"
                  >
                    <span>📍 Sync Coordinates</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {bestMatches.length > 0 && (
                  <div className="rounded-[2rem] border border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-lime-50 p-5 shadow-sm dark:border-emerald-900/30 dark:from-emerald-950/20 dark:via-slate-900 dark:to-lime-950/10">
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-300">Best Match Workers</p>
                        <h3 className="text-xl font-black text-slate-900 dark:text-white">AI-powered recommendations</h3>
                      </div>
                      <Sparkles className="h-6 w-6 text-emerald-500" />
                    </div>
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                      {bestMatches.map(match => (
                        <div key={match.worker.uid} className="rounded-3xl border border-white bg-white/90 p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950/70">
                          <div className="mb-3 flex items-center gap-3">
                            <ProfileAvatar name={match.worker.fullName} role="worker" src={match.worker.profilePhoto || match.worker.photoURL} size="sm" />
                            <div className="min-w-0">
                              <p className="truncate text-sm font-black text-slate-900 dark:text-white">{match.worker.fullName}</p>
                              <p className="text-[10px] font-bold text-emerald-600">{match.score}/100 match</p>
                            </div>
                          </div>
                          <div className="mb-3 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                            <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-lime-500" style={{ width: `${match.score}%` }} />
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {match.reasons.map(reason => (
                              <span key={reason} className="rounded-full bg-emerald-50 px-2 py-1 text-[9px] font-black text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300">{reason}</span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {filteredWorkers.map((worker, index) => {
                  // Freemium Restriction: index >= 3 is premium lock if user is not premium
                  const isLocked = !user.isPremium && index >= 3;
                  const trust = buildTrustProfile(worker.uid, ratings, completedJobsByWorker[worker.uid] || 0);

                  return (
                    <div 
                      key={worker.uid} 
                      className={`relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 transition-all duration-300 shadow-sm ${
                        isLocked ? "overflow-hidden" : "hover:shadow-md"
                      }`}
                    >
                      {/* Blurred Premium Card Content */}
                      <div className={`space-y-4 ${isLocked ? "blur-md select-none pointer-events-none" : ""}`}>
                        
                        {/* Profile Header */}
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-center space-x-3.5">
                            <ProfileAvatar
                              name={worker.fullName}
                              role={worker.role}
                              src={worker.profilePhoto || worker.photoURL}
                              size="md"
                              className="shrink-0"
                            />
                            <div>
                              <div className="flex items-center space-x-2">
                                <h3 className="font-black text-slate-900 dark:text-white text-base">{worker.fullName}</h3>
                                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-bold ${
                                  worker.availability === "Available Today" 
                                    ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-300"
                                    : "bg-rose-50 text-rose-800 dark:bg-rose-950/20 dark:text-rose-300"
                                }`}>
                                  {worker.availability || "Available Today"}
                                </span>
                              </div>
                              <p className="text-xs text-slate-400 mt-0.5 flex items-center space-x-1">
                                <MapPin className="h-3.5 w-3.5 text-rose-500 shrink-0" />
                                <span>{worker.village} ({worker.pincode})</span>
                                {(worker as any).distance !== undefined && (
                                  <span className="font-bold text-emerald-600 dark:text-emerald-400">• {(worker as any).distance.toFixed(1)} km away</span>
                                )}
                              </p>
                            </div>
                          </div>

                          {/* Quick Save Bookmark button */}
                          <button
                            onClick={() => toggleSaveWorker(worker.uid)}
                            className="p-2.5 rounded-xl border border-slate-100 bg-slate-50 hover:bg-emerald-50 text-slate-400 hover:text-emerald-600 dark:border-slate-800 dark:bg-slate-950 cursor-pointer transition-all"
                          >
                            <Bookmark className={`h-4.5 w-4.5 ${user.savedWorkers?.includes(worker.uid) ? "fill-emerald-500 text-emerald-500" : ""}`} />
                          </button>
                        </div>

                        {/* Skills tag pill container */}
                        <div className="flex flex-wrap gap-1.5">
                          {worker.skills?.map((skill) => (
                            <span 
                              key={skill}
                              className="rounded-lg bg-slate-50 border border-slate-100 px-2 py-1 text-[10px] font-bold text-slate-600 dark:bg-slate-950 dark:border-slate-800 dark:text-slate-400"
                            >
                              🌾 {skill}
                            </span>
                          ))}
                        </div>

                        <TrustBadges trust={trust} compact />

                        {/* Bottom Row Details: Wage & Connect buttons */}
                        <div className="border-t border-slate-100 dark:border-slate-800/80 pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div>
                            <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">Expected Wage</span>
                            <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">₹{worker.wageExpectation || 450}</span>
                            <span className="text-xs text-slate-400 ml-1">/ day</span>
                          </div>

                          <div className="flex space-x-2">
                            {/* Call Button (tel:) */}
                            <a
                              href={`tel:${worker.mobileNum}`}
                              className="rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-4 py-2.5 text-xs font-bold text-slate-700 flex items-center justify-center space-x-1 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300 cursor-pointer"
                            >
                              <Phone className="h-4 w-4 text-emerald-500" />
                              <span>{t("call")}</span>
                            </a>

                            {/* WhatsApp Button */}
                            <a
                              href={`https://wa.me/91${worker.mobileNum}?text=Hello%20${worker.fullName},%20I%20found%20your%20profile%20on%20FarmLink%20and%20need%20agricultural%20work%20help!`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="rounded-xl border border-emerald-500 bg-emerald-50 hover:bg-emerald-100 px-4 py-2.5 text-xs font-bold text-emerald-800 flex items-center justify-center space-x-1 dark:bg-emerald-950/20 dark:text-emerald-300 cursor-pointer"
                            >
                              <MessageSquare className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                              <span>{t("whatsapp")}</span>
                            </a>

                            {/* Custom matching Hire trigger */}
                            <button
                              onClick={() => handleHireWorker(worker.uid)}
                              className="rounded-xl bg-emerald-600 hover:bg-emerald-700 px-4 py-2.5 text-xs font-bold text-white shadow-sm cursor-pointer"
                            >
                              {t("hireNow")}
                            </button>
                          </div>
                        </div>

                      </div>

                      {/* Premium Lock Overlay for index >= 3 on FREE Plan */}
                      {isLocked && (
                        <div className="absolute inset-0 bg-slate-100/40 dark:bg-slate-950/40 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center z-10 transition-all">
                          <div className="h-11 w-11 rounded-full bg-amber-500 text-white flex items-center justify-center shadow-md mb-3 animate-bounce-short">
                            <Lock className="h-5 w-5" />
                          </div>
                          <h4 className="text-sm font-black text-slate-900 dark:text-white">Premium matched worker</h4>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 max-w-xs leading-relaxed">
                            {t("freePlanSub")}
                          </p>
                          <button
                            onClick={handleSimulatePremiumUpgrade}
                            className="mt-3.5 rounded-xl bg-amber-500 hover:bg-amber-600 px-4 py-2 text-xs font-bold text-white shadow-md cursor-pointer"
                          >
                            {t("premiumUpgrade")}
                          </button>
                        </div>
                      )}

                    </div>
                  );
                })}
              </div>
            )}

          </div>

          {/* Farmer Job Postings Management Column */}
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center space-x-2">
                  <span>🚨</span>
                  <span>Direct Hiring Workflow</span>
                </h2>
                <Link
                  to="/emergency-hiring"
                  className="rounded-xl bg-orange-500 px-4 py-2 text-[10px] font-black uppercase tracking-wider text-white shadow-sm hover:bg-orange-600"
                >
                  Emergency Hiring
                </Link>
              </div>

              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 space-y-4 shadow-sm">
                {directJobs.length === 0 ? (
                  <div className="text-center py-8 text-xs text-slate-400 space-y-3">
                    <p>Open a worker profile and send a direct request to hire one specific worker privately.</p>
                    <Link
                      to="/nearby-workers"
                      className="inline-flex items-center space-x-1 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 cursor-pointer"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Choose Worker</span>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {directIncomingJobs.length > 0 && (
                      <div className="space-y-3">
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Waiting for worker response</span>
                        {directIncomingJobs.map((job) => (
                          <div key={job.id} className="rounded-2xl border border-slate-100 bg-slate-50 p-4 text-xs dark:border-slate-800 dark:bg-slate-950">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="font-black text-slate-900 dark:text-white">{job.workType}</p>
                                <p className="mt-1 text-[10px] text-slate-400">{job.workerName || "Selected worker"} • {job.village}, {job.district}</p>
                              </div>
                              <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-amber-700 dark:bg-amber-950/20 dark:text-amber-300">
                                Sent
                              </span>
                            </div>
                            <JobTimeline status={job.status} jobType="direct" directStatus={job.directStatus} compact />
                          </div>
                        ))}
                      </div>
                    )}

                    {directPendingApprovalJobs.length > 0 && (
                      <div className="space-y-3">
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Worker accepted — confirm now</span>
                        {directPendingApprovalJobs.map((job) => {
                          const worker = workers.find((item) => item.uid === job.workerId);
                          const stats = job.workerId ? getWorkerStats(job.workerId) : { averageRating: 0, jobsCompleted: 0, totalReviews: 0 };
                          const trust = job.workerId ? buildTrustProfile(job.workerId, ratings, stats.jobsCompleted) : null;

                          return (
                            <div key={job.id} className="rounded-2xl border border-emerald-100 bg-emerald-50/30 p-4 text-xs dark:border-emerald-900/30 dark:bg-emerald-950/10 space-y-4">
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex items-center gap-3">
                                  <ProfileAvatar name={job.workerName || worker?.fullName || "Worker"} role="worker" src={worker?.profilePhoto || worker?.photoURL || job.workerProfilePhoto} size="sm" />
                                  <div>
                                    <p className="font-black text-slate-900 dark:text-white">{job.workerName || worker?.fullName}</p>
                                    <p className="text-[10px] text-slate-400">
                                      {stats.totalReviews ? `${stats.averageRating.toFixed(1)} stars • ${stats.totalReviews} reviews` : "No reviews yet"}
                                    </p>
                                  </div>
                                </div>
                                <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300">
                                  Worker accepted
                                </span>
                              </div>

                              {trust && <TrustBadges trust={trust} compact />}

                              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                                <button onClick={() => navigate(`/worker-profile/${job.workerId}`)} className="rounded-xl border border-slate-200 bg-white py-2 text-[10px] font-black text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300">
                                  View Worker Profile
                                </button>
                                <button onClick={() => handleDirectAction(job.id, "accepted")} className="rounded-xl bg-emerald-600 py-2 text-[10px] font-black text-white hover:bg-emerald-700">
                                  Accept Worker
                                </button>
                                <button onClick={() => handleDirectAction(job.id, "cancelled")} className="rounded-xl border border-slate-200 py-2 text-[10px] font-black text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-300">
                                  Reject Worker
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {directActiveJobs.length > 0 && (
                      <div className="space-y-3">
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Active direct work</span>
                        {directActiveJobs.map((job) => (
                          <div key={job.id} className="rounded-2xl border border-slate-100 bg-slate-50 p-4 text-xs dark:border-slate-800 dark:bg-slate-950 space-y-3">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="font-black text-slate-900 dark:text-white">{job.workType}</p>
                                <p className="mt-1 text-[10px] text-slate-400">{job.workerName || "Worker"} • {job.village}, {job.district}</p>
                              </div>
                              <JobStatusBadge status={job.status} />
                            </div>
                            <JobTimeline status={job.status} jobType="direct" directStatus={job.directStatus} compact />
                            {job.status === "accepted" && (
                              <button onClick={() => handleDirectAction(job.id, "in_progress")} className="w-full rounded-xl bg-amber-500 py-2.5 text-[10px] font-black text-white hover:bg-amber-600">
                                <Play className="mr-1 inline h-3.5 w-3.5" /> Start Work
                              </button>
                            )}
                            {job.status === "in_progress" && (
                              <button onClick={() => handleDirectAction(job.id, "completed")} className="w-full rounded-xl bg-emerald-600 py-2.5 text-[10px] font-black text-white hover:bg-emerald-700">
                                <CheckCircle className="mr-1 inline h-3.5 w-3.5" /> Mark Completed
                              </button>
                            )}
                            {["completed", "rated"].includes(job.status) && job.workerId && !ratings.some((item) => item.jobId === job.id && item.fromUserId === user.uid) && (
                              <button onClick={() => setRatingJobId(job.id)} className="w-full rounded-xl border border-amber-200 bg-amber-50 py-2.5 text-[10px] font-black text-amber-700 hover:bg-amber-100 dark:border-amber-900/30 dark:bg-amber-950/20 dark:text-amber-300">
                                <Star className="mr-1 inline h-3.5 w-3.5" /> Rate Worker
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center space-x-2">
                <span>🌾</span>
                <span>Emergency Job Posts</span>
              </h2>

              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 space-y-4 shadow-sm">
                {publicJobs.length === 0 ? (
                  <div className="text-center py-8 text-xs text-slate-400 space-y-3">
                    <p>You haven't posted any emergency jobs yet.</p>
                    <Link
                      to="/emergency-hiring"
                      className="inline-flex items-center space-x-1 rounded-xl bg-orange-500 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-orange-600 cursor-pointer"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Create Emergency Job</span>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Workflow Jobs ({publicJobs.length})</span>
                    <div className="space-y-4 max-h-[42rem] overflow-y-auto pr-1">
                      {publicJobs.map((job) => {
                        const applications = jobApplications.filter((app) => app.jobId === job.id);
                        const pendingApplications = applications.filter((app) => app.status === "pending");
                        const alreadyRated = ratings.some((item) => item.jobId === job.id && item.fromUserId === user.uid);

                        return (
                          <div key={job.id} className="space-y-4 rounded-2xl border border-slate-100 bg-slate-50 p-4 text-xs dark:border-slate-800/80 dark:bg-slate-950">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <div className="mb-2 flex flex-wrap items-center gap-2">
                                  <span className="font-black text-slate-900 dark:text-white">{job.workType}</span>
                                  <JobStatusBadge status={job.status} />
                                </div>
                                <span className="text-[10px] text-slate-400 block">Need {job.workersNeeded} workers • {job.village} • {job.workDate || job.dateTime} {job.workTime}</span>
                              </div>
                              <span className="font-black text-emerald-600 dark:text-emerald-400">₹{job.wage}/day</span>
                            </div>

                            <JobTimeline status={job.status} jobType="emergency" compact />

                            {pendingApplications.length > 0 && (
                              <div className="space-y-2">
                                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Applications</span>
                                {pendingApplications.map((application) => {
                                  const worker = getNearbyWorkers().find(item => item.uid === application.workerId);
                                  const stats = getWorkerStats(application.workerId);
                                  return (
                                    <div key={application.id} className="rounded-2xl border border-white bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                                      <div className="flex items-center justify-between gap-3">
                                        <div className="flex items-center gap-2">
                                          <ProfileAvatar name={application.workerName} role="worker" src={application.workerPhoto} size="sm" />
                                          <div>
                                            <p className="font-black text-slate-900 dark:text-white">{application.workerName}</p>
                                            <p className="text-[10px] text-slate-400">
                                              {worker?.distance !== undefined ? `${worker.distance.toFixed(1)} km away • ` : ""}
                                              {stats.totalReviews ? `${stats.averageRating.toFixed(1)} stars • ${stats.totalReviews} reviews` : "No reviews yet"}
                                            </p>
                                          </div>
                                        </div>
                                        <div className="flex gap-1">
                                          {application.workerMobile && (
                                            <>
                                              <a href={`tel:${application.workerMobile}`} className="rounded-xl border border-slate-200 p-2 text-slate-600 dark:border-slate-800 dark:text-slate-300"><Phone className="h-4 w-4" /></a>
                                              <a href={`https://wa.me/91${application.workerMobile}`} target="_blank" rel="noopener noreferrer" className="rounded-xl border border-emerald-200 bg-emerald-50 p-2 text-emerald-700 dark:border-emerald-900/30 dark:bg-emerald-950/20"><MessageSquare className="h-4 w-4" /></a>
                                            </>
                                          )}
                                        </div>
                                      </div>
                                      <div className="mt-3 grid grid-cols-2 gap-2">
                                        <button onClick={() => handleApplicationAction(application.id, "accept")} className="rounded-xl bg-emerald-600 py-2 text-[10px] font-black text-white hover:bg-emerald-700"><CheckCircle className="mr-1 inline h-3.5 w-3.5" />Accept</button>
                                        <button onClick={() => handleApplicationAction(application.id, "reject")} className="rounded-xl border border-slate-200 py-2 text-[10px] font-black text-slate-600 hover:bg-slate-100 dark:border-slate-800 dark:text-slate-300"><XCircle className="mr-1 inline h-3.5 w-3.5" />Reject</button>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}

                            {job.status === "accepted" && (
                              <button onClick={() => handleStatusAction(job.id, "in_progress")} className="w-full rounded-xl bg-amber-500 py-2.5 text-[10px] font-black text-white hover:bg-amber-600">
                                <Play className="mr-1 inline h-3.5 w-3.5" /> Start Work
                              </button>
                            )}
                            {job.status === "in_progress" && (
                              <button onClick={() => handleStatusAction(job.id, "completed")} className="w-full rounded-xl bg-emerald-600 py-2.5 text-[10px] font-black text-white hover:bg-emerald-700">
                                <CheckCircle className="mr-1 inline h-3.5 w-3.5" /> Mark Completed
                              </button>
                            )}
                            {["completed", "rated"].includes(job.status) && job.workerId && !alreadyRated && (
                              <button onClick={() => setRatingJobId(job.id)} className="w-full rounded-xl border border-amber-200 bg-amber-50 py-2.5 text-[10px] font-black text-amber-700 hover:bg-amber-100 dark:border-amber-900/30 dark:bg-amber-950/20 dark:text-amber-300">
                                <Star className="mr-1 inline h-3.5 w-3.5" /> Rate Worker
                              </button>
                            )}
                            {applications.length === 0 && job.status === "posted" && (
                              <p className="rounded-xl bg-white p-3 text-center text-[10px] font-semibold text-slate-400 dark:bg-slate-900">No applications yet. Workers nearby will see this job live.</p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>

          </div>

        </div>

      </div>

      {/* Premium Notification Announcement Modal */}
      {showPremiumModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="relative w-full max-w-md bg-white rounded-3xl p-8 border border-slate-200 dark:border-slate-800 dark:bg-slate-950 shadow-2xl">
            <div className="text-center space-y-4">
              <div className="mx-auto h-16 w-16 bg-amber-50 rounded-2xl flex items-center justify-center">
                <Sparkles className="h-8 w-8 text-amber-500 animate-pulse" />
              </div>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white">{t("premiumComingSoon")}</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                {t("premiumComingSoonDesc")}
              </p>
              
              <div className="bg-amber-50 dark:bg-amber-950/20 p-4 rounded-2xl border border-amber-100 dark:border-amber-900/30">
                <p className="text-xs text-amber-800 dark:text-amber-300 font-bold">
                  🚧 Developer Testing Bypass Mode: Click below to unlock Premium instantly for FREE to test the complete matched worker list!
                </p>
              </div>

              <div className="flex flex-col gap-2 pt-2">
                <button
                  onClick={() => setShowPremiumModal(false)}
                  className="w-full rounded-2xl bg-amber-500 py-3 text-sm font-bold text-white hover:bg-amber-600 shadow-md cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {ratingJob && (
        <RatingModal
          title="Rate Worker"
          subtitle={`Share feedback for ${ratingJob.workerName || "this worker"} after ${ratingJob.workType}.`}
          loading={ratingLoading}
          onClose={() => setRatingJobId(null)}
          onSubmit={handleSubmitRating}
        />
      )}

      {/* Render toast notifications */}
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
export default FarmerDashboard;
