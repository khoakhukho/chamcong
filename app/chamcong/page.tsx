'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
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
  Wifi,
  WifiOff,
  RefreshCw,
  CloudUpload,
  Palmtree,
  CalendarCheck2,
} from 'lucide-react';
import { formatDateTimeVN, formatTimeVN } from '@/lib/utils';
import { LocationTarget } from '@/lib/geofencing';
import {
  saveOfflineAttendance,
  getPendingOfflineAttendances,
  syncAllOfflineAttendances,
} from '@/lib/offline-store';
import { LeaveBalanceSummary } from '@/lib/leave-calculator';

export default function ChamCongPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [locations, setLocations] = useState<LocationTarget[]>([]);
  const [balances, setBalances] = useState<LeaveBalanceSummary | null>(null);
  const [loading, setLoading] = useState(true);

  // Connectivity & Offline Sync State
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [pendingSyncCount, setPendingSyncCount] = useState<number>(0);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // Live Current Time
  const [currentTime, setCurrentTime] = useState<string>('');

  // Attendance Status
  const [todayStatus, setTodayStatus] = useState<any>(null);
  const [activeModal, setActiveModal] = useState<'IN' | 'OUT' | null>(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Check pending offline count
  const refreshPendingCount = useCallback(async () => {
    try {
      const list = await getPendingOfflineAttendances();
      setPendingSyncCount(list.length);
    } catch {
      // ignore
    }
  }, []);

  // Trigger sync of pending records
  const handleTriggerSync = useCallback(async () => {
    if (!navigator.onLine || isSyncing) return;
    setIsSyncing(true);
    try {
      const result = await syncAllOfflineAttendances();
      if (result.successCount > 0) {
        setSuccessMessage(
          `Đã đồng bộ thành công ${result.successCount} lượt chấm công ngoại tuyến lên hệ thống!`
        );
        await loadData();
      }
      await refreshPendingCount();
    } catch (err: any) {
      console.error('Sync error:', err);
    } finally {
      setIsSyncing(false);
    }
  }, [isSyncing, refreshPendingCount]);

  // Fetch Session, Locations, Today Status & Leave Balances
  const loadData = useCallback(async () => {
    try {
      const meRes = await fetch('/api/auth/me');
      if (!meRes.ok) {
        if (navigator.onLine) {
          router.push('/login');
          return;
        }
      } else {
        const meData = await meRes.json();
        setUser(meData.user);
      }

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

      // Balances
      const balRes = await fetch('/api/employee/leave-balance');
      if (balRes.ok) {
        const balData = await balRes.json();
        setBalances(balData.balances);
      }
    } catch (err) {
      console.error('loadData error (may be offline):', err);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsOnline(navigator.onLine);
      refreshPendingCount();
    }

    loadData();

    const handleOnline = () => {
      setIsOnline(true);
      handleTriggerSync();
    };
    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

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

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(timer);
    };
  }, [loadData, handleTriggerSync, refreshPendingCount]);

  const handleCaptureComplete = async (capturedData: any) => {
    if (!activeModal) return;
    setSubmitLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    const capturedTimestamp = new Date().toISOString();

    if (!navigator.onLine) {
      try {
        await saveOfflineAttendance({
          userId: user?.id || 1,
          employeeCode: user?.employeeCode || 'NV',
          checkType: activeModal,
          imageData: capturedData.imageData,
          latitude: capturedData.latitude,
          longitude: capturedData.longitude,
          locationAddress: capturedData.locationAddress,
          capturedAt: capturedTimestamp,
        });

        await refreshPendingCount();
        setSuccessMessage(
          `✓ ĐÃ LƯU CHẤM CÔNG NGOẠI TUYẾN! Tọa độ GPS và ảnh đã lưu an toàn trên máy, sẽ tự động đồng bộ ngay khi có mạng.`
        );
        setActiveModal(null);
      } catch (err: any) {
        setErrorMessage('Lỗi lưu offline: ' + err.message);
      } finally {
        setSubmitLoading(false);
      }
      return;
    }

    try {
      const res = await fetch('/api/attendance/check-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          checkType: activeModal,
          imageData: capturedData.imageData,
          latitude: capturedData.latitude,
          longitude: capturedData.longitude,
          locationAddress: capturedData.locationAddress,
          clientCapturedTime: capturedTimestamp,
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
      console.warn('Online submission failed, falling back to IndexedDB offline store:', err);
      try {
        await saveOfflineAttendance({
          userId: user?.id || 1,
          employeeCode: user?.employeeCode || 'NV',
          checkType: activeModal,
          imageData: capturedData.imageData,
          latitude: capturedData.latitude,
          longitude: capturedData.longitude,
          locationAddress: capturedData.locationAddress,
          capturedAt: capturedTimestamp,
        });
        await refreshPendingCount();
        setSuccessMessage(
          `✓ ĐÃ LƯU CHẤM CÔNG OFFLINE! Do kết nối mạng gián đoạn, dữ liệu đã được lưu trên máy và sẽ tự động gửi lên khi có mạng ổn định.`
        );
        setActiveModal(null);
      } catch (offlineErr: any) {
        setErrorMessage(err.message || offlineErr.message);
      }
    } finally {
      setSubmitLoading(false);
    }
  };

  if (loading && !user) {
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
      <EmployeeHeader user={user || { fullName: 'Nhân Viên Caritas', employeeCode: 'NV', role: 'EMPLOYEE' }} />

      <main className="flex-1 max-w-md w-full mx-auto px-4 py-5 space-y-4">
        {/* Offline & Sync Status Banner */}
        {!isOnline && (
          <div className="p-3.5 rounded-2xl bg-amber-500 text-slate-950 text-xs font-bold flex items-center justify-between shadow-md">
            <div className="flex items-center space-x-2">
              <WifiOff className="w-4 h-4 shrink-0" />
              <span>Chế độ Ngoại Tuyến (Không có Internet)</span>
            </div>
            <span className="text-[10px] bg-slate-950 text-white px-2 py-0.5 rounded-full">
              Sẵn sàng chấm công
            </span>
          </div>
        )}

        {pendingSyncCount > 0 && (
          <div className="p-3.5 rounded-2xl bg-slate-900 text-white border border-slate-800 text-xs flex items-center justify-between shadow-lg">
            <div className="flex items-center space-x-2">
              <CloudUpload className="w-4 h-4 text-sky-400 shrink-0" />
              <span>
                Có <strong>{pendingSyncCount}</strong> lượt chấm công chờ đồng bộ
              </span>
            </div>
            <button
              onClick={handleTriggerSync}
              disabled={isSyncing || !isOnline}
              className="px-3 py-1 bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-slate-950 font-bold rounded-lg text-[11px] flex items-center space-x-1 transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Đang gửi...' : 'Đồng bộ'}</span>
            </button>
          </div>
        )}

        {/* Leave Balance Overview Quick Link Card */}
        {balances && (
          <Link
            href="/employee/requests"
            className="p-3.5 rounded-2xl bg-white border border-slate-200 text-xs flex items-center justify-between shadow-xs hover:border-red-400 transition"
          >
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-1.5 text-emerald-700 font-bold">
                <Palmtree className="w-4 h-4" />
                <span>Phép năm còn: {balances.annualLeaveRemaining} ngày</span>
              </div>
              {balances.compensatoryAvailableThisWeek > 0 && (
                <div className="flex items-center space-x-1 text-sky-700 font-bold border-l border-slate-200 pl-2">
                  <CalendarCheck2 className="w-3.5 h-3.5" />
                  <span>Nghỉ bù: {balances.compensatoryAvailableThisWeek} ngày</span>
                </div>
              )}
            </div>
            <span className="text-[11px] text-red-600 font-bold">Xem đơn &rarr;</span>
          </Link>
        )}

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
            <span className="font-medium leading-relaxed">{successMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center space-x-3 shadow-xs">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
            <span className="font-medium">{errorMessage}</span>
          </div>
        )}

        {/* Today Attendance Status Overview Card */}
        <div className="bg-white rounded-3xl p-5 shadow-xs border border-slate-200 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center space-x-1.5">
              <Clock className="w-4 h-4 text-red-600" />
              <span>Trạng Thái Chấm Công Hôm Nay</span>
            </h3>
            <span className="text-[11px] font-semibold text-slate-400 font-mono">
              {new Intl.DateTimeFormat('vi-VN', {
                timeZone: 'Asia/Ho_Chi_Minh',
                day: '2-digit',
                month: '2-digit',
              }).format(new Date())}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Check-In Status */}
            <div
              className={`p-3.5 rounded-2xl border transition ${
                checkInRecord
                  ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                  : 'bg-slate-50 border-slate-100 text-slate-600'
              }`}
            >
              <div className="flex items-center justify-between text-xs font-semibold mb-1">
                <span>VÀO CA (IN)</span>
                <LogIn className="w-3.5 h-3.5" />
              </div>
              {checkInRecord ? (
                <div>
                  <div className="text-lg font-black font-mono">
                    {formatTimeVN(checkInRecord.serverTime)}
                  </div>
                  <div className="text-[11px] mt-1 space-y-0.5">
                    <span className="text-emerald-700 font-bold block">✓ Đã vào ca</span>
                    <span className="text-slate-500 block truncate text-[10px]">
                      {checkInRecord.locationAddress || 'Đã ghi nhận GPS'}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="text-sm font-semibold text-slate-400 py-1">
                  Chưa check-in
                </div>
              )}
            </div>

            {/* Check-Out Status */}
            <div
              className={`p-3.5 rounded-2xl border transition ${
                checkOutRecord
                  ? 'bg-blue-50/70 border-blue-200 text-blue-900'
                  : 'bg-slate-50 border-slate-100 text-slate-600'
              }`}
            >
              <div className="flex items-center justify-between text-xs font-semibold mb-1">
                <span>RA CA (OUT)</span>
                <LogOut className="w-3.5 h-3.5" />
              </div>
              {checkOutRecord ? (
                <div>
                  <div className="text-lg font-black font-mono">
                    {formatTimeVN(checkOutRecord.serverTime)}
                  </div>
                  <div className="text-[11px] mt-1 space-y-0.5">
                    <span className="text-blue-700 font-bold block">✓ Đã ra ca</span>
                    <span className="text-slate-500 block truncate text-[10px]">
                      {checkOutRecord.locationAddress || 'Đã ghi nhận GPS'}
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
            <span>Cơ Sở & Điểm Hoạt Động Caritas Đà Lạt ({locations.length})</span>
          </div>
          <p className="text-[11px] text-slate-500">
            Hệ thống hỗ trợ chấm công tại văn phòng và khi đi công tác, hoạt động cộng đồng ngoài cơ sở.
          </p>
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
            user={user || { fullName: 'Nhân Viên', employeeCode: 'NV' }}
            locations={locations}
            onCaptureComplete={handleCaptureComplete}
            onCancel={() => setActiveModal(null)}
          />
        </div>
      )}
    </div>
  );
}
