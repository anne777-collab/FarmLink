// src/pages/farmer/FarmerHome.js
import React, { useState } from "react";
import { Zap, Users, Briefcase, TrendingUp } from "lucide-react";
import { sendEmergencyBroadcast } from "../../firebase/firestore";
import { useAuth } from "../../context/AuthContext";
import { Button, Card, Modal, Input } from "../../components/UI";
import toast from "react-hot-toast";

export default function FarmerHome({ onNavigate, stats }) {
  const { userProfile } = useAuth();
  const [emergencyModal, setEmergencyModal] = useState(false);
  const [eForm, setEForm] = useState({ date: "", workersNeeded: 1, offeredWage: "", workDescription: "" });
  const [loading, setLoading] = useState(false);

  const sendEmergency = async () => {
    if (!eForm.offeredWage || !eForm.date) { toast.error("Fill all fields"); return; }
    setLoading(true);
    try {
      const count = await sendEmergencyBroadcast(userProfile.id, {
        date: eForm.date,
        workersNeeded: Number(eForm.workersNeeded),
        offeredWage: Number(eForm.offeredWage),
        workDescription: eForm.workDescription,
      });
      toast.success(`Emergency request sent to ${count} workers!`);
      setEmergencyModal(false);
    } catch (e) {
      toast.error("Failed to send broadcast");
    } finally {
      setLoading(false);
    }
  };

  const today = new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" });

  return (
    <div className="px-5 py-6 pb-28">
      {/* Header */}
      <div className="mb-6">
        <p className="text-gray-500 text-sm">{today}</p>
        <h1 className="text-2xl font-black text-gray-800 mt-0.5">
          नमस्ते, {userProfile?.name?.split(" ")[0]} 👋
        </h1>
        <p className="text-gray-500 text-sm">Welcome to FarmLink Farmer Dashboard</p>
      </div>

      {/* Emergency Button */}
      <button
        onClick={() => setEmergencyModal(true)}
        className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-2xl p-5 flex items-center gap-4 shadow-lg shadow-orange-200 mb-6 active:scale-95 transition-transform">
        <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
          <Zap className="w-7 h-7 text-white" />
        </div>
        <div className="text-left">
          <p className="font-black text-lg leading-tight">Emergency Hiring</p>
          <p className="text-orange-100 text-sm">आपातकालीन भर्ती — Broadcast to all available workers</p>
        </div>
      </button>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <Card className="text-center py-5">
          <div className="text-3xl font-black text-green-600">{stats?.totalRequests || 0}</div>
          <p className="text-gray-500 text-sm mt-1">Total Requests</p>
        </Card>
        <Card className="text-center py-5">
          <div className="text-3xl font-black text-blue-600">{stats?.accepted || 0}</div>
          <p className="text-gray-500 text-sm mt-1">Accepted</p>
        </Card>
        <Card className="text-center py-5">
          <div className="text-3xl font-black text-purple-600">{stats?.completed || 0}</div>
          <p className="text-gray-500 text-sm mt-1">Completed Jobs</p>
        </Card>
        <Card className="text-center py-5">
          <div className="text-3xl font-black text-orange-600">{stats?.pending || 0}</div>
          <p className="text-gray-500 text-sm mt-1">Pending</p>
        </Card>
      </div>

      {/* Quick Actions */}
      <h2 className="font-bold text-gray-700 mb-3">Quick Actions</h2>
      <div className="space-y-3">
        <button
          onClick={() => onNavigate("search")}
          className="w-full bg-white rounded-2xl p-4 flex items-center gap-4 border border-gray-100 shadow-sm hover:shadow-md transition-shadow active:scale-95">
          <div className="w-11 h-11 bg-green-100 rounded-xl flex items-center justify-center">
            <Users className="w-6 h-6 text-green-600" />
          </div>
          <div className="text-left">
            <p className="font-bold text-gray-800">Search Workers / मजदूर खोजें</p>
            <p className="text-gray-400 text-xs">Find workers near your location</p>
          </div>
          <span className="ml-auto text-gray-300 text-xl">›</span>
        </button>

        <button
          onClick={() => onNavigate("jobs")}
          className="w-full bg-white rounded-2xl p-4 flex items-center gap-4 border border-gray-100 shadow-sm hover:shadow-md transition-shadow active:scale-95">
          <div className="w-11 h-11 bg-blue-100 rounded-xl flex items-center justify-center">
            <Briefcase className="w-6 h-6 text-blue-600" />
          </div>
          <div className="text-left">
            <p className="font-bold text-gray-800">My Job Requests</p>
            <p className="text-gray-400 text-xs">View all sent requests</p>
          </div>
          <span className="ml-auto text-gray-300 text-xl">›</span>
        </button>
      </div>

      {/* Emergency Modal */}
      <Modal open={emergencyModal} onClose={() => setEmergencyModal(false)} title="🚨 Emergency Hiring">
        <p className="text-sm text-gray-500 mb-4">
          This will broadcast your request to all available workers nearby.
        </p>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Date Required</label>
            <input
              type="date"
              value={eForm.date}
              min={new Date().toISOString().split("T")[0]}
              onChange={(e) => setEForm(f => ({ ...f, date: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-green-400 outline-none text-base"
            />
          </div>
          <Input
            label="Number of Workers"
            type="number"
            inputMode="numeric"
            value={eForm.workersNeeded}
            onChange={(e) => setEForm(f => ({ ...f, workersNeeded: e.target.value }))}
            min={1}
          />
          <Input
            label="Offered Wage per day (₹)"
            type="number"
            inputMode="numeric"
            placeholder="e.g. 500"
            value={eForm.offeredWage}
            onChange={(e) => setEForm(f => ({ ...f, offeredWage: e.target.value }))}
          />
          <Input
            label="Work Description (optional)"
            placeholder="Wheat harvesting, 2 acres..."
            value={eForm.workDescription}
            onChange={(e) => setEForm(f => ({ ...f, workDescription: e.target.value }))}
          />
          <Button variant="orange" size="lg" onClick={sendEmergency} loading={loading}>
            🚨 Send Emergency Broadcast
          </Button>
        </div>
      </Modal>
    </div>
  );
}
