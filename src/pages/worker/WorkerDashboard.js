// src/pages/worker/WorkerDashboard.js
import React, { useState, useEffect } from "react";
import {
  ToggleLeft, ToggleRight, Star, Briefcase,
  User, Home, Bell, Loader2, MapPin, IndianRupee, Wrench,
} from "lucide-react";
import { signOut } from "firebase/auth";
import { auth } from "../../firebase/config";
import {
  getProfileForRole,
  updateAvailability,
  updateWorkerProfile,
  updateUser,
  getPendingCountRealtime,
} from "../../firebase/firestore";
import { useAuth } from "../../context/AuthContext";
import { Card, Badge, Button, Input, Select, Spinner } from "../../components/UI";
import { WORK_TYPES, WORK_TYPE_MAP } from "../../utils/helpers";
import WorkerRequests from "./WorkerRequests";
import toast from "react-hot-toast";

// ─── Role guard — worker dashboard must ONLY mount for workers ────────────────
function useWorkerRole() {
  const { userProfile, loading } = useAuth();
  const isWorker = !loading && userProfile?.role === "worker";
  return { userProfile, loading, isWorker };
}

// ─────────────────────────────────────────────────────────────────────────────
// HOME TAB
// ─────────────────────────────────────────────────────────────────────────────
function HomeTab({ worker, setWorker, onNavigate, pendingCount, stats, userProfile }) {
  const [toggling, setToggling] = useState(false);

  const handleToggle = async () => {
    if (!worker || toggling) return;
    const next = !worker.availability;
    setToggling(true);
    try {
      await updateAvailability(userProfile.id, next);
      setWorker((w) => ({ ...w, availability: next }));
      toast.success(next ? "You are now Available" : "Status set to Busy");
    } catch (err) {
      toast.error("Could not update availability.");
      console.error("[HomeTab] toggleAvailability:", err);
    } finally {
      setToggling(false);
    }
  };

  const today = new Date().toLocaleDateString("en-IN", {
    weekday: "long", day: "numeric", month: "long",
  });

  return (
    <div className="px-5 py-6 pb-28 space-y-5">
      <div>
        <p className="text-gray-400 text-sm">{today}</p>
        <h1 className="text-2xl font-black text-gray-800 mt-0.5">
          Hello, {userProfile?.name?.split(" ")[0]} &#128075;
        </h1>
        <p className="text-gray-500 text-sm">Worker Dashboard</p>
      </div>

      {/* Availability toggle */}
      <button
        type="button"
        onClick={handleToggle}
        disabled={toggling}
        className={`w-full rounded-2xl p-5 flex items-center gap-4 shadow-lg
          active:scale-95 transition-all duration-200 text-left
          ${worker?.availability
            ? "bg-gradient-to-r from-green-500 to-emerald-600 shadow-green-200"
            : "bg-gradient-to-r from-gray-500 to-gray-600 shadow-gray-200"}`}>
        <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center flex-shrink-0">
          {toggling
            ? <Loader2 className="w-7 h-7 text-white animate-spin" />
            : worker?.availability
            ? <ToggleRight className="w-8 h-8 text-white" />
            : <ToggleLeft  className="w-8 h-8 text-white" />}
        </div>
        <div>
          <p className="font-black text-white text-lg leading-tight">
            {worker?.availability ? "Available for Work" : "Busy / Not Available"}
          </p>
          <p className="text-white/70 text-sm mt-0.5">
            {worker?.availability
              ? "Farmers can see and contact you"
              : "Tap to mark yourself as available"}
          </p>
        </div>
      </button>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Requests",  value: stats?.totalRequests ?? 0, color: "text-blue-600"   },
          { label: "Accepted",  value: stats?.accepted      ?? 0, color: "text-green-600"  },
          { label: "Completed", value: stats?.completed     ?? 0, color: "text-purple-600" },
        ].map(({ label, value, color }) => (
          <Card key={label} className="text-center py-4">
            <div className={`text-2xl font-black ${color}`}>{value}</div>
            <p className="text-gray-500 text-xs mt-1">{label}</p>
          </Card>
        ))}
      </div>

      {/* Work details */}
      {worker && (
        <Card>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-gray-700">My Work Details</h3>
            <button type="button" onClick={() => onNavigate("profile")}
              className="text-green-600 text-sm font-semibold">Edit</button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <InfoTile
              icon={<Wrench className="w-4 h-4 text-green-600" />}
              label="Work Type"
              value={WORK_TYPE_MAP[worker.workType]?.split("/")[0].trim() ?? worker.workType}
            />
            <InfoTile
              icon={<IndianRupee className="w-4 h-4 text-green-600" />}
              label="Daily Wage"
              value={`Rs. ${worker.wage}`}
              valueClass="text-green-700 font-bold"
            />
            {userProfile?.location?.address && (
              <InfoTile
                icon={<MapPin className="w-4 h-4 text-gray-400" />}
                label="Location"
                value={userProfile.location.address}
                className="col-span-2"
              />
            )}
            {(worker.rating ?? 0) > 0 && (
              <div className="col-span-2 bg-yellow-50 rounded-xl p-3 flex items-center gap-2">
                <Star className="w-5 h-5 fill-yellow-400 stroke-yellow-400" />
                <span className="font-bold text-gray-800">{worker.rating.toFixed(1)}</span>
                <span className="text-gray-500 text-sm">({worker.totalRatings ?? 0} ratings)</span>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Requests shortcut */}
      <button
        type="button"
        onClick={() => onNavigate("requests")}
        className="w-full bg-white rounded-2xl p-4 flex items-center gap-4
                   border border-gray-100 shadow-sm hover:shadow-md transition-shadow active:scale-95">
        <div className="w-11 h-11 bg-blue-100 rounded-xl flex items-center justify-center">
          <Briefcase className="w-6 h-6 text-blue-600" />
        </div>
        <div className="text-left flex-1">
          <p className="font-bold text-gray-800">View Job Requests</p>
          <p className="text-gray-400 text-xs">See all incoming requests</p>
        </div>
        {pendingCount > 0 && (
          <span className="bg-red-500 text-white text-xs font-bold w-6 h-6
                           rounded-full flex items-center justify-center">
            {pendingCount > 9 ? "9+" : pendingCount}
          </span>
        )}
        <span className="text-gray-300 text-xl">&#8250;</span>
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PROFILE TAB
// ─────────────────────────────────────────────────────────────────────────────
function ProfileTab({ worker, setWorker }) {
  const { userProfile, refreshProfile } = useAuth();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    name:     userProfile?.name ?? "",
    address:  userProfile?.location?.address ?? "",
    workType: worker?.workType ?? WORK_TYPES[0]?.value ?? "cutting",
    wage:     String(worker?.wage ?? ""),
  });
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!form.name.trim())    { toast.error("Name is required"); return; }
    const w = Number(form.wage);
    if (!form.wage || isNaN(w) || w <= 0) { toast.error("Enter a valid daily wage"); return; }
    setSaving(true);
    try {
      await updateUser(userProfile.id, {
        name: form.name.trim(),
        "location.address": form.address,
      });
      await updateWorkerProfile(userProfile.id, { workType: form.workType, wage: w });
      await refreshProfile();
      setWorker((prev) => ({ ...prev, workType: form.workType, wage: w }));
      setEditing(false);
      toast.success("Profile updated!");
    } catch (err) {
      toast.error("Update failed. Please try again.");
      console.error("[ProfileTab] save:", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="px-5 py-6 pb-28">
      <h1 className="text-xl font-black text-gray-800 mb-5">My Profile</h1>

      <div className="flex flex-col items-center mb-6">
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-blue-400 to-indigo-600
                        flex items-center justify-center mb-3 shadow-lg shadow-blue-200">
          <span className="text-3xl font-black text-white">
            {userProfile?.name?.[0]?.toUpperCase() ?? "?"}
          </span>
        </div>
        <h2 className="text-xl font-bold text-gray-800">{userProfile?.name}</h2>
        <p className="text-gray-500 text-sm">{userProfile?.phone}</p>
        <div className="mt-2 flex gap-2">
          <Badge color="blue">Worker — Always Free</Badge>
          <Badge color={worker?.availability ? "green" : "gray"}>
            {worker?.availability ? "Available" : "Busy"}
          </Badge>
        </div>
      </div>

      {worker && (
        <div className="grid grid-cols-3 gap-3 mb-5">
          <Card className="text-center py-3">
            <div className="text-xl font-black text-yellow-500">
              {(worker.rating ?? 0) > 0 ? worker.rating.toFixed(1) : "—"}
            </div>
            <p className="text-xs text-gray-500 mt-0.5">Rating</p>
          </Card>
          <Card className="text-center py-3">
            <div className="text-xl font-black text-green-600">{worker.totalJobs ?? 0}</div>
            <p className="text-xs text-gray-500 mt-0.5">Jobs Done</p>
          </Card>
          <Card className="text-center py-3">
            <div className="text-xl font-black text-blue-600">Rs.{worker.wage}</div>
            <p className="text-xs text-gray-500 mt-0.5">Per Day</p>
          </Card>
        </div>
      )}

      {editing ? (
        <Card className="mb-4 space-y-4">
          <h3 className="font-bold text-gray-700">Edit Profile</h3>
          <Input label="Name" value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          <Input label="Location / Address" value={form.address}
            onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} />
          <Select label="Work Type" options={WORK_TYPES} value={form.workType}
            onChange={(e) => setForm((f) => ({ ...f, workType: e.target.value }))} />
          <Input label="Daily Wage (Rs.)" type="number" inputMode="numeric"
            value={form.wage}
            onChange={(e) => setForm((f) => ({ ...f, wage: e.target.value }))} />
          <div className="flex gap-2">
            <Button variant="secondary" size="md" onClick={() => setEditing(false)} className="flex-1">Cancel</Button>
            <Button variant="primary"   size="md" onClick={save} loading={saving}   className="flex-1">Save</Button>
          </div>
        </Card>
      ) : (
        <Card className="mb-4">
          <div className="space-y-3">
            {[
              ["Name",       userProfile?.name],
              ["Phone",      userProfile?.phone],
              ["Location",   userProfile?.location?.address || "Not set"],
              ["Work Type",  WORK_TYPES.find((wt) => wt.value === worker?.workType)?.label ?? worker?.workType],
              ["Daily Wage", worker ? `Rs. ${worker.wage}/day` : "—"],
            ].map(([label, value]) => (
              <div key={label}>
                <p className="text-xs text-gray-500">{label}</p>
                <p className="font-semibold text-gray-800 text-sm">{value}</p>
              </div>
            ))}
          </div>
          <Button variant="secondary" size="md" onClick={() => setEditing(true)} className="w-full mt-4">
            &#9998; Edit Profile
          </Button>
        </Card>
      )}

      <Button variant="danger" size="lg" onClick={() => signOut(auth)}>
        Logout
      </Button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// BOTTOM NAV
// ─────────────────────────────────────────────────────────────────────────────
const NAV_TABS = [
  { id: "home",     label: "Home",     Icon: Home },
  { id: "requests", label: "Requests", Icon: Bell },
  { id: "profile",  label: "Profile",  Icon: User },
];

function BottomNav({ active, onChange, pendingCount }) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40">
      <div className="flex max-w-md mx-auto">
        {NAV_TABS.map(({ id, label, Icon }) => {
          const isActive = active === id;
          return (
            <button key={id} type="button" onClick={() => onChange(id)}
              className={`flex-1 flex flex-col items-center py-3 relative transition-colors
                ${isActive ? "text-green-600" : "text-gray-400 hover:text-gray-600"}`}>
              <Icon className={`w-6 h-6 ${isActive ? "stroke-2" : ""}`} />
              <span className={`text-xs mt-1 ${isActive ? "font-bold" : ""}`}>{label}</span>
              {id === "requests" && pendingCount > 0 && (
                <span className="absolute top-1.5 right-[calc(50%-18px)]
                                 bg-red-500 text-white text-[10px] font-black
                                 min-w-[18px] h-[18px] px-1 rounded-full
                                 flex items-center justify-center ring-2 ring-white">
                  {pendingCount > 9 ? "9+" : pendingCount}
                </span>
              )}
              {isActive && (
                <span className="absolute bottom-0 w-8 h-0.5 bg-green-600 rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SHARED HELPER
// ─────────────────────────────────────────────────────────────────────────────
function InfoTile({ icon, label, value, valueClass = "font-semibold text-sm text-gray-800", className = "" }) {
  return (
    <div className={`bg-gray-50 rounded-xl p-2.5 ${className}`}>
      {icon && <span className="block mb-0.5">{icon}</span>}
      <p className="text-xs text-gray-500">{label}</p>
      <p className={valueClass}>{value}</p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN EXPORT
// ─────────────────────────────────────────────────────────────────────────────
export default function WorkerDashboard() {
  const { userProfile, isWorker, loading } = useWorkerRole();

  const [tab,          setTab]         = useState("home");
  const [worker,       setWorker]      = useState(null);
  const [stats,        setStats]       = useState({});
  const [pendingCount, setPending]     = useState(0);
  const [initLoading,  setInitLoading] = useState(true);

  // ── Guard: bail out immediately if not a worker ────────────────────────────
  // App.js routes only workers here, but this is the secondary safety net.
  // We wait for loading to resolve before deciding — prevents flicker.
  useEffect(() => {
    if (loading) return;
    if (!isWorker) {
      setInitLoading(false); // stop spinner; App.js will re-route
    }
  }, [loading, isWorker]);

  // ── Fetch worker profile — only when confirmed worker ─────────────────────
  useEffect(() => {
    if (!userProfile?.id || !isWorker) return;

    let cancelled = false;
    setInitLoading(true);

    getProfileForRole(userProfile.id, "worker")
      .then((w) => {
        if (cancelled) return;
        setWorker(w ?? null);
        // Only show the "not found" toast for genuine workers with missing docs
        if (!w) {
          console.warn("[WorkerDashboard] worker profile not found for uid:", userProfile.id);
        }
      })
      .catch((err) => {
        if (cancelled) return;
        console.error("[WorkerDashboard] init:", err);
      })
      .finally(() => {
        if (!cancelled) setInitLoading(false);
      });

    return () => { cancelled = true; };
  }, [userProfile?.id, isWorker]);

  // ── Real-time pending badge ────────────────────────────────────────────────
  useEffect(() => {
    if (!userProfile?.id || !isWorker) return;

    const unsub = getPendingCountRealtime(
      userProfile.id,
      (count) => setPending(count),
      (err)   => console.error("[WorkerDashboard] pendingCount:", err)
    );
    return () => unsub();
  }, [userProfile?.id, isWorker]);

  // ── Loading states ─────────────────────────────────────────────────────────
  if (loading || initLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-5xl mb-4">&#127807;</div>
          <Spinner size="lg" />
          <p className="mt-3 text-green-700 font-medium">Loading dashboard…</p>
        </div>
      </div>
    );
  }

  // ── Final role guard ───────────────────────────────────────────────────────
  if (!isWorker) return null; // App.js is already re-routing

  const renderTab = () => {
    switch (tab) {
      case "home":
        return (
          <HomeTab
            worker={worker}
            setWorker={setWorker}
            onNavigate={setTab}
            pendingCount={pendingCount}
            stats={stats}
            userProfile={userProfile}
          />
        );
      case "requests":
        return (
          <WorkerRequests
            workerId={userProfile.id}
            onStatsChange={(s) => setStats((prev) => ({ ...prev, ...s }))}
          />
        );
      case "profile":
        return <ProfileTab worker={worker} setWorker={setWorker} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-md mx-auto relative min-h-screen">
        {renderTab()}
        <BottomNav
          active={tab}
          onChange={setTab}
          pendingCount={pendingCount}
        />
      </div>
    </div>
  );
}