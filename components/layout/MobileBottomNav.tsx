'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Camera,
  FolderKanban,
  FileText,
  History,
  User,
  ShieldCheck,
} from 'lucide-react';

interface MobileBottomNavProps {
  userRole?: string;
  onOpenProfile?: () => void;
}

export default function MobileBottomNav({ userRole, onOpenProfile }: MobileBottomNavProps) {
  const pathname = usePathname();

  const navItems = [
    {
      href: '/chamcong',
      label: 'Chấm Công',
      icon: Camera,
      badge: null,
    },
    {
      href: '/employee/projects',
      label: 'Dự Án',
      icon: FolderKanban,
      badge: null,
    },
    {
      href: '/employee/requests',
      label: 'Đơn Từ',
      icon: FileText,
      badge: null,
    },
    {
      href: '/employee/history',
      label: 'Lịch Sử',
      icon: History,
      badge: null,
    },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-xl border-t border-slate-200/90 shadow-2xl px-2 py-1.5 pb-[max(0.375rem,env(safe-area-inset-bottom))] transition">
      <div className="flex items-center justify-around max-w-lg mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition active:scale-90 relative ${
                isActive
                  ? 'text-red-600 font-bold'
                  : 'text-slate-500 hover:text-slate-900 font-medium'
              }`}
            >
              <div
                className={`p-1.5 rounded-xl transition ${
                  isActive ? 'bg-red-50 text-red-600 shadow-xs' : 'bg-transparent'
                }`}
              >
                <Icon className="w-5 h-5 shrink-0" />
              </div>
              <span className="text-[10px] mt-0.5 tracking-tight">{item.label}</span>
              {isActive && (
                <span className="w-1.5 h-1.5 bg-red-600 rounded-full mt-0.5" />
              )}
            </Link>
          );
        })}

        {/* Profile / Admin Button */}
        {['ADMIN', 'ACCOUNTANT', 'MANAGER'].includes(userRole || '') ? (
          <Link
            href="/admin/dashboard"
            className="flex flex-col items-center justify-center py-1 px-2.5 rounded-2xl transition active:scale-90 text-slate-700 hover:text-slate-900 font-medium"
          >
            <div className="p-1.5 rounded-xl bg-slate-900 text-white shadow-xs">
              <ShieldCheck className="w-5 h-5 shrink-0 text-red-400" />
            </div>
            <span className="text-[10px] mt-0.5 font-bold tracking-tight text-slate-900">Quản Trị</span>
          </Link>
        ) : onOpenProfile ? (
          <button
            type="button"
            onClick={onOpenProfile}
            className="flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition active:scale-90 text-slate-500 hover:text-slate-900 font-medium cursor-pointer"
          >
            <div className="p-1.5 rounded-xl bg-slate-100 text-slate-700">
              <User className="w-5 h-5 shrink-0" />
            </div>
            <span className="text-[10px] mt-0.5 tracking-tight">Hồ Sơ</span>
          </button>
        ) : null}
      </div>
    </nav>
  );
}
