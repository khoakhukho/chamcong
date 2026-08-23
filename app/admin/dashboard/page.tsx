'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Users,
  UserCheck,
  UserX,
  Clock,
  AlertTriangle,
  FileText,
  MapPin,
  RefreshCw,
  Image as ImageIcon,
  CheckCircle2,
  X,
} from 'lucide-react';
import { formatDateTimeVN, formatTimeVN } from '@/lib/utils';

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [recentAttendances, setRecentAttendances] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/dashboard');
      if (res.ok) {
        const data = await res.json();
        setStats(data.stats);
        setRecentAttendances(data.recentAttendances || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
    const interval = setInterval(loadDashboard, 30000); // Auto-refresh every 30s
    return () => clearInterval(interval);
  }, [loadDashboard]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">
            Tổng Quan Thời Gian Thực
          </h1>
          <p className="text-xs text-slate-400 font-medium mt-1">
            Theo dõi tình hình điểm danh, đi muộn và đơn từ trong ngày hôm nay
          </p>
        </div>

        <button
          onClick={loadDashboard}
          disabled={loading}
          className="self-start sm:self-auto py-2 px-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center space-x-2 transition border border-slate-700"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Làm mới dữ liệu</span>
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {/* Total Employees */}
        <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Tổng nhân sự</span>
            <Users className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-black text-white font-mono">
            {stats ? stats.totalEmployees : '--'}
          </div>
          <div className="text-[10px] text-slate-400">Đang hoạt động</div>
        </div>

        {/* Checked In */}
        <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-800/60 space-y-1">
          <div className="flex items-center justify-between text-emerald-400 text-xs font-semibold">
            <span>Đã Check-in</span>
            <UserCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-300 font-mono">
            {stats ? stats.checkedInCount : '--'}
          </div>
          <div className="text-[10px] text-emerald-400/80">Hôm nay</div>
        </div>

        {/* Not Checked In */}
        <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-700/60 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Chưa vào ca</span>
            <UserX className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-black text-slate-300 font-mono">
            {stats ? stats.notCheckedInCount : '--'}
          </div>
          <div className="text-[10px] text-slate-400">Cần theo dõi</div>
        </div>

        {/* Late Count */}
        <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-800/60 space-y-1">
          <div className="flex items-center justify-between text-amber-400 text-xs font-semibold">
            <span>Đi trễ</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-300 font-mono">
            {stats ? stats.lateCount : '--'}
          </div>
          <div className="text-[10px] text-amber-400/80">Vượt giờ cho phép</div>
        </div>

        {/* Invalid Location Warning */}
        <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-800/60 space-y-1">
          <div className="flex items-center justify-between text-rose-400 text-xs font-semibold">
            <span>Ngoài bán kính</span>
            <AlertTriangle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-black text-rose-300 font-mono">
            {stats ? stats.invalidLocationCount : '--'}
          </div>
          <div className="text-[10px] text-rose-400/80">Cảnh báo GPS</div>
        </div>

        {/* Pending Requests */}
        <Link
          href="/admin/requests"
          className="p-4 rounded-2xl bg-blue-950/40 border border-blue-800/60 space-y-1 hover:border-blue-500 transition block"
        >
          <div className="flex items-center justify-between text-blue-400 text-xs font-semibold">
            <span>Đơn chờ duyệt</span>
            <FileText className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-black text-blue-300 font-mono">
            {stats ? stats.pendingLeaveCount : '--'}
          </div>
          <div className="text-[10px] text-blue-400/80 underline">Bấm để duyệt &rarr;</div>
        </Link>
      </div>

      {/* Realtime Attendance Logs Today */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-white flex items-center space-x-2">
              <span>Lượt Chấm Công Hôm Nay (Thời Gian Thực)</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Danh sách nhân sự vừa quẹt thẻ gần nhất
            </p>
          </div>

          <Link
            href="/admin/attendance"
            className="text-xs font-semibold text-red-400 hover:text-red-300 transition"
          >
            Xem tất cả nhật ký &rarr;
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 text-[11px] uppercase tracking-wider font-semibold border-b border-slate-800">
              <tr>
                <th className="px-5 py-3.5">Nhân viên</th>
                <th className="px-5 py-3.5">Phòng ban</th>
                <th className="px-5 py-3.5">Loại quẹt</th>
                <th className="px-5 py-3.5">Thời gian</th>
                <th className="px-5 py-3.5">Vị trí GPS</th>
                <th className="px-5 py-3.5">Kiểm soát</th>
                <th className="px-5 py-3.5 text-center">Ảnh Watermark</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {recentAttendances.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-slate-500">
                    Chưa có lượt chấm công nào trong ngày hôm nay.
                  </td>
                </tr>
              ) : (
                recentAttendances.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-800/40 transition">
                    <td className="px-5 py-3.5">
                      <div className="font-bold text-white">{item.user?.fullName}</div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        {item.user?.employeeCode}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-slate-300">
                      {item.user?.department || 'Chung'}
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase ${
                          item.checkType === 'IN'
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                            : 'bg-blue-950 text-blue-300 border border-blue-800'
                        }`}
                      >
                        {item.checkType === 'IN' ? 'Vào ca' : 'Ra ca'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 font-mono text-slate-200">
                      <div>{formatTimeVN(item.serverTime)}</div>
                      {item.isLate && (
                        <span className="text-[10px] text-amber-400 font-bold block">
                          Trễ {item.lateMinutes}p
                        </span>
                      )}
                      {item.isEarlyLeave && (
                        <span className="text-[10px] text-amber-400 font-bold block">
                          Về sớm {item.earlyMinutes}p
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-slate-300 max-w-xs">
                      <div className="truncate font-semibold">
                        {item.nearestLocationName || 'Điểm chấm công'}
                      </div>
                      <div className="text-[10px] text-slate-400 truncate">
                        {item.locationAddress}
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          item.isValidLocation
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                            : 'bg-rose-950 text-rose-400 border border-rose-800'
                        }`}
                      >
                        {item.isValidLocation ? 'Hợp lệ' : `Cảnh báo (${item.distanceMeters}m)`}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      {item.imagePath ? (
                        <button
                          onClick={() => setSelectedPhoto(item.imagePath)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                          title="Xem ảnh watermark"
                        >
                          <ImageIcon className="w-4 h-4" />
                        </button>
                      ) : (
                        <span className="text-slate-600">-</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Photo Modal */}
      {selectedPhoto && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative max-w-lg w-full bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-slate-800">
            <div className="flex items-center justify-between px-4 py-3 bg-slate-950 border-b border-slate-800 text-white">
              <span className="text-xs font-bold text-slate-300">Chi Tiết Ảnh Chấm Công</span>
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
                alt="Attendance Photo"
                className="w-full h-auto rounded-2xl object-cover"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
