'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { MapPin, Plus, Edit2, Trash2, Crosshair, CheckCircle2 } from 'lucide-react';

export default function AdminLocationsPage() {
  const [locations, setLocations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<any | null>(null);

  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [radiusMeters, setRadiusMeters] = useState('150');
  const [submitting, setSubmitting] = useState(false);
  const [gettingGPS, setGettingGPS] = useState(false);

  const loadLocations = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/locations');
      if (res.ok) {
        const data = await res.json();
        setLocations(data.locations || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLocations();
  }, [loadLocations]);

  const openCreate = () => {
    setEditingLocation(null);
    setName('');
    setAddress('');
    setLatitude('');
    setLongitude('');
    setRadiusMeters('150');
    setIsModalOpen(true);
  };

  const openEdit = (loc: any) => {
    setEditingLocation(loc);
    setName(loc.name);
    setAddress(loc.address || '');
    setLatitude(loc.latitude.toString());
    setLongitude(loc.longitude.toString());
    setRadiusMeters(loc.radiusMeters.toString());
    setIsModalOpen(true);
  };

  const handleGetCurrentGPS = () => {
    if (!navigator.geolocation) return;
    setGettingGPS(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(pos.coords.latitude.toFixed(6));
        setLongitude(pos.coords.longitude.toFixed(6));
        setGettingGPS(false);
      },
      (err) => {
        alert('Không lấy được GPS hiện tại: ' + err.message);
        setGettingGPS(false);
      },
      { enableHighAccuracy: true }
    );
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingLocation) {
        await fetch('/api/admin/locations', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: editingLocation.id,
            name,
            address,
            latitude,
            longitude,
            radiusMeters,
          }),
        });
      } else {
        await fetch('/api/admin/locations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name,
            address,
            latitude,
            longitude,
            radiusMeters,
          }),
        });
      }
      setIsModalOpen(false);
      await loadLocations();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Bạn có chắc chắn muốn xóa địa điểm này không?')) return;
    try {
      await fetch(`/api/admin/locations?id=${id}`, { method: 'DELETE' });
      await loadLocations();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">
            Quản Lý Địa Điểm Chấm Công (Geofencing)
          </h1>
          <p className="text-xs text-slate-400 font-medium mt-1">
            Thiết lập danh sách các văn phòng, trạm cơ sở Caritas và bán kính cho phép quẹt thẻ
          </p>
        </div>

        <button
          onClick={openCreate}
          className="self-start sm:self-auto py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold flex items-center space-x-2 transition shadow-lg shadow-red-950/40"
        >
          <Plus className="w-4 h-4" />
          <span>Thêm Địa Điểm Mới</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="p-8 text-center text-slate-500 text-xs font-semibold col-span-full">
            Đang tải danh sách địa điểm...
          </div>
        ) : locations.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-xs font-semibold col-span-full bg-slate-900 border border-slate-800 rounded-3xl">
            Chưa có địa điểm nào được cấu hình.
          </div>
        ) : (
          locations.map((loc) => (
            <div
              key={loc.id}
              className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-lg space-y-3"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-2">
                  <MapPin className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-bold text-white text-sm">{loc.name}</h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">{loc.address || 'Chưa cập nhật địa chỉ'}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-1 shrink-0">
                  <button
                    onClick={() => openEdit(loc)}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                    title="Sửa"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(loc.id)}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950 hover:text-rose-400 text-slate-400 transition"
                    title="Xóa"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800/80 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Tọa độ GPS:</span>
                  <span className="font-mono text-emerald-400 font-semibold">
                    {loc.latitude.toFixed(6)}, {loc.longitude.toFixed(6)}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-slate-900">
                  <span className="text-slate-400">Bán kính cho phép:</span>
                  <span className="font-bold text-white">{loc.radiusMeters} mét</span>
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
              {editingLocation ? 'Chỉnh Sửa Địa Điểm' : 'Thêm Địa Điểm Chấm Công Mới'}
            </h2>

            <form onSubmit={handleSave} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-400 mb-1">TÊN ĐỊA ĐIỂM / CƠ SỞ</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="VD: Văn phòng Caritas Đà Lạt (Tòa Giám Mục)"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-hidden focus:border-red-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-400 mb-1">ĐỊA CHỈ THỰC TẾ</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="09 Nguyễn Trường Tộ, Phường 4, TP. Đà Lạt"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-hidden focus:border-red-500"
                />
              </div>

              <div className="pt-1">
                <button
                  type="button"
                  onClick={handleGetCurrentGPS}
                  disabled={gettingGPS}
                  className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center space-x-1.5 border border-slate-700 transition"
                >
                  <Crosshair className={`w-3.5 h-3.5 ${gettingGPS ? 'animate-spin' : 'text-red-400'}`} />
                  <span>{gettingGPS ? 'Đang lấy GPS...' : 'Lấy Tọa Độ Vị Trí Hiện Tại Của Tôi'}</span>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-400 mb-1">VĨ ĐỘ (Latitude)</label>
                  <input
                    type="number"
                    step="0.000001"
                    value={latitude}
                    onChange={(e) => setLatitude(e.target.value)}
                    required
                    placeholder="11.936085"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono focus:outline-hidden focus:border-red-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-400 mb-1">KINH ĐỘ (Longitude)</label>
                  <input
                    type="number"
                    step="0.000001"
                    value={longitude}
                    onChange={(e) => setLongitude(e.target.value)}
                    required
                    placeholder="108.437142"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono focus:outline-hidden focus:border-red-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-400 mb-1">BÁN KÍNH HỢP LỆ (Mét)</label>
                <input
                  type="number"
                  value={radiusMeters}
                  onChange={(e) => setRadiusMeters(e.target.value)}
                  required
                  min="20"
                  placeholder="150"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-hidden focus:border-red-500"
                />
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
                  {submitting ? 'Đang lưu...' : 'Lưu Địa Điểm'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
