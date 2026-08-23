'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Megaphone, CheckCircle2, Pin, Calendar, AlertCircle, Sparkles } from 'lucide-react';
import { formatDateVN, formatTimeVN } from '@/lib/utils';

export default function AnnouncementBanner() {
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [ackingId, setAckingId] = useState<number | null>(null);

  const loadAnnouncements = useCallback(async () => {
    try {
      const res = await fetch('/api/announcements');
      if (res.ok) {
        const data = await res.json();
        setAnnouncements(data.announcements || []);
      }
    } catch (err) {
      console.warn('Announcements load error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAnnouncements();
  }, [loadAnnouncements]);

  const handleAcknowledge = async (id: number) => {
    setAckingId(id);
    try {
      const res = await fetch('/api/announcements/ack', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ announcementId: id }),
      });

      if (res.ok) {
        await loadAnnouncements();
      }
    } catch (err) {
      console.error('Ack error:', err);
    } finally {
      setAckingId(null);
    }
  };

  // Only show pinned announcements or unacknowledged ones that require acknowledgment
  const activeList = announcements.filter((a) => a.isPinned || (a.requireAck && !a.hasAcknowledged));

  if (loading || activeList.length === 0) return null;

  return (
    <div className="space-y-3">
      {activeList.map((item) => {
        const isAcked = item.hasAcknowledged;

        return (
          <div
            key={item.id}
            className={`p-4 rounded-3xl border shadow-md relative overflow-hidden transition-all ${
              !isAcked && item.requireAck
                ? 'bg-gradient-to-br from-amber-500/10 via-red-500/10 to-orange-500/10 border-amber-400 text-slate-900'
                : 'bg-white border-slate-200 text-slate-800'
            }`}
          >
            {/* Header Badge */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <span className="p-1.5 rounded-xl bg-amber-500 text-slate-950">
                  <Megaphone className="w-4 h-4" />
                </span>
                <span className="text-[11px] font-black uppercase tracking-wider text-amber-800">
                  {item.category === 'HOLIDAY'
                    ? 'LỊCH NGHỈ LỄ & NGHỈ BÙ'
                    : item.category === 'SCHEDULE'
                    ? 'LỊCH CÔNG TÁC'
                    : 'THÔNG BÁO TỪ BAN GIÁM ĐỐC'}
                </span>
              </div>

              {item.isPinned && (
                <span className="flex items-center space-x-1 text-[10px] font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded-full">
                  <Pin className="w-3 h-3" />
                  <span>Ghim quan trọng</span>
                </span>
              )}
            </div>

            {/* Title & Content */}
            <h3 className="text-sm font-black text-slate-900 mb-1">{item.title}</h3>
            <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line mb-3">
              {item.content}
            </p>

            {/* Acknowledgment Action Box */}
            {item.requireAck && (
              <div className="pt-3 border-t border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="text-[10px] text-slate-500 font-medium">
                  {isAcked ? (
                    <span className="text-emerald-700 font-bold flex items-center space-x-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>
                        Đã xác nhận lúc {formatTimeVN(item.acknowledgedAt)} ngày{' '}
                        {formatDateVN(item.acknowledgedAt)}
                      </span>
                    </span>
                  ) : (
                    <span className="text-amber-800 font-bold flex items-center space-x-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>Yêu cầu nhân viên xác nhận đã nhận thông báo này</span>
                    </span>
                  )}
                </div>

                {!isAcked ? (
                  <button
                    onClick={() => handleAcknowledge(item.id)}
                    disabled={ackingId === item.id}
                    className="py-2 px-4 rounded-xl bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white text-xs font-bold shadow-md shadow-red-950/20 flex items-center justify-center space-x-1.5 transition active:scale-[0.98] disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>
                      {ackingId === item.id ? 'Đang xác nhận...' : 'Tôi đã đọc & xác nhận đã nhận tin'}
                    </span>
                  </button>
                ) : (
                  <span className="text-[11px] text-emerald-800 font-bold bg-emerald-100 px-3 py-1 rounded-xl">
                    ✓ Đã lưu vết xác nhận
                  </span>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
