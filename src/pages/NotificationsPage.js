// src/pages/NotificationsPage.js
// Full notifications page — real-time, mark-as-read on tap.
import React, { useState, useEffect } from "react";
import { ArrowLeft, Bell, CheckCheck } from "lucide-react";
import {
  getNotificationsRealtime,
  markNotificationRead,
  markAllNotificationsRead,
} from "../firebase/firestore";
import { useAuth } from "../context/AuthContext";
import { Spinner } from "../components/UI";

// Icon per notification type
const TYPE_META = {
  job_request: { emoji: "&#128203;", bg: "bg-blue-50",   border: "border-blue-200",   text: "text-blue-700"  },
  accepted:    { emoji: "&#10003;",  bg: "bg-green-50",  border: "border-green-200",  text: "text-green-700" },
  rejected:    { emoji: "&#10005;",  bg: "bg-red-50",    border: "border-red-200",    text: "text-red-700"   },
  completed:   { emoji: "&#127807;", bg: "bg-purple-50", border: "border-purple-200", text: "text-purple-700"},
  default:     { emoji: "&#128276;", bg: "bg-gray-50",   border: "border-gray-200",   text: "text-gray-700"  },
};

function timeAgo(ts) {
  if (!ts) return "";
  const date   = ts?.toDate ? ts.toDate() : new Date(ts);
  const diffMs = Date.now() - date.getTime();
  const mins   = Math.floor(diffMs / 60_000);
  if (mins < 1)  return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function NotificationsPage({ onBack }) {
  const { userProfile } = useAuth();
  const [notifs,   setNotifs]   = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [marking,  setMarking]  = useState(false);

  useEffect(() => {
    if (!userProfile?.id) { setLoading(false); return; }

    const unsub = getNotificationsRealtime(
      userProfile.id,
      (data) => { setNotifs(data); setLoading(false); },
      ()     => setLoading(false)
    );
    return () => unsub();
  }, [userProfile?.id]);

  const handleTap = async (notif) => {
    if (!notif.read) await markNotificationRead(notif.id);
  };

  const handleMarkAll = async () => {
    if (!userProfile?.id) return;
    setMarking(true);
    await markAllNotificationsRead(userProfile.id);
    setMarking(false);
  };

  const unreadCount = notifs.filter((n) => !n.read).length;

  return (
    <div className="min-h-screen bg-gray-50 max-w-md mx-auto">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4 flex items-center justify-between sticky top-[max(env(safe-area-inset-top),24px)] z-10">
        <div className="flex items-center gap-3">
          {onBack && (
            <button type="button" onClick={onBack}
              className="p-2 -ml-2 rounded-xl hover:bg-gray-100 transition-colors">
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
          )}
          <div>
            <h1 className="text-lg font-black text-gray-800">Notifications</h1>
            {unreadCount > 0 && (
              <p className="text-xs text-gray-400">{unreadCount} unread</p>
            )}
          </div>
        </div>
        {unreadCount > 0 && (
          <button type="button" onClick={handleMarkAll} disabled={marking}
            className="flex items-center gap-1.5 text-xs font-semibold text-green-600
                       hover:text-green-700 disabled:opacity-50 transition-colors">
            <CheckCheck className="w-4 h-4" />
            {marking ? "Marking…" : "Mark all read"}
          </button>
        )}
      </div>

      {/* Content */}
      <div className="px-4 py-4">
        {loading ? (
          <div className="flex justify-center py-16"><Spinner size="lg" /></div>
        ) : notifs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Bell className="w-12 h-12 text-gray-200 mb-3" />
            <p className="font-bold text-gray-500">No notifications yet</p>
            <p className="text-sm text-gray-400 mt-1">
              Job requests and updates will appear here
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifs.map((n) => {
              const meta = TYPE_META[n.type] || TYPE_META.default;
              return (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => handleTap(n)}
                  className={`w-full text-left rounded-2xl border p-4 transition-all
                    active:scale-95 ${n.read
                      ? "bg-white border-gray-100 opacity-70"
                      : `${meta.bg} ${meta.border} shadow-sm`}`}>
                  <div className="flex items-start gap-3">
                    {/* Icon */}
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center
                                     flex-shrink-0 ${meta.bg} border ${meta.border}`}>
                      <span className="text-base"
                        dangerouslySetInnerHTML={{ __html: meta.emoji }} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-semibold leading-snug
                        ${n.read ? "text-gray-600" : "text-gray-800"}`}>
                        {n.message}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">{timeAgo(n.createdAt)}</p>
                    </div>

                    {/* Unread dot */}
                    {!n.read && (
                      <span className="w-2.5 h-2.5 rounded-full bg-red-500 flex-shrink-0 mt-1" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
