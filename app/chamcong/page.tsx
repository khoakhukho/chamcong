'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import EmployeeHeader from '@/components/layout/EmployeeHeader';
import CameraCapture from '@/components/camera/CameraCapture';
import {
  LogIn,
  LogOut,
  Clock,
  CheckCircle,
  AlertCircle,
  MapPin,
  Calendar,
  Building2,
  CheckCircle2,
  Sparkles,
  Camera,
} from 'lucide-react';
import { formatDateTimeVN, formatTimeVN } from '@/lib/utils';
import { LocationTarget } from '@/lib/geofencing';

export default function ChamCongPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [locations, setLocations] = useState<LocationTarget[]>([]);
  const [loading, setLoading] = useState(true);

  // Live Current Time
  const [currentTime, setCurrentTime] = useState<string>('');

  // Attendance Status
  const [todayStatus, setTodayStatus] = useState<any>(null);
  const [activeModal, setActiveModal] = useState<'IN' | 'OUT' | null>(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Fetch Session, Locations, Today Status
  const loadData = useCallback(async () => {
    try {
      const meRes = await fetch('/api/auth/me');
      if (!meRes.ok) {
        router.push('/login');
        return;
      }
      const meData = await meRes.json();
      setUser(meData.user);

      // Locations
      const locRes = await fetch('/api/locations');
      if (locRes.ok) {
        const locData = await locRes.json();
        setLocations(locData.locations || []);
      }

      // Today status
      const statusRes = await fetch('/api/attendance/today-status');
      if (statusRes.ok) {
        const sData = await statusRes.json();
        setTodayStatus(sData);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    loadData();

    // Clock ticker
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(
        new Intl.DateTimeFormat('vi-VN', {
          timeZone: 'Asia/Ho_Chi_Minh',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        }).format(now)
      );
    }, 1000);

    return () => clearInterval(timer);
  }, [loadData]);

  const handleCaptureComplete = async (capturedData: any) => {
    if (!activeModal) return;
    setSubmitLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await fetch('/api/attendance/check-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          checkType: activeModal,
          imageData: capturedData.imageData,
          latitude: capturedData.latitude,
          longitude: capturedData.longitude,
          clientLocationAddress: capturedData.locationAddress,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Có lỗi xảy ra khi chấm công');
      }

      setSuccessMessage(data.message);
      setActiveModal(null);
      await loadData();
    } catch (err: any) {
      setErrorMessage(err.message);
    } finally {
      setSubmitLoading(false);
    }
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-3 border-red-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-semibold text-slate-400">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  const checkInRecord = todayStatus?.checkIn;
  const checkOutRecord = todayStatus?.checkOut;
  const shift = todayStatus?.shift;

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      <EmployeeHeader user={user} />

      <main className="flex-1 max-w-md w-full mx-auto px-4 py-5 space-y-4">
        {/* Realtime Live Clock Card */}
        <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 text-white rounded-3xl p-6 shadow-xl border border-slate-800 text-center relative overflow-hidden">
          <div className="absolute -top-12 -right-12 w-36 h-36 bg-red-600/20 rounded-full blur-2xl pointer-events-none" />
          
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-1">
            Thời Gian Thực Tế (GMT+7)
          </p>
          <div className="text-4xl font-extrabold tracking-tight font-mono text-white mb-2">
            {currentTime || '--:--:--'}
          </div>
          <p className="text-xs text-slate-400 flex items-center justify-center space-x-1.5 font-medium">
            <Calendar className="w-3.5 h-3.5 text-red-400" />
            <span>
              {new Intl.DateTimeFormat('vi-VN', {
                timeZone: 'Asia/Ho_Chi_Minh',
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              }).format(new Date())}
            </span>
          </p>

          {shift && (
            <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-300">
              <span className="text-slate-400">{shift.name}:</span>
              <span className="font-bold text-red-400 font-mono">
                {shift.startTime} - {shift.endTime}
              </span>
            </div>
          )}
        </div>

        {/* Notifications */}
        {successMessage && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center space-x-3 shadow-xs">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="font-medium">{successMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center space-x-3 shadow-xs">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <span className="font-medium">{errorMessage}</span>
          </div>
        )}

        {/* Today Attendance Status Overview */}
        <div className="bg-white rounded-3xl p-5 shadow-xs border border-slate-200/80 space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center space-x-1.5">
            <Clock className="w-4 h-4 text-red-600" />
            <span>Trạng Thái Chấm Công Hôm Nay</span>
          </h2>

          <div className="grid grid-cols-2 gap-3">
            {/* Check-In Status Card */}
            <div className={`p-4 rounded-2xl border transition ${
              checkInRecord
                ? 'bg-emerald-50/60 border-emerald-200 text-emerald-950'
                : 'bg-slate-50 border-slate-200 text-slate-700'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Vào Ca (In)
                </span>
                <LogIn className={`w-4 h-4 ${checkInRecord ? 'text-emerald-600' : 'text-slate-400'}`} />
              </div>
              {checkInRecord ? (
                <div>
                  <div className="text-lg font-black font-mono text-emerald-700">
                    {formatTimeVN(checkInRecord.serverTime)}
                  </div>
                  <div className="mt-1 text-[11px] space-y-0.5">
                    {checkInRecord.isLate ? (
                      <span className="text-amber-700 font-bold block">
                        ⚠ Trễ {checkInRecord.lateMinutes}p
                      </span>
                    ) : (
                      <span className="text-emerald-700 font-bold block">✓ Đúng giờ</span>
                    )}
                    <span className="text-slate-500 block truncate text-[10px]">
                      {checkInRecord.nearestLocationName || 'Đúng vị trí'}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="text-sm font-semibold text-slate-400 py-1">
                  Chưa check-in
                </div>
              )}
            </div>

            {/* Check-Out Status Card */}
            <div className={`p-4 rounded-2xl border transition ${
              checkOutRecord
                ? 'bg-blue-50/60 border-blue-200 text-blue-950'
                : 'bg-slate-50 border-slate-200 text-slate-700'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Ra Ca (Out)
                </span>
                <LogOut className={`w-4 h-4 ${checkOutRecord ? 'text-blue-600' : 'text-slate-400'}`} />
              </div>
              {checkOutRecord ? (
                <div>
                  <div className="text-lg font-black font-mono text-blue-700">
                    {formatTimeVN(checkOutRecord.serverTime)}
                  </div>
                  <div className="mt-1 text-[11px] space-y-0.5">
                    {checkOutRecord.isEarlyLeave ? (
                      <span className="text-amber-700 font-bold block">
                        ⚠ Về sớm {checkOutRecord.earlyMinutes}p
                      </span>
                    ) : (
                      <span className="text-blue-700 font-bold block">✓ Hoàn thành ca</span>
                    )}
                    <span className="text-slate-500 block truncate text-[10px]">
                      {checkOutRecord.nearestLocationName || 'Đúng vị trí'}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="text-sm font-semibold text-slate-400 py-1">
                  Chưa check-out
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Primary Action Buttons */}
        <div className="space-y-3 pt-2">
          <button
            onClick={() => {
              setActiveModal('IN');
              setSuccessMessage(null);
              setErrorMessage(null);
            }}
            disabled={submitLoading}
            className="w-full py-4 px-5 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white font-bold rounded-2xl shadow-lg shadow-emerald-900/20 flex items-center justify-between transition active:scale-[0.99]"
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                <LogIn className="w-5 h-5 text-white" />
              </div>
              <div className="text-left">
                <div className="text-sm font-black">CHẤM CÔNG VÀO CA</div>
                <div className="text-[11px] text-emerald-100 font-medium">
                  Chụp ảnh xác thực + Định vị GPS
                </div>
              </div>
            </div>
            <Camera className="w-5 h-5 opacity-80" />
          </button>

          <button
            onClick={() => {
              setActiveModal('OUT');
              setSuccessMessage(null);
              setErrorMessage(null);
            }}
            disabled={submitLoading}
            className="w-full py-4 px-5 bg-gradient-to-r from-slate-800 to-slate-900 hover:from-slate-700 hover:to-slate-800 text-white font-bold rounded-2xl shadow-lg shadow-slate-950/20 flex items-center justify-between transition active:scale-[0.99]"
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                <LogOut className="w-5 h-5 text-white" />
              </div>
              <div className="text-left">
                <div className="text-sm font-black">CHẤM CÔNG RA CA</div>
                <div className="text-[11px] text-slate-300 font-medium">
                  Kết thúc ngày làm việc
                </div>
              </div>
            </div>
            <Camera className="w-5 h-5 opacity-80" />
          </button>
        </div>

        {/* Location Target List Info */}
        <div className="bg-white rounded-3xl p-5 shadow-xs border border-slate-200 text-xs space-y-2.5">
          <div className="font-bold text-slate-700 flex items-center space-x-1.5">
            <Building2 className="w-4 h-4 text-red-600" />
            <span>Địa Điểm Chấm Công Hợp Lệ ({locations.length})</span>
          </div>
          <div className="space-y-2">
            {locations.map((loc) => (
              <div
                key={loc.id}
                className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-start space-x-2 text-[11px]"
              >
                <MapPin className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-800 block font-semibold">{loc.name}</strong>
                  <span className="text-slate-500">{loc.address || 'Khu vực cơ sở Caritas'}</span>
                  <span className="ml-1 text-[10px] text-slate-400 font-mono">
                    (Bán kính: {loc.radiusMeters}m)
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Fullscreen Camera Modal Overlay */}
      {activeModal && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-3">
          <CameraCapture
            user={user}
            locations={locations}
            onCaptureComplete={handleCaptureComplete}
            onCancel={() => setActiveModal(null)}
          />
        </div>
      )}
    </div>
  );
}
