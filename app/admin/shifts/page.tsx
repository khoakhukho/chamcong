'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Clock, Plus, Edit2, CheckCircle2 } from 'lucide-react';

export default function AdminShiftsPage() {
  const [shifts, setShifts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingShift, setEditingShift] = useState<any | null>(null);
  const [name, setName] = useState('');
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('17:00');
  const [allowedLateMinutes, setAllowedLateMinutes] = useState('15');
  const [allowedEarlyMinutes, setAllowedEarlyMinutes] = useState('15');
  const [submitting, setSubmitting] = useState(false);

  const loadShifts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/shifts');
      if (res.ok) {
        const data = await res.json();
        setShifts(data.shifts || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadShifts();
  }, [loadShifts]);

  const openCreate = () => {
    setEditingShift(null);
    setName('');
    setStartTime('08:00');
    setEndTime('17:00');
    setAllowedLateMinutes('15');
    setAllowedEarlyMinutes('15');
    setIsModalOpen(true);
  };

  const openEdit = (s: any) => {
    setEditingShift(s);
    setName(s.name);
    setStartTime(s.startTime);
    setEndTime(s.endTime);
    setAllowedLateMinutes(s.allowedLateMinutes.toString());
    setAllowedEarlyMinutes(s.allowedEarlyMinutes.toString());
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingShift) {
        await fetch('/api/admin/shifts', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: editingShift.id,
            name,
            startTime,
            endTime,
            allowedLateMinutes,
            allowedEarlyMinutes,
          }),
        });
      } else {
        await fetch('/api/admin/shifts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name,
            startTime,
            endTime,
            allowedLateMinutes,
            allowedEarlyMinutes,
          }),
        });
      }
      setIsModalOpen(false);
      await loadShifts();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Cấu Hình Ca Làm Việc</h1>
          <p className="text-xs text-slate-400 font-medium mt-1">
            Thiết lập thời gian vào ca, ra ca và khoảng dung sai đi muộn / về sớm
          </p>
        </div>

        <button
          onClick={openCreate}
          className="self-start sm:self-auto py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold flex items-center space-x-2 transition shadow-lg shadow-red-950/40"
        >
          <Plus className="w-4 h-4" />
          <span>Thêm Ca Mới</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="p-8 text-center text-slate-500 text-xs font-semibold col-span-full">
            Đang tải danh sách ca...
          </div>
        ) : (
          shifts.map((shift) => (
            <div
              key={shift.id}
              className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-lg space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-red-500" />
                  <h3 className="font-bold text-white text-sm">{shift.name}</h3>
                </div>
                <button
                  onClick={() => openEdit(shift)}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                  title="Chỉnh sửa"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800/80 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Giờ vào chuẩn:</span>
                  <span className="font-bold font-mono text-emerald-400">{shift.startTime}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Giờ ra chuẩn:</span>
                  <span className="font-bold font-mono text-blue-400">{shift.endTime}</span>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-slate-900">
                  <span className="text-slate-400">Cho phép trễ:</span>
                  <span className="font-semibold text-amber-400">{shift.allowedLateMinutes} phút</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Cho phép về sớm:</span>
                  <span className="font-semibold text-amber-400">{shift.allowedEarlyMinutes} phút</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 text-slate-200">
            <h2 className="text-base font-bold text-white border-b border-slate-800 pb-3">
              {editingShift ? 'Chỉnh Sửa Ca Làm Việc' : 'Tạo Ca Làm Việc Mới'}
            </h2>

            <form onSubmit={handleSave} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-400 mb-1">TÊN CA</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="VD: Ca Hành Chính Chuẩn"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-hidden focus:border-red-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-400 mb-1">GIỜ VÀO (HH:mm)</label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono focus:outline-hidden focus:border-red-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-400 mb-1">GIỜ RA (HH:mm)</label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono focus:outline-hidden focus:border-red-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-400 mb-1">CHO PHÉP TRỄ (Phút)</label>
                  <input
                    type="number"
                    value={allowedLateMinutes}
                    onChange={(e) => setAllowedLateMinutes(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-hidden focus:border-red-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-400 mb-1">CHO PHÉP VỀ SỚM (Phút)</label>
                  <input
                    type="number"
                    value={allowedEarlyMinutes}
                    onChange={(e) => setAllowedEarlyMinutes(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-hidden focus:border-red-500"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl shadow-md disabled:opacity-50"
                >
                  {submitting ? 'Đang lưu...' : 'Lưu Ca'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
