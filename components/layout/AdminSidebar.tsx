'use client';

import React from 'react';
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
} from 'lucide-react';

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();

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
    <aside className="w-64 bg-slate-900 border-r border-slate-800 text-slate-300 flex flex-col shrink-0 min-h-screen">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800 flex items-center space-x-3">
        <img
          src="/logo.png"
          alt="Logo Caritas Đà Lạt"
          className="w-10 h-10 rounded-xl object-contain shadow-lg bg-white p-0.5"
        />
        <div>
          <h2 className="text-sm font-bold text-white tracking-wide">CARITAS ĐÀ LẠT</h2>
          <span className="text-[10px] font-semibold uppercase tracking-wider bg-red-950 text-red-400 border border-red-800/80 px-1.5 py-0.5 rounded">
            Admin Portal
          </span>
        </div>
      </div>

      {/* Nav Menu */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        <div className="px-3 py-2 text-[10px] font-bold text-slate-300 uppercase tracking-widest">
          Quản Trị Hệ Thống
        </div>
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition ${
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
            className="flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-emerald-400 hover:bg-emerald-950/40 border border-emerald-900/50 transition"
          >
            <Camera className="w-4 h-4 shrink-0" />
            <span>Màn Hình Chấm Công</span>
          </Link>
        </div>
      </nav>

      {/* Bottom User Info & Logout */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/50 flex items-center justify-between">
        <div className="flex items-center space-x-2 text-xs">
          <ShieldCheck className="w-4 h-4 text-red-500" />
          <span className="font-semibold text-slate-300 truncate max-w-[120px]">
            Hệ Thống Nội Bộ
          </span>
        </div>

        <button
          onClick={handleLogout}
          title="Đăng xuất"
          className="p-2 rounded-xl text-slate-400 hover:text-red-400 hover:bg-slate-800 transition"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
}
