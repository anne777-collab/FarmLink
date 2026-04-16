// src/pages/farmer/FarmerDashboard.js
import React, { useState, useEffect } from "react";
import BottomNav from "../../components/BottomNav";
import FarmerHome from "./FarmerHome";
import SearchWorkers from "./SearchWorkers";
import FarmerJobs from "./FarmerJobs";
import FarmerProfile from "./FarmerProfile";
import { getFarmerRequestsRealtime } from "../../firebase/firestore";
import { useAuth } from "../../context/AuthContext";
import { Spinner } from "../../components/UI";

export default function FarmerDashboard() {
  const { userProfile, loading } = useAuth();
  const [tab,   setTab]   = useState("home");
  const [stats, setStats] = useState({
    totalRequests: 0, pending: 0, accepted: 0, completed: 0,
  });

  // ── Guard: only farmers run this dashboard ─────────────────────────────────
  const isFarmer = !loading && userProfile?.role === "farmer";

  // ── Real-time stats — only subscribe when confirmed farmer ─────────────────
  useEffect(() => {
    if (!isFarmer || !userProfile?.id) return;

    const unsub = getFarmerRequestsRealtime(
      userProfile.id,
      (jobs) => {
        setStats({
          totalRequests: jobs.length,
          pending:       jobs.filter((j) => j.status === "pending").length,
          accepted:      jobs.filter((j) => j.status === "accepted").length,
          completed:     jobs.filter((j) => j.status === "completed").length,
        });
      },
      (err) => console.error("[FarmerDashboard] stats listener:", err)
    );
    return () => unsub();
  }, [isFarmer, userProfile?.id]);

  // ── Loading / guard render ─────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Spinner size="lg" />
      </div>
    );
  }

  // App.js already routes only farmers here, but defend in depth
  if (!isFarmer) return null;

  const renderTab = () => {
    switch (tab) {
      case "home":    return <FarmerHome    onNavigate={setTab} stats={stats} />;
      case "search":  return <SearchWorkers />;
      case "jobs":    return <FarmerJobs    farmerId={userProfile.id} />;
      case "profile": return <FarmerProfile />;
      default:        return <FarmerHome    onNavigate={setTab} stats={stats} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-md mx-auto relative min-h-screen">
        {renderTab()}
        <BottomNav role="farmer" active={tab} onChange={setTab} />
      </div>
    </div>
  );
}