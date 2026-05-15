import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext";
import { useApp } from "../context/AppContext";
import { Toast } from "../components/Toast";
import { ProfileAvatar } from "../components/ProfileAvatar";
import { ArrowLeft, MapPin, IndianRupee, ShieldCheck, Phone, MessageSquare, Briefcase, Award, RefreshCw, Star } from "lucide-react";

export const WorkerProfilePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { t } = useLanguage();
  const { workers, user, refreshUserLocation, getWorkerStats } = useApp();
  const navigate = useNavigate();
  const [refreshingLocation, setRefreshingLocation] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);

  const worker = workers.find(w => w.uid === id);
  const workerLocation = worker?.location;
  const displayVillage = workerLocation?.village || worker?.village || "Unknown Village";
  const displayDistrict = workerLocation?.district || worker?.district || "Local Area";
  const displayState = workerLocation?.state || worker?.state || "";
  const displayPincode = workerLocation?.pincode || worker?.pincode || "";
  const displayLatitude = workerLocation?.latitude ?? worker?.latitude;
  const displayLongitude = workerLocation?.longitude ?? worker?.longitude;
  const displayAccuracy = workerLocation?.accuracy;
  const displayLastUpdated = workerLocation?.lastUpdated || worker?.lastUpdated;
  const canRefreshOwnLocation = !!user && user.uid === worker?.uid;
  const stats = worker ? getWorkerStats(worker.uid) : { averageRating: 0, jobsCompleted: 0, totalReviews: 0 };

  const handleRefreshLocation = async () => {
    setRefreshingLocation(true);
    try {
      const loc = await refreshUserLocation();
      setToast({
        message: `Location updated successfully. ${loc.village}${loc.pincode ? ` (${loc.pincode})` : ""}`,
        type: "success",
      });
    } catch (err) {
      setToast({
        message: "Failed to detect precise GPS location. Please move outdoors and try again.",
        type: "error",
      });
    } finally {
      setRefreshingLocation(false);
    }
  };

  if (!worker) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="text-center space-y-4">
          <p className="text-sm font-bold text-slate-500">Worker profile not found.</p>
          <button
            onClick={() => navigate(-1)}
            className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white cursor-pointer"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12 dark:bg-slate-950 transition-colors duration-300">
      <div className="mx-auto max-w-3xl px-4 space-y-6">
        
        {/* Navigation */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center space-x-1 text-xs font-bold text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back</span>
        </button>

        {/* Profile Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-xl space-y-8">
          
          <div className="flex flex-col md:flex-row items-center gap-6 pb-6 border-b border-slate-100 dark:border-slate-800/80 text-center md:text-left">
            <ProfileAvatar
              name={worker.fullName}
              role={worker.role}
              src={worker.profilePhoto || worker.photoURL}
              size="xl"
              className="shrink-0"
            />
            <div className="space-y-2">
              <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold ${
                worker.availability === "Available Today"
                  ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-300"
                  : "bg-rose-50 text-rose-800 dark:bg-rose-950/20 dark:text-rose-300"
              }`}>
                ● {worker.availability || "Available Today"}
              </span>
              <h1 className="text-2xl font-black text-slate-900 dark:text-white">{worker.fullName}</h1>
              <p className="text-xs text-slate-400 flex items-center justify-center md:justify-start space-x-1">
                <MapPin className="h-4 w-4 text-rose-500 shrink-0" />
                <span>{displayVillage}{displayPincode ? ` (${displayPincode})` : ""} • {displayDistrict}{displayState ? `, ${displayState}` : ""}</span>
              </p>
              {canRefreshOwnLocation && (
                <button
                  type="button"
                  onClick={handleRefreshLocation}
                  disabled={refreshingLocation}
                  className="inline-flex items-center space-x-2 rounded-xl border border-emerald-500 bg-emerald-50 px-4 py-2 text-xs font-bold text-emerald-800 hover:bg-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-300 disabled:opacity-50"
                >
                  <RefreshCw className={`h-4 w-4 ${refreshingLocation ? "animate-spin" : ""}`} />
                  <span>{refreshingLocation ? t("refreshing") : "📍 Refresh Location"}</span>
                </button>
              )}
            </div>
          </div>

          <div className="bg-emerald-50/30 border border-emerald-100 dark:bg-emerald-950/10 dark:border-emerald-900/30 p-6 rounded-2xl space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-emerald-800 dark:text-emerald-400">Synced Worker Location</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Showing the saved Firestore location record for this worker profile.
                </p>
              </div>
              {displayLastUpdated && (
                <span className="text-[10px] text-slate-500 dark:text-slate-400">
                  Last updated: {new Date(displayLastUpdated).toLocaleString()}
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 rounded-2xl bg-white dark:bg-slate-950 p-4 border border-slate-100 dark:border-slate-800 text-xs">
              <div>
                <span className="text-slate-400 block font-medium">Village / PIN</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{displayVillage}{displayPincode ? ` (${displayPincode})` : ""}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">District & State</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{displayDistrict}{displayState ? `, ${displayState}` : ""}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">GPS Coordinates</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {typeof displayLatitude === "number" && typeof displayLongitude === "number"
                    ? `${displayLatitude.toFixed(5)}, ${displayLongitude.toFixed(5)}`
                    : "Not synced yet"}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Accuracy</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  {typeof displayAccuracy === "number" ? `±${displayAccuracy.toFixed(1)}m` : "Pending GPS sync"}
                </span>
              </div>
            </div>
          </div>

          {/* Details sections */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-xs text-slate-600 dark:text-slate-400">
            
            {/* Experience Card */}
            <div className="bg-slate-50 dark:bg-slate-950 p-6 rounded-2xl space-y-2 border border-slate-100 dark:border-slate-800">
              <div className="flex items-center space-x-2 text-slate-400 font-bold">
                <Briefcase className="h-4.5 w-4.5 text-emerald-600" />
                <span>EXPERIENCE LEVEL</span>
              </div>
              <p className="text-sm font-bold text-slate-800 dark:text-white">{worker.experience || "Experienced (3-5 years)"}</p>
            </div>

            {/* Wage Expectations Card */}
            <div className="bg-slate-50 dark:bg-slate-950 p-6 rounded-2xl space-y-2 border border-slate-100 dark:border-slate-800">
              <div className="flex items-center space-x-2 text-slate-400 font-bold">
                <IndianRupee className="h-4 w-4 text-emerald-600" />
                <span>EXPECTED DAILY WAGE</span>
              </div>
              <p className="text-sm font-black text-emerald-600 dark:text-emerald-400">₹ {worker.wageExpectation || 450} / day</p>
            </div>

          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-amber-100 bg-amber-50 p-5 text-center dark:border-amber-900/30 dark:bg-amber-950/20">
              <Star className="mx-auto h-5 w-5 fill-amber-400 text-amber-400" />
              <p className="mt-2 text-2xl font-black text-slate-900 dark:text-white">{stats.averageRating ? stats.averageRating.toFixed(1) : "New"}</p>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Average Rating</p>
            </div>
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-5 text-center dark:border-emerald-900/30 dark:bg-emerald-950/20">
              <Briefcase className="mx-auto h-5 w-5 text-emerald-600" />
              <p className="mt-2 text-2xl font-black text-slate-900 dark:text-white">{stats.jobsCompleted}</p>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Jobs Completed</p>
            </div>
            <div className="rounded-2xl border border-sky-100 bg-sky-50 p-5 text-center dark:border-sky-900/30 dark:bg-sky-950/20">
              <Award className="mx-auto h-5 w-5 text-sky-600" />
              <p className="mt-2 text-2xl font-black text-slate-900 dark:text-white">{stats.totalReviews}</p>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Reviews</p>
            </div>
          </div>

          {/* Special Skills Checklist */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Special Agricultural Skills</h3>
            <div className="grid grid-cols-2 gap-3">
              {worker.skills?.map((skill) => (
                <div key={skill} className="flex items-center space-x-2 p-3 border border-slate-100 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-950/20 text-xs text-slate-800 dark:text-slate-300 font-semibold">
                  <span className="text-emerald-500">✓</span>
                  <span>{skill}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Contact Methods Area */}
          <div className="border-t border-slate-100 dark:border-slate-800/80 pt-8 space-y-4">
            <div className="flex items-center space-x-2 text-xs font-bold text-slate-400">
              <Award className="h-4.5 w-4.5 text-emerald-500" />
              <span>Verified Direct Contacts • No Contractor Intermediary</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <a
                href={`tel:${worker.mobileNum}`}
                className="rounded-2xl border border-slate-200 bg-white py-3.5 text-center text-sm font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 flex items-center justify-center space-x-2 cursor-pointer"
              >
                <Phone className="h-5 w-5 text-emerald-500" />
                <span>{t("call")}</span>
              </a>
              <a
                href={`https://wa.me/91${worker.mobileNum}?text=Hello%20${worker.fullName},%20I%20found%20your%20agricultural%20worker%20profile%20on%20FarmLink!`}
                target="_blank"
                rel="noreferrer"
                className="rounded-2xl border border-emerald-500 bg-emerald-50 py-3.5 text-center text-sm font-bold text-emerald-800 hover:bg-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-300 flex items-center justify-center space-x-2 cursor-pointer"
              >
                <MessageSquare className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                <span>{t("whatsapp")}</span>
              </a>
            </div>
          </div>

          {/* Safety Disclaimer */}
          <div className="p-4 rounded-2xl bg-amber-50/40 border border-amber-100 dark:bg-amber-950/10 dark:border-amber-900/30 text-[10px] text-slate-400 leading-relaxed flex items-start space-x-2">
            <ShieldCheck className="h-4.5 w-4.5 text-emerald-500 shrink-0 mt-0.5" />
            <p>
              By utilizing direct calling or messaging, you directly negotiate wages and working parameters. FarmLink supports free labor mobility and acts purely as a direct GPS discovery matching tool.
            </p>
          </div>

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
export default WorkerProfilePage;
