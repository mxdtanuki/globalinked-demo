import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

const NotificationsContext = createContext(null);

// This can be replaced with actual API calls to fetch notifications
const initialData = [
  { id: 1,  title: 'MOA for ABC University will expire in 30 days', read: false, time: '2h ago', action: 'Confirm renewal intent with partner' },
  { id: 2,  title: 'MOU with XYZ Institute is inactive for 3 months', read: false, time: '5h ago', action: 'Review partnership status and take action' },
  { id: 3,  title: 'The Document DEF is in "Revert to Initiator" for a week already', read: true, time: '1d ago', action: 'Follow up with the initiator' },
  { id: 4,  title: 'MOA for LMN College will expire in 15 days', read: false, time: '2d ago', action: 'Prepare draft renewal documents' },
  { id: 5,  title: 'MOU with OPQ Foundation has expired', read: true, time: '3d ago', action: 'Decide on extension or closure' },
  { id: 6,  title: 'The Document GHI is pending approval for 10 days', read: false, time: '3d ago', action: 'Send reminder to approving authority' },
  { id: 7,  title: 'MOA for RST University will expire in 60 days', read: false, time: '4d ago', action: 'Schedule meeting with partner to confirm renewal' },
  { id: 8,  title: 'MOU with UVW Organization marked inactive', read: true, time: '5d ago', action: 'Assess impact on current projects' },
  { id: 9,  title: 'The Document JKL has been in review for 2 weeks', read: false, time: '6d ago', action: 'Escalate to reviewer’s manager' },
  { id: 10, title: 'MOA for PQR Institute will expire in 7 days', read: false, time: '1w ago', action: 'Finalize renewal documents urgently' },
];

export function NotificationsProvider({ children }) {
  //  stay in localStorage so it survives refreshes
  const [notifications, setNotifications] = useState(() => {
    const saved = localStorage.getItem("notifications");
    return saved ? JSON.parse(saved) : initialData;
  });

  useEffect(() => {
    localStorage.setItem("notifications", JSON.stringify(notifications));
  }, [notifications]);

  const markAsRead = (id) =>
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));

  const markAllAsRead = () =>
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));

  const unread = useMemo(() => notifications.filter((n) => !n.read), [notifications]);
  const unreadCount = unread.length;

  const value = {
    notifications,
    setNotifications,
    unread,
    unreadCount,
    markAsRead,
    markAllAsRead,
  };

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error("useNotifications must be used within NotificationsProvider");
  return ctx;
}
