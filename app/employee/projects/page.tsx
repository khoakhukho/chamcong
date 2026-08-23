'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import EmployeeHeader from '@/components/layout/EmployeeHeader';
import {
  FolderKanban,
  FileText,
  Upload,
  Plus,
  CheckCircle2,
  AlertCircle,
  Clock,
  Image as ImageIcon,
  FileUp,
  Download,
  Calendar,
  Send,
  Eye,
  X,
  Sparkles,
  ShieldAlert,
  Layers,
  ChevronRight,
  FolderOpen,
  Info,
} from 'lucide-react';
import { formatDateTimeVN, formatDateVN } from '@/lib/utils';

export default function EmployeeProjectsPage() {
  const [user, setUser] = useState<any>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'submit' | 'history' | 'files'>('submit');
  const [loading, setLoading] = useState(true);

  // Submit Report Form States
  const [reportMonth, setReportMonth] = useState<number>(new Date().getMonth() + 1);
  const [reportYear, setReportYear] = useState<number>(new Date().getFullYear());
  const [reportTitle, setReportTitle] = useState('');
  const [reportSummary, setReportSummary] = useState('');
  
  // Word doc state
  const [wordFile, setWordFile] = useState<{ name: string; size: number; base64: string } | null>(null);
  
  // Photos state
  const [photos, setPhotos] = useState<{ photoUrl: string; caption: string }[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Reports History States
  const [reports, setReports] = useState<any[]>([]);
  const [selectedReportDetail, setSelectedReportDetail] = useState<any | null>(null);

  // Files Drive States
  const [files, setFiles] = useState<any[]>([]);
  const [uploadingFile, setUploadingFile] = useState(false);

  const wordInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Get current user
      const meRes = await fetch('/api/auth/me');
      if (meRes.ok) {
        const meData = await meRes.json();
        setUser(meData.user);
      }

      // 2. Get accessible projects
      const pRes = await fetch('/api/projects');
      if (pRes.ok) {
        const pData = await pRes.json();
        const pList = pData.projects || [];
        setProjects(pList);
        if (pList.length > 0 && !selectedProjectId) {
          setSelectedProjectId(pList[0].id);
        }
      }
    } catch (err) {
      console.error('Load projects error:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedProjectId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Load reports for selected project
  const loadReports = useCallback(async () => {
    if (!selectedProjectId) return;
    try {
      const res = await fetch(`/api/projects/reports?projectId=${selectedProjectId}&myReportsOnly=true`);
      if (res.ok) {
        const data = await res.json();
        setReports(data.reports || []);
      }
    } catch (err) {
      console.error('Load reports error:', err);
    }
  }, [selectedProjectId]);

  // Load files for selected project
  const loadFiles = useCallback(async () => {
    if (!selectedProjectId) return;
    try {
      const res = await fetch(`/api/projects/files?projectId=${selectedProjectId}`);
      if (res.ok) {
        const data = await res.json();
        setFiles(data.files || []);
      }
    } catch (err) {
      console.error('Load files error:', err);
    }
  }, [selectedProjectId]);

  useEffect(() => {
    if (activeTab === 'history') {
      loadReports();
    } else if (activeTab === 'files') {
      loadFiles();
    }
  }, [activeTab, selectedProjectId, loadReports, loadFiles]);

  // Handle Word Doc Select
  const handleWordFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.match(/\.(docx|doc|pdf)$/i)) {
      setMsg({ type: 'error', text: 'Vui lòng chọn file định dạng Word (.docx / .doc) hoặc PDF' });
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setWordFile({
        name: file.name,
        size: file.size,
        base64: event.target?.result as string,
      });
      setMsg(null);
    };
    reader.readAsDataURL(file);
  };

  // Handle Photos Select
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      if (!file.type.startsWith('image/')) return;
      const reader = new FileReader();
      reader.onload = (event) => {
        setPhotos((prev) => [
          ...prev,
          {
            photoUrl: event.target?.result as string,
            caption: file.name.replace(/\.[^/.]+$/, ''),
          },
        ]);
      };
      reader.readAsDataURL(file);
    });
  };

  // Submit Monthly Report
  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProjectId) {
      setMsg({ type: 'error', text: 'Vui lòng chọn dự án bạn đang công tác' });
      return;
    }

    if (!reportTitle.trim()) {
      setMsg({ type: 'error', text: 'Vui lòng nhập tiêu đề báo cáo tháng' });
      return;
    }

    setSubmitting(true);
    setMsg(null);

    try {
      const res = await fetch('/api/projects/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: selectedProjectId,
          month: reportMonth,
          year: reportYear,
          title: reportTitle,
          summary: reportSummary,
          wordDocUrl: wordFile?.base64 || null,
          wordDocName: wordFile?.name || null,
          wordDocSize: wordFile?.size || null,
          photos,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Lỗi nộp báo cáo');

      setMsg({ type: 'success', text: data.message });
      setReportTitle('');
      setReportSummary('');
      setWordFile(null);
      setPhotos([]);
      setActiveTab('history');
      await loadReports();
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  // Upload Generic File to Project Library
  const handleUploadProjectFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedProjectId) return;

    setUploadingFile(true);
    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64 = event.target?.result as string;
        const res = await fetch('/api/projects/files', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            projectId: selectedProjectId,
            fileName: file.name,
            fileUrl: base64,
            fileType: file.type.startsWith('image/') ? 'IMAGE' : 'DOCUMENT',
            fileSize: file.size,
            year: new Date().getFullYear(),
            month: new Date().getMonth() + 1,
            category: 'GENERAL',
          }),
        });

        if (res.ok) {
          await loadFiles();
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error('File upload error:', err);
    } finally {
      setUploadingFile(false);
    }
  };

  const selectedProject = projects.find((p) => p.id === selectedProjectId);

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      <EmployeeHeader user={user || { fullName: 'Nhân Viên Caritas', employeeCode: 'NV', role: 'EMPLOYEE' }} />

      <main className="flex-1 max-w-4xl w-full mx-auto px-3.5 sm:px-4 py-4 sm:py-6 pb-28 md:pb-8 space-y-5">
        {/* Top Title Banner */}
        <div className="bg-gradient-to-r from-red-800 to-slate-900 rounded-3xl p-5 text-white shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="p-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/15">
              <FolderKanban className="w-6 h-6 text-red-300" />
            </div>
            <div>
              <h1 className="text-base font-bold tracking-tight">Dự Án & Báo Cáo Định Kỳ</h1>
              <p className="text-xs text-slate-300 font-medium mt-0.5">
                Nộp file Word & Hình ảnh hoạt động từng tháng - Lưu trữ trực tiếp NAS Caritas
              </p>
            </div>
          </div>

          {/* Project Selector Badge */}
          {projects.length > 0 && (
            <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-md px-3.5 py-1.5 rounded-2xl border border-white/20">
              <span className="text-xs text-slate-300 font-medium">Dự án:</span>
              <select
                value={selectedProjectId || ''}
                onChange={(e) => setSelectedProjectId(parseInt(e.target.value, 10))}
                className="bg-transparent text-white font-bold text-xs focus:outline-hidden cursor-pointer"
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id} className="text-slate-900 font-bold">
                    {p.name} ({p.code})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {projects.length === 0 && !loading && (
          <div className="p-8 text-center bg-white rounded-3xl border border-slate-200 shadow-xs space-y-2">
            <ShieldAlert className="w-10 h-10 text-amber-500 mx-auto" />
            <h3 className="text-sm font-bold text-slate-800">Chưa Được Phân Công Dự Án</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Bạn chưa được phân quyền vào dự án nào (PLD, Sức Khỏe Tâm Thần, Ban Khuyết Tật, Ban Học Bổng). Vui lòng liên hệ Quản Trị Viên để được cấp quyền.
            </p>
          </div>
        )}

        {projects.length > 0 && (
          <>
            {/* Tabs Navigation */}
            <div className="flex items-center space-x-2 border-b border-slate-200 pb-1">
              <button
                onClick={() => setActiveTab('submit')}
                className={`flex items-center space-x-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition ${
                  activeTab === 'submit'
                    ? 'bg-red-600 text-white shadow-md shadow-red-950/20'
                    : 'text-slate-600 hover:bg-white hover:text-slate-900'
                }`}
              >
                <FileUp className="w-4 h-4" />
                <span>Nộp Báo Cáo Tháng</span>
              </button>

              <button
                onClick={() => setActiveTab('history')}
                className={`flex items-center space-x-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition ${
                  activeTab === 'history'
                    ? 'bg-red-600 text-white shadow-md shadow-red-950/20'
                    : 'text-slate-600 hover:bg-white hover:text-slate-900'
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>Lịch Sử Báo Cáo ({reports.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('files')}
                className={`flex items-center space-x-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition ${
                  activeTab === 'files'
                    ? 'bg-red-600 text-white shadow-md shadow-red-950/20'
                    : 'text-slate-600 hover:bg-white hover:text-slate-900'
                }`}
              >
                <FolderOpen className="w-4 h-4" />
                <span>Kho Dữ Liệu NAS ({files.length})</span>
              </button>
            </div>

            {/* TAB 1: SUBMIT REPORT FORM */}
            {activeTab === 'submit' && (
              <form onSubmit={handleSubmitReport} className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-6">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div>
                    <h2 className="text-sm font-bold text-slate-900">
                      Nộp Báo Cáo Tháng Cho Dự Án: <span className="text-red-600">{selectedProject?.name}</span>
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Dữ liệu file Word và hình ảnh sẽ được phân chia riêng biệt theo cấu trúc: {selectedProject?.code}/Tháng_{reportMonth}_{reportYear}/
                    </p>
                  </div>
                  <span className="text-[11px] font-mono font-bold px-2.5 py-1 rounded-xl bg-slate-100 text-slate-700 border border-slate-200">
                    {selectedProject?.code}
                  </span>
                </div>

                {msg && (
                  <div
                    className={`p-3.5 rounded-2xl text-xs font-bold flex items-center space-x-2 ${
                      msg.type === 'success'
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : 'bg-red-50 text-red-800 border border-red-200'
                    }`}
                  >
                    {msg.type === 'success' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                    )}
                    <span>{msg.text}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Select Month */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Kỳ Báo Cáo (Tháng)
                    </label>
                    <select
                      value={reportMonth}
                      onChange={(e) => setReportMonth(parseInt(e.target.value, 10))}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-red-500"
                    >
                      {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                        <option key={m} value={m}>
                          Tháng {m < 10 ? `0${m}` : m}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Select Year */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Năm Báo Cáo
                    </label>
                    <select
                      value={reportYear}
                      onChange={(e) => setReportYear(parseInt(e.target.value, 10))}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-red-500"
                    >
                      {[2025, 2026, 2027, 2028].map((y) => (
                        <option key={y} value={y}>
                          Năm {y}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Report Title */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Tiêu Đề Báo Cáo <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={reportTitle}
                    onChange={(e) => setReportTitle(e.target.value)}
                    placeholder={`Ví dụ: Báo cáo tiến độ hoạt động cộng đồng Tháng ${reportMonth}/${reportYear}`}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-red-500"
                  />
                </div>

                {/* Report Summary */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Tóm Tắt Kết Quả Hoạt Động & Số Liệu Nổi Bật
                  </label>
                  <textarea
                    rows={3}
                    value={reportSummary}
                    onChange={(e) => setReportSummary(e.target.value)}
                    placeholder="Tóm tắt ngắn gọn các sự kiện, số hộ hưởng lợi, khóa tập huấn đã tổ chức trong tháng..."
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-red-500 resize-none"
                  />
                </div>

                {/* WORD DOCUMENT UPLOAD */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-dashed border-slate-300 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-800 flex items-center space-x-2">
                      <FileText className="w-4 h-4 text-blue-600" />
                      <span>File Báo Cáo Word (.docx / .doc) Bàn Giao Nhà Tài Trợ</span>
                    </label>
                    <input
                      type="file"
                      ref={wordInputRef}
                      onChange={handleWordFileChange}
                      accept=".docx,.doc,.pdf"
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => wordInputRef.current?.click()}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs flex items-center space-x-1.5 transition shadow-xs"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>{wordFile ? 'Đổi file Word' : 'Chọn file Word'}</span>
                    </button>
                  </div>

                  {wordFile ? (
                    <div className="p-3 bg-white rounded-xl border border-blue-200 flex items-center justify-between">
                      <div className="flex items-center space-x-2.5 overflow-hidden">
                        <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs shrink-0">
                          DOC
                        </div>
                        <div className="truncate">
                          <p className="text-xs font-bold text-slate-900 truncate">{wordFile.name}</p>
                          <p className="text-[10px] text-slate-500 font-mono">
                            {(wordFile.size / 1024).toFixed(1)} KB
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setWordFile(null)}
                        className="p-1 text-slate-400 hover:text-red-500"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <p className="text-[11px] text-slate-400 text-center py-2">
                      Chưa chọn file Word. Bấm &quot;Chọn file Word&quot; để tải file đính kèm.
                    </p>
                  )}
                </div>

                {/* PHOTOS ALBUM UPLOAD */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-dashed border-slate-300 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-800 flex items-center space-x-2">
                      <ImageIcon className="w-4 h-4 text-emerald-600" />
                      <span>Bộ Ảnh Hoạt Động Thực Địa Minh Họa ({photos.length} ảnh)</span>
                    </label>
                    <input
                      type="file"
                      ref={photoInputRef}
                      onChange={handlePhotoSelect}
                      accept="image/*"
                      multiple
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => photoInputRef.current?.click()}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center space-x-1.5 transition shadow-xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Thêm ảnh</span>
                    </button>
                  </div>

                  {photos.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {photos.map((p, idx) => (
                        <div key={idx} className="relative rounded-2xl overflow-hidden border border-slate-200 bg-white group shadow-2xs">
                          <img src={p.photoUrl} alt="" className="w-full h-28 object-cover" />
                          <button
                            type="button"
                            onClick={() => setPhotos((prev) => prev.filter((_, i) => i !== idx))}
                            className="absolute top-1.5 right-1.5 p-1 bg-black/60 text-white rounded-full hover:bg-red-600 transition"
                          >
                            <X className="w-3 h-3" />
                          </button>
                          <div className="p-2">
                            <input
                              type="text"
                              value={p.caption}
                              onChange={(e) => {
                                const newCaption = e.target.value;
                                setPhotos((prev) =>
                                  prev.map((item, i) =>
                                    i === idx ? { ...item, caption: newCaption } : item
                                  )
                                );
                              }}
                              placeholder="Chú thích ảnh..."
                              className="w-full px-2 py-1 text-[11px] bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[11px] text-slate-400 text-center py-2">
                      Chưa có hình ảnh minh họa nào được chọn.
                    </p>
                  )}
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3.5 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-bold rounded-2xl text-xs flex items-center justify-center space-x-2 transition shadow-lg shadow-red-950/20 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>{submitting ? 'Đang gửi báo cáo...' : 'Nộp Báo Cáo Lên Ban Điều Phối'}</span>
                </button>
              </form>
            )}

            {/* TAB 2: REPORTS HISTORY */}
            {activeTab === 'history' && (
              <div className="space-y-4">
                {reports.length === 0 ? (
                  <div className="p-8 text-center bg-white rounded-3xl border border-slate-200 text-slate-500 text-xs font-semibold">
                    Chưa có báo cáo nào được nộp cho dự án này.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {reports.map((rep) => (
                      <div
                        key={rep.id}
                        className="p-5 bg-white rounded-3xl border border-slate-200 shadow-xs space-y-3 hover:border-slate-300 transition"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-800 border border-slate-200">
                                Tháng {rep.month < 10 ? `0${rep.month}` : rep.month}/{rep.year}
                              </span>
                              <h3 className="text-sm font-bold text-slate-900">{rep.title}</h3>
                            </div>
                            <p className="text-[11px] text-slate-400 mt-1">
                              Nộp lúc {formatDateTimeVN(rep.createdAt)}
                            </p>
                          </div>

                          {/* Status Badge */}
                          <div>
                            {rep.status === 'APPROVED' && (
                              <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center space-x-1">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Đã duyệt ✓</span>
                              </span>
                            )}
                            {rep.status === 'REVISION_REQUESTED' && (
                              <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200 flex items-center space-x-1">
                                <AlertCircle className="w-3.5 h-3.5" />
                                <span>Yêu cầu bổ sung ⚠️</span>
                              </span>
                            )}
                            {rep.status === 'SUBMITTED' && (
                              <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 flex items-center space-x-1">
                                <Clock className="w-3.5 h-3.5" />
                                <span>Chờ duyệt</span>
                              </span>
                            )}
                          </div>
                        </div>

                        {rep.summary && (
                          <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-2xl font-medium">
                            {rep.summary}
                          </p>
                        )}

                        {/* Review Notes from Coordinator */}
                        {rep.reviewNotes && (
                          <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1">
                            <p className="font-bold flex items-center space-x-1.5">
                              <Info className="w-3.5 h-3.5 text-amber-700" />
                              <span>Ý kiến phản hồi từ Điều Phối:</span>
                            </p>
                            <p className="text-slate-700 font-medium pl-5">{rep.reviewNotes}</p>
                          </div>
                        )}

                        {/* Attachments Summary & Actions */}
                        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                          <div className="flex items-center space-x-4 text-xs font-semibold text-slate-500">
                            {rep.wordDocName && (
                              <span className="flex items-center space-x-1 text-blue-600 font-bold">
                                <FileText className="w-3.5 h-3.5" />
                                <span>{rep.wordDocName}</span>
                              </span>
                            )}
                            {rep.photos?.length > 0 && (
                              <span className="flex items-center space-x-1 text-emerald-600 font-bold">
                                <ImageIcon className="w-3.5 h-3.5" />
                                <span>{rep.photos.length} hình ảnh minh họa</span>
                              </span>
                            )}
                          </div>

                          <button
                            onClick={() => setSelectedReportDetail(rep)}
                            className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center space-x-1.5 transition"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Xem Chi Tiết</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: PROJECT DRIVE FILES ON NAS */}
            {activeTab === 'files' && (
              <div className="space-y-4">
                {/* NAS Security & Anti-Deletion Notice */}
                <div className="p-4 rounded-2xl bg-sky-50 border border-sky-200 text-xs text-sky-950 flex items-start space-x-3">
                  <ShieldAlert className="w-5 h-5 text-sky-700 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold">Chính Sách Lưu Trữ NAS Dự Án:</p>
                    <p className="text-slate-600 mt-0.5 font-medium">
                      Nhân viên chỉ có quyền <strong>Xem</strong>, <strong>Tải về</strong> và <strong>Tải lên tệp mới</strong>. Quyền xóa dữ liệu được khóa an toàn để bảo vệ tài liệu dự án của Caritas Đà Lạt.
                    </p>
                  </div>
                </div>

                {/* Upload Generic File */}
                <div className="flex items-center justify-between bg-white p-4 rounded-3xl border border-slate-200">
                  <div>
                    <h3 className="text-xs font-bold text-slate-900">Kho Tài Liệu & Biểu Mẫu Dự Án</h3>
                    <p className="text-[11px] text-slate-500 font-mono">
                      {selectedProject?.nasPath}
                    </p>
                  </div>

                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleUploadProjectFile}
                    className="hidden"
                  />
                  <button
                    disabled={uploadingFile}
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3.5 py-2 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-bold rounded-2xl text-xs flex items-center space-x-1.5 transition shadow-sm"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>{uploadingFile ? 'Đang tải lên...' : 'Tải Lên Tệp Mới'}</span>
                  </button>
                </div>

                {/* Files List */}
                {files.length === 0 ? (
                  <div className="p-8 text-center bg-white rounded-3xl border border-slate-200 text-slate-500 text-xs font-semibold">
                    Chưa có tệp tin nào trong thư mục dự án này.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {files.map((file) => (
                      <div
                        key={file.id}
                        className="p-4 bg-white rounded-2xl border border-slate-200 flex items-center justify-between gap-3 shadow-2xs"
                      >
                        <div className="flex items-center space-x-3 overflow-hidden">
                          <div className="p-2.5 rounded-xl bg-slate-100 text-slate-700 shrink-0">
                            {file.fileType === 'IMAGE' ? (
                              <ImageIcon className="w-5 h-5 text-emerald-600" />
                            ) : (
                              <FileText className="w-5 h-5 text-blue-600" />
                            )}
                          </div>
                          <div className="truncate">
                            <p className="text-xs font-bold text-slate-900 truncate">{file.fileName}</p>
                            <p className="text-[10px] text-slate-400">
                              Bởi {file.uploadedBy?.fullName} • {formatDateVN(file.createdAt)}
                            </p>
                          </div>
                        </div>

                        <a
                          href={file.fileUrl}
                          download={file.fileName}
                          className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition shrink-0"
                          title="Tải về"
                        >
                          <Download className="w-4 h-4" />
                        </a>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* Report Detail Modal */}
        {selectedReportDetail && (
          <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="relative max-w-2xl w-full bg-white rounded-3xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-800">
                    Tháng {selectedReportDetail.month}/{selectedReportDetail.year}
                  </span>
                  <h3 className="text-sm font-bold text-slate-900 mt-1">
                    {selectedReportDetail.title}
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedReportDetail(null)}
                  className="p-1 rounded-full text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {selectedReportDetail.summary && (
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-slate-700">Tóm tắt hoạt động:</h4>
                  <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-2xl font-medium">
                    {selectedReportDetail.summary}
                  </p>
                </div>
              )}

              {/* Word Doc Attachment */}
              {selectedReportDetail.wordDocUrl && (
                <div className="p-3.5 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-between">
                  <div className="flex items-center space-x-2.5">
                    <FileText className="w-5 h-5 text-blue-700" />
                    <div>
                      <p className="text-xs font-bold text-blue-900">
                        {selectedReportDetail.wordDocName || 'File_Bao_Cao.docx'}
                      </p>
                      <p className="text-[10px] text-blue-600">File Word Báo Cáo Nhà Tài Trợ</p>
                    </div>
                  </div>
                  <a
                    href={selectedReportDetail.wordDocUrl}
                    download={selectedReportDetail.wordDocName || 'Bao_Cao.docx'}
                    className="px-3 py-1.5 bg-blue-700 hover:bg-blue-600 text-white font-bold rounded-xl text-xs flex items-center space-x-1.5 transition"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Tải về</span>
                  </a>
                </div>
              )}

              {/* Photo Gallery */}
              {selectedReportDetail.photos?.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-700">
                    Bộ ảnh hoạt động ({selectedReportDetail.photos.length} ảnh):
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    {selectedReportDetail.photos.map((p: any, idx: number) => (
                      <div key={idx} className="rounded-2xl overflow-hidden border border-slate-200 bg-slate-50">
                        <img src={p.photoUrl} alt="" className="w-full h-40 object-cover" />
                        {p.caption && (
                          <p className="p-2 text-[11px] text-slate-600 font-medium text-center">
                            {p.caption}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
