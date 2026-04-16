// src/App.js
import React, { useState, useEffect } from "react";
import { Toaster } from "react-hot-toast";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { PageLoader } from "./components/UI";
import LoginPage from "./pages/LoginPage";
import SetupPage from "./pages/SetupPage";
import FarmerDashboard from "./pages/farmer/FarmerDashboard";
import WorkerDashboard from "./pages/worker/WorkerDashboard";

// ─── Role guard hooks ─────────────────────────────────────────────────────────
// These are consumed by child dashboards as a secondary safety net,
// but the primary gate is in AppRouter below.
export function useFarmerGuard() {
  const { userProfile, loading } = useAuth();
  return { allowed: !loading && userProfile?.role === "farmer", loading };
}
export function useWorkerGuard() {
  const { userProfile, loading } = useAuth();
  return { allowed: !loading && userProfile?.role === "worker", loading };
}

// ─── Router ───────────────────────────────────────────────────────────────────
function AppRouter() {
  const { currentUser, userProfile, loading } = useAuth();
  const [pendingUid, setPendingUid] = useState(null);

  // Once profile is set, clear pendingUid so we don't stay on SetupPage
  useEffect(() => {
    if (userProfile && pendingUid) setPendingUid(null);
  }, [userProfile, pendingUid]);

  // 1. Auth state not yet resolved — show full-screen loader, no flicker
  if (loading) return <PageLoader />;

  // 2. Not authenticated
  if (!currentUser) {
    return <LoginPage onNeedProfile={(uid) => setPendingUid(uid)} />;
  }

  // 3. Authenticated but no Firestore profile yet (new user or pending write)
  if (pendingUid || !userProfile) {
    return <SetupPage uid={pendingUid ?? currentUser.uid} />;
  }

  // 4. Phone guard — Google/Email users who haven't saved a phone yet
  // Phone-OTP users always have a phone (verified by Firebase Auth).
  // Google/Email users must add it; SetupPage handles this via requirePhoneOnly prop.
  if (!userProfile.phone) {
    return <SetupPage uid={currentUser.uid} requirePhoneOnly />;
  }

  // 5. Strict role routing — each dashboard only ever mounts for its role
  if (userProfile.role === "farmer") return <FarmerDashboard />;
  if (userProfile.role === "worker") return <WorkerDashboard />;

  // 6. Authenticated + profile exists but unknown role → re-setup
  return <SetupPage uid={currentUser.uid} />;
}

export default function App() {
  return (
    <AuthProvider>
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 3500,
          style: {
            borderRadius: "12px",
            fontWeight: "600",
            fontSize: "14px",
            maxWidth: "340px",
          },
          success: { style: { background: "#16a34a", color: "#fff" } },
          error:   { style: { background: "#dc2626", color: "#fff" } },
        }}
      />
      <AppRouter />
    </AuthProvider>
  );
}