'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Camera, History, FileText, LogOut, User, Building2 } from 'lucide-react';

interface EmployeeHeaderProps {
  user: {
    fullName: string;
    employeeCode: string;
    department?: string | null;
    role: string;
  };
}

export default function EmployeeHeader({ user }: EmployeeHeaderProps) {
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

  const navItems = [
    { href: '/chamcong', label: 'Chấm Công', icon: Camera },
    { href: '/employee/history', label: 'Lịch Sử', icon: History },
    { href: '/employee/requests', label: 'Đơn Từ', icon: FileText },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-xs">
      {/* Top Banner */}
      <div className="max-w-4xl mx-auto px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-red-600 flex items-center justify-center text-white font-black text-lg shadow-sm">
            C
          </div>
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
          {user.role === 'ADMIN' && (
            <Link
              href="/admin/dashboard"
              className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-900 text-white hover:bg-slate-800 transition"
            >
              Trang Quản Trị
            </Link>
          )}
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
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-slate-800">{user.fullName}</span>
            <span className="text-[11px] bg-slate-200 text-slate-700 px-1.5 py-0.2 rounded font-mono">
              {user.employeeCode}
            </span>
          </div>
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
  );
}
