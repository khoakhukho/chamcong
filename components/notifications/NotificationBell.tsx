'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Bell,
  CheckCircle2,
  XCircle,
  Megaphone,
  FileText,
  Clock,
  Check,
  ChevronRight,
  Sparkles,
  FolderKanban,
  CheckCheck,
} from 'lucide-react';
import { formatTimeVN, formatDateVN } from '@/lib/utils';

export default function NotificationBell() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isOpen, setIsOpen] = useState(false);

  const containerRef = useRef<HTMLDivElement | null>(null);

  const loadNotifications = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications');
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (err) {
      console.warn('Notifications fetch error:', err);
    }
  }, []);

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 8000); // Poll every 8s

    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      clearInterval(interval);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [loadNotifications]);

  const handleMarkAsRead = async (id?: number) => {
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(id ? { id } : { markAll: true }),
      });
      await loadNotifications();
    } catch {}
  };

  const handleNotificationClick = async (item: any) => {
    if (!item.isRead) {
      await handleMarkAsRead(item.id);
    }
    if (item.link) {
      router.push(item.link);
      setIsOpen(false);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'LEAVE_APPROVED':
        return <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />;
      case 'LEAVE_REJECTED':
        return <XCircle className="w-4 h-4 text-rose-500 shrink-0" />;
      case 'ANNOUNCEMENT':
        return <Megaphone className="w-4 h-4 text-amber-500 shrink-0" />;
      case 'LEAVE_REQUEST':
        return <FileText className="w-4 h-4 text-sky-500 shrink-0" />;
      case 'PROJECT_REPORT':
        return <FolderKanban className="w-4 h-4 text-red-500 shrink-0" />;
      default:
        return <Sparkles className="w-4 h-4 text-slate-400 shrink-0" />;
    }
  };

  return (
    <div className="relative" ref={containerRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer"
        title="Xem thông báo"
      >
        <Bell className="w-5 h-5 text-slate-700" />
        {unreadCount > 0 && (
          <span className="absolute top-0.5 right-0.5 min-w-[20px] h-[20px] px-1 bg-red-600 text-white text-[10px] font-black rounded-full flex items-center justify-center animate-bounce border-2 border-white shadow-md">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notifications Popover Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-3xl shadow-2xl border border-slate-200 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-slate-900 text-white border-b border-slate-800">
            <div className="flex items-center space-x-2">
              <Bell className="w-4 h-4 text-red-400" />
              <span className="text-xs font-bold uppercase tracking-wider">
                Thông Báo ({notifications.length})
              </span>
            </div>
            {unreadCount > 0 && (
              <button
                onClick={() => handleMarkAsRead()}
                className="text-[11px] text-slate-300 hover:text-white flex items-center space-x-1 font-semibold transition"
              >
                <CheckCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Đọc tất cả ({unreadCount})</span>
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-96 overflow-y-auto divide-y divide-slate-100">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                <Bell className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <span>Chưa có thông báo nào</span>
              </div>
            ) : (
              notifications.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleNotificationClick(item)}
                  className={`p-3.5 flex items-start space-x-3 transition cursor-pointer hover:bg-slate-50 ${
                    !item.isRead ? 'bg-red-50/50' : ''
                  }`}
                >
                  <div className="mt-0.5">{getIcon(item.type)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <div className={`text-xs leading-snug ${!item.isRead ? 'font-bold text-slate-900' : 'font-medium text-slate-800'}`}>
                        {item.title}
                      </div>
                      {!item.isRead && (
                        <span className="w-2 h-2 rounded-full bg-red-600 shrink-0" />
                      )}
                    </div>
                    <div className="text-[11px] text-slate-600 font-normal mt-1 line-clamp-2 leading-relaxed">
                      {item.content}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1 flex items-center justify-between">
                      <span>{formatTimeVN(item.createdAt)} {formatDateVN(item.createdAt)}</span>
                      {item.link && (
                        <span className="text-red-600 font-bold flex items-center">
                          Xem <ChevronRight className="w-3 h-3" />
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
