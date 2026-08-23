'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Bell,
  CheckCircle2,
  XCircle,
  Megaphone,
  FileText,
  FolderKanban,
  X,
  ChevronRight,
  Sparkles,
  Info,
} from 'lucide-react';

interface ToastItem {
  id: number;
  title: string;
  content: string;
  type: string;
  link?: string;
  createdAt: string;
}

export default function NotificationToaster() {
  const router = useRouter();
  const [activeToasts, setActiveToasts] = useState<ToastItem[]>([]);
  const seenNotificationIds = useRef<Set<number>>(new Set());
  const isFirstLoad = useRef<boolean>(true);

  const checkNotifications = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications');
      if (!res.ok) return;

      const data = await res.json();
      const notifs: any[] = data.notifications || [];

      if (isFirstLoad.current) {
        // On first mount, mark existing notifications as seen so we don't spam 20 toasts
        notifs.forEach((n) => seenNotificationIds.current.add(n.id));
        
        // But if there are unread notifications in the last 24h, show the latest one as an initial toast alert!
        const latestUnread = notifs.find((n) => !n.isRead);
        if (latestUnread) {
          setActiveToasts([latestUnread]);
        }
        isFirstLoad.current = false;
        return;
      }

      // Check for genuinely new notifications
      const newItems: ToastItem[] = [];
      notifs.forEach((n) => {
        if (!seenNotificationIds.current.has(n.id)) {
          seenNotificationIds.current.add(n.id);
          newItems.push(n);
        }
      });

      if (newItems.length > 0) {
        setActiveToasts((prev) => [...newItems, ...prev].slice(0, 3));
      }
    } catch (err) {
      console.warn('Toast fetch error:', err);
    }
  }, []);

  useEffect(() => {
    checkNotifications();
    const interval = setInterval(checkNotifications, 6000); // Check every 6s
    return () => clearInterval(interval);
  }, [checkNotifications]);

  const dismissToast = (id: number) => {
    setActiveToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const getToastIcon = (type: string) => {
    switch (type) {
      case 'LEAVE_APPROVED':
        return <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />;
      case 'LEAVE_REJECTED':
        return <XCircle className="w-5 h-5 text-rose-500 shrink-0" />;
      case 'ANNOUNCEMENT':
        return <Megaphone className="w-5 h-5 text-amber-500 shrink-0" />;
      case 'LEAVE_REQUEST':
        return <FileText className="w-5 h-5 text-sky-500 shrink-0" />;
      case 'PROJECT_REPORT':
        return <FolderKanban className="w-5 h-5 text-red-500 shrink-0" />;
      default:
        return <Bell className="w-5 h-5 text-slate-400 shrink-0" />;
    }
  };

  if (activeToasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col space-y-2.5 max-w-sm w-full pointer-events-none">
      {activeToasts.map((toast) => (
        <div
          key={toast.id}
          className="pointer-events-auto bg-slate-900/95 text-white rounded-3xl p-4 shadow-2xl border border-slate-700/80 backdrop-blur-md animate-in slide-in-from-top-4 fade-in duration-300 flex items-start space-x-3 group hover:border-slate-500 transition"
        >
          <div className="p-2 rounded-2xl bg-slate-800 border border-slate-700 mt-0.5">
            {getToastIcon(toast.type)}
          </div>

          <div
            className="flex-1 min-w-0 cursor-pointer"
            onClick={() => {
              if (toast.link) {
                router.push(toast.link);
                dismissToast(toast.id);
              }
            }}
          >
            <div className="flex items-center space-x-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider bg-red-950 text-red-400 px-1.5 py-0.5 rounded border border-red-800/60">
                Thông Báo Mới
              </span>
            </div>
            <h4 className="text-xs font-bold text-white mt-1 leading-snug">
              {toast.title}
            </h4>
            <p className="text-[11px] text-slate-300 font-medium mt-1 line-clamp-2 leading-relaxed">
              {toast.content}
            </p>

            {toast.link && (
              <div className="flex items-center space-x-1 text-[11px] text-sky-400 font-bold mt-2 group-hover:text-sky-300">
                <span>Xem chi tiết</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </div>
            )}
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              dismissToast(toast.id);
            }}
            className="p-1 rounded-full text-slate-400 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
