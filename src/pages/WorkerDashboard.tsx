import React, { useState } from "react";
import { useLanguage } from "../context/LanguageContext";
import { useApp } from "../context/AppContext";
import { Toast } from "../components/Toast";
import { JobStatusBadge, JobTimeline } from "../components/JobTimeline";
import { RatingModal } from "../components/RatingModal";
import { 
  IndianRupee, Briefcase, MapPin, RefreshCw, 
  CheckCircle, XCircle, Bell, Check, AlertCircle, Send, Play, Star
} from "lucide-react";

export const WorkerDashboard: React.FC = () => {
  const { t } = useLanguage();
  const {
    user, requests, notifications, refreshUserLocation, updateRequestStatus,
    completeUserProfile, getNearbyJobs, jobApplications, jobs, applyToJob,
    updateJobStatus, submitRating, ratings
  } = useApp();
  
  // Local notification toasts
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);
  const [refreshingLocation, setRefreshingLocation] = useState(false);
  const [ratingJobId, setRatingJobId] = useState<string | null>(null);
  const [ratingLoading, setRatingLoading] = useState(false);

  if (!user) return null;

  // Filter requests belonging to this worker
  const myRequests = requests.filter(req => req.workerId === user.uid);
  const pendingRequests = myRequests.filter(req => req.status === "pending");
  const acceptedRequests = myRequests.filter(req => req.status === "accepted");
  const nearbyJobs = getNearbyJobs();
  const workflowJobs = jobs.filter(job => job.workerId === user.uid || jobApplications.some(app => app.jobId === job.id && app.workerId === user.uid));
  const activeWorkflowJobs = workflowJobs.filter(job => !["completed", "rated", "cancelled"].includes(job.status));
  const completedWorkflowJobs = workflowJobs.filter(job => ["completed", "rated"].includes(job.status));
  const ratingJob = ratingJobId ? jobs.find(job => job.id === ratingJobId) : null;

  // Dynamic statistics from database (initially empty)
  const completedJobsCount = completedWorkflowJobs.length;
  const totalEarnings = completedWorkflowJobs.reduce((sum, job) => sum + job.wage, 0);

  const handleRefreshLocation = async () => {
    setRefreshingLocation(true);
    try {
      const loc = await refreshUserLocation();
      setToast({
        message: `${t("locationSuccess")} (Pincode: ${loc.pincode})`,
        type: "success"
      });
    } catch (err: any) {
      setToast({
        message: t("gpsFailed"),
        type: "error"
      });
    } finally {
      setRefreshingLocation(false);
    }
  };

  const handleUpdateAvailability = async (newVal: any) => {
    try {
      await completeUserProfile({ availability: newVal });
      setToast({
        message: "Availability status updated successfully!",
        type: "success"
      });
    } catch (err) {
      setToast({ message: "Failed to update status", type: "error" });
    }
  };

  const handleRequestAction = async (requestId: string, status: "accepted" | "declined") => {
    try {
      await updateRequestStatus(requestId, status);
      setToast({
        message: status === "accepted" ? "Work offer accepted! The farmer has been notified." : "Offer declined.",
        type: status === "accepted" ? "success" : "info"
      });
    } catch (err) {
      setToast({ message: "Action failed", type: "error" });
    }
  };

  const handleApplyJob = async (jobId: string) => {
    try {
      await applyToJob(jobId);
      setToast({ message: "Application sent to farmer.", type: "success" });
    } catch (err: any) {
      setToast({ message: err.message || "Could not apply.", type: "error" });
    }
  };

  const handleWorkflowStatus = async (jobId: string, status: "in_progress" | "completed" | "cancelled") => {
    try {
      await updateJobStatus(jobId, status);
      setToast({ message: status === "cancelled" ? "Offer rejected." : "Job status updated.", type: status === "cancelled" ? "info" : "success" });
    } catch (err: any) {
      setToast({ message: err.message || "Could not update job.", type: "error" });
    }
  };

  const handleSubmitRating = async (rating: number, review: string) => {
    if (!ratingJob) return;
    setRatingLoading(true);
    try {
      await submitRating(ratingJob.id, ratingJob.farmerId, rating, review);
      setToast({ message: "Farmer rating submitted.", type: "success" });
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
        
        {/* Welcome Block */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
          <div className="space-y-1.5">
            <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest">{t("imWorker")}</span>
            <h1 className="text-3xl font-black text-slate-900 dark:text-white">
              {t("welcome")}, {user.fullName || "Friend"}!
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center space-x-1.5">
              <MapPin className="h-4.5 w-4.5 text-rose-500 shrink-0" />
              <span>Current Base: <strong>{user.village || "Not Specified"}, {user.state}</strong></span>
              {user.lastUpdated && <span className="text-slate-400">• Last synced: {new Date(user.lastUpdated).toLocaleTimeString()}</span>}
            </p>
          </div>

          {/* Quick Action bar (Refresh Location & Availability switcher) */}
          <div className="flex flex-wrap items-center gap-3">
            
            {/* Live Refresh Coordinates Button */}
            <button
              onClick={handleRefreshLocation}
              disabled={refreshingLocation}
              className="rounded-xl border border-emerald-500 bg-emerald-50 px-4 py-2.5 text-xs font-bold text-emerald-800 hover:bg-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-300 flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`h-4.5 w-4.5 shrink-0 ${refreshingLocation ? "animate-spin text-emerald-600" : ""}`} />
              <span>{refreshingLocation ? t("refreshing") : t("refreshLocation")}</span>
            </button>

            {/* Quick Availability Status selector */}
            <div className="flex items-center space-x-1.5 rounded-xl border border-slate-200 bg-slate-50 p-1 dark:border-slate-800 dark:bg-slate-950">
              <button
                onClick={() => handleUpdateAvailability("Available Today")}
                className={`rounded-lg px-2.5 py-1.5 text-[10px] font-bold transition-all cursor-pointer ${
                  user.availability === "Available Today"
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "text-slate-500 hover:text-slate-800 dark:text-slate-400"
                }`}
              >
                Available Today
              </button>
              <button
                onClick={() => handleUpdateAvailability("Available This Week")}
                className={`rounded-lg px-2.5 py-1.5 text-[10px] font-bold transition-all cursor-pointer ${
                  user.availability === "Available This Week"
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "text-slate-500 hover:text-slate-800 dark:text-slate-400"
                }`}
              >
                This Week
              </button>
              <button
                onClick={() => handleUpdateAvailability("Busy / Booked")}
                className={`rounded-lg px-2.5 py-1.5 text-[10px] font-bold transition-all cursor-pointer ${
                  user.availability === "Busy / Booked"
                    ? "bg-rose-600 text-white shadow-sm"
                    : "text-slate-500 hover:text-slate-800 dark:text-slate-400"
                }`}
              >
                Busy
              </button>
            </div>

          </div>
        </div>

        {/* Dynamic Earnings & Completed Metrics Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Completed Jobs */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 flex items-center space-x-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 dark:bg-emerald-950/20">
              <Briefcase className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">{t("completedJobs")}</p>
              <p className="text-2xl font-black text-slate-900 dark:text-white">{completedJobsCount}</p>
            </div>
          </div>

          {/* Wages Earned */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 flex items-center space-x-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 dark:bg-emerald-950/20">
              <IndianRupee className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">{t("earnings")}</p>
              <p className="text-2xl font-black text-slate-900 dark:text-white">₹{totalEarnings}</p>
            </div>
          </div>

          {/* Average daily wage expectation badge */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 flex items-center space-x-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 dark:bg-emerald-950/20">
              <CheckCircle className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Your Expected Daily Wage</p>
              <p className="text-2xl font-black text-slate-900 dark:text-white">₹{user.wageExpectation || 450}</p>
            </div>
          </div>

        </div>

        {/* Content Grids */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Work Request Feed Column (Initially completely empty as requested) */}
          <div className="lg:col-span-2 space-y-6">
            <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center space-x-2">
              <span>🌾</span>
              <span>Nearby Jobs & Workflow</span>
            </h2>

            {activeWorkflowJobs.length > 0 && (
              <div className="space-y-4">
                {activeWorkflowJobs.map((job) => {
                  const myApplication = jobApplications.find(app => app.jobId === job.id && app.workerId === user.uid);
                  return (
                    <div key={job.id} className="rounded-3xl border border-emerald-100 bg-white p-5 shadow-sm dark:border-emerald-900/30 dark:bg-slate-900">
                      <div className="mb-4 flex items-start justify-between gap-3">
                        <div>
                          <div className="mb-2 flex flex-wrap items-center gap-2">
                            <h3 className="text-lg font-black text-slate-900 dark:text-white">{job.workType}</h3>
                            <JobStatusBadge status={job.status} />
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400">{job.description || job.notes}</p>
                          <p className="mt-2 text-[10px] font-bold text-slate-400">{job.village}, {job.district} • {job.workDate || job.dateTime} {job.workTime}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] text-slate-400">Daily Wage</p>
                          <p className="text-lg font-black text-emerald-600">₹{job.wage}</p>
                        </div>
                      </div>

                      <JobTimeline status={job.status} compact />

                      {myApplication?.status === "pending" && (
                        <p className="mt-4 rounded-2xl bg-amber-50 p-3 text-xs font-bold text-amber-700 dark:bg-amber-950/20 dark:text-amber-300">Application sent. Waiting for farmer acceptance.</p>
                      )}

                      {job.workerId === user.uid && (
                        <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
                          {job.status === "accepted" && (
                            <>
                              <button onClick={() => handleWorkflowStatus(job.id, "in_progress")} className="rounded-xl bg-amber-500 py-2.5 text-xs font-bold text-white hover:bg-amber-600"><Play className="mr-1 inline h-4 w-4" />Start Work</button>
                              <button onClick={() => handleWorkflowStatus(job.id, "cancelled")} className="rounded-xl border border-slate-200 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-300"><XCircle className="mr-1 inline h-4 w-4" />Reject Offer</button>
                            </>
                          )}
                          {job.status === "in_progress" && (
                            <button onClick={() => handleWorkflowStatus(job.id, "completed")} className="rounded-xl bg-emerald-600 py-2.5 text-xs font-bold text-white hover:bg-emerald-700 sm:col-span-3"><CheckCircle className="mr-1 inline h-4 w-4" />Mark Work Complete</button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            <div className="space-y-4">
              <h3 className="text-sm font-black uppercase tracking-wider text-slate-400">Apply To Nearby Jobs</h3>
              {nearbyJobs.filter(job => !jobApplications.some(app => app.jobId === job.id && app.workerId === user.uid)).length === 0 ? (
                <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center dark:border-slate-800 dark:bg-slate-900">
                  <Briefcase className="mx-auto h-8 w-8 text-slate-300" />
                  <h3 className="mt-3 text-sm font-black text-slate-900 dark:text-white">No nearby posted jobs yet.</h3>
                  <p className="mx-auto mt-1 max-w-sm text-xs text-slate-500 dark:text-slate-400">New farmer jobs from your area will appear here automatically from Firestore.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {nearbyJobs
                    .filter(job => !jobApplications.some(app => app.jobId === job.id && app.workerId === user.uid))
                    .map((job) => (
                      <div key={job.id} className="rounded-3xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h3 className="font-black text-slate-900 dark:text-white">{job.workType}</h3>
                            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{job.description || job.notes}</p>
                            <p className="mt-2 text-[10px] font-bold text-slate-400">{job.farmerName} • {job.village} • {(job as any).distance?.toFixed?.(1) ?? "0.0"} km away</p>
                          </div>
                          <p className="text-lg font-black text-emerald-600">₹{job.wage}</p>
                        </div>
                        <button onClick={() => handleApplyJob(job.id)} className="mt-4 w-full rounded-xl bg-emerald-600 py-2.5 text-xs font-bold text-white hover:bg-emerald-700">
                          <Send className="mr-1 inline h-4 w-4" /> Apply Job
                        </button>
                      </div>
                    ))}
                </div>
              )}
            </div>

            {pendingRequests.length === 0 && activeWorkflowJobs.length === 0 && nearbyJobs.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-12 text-center space-y-4">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50 dark:bg-slate-950">
                  <Briefcase className="h-7 w-7 text-slate-400" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">{t("noJobRequests")}</h3>
                <p className="mx-auto max-w-sm text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                  {t("noJobRequestsSub")}
                </p>
                <div className="pt-2">
                  <button 
                    onClick={handleRefreshLocation}
                    className="inline-flex items-center space-x-1.5 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-emerald-700 cursor-pointer"
                  >
                    <span>📍 {t("refreshLocation")}</span>
                  </button>
                </div>
              </div>
            ) : pendingRequests.length > 0 ? (
              <div className="space-y-4">
                {pendingRequests.map((req) => (
                  <div key={req.id} className="bg-white dark:bg-slate-900 border-2 border-emerald-500/10 rounded-2xl p-6 space-y-4 shadow-sm hover:border-emerald-500/30 transition-all">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="inline-flex items-center space-x-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/20 px-2 py-0.5 text-[10px] font-bold text-emerald-800 dark:text-emerald-300">
                          <Check className="h-3 w-3" />
                          <span>Hiring Offer</span>
                        </span>
                        <h3 className="text-lg font-black text-slate-900 dark:text-white mt-1.5">{req.workType}</h3>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-slate-400 font-medium">Daily Wage</p>
                        <p className="text-lg font-black text-emerald-600 dark:text-emerald-400">₹{req.wageOffered}</p>
                      </div>
                    </div>

                    <div className="border-t border-b border-slate-100 dark:border-slate-800/80 py-3 grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <span className="text-slate-400 block font-medium">Farmer</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">{req.farmerName}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-medium">Date posted</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">{new Date(req.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>

                    {/* Accept/Decline CTA */}
                    <div className="flex space-x-3">
                      <button
                        onClick={() => handleRequestAction(req.id, "accepted")}
                        className="flex-1 rounded-xl bg-emerald-600 py-2.5 text-xs font-bold text-white hover:bg-emerald-700 flex items-center justify-center space-x-1.5 shadow-sm cursor-pointer"
                      >
                        <CheckCircle className="h-4.5 w-4.5" />
                        <span>{t("accept")}</span>
                      </button>
                      <button
                        onClick={() => handleRequestAction(req.id, "declined")}
                        className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 hover:text-rose-600 dark:border-slate-800 dark:text-slate-300 cursor-pointer"
                      >
                        <XCircle className="h-4.5 w-4.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : null}

            {/* Completed Work History section (Optional nice touch) */}
            {acceptedRequests.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-sm font-black uppercase tracking-wider text-slate-400">Your Accepted Job List</h3>
                <div className="space-y-3">
                  {acceptedRequests.map((req) => (
                    <div key={req.id} className="bg-emerald-50/40 dark:bg-emerald-950/10 border border-emerald-100 dark:border-emerald-900/30 rounded-2xl p-4 flex justify-between items-center text-xs">
                      <div className="space-y-1">
                        <span className="font-bold text-slate-800 dark:text-slate-200">{req.workType}</span>
                        <p className="text-[10px] text-slate-400">Employer: {req.farmerName} ({req.farmerMobile})</p>
                      </div>
                      <div className="text-right">
                        <span className="rounded bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 text-[10px] dark:bg-emerald-950/50 dark:text-emerald-300">Active / Accepted</span>
                        <p className="font-black text-slate-700 dark:text-slate-300 mt-1">₹{req.wageOffered}/day</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {completedWorkflowJobs.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-sm font-black uppercase tracking-wider text-slate-400">Completed Workflow Jobs</h3>
                {completedWorkflowJobs.map((job) => {
                  const alreadyRated = ratings.some(item => item.jobId === job.id && item.fromUserId === user.uid);
                  return (
                    <div key={job.id} className="rounded-2xl border border-emerald-100 bg-emerald-50/40 p-4 text-xs dark:border-emerald-900/30 dark:bg-emerald-950/10">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="font-black text-slate-900 dark:text-white">{job.workType}</p>
                          <p className="mt-1 text-[10px] text-slate-400">Farmer: {job.farmerName} • ₹{job.wage}/day</p>
                        </div>
                        <JobStatusBadge status={job.status} />
                      </div>
                      {!alreadyRated && (
                        <button onClick={() => setRatingJobId(job.id)} className="mt-3 w-full rounded-xl border border-amber-200 bg-amber-50 py-2 text-[10px] font-black text-amber-700 hover:bg-amber-100 dark:border-amber-900/30 dark:bg-amber-950/20 dark:text-amber-300">
                          <Star className="mr-1 inline h-3.5 w-3.5" /> Rate Farmer
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

          </div>

          {/* Secondary Notifications Widget Column */}
          <div className="space-y-6">
            <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center space-x-2">
              <Bell className="h-5 w-5 text-emerald-600" />
              <span>{t("notifications")}</span>
            </h2>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 space-y-4 shadow-sm">
              {notifications.filter(n => n.userId === user.uid).length === 0 ? (
                <div className="text-center py-6 text-xs text-slate-400 space-y-1">
                  <AlertCircle className="h-8 w-8 text-slate-300 mx-auto" />
                  <p>No new notifications yet.</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {notifications
                    .filter(n => n.userId === user.uid)
                    .map((notif) => (
                      <div key={notif.id} className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl text-xs space-y-1 border border-slate-100 dark:border-slate-800/80">
                        <p className="text-slate-700 dark:text-slate-300 leading-relaxed font-medium">{notif.message}</p>
                        <span className="text-[10px] text-slate-400 block">{new Date(notif.createdAt).toLocaleTimeString()}</span>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>

        </div>

      </div>

      {ratingJob && (
        <RatingModal
          title="Rate Farmer"
          subtitle={`Share feedback for ${ratingJob.farmerName} after ${ratingJob.workType}.`}
          loading={ratingLoading}
          onClose={() => setRatingJobId(null)}
          onSubmit={handleSubmitRating}
        />
      )}

      {/* Render custom action toasts */}
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
export default WorkerDashboard;
