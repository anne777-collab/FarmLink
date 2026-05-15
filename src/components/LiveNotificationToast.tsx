import React, { useEffect, useRef, useState } from "react";
import { Toast } from "./Toast";
import { useApp } from "../context/AppContext";

export const LiveNotificationToast: React.FC = () => {
  const { user, notifications } = useApp();
  const seenIds = useRef<Set<string>>(new Set());
  const bootstrapped = useRef(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);

  useEffect(() => {
    if (!user) {
      seenIds.current.clear();
      bootstrapped.current = false;
      return;
    }

    const mine = notifications
      .filter(notification => notification.userId === user.uid)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    if (!bootstrapped.current) {
      mine.forEach(notification => seenIds.current.add(notification.id));
      bootstrapped.current = true;
      return;
    }

    const newest = mine.find(notification => !seenIds.current.has(notification.id));
    mine.forEach(notification => seenIds.current.add(notification.id));

    if (newest) {
      setToast({
        message: `${newest.title}: ${newest.message}`,
        type: newest.type === "warning" ? "error" : newest.type === "success" || newest.type.includes("accepted") || newest.type.includes("completed") ? "success" : "info",
      });
    }
  }, [notifications, user]);

  if (!toast) return null;

  return <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />;
};
