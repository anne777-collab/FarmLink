import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext";
import { useApp } from "../context/AppContext";
import { Bell, ArrowLeft } from "lucide-react";

export const NotificationsPage: React.FC = () => {
  const { t } = useLanguage();
  const { user, notifications, markNotificationsAsRead } = useApp();
  const navigate = useNavigate();

  // Mark all as read when opening notifications hub
  useEffect(() => {
      void markNotificationsAsRead();
  }, []);

  if (!user) return null;

  const myNotifications = notifications.filter(n => n.userId === user.uid);

  return (
    <div className="min-h-screen bg-slate-50 py-12 dark:bg-slate-950 transition-colors duration-300">
      <div className="mx-auto max-w-2xl px-4 space-y-6">
        
        {/* Back navigation */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center space-x-1 text-xs font-bold text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back</span>
        </button>

        {/* Card Box */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-xl space-y-6">
          
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-4">
            <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center space-x-2">
              <Bell className="h-6 w-6 text-emerald-600 animate-swing" />
              <span>{t("notifications")} Inbox</span>
            </h1>
            <span className="text-xs bg-emerald-50 text-emerald-800 px-3 py-1 rounded-xl font-bold dark:bg-emerald-950/20 dark:text-emerald-300">
              {myNotifications.length} Messages
            </span>
          </div>

          {/* List render */}
          {myNotifications.length === 0 ? (
            <div className="text-center py-12 text-xs text-slate-400 space-y-3">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-50 dark:bg-slate-950">
                <Bell className="h-6 w-6 text-slate-300" />
              </div>
              <p>You have no notifications yet. Keep your profile active to receive agricultural pairing alerts!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {myNotifications.map((notif) => (
                <div 
                  key={notif.id} 
                  className={`p-4 rounded-2xl border transition-all flex items-start space-x-3 ${
                    notif.read 
                      ? "bg-slate-50/50 border-slate-100 dark:bg-slate-950/10 dark:border-slate-800" 
                      : "bg-emerald-50/30 border-emerald-100 dark:bg-emerald-950/5 dark:border-emerald-900/30 shadow-sm"
                  }`}
                >
                  <div className="mt-0.5 shrink-0">
                    {notif.type === "success" ? (
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-800 text-xs">✓</span>
                    ) : (
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-100 text-indigo-800 text-xs font-bold">!</span>
                    )}
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                      {notif.title}
                    </p>
                    <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 leading-relaxed">
                      {notif.message}
                    </p>
                    <span className="text-[10px] text-slate-400 block">
                      {new Date(notif.createdAt).toLocaleDateString()} at {new Date(notif.createdAt).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
export default NotificationsPage;
