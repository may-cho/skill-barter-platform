import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useAuth } from './AuthContext';
import { api } from '../lib/api';

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const wsRef = useRef(null);

  // Fetch initial notifications via REST and open WebSocket
  useEffect(() => {
    if (!user || user.is_admin || user.is_staff || user.is_superuser) return;

    // Fetch stored notifications on mount
    api.getUserNotifications()
      .then((data) => {
        setNotifications(data);
        setUnreadCount(data.filter((n) => !n.is_read).length);
      })
      .catch(() => {});

    // Open WebSocket for real-time push
    const token = api.getToken();
    if (!token) return;

    const proto = window.location.protocol === 'https:' ? 'wss' : 'ws';
    const wsUrl = `${proto}://${window.location.host}/ws/user/notifications/?token=${token}`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);

        if (msg.type === 'initial_notifications') {
          // Server sends full list on connect — use it as source of truth
          setNotifications(msg.notifications);
          setUnreadCount(msg.notifications.filter((n) => !n.is_read).length);
        } else if (msg.type === 'new_notification') {
          setNotifications((prev) => [msg.notification, ...prev]);
          setUnreadCount((c) => c + 1);
        } else if (msg.type === 'marked_read') {
          setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
          setUnreadCount(0);
        }
      } catch {
        // ignore malformed messages
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
        wsRef.current.send(JSON.stringify({ type: 'mark_read' }));
      } else {
        await api.markUserNotificationsRead();
      }
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch {
      // silent
    }
  };

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, markAllRead }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used within NotificationProvider');
  return ctx;
}
