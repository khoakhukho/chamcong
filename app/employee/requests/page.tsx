'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import EmployeeHeader from '@/components/layout/EmployeeHeader';
import { FilePlus, FileText, Send, Calendar, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { formatDateVN, getLeaveTypeLabel, getLeaveStatusBadge } from '@/lib/utils';

export default function EmployeeRequestsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [leaveType, setLeaveType] = useState('ANNUAL');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [daysCount, setDaysCount] = useState('1');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showForm, setShowForm] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const meRes = await fetch('/api/auth/me');
      if (!meRes.ok) {
        router.push('/login');
        return;
      }
      const meData = await meRes.json();
      setUser(meData.user);

      const res = await fetch('/api/employee/requests');
      if (res.ok) {
        const data = await res.json();
        setRequests(data.requests || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMsg(null);

    try {
      const res = await fetch('/api/employee/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leaveType,
          fromDate,
          toDate,
          daysCount,
          reason,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Lỗi gửi đơn');

      setMsg({ type: 'success', text: data.message });
      setReason('');
      setFromDate('');
      setToDate('');
      setShowForm(false);
      await loadData();
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      <EmployeeHeader user={user} />

      <main className="flex-1 max-w-md w-full mx-auto px-4 py-5 space-y-4">
        {/* Top Header & Toggle New Form Button */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Đơn Từ & Nghỉ Phép</h2>
            <p className="text-xs text-slate-500 font-medium">Gửi đơn xin nghỉ phép, giải trình công</p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="py-2 px-3.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center space-x-1.5 transition"
          >
            <FilePlus className="w-4 h-4" />
            <span>{showForm ? 'Đóng form' : 'Tạo đơn mới'}</span>
          </button>
        </div>

        {/* Messages */}
        {msg && (
          <div
            className={`p-3.5 rounded-2xl text-xs flex items-center space-x-2.5 ${
              msg.type === 'success'
                ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                : 'bg-rose-50 border border-rose-200 text-rose-800'
            }`}
          >
            {msg.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span className="font-medium">{msg.text}</span>
          </div>
        )}

        {/* Create Request Form Accordion */}
        {showForm && (
          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-3xl p-5 shadow-md border border-slate-200 space-y-3.5"
          >
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center space-x-1.5 border-b border-slate-100 pb-2">
              <FileText className="w-4 h-4 text-red-600" />
              <span>Điền Thông Tin Đơn</span>
            </h3>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Loại đơn / Lý do
              </label>
              <select
                value={leaveType}
                onChange={(e) => setLeaveType(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-hidden focus:border-red-500"
              >
                <option value="ANNUAL">Nghỉ phép năm (Có lương)</option>
                <option value="SICK">Nghỉ ốm đau (BHXH)</option>
                <option value="UNPAID">Nghỉ việc riêng không lương</option>
                <option value="LATE_EXCUSE">Giải trình đi muộn / Quên chấm công</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Từ ngày
                </label>
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:border-red-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Đến ngày
                </label>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:border-red-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Số ngày công xin nghỉ (0.5 hoặc 1.0, 2.0...)
              </label>
              <input
                type="number"
                step="0.5"
                min="0.5"
                value={daysCount}
                onChange={(e) => setDaysCount(e.target.value)}
                required
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:border-red-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Lý do chi tiết
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Vui lòng ghi rõ lý do xin nghỉ hoặc nguyên nhân cần giải trình..."
                rows={3}
                required
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:border-red-500"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl shadow-md flex items-center justify-center space-x-2 transition disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              <span>{submitting ? 'Đang gửi...' : 'GỬI ĐƠN XÉT DUYỆT'}</span>
            </button>
          </form>
        )}

        {/* Requests List */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Lịch Sử Đơn Đã Gửi ({requests.length})
          </h3>

          {loading ? (
            <div className="p-8 text-center text-slate-500 text-xs font-semibold">
              Đang tải danh sách đơn...
            </div>
          ) : requests.length === 0 ? (
            <div className="bg-white rounded-3xl p-8 shadow-xs border border-slate-200 text-center space-y-2">
              <FileText className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-xs text-slate-500 font-semibold">Bạn chưa gửi đơn nào</p>
            </div>
          ) : (
            requests.map((item) => {
              const badge = getLeaveStatusBadge(item.status);
              return (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl p-4 shadow-xs border border-slate-200 space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">
                      {getLeaveTypeLabel(item.leaveType)}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badge.color}`}
                    >
                      {badge.label}
                    </span>
                  </div>

                  <div className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100 space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-500">Thời gian nghỉ:</span>
                      <strong className="text-slate-800">
                        {formatDateVN(item.fromDate)} &rarr; {formatDateVN(item.toDate)} ({item.daysCount} ngày)
                      </strong>
                    </div>
                    <div className="pt-1 text-slate-700">
                      <span className="text-slate-400">Lý do: </span>
                      {item.reason}
                    </div>
                  </div>

                  {item.reviewNotes && (
                    <div className="text-[11px] text-slate-500 bg-amber-50 p-2 rounded-lg border border-amber-100">
                      <strong className="text-amber-800">Ý kiến duyệt: </strong>
                      {item.reviewNotes}
                    </div>
                  )}

                  <div className="text-[10px] text-slate-400 text-right">
                    Gửi ngày: {formatDateVN(item.createdAt)}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </main>
    </div>
  );
}
