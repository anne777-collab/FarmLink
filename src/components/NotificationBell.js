// src/components/NotificationBell.js
// Real-time notification bell — drop this anywhere in a dashboard header.
// Usage: <NotificationBell userId={userProfile.id} onOpen={() => navigate("notifications")} />
import React, { useState, useEffect } from "react";
import { Bell } from "lucide-react";
import { getNotificationsRealtime } from "../firebase/firestore";

export default function NotificationBell({ userId, onOpen }) {
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (!userId) return;
    const unsub = getNotificationsRealtime(
      userId,
      (notifs) => setUnread(notifs.filter((n) => !n.read).length),
      (err)    => console.error("[NotificationBell]", err)
    );
    return () => unsub();
  }, [userId]);

  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={`Notifications${unread > 0 ? ` (${unread} unread)` : ""}`}
      className="relative p-2 rounded-xl hover:bg-gray-100 transition-colors">
      <Bell className="w-6 h-6 text-gray-600" />
      {unread > 0 && (
        <span className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1
                         bg-red-500 text-white text-[10px] font-black rounded-full
                         flex items-center justify-center ring-2 ring-white">
          {unread > 99 ? "99+" : unread}
        </span>
      )}
    </button>
  );
}