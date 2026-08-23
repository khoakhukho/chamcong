'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Camera,
  History,
  FileText,
  LogOut,
  User,
  Building2,
  Upload,
  CheckCircle2,
  X,
  Sparkles,
  Shield,
} from 'lucide-react';

interface EmployeeHeaderProps {
  user: {
    id?: number;
    fullName: string;
    employeeCode: string;
    department?: string | null;
    contractType?: string | null;
    avatarUrl?: string | null;
    role: string;
  };
}

export default function EmployeeHeader({ user }: EmployeeHeaderProps) {
  const pathname = usePathname();
  const router = useRouter();

  // Profile / Avatar Modal State
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(user.avatarUrl || null);
  const [savingAvatar, setSavingAvatar] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
      router.refresh();
    } catch {
      router.push('/login');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (reader.result) {
        setAvatarPreview(reader.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveAvatar = async () => {
    if (!avatarPreview) return;
    setSavingAvatar(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      const res = await fetch('/api/employee/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ avatarImageData: avatarPreview }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Lỗi lưu ảnh');

      setSaveSuccess(true);
      setTimeout(() => {
        setShowProfileModal(false);
        router.refresh();
      }, 1200);
    } catch (err: any) {
      setSaveError(err.message);
    } finally {
      setSavingAvatar(false);
    }
  };

  const navItems = [
    { href: '/chamcong', label: 'Chấm Công', icon: Camera },
    { href: '/employee/history', label: 'Lịch Sử', icon: History },
    { href: '/employee/requests', label: 'Đơn Từ', icon: FileText },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-xs">
        {/* Top Banner */}
        <div className="max-w-4xl mx-auto px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <img
              src="/logo.png"
              alt="Logo Caritas Đà Lạt"
              className="w-10 h-10 rounded-xl object-contain shadow-xs border border-slate-100 bg-white p-0.5"
            />
            <div>
              <h1 className="text-sm font-bold text-slate-900 leading-tight">
                CARITAS ĐÀ LẠT
              </h1>
              <p className="text-[11px] text-slate-500 font-medium">
                Chấm Công Nội Bộ
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {['ADMIN', 'ACCOUNTANT', 'MANAGER'].includes(user.role) && (
              <Link
                href="/admin/dashboard"
                className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-900 text-white hover:bg-slate-800 transition"
              >
                Quản Trị
              </Link>
            )}

            {/* Profile Avatar Button */}
            <button
              onClick={() => setShowProfileModal(true)}
              title="Xem & Đổi ảnh đại diện"
              className="relative w-8 h-8 rounded-full border border-slate-200 overflow-hidden bg-slate-100 hover:ring-2 hover:ring-red-500 transition shrink-0"
            >
              {avatarPreview ? (
                <img src={avatarPreview} alt={user.fullName} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-red-100 text-red-700 font-bold text-xs uppercase">
                  {user.fullName.charAt(0)}
                </div>
              )}
            </button>

            <button
              onClick={handleLogout}
              title="Đăng xuất"
              className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* User Info Strip */}
        <div className="bg-slate-50 border-t border-slate-100 px-4 py-1.5 text-xs text-slate-600">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <button
              onClick={() => setShowProfileModal(true)}
              className="flex items-center space-x-2 text-left hover:text-red-600 transition"
            >
              <span className="font-semibold text-slate-800 hover:text-red-600">{user.fullName}</span>
              <span className="text-[11px] bg-slate-200 text-slate-700 px-1.5 py-0.2 rounded font-mono font-bold">
                {user.employeeCode}
              </span>
            </button>
            {user.department && (
              <span className="text-[11px] text-slate-500 flex items-center space-x-1">
                <Building2 className="w-3 h-3 text-slate-400" />
                <span>{user.department}</span>
              </span>
            )}
          </div>
        </div>

        {/* Bottom Tab Bar (Mobile First Navigation) */}
        <nav className="max-w-4xl mx-auto flex border-t border-slate-100">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex-1 py-2.5 flex items-center justify-center space-x-1.5 text-xs font-semibold transition border-b-2 ${
                  isActive
                    ? 'border-red-600 text-red-600 bg-red-50/50'
                    : 'border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </header>

      {/* Profile & Avatar Management Modal */}
      {showProfileModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="relative max-w-sm w-full bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                <User className="w-4 h-4 text-red-600" />
                <span>Hồ Sơ & Ảnh Đại Diện Cá Nhân</span>
              </h3>
              <button
                onClick={() => setShowProfileModal(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Avatar Centered Preview */}
            <div className="flex flex-col items-center space-y-3">
              <div className="relative w-24 h-24 rounded-3xl border-4 border-slate-100 shadow-md overflow-hidden bg-slate-100 flex items-center justify-center">
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <div className="text-2xl font-black text-red-600 uppercase">
                    {user.fullName.charAt(0)}
                  </div>
                )}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />

              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl flex items-center space-x-1.5 transition"
              >
                <Upload className="w-3.5 h-3.5 text-red-600" />
                <span>Chọn ảnh khuôn mặt mới</span>
              </button>
            </div>

            {/* Info details */}
            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 space-y-2 text-xs text-slate-600">
              <div className="flex justify-between">
                <span className="text-slate-400">Họ và tên:</span>
                <span className="font-bold text-slate-800">{user.fullName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Tên đăng nhập:</span>
                <span className="font-mono font-bold text-slate-800">{user.employeeCode}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Phòng ban:</span>
                <span className="font-medium text-slate-800">{user.department || 'Caritas Đà Lạt'}</span>
              </div>
            </div>

            {saveSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Cập nhật ảnh đại diện thành công!</span>
              </div>
            )}

            {saveError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs">
                {saveError}
              </div>
            )}

            <button
              onClick={handleSaveAvatar}
              disabled={savingAvatar || !avatarPreview || avatarPreview === user.avatarUrl}
              className="w-full py-3 bg-red-600 hover:bg-red-500 disabled:opacity-40 text-white font-bold rounded-xl text-xs transition flex items-center justify-center space-x-2 shadow-lg shadow-red-900/20"
            >
              <Sparkles className="w-4 h-4" />
              <span>{savingAvatar ? 'Đang lưu ảnh...' : 'Lưu Ảnh Đại Diện Mới'}</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
}
