'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import EmployeeHeader from '@/components/layout/EmployeeHeader';
import { Calendar, Clock, MapPin, CheckCircle, Eye, X, Image as ImageIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { formatDateTimeVN, formatTimeVN, formatDateVN } from '@/lib/utils';

export default function EmployeeHistoryPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());

  const [attendances, setAttendances] = useState<any[]>([]);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  const loadHistory = useCallback(async () => {
    setLoading(true);
    try {
      const meRes = await fetch('/api/auth/me');
      if (!meRes.ok) {
        router.push('/login');
        return;
      }
      const meData = await meRes.json();
      setUser(meData.user);

      const res = await fetch(`/api/attendance/history?month=${month}&year=${year}`);
      if (res.ok) {
        const data = await res.json();
        setAttendances(data.attendances || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [month, year, router]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const handlePrevMonth = () => {
    if (month === 1) {
      setMonth(12);
      setYear(year - 1);
    } else {
      setMonth(month - 1);
    }
  };

  const handleNextMonth = () => {
    if (month === 12) {
      setMonth(1);
      setYear(year + 1);
    } else {
      setMonth(month + 1);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      <EmployeeHeader user={user} />

      <main className="flex-1 max-w-md w-full mx-auto px-3.5 sm:px-4 py-4 sm:py-5 pb-28 md:pb-8 space-y-4">
        {/* Month Selector Card */}
        <div className="bg-white rounded-3xl p-4 shadow-xs border border-slate-200 flex items-center justify-between">
          <button
            onClick={handlePrevMonth}
            className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div className="text-center">
            <h2 className="text-sm font-bold text-slate-900">
              Tháng {month.toString().padStart(2, '0')} / {year}
            </h2>
            <p className="text-[11px] text-slate-500 font-medium">
              {attendances.length} lượt quẹt thẻ
            </p>
          </div>

          <button
            onClick={handleNextMonth}
            className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Attendance Log List */}
        {loading ? (
          <div className="p-8 text-center text-slate-500 text-xs font-semibold">
            Đang tải nhật ký...
          </div>
        ) : attendances.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 shadow-xs border border-slate-200 text-center space-y-2">
            <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-slate-700">Chưa có nhật ký chấm công</h3>
            <p className="text-xs text-slate-400">
              Không tìm thấy lượt chấm công nào trong tháng {month}/{year}.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {attendances.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-2xl p-4 shadow-xs border border-slate-200 space-y-2.5 transition hover:shadow-md"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span
                      className={`px-2.5 py-1 rounded-lg text-xs font-black uppercase ${
                        item.checkType === 'IN'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {item.checkType === 'IN' ? 'Vào Ca' : 'Ra Ca'}
                    </span>
                    <span className="text-xs font-bold text-slate-900 font-mono">
                      {formatTimeVN(item.serverTime)}
                    </span>
                  </div>

                  <span className="text-[11px] text-slate-500 font-medium">
                    {formatDateVN(item.serverTime)}
                  </span>
                </div>

                {/* Location & Status */}
                <div className="text-xs space-y-1 text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <div className="flex items-start space-x-1.5">
                    <MapPin className="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" />
                    <span className="truncate font-semibold">
                      {item.locationAddress || item.nearestLocationName || 'Vị trí đã lưu'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[10px] font-semibold text-emerald-700 flex items-center space-x-1">
                      <span>✓ Đã xác thực tọa độ GPS</span>
                    </span>
                    {item.notes && (
                      <span className="text-[10px] text-slate-400 truncate max-w-[150px]">
                        {item.notes}
                      </span>
                    )}
                  </div>
                </div>

                {/* Photo Thumbnail Button */}
                {item.imagePath && (
                  <button
                    onClick={() => setSelectedPhoto(item.imagePath)}
                    className="w-full py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center justify-center space-x-2 transition"
                  >
                    <ImageIcon className="w-3.5 h-3.5 text-slate-500" />
                    <span>Xem ảnh đã đóng dấu Watermark</span>
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Photo Modal Preview */}
      {selectedPhoto && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative max-w-lg w-full bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-slate-800">
            <div className="flex items-center justify-between px-4 py-3 bg-slate-950 border-b border-slate-800 text-white">
              <span className="text-xs font-bold text-slate-300">Ảnh Chấm Công Đã Đóng Dấu</span>
              <button
                onClick={() => setSelectedPhoto(null)}
                className="p-1 rounded-full text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-2">
              <img
                src={selectedPhoto}
                alt="Watermarked Attendance"
                className="w-full h-auto rounded-2xl object-cover"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
