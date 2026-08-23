'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  FolderKanban,
  FileText,
  Users,
  CheckCircle2,
  AlertCircle,
  Clock,
  Image as ImageIcon,
  Download,
  Eye,
  Plus,
  Trash2,
  UserPlus,
  X,
  Send,
  Sparkles,
  Search,
  Filter,
  Check,
  Building2,
  Layers,
  FolderOpen,
} from 'lucide-react';
import { formatDateTimeVN, formatDateVN } from '@/lib/utils';

export default function AdminProjectsPage() {
  const [activeTab, setActiveTab] = useState<'reports' | 'projects' | 'files'>('reports');
  const [projects, setProjects] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter States for Reports
  const [filterProjectId, setFilterProjectId] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [filterMonth, setFilterMonth] = useState<string>('ALL');
  const [filterYear, setFilterYear] = useState<string>('ALL');
  const [reports, setReports] = useState<any[]>([]);

  // Review Modal States
  const [selectedReport, setSelectedReport] = useState<any | null>(null);
  const [reviewAction, setReviewAction] = useState<'APPROVED' | 'REVISION_REQUESTED'>('APPROVED');
  const [reviewNotes, setReviewNotes] = useState('');
  const [reviewing, setReviewing] = useState(false);
  const [reviewMsg, setReviewMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Assign Member Modal States
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignProjectId, setAssignProjectId] = useState<number | null>(null);
  const [assignUserId, setAssignUserId] = useState<string>('');
  const [assignRole, setAssignRole] = useState<'STAFF' | 'COORDINATOR'>('STAFF');
  const [assigning, setAssigning] = useState(false);

  // Load Projects & Employees
  const loadInitialData = useCallback(async () => {
    setLoading(true);
    try {
      const [pRes, eRes] = await Promise.all([
        fetch('/api/projects'),
        fetch('/api/admin/employees'),
      ]);

      if (pRes.ok) {
        const pData = await pRes.json();
        setProjects(pData.projects || []);
      }

      if (eRes.ok) {
        const eData = await eRes.json();
        setEmployees(eData.employees || []);
      }
    } catch (err) {
      console.error('Admin projects load error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load Reports
  const loadReports = useCallback(async () => {
    try {
      let url = '/api/projects/reports?';
      const params = new URLSearchParams();
      if (filterProjectId !== 'ALL') params.append('projectId', filterProjectId);
      if (filterStatus !== 'ALL') params.append('status', filterStatus);
      if (filterMonth !== 'ALL') params.append('month', filterMonth);
      if (filterYear !== 'ALL') params.append('year', filterYear);

      const res = await fetch(url + params.toString());
      if (res.ok) {
        const data = await res.json();
        setReports(data.reports || []);
      }
    } catch (err) {
      console.error('Load reports error:', err);
    }
  }, [filterProjectId, filterStatus, filterMonth, filterYear]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  useEffect(() => {
    if (activeTab === 'reports') {
      loadReports();
    }
  }, [activeTab, loadReports]);

  // Handle Review Report
  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReport) return;

    setReviewing(true);
    setReviewMsg(null);

    try {
      const res = await fetch('/api/admin/projects/reports/review', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportId: selectedReport.id,
          status: reviewAction,
          reviewNotes,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Lỗi đánh giá báo cáo');

      setReviewMsg({ type: 'success', text: data.message });
      setTimeout(() => {
        setSelectedReport(null);
        setReviewNotes('');
        loadReports();
      }, 1000);
    } catch (err: any) {
      setReviewMsg({ type: 'error', text: err.message });
    } finally {
      setReviewing(false);
    }
  };

  // Handle Assign Member to Project
  const handleAssignMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignProjectId || !assignUserId) return;

    setAssigning(true);
    try {
      const res = await fetch('/api/projects/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: assignProjectId,
          userId: parseInt(assignUserId, 10),
          roleInProject: assignRole,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Lỗi phân công');

      setShowAssignModal(false);
      setAssignUserId('');
      await loadInitialData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setAssigning(false);
    }
  };

  // Handle Remove Member from Project
  const handleRemoveMember = async (projectId: number, userId: number, userName: string) => {
    if (!confirm(`Bạn có chắc muốn xóa ${userName} khỏi dự án này?`)) return;

    try {
      const res = await fetch(`/api/projects/members?projectId=${projectId}&userId=${userId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        await loadInitialData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center space-x-2.5">
            <FolderKanban className="w-5 h-5 text-red-500" />
            <span>Quản Lý Dự Án & Báo Cáo Định Kỳ Caritas</span>
          </h1>
          <p className="text-xs text-slate-400 font-medium mt-1">
            Phân công nhân sự 4 dự án trọng tâm, kiểm duyệt file Word và hình ảnh báo cáo bàn giao nhà tài trợ
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center space-x-2 bg-slate-950/60 p-1 rounded-2xl border border-slate-800">
          <button
            onClick={() => setActiveTab('reports')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
              activeTab === 'reports'
                ? 'bg-red-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Duyệt Báo Cáo Tháng ({reports.length})
          </button>
          <button
            onClick={() => setActiveTab('projects')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
              activeTab === 'projects'
                ? 'bg-red-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            4 Dự Án & Nhân Sự ({projects.length})
          </button>
        </div>
      </div>

      {/* TAB 1: REPORTS REVIEW */}
      {activeTab === 'reports' && (
        <div className="space-y-5">
          {/* Filter Bar */}
          <div className="p-4 bg-slate-950/50 rounded-2xl border border-slate-800 flex flex-wrap items-center gap-3">
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-slate-400" />
              <span className="text-xs font-bold text-slate-300">Lọc theo:</span>
            </div>

            {/* Project Filter */}
            <select
              value={filterProjectId}
              onChange={(e) => setFilterProjectId(e.target.value)}
              className="bg-slate-900 text-white font-medium text-xs px-3 py-1.5 rounded-xl border border-slate-700 focus:outline-hidden"
            >
              <option value="ALL">Tất cả dự án</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.code})
                </option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-slate-900 text-white font-medium text-xs px-3 py-1.5 rounded-xl border border-slate-700 focus:outline-hidden"
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="SUBMITTED">Chờ duyệt</option>
              <option value="APPROVED">Đã duyệt ✓</option>
              <option value="REVISION_REQUESTED">Yêu cầu bổ sung ⚠️</option>
            </select>

            {/* Month Filter */}
            <select
              value={filterMonth}
              onChange={(e) => setFilterMonth(e.target.value)}
              className="bg-slate-900 text-white font-medium text-xs px-3 py-1.5 rounded-xl border border-slate-700 focus:outline-hidden"
            >
              <option value="ALL">Tất cả các tháng</option>
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <option key={m} value={m}>
                  Tháng {m < 10 ? `0${m}` : m}
                </option>
              ))}
            </select>
          </div>

          {/* Reports Table / Grid */}
          {reports.length === 0 ? (
            <div className="p-12 text-center bg-slate-950/40 rounded-3xl border border-slate-800 text-slate-400 text-xs font-semibold">
              Không có báo cáo nào khớp với bộ lọc.
            </div>
          ) : (
            <div className="space-y-3">
              {reports.map((rep) => (
                <div
                  key={rep.id}
                  className="p-5 bg-slate-950/60 rounded-3xl border border-slate-800/80 shadow-md space-y-3 hover:border-slate-700 transition"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-2xl bg-red-950 text-red-400 border border-red-800 flex items-center justify-center font-bold text-xs shrink-0">
                        {rep.project.code}
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300">
                            Tháng {rep.month < 10 ? `0${rep.month}` : rep.month}/{rep.year}
                          </span>
                          <h3 className="text-sm font-bold text-white">{rep.title}</h3>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Nhân viên: <strong className="text-slate-200">{rep.user.fullName}</strong> ({rep.user.employeeCode}) • Nộp: {formatDateTimeVN(rep.createdAt)}
                        </p>
                      </div>
                    </div>

                    {/* Status & Review Button */}
                    <div className="flex items-center space-x-3">
                      {rep.status === 'APPROVED' && (
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-950 text-emerald-400 border border-emerald-800 flex items-center space-x-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Đã duyệt</span>
                        </span>
                      )}
                      {rep.status === 'REVISION_REQUESTED' && (
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-950 text-rose-400 border border-rose-800 flex items-center space-x-1">
                          <AlertCircle className="w-3.5 h-3.5" />
                          <span>Yêu cầu bổ sung</span>
                        </span>
                      )}
                      {rep.status === 'SUBMITTED' && (
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-950 text-amber-400 border border-amber-800 flex items-center space-x-1">
                          <Clock className="w-3.5 h-3.5" />
                          <span>Chờ duyệt</span>
                        </span>
                      )}

                      <button
                        onClick={() => {
                          setSelectedReport(rep);
                          setReviewNotes(rep.reviewNotes || '');
                          setReviewAction(rep.status === 'APPROVED' ? 'APPROVED' : 'APPROVED');
                        }}
                        className="px-3.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs flex items-center space-x-1.5 transition shadow-sm"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Xem & Đánh Giá</span>
                      </button>
                    </div>
                  </div>

                  {rep.summary && (
                    <p className="text-xs text-slate-300 bg-slate-900/80 p-3 rounded-2xl font-medium border border-slate-800/50">
                      {rep.summary}
                    </p>
                  )}

                  {/* Attachment indicators */}
                  <div className="flex items-center space-x-4 text-xs font-semibold text-slate-400">
                    {rep.wordDocName && (
                      <a
                        href={rep.wordDocUrl}
                        download={rep.wordDocName}
                        className="flex items-center space-x-1.5 text-blue-400 hover:underline font-bold"
                      >
                        <FileText className="w-4 h-4" />
                        <span>{rep.wordDocName}</span>
                      </a>
                    )}
                    {rep.photos?.length > 0 && (
                      <span className="flex items-center space-x-1.5 text-emerald-400 font-bold">
                        <ImageIcon className="w-4 h-4" />
                        <span>{rep.photos.length} hình ảnh thực địa</span>
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: 4 PROJECTS & MEMBERSHIP */}
      {activeTab === 'projects' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {projects.map((proj) => (
            <div
              key={proj.id}
              className="p-6 bg-slate-950/60 rounded-3xl border border-slate-800 shadow-md space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-2xl bg-red-950 text-red-400 border border-red-800 flex items-center justify-center font-bold text-sm">
                      {proj.code}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white">{proj.name}</h3>
                      <p className="text-[11px] text-slate-400 font-mono">{proj.nasPath}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setAssignProjectId(proj.id);
                      setShowAssignModal(true);
                    }}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs flex items-center space-x-1 transition"
                  >
                    <UserPlus className="w-3.5 h-3.5 text-sky-400" />
                    <span>Thêm Nhân Sự</span>
                  </button>
                </div>

                {proj.description && (
                  <p className="text-xs text-slate-300 font-medium">{proj.description}</p>
                )}

                {/* Assigned Staff List */}
                <div className="space-y-2 pt-2">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                    <span>Nhân Sự Dự Án ({proj.members?.length || 0})</span>
                    <span className="text-[10px] text-slate-500 font-normal">
                      {proj._count?.reports || 0} báo cáo đã nộp
                    </span>
                  </h4>

                  {proj.members?.length === 0 ? (
                    <p className="text-xs text-slate-500 italic py-2">
                      Chưa có nhân viên nào được phân công vào dự án này.
                    </p>
                  ) : (
                    <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                      {proj.members.map((m: any) => (
                        <div
                          key={m.id}
                          className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900 border border-slate-800/80 text-xs"
                        >
                          <div className="flex items-center space-x-2.5">
                            <div className="w-7 h-7 rounded-full bg-slate-800 text-white flex items-center justify-center font-bold text-[11px]">
                              {m.user?.fullName?.charAt(0)}
                            </div>
                            <div>
                              <p className="font-bold text-white">{m.user?.fullName}</p>
                              <p className="text-[10px] text-slate-400 font-mono">
                                {m.user?.employeeCode} • {m.roleInProject === 'COORDINATOR' ? 'Điều Phối Viên' : 'Nhân Viên'}
                              </p>
                            </div>
                          </div>

                          <button
                            onClick={() => handleRemoveMember(proj.id, m.userId, m.user?.fullName)}
                            title="Xóa khỏi dự án"
                            className="p-1 text-slate-500 hover:text-red-400 transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* REVIEW REPORT MODAL */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="relative max-w-2xl w-full bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-800 space-y-5 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-950 text-red-400 border border-red-800">
                  Dự Án {selectedReport.project?.code} • Tháng {selectedReport.month}/{selectedReport.year}
                </span>
                <h3 className="text-sm font-bold text-white mt-1">{selectedReport.title}</h3>
                <p className="text-xs text-slate-400">
                  Người nộp: {selectedReport.user?.fullName} ({selectedReport.user?.employeeCode})
                </p>
              </div>
              <button
                onClick={() => setSelectedReport(null)}
                className="p-1 rounded-full text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {selectedReport.summary && (
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-slate-300">Tóm tắt hoạt động:</h4>
                <p className="text-xs text-slate-300 bg-slate-950 p-3 rounded-2xl border border-slate-800 font-medium">
                  {selectedReport.summary}
                </p>
              </div>
            )}

            {/* Word Document Download */}
            {selectedReport.wordDocUrl && (
              <div className="p-3.5 rounded-2xl bg-blue-950/60 border border-blue-800/80 flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <FileText className="w-5 h-5 text-blue-400" />
                  <div>
                    <p className="text-xs font-bold text-blue-200">
                      {selectedReport.wordDocName || 'Bao_Cao.docx'}
                    </p>
                    <p className="text-[10px] text-blue-400">File Word Báo Cáo Nhà Tài Trợ</p>
                  </div>
                </div>
                <a
                  href={selectedReport.wordDocUrl}
                  download={selectedReport.wordDocName || 'Bao_Cao.docx'}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs flex items-center space-x-1.5 transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Tải về file Word</span>
                </a>
              </div>
            )}

            {/* Photos Album */}
            {selectedReport.photos?.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-300">
                  Ảnh hoạt động thực địa ({selectedReport.photos.length} ảnh):
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  {selectedReport.photos.map((p: any, idx: number) => (
                    <div key={idx} className="rounded-2xl overflow-hidden border border-slate-800 bg-slate-950">
                      <img src={p.photoUrl} alt="" className="w-full h-36 object-cover" />
                      {p.caption && (
                        <p className="p-2 text-[11px] text-slate-300 text-center font-medium">
                          {p.caption}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Review Form */}
            <form onSubmit={handleReviewSubmit} className="space-y-4 border-t border-slate-800 pt-4">
              <h4 className="text-xs font-bold text-white flex items-center space-x-1.5">
                <Sparkles className="w-4 h-4 text-red-400" />
                <span>Xét Duyệt & Phản Hồi Cho Nhân Viên</span>
              </h4>

              {reviewMsg && (
                <div
                  className={`p-3 rounded-2xl text-xs font-bold flex items-center space-x-2 ${
                    reviewMsg.type === 'success'
                      ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                      : 'bg-red-950 text-red-400 border border-red-800'
                  }`}
                >
                  {reviewMsg.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0" />
                  )}
                  <span>{reviewMsg.text}</span>
                </div>
              )}

              <div className="flex items-center space-x-4">
                <label className="flex items-center space-x-2 text-xs font-bold text-white cursor-pointer">
                  <input
                    type="radio"
                    name="reviewAction"
                    value="APPROVED"
                    checked={reviewAction === 'APPROVED'}
                    onChange={() => setReviewAction('APPROVED')}
                    className="text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="text-emerald-400">Phê Duyệt Báo Cáo ✓</span>
                </label>

                <label className="flex items-center space-x-2 text-xs font-bold text-white cursor-pointer">
                  <input
                    type="radio"
                    name="reviewAction"
                    value="REVISION_REQUESTED"
                    checked={reviewAction === 'REVISION_REQUESTED'}
                    onChange={() => setReviewAction('REVISION_REQUESTED')}
                    className="text-rose-600 focus:ring-rose-500"
                  />
                  <span className="text-rose-400">Yêu Cầu Bổ Sung / Sửa Đổi ⚠️</span>
                </label>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Ý Kiến Nhận Xét / Lý Do
                </label>
                <textarea
                  rows={2}
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="Ghi nhận xét đánh giá tiến độ hoặc yêu cầu bổ sung số liệu cụ thể..."
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-hidden focus:ring-2 focus:ring-red-500 resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={reviewing}
                className="w-full py-3 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-bold rounded-2xl text-xs flex items-center justify-center space-x-2 transition shadow-lg"
              >
                <Send className="w-4 h-4" />
                <span>{reviewing ? 'Đang lưu đánh giá...' : 'Lưu Đánh Giá & Gửi Thông Báo'}</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ASSIGN MEMBER MODAL */}
      {showAssignModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="relative max-w-md w-full bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-800 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                <UserPlus className="w-4 h-4 text-sky-400" />
                <span>Phân Công Nhân Sự Vào Dự Án</span>
              </h3>
              <button
                onClick={() => setShowAssignModal(false)}
                className="p-1 rounded-full text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAssignMember} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Chọn Nhân Viên
                </label>
                <select
                  required
                  value={assignUserId}
                  onChange={(e) => setAssignUserId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-2xl text-xs text-white focus:outline-hidden focus:ring-2 focus:ring-red-500"
                >
                  <option value="">-- Chọn nhân viên --</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.fullName} ({emp.employeeCode}) - {emp.department || 'Chung'}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Vai Trò Trong Dự Án
                </label>
                <select
                  value={assignRole}
                  onChange={(e: any) => setAssignRole(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-2xl text-xs text-white focus:outline-hidden focus:ring-2 focus:ring-red-500"
                >
                  <option value="STAFF">Nhân Viên Thực Địa / Dự Án</option>
                  <option value="COORDINATOR">Điều Phối Viên Dự Án</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={assigning}
                className="w-full py-3 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-bold rounded-2xl text-xs flex items-center justify-center space-x-2 transition shadow-lg"
              >
                <Check className="w-4 h-4" />
                <span>{assigning ? 'Đang phân công...' : 'Xác Nhận Cấp Quyền Dự Án'}</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
