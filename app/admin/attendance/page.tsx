'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  ListOrdered,
  Calendar,
  Filter,
  Image as ImageIcon,
  MapPin,
  Clock,
  X,
  Search,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { formatDateTimeVN, formatTimeVN, formatDateVN } from '@/lib/utils';

export default function AdminAttendancePage() {
  const [attendances, setAttendances] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [dateStr, setDateStr] = useState<string>(new Date().toISOString().split('T')[0]);
  const [department, setDepartment] = useState('ALL');
  const [checkType, setCheckType] = useState('ALL');
  const [status, setStatus] = useState('ALL');

  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  const loadLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (dateStr) params.append('date', dateStr);
      if (department !== 'ALL') params.append('department', department);
      if (checkType !== 'ALL') params.append('checkType', checkType);
      if (status !== 'ALL') params.append('status', status);

      const res = await fetch(`/api/admin/attendance?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setAttendances(data.attendances || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [dateStr, department, checkType, status]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">
            Nhật Ký & Kho Ảnh Chấm Công
          </h1>
          <p className="text-xs text-slate-400 font-medium mt-1">
            Tra cứu toàn bộ log quẹt thẻ, vị trí GPS và kho ảnh đóng dấu watermark đối soát
          </p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 shadow-lg grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
        <div>
          <label className="block font-semibold text-slate-400 mb-1">CHỌN NGÀY</label>
          <input
            type="date"
            value={dateStr}
            onChange={(e) => setDateStr(e.target.value)}
            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-hidden focus:border-red-500"
          />
        </div>

        <div>
          <label className="block font-semibold text-slate-400 mb-1">PHÒNG BAN</label>
          <select
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-hidden focus:border-red-500"
          >
            <option value="ALL">Tất cả phòng ban</option>
            <option value="Ban Giám Đốc">Ban Giám Đốc</option>
            <option value="Ban Y Tế Bác Ái">Ban Y Tế Bác Ái</option>
            <option value="Ban Khuyết Tật">Ban Khuyết Tật</option>
            <option value="Ban Học Bổng & Trẻ Em">Ban Học Bổng & Trẻ Em</option>
            <option value="Ban Hành Chính & Kế Toán">Ban Hành Chính & Kế Toán</option>
          </select>
        </div>

        <div>
          <label className="block font-semibold text-slate-400 mb-1">LOẠI QUẸT</label>
          <select
            value={checkType}
            onChange={(e) => setCheckType(e.target.value)}
            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-hidden focus:border-red-500"
          >
            <option value="ALL">Tất cả (Vào & Ra)</option>
            <option value="IN">Vào ca (Check-in)</option>
            <option value="OUT">Ra ca (Check-out)</option>
          </select>
        </div>

        <div>
          <label className="block font-semibold text-slate-400 mb-1">TÌNH TRẠNG</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-hidden focus:border-red-500"
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="LATE">Đi muộn (Trễ)</option>
            <option value="EARLY">Về sớm</option>
            <option value="INVALID_LOC">Ngoài bán kính GPS</option>
          </select>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 text-[11px] uppercase tracking-wider font-semibold border-b border-slate-800">
              <tr>
                <th className="px-5 py-3.5">Mã & Tên NV</th>
                <th className="px-5 py-3.5">Phòng ban</th>
                <th className="px-5 py-3.5">Loại quẹt</th>
                <th className="px-5 py-3.5">Thời gian thực tế</th>
                <th className="px-5 py-3.5">Vị trí & GPS</th>
                <th className="px-5 py-3.5">Khoảng cách</th>
                <th className="px-5 py-3.5">Trạng thái ca</th>
                <th className="px-5 py-3.5 text-center">Ảnh Watermark</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-5 py-8 text-center text-slate-500">
                    Đang tải dữ liệu nhật ký...
                  </td>
                </tr>
              ) : attendances.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-8 text-center text-slate-500">
                    Không tìm thấy lượt chấm công nào thỏa điều kiện lọc.
                  </td>
                </tr>
              ) : (
                attendances.map((item) => (
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
                      <div className="text-[10px] text-slate-500">
                        {formatDateVN(item.serverTime)}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-slate-300 max-w-xs">
                      <div className="truncate font-semibold">
                        {item.nearestLocationName || 'Vị trí ghi nhận'}
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
                        {item.isValidLocation ? `✓ Hợp lệ (${item.distanceMeters}m)` : `⚠ Cách ${item.distanceMeters}m`}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 font-semibold">
                      {item.isLate ? (
                        <span className="text-amber-400 font-bold">
                          Trễ {item.lateMinutes} phút
                        </span>
                      ) : item.isEarlyLeave ? (
                        <span className="text-amber-400 font-bold">
                          Về sớm {item.earlyMinutes} phút
                        </span>
                      ) : (
                        <span className="text-emerald-400">Đúng giờ</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      {item.imagePath ? (
                        <button
                          onClick={() => setSelectedPhoto(item.imagePath)}
                          className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition shadow-sm inline-flex items-center space-x-1"
                        >
                          <ImageIcon className="w-4 h-4 text-red-400" />
                          <span>Xem ảnh</span>
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
              <span className="text-xs font-bold text-slate-300">
                Chi Tiết Ảnh Xác Thực Chấm Công (Watermark)
              </span>
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
                alt="Watermark Photo"
                className="w-full h-auto rounded-2xl object-cover"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
