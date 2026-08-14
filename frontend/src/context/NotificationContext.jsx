import { createContext, useContext, useEffect, useRef, useState } from "react";
import { useAuth } from "./AuthContext";
import { api } from "../lib/api";

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const wsRef = useRef(null);

  // Helper to ensure we always have an array
  const safeArray = (value) => (Array.isArray(value) ? value : []);

  useEffect(() => {
    if (!user || user.is_admin || user.is_staff || user.is_superuser) return;

    // Fetch stored notifications on mount
    api
      .getUserNotifications()
      .then((data) => {
        const list = safeArray(data);
        setNotifications(list);
        setUnreadCount(list.filter((n) => !n.is_read).length);
      })
      .catch(() => {});

    // Open WebSocket for real-time push
    const token = api.getToken();
    if (!token) return;

    const proto = window.location.protocol === "https:" ? "wss" : "ws";
    const wsUrl = `${proto}://${window.location.host}/ws/user/notifications/?token=${token}`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);

        if (msg.type === "initial_notifications") {
          const list = safeArray(msg.notifications);
          setNotifications(list);
          setUnreadCount(list.filter((n) => !n.is_read).length);
        } else if (msg.type === "new_notification") {
          // FIX: Use msg.notification (or whatever the actual payload field is)
          const newNotif = msg.notification; // <-- this is the key fix
          if (!newNotif) return; // safety check

          setNotifications((prev) => {
            const base = safeArray(prev);
            return [...base, newNotif];
          });
          setUnreadCount((c) => c + 1);
        } else if (msg.type === "marked_read") {
          setNotifications((prev) => {
            const base = safeArray(prev);
            return base.map((n) => ({ ...n, is_read: true }));
          });
          setUnreadCount(0);
        }
      } catch (err) {
        // ignore malformed messages, but log for debugging
        console.warn("WebSocket message error:", err);
      }
    };

    ws.onerror = () => {};
    ws.onclose = () => {};

    return () => {
      ws.close();
    };
  }, [user]);

  const markAllRead = async () => {
    try {
      // Tell server via WS (preferred) or REST fallback
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: "mark_read" }));
      } else {
        await api.markUserNotificationsRead();
      }
      setNotifications((prev) => {
        const base = safeArray(prev);
        return base.map((n) => ({ ...n, is_read: true }));
      });
      setUnreadCount(0);
    } catch {
      // silent
    }
  };

  return (
    <NotificationContext.Provider
      value={{ notifications, unreadCount, markAllRead }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx)
    throw new Error(
      "useNotifications must be used within NotificationProvider",
    );
  return ctx;
}
