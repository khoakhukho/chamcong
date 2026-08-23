'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Users,
  UserPlus,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  Search,
  Briefcase,
  Palmtree,
  Shield,
  FolderKanban,
  CheckSquare,
  Square,
  AlertCircle,
} from 'lucide-react';
import { getContractTypeLabel, getRoleLabel } from '@/lib/utils';

export default function AdminEmployeesPage() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
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
  const [selectedProjectIds, setSelectedProjectIds] = useState<number[]>([]);
  const [role, setRole] = useState('EMPLOYEE');
  const [contractType, setContractType] = useState('FULL_TIME');
  const [annualLeaveBase, setAnnualLeaveBase] = useState('12');
  const [isActive, setIsActive] = useState(true);

  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const loadEmployees = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/employees');
      if (res.ok) {
        const data = await res.json();
        setEmployees(data.employees || []);
        setProjects(data.projects || []);
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
    setSelectedProjectIds([]);
    setRole('EMPLOYEE');
    setContractType('FULL_TIME');
    setAnnualLeaveBase('12');
    setIsActive(true);
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

    // Extract assigned project IDs
    const assignedIds = (emp.projectMemberships || []).map((pm: any) => pm.projectId);
    setSelectedProjectIds(assignedIds);

    setRole(emp.role || 'EMPLOYEE');
    setContractType(emp.contractType || 'FULL_TIME');
    setAnnualLeaveBase(String(emp.annualLeaveBase ?? 12));
    setIsActive(emp.isActive);
    setIsModalOpen(true);
    setMsg(null);
  };

  const toggleProjectSelection = (projectId: number) => {
    setSelectedProjectIds((prev) =>
      prev.includes(projectId) ? prev.filter((id) => id !== projectId) : [...prev, projectId]
    );
  };

  const handleDelete = async (emp: any) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa tài khoản nhân sự "${emp.fullName}" (${emp.employeeCode}) không?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/employees?id=${emp.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      await loadEmployees();
    } catch (err: any) {
      alert('Lỗi xóa nhân viên: ' + err.message);
    }
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
            projectIds: selectedProjectIds,
            role,
            contractType,
            annualLeaveBase: parseFloat(annualLeaveBase),
            isActive,
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
            projectIds: selectedProjectIds,
            role,
            contractType,
            annualLeaveBase: parseFloat(annualLeaveBase),
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
      (e.department && e.department.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (e.projectMemberships &&
        e.projectMemberships.some(
          (pm: any) =>
            pm.project?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            pm.project?.code?.toLowerCase().includes(searchTerm.toLowerCase())
        ))
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">
            Quản Lý Hồ Sơ & Phân Quyền Dự Án Nhân Sự
          </h1>
          <p className="text-xs text-slate-400 font-medium mt-1">
            Gán nhân viên vào đúng Dự án chuyên trách (PLD, SKTT, Khuyết Tật, Học Bổng) để cấp quyền truy cập dữ liệu & nộp báo cáo
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="self-start sm:self-auto py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold flex items-center space-x-2 transition shadow-lg shadow-red-950/40 cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          <span>Thêm Nhân Sự Mới</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Tìm theo Tên, Mã NV, hoặc Dự án..."
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
                <th className="px-5 py-3.5">Dự Án / Ban Chuyên Trách Phụ Trách</th>
                <th className="px-5 py-3.5">Loại hình làm việc</th>
                <th className="px-5 py-3.5">Phép năm</th>
                <th className="px-5 py-3.5">Vai trò</th>
                <th className="px-5 py-3.5">Trạng thái</th>
                <th className="px-5 py-3.5 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-5 py-8 text-center text-slate-500">
                    Đang tải danh sách nhân sự...
                  </td>
                </tr>
              ) : filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-8 text-center text-slate-500">
                    Không tìm thấy nhân sự nào phù hợp.
                  </td>
                </tr>
              ) : (
                filteredEmployees.map((emp) => {
                  const assignedProjects = (emp.projectMemberships || [])
                    .map((pm: any) => pm.project)
                    .filter(Boolean);

                  return (
                    <tr key={emp.id} className="hover:bg-slate-800/40 transition">
                      <td className="px-5 py-3.5 font-mono font-bold text-white">
                        {emp.employeeCode}
                      </td>
                      <td className="px-5 py-3.5 font-bold text-white">
                        <div className="flex items-center space-x-2.5">
                          <div className="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700 overflow-hidden shrink-0 flex items-center justify-center text-[10px] text-red-400 font-bold uppercase">
                            {emp.avatarUrl ? (
                              <img src={emp.avatarUrl} alt={emp.fullName} className="w-full h-full object-cover" />
                            ) : (
                              emp.fullName?.charAt(0) || 'NV'
                            )}
                          </div>
                          <div>
                            <div>{emp.fullName}</div>
                            <div className="text-[11px] text-slate-500 font-normal">{emp.phone || emp.email || '-'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-slate-300">
                        {assignedProjects.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5 max-w-xs">
                            {assignedProjects.map((p: any) => (
                              <span
                                key={p.id}
                                className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700 text-slate-200 text-[11px] font-bold"
                              >
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                <span>{p.code} - {p.name}</span>
                              </span>
                            ))}
                          </div>
                        ) : emp.department ? (
                          <span className="text-slate-400 text-[11px] italic">{emp.department}</span>
                        ) : (
                          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded bg-amber-950/60 border border-amber-800/60 text-amber-300 text-[10px]">
                            <AlertCircle className="w-3 h-3" />
                            <span>Chưa phân quyền dự án</span>
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            emp.contractType === 'FULL_TIME'
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                              : emp.contractType === 'PART_TIME'
                              ? 'bg-amber-950 text-amber-400 border border-amber-800'
                              : 'bg-sky-950 text-sky-400 border border-sky-800'
                          }`}
                        >
                          {getContractTypeLabel(emp.contractType)}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 font-mono font-bold text-slate-300">
                        {emp.annualLeaveBase ?? 12} ngày/năm
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            emp.role === 'ADMIN'
                              ? 'bg-red-950 text-red-400 border border-red-800'
                              : emp.role === 'ACCOUNTANT'
                              ? 'bg-purple-950 text-purple-400 border border-purple-800'
                              : emp.role === 'MANAGER'
                              ? 'bg-amber-950 text-amber-400 border border-amber-800'
                              : 'bg-slate-800 text-slate-300 border border-slate-700'
                          }`}
                        >
                          {getRoleLabel(emp.role)}
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
                      <td className="px-5 py-3.5 text-right space-x-2">
                        <button
                          onClick={() => openEditModal(emp)}
                          className="py-1 px-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold inline-flex items-center space-x-1 transition cursor-pointer"
                        >
                          <Edit2 className="w-3 h-3" />
                          <span>Phân Quyền / Sửa</span>
                        </button>
                        <button
                          onClick={() => handleDelete(emp)}
                          className="py-1 px-2 rounded-lg bg-slate-800 hover:bg-red-950 text-slate-400 hover:text-red-400 text-xs font-semibold inline-flex items-center transition cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Add/Edit Employee with Project Assignment */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-4 text-slate-200 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <h2 className="text-base font-bold text-white border-b border-slate-800 pb-3 flex items-center justify-between">
              <span>{editingEmployee ? `Chỉnh Sửa & Phân Quyền: ${editingEmployee.employeeCode}` : 'Thêm Nhân Sự Mới'}</span>
              <span className="text-[11px] font-normal text-slate-400">Caritas Đà Lạt</span>
            </h2>

            {msg && (
              <div className="p-3 bg-red-950/80 border border-red-800 text-red-300 text-xs rounded-xl flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{msg}</span>
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-400 mb-1">MÃ NHÂN VIÊN (CAPSLOCK)</label>
                  <input
                    type="text"
                    value={employeeCode}
                    onChange={(e) => setEmployeeCode(e.target.value.toUpperCase().replace(/[^A-Z0-9_.-]/g, ''))}
                    disabled={!!editingEmployee}
                    required
                    placeholder="VD: NV004"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono uppercase font-bold focus:outline-hidden focus:border-red-500 disabled:opacity-50"
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
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-hidden focus:border-red-500 font-mono"
                />
              </div>

              {/* PROJECT ASSIGNMENT (Replacing static department) */}
              <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-2xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-white flex items-center space-x-1.5">
                    <FolderKanban className="w-4 h-4 text-red-500" />
                    <span>DỰ ÁN / BAN CHUYÊN TRÁCH PHỤ TRÁCH</span>
                  </label>
                  <span className="text-[10px] text-slate-400">
                    Đã chọn {selectedProjectIds.length} dự án
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Chọn các Dự án mà nhân sự này trực thuộc để phân quyền nộp Báo Cáo định kỳ & truy cập dữ liệu trên NAS:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  {projects.map((proj) => {
                    const isSelected = selectedProjectIds.includes(proj.id);
                    return (
                      <div
                        key={proj.id}
                        onClick={() => toggleProjectSelection(proj.id)}
                        className={`p-2.5 rounded-xl border cursor-pointer flex items-start space-x-2.5 transition select-none ${
                          isSelected
                            ? 'bg-red-950/40 border-red-600 text-white shadow-sm'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <div className="mt-0.5 text-red-500">
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-red-400" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-600" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-xs flex items-center space-x-1.5">
                            <span className={`px-1.5 py-0.2 rounded text-[10px] font-mono ${isSelected ? 'bg-red-600 text-white' : 'bg-slate-800 text-slate-400'}`}>
                              {proj.code}
                            </span>
                            <span className="truncate">{proj.name}</span>
                          </div>
                          {proj.description && (
                            <div className="text-[10px] text-slate-500 truncate mt-0.5">
                              {proj.description}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-400 mb-1">LOẠI HÌNH LÀM VIỆC</label>
                  <select
                    value={contractType}
                    onChange={(e) => {
                      const ct = e.target.value;
                      setContractType(ct);
                      if (ct === 'FULL_TIME') setAnnualLeaveBase('12');
                      else if (ct === 'PART_TIME') setAnnualLeaveBase('6');
                      else setAnnualLeaveBase('0');
                    }}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-hidden focus:border-red-500 font-semibold cursor-pointer"
                  >
                    <option value="FULL_TIME">Toàn thời gian (Hành chính)</option>
                    <option value="PART_TIME">Bán thời gian (Theo ca/giờ)</option>
                    <option value="CONTRACT">Khoán việc / Cộng đồng</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-400 mb-1">VAI TRÒ TRUY CẬP</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-hidden focus:border-red-500 cursor-pointer"
                  >
                    <option value="EMPLOYEE">Nhân Viên (Chấm công & Dự án)</option>
                    <option value="MANAGER">Điều Phối Viên / Quản Lý Dự Án</option>
                    <option value="ACCOUNTANT">Kế Toán (Xuất báo cáo & Quản trị)</option>
                    <option value="ADMIN">Quản Trị Viên (Admin tối cao)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-400 mb-1">ĐỊNH MỨC PHÉP NĂM (NGÀY)</label>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    max="30"
                    value={annualLeaveBase}
                    onChange={(e) => setAnnualLeaveBase(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-hidden focus:border-red-500 font-mono font-bold"
                  />
                </div>

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
              </div>

              <div>
                <label className="block font-semibold text-slate-400 mb-1">EMAIL (Nhận thông báo & OTP)</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nhanvien@caritasdalat.org"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-hidden focus:border-red-500"
                />
              </div>

              {editingEmployee && (
                <div className="pt-1">
                  <label className="flex items-center space-x-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={isActive}
                      onChange={(e) => setIsActive(e.target.checked)}
                      className="w-4 h-4 rounded text-red-600 focus:ring-0 focus:outline-hidden cursor-pointer"
                    />
                    <span className="font-semibold text-white">
                      Kích hoạt tài khoản (Cho phép đăng nhập và truy cập dự án)
                    </span>
                  </label>
                </div>
              )}

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl transition cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="py-2.5 px-5 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-bold rounded-xl transition shadow-md shadow-red-950/40 cursor-pointer"
                >
                  {submitting ? 'Đang lưu...' : editingEmployee ? 'Lưu Thay Đổi' : 'Tạo Nhân Sự'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
