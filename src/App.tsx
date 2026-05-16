import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "./context/ThemeContext";
import { LanguageProvider } from "./context/LanguageContext";
import { AppProvider, useApp } from "./context/AppContext";

// Reusable Navigation Layout
import { Navbar } from "./components/Navbar";
import { Footer } from "./components/Footer";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { PWAInstallPrompt } from "./components/PWAInstallPrompt";
import { LiveNotificationToast } from "./components/LiveNotificationToast";

// Page Components
import { LandingPage } from "./pages/LandingPage";
import { LoginPage } from "./pages/LoginPage";
import { RoleSelectionPage } from "./pages/RoleSelectionPage";
import { RegistrationPage } from "./pages/RegistrationPage";
import { WorkerDashboard } from "./pages/WorkerDashboard";
import { FarmerDashboard } from "./pages/FarmerDashboard";
import { NearbyWorkersPage } from "./pages/NearbyWorkersPage";
import { JobPostingPage } from "./pages/JobPostingPage";
import { EmergencyHiringPage } from "./pages/EmergencyHiringPage";
import { WorkerProfilePage } from "./pages/WorkerProfilePage";
import { FarmerProfilePage } from "./pages/FarmerProfilePage";
import { NotificationsPage } from "./pages/NotificationsPage";
import { SubscriptionPage } from "./pages/SubscriptionPage";
import { SettingsPage } from "./pages/SettingsPage";
import { HelpPage } from "./pages/HelpPage";
import { AdminSecretPanel } from "./pages/AdminSecretPanel";

// Mini component to protect registration page from loading if user is logged out,
// while avoiding infinite redirect loops from the main ProtectedRoute.
const RegistrationWrapper: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const { user, loading } = useApp();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent"></div>
      </div>
    );
  }
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

export default function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AppProvider>
          <BrowserRouter>
            <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 transition-colors duration-300">
              
              {/* Dynamic Header */}
              <Navbar />

              {/* Central Content Area */}
              <main className="flex-grow">
                <Routes>
                  {/* Public Pages */}
                  <Route path="/" element={<LandingPage />} />
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/role-selection" element={<RoleSelectionPage />} />
                  <Route path="/help" element={<HelpPage />} />
                  <Route path="/subscriptions" element={<SubscriptionPage />} />
                  <Route path="/admin-secret-panel" element={<AdminSecretPanel />} />

                  {/* Profile Onboarding (Requires Login, bypasses finished profiles) */}
                  <Route
                    path="/registration"
                    element={
                      <RegistrationWrapper>
                        <RegistrationPage />
                      </RegistrationWrapper>
                    }
                  />

                  {/* Worker Workflows */}
                  <Route
                    path="/worker-dashboard"
                    element={
                      <ProtectedRoute allowedRole="worker">
                        <WorkerDashboard />
                      </ProtectedRoute>
                    }
                  />

                  {/* Farmer Workflows */}
                  <Route
                    path="/farmer-dashboard"
                    element={
                      <ProtectedRoute allowedRole="farmer">
                        <FarmerDashboard />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/nearby-workers"
                    element={
                      <ProtectedRoute allowedRole="farmer">
                        <NearbyWorkersPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/post-job"
                    element={
                      <ProtectedRoute allowedRole="farmer">
                        <JobPostingPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/emergency-hiring"
                    element={
                      <ProtectedRoute allowedRole="farmer">
                        <EmergencyHiringPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/worker-profile/:id"
                    element={
                      <ProtectedRoute allowedRole="farmer">
                        <WorkerProfilePage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/farmer-profile/:id"
                    element={
                      <ProtectedRoute allowedRole="worker">
                        <FarmerProfilePage />
                      </ProtectedRoute>
                    }
                  />

                  {/* Common Shared Workflows */}
                  <Route
                    path="/notifications"
                    element={
                      <ProtectedRoute>
                        <NotificationsPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/settings"
                    element={
                      <ProtectedRoute>
                        <SettingsPage />
                      </ProtectedRoute>
                    }
                  />

                  {/* Fallback routing */}
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </main>

              {/* Dynamic Footer */}
              <Footer />
              <PWAInstallPrompt />
              <LiveNotificationToast />

            </div>
          </BrowserRouter>
        </AppProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}
