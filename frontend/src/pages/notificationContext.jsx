import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { notificationService } from "../services/notifService";

const NotificationsContext = createContext(null);


function mapServerToUi(serverNotifs = []) {
  return serverNotifs.map((s) => ({
    id: s.notification_id,
    agreement_id: s.agreement_id,
    title: s.message || (s.category ? s.category : "Notification"),
    read: Boolean(s.is_read),
    time: s.created_at ? new Date(s.created_at).toLocaleString() : "",
    action: s.recommended_action || "",
    raw: s, 
  }));
}

export function NotificationsProvider({ children }) {
  //  stay in localStorage so it survives refreshes
  const [notifications, setNotifications] = useState(() => {
    const saved = localStorage.getItem("notifications");
    return saved ? JSON.parse(saved).map(n => ({ ...n, action: "" })) : [];
  });

  useEffect(() => {
    localStorage.setItem("notifications", JSON.stringify(notifications));
  }, [notifications]);

const refresh = async () => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      return;
    }
    try {
      const server = await notificationService.fetchNotifications();
      const ui = mapServerToUi(server);
      setNotifications(ui);
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    }
  };


  useEffect(() => {
  refresh();

  const interval = setInterval(async () => {
    const token = localStorage.getItem("access_token");
    if (!token) return;
    try {
      const server = await notificationService.fetchNotifications();
      const ui = mapServerToUi(server);
      setNotifications(ui);
      console.log("🔄 Auto-refreshed notifications");
    } catch (err) {
      console.error("Auto-refresh failed:", err);
    }
  }, 20000);

  return () => clearInterval(interval);
  }, []);

  // mark a single notification as read
  const markAsRead = async (id) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));

    try {
      await notificationService.markAsRead(id);
    } catch (err) {
      console.error("Failed to mark notification read on server:", err);
    }
  };

  // mark all as read (iterate through unread and call markAsRead)
  const markAllAsRead = async () => {
    const unread = notifications.filter((n) => !n.read);

    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));

    for (const n of unread) {
      try {
        await notificationService.markAsRead(n.id);
      } catch (err) {
        console.error("Failed to mark read for id", n.id, err);
      }
    }
  };

  const unread = useMemo(() => notifications.filter((n) => !n.read), [notifications]);
  const unreadCount = unread.length;

  const value = {
    notifications,
    setNotifications,
    unread,
    unreadCount,
    markAsRead,
    markAllAsRead,
    refresh,
  };

  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>;
}

export function useNotifications() {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error("useNotifications must be used within NotificationsProvider");
  return ctx;
}
