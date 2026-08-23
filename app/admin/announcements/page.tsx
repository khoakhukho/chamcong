'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Megaphone,
  Plus,
  Pin,
  CheckCircle2,
  AlertCircle,
  Users,
  Eye,
  Calendar,
  X,
  Send,
  Sparkles,
  Search,
} from 'lucide-react';
import { formatDateVN, formatTimeVN } from '@/lib/utils';

export default function AdminAnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Create Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('HOLIDAY');
  const [isPinned, setIsPinned] = useState(true);
  const [requireAck, setRequireAck] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Acknowledgment Report Modal
  const [reportModalData, setReportModalData] = useState<any | null>(null);
  const [loadingReport, setLoadingReport] = useState(false);

  const loadAnnouncements = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/announcements');
      if (res.ok) {
        const data = await res.json();
        setAnnouncements(data.announcements || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAnnouncements();
  }, [loadAnnouncements]);

  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMsg(null);

    try {
      const res = await fetch('/api/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          content,
          category,
          isPinned,
          requireAck,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Lỗi tạo thông báo');

      setMsg({ type: 'success', text: data.message });
      setTitle('');
      setContent('');
      setShowCreateModal(false);
      await loadAnnouncements();
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const handleViewReport = async (announcementId: number) => {
    setLoadingReport(true);
    setReportModalData(null);
    try {
      const res = await fetch(`/api/announcements/ack?announcementId=${announcementId}`);
      if (res.ok) {
        const data = await res.json();
        setReportModalData(data);
      }
    } catch (err) {
      console.error('Report error:', err);
    } finally {
      setLoadingReport(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-black text-white flex items-center space-x-2.5">
              <Megaphone className="w-6 h-6 text-red-500" />
              <span>Quản Lý Thông Báo & Lịch Nghỉ Chung</span>
            </h1>
            <p className="text-xs text-slate-400 font-medium mt-1">
              Phát thông báo toàn thể nhân sự (Lịch nghỉ lễ, nghỉ bù, lịch công tác) và kiểm soát danh sách xác nhận đã đọc tin
            </p>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="self-start sm:self-auto py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold flex items-center space-x-2 transition shadow-lg shadow-red-950/40"
          >
            <Plus className="w-4 h-4" />
            <span>Tạo Thông Báo Mới</span>
          </button>
        </div>

        {msg && (
          <div
            className={`p-4 rounded-2xl text-xs flex items-center space-x-2.5 ${
              msg.type === 'success'
                ? 'bg-emerald-950/80 border border-emerald-800 text-emerald-300'
                : 'bg-red-950/80 border border-red-800 text-red-300'
            }`}
          >
            {msg.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            )}
            <span>{msg.text}</span>
          </div>
        )}

        {/* Announcements List */}
        {loading ? (
          <div className="p-12 text-center text-slate-500 text-xs font-semibold">
            Đang tải danh sách thông báo...
          </div>
        ) : announcements.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center space-y-3">
            <Megaphone className="w-12 h-12 text-slate-700 mx-auto" />
            <h3 className="text-sm font-bold text-slate-400">Chưa có thông báo nào được phát</h3>
            <p className="text-xs text-slate-500">
              Nhấn &quot;Tạo Thông Báo Mới&quot; để gửi thông báo lịch nghỉ hoặc văn bản đến toàn thể nhân sự.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {announcements.map((item) => (
              <div
                key={item.id}
                className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl flex flex-col justify-between space-y-4 hover:border-slate-700 transition"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg bg-red-950 text-red-400 border border-red-900">
                      {item.category === 'HOLIDAY'
                        ? 'Lịch Nghỉ Lễ / Nghỉ Bù'
                        : item.category === 'SCHEDULE'
                        ? 'Lịch Công Tác'
                        : 'Thông Báo Chung'}
                    </span>

                    <div className="flex items-center space-x-2">
                      {item.isPinned && (
                        <span className="text-[10px] font-bold text-amber-400 bg-amber-950/80 px-2 py-0.5 rounded-full flex items-center space-x-1 border border-amber-900">
                          <Pin className="w-3 h-3" />
                          <span>Ghim</span>
                        </span>
                      )}
                      <span className="text-[11px] text-slate-500">
                        {formatDateVN(item.createdAt)}
                      </span>
                    </div>
                  </div>

                  <h3 className="text-sm font-bold text-white mb-1.5">{item.title}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed line-clamp-3 whitespace-pre-line">
                    {item.content}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                  <div className="text-[11px] text-slate-500">
                    Người tạo: <strong className="text-slate-300">{item.createdBy?.fullName}</strong>
                  </div>

                  <button
                    onClick={() => handleViewReport(item.id)}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center space-x-1.5 transition"
                  >
                    <Users className="w-3.5 h-3.5 text-sky-400" />
                    <span>Xem Xác Nhận Đã Đọc</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

      {/* Create Announcement Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="relative max-w-lg w-full bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-800 space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                <Megaphone className="w-4 h-4 text-red-500" />
                <span>Tạo Thông Báo Toàn Thể Nhân Viên</span>
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 rounded-full text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAnnouncement} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  TIÊU ĐỀ THÔNG BÁO <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="VD: Thông báo Lịch nghỉ Lễ Quốc Khánh 02/09 & Lịch Nghỉ Bù"
                  required
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:outline-hidden focus:border-red-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    CHỦ ĐỀ / THỂ LOẠI
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:outline-hidden focus:border-red-500"
                  >
                    <option value="HOLIDAY">Lịch Nghỉ Lễ / Nghỉ Bù</option>
                    <option value="SCHEDULE">Lịch Công Tác / Sự Kiện</option>
                    <option value="POLICY">Nội Quy & Quy Định</option>
                    <option value="GENERAL">Thông Báo Chung</option>
                  </select>
                </div>

                <div className="flex flex-col justify-end space-y-2">
                  <label className="flex items-center space-x-2 text-xs text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isPinned}
                      onChange={(e) => setIsPinned(e.target.checked)}
                      className="rounded border-slate-700 text-red-600 focus:ring-0 w-4 h-4 bg-slate-950"
                    />
                    <span>Ghim đầu trang</span>
                  </label>

                  <label className="flex items-center space-x-2 text-xs text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={requireAck}
                      onChange={(e) => setRequireAck(e.target.checked)}
                      className="rounded border-slate-700 text-red-600 focus:ring-0 w-4 h-4 bg-slate-950"
                    />
                    <span className="font-bold text-amber-400">Bắt buộc xác nhận đã đọc</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  NỘI DUNG CHI TIẾT <span className="text-red-400">*</span>
                </label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={5}
                  placeholder="Nhập nội dung thông báo đầy đủ cho toàn thể nhân sự..."
                  required
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:outline-hidden focus:border-red-500 leading-relaxed"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-bold rounded-xl text-xs flex items-center justify-center space-x-2 transition shadow-lg shadow-red-950/40"
              >
                <Send className="w-4 h-4" />
                <span>{submitting ? 'Đang phát thông báo...' : 'Phát Thông Báo Cho Toàn Thể Nhân Viên'}</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Acknowledgment Report Modal */}
      {(reportModalData || loadingReport) && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="relative max-w-2xl w-full bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-800 space-y-5 animate-in fade-in zoom-in-95 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                  <Users className="w-4 h-4 text-sky-400" />
                  <span>Danh Sách Nhân Viên Xác Nhận Đã Nhận Thông Báo</span>
                </h3>
                {reportModalData && (
                  <p className="text-xs text-slate-400 mt-0.5 truncate max-w-md">
                    {reportModalData.announcement?.title}
                  </p>
                )}
              </div>
              <button
                onClick={() => setReportModalData(null)}
                className="p-1 rounded-full text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {loadingReport ? (
              <div className="py-12 text-center text-slate-500 text-xs font-semibold">
                Đang tải báo cáo...
              </div>
            ) : (
              reportModalData && (
                <>
                  {/* Stats Counter Bar */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 text-center">
                      <div className="text-[10px] text-slate-400 font-bold uppercase">Tổng nhân sự</div>
                      <div className="text-lg font-black text-white font-mono">{reportModalData.totalEmployees}</div>
                    </div>
                    <div className="p-3 rounded-2xl bg-emerald-950/60 border border-emerald-800 text-center">
                      <div className="text-[10px] text-emerald-400 font-bold uppercase">Đã xác nhận</div>
                      <div className="text-lg font-black text-emerald-400 font-mono">
                        {reportModalData.acknowledgedCount}
                      </div>
                    </div>
                    <div className="p-3 rounded-2xl bg-amber-950/60 border border-amber-800 text-center">
                      <div className="text-[10px] text-amber-400 font-bold uppercase">Chưa xác nhận</div>
                      <div className="text-lg font-black text-amber-400 font-mono">
                        {reportModalData.unacknowledgedCount}
                      </div>
                    </div>
                  </div>

                  {/* Employees Detailed Table */}
                  <div className="flex-1 overflow-y-auto border border-slate-800 rounded-2xl">
                    <table className="w-full text-left text-xs text-slate-300">
                      <thead className="bg-slate-950 text-slate-400 text-[10px] uppercase font-semibold sticky top-0 border-b border-slate-800">
                        <tr>
                          <th className="px-4 py-2.5">Mã NV</th>
                          <th className="px-4 py-2.5">Họ và Tên</th>
                          <th className="px-4 py-2.5">Phòng ban</th>
                          <th className="px-4 py-2.5">Trạng thái xác nhận</th>
                          <th className="px-4 py-2.5 text-right">Mốc giờ lưu vết</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 font-medium">
                        {reportModalData.report.map((emp: any) => (
                          <tr key={emp.id} className="hover:bg-slate-800/40">
                            <td className="px-4 py-2.5 font-mono font-bold text-white">
                              {emp.employeeCode}
                            </td>
                            <td className="px-4 py-2.5 font-bold text-white">
                              {emp.fullName}
                            </td>
                            <td className="px-4 py-2.5 text-slate-400">
                              {emp.department || 'Chung'}
                            </td>
                            <td className="px-4 py-2.5">
                              {emp.hasAcknowledged ? (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800 flex items-center space-x-1 w-fit">
                                  <CheckCircle2 className="w-3 h-3" />
                                  <span>Đã xác nhận</span>
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-950 text-amber-400 border border-amber-800 flex items-center space-x-1 w-fit">
                                  <AlertCircle className="w-3 h-3" />
                                  <span>Chưa xác nhận</span>
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-2.5 text-right font-mono text-[11px] text-slate-400">
                              {emp.acknowledgedAt
                                ? `${formatTimeVN(emp.acknowledgedAt)} ${formatDateVN(emp.acknowledgedAt)}`
                                : '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )
            )}
          </div>
        </div>
      )}
    </div>
  );
}
