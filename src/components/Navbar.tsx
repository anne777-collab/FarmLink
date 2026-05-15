import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext";
import { useTheme } from "../context/ThemeContext";
import { useApp } from "../context/AppContext";
import { 
  Sprout, Menu, X, Sun, Moon, Bell, LogOut, User, 
  Settings
} from "lucide-react";

export const Navbar: React.FC = () => {
  const { language, setLanguage, t } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const { user, logout, notifications } = useApp();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const unreadCount = notifications.filter(n => n.userId === user?.uid && !n.read).length;

  const handleLogout = async () => {
    await logout();
    navigate("/");
    setMobileMenuOpen(false);
  };

  const toggleLanguage = () => {
    setLanguage(language === "en" ? "hi" : "en");
  };

  const isActive = (path: string) => location.pathname === path;

  const linkClass = (path: string) => `
    px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200
    ${isActive(path) 
      ? "bg-emerald-600 text-white dark:bg-emerald-700" 
      : "text-slate-700 hover:bg-slate-100 hover:text-emerald-600 dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:text-emerald-400"}
  `;

  return (
    <nav className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:border-slate-800/80 dark:bg-slate-950/95">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          
          {/* Logo & Brand */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-500 to-green-600 shadow-md shadow-emerald-500/20">
              <Sprout className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              {t("appName")}<span className="text-emerald-500 font-black">.</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex md:items-center md:space-x-4">
            {/* Main Links */}
            <Link to="/" className={linkClass("/")}>{t("home")}</Link>
            
            {user && user.profileCompleted && (
              <>
                {user.role === "farmer" ? (
                  <>
                    <Link to="/farmer-dashboard" className={linkClass("/farmer-dashboard")}>{t("dashboard")}</Link>
                    <Link to="/nearby-workers" className={linkClass("/nearby-workers")}>{t("nearbyWorkers")}</Link>
                    <Link to="/post-job" className={linkClass("/post-job")}>{t("postJob")}</Link>
                  </>
                ) : (
                  <>
                    <Link to="/worker-dashboard" className={linkClass("/worker-dashboard")}>{t("dashboard")}</Link>
                  </>
                )}
                <Link to="/notifications" className="relative p-2 text-slate-600 hover:text-emerald-600 dark:text-slate-300 dark:hover:text-emerald-400">
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white ring-2 ring-white dark:ring-slate-950">
                      {unreadCount}
                    </span>
                  )}
                </Link>
              </>
            )}

            <Link to="/help" className={linkClass("/help")}>{t("help")}</Link>
          </div>

          {/* Quick Utility controls & Auth Buttons */}
          <div className="hidden md:flex md:items-center md:space-x-3">
            {/* Language Switch */}
            <button
              onClick={toggleLanguage}
              className="flex items-center space-x-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-900 cursor-pointer"
            >
              <span>{t("changeLang")}</span>
            </button>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="rounded-lg p-2 text-slate-600 hover:bg-slate-50 hover:text-emerald-600 dark:text-slate-300 dark:hover:bg-slate-900 dark:hover:text-emerald-400 cursor-pointer"
              title="Toggle Theme"
            >
              {theme === "light" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
            </button>

            {/* Auth Button */}
            {user ? (
              <div className="flex items-center space-x-2">
                <Link
                  to="/settings"
                  className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                  title={t("settings")}
                >
                  <User className="h-4 w-4" />
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-1 rounded-lg bg-rose-50 px-3 py-1.5 text-sm font-semibold text-rose-600 hover:bg-rose-100 dark:bg-rose-950/30 dark:text-rose-400 dark:hover:bg-rose-950/50 cursor-pointer"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="hidden lg:inline">{t("logout")}</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  to="/login"
                  className="rounded-lg px-4 py-1.5 text-sm font-semibold text-slate-700 hover:text-emerald-600 dark:text-slate-200 dark:hover:text-emerald-400"
                >
                  {t("login")}
                </Link>
                <Link
                  to="/role-selection"
                  className="rounded-lg bg-emerald-600 px-4 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-500"
                >
                  {t("signup")}
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex items-center space-x-2 md:hidden">
            {/* Language Switch */}
            <button
              onClick={toggleLanguage}
              className="rounded-lg px-2 py-1 text-xs font-semibold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800"
            >
              {t("changeLang")}
            </button>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="rounded-lg p-1.5 text-slate-600 dark:text-slate-300"
            >
              {theme === "light" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
            </button>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 hover:text-emerald-600 dark:text-slate-300 dark:hover:bg-slate-900"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="border-t border-slate-200 bg-white px-4 pt-2 pb-4 dark:border-slate-800 dark:bg-slate-950 md:hidden">
          <div className="space-y-1">
            <Link
              to="/"
              className="block rounded-lg px-3 py-2 text-base font-medium text-slate-700 hover:bg-slate-100 hover:text-emerald-600 dark:text-slate-200 dark:hover:bg-slate-800"
              onClick={() => setMobileMenuOpen(false)}
            >
              {t("home")}
            </Link>

            {user && user.profileCompleted && (
              <>
                {user.role === "farmer" ? (
                  <>
                    <Link
                      to="/farmer-dashboard"
                      className="block rounded-lg px-3 py-2 text-base font-medium text-slate-700 hover:bg-slate-100 hover:text-emerald-600 dark:text-slate-200 dark:hover:bg-slate-800"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {t("dashboard")}
                    </Link>
                    <Link
                      to="/nearby-workers"
                      className="block rounded-lg px-3 py-2 text-base font-medium text-slate-700 hover:bg-slate-100 hover:text-emerald-600 dark:text-slate-200 dark:hover:bg-slate-800"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {t("nearbyWorkers")}
                    </Link>
                    <Link
                      to="/post-job"
                      className="block rounded-lg px-3 py-2 text-base font-medium text-slate-700 hover:bg-slate-100 hover:text-emerald-600 dark:text-slate-200 dark:hover:bg-slate-800"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {t("postJob")}
                    </Link>
                  </>
                ) : (
                  <>
                    <Link
                      to="/worker-dashboard"
                      className="block rounded-lg px-3 py-2 text-base font-medium text-slate-700 hover:bg-slate-100 hover:text-emerald-600 dark:text-slate-200 dark:hover:bg-slate-800"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {t("dashboard")}
                    </Link>
                  </>
                )}
                <Link
                  to="/notifications"
                  className="flex items-center justify-between rounded-lg px-3 py-2 text-base font-medium text-slate-700 hover:bg-slate-100 hover:text-emerald-600 dark:text-slate-200 dark:hover:bg-slate-800"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <span>{t("notifications")}</span>
                  {unreadCount > 0 && (
                    <span className="rounded-full bg-rose-500 px-2 py-0.5 text-xs font-bold text-white">
                      {unreadCount}
                    </span>
                  )}
                </Link>
              </>
            )}

            <Link
              to="/help"
              className="block rounded-lg px-3 py-2 text-base font-medium text-slate-700 hover:bg-slate-100 hover:text-emerald-600 dark:text-slate-200 dark:hover:bg-slate-800"
              onClick={() => setMobileMenuOpen(false)}
            >
              {t("help")}
            </Link>

            <div className="border-t border-slate-100 my-2 pt-2 dark:border-slate-800" />

            {user ? (
              <div className="space-y-1 pt-1">
                <Link
                  to="/settings"
                  className="flex items-center space-x-2 rounded-lg px-3 py-2 text-base font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Settings className="h-5 w-5" />
                  <span>{t("settings")}</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center space-x-2 rounded-lg px-3 py-2 text-left text-base font-medium text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/30"
                >
                  <LogOut className="h-5 w-5" />
                  <span>{t("logout")}</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 pt-2">
                <Link
                  to="/login"
                  className="rounded-lg border border-slate-200 py-2 text-center text-sm font-semibold text-slate-700 dark:border-slate-800 dark:text-slate-200"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {t("login")}
                </Link>
                <Link
                  to="/role-selection"
                  className="rounded-lg bg-emerald-600 py-2 text-center text-sm font-semibold text-white hover:bg-emerald-700"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {t("signup")}
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};
export default Navbar;
