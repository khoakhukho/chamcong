'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Users, UserPlus, Edit2, Lock, CheckCircle2, XCircle, Search, KeyRound } from 'lucide-react';
import { formatDateVN } from '@/lib/utils';

export default function AdminEmployeesPage() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<any | null>(null);

  // Form Fields
  const [employeeCode, setEmployeeCode] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [department, setDepartment] = useState('Ban Y Tế Bác Ái');
  const [role, setRole] = useState('EMPLOYEE');
  const [isActive, setIsActive] = useState(true);
  const [telegramId, setTelegramId] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const loadEmployees = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/employees');
      if (res.ok) {
        const data = await res.json();
        setEmployees(data.employees || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEmployees();
  }, [loadEmployees]);

  const openCreateModal = () => {
    setEditingEmployee(null);
    setEmployeeCode('');
    setFullName('');
    setPassword('123456');
    setPhone('');
    setEmail('');
    setDepartment('Ban Y Tế Bác Ái');
    setRole('EMPLOYEE');
    setIsActive(true);
    setTelegramId('');
    setIsModalOpen(true);
    setMsg(null);
  };

  const openEditModal = (emp: any) => {
    setEditingEmployee(emp);
    setEmployeeCode(emp.employeeCode);
    setFullName(emp.fullName);
    setPassword(''); // leave blank if no change
    setPhone(emp.phone || '');
    setEmail(emp.email || '');
    setDepartment(emp.department || 'Hành Chính');
    setRole(emp.role);
    setIsActive(emp.isActive);
    setTelegramId(emp.telegramId || '');
    setIsModalOpen(true);
    setMsg(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMsg(null);

    try {
      if (editingEmployee) {
        // Update
        const res = await fetch('/api/admin/employees', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: editingEmployee.id,
            fullName,
            password,
            phone,
            email,
            department,
            role,
            isActive,
            telegramId,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
      } else {
        // Create
        const res = await fetch('/api/admin/employees', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            employeeCode,
            fullName,
            password,
            phone,
            email,
            department,
            role,
            telegramId,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
      }

      setIsModalOpen(false);
      await loadEmployees();
    } catch (err: any) {
      setMsg(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const filteredEmployees = employees.filter(
    (e) =>
      e.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.employeeCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (e.department && e.department.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">
            Quản Lý Hồ Sơ Nhân Sự
          </h1>
          <p className="text-xs text-slate-400 font-medium mt-1">
            Thêm mới, điều chỉnh phòng ban, vai trò và phân quyền nhân viên
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="self-start sm:self-auto py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold flex items-center space-x-2 transition shadow-lg shadow-red-950/40"
        >
          <UserPlus className="w-4 h-4" />
          <span>Thêm Nhân Viên Mới</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Tìm theo Tên, Mã NV, hoặc Phòng ban..."
          className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-800 focus:border-red-500 rounded-xl text-white text-xs placeholder-slate-500 focus:outline-hidden transition"
        />
      </div>

      {/* Employees Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 text-[11px] uppercase tracking-wider font-semibold border-b border-slate-800">
              <tr>
                <th className="px-5 py-3.5">Mã NV</th>
                <th className="px-5 py-3.5">Họ và Tên</th>
                <th className="px-5 py-3.5">Phòng ban / Bộ phận</th>
                <th className="px-5 py-3.5">Liên hệ</th>
                <th className="px-5 py-3.5">Vai trò</th>
                <th className="px-5 py-3.5">Trạng thái</th>
                <th className="px-5 py-3.5 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-slate-500">
                    Đang tải danh sách...
                  </td>
                </tr>
              ) : filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-slate-500">
                    Không tìm thấy nhân viên nào phù hợp.
                  </td>
                </tr>
              ) : (
                filteredEmployees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-slate-800/40 transition">
                    <td className="px-5 py-3.5 font-mono font-bold text-white">
                      {emp.employeeCode}
                    </td>
                    <td className="px-5 py-3.5 font-bold text-white">
                      {emp.fullName}
                    </td>
                    <td className="px-5 py-3.5 text-slate-300">
                      {emp.department || 'Chưa phân ban'}
                    </td>
                    <td className="px-5 py-3.5 text-[11px] text-slate-400">
                      <div>{emp.phone || '-'}</div>
                      <div className="text-slate-500">{emp.email || '-'}</div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          emp.role === 'ADMIN'
                            ? 'bg-red-950 text-red-400 border border-red-800'
                            : emp.role === 'MANAGER'
                            ? 'bg-amber-950 text-amber-400 border border-amber-800'
                            : 'bg-slate-800 text-slate-300 border border-slate-700'
                        }`}
                      >
                        {emp.role}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-semibold ${
                          emp.isActive
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                            : 'bg-rose-950 text-rose-400 border border-rose-800'
                        }`}
                      >
                        {emp.isActive ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                        <span>{emp.isActive ? 'Hoạt động' : 'Tạm khóa'}</span>
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        onClick={() => openEditModal(emp)}
                        className="py-1 px-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold inline-flex items-center space-x-1.5 transition"
                      >
                        <Edit2 className="w-3 h-3" />
                        <span>Sửa</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Add/Edit Employee */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 text-slate-200">
            <h2 className="text-base font-bold text-white border-b border-slate-800 pb-3">
              {editingEmployee ? `Chỉnh Sửa Nhân Viên: ${editingEmployee.employeeCode}` : 'Thêm Nhân Viên Mới'}
            </h2>

            {msg && (
              <div className="p-3 bg-red-950/80 border border-red-800 text-red-300 text-xs rounded-xl">
                {msg}
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-400 mb-1">MÃ NHÂN VIÊN</label>
                  <input
                    type="text"
                    value={employeeCode}
                    onChange={(e) => setEmployeeCode(e.target.value)}
                    disabled={!!editingEmployee}
                    required
                    placeholder="VD: NV004"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono focus:outline-hidden focus:border-red-500 disabled:opacity-50"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-400 mb-1">HỌ VÀ TÊN</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    placeholder="Nguyễn Văn A"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-hidden focus:border-red-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-400 mb-1">
                  MẬT KHẨU {editingEmployee && '(Để trống nếu không muốn đổi)'}
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={editingEmployee ? '••••••••' : 'Nhập mật khẩu...'}
                  required={!editingEmployee}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-hidden focus:border-red-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-400 mb-1">PHÒNG BAN / BAN CHUYÊN MÔN</label>
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-hidden focus:border-red-500"
                  >
                    <option value="Ban Giám Đốc">Ban Giám Đốc</option>
                    <option value="Ban Y Tế Bác Ái">Ban Y Tế Bác Ái</option>
                    <option value="Ban Khuyết Tật">Ban Khuyết Tật</option>
                    <option value="Ban Học Bổng & Trẻ Em">Ban Học Bổng & Trẻ Em</option>
                    <option value="Ban Truyền Thông">Ban Truyền Thông</option>
                    <option value="Ban Hành Chính & Kế Toán">Ban Hành Chính & Kế Toán</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-400 mb-1">VAI TRÒ TRUY CẬP</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-hidden focus:border-red-500"
                  >
                    <option value="EMPLOYEE">Nhân Viên (Chấm công)</option>
                    <option value="MANAGER">Quản Lý (Trưởng ban)</option>
                    <option value="ADMIN">Quản Trị Viên (Admin)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-400 mb-1">SỐ ĐIỆN THOẠI</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="0912345678"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-hidden focus:border-red-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-400 mb-1">EMAIL</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ten@caritasdalat.org"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-hidden focus:border-red-500"
                  />
                </div>
              </div>

              {editingEmployee && (
                <div className="flex items-center space-x-2 pt-2">
                  <input
                    type="checkbox"
                    id="isActiveCheck"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="w-4 h-4 rounded-sm bg-slate-950 border-slate-800 text-red-600 focus:ring-0"
                  />
                  <label htmlFor="isActiveCheck" className="font-semibold text-slate-300">
                    Kích hoạt tài khoản (Cho phép đăng nhập và chấm công)
                  </label>
                </div>
              )}

              <div className="pt-4 border-t border-slate-800 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl shadow-md disabled:opacity-50"
                >
                  {submitting ? 'Đang lưu...' : 'Lưu Thay Đổi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
