'use client';

import React, { useState } from 'react';
import { FileSpreadsheet, Download, Calendar, CheckCircle2, FileText, Info } from 'lucide-react';

export default function AdminReportsPage() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());

  const [fromLogDate, setFromLogDate] = useState(
    new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
  );
  const [toLogDate, setToLogDate] = useState(
    new Date().toISOString().split('T')[0]
  );

  const [downloadingMonthly, setDownloadingMonthly] = useState(false);
  const [downloadingLogs, setDownloadingLogs] = useState(false);

  const handleDownloadMonthly = () => {
    setDownloadingMonthly(true);
    window.location.href = `/api/admin/reports/monthly-excel?month=${month}&year=${year}`;
    setTimeout(() => setDownloadingMonthly(false), 2500);
  };

  const handleDownloadLogs = () => {
    setDownloadingLogs(true);
    window.location.href = `/api/admin/reports/logs-excel?from=${fromLogDate}&to=${toLogDate}`;
    setTimeout(() => setDownloadingLogs(false), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-white tracking-tight">
          Xuất Báo Cáo Chấm Công Chuẩn Excel
        </h1>
        <p className="text-xs text-slate-400 font-medium mt-1">
          Trích xuất bảng tổng hợp công tháng kèm công thức hành chính và bảng nhật ký đối soát
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Monthly Synthesis Report Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-950 border border-emerald-800 text-emerald-400 flex items-center justify-center">
              <FileSpreadsheet className="w-6 h-6" />
            </div>

            <div>
              <h2 className="text-base font-bold text-white">
                Bảng Chấm Công Tổng Hợp Tháng
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Kẻ bảng 31 ngày đầy đủ, gán ký hiệu chuẩn (<code className="text-emerald-400 font-bold">X</code>, <code className="text-blue-400 font-bold">P</code>, <code className="text-amber-400 font-bold">Ô</code>, <code className="text-rose-400 font-bold">KP</code>), tích hợp công thức tự động tính tổng công và số lần/phút đi trễ.
              </p>
            </div>

            {/* Select Month & Year */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  CHỌN THÁNG
                </label>
                <select
                  value={month}
                  onChange={(e) => setMonth(Number(e.target.value))}
                  className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs font-semibold focus:outline-hidden focus:border-red-500"
                >
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                    <option key={m} value={m}>
                      Tháng {m.toString().padStart(2, '0')}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  CHỌN NĂM
                </label>
                <select
                  value={year}
                  onChange={(e) => setYear(Number(e.target.value))}
                  className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs font-semibold focus:outline-hidden focus:border-red-500"
                >
                  {[2025, 2026, 2027, 2028].map((y) => (
                    <option key={y} value={y}>
                      Năm {y}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <button
            onClick={handleDownloadMonthly}
            disabled={downloadingMonthly}
            className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold flex items-center justify-center space-x-2 shadow-lg shadow-emerald-950/40 transition disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>
              {downloadingMonthly
                ? 'Đang tạo bảng tính...'
                : `Tải Bảng Tổng Hợp Tháng ${month}/${year} (.xlsx)`}
            </span>
          </button>
        </div>

        {/* Detailed Attendance Logs Report Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-950 border border-blue-800 text-blue-400 flex items-center justify-center">
              <FileText className="w-6 h-6" />
            </div>

            <div>
              <h2 className="text-base font-bold text-white">
                Bảng Nhật Ký Chi Tiết Quẹt Thẻ
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Xuất toàn bộ log quẹt thẻ theo khoảng thời gian tùy chọn để đối soát minh bạch (Tọa độ GPS, Khoảng cách cơ sở, Giờ vào/ra chuẩn GMT+7, Link ảnh xác thực).
              </p>
            </div>

            {/* Select Date Range */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  TỪ NGÀY
                </label>
                <input
                  type="date"
                  value={fromLogDate}
                  onChange={(e) => setFromLogDate(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-hidden focus:border-red-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  ĐẾN NGÀY
                </label>
                <input
                  type="date"
                  value={toLogDate}
                  onChange={(e) => setToLogDate(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-hidden focus:border-red-500"
                />
              </div>
            </div>
          </div>

          <button
            onClick={handleDownloadLogs}
            disabled={downloadingLogs}
            className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold flex items-center justify-center space-x-2 shadow-lg shadow-blue-950/40 transition disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>
              {downloadingLogs
                ? 'Đang trích xuất log...'
                : 'Tải Bảng Nhật Ký Quẹt Thẻ (.xlsx)'}
            </span>
          </button>
        </div>
      </div>

      {/* Legend & Standards Note */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 text-xs text-slate-400 space-y-2.5">
        <div className="flex items-center space-x-2 text-slate-200 font-bold">
          <Info className="w-4 h-4 text-red-500" />
          <span>Quy Định Ký Hiệu & Chuẩn Tính Công Caritas Đà Lạt</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-[11px] pt-1">
          <div className="p-2 bg-slate-950 rounded-xl border border-slate-800">
            <strong className="text-emerald-400 font-mono">X</strong>: Làm đủ ngày công (1.0 công)
          </div>
          <div className="p-2 bg-slate-950 rounded-xl border border-slate-800">
            <strong className="text-emerald-400 font-mono">1/2</strong>: Làm nửa ngày công (0.5 công)
          </div>
          <div className="p-2 bg-slate-950 rounded-xl border border-slate-800">
            <strong className="text-blue-400 font-mono">P</strong>: Nghỉ phép năm có lương
          </div>
          <div className="p-2 bg-slate-950 rounded-xl border border-slate-800">
            <strong className="text-amber-400 font-mono">Ô</strong>: Nghỉ ốm đau (Hưởng BHXH)
          </div>
          <div className="p-2 bg-slate-950 rounded-xl border border-slate-800">
            <strong className="text-slate-300 font-mono">Ro</strong>: Nghỉ việc riêng không lương
          </div>
          <div className="p-2 bg-slate-950 rounded-xl border border-slate-800">
            <strong className="text-rose-400 font-mono">KP</strong>: Nghỉ không phép
          </div>
        </div>
      </div>
    </div>
  );
}
