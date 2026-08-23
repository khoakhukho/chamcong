'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  User,
  Lock,
  Phone,
  Mail,
  Building2,
  Briefcase,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  KeyRound,
  Send,
  Camera,
  Upload,
} from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const [employeeCode, setEmployeeCode] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [department, setDepartment] = useState('Ban Y Tế Bác Ái');
  const [contractType, setContractType] = useState('FULL_TIME');
  const [phone, setPhone] = useState('');
  const [avatarImageData, setAvatarImageData] = useState<string | null>(null);

  // OTP State
  const [otpSent, setOtpSent] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [otpNotice, setOtpNotice] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Send OTP
  const handleSendOtp = async () => {
    if (!email || !email.includes('@')) {
      setError('Vui lòng nhập địa chỉ Email hợp lệ trước khi lấy mã OTP.');
      return;
    }
    setError(null);
    setSendingOtp(true);
    setOtpNotice(null);

    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, employeeCode }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Không thể gửi mã OTP');
      }

      setOtpSent(true);
      if (data.previewOtp) {
        setOtp(data.previewOtp);
        setOtpNotice(`Mã OTP đã tạo: ${data.previewOtp} (Đã tự động điền để bạn kiểm thử nhanh)`);
      } else {
        setOtpNotice(data.message || 'Mã OTP đã được gửi đến email của bạn. Vui lòng kiểm tra hộp thư.');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSendingOtp(false);
    }
  };

  // Avatar file upload
  const handleAvatarFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (reader.result) {
        setAvatarImageData(reader.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!employeeCode.trim() || !fullName.trim() || !email.trim() || !password) {
      setError('Vui lòng nhập đầy đủ Tên đăng nhập, Họ và tên, Email và Mật khẩu.');
      return;
    }

    if (!otp.trim()) {
      setError('Vui lòng bấm "Gửi mã OTP" và nhập mã OTP 6 số từ email để xác thực.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp.');
      return;
    }

    if (password.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeCode: employeeCode.trim().toUpperCase(),
          fullName,
          email,
          otp: otp.trim(),
          password,
          department,
          contractType,
          phone,
          avatarUrl: avatarImageData,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Đăng ký không thành công.');
      }

      router.push('/chamcong');
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center items-center px-4 py-8 relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-lg bg-slate-950 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative z-10">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <img
            src="/logo.png"
            alt="Logo Caritas Đà Lạt"
            className="w-16 h-16 rounded-2xl object-contain mx-auto mb-3 bg-white p-1 shadow-xl shadow-red-950/50 border border-slate-700"
          />
          <h1 className="text-xl font-extrabold text-white tracking-tight">
            CARITAS ĐÀ LẠT
          </h1>
          <p className="text-xs text-slate-400 font-medium mt-1">
            Đăng Ký Tài Khoản Nhân Viên & Xác Thực Email OTP
          </p>
        </div>

        {error && (
          <div className="mb-5 p-3.5 rounded-xl bg-red-950/60 border border-red-800/80 text-red-300 text-xs flex items-start space-x-2.5">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {otpNotice && (
          <div className="mb-5 p-3.5 rounded-xl bg-emerald-950/60 border border-emerald-800/80 text-emerald-300 text-xs flex items-start space-x-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>{otpNotice}</span>
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-4">
          {/* Avatar Upload Preview */}
          <div className="flex items-center space-x-4 p-3 bg-slate-900/80 rounded-2xl border border-slate-800">
            <div className="relative w-14 h-14 rounded-2xl bg-slate-800 border-2 border-slate-700 overflow-hidden shrink-0 flex items-center justify-center">
              {avatarImageData ? (
                <img src={avatarImageData} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <User className="w-7 h-7 text-slate-500" />
              )}
            </div>
            <div className="flex-1">
              <span className="block text-xs font-bold text-slate-200">Ảnh Khuôn Mặt / Đại Diện</span>
              <p className="text-[10px] text-slate-500 mb-1.5">Ảnh chân dung rõ mặt để hiển thị trên hồ sơ</p>
              <label className="cursor-pointer inline-flex items-center space-x-1.5 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-semibold rounded-lg border border-slate-700 transition">
                <Upload className="w-3.5 h-3.5 text-red-400" />
                <span>Chọn ảnh khuôn mặt</span>
                <input type="file" accept="image/*" onChange={handleAvatarFile} className="hidden" />
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Username / Employee Code */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                TÊN ĐĂNG NHẬP (CAPSLOCK) <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={employeeCode}
                  onChange={(e) => setEmployeeCode(e.target.value.toUpperCase().replace(/[^A-Z0-9_.-]/g, ''))}
                  placeholder="VD: VNXKHOA, ANNGUYEN"
                  required
                  className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs placeholder-slate-500 focus:outline-hidden focus:border-red-500 font-mono font-bold uppercase tracking-wider"
                />
              </div>
              <span className="text-[10px] text-slate-400 mt-0.5 block">Tự động viết hoa (VD: VNXKHOA, MAITRAN, ANNGUYEN)</span>
            </div>

            {/* Full Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                HỌ VÀ TÊN <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="VD: Vũ Nguyễn Xuân Khoa"
                required
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs placeholder-slate-500 focus:outline-hidden focus:border-red-500"
              />
            </div>
          </div>

          {/* Email & OTP Verification */}
          <div className="p-3.5 bg-slate-900/90 rounded-2xl border border-slate-800 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-end gap-2">
              <div className="flex-1">
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  EMAIL XÁC THỰC CHÍNH CHỦ <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ten@caritasdalat.org hoặc gmail..."
                    required
                    className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs placeholder-slate-500 focus:outline-hidden focus:border-red-500"
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={handleSendOtp}
                disabled={sendingOtp}
                className="px-3.5 py-2 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl flex items-center justify-center space-x-1.5 transition shrink-0"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{sendingOtp ? 'Đang gửi...' : otpSent ? 'Gửi lại OTP' : 'Gửi mã OTP'}</span>
              </button>
            </div>

            {/* OTP Input Field */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                NHẬP MÃ OTP 6 SỐ TỪ EMAIL <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <KeyRound className="w-4 h-4 text-amber-400" />
                </div>
                <input
                  type="text"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="Nhập mã 6 số (VD: 123456)"
                  required
                  className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-amber-500/60 rounded-xl text-amber-300 text-sm font-mono tracking-widest font-bold placeholder-slate-600 focus:outline-hidden focus:border-amber-400"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Department */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                PHÒNG BAN / BAN CHUYÊN TRÁCH
              </label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs focus:outline-hidden focus:border-red-500"
              >
                <option value="Ban Giám Đốc">Ban Giám Đốc</option>
                <option value="Ban Y Tế Bác Ái">Ban Y Tế Bác Ái</option>
                <option value="Ban Khuyết Tật">Ban Khuyết Tật</option>
                <option value="Ban Học Bổng & Trẻ Em">Ban Học Bổng & Trẻ Em</option>
                <option value="Ban Hành Chính & Kế Toán">Ban Hành Chính & Kế Toán</option>
                <option value="Ban Truyền Thông & Sự Kiện">Ban Truyền Thông & Sự Kiện</option>
                <option value="Cơ sở Bác Ái Bảo Lộc">Cơ sở Bác Ái Bảo Lộc</option>
              </select>
            </div>

            {/* Contract Type */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                LOẠI HÌNH LÀM VIỆC
              </label>
              <select
                value={contractType}
                onChange={(e) => setContractType(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs focus:outline-hidden focus:border-red-500 font-semibold"
              >
                <option value="FULL_TIME">Toàn thời gian (Hành chính)</option>
                <option value="PART_TIME">Bán thời gian (Theo ca/giờ)</option>
                <option value="CONTRACT">Khoán việc / Cộng đồng</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Phone */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                SỐ ĐIỆN THOẠI
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Phone className="w-4 h-4" />
                </div>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0912345678"
                  className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs placeholder-slate-500 focus:outline-hidden focus:border-red-500"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                MẬT KHẨU <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Tối thiểu 6 ký tự"
                  required
                  className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs placeholder-slate-500 focus:outline-hidden focus:border-red-500"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              XÁC NHẬN MẬT KHẨU <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Nhập lại mật khẩu để xác nhận"
                required
                className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs placeholder-slate-500 focus:outline-hidden focus:border-red-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-bold rounded-xl shadow-lg shadow-red-950/50 transition duration-150 flex items-center justify-center space-x-2 text-xs mt-3 disabled:opacity-50"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>Xác Thực & Tạo Tài Khoản</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Back to Login */}
        <div className="mt-5 pt-4 border-t border-slate-800 text-center">
          <p className="text-xs text-slate-400">
            Đã có tài khoản nhân sự?{' '}
            <Link
              href="/login"
              className="text-red-400 font-bold hover:underline inline-flex items-center space-x-1"
            >
              <span>Đăng nhập ngay</span>
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
