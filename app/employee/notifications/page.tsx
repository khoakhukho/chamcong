'use client';

import React, { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Bell,
  CheckCircle2,
  XCircle,
  Megaphone,
  FileText,
  FolderKanban,
  Sparkles,
  CheckCheck,
  ChevronRight,
  Filter,
  RefreshCw,
  ArrowLeft,
} from 'lucide-react';
import { formatTimeVN, formatDateVN } from '@/lib/utils';
import { useNotifications } from '@/lib/notification-context';

export default function NotificationsHistoryPage() {
  const router = useRouter();
  const { notifications: initialNotifs, unreadCount, markAllRead, markRead, refresh } = useNotifications();

  // Local paginated list
  const [allNotifications, setAllNotifications] = useState<any[]>(initialNotifs);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [filterUnread, setFilterUnread] = useState(false);
  const [total, setTotal] = useState(0);

  // Load paginated notifications
  const loadPage = useCallback(async (pageNum: number, unreadOnly: boolean, reset: boolean = false) => {
    setLoadingMore(true);
    try {
      const url = `/api/notifications?page=${pageNum}&limit=20${unreadOnly ? '&unread=true' : ''}`;
      const res = await fetch(url);
      if (!res.ok) return;
      const data = await res.json();
      const newItems: any[] = data.notifications || [];
      setTotal(data.total || 0);
      setHasMore(data.hasMore || false);
      if (reset) {
        setAllNotifications(newItems);
      } else {
        setAllNotifications((prev) => [...prev, ...newItems]);
      }
      setPage(pageNum);
    } catch {
      // ignore
    } finally {
      setLoadingMore(false);
    }
  }, []);

  // Initialize on mount
  React.useEffect(() => {
    loadPage(1, false, true);
  }, [loadPage]);

  const handleFilterToggle = () => {
    const newFilter = !filterUnread;
    setFilterUnread(newFilter);
    setPage(1);
    loadPage(1, newFilter, true);
  };

  const handleLoadMore = () => {
    loadPage(page + 1, filterUnread, false);
  };

  const handleRefresh = async () => {
    await refresh();
    loadPage(1, filterUnread, true);
  };

  const handleMarkAllRead = async () => {
    await markAllRead();
    loadPage(1, filterUnread, true);
  };

  const handleNotificationClick = async (item: any) => {
    if (!item.isRead) {
      await markRead(item.id);
      setAllNotifications((prev) =>
        prev.map((n) => (n.id === item.id ? { ...n, isRead: true } : n))
      );
    }
    if (item.link) {
      router.push(item.link);
    }
  };

  const getIcon = (type: string) => {
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
        return <Sparkles className="w-5 h-5 text-slate-400 shrink-0" />;
    }
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      LEAVE_APPROVED: 'Đơn Được Duyệt',
      LEAVE_REJECTED: 'Đơn Bị Từ Chối',
      ANNOUNCEMENT: 'Thông Báo Chung',
      LEAVE_REQUEST: 'Đơn Xin Nghỉ',
      PROJECT_REPORT: 'Báo Cáo Dự Án',
      SYSTEM: 'Hệ Thống',
    };
    return labels[type] || 'Thông Báo';
  };

  const getTypeBg = (type: string) => {
    const bgs: Record<string, string> = {
      LEAVE_APPROVED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      LEAVE_REJECTED: 'bg-rose-50 text-rose-700 border-rose-200',
      ANNOUNCEMENT: 'bg-amber-50 text-amber-700 border-amber-200',
      LEAVE_REQUEST: 'bg-sky-50 text-sky-700 border-sky-200',
      PROJECT_REPORT: 'bg-red-50 text-red-700 border-red-200',
    };
    return bgs[type] || 'bg-slate-100 text-slate-600 border-slate-200';
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-32">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-xs">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => router.back()}
              className="p-1.5 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-sm font-black text-slate-900 flex items-center space-x-2">
                <Bell className="w-4 h-4 text-red-600" />
                <span>Lịch Sử Thông Báo</span>
                {unreadCount > 0 && (
                  <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 bg-red-600 text-white text-[10px] font-black rounded-full">
                    {unreadCount}
                  </span>
                )}
              </h1>
              <p className="text-[10px] text-slate-500">
                {total > 0 ? `${total} thông báo tổng cộng` : 'Tất cả thông báo của bạn'}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleRefresh}
              className="p-1.5 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition"
              title="Làm mới"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="flex items-center space-x-1 px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold transition"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>Đọc tất cả</span>
              </button>
            )}
          </div>
        </div>

        {/* Filter bar */}
        <div className="max-w-2xl mx-auto px-4 pb-2.5 flex items-center space-x-2">
          <button
            onClick={handleFilterToggle}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition border ${
              filterUnread
                ? 'bg-red-600 text-white border-red-600'
                : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            <span>{filterUnread ? 'Chưa đọc' : 'Tất cả'}</span>
          </button>
          <span className="text-[11px] text-slate-400">
            {filterUnread ? `${unreadCount} thông báo chưa đọc` : `${total} thông báo`}
          </span>
        </div>
      </div>

      {/* Notification List */}
      <div className="max-w-2xl mx-auto px-4 py-4 space-y-2">
        {allNotifications.length === 0 ? (
          <div className="py-20 text-center">
            <Bell className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-500">
              {filterUnread ? 'Không có thông báo chưa đọc' : 'Chưa có thông báo nào'}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              {filterUnread
                ? 'Bạn đã đọc hết tất cả thông báo!'
                : 'Thông báo sẽ xuất hiện tại đây khi có sự kiện mới'}
            </p>
          </div>
        ) : (
          allNotifications.map((item) => (
            <div
              key={item.id}
              onClick={() => handleNotificationClick(item)}
              className={`bg-white rounded-2xl border transition cursor-pointer active:scale-[0.99] ${
                !item.isRead
                  ? 'border-red-200 bg-red-50/40 shadow-sm'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="p-4 flex items-start space-x-3">
                {/* Icon */}
                <div
                  className={`p-2 rounded-xl border mt-0.5 ${
                    !item.isRead ? 'bg-white' : 'bg-slate-50'
                  }`}
                >
                  {getIcon(item.type)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${getTypeBg(item.type)}`}
                        >
                          {getTypeLabel(item.type)}
                        </span>
                        {!item.isRead && (
                          <span className="w-2 h-2 rounded-full bg-red-600 shrink-0" />
                        )}
                      </div>
                      <p
                        className={`text-xs leading-snug ${
                          !item.isRead ? 'font-bold text-slate-900' : 'font-semibold text-slate-800'
                        }`}
                      >
                        {item.title}
                      </p>
                      <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                        {item.content}
                      </p>
                    </div>

                    {/* Timestamp + Link arrow */}
                    <div className="flex flex-col items-end space-y-1 shrink-0">
                      <span className="text-[10px] text-slate-400 font-mono whitespace-nowrap">
                        {formatTimeVN(item.createdAt)}
                      </span>
                      <span className="text-[10px] text-slate-400 whitespace-nowrap">
                        {formatDateVN(item.createdAt)}
                      </span>
                      {item.link && (
                        <ChevronRight className="w-4 h-4 text-red-500" />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}

        {/* Load More Button */}
        {hasMore && (
          <div className="text-center pt-4">
            <button
              onClick={handleLoadMore}
              disabled={loadingMore}
              className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-bold transition flex items-center space-x-2 mx-auto"
            >
              {loadingMore ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Đang tải...</span>
                </>
              ) : (
                <>
                  <Bell className="w-3.5 h-3.5" />
                  <span>Tải thêm thông báo</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
