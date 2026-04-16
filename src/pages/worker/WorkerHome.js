// src/pages/worker/WorkerHome.js
import React, { useState, useEffect } from "react";
import { ToggleLeft, ToggleRight, Star, Briefcase, TrendingUp } from "lucide-react";
import { getWorkerProfile, updateWorkerProfile } from "../../firebase/firestore";
import { useAuth } from "../../context/AuthContext";
import { Card, Badge, Spinner } from "../../components/UI";
import { WORK_TYPE_MAP } from "../../utils/helpers";
import toast from "react-hot-toast";

export default function WorkerHome({ onNavigate, stats }) {
  const { userProfile } = useAuth();
  const [worker, setWorker] = useState(null);
  const [toggling, setToggling] = useState(false);

  useEffect(() => {
    if (userProfile?.id) {
      getWorkerProfile(userProfile.id).then(setWorker);
    }
  }, [userProfile]);

  const toggleAvailability = async () => {
    if (!worker) return;
    setToggling(true);
    try {
      await updateWorkerProfile(userProfile.id, { availability: !worker.availability });
      setWorker(w => ({ ...w, availability: !w.availability }));
      toast.success(worker.availability ? "Status: Busy" : "Status: Available ✓");
    } catch (e) {
      toast.error("Failed to update status");
    } finally {
      setToggling(false);
    }
  };

  const today = new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" });

  return (
    <div className="px-5 py-6 pb-28">
      {/* Header */}
      <div className="mb-5">
        <p className="text-gray-500 text-sm">{today}</p>
        <h1 className="text-2xl font-black text-gray-800 mt-0.5">
          नमस्ते, {userProfile?.name?.split(" ")[0]} 👋
        </h1>
        <p className="text-gray-500 text-sm">Welcome to FarmLink Worker Dashboard</p>
      </div>

      {/* Availability Toggle */}
      {worker ? (
        <div
          onClick={toggleAvailability}
          className={`w-full rounded-2xl p-5 flex items-center gap-4 shadow-lg mb-5 cursor-pointer active:scale-95 transition-all
            ${worker.availability
              ? "bg-gradient-to-r from-green-500 to-emerald-600 shadow-green-200"
              : "bg-gradient-to-r from-gray-500 to-gray-600 shadow-gray-200"}`}>
          <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center flex-shrink-0">
            {toggling ? (
              <div className="w-8 h-8 border-3 border-white rounded-full animate-spin border-t-transparent" />
            ) : worker.availability ? (
              <ToggleRight className="w-8 h-8 text-white" />
            ) : (
              <ToggleLeft className="w-8 h-8 text-white" />
            )}
          </div>
          <div>
            <p className="font-black text-white text-lg">
              {worker.availability ? "✓ Available for Work" : "Busy / Not Available"}
            </p>
            <p className="text-white/70 text-sm">
              {worker.availability ? "Farmers can see and contact you" : "Tap to mark as available"}
            </p>
          </div>
        </div>
      ) : (
        <div className="h-24 bg-gray-100 rounded-2xl animate-pulse mb-5" />
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        <Card className="text-center py-4">
          <div className="text-2xl font-black text-blue-600">{stats?.totalRequests || 0}</div>
          <p className="text-gray-500 text-xs mt-1">Requests</p>
        </Card>
        <Card className="text-center py-4">
          <div className="text-2xl font-black text-green-600">{stats?.accepted || 0}</div>
          <p className="text-gray-500 text-xs mt-1">Accepted</p>
        </Card>
        <Card className="text-center py-4">
          <div className="text-2xl font-black text-purple-600">{stats?.completed || 0}</div>
          <p className="text-gray-500 text-xs mt-1">Completed</p>
        </Card>
      </div>

      {/* Worker Info */}
      {worker && (
        <Card className="mb-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-gray-700">My Work Details</h3>
            <button onClick={() => onNavigate("profile")} className="text-green-600 text-sm font-semibold">
              Edit
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-green-50 rounded-xl p-3">
              <p className="text-xs text-gray-500">Work Type</p>
              <p className="font-semibold text-sm text-gray-800 mt-0.5">
                {WORK_TYPE_MAP[worker.workType]?.split("/")[0].trim() || worker.workType}
              </p>
            </div>
            <div className="bg-green-50 rounded-xl p-3">
              <p className="text-xs text-gray-500">Daily Wage</p>
              <p className="font-bold text-green-700 text-lg">₹{worker.wage}</p>
            </div>
            {worker.rating > 0 && (
              <div className="bg-yellow-50 rounded-xl p-3 col-span-2">
                <p className="text-xs text-gray-500">Rating</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <Star className="w-5 h-5 fill-yellow-400 stroke-yellow-400" />
                  <span className="font-bold text-gray-800">{worker.rating.toFixed(1)}</span>
                  <span className="text-gray-500 text-sm">({worker.totalJobs || 0} jobs)</span>
                </div>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Go to Requests */}
      <button
        onClick={() => onNavigate("requests")}
        className="w-full bg-white rounded-2xl p-4 flex items-center gap-4 border border-gray-100 shadow-sm hover:shadow-md transition-shadow active:scale-95">
        <div className="w-11 h-11 bg-blue-100 rounded-xl flex items-center justify-center">
          <Briefcase className="w-6 h-6 text-blue-600" />
        </div>
        <div className="text-left flex-1">
          <p className="font-bold text-gray-800">View Job Requests</p>
          <p className="text-gray-400 text-xs">See all incoming job requests</p>
        </div>
        {stats?.pending > 0 && (
          <span className="bg-red-500 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center">
            {stats.pending}
          </span>
        )}
        <span className="text-gray-300 text-xl">›</span>
      </button>
    </div>
  );
}
