import React from "react";
import { Navigate } from "react-router-dom";
import { useApp } from "../context/AppContext";

interface ProtectedRouteProps {
  children: React.ReactElement;
  allowedRole?: "farmer" | "worker";
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRole }) => {
  const { user, loading } = useApp();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="flex flex-col items-center space-y-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent"></div>
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Loading FarmLink...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    // Not logged in
    return <Navigate to="/login" replace />;
  }

  if (!user.profileCompleted) {
    // Logged in but registration incomplete
    return <Navigate to="/registration" replace />;
  }

  if (allowedRole && user.role !== allowedRole) {
    // Logged in but accessing wrong role dashboard
    return <Navigate to={user.role === "farmer" ? "/farmer-dashboard" : "/worker-dashboard"} replace />;
  }

  return children;
};
export default ProtectedRoute;
