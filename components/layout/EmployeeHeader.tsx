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
  FolderKanban,
} from 'lucide-react';
import NotificationBell from '@/components/notifications/NotificationBell';
import NotificationToaster from '@/components/notifications/NotificationToaster';
import MobileBottomNav from '@/components/layout/MobileBottomNav';

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

  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setSaveError('Vui lòng chọn file hình ảnh (PNG, JPG, WebP)');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setSaveError('Kích thước ảnh không được vượt quá 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setAvatarPreview(event.target?.result as string);
      setSaveError(null);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveAvatar = async () => {
    if (!avatarPreview) return;
    setSavingAvatar(true);
    setSaveError(null);

    try {
      const res = await fetch('/api/employee/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ avatarUrl: avatarPreview }),
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
    { href: '/employee/projects', label: 'Dự Án & Báo Cáo', icon: FolderKanban },
    { href: '/employee/requests', label: 'Đơn Từ & Nghỉ Phép', icon: FileText },
    { href: '/employee/history', label: 'Lịch Sử Hoạt Động', icon: History },
  ];

  return (
    <>
      {/* Floating Real-time Notification Toasts */}
      <NotificationToaster />

      {/* Mobile Native-Style Bottom Navigation Bar */}
      <MobileBottomNav userRole={user.role} onOpenProfile={() => setShowProfileModal(true)} />

      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
        {/* Top Banner */}
        <div className="max-w-4xl mx-auto px-3.5 py-2.5 flex items-center justify-between">
          <Link href="/chamcong" className="flex items-center space-x-2.5 group">
            <img
              src="/logo.png"
              alt="Logo Caritas Đà Lạt"
              className="w-9 h-9 rounded-xl object-contain shadow-xs border border-slate-100 bg-white p-0.5 group-hover:scale-105 transition"
            />
            <div>
              <h1 className="text-sm font-black text-slate-900 leading-tight tracking-tight">
                CARITAS ĐÀ LẠT
              </h1>
              <p className="text-[10px] text-slate-500 font-medium">
                Cổng Dịch Vụ & Quản Trị
              </p>
            </div>
          </Link>

          <div className="flex items-center space-x-1.5 sm:space-x-2">
            {['ADMIN', 'ACCOUNTANT', 'MANAGER'].includes(user.role) && (
              <Link
                href="/admin/dashboard"
                className="hidden sm:inline-flex px-2.5 py-1 text-xs font-bold rounded-lg bg-slate-900 text-white hover:bg-slate-800 transition"
              >
                Quản Trị
              </Link>
            )}

            {/* Notification Bell */}
            <NotificationBell />

            {/* Profile Avatar Button */}
            <button
              onClick={() => setShowProfileModal(true)}
              title="Xem & Đổi ảnh đại diện"
              className="relative w-8 h-8 rounded-full border border-slate-200 overflow-hidden bg-slate-100 hover:ring-2 hover:ring-red-500 transition shrink-0 cursor-pointer"
            >
              {avatarPreview ? (
                <img src={avatarPreview} alt={user.fullName} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-red-700 text-white font-bold text-xs flex items-center justify-center">
                  {user.fullName ? user.fullName.charAt(0) : 'U'}
                </div>
              )}
            </button>

            {/* Logout button (Desktop) */}
            <button
              onClick={handleLogout}
              title="Đăng xuất"
              className="hidden md:inline-flex p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* User Identity Sub-bar */}
        <div className="bg-slate-50/80 border-t border-slate-100 px-3.5 py-1.5 text-xs text-slate-600">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <div className="flex items-center space-x-2 truncate">
              <span className="font-semibold text-slate-900 truncate">
                {user.fullName}
              </span>
              <span className="font-mono text-[10px] text-slate-600 font-bold bg-slate-200/80 px-1.5 py-0.5 rounded">
                {user.employeeCode}
              </span>
            </div>
            <div className="text-[10px] text-slate-500 flex items-center space-x-1 shrink-0">
              <Building2 className="w-3 h-3 text-slate-400" />
              <span className="truncate max-w-[150px] sm:max-w-xs">{user.department || 'Văn phòng Caritas'}</span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs (Desktop only - Mobile uses bottom nav) */}
        <nav className="hidden md:flex bg-white border-t border-slate-100 px-4">
          <div className="max-w-4xl mx-auto w-full flex space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center space-x-1.5 py-2.5 px-3 text-xs font-semibold border-b-2 transition ${
                    isActive
                      ? 'border-red-600 text-red-600'
                      : 'border-transparent text-slate-500 hover:text-slate-900'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      </header>

      {/* Profile & Avatar Modal */}
      {showProfileModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-red-600" />
                <h3 className="text-sm font-bold text-slate-900">Hồ Sơ & Ảnh Đại Diện</h3>
              </div>
              <button
                onClick={() => setShowProfileModal(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-col items-center space-y-3 py-2">
              <div className="relative w-24 h-24 rounded-full border-4 border-slate-100 overflow-hidden bg-slate-100 shadow-md">
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-red-700 text-white font-black text-2xl flex items-center justify-center">
                    {user.fullName ? user.fullName.charAt(0) : 'U'}
                  </div>
                )}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarFileChange}
                className="hidden"
              />

              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl flex items-center space-x-1.5 transition cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5 text-red-600" />
                <span>Chọn ảnh khuôn mặt mới</span>
              </button>
            </div>

            <div className="bg-slate-50 p-3 rounded-2xl text-xs space-y-1.5 border border-slate-100">
              <div className="flex justify-between">
                <span className="text-slate-500">Họ và tên:</span>
                <strong className="text-slate-800">{user.fullName}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Mã nhân sự:</span>
                <strong className="font-mono text-red-600">{user.employeeCode}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Phòng ban:</span>
                <strong className="text-slate-800">{user.department || 'Chung'}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Vai trò:</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-200 text-slate-800">
                  {user.role}
                </span>
              </div>
            </div>

            {saveSuccess && (
              <div className="p-2.5 bg-emerald-50 text-emerald-800 text-xs rounded-xl flex items-center space-x-2 border border-emerald-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Đã lưu ảnh đại diện thành công!</span>
              </div>
            )}

            {saveError && (
              <div className="p-2.5 bg-red-50 text-red-800 text-xs rounded-xl border border-red-200">
                {saveError}
              </div>
            )}

            <div className="flex items-center space-x-2 pt-2">
              <button
                onClick={handleSaveAvatar}
                disabled={savingAvatar || !avatarPreview}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-md transition cursor-pointer"
              >
                {savingAvatar ? 'Đang lưu...' : 'LƯU ẢNH HỒ SƠ'}
              </button>
              <button
                onClick={handleLogout}
                className="py-2.5 px-3 bg-slate-100 hover:bg-rose-50 text-rose-700 text-xs font-bold rounded-xl transition flex items-center space-x-1 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Đăng xuất</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
