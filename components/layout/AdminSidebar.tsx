'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Clock,
  MapPin,
  FileCheck2,
  ListOrdered,
  FileSpreadsheet,
  Megaphone,
  FolderKanban,
  LogOut,
  Camera,
  ShieldCheck,
  Menu,
  X,
} from 'lucide-react';

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
      router.refresh();
    } catch {
      router.push('/login');
    }
  };

  const menuItems = [
    { href: '/admin/dashboard', label: 'Bảng Điều Khiển', icon: LayoutDashboard },
    { href: '/admin/attendance', label: 'Nhật Ký Chấm Công', icon: ListOrdered },
    { href: '/admin/projects', label: 'Quản Lý Dự Án & Báo Cáo', icon: FolderKanban },
    { href: '/admin/announcements', label: 'Thông Báo & Lịch Nghỉ', icon: Megaphone },
    { href: '/admin/requests', label: 'Duyệt Đơn Từ', icon: FileCheck2 },
    { href: '/admin/reports', label: 'Xuất Báo Cáo Excel', icon: FileSpreadsheet },
    { href: '/admin/employees', label: 'Quản Lý Nhân Sự', icon: Users },
    { href: '/admin/shifts', label: 'Ca Làm Việc', icon: Clock },
    { href: '/admin/locations', label: 'Địa Điểm Chấm Công', icon: MapPin },
  ];

  return (
    <>
      {/* Mobile Top App Bar with Hamburger (md:hidden) */}
      <div className="md:hidden bg-slate-900 border-b border-slate-800 px-4 py-3 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center space-x-2.5">
          <img
            src="/logo.png"
            alt="Logo Caritas Đà Lạt"
            className="w-8 h-8 rounded-lg object-contain bg-white p-0.5"
          />
          <div>
            <h2 className="text-xs font-black text-white tracking-tight">CARITAS ĐÀ LẠT</h2>
            <span className="text-[9px] font-bold text-red-400">Quản Trị Hệ Thống</span>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Link
            href="/chamcong"
            className="p-1.5 rounded-lg bg-slate-800 text-emerald-400 hover:text-emerald-300 transition"
            title="Chấm công"
          >
            <Camera className="w-4 h-4" />
          </Link>
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white transition cursor-pointer"
            title="Mở menu quản trị"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Slide-over Drawer Backdrop */}
      {isMobileMenuOpen && (
        <div
          onClick={() => setIsMobileMenuOpen(false)}
          className="md:hidden fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-150"
        />
      )}

      {/* Sidebar Content (Desktop Sidebar + Mobile Drawer) */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-50 w-72 md:w-64 bg-slate-900 border-r border-slate-800 text-slate-300 flex flex-col shrink-0 min-h-screen transition-transform duration-300 ease-in-out ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <img
              src="/logo.png"
              alt="Logo Caritas Đà Lạt"
              className="w-10 h-10 rounded-xl object-contain shadow-lg bg-white p-0.5"
            />
            <div>
              <h2 className="text-sm font-black text-white tracking-wide">CARITAS ĐÀ LẠT</h2>
              <span className="text-[10px] font-semibold uppercase tracking-wider bg-red-950 text-red-400 border border-red-800/80 px-1.5 py-0.5 rounded">
                Admin Portal
              </span>
            </div>
          </div>

          {/* Close button inside mobile drawer */}
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav Menu */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          <div className="px-3 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            Quản Trị & Điều Hành
          </div>
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition active:scale-95 ${
                  isActive
                    ? 'bg-red-600 text-white shadow-md shadow-red-950/40'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}

          <div className="pt-4 border-t border-slate-800/80 my-2">
            <Link
              href="/chamcong"
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-emerald-400 hover:bg-emerald-950/40 border border-emerald-900/50 transition active:scale-95"
            >
              <Camera className="w-4 h-4 shrink-0" />
              <span>Giao Diện Nhân Viên (Chấm Công)</span>
            </Link>
          </div>
        </nav>

        {/* Bottom User Info & Logout */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/50 flex items-center justify-between">
          <div className="flex items-center space-x-2 text-xs">
            <ShieldCheck className="w-4 h-4 text-red-500" />
            <span className="font-semibold text-slate-300 truncate max-w-[140px]">
              Caritas Đà Lạt
            </span>
          </div>

          <button
            onClick={handleLogout}
            title="Đăng xuất"
            className="p-2 rounded-xl text-slate-400 hover:text-red-400 hover:bg-slate-800 transition cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>
    </>
  );
}
