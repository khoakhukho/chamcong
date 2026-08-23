'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ShieldCheck, User, Lock, ArrowRight, AlertCircle, UserPlus } from 'lucide-react';

export default function LoginPage() {
  const [employeeCode, setEmployeeCode] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeCode, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Đăng nhập không thành công');
      }

      if (data.user.role === 'ADMIN' || data.user.role === 'ACCOUNTANT') {
        router.push('/admin/dashboard');
      } else {
        router.push('/chamcong');
      }
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center items-center px-4 py-8 relative overflow-hidden">
      {/* Background Subtle Gradient Blobs */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-slate-950 border border-slate-800 rounded-3xl p-8 shadow-2xl relative z-10">
        {/* Organization Brand Header */}
        <div className="text-center mb-8">
          <img
            src="/logo.png"
            alt="Logo Caritas Đà Lạt"
            className="w-20 h-20 rounded-2xl object-contain mx-auto mb-4 bg-white p-1.5 shadow-xl shadow-red-950/50 border border-slate-700"
          />
          <h1 className="text-xl font-extrabold text-white tracking-tight">
            CARITAS ĐÀ LẠT
          </h1>
          <p className="text-xs text-slate-400 font-medium mt-1">
            Cổng Dịch Vụ & Quản Trị Nội Bộ
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-950/60 border border-red-800/80 text-red-300 text-xs flex items-start space-x-2.5">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              TÊN ĐĂNG NHẬP / MÃ NHÂN VIÊN (TỰ ĐỘNG VIẾT HOA)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <User className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={employeeCode}
                onChange={(e) => setEmployeeCode(e.target.value.toUpperCase())}
                placeholder="VD: VNXKHOA, NV001, KETOAN hoặc ADMIN"
                required
                className="w-full pl-10 pr-4 py-3 bg-slate-900 border border-slate-800 focus:border-red-500 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-hidden transition font-mono uppercase font-bold tracking-wider"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              MẬT KHẨU
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Nhập mật khẩu..."
                required
                className="w-full pl-10 pr-4 py-3 bg-slate-900 border border-slate-800 focus:border-red-500 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-hidden transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3.5 px-4 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white text-sm font-bold rounded-xl shadow-lg shadow-red-950/60 flex items-center justify-center space-x-2 transition disabled:opacity-50"
          >
            <span>{loading ? 'Đang xác thực...' : 'ĐĂNG NHẬP'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Register Account Link */}
        <div className="mt-8 pt-6 border-t border-slate-900 text-center">
          <p className="text-xs text-slate-400">
            Chưa có tài khoản nhân sự?{' '}
            <Link
              href="/register"
              className="text-red-400 font-bold hover:underline inline-flex items-center space-x-1 ml-1"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Đăng ký mới</span>
            </Link>
          </p>
        </div>
      </div>

      <div className="mt-6 text-center text-xs text-slate-500">
        &copy; {new Date().getFullYear()} Caritas Giáo Phận Đà Lạt. Cổng Thông Tin & Quản Trị.
      </div>
    </div>
  );
}
