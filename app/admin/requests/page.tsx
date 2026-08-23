'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { FileCheck2, CheckCircle2, XCircle, Clock, Search, Filter } from 'lucide-react';
import { formatDateVN, getLeaveTypeLabel, getLeaveStatusBadge } from '@/lib/utils';

export default function AdminRequestsPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('PENDING');

  // Review Action Modal
  const [selectedRequest, setSelectedRequest] = useState<any | null>(null);
  const [actionStatus, setActionStatus] = useState<'APPROVED' | 'REJECTED'>('APPROVED');
  const [reviewNotes, setReviewNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadRequests = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/requests?status=${filterStatus}`);
      if (res.ok) {
        const data = await res.json();
        setRequests(data.requests || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [filterStatus]);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  const openReviewModal = (req: any, status: 'APPROVED' | 'REJECTED') => {
    setSelectedRequest(req);
    setActionStatus(status);
    setReviewNotes('');
  };

  const handleConfirmReview = async () => {
    if (!selectedRequest) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/requests', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedRequest.id,
          status: actionStatus,
          reviewNotes,
        }),
      });

      if (res.ok) {
        setSelectedRequest(null);
        await loadRequests();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">
            Xét Duyệt Đơn Từ & Nghỉ Phép
          </h1>
          <p className="text-xs text-slate-400 font-medium mt-1">
            Duyệt hoặc từ chối các đơn xin nghỉ phép năm, nghỉ ốm, việc riêng và giải trình công
          </p>
        </div>

        {/* Status Filters */}
        <div className="flex items-center space-x-1.5 bg-slate-900 border border-slate-800 p-1 rounded-2xl">
          {[
            { key: 'PENDING', label: 'Chờ duyệt' },
            { key: 'APPROVED', label: 'Đã duyệt' },
            { key: 'REJECTED', label: 'Từ chối' },
            { key: 'ALL', label: 'Tất cả' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilterStatus(tab.key)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                filterStatus === tab.key
                  ? 'bg-red-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Requests Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 text-[11px] uppercase tracking-wider font-semibold border-b border-slate-800">
              <tr>
                <th className="px-5 py-3.5">Nhân viên</th>
                <th className="px-5 py-3.5">Phòng ban</th>
                <th className="px-5 py-3.5">Loại đơn</th>
                <th className="px-5 py-3.5">Thời gian xin nghỉ</th>
                <th className="px-5 py-3.5">Lý do chi tiết</th>
                <th className="px-5 py-3.5">Trạng thái</th>
                <th className="px-5 py-3.5 text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-slate-500">
                    Đang tải danh sách đơn...
                  </td>
                </tr>
              ) : requests.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-slate-500">
                    Không có đơn nào ở trạng thái này.
                  </td>
                </tr>
              ) : (
                requests.map((req) => {
                  const badge = getLeaveStatusBadge(req.status);
                  return (
                    <tr key={req.id} className="hover:bg-slate-800/40 transition">
                      <td className="px-5 py-3.5">
                        <div className="font-bold text-white">{req.user?.fullName}</div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          {req.user?.employeeCode}
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-slate-300">
                        {req.user?.department || 'Chung'}
                      </td>
                      <td className="px-5 py-3.5 font-semibold text-slate-200">
                        {getLeaveTypeLabel(req.leaveType)}
                      </td>
                      <td className="px-5 py-3.5 font-mono text-slate-300">
                        <div>
                          {formatDateVN(req.fromDate)} &rarr; {formatDateVN(req.toDate)}
                        </div>
                        <span className="text-[10px] text-red-400 font-bold">
                          ({req.daysCount} ngày công)
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-slate-300 max-w-xs">
                        <div className="line-clamp-2">{req.reason}</div>
                        {req.reviewNotes && (
                          <div className="mt-1 text-[10px] text-amber-300 italic">
                            Ý kiến: {req.reviewNotes}
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${badge.color}`}
                        >
                          {badge.label}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        {req.status === 'PENDING' ? (
                          <div className="flex items-center justify-end space-x-1.5">
                            <button
                              onClick={() => openReviewModal(req, 'APPROVED')}
                              className="py-1 px-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center space-x-1"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Duyệt</span>
                            </button>
                            <button
                              onClick={() => openReviewModal(req, 'REJECTED')}
                              className="py-1 px-2.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition flex items-center space-x-1"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              <span>Từ chối</span>
                            </button>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-500">Đã xử lý</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Review Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 text-slate-200 text-xs">
            <h2 className="text-base font-bold text-white border-b border-slate-800 pb-3">
              {actionStatus === 'APPROVED' ? 'Xác Nhận Duyệt Đơn' : 'Xác Nhận Từ Chối Đơn'}
            </h2>

            <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 space-y-1.5">
              <div>
                Nhân viên: <strong className="text-white">{selectedRequest.user?.fullName}</strong> ({selectedRequest.user?.employeeCode})
              </div>
              <div>
                Loại đơn: <strong className="text-red-400">{getLeaveTypeLabel(selectedRequest.leaveType)}</strong>
              </div>
              <div>
                Lý do: <span className="text-slate-300 italic">{selectedRequest.reason}</span>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-400 mb-1">
                Ý kiến hoặc ghi chú của Ban Quản Trị (Tùy chọn)
              </label>
              <textarea
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                placeholder="VD: Đồng ý nghỉ phép / Cần bổ sung giấy khám của bác sĩ..."
                rows={3}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-hidden focus:border-red-500"
              />
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setSelectedRequest(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleConfirmReview}
                disabled={submitting}
                className={`px-5 py-2 text-white font-bold rounded-xl shadow-md transition disabled:opacity-50 ${
                  actionStatus === 'APPROVED'
                    ? 'bg-emerald-600 hover:bg-emerald-500'
                    : 'bg-rose-600 hover:bg-rose-500'
                }`}
              >
                {submitting
                  ? 'Đang xử lý...'
                  : actionStatus === 'APPROVED'
                  ? 'Xác Nhận Duyệt'
                  : 'Xác Nhận Từ Chối'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
