import React, { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Bell, ArrowLeft, MapPin, Star } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";
import { useApp } from "../context/AppContext";
import { ProfileAvatar } from "../components/ProfileAvatar";
import { TrustBadges } from "../components/TrustBadges";
import { buildTrustProfile } from "../services/marketplaceIntelligence";

export const NotificationsPage: React.FC = () => {
  const { t } = useLanguage();
  const { user, jobs, workers, farmers, notifications, ratings, getWorkerStats, markNotificationsAsRead, updateJobStatus } = useApp();
  const navigate = useNavigate();

  useEffect(() => {
    void markNotificationsAsRead();
  }, []);

  if (!user) return null;

  const myNotifications = notifications.filter((notification) => notification.userId === user.uid);

  const renderDirectActionCard = (notification: typeof myNotifications[number]) => {
    const job = jobs.find((item) => item.id === notification.jobId);
    if (!job) return null;

    if (notification.kind === "direct_request" && user.role === "worker") {
      const farmer = farmers.find((item) => item.uid === notification.farmerId) || farmers.find((item) => item.uid === job.farmerId);
      const farmerCompletedJobs = jobs.filter((item) => item.farmerId === job.farmerId && ["completed", "rated"].includes(item.status)).length;
      const farmerTrust = buildTrustProfile(job.farmerId, ratings, farmerCompletedJobs);

      return (
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <ProfileAvatar name={notification.farmerName || farmer?.fullName || job.farmerName} role="farmer" src={notification.farmerPhoto || farmer?.profilePhoto || farmer?.photoURL} size="md" />
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Direct Request</p>
                  <p className="text-sm font-black text-slate-900 dark:text-white">{notification.workType || job.workType}</p>
                </div>
                <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-amber-700 dark:bg-amber-950/20 dark:text-amber-300">Sent</span>
              </div>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{notification.farmerName || job.farmerName}</p>
              <p className="mt-1 text-[10px] text-slate-400">{notification.locationLabel || `${job.village}, ${job.district}`}</p>
              <div className="mt-2 flex items-center gap-2 text-[10px] text-slate-500">
                <MapPin className="h-3.5 w-3.5 text-rose-500" />
                <span>{notification.workDate || job.workDate} • {notification.workTime || job.workTime}</span>
              </div>
            </div>
          </div>

          <TrustBadges trust={farmerTrust} compact />

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            <Link
              to={`/farmer-profile/${job.farmerId}`}
              className="rounded-xl border border-slate-200 bg-white py-2.5 text-center text-[10px] font-black text-slate-700 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300"
            >
              View Farmer Profile
            </Link>
            <button
              onClick={() => updateJobStatus(job.id, "accepted")}
              className="rounded-xl bg-emerald-600 py-2.5 text-[10px] font-black text-white hover:bg-emerald-700"
            >
              Accept
            </button>
            <button
              onClick={() => updateJobStatus(job.id, "cancelled")}
              className="rounded-xl border border-slate-200 py-2.5 text-[10px] font-black text-slate-600 dark:border-slate-800 dark:text-slate-300"
            >
              Reject
            </button>
          </div>
        </div>
      );
    }

    if (notification.kind === "direct_worker_accepted" && user.role === "farmer") {
      const worker = workers.find((item) => item.uid === notification.workerId) || workers.find((item) => item.uid === job.workerId);
      const stats = job.workerId ? getWorkerStats(job.workerId) : { averageRating: notification.workerRating || 0, jobsCompleted: 0, totalReviews: 0 };
      const workerTrust = buildTrustProfile(job.workerId || notification.workerId || "", ratings, stats.jobsCompleted);

      return (
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <ProfileAvatar name={notification.workerName || worker?.fullName || job.workerName || "Worker"} role="worker" src={notification.workerPhoto || worker?.profilePhoto || worker?.photoURL} size="md" />
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Worker Accepted</p>
                  <p className="text-sm font-black text-slate-900 dark:text-white">{notification.workerName || worker?.fullName || job.workerName}</p>
                </div>
                <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300">Ready</span>
              </div>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{notification.workType || job.workType}</p>
              <div className="mt-1 flex items-center gap-2 text-[10px] text-slate-500">
                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                <span>{stats.totalReviews ? `${stats.averageRating.toFixed(1)} rating • ${stats.totalReviews} reviews` : "New worker"}</span>
              </div>
            </div>
          </div>

          <TrustBadges trust={workerTrust} compact />

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            <Link
              to={`/worker-profile/${job.workerId}`}
              className="rounded-xl border border-slate-200 bg-white py-2.5 text-center text-[10px] font-black text-slate-700 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300"
            >
              View Worker Profile
            </Link>
            <button
              onClick={() => updateJobStatus(job.id, "accepted")}
              className="rounded-xl bg-emerald-600 py-2.5 text-[10px] font-black text-white hover:bg-emerald-700"
            >
              Accept Worker
            </button>
            <button
              onClick={() => updateJobStatus(job.id, "cancelled")}
              className="rounded-xl border border-slate-200 py-2.5 text-[10px] font-black text-slate-600 dark:border-slate-800 dark:text-slate-300"
            >
              Reject Worker
            </button>
          </div>
        </div>
      );
    }

    return null;
  };

  const renderNotification = (notification: typeof myNotifications[number]) => {
    const isDirectCard = notification.kind === "direct_request" || notification.kind === "direct_worker_accepted";
    return (
      <div
        key={notification.id}
        className={`rounded-2xl border p-4 transition-all ${
          notification.read
            ? "bg-slate-50/50 border-slate-100 dark:bg-slate-950/10 dark:border-slate-800"
            : "bg-emerald-50/30 border-emerald-100 dark:bg-emerald-950/5 dark:border-emerald-900/30 shadow-sm"
        }`}
      >
        {isDirectCard ? (
          renderDirectActionCard(notification)
        ) : (
          <div className="flex items-start gap-3">
            <div className="mt-0.5 shrink-0">
              {notification.type === "success" ? (
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-800 text-xs">✓</span>
              ) : (
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-100 text-indigo-800 text-xs font-bold">!</span>
              )}
            </div>
            <div className="flex-1 space-y-1">
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">{notification.title}</p>
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 leading-relaxed">{notification.message}</p>
              <span className="text-[10px] text-slate-400 block">
                {new Date(notification.createdAt).toLocaleDateString()} at {new Date(notification.createdAt).toLocaleTimeString()}
              </span>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12 dark:bg-slate-950 transition-colors duration-300">
      <div className="mx-auto max-w-2xl px-4 space-y-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center space-x-1 text-xs font-bold text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back</span>
        </button>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-xl space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-4">
            <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center space-x-2">
              <Bell className="h-6 w-6 text-emerald-600" />
              <span>{t("notifications")} Inbox</span>
            </h1>
            <span className="text-xs bg-emerald-50 text-emerald-800 px-3 py-1 rounded-xl font-bold dark:bg-emerald-950/20 dark:text-emerald-300">
              {myNotifications.length} Messages
            </span>
          </div>

          {myNotifications.length === 0 ? (
            <div className="text-center py-12 text-xs text-slate-400 space-y-3">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-50 dark:bg-slate-950">
                <Bell className="h-6 w-6 text-slate-300" />
              </div>
              <p>You have no notifications yet. Keep your profile active to receive agricultural pairing alerts!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {myNotifications.map(renderNotification)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationsPage;
