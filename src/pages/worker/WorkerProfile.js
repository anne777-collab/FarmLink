// src/pages/worker/WorkerProfile.js
import React, { useState, useEffect } from "react";
import { signOut } from "firebase/auth";
import { auth } from "../../firebase/config";
import { getWorkerProfile, updateUser, updateWorkerProfile } from "../../firebase/firestore";
import { useAuth } from "../../context/AuthContext";
import { Button, Input, Select, Card } from "../../components/UI";
import { WORK_TYPES } from "../../utils/helpers";
import toast from "react-hot-toast";

export default function WorkerProfile() {
  const { userProfile, refreshProfile } = useAuth();
  const [worker, setWorker] = useState(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: "", address: "", workType: "cutting", wage: "" });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (userProfile) {
      setForm(f => ({ ...f, name: userProfile.name || "", address: userProfile.location?.address || "" }));
    }
    if (userProfile?.id) {
      getWorkerProfile(userProfile.id).then(w => {
        setWorker(w);
        if (w) setForm(f => ({ ...f, workType: w.workType || "cutting", wage: String(w.wage || "") }));
      });
    }
  }, [userProfile]);

  const save = async () => {
    if (!form.name.trim()) { toast.error("Name required"); return; }
    if (!form.wage) { toast.error("Wage required"); return; }
    setLoading(true);
    try {
      await updateUser(userProfile.id, {
        name: form.name.trim(),
        "location.address": form.address,
      });
      await updateWorkerProfile(userProfile.id, {
        workType: form.workType,
        wage: Number(form.wage),
      });
      await refreshProfile();
      setEditing(false);
      toast.success("Profile updated!");
    } catch (e) {
      toast.error("Update failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="px-5 py-6 pb-28">
      <h1 className="text-xl font-black text-gray-800 mb-5">My Profile</h1>

      {/* Avatar */}
      <div className="flex flex-col items-center mb-6">
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center mb-3 shadow-lg shadow-blue-200">
          <span className="text-3xl font-black text-white">
            {userProfile?.name?.[0]?.toUpperCase()}
          </span>
        </div>
        <h2 className="text-xl font-bold text-gray-800">{userProfile?.name}</h2>
        <p className="text-gray-500 text-sm">{userProfile?.phone}</p>
        <p className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-semibold mt-2">
          👷 Worker — Always Free
        </p>
      </div>

      {/* Stats */}
      {worker && (
        <div className="grid grid-cols-3 gap-3 mb-5">
          <Card className="text-center py-3">
            <div className="text-xl font-black text-yellow-500">
              {worker.rating > 0 ? worker.rating.toFixed(1) : "—"}
            </div>
            <p className="text-xs text-gray-500 mt-0.5">Rating</p>
          </Card>
          <Card className="text-center py-3">
            <div className="text-xl font-black text-green-600">{worker.totalJobs || 0}</div>
            <p className="text-xs text-gray-500 mt-0.5">Jobs Done</p>
          </Card>
          <Card className="text-center py-3">
            <div className="text-xl font-black text-blue-600">₹{worker.wage}</div>
            <p className="text-xs text-gray-500 mt-0.5">Per Day</p>
          </Card>
        </div>
      )}

      {/* Edit Form */}
      {editing ? (
        <Card className="mb-4">
          <h3 className="font-bold text-gray-700 mb-3">Edit Profile</h3>
          <div className="space-y-3">
            <Input label="Name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            <Input label="Location / Address" value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} />
            <Select label="Work Type" options={WORK_TYPES} value={form.workType} onChange={e => setForm(f => ({ ...f, workType: e.target.value }))} />
            <Input
              label="Daily Wage (₹)"
              type="number"
              inputMode="numeric"
              value={form.wage}
              onChange={e => setForm(f => ({ ...f, wage: e.target.value }))}
            />
            <div className="flex gap-2">
              <Button variant="secondary" size="md" onClick={() => setEditing(false)} className="flex-1">Cancel</Button>
              <Button variant="primary" size="md" onClick={save} loading={loading} className="flex-1">Save</Button>
            </div>
          </div>
        </Card>
      ) : (
        <Card className="mb-4">
          <div className="space-y-3">
            {[
              ["Name", userProfile?.name],
              ["Phone", userProfile?.phone],
              ["Location", userProfile?.location?.address || "Not set"],
              ["Work Type", WORK_TYPES.find(w => w.value === worker?.workType)?.label || worker?.workType],
              ["Daily Wage", worker ? `₹${worker.wage}/day` : "—"],
            ].map(([label, value]) => (
              <div key={label}>
                <p className="text-xs text-gray-500">{label}</p>
                <p className="font-semibold text-gray-800">{value}</p>
              </div>
            ))}
          </div>
          <Button variant="secondary" size="md" onClick={() => setEditing(true)} className="w-full mt-4">
            ✏️ Edit Profile
          </Button>
        </Card>
      )}

      <Button variant="danger" size="lg" onClick={() => signOut(auth)}>
        Logout / लॉग आउट
      </Button>
    </div>
  );
}
