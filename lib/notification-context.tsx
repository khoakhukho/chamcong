'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';

interface NotificationContextValue {
  unreadCount: number;
  notifications: any[];
  loading: boolean;
  refresh: () => Promise<void>;
  markRead: (id?: number) => Promise<void>;
  markAllRead: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextValue>({
  unreadCount: 0,
  notifications: [],
  loading: false,
  refresh: async () => {},
  markRead: async () => {},
  markAllRead: async () => {},
});

export function useNotifications() {
  return useContext(NotificationContext);
}

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications?limit=30&page=1');
      if (!res.ok) return;
      const data = await res.json();
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount ?? 0);
    } catch {
      // silent
    }
  }, []);

  const markRead = useCallback(async (id?: number) => {
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(id ? { id } : { markAll: true }),
      });
      await refresh();
    } catch {}
  }, [refresh]);

  const markAllRead = useCallback(async () => {
    await markRead(undefined);
  }, [markRead]);

  // Initial load + polling every 5s
  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 5000);
    return () => clearInterval(interval);
  }, [refresh]);

  return (
    <NotificationContext.Provider
      value={{ unreadCount, notifications, loading, refresh, markRead, markAllRead }}
    >
      {children}
    </NotificationContext.Provider>
  );
}
