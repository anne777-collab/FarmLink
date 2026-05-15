import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext";
import { useApp } from "../context/AppContext";
import { Toast } from "../components/Toast";
import { Sprout, IndianRupee, Calendar, Users, AlertCircle, CheckCircle, ArrowLeft, Clock, MapPin, FileText } from "lucide-react";

export const JobPostingPage: React.FC = () => {
  const { t } = useLanguage();
  const { user, postNewJob } = useApp();
  const navigate = useNavigate();

  const [workType, setWorkType] = useState("Wheat Cutting");
  const [workersNeeded, setWorkersNeeded] = useState<number>(3);
  const [wageOffered, setWageOffered] = useState<number>(450);
  const [dateOfWork, setDateOfWork] = useState("");
  const [workTime, setWorkTime] = useState("");
  const [description, setDescription] = useState("");
  const [village, setVillage] = useState(user?.village || "");
  const [district, setDistrict] = useState(user?.district || "");
  const [state, setState] = useState(user?.state || "");
  const [notes, setNotes] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);

  if (!user) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (!description.trim() || !dateOfWork || !workTime || !village.trim() || !district.trim() || !state.trim()) {
      setError("Please complete description, date, time, and location before posting.");
      setLoading(false);
      return;
    }

    if (workersNeeded <= 0 || wageOffered <= 0) {
      setError("Please enter valid worker count and daily wages.");
      setLoading(false);
      return;
    }

    try {
      await postNewJob({
        title: `${workType} workers needed`,
        workType,
        description: description.trim(),
        workersNeeded: Number(workersNeeded),
        wage: Number(wageOffered),
        wageOffered: Number(wageOffered),
        village: village.trim(),
        district: district.trim(),
        state: state.trim(),
        pincode: user.pincode || "123401",
        latitude: user.latitude || 28.2044,
        longitude: user.longitude || 76.6155,
        workDate: dateOfWork,
        workTime,
        dateTime: dateOfWork,
        additionalNotes: notes || "No specific details provided.",
        notes: notes || "No specific details provided.",
      });

      setToast({
        message: "Work request posted. Nearby workers can now apply in real time.",
        type: "success"
      });

      // Navigate back after small delay
      setTimeout(() => {
        navigate("/farmer-dashboard");
      }, 1500);

    } catch (err: any) {
      setError(err.message || "Failed to post job.");
    } finally {
      setLoading(false);
    }
  };

  const workTypesList = [
    "Wheat Cutting", "Rice Planting", "Harvesting", "Tractor Driving", "Pesticide Spraying", "Irrigation Work"
  ];

  return (
    <div className="min-h-screen bg-slate-50 py-12 dark:bg-slate-950 transition-colors duration-300">
      <div className="mx-auto max-w-2xl px-4">
        
        {/* Back Link */}
        <button
          onClick={() => navigate(-1)}
          className="mb-6 flex items-center space-x-1 text-xs font-bold text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Dashboard</span>
        </button>

        {/* Card Box */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-xl space-y-6">
          
          <div className="space-y-1">
            <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center space-x-2">
              <Sprout className="h-6 w-6 text-emerald-600" />
              <span>{t("postJobTitle")}</span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {t("postJobSub")}
            </p>
          </div>

          <div className="rounded-3xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-lime-50 p-5 text-xs text-emerald-900 dark:border-emerald-900/30 dark:from-emerald-950/20 dark:to-lime-950/10 dark:text-emerald-200">
            <p className="font-black uppercase tracking-wider">Professional job lifecycle</p>
            <p className="mt-1 text-emerald-800/80 dark:text-emerald-200/70">After posting, workers apply, you review applications, accept one worker, track start/completion, and rate after the job is done.</p>
          </div>

          {error && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 dark:border-rose-900/30 dark:bg-rose-950/20 text-xs text-rose-800 dark:text-rose-400 flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5 text-slate-700 dark:text-slate-300">
            
            {/* Work Type */}
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                {t("workType")}
              </label>
              <select
                value={workType}
                onChange={(e) => setWorkType(e.target.value)}
                className="block w-full rounded-2xl border border-slate-200 py-3.5 px-4 text-sm bg-white dark:border-slate-800 dark:bg-slate-950 text-slate-900 dark:text-white focus:border-emerald-500 focus:outline-none"
              >
                {workTypesList.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Description
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute left-3 top-4">
                  <FileText className="h-4.5 w-4.5 text-slate-400" />
                </div>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  required
                  placeholder="Describe the crop, field size, tools needed, and expected work."
                  className="block w-full rounded-2xl border border-slate-200 py-3.5 pl-10 pr-4 text-sm bg-white dark:border-slate-800 dark:bg-slate-950 text-slate-900 dark:text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              
              {/* Workers Needed */}
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  {t("workersNeededCount")}
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <Users className="h-4.5 w-4.5 text-slate-400" />
                  </div>
                  <input
                    type="number"
                    min={1}
                    required
                    value={workersNeeded}
                    onChange={(e) => setWorkersNeeded(Number(e.target.value))}
                    className="block w-full rounded-2xl border border-slate-200 py-3.5 pl-10 pr-4 text-sm bg-white dark:border-slate-800 dark:bg-slate-950 text-slate-900 dark:text-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Wage Offered */}
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  {t("dailyWage")}
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <IndianRupee className="h-4 w-4 text-slate-400" />
                  </div>
                  <input
                    type="number"
                    min={100}
                    required
                    value={wageOffered}
                    onChange={(e) => setWageOffered(Number(e.target.value))}
                    className="block w-full rounded-2xl border border-slate-200 py-3.5 pl-10 pr-4 text-sm bg-white dark:border-slate-800 dark:bg-slate-950 text-slate-900 dark:text-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  {t("dateOfWork")}
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <Calendar className="h-4.5 w-4.5 text-slate-400" />
                  </div>
                  <input
                    type="date"
                    required
                    value={dateOfWork}
                    onChange={(e) => setDateOfWork(e.target.value)}
                    className="block w-full rounded-2xl border border-slate-200 py-3.5 pl-10 pr-4 text-sm bg-white dark:border-slate-800 dark:bg-slate-950 text-slate-900 dark:text-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Work Time
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <Clock className="h-4.5 w-4.5 text-slate-400" />
                  </div>
                  <input
                    type="time"
                    required
                    value={workTime}
                    onChange={(e) => setWorkTime(e.target.value)}
                    className="block w-full rounded-2xl border border-slate-200 py-3.5 pl-10 pr-4 text-sm bg-white dark:border-slate-800 dark:bg-slate-950 text-slate-900 dark:text-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-3 rounded-3xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/40">
              <label className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                <MapPin className="h-4 w-4 text-rose-500" />
                <span>Job Location</span>
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <input value={village} onChange={(e) => setVillage(e.target.value)} placeholder="Village" className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-white" />
                <input value={district} onChange={(e) => setDistrict(e.target.value)} placeholder="District" className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-white" />
                <input value={state} onChange={(e) => setState(e.target.value)} placeholder="State" className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-white" />
              </div>
              <p className="text-[10px] text-slate-400">GPS coordinates are preserved from your existing location system and attached automatically.</p>
            </div>

            {/* Additional instruction details */}
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                {t("additionalNotes")}
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="e.g. Bring your own sickles. Food and water will be provided on the farm."
                className="block w-full rounded-2xl border border-slate-200 p-4 text-sm bg-white dark:border-slate-800 dark:bg-slate-950 text-slate-900 dark:text-white focus:border-emerald-500 focus:outline-none"
              ></textarea>
            </div>

            {/* Verified Location Banner */}
            <div className="bg-emerald-50 dark:bg-emerald-950/25 border border-emerald-100 dark:border-emerald-900/30 rounded-2xl p-4 text-xs space-y-1 flex items-start space-x-2.5">
              <CheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-emerald-800 dark:text-emerald-300">Automatic Location Tag Attached</span>
                <p className="text-slate-500 dark:text-slate-400 mt-0.5">
                  Your job post will be visible specifically to workers near <strong>{user.village}, {user.state}</strong>.
                </p>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center rounded-2xl bg-gradient-to-r from-emerald-600 to-green-600 py-3.5 text-sm font-bold text-white shadow-md shadow-emerald-500/10 hover:from-emerald-500 hover:to-green-500 disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
              ) : (
                t("submitJob")
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
export default JobPostingPage;
