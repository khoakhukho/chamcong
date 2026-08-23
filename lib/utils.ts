import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDateTimeVN(date: Date | string | null | undefined): string {
  if (!date) return '-';
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(d);
}

export function formatDateVN(date: Date | string | null | undefined): string {
  if (!date) return '-';
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d);
}

export function formatTimeVN(date: Date | string | null | undefined): string {
  if (!date) return '-';
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(d);
}

export function getLeaveTypeLabel(type: string): string {
  switch (type) {
    case 'ANNUAL':
      return 'Nghỉ phép năm';
    case 'SICK':
      return 'Nghỉ ốm (BHXH)';
    case 'UNPAID':
      return 'Nghỉ việc riêng không lương';
    case 'LATE_EXCUSE':
      return 'Giải trình đi muộn / Quên chấm công';
    default:
      return type;
  }
}

export function getLeaveStatusBadge(status: string): { label: string; color: string } {
  switch (status) {
    case 'APPROVED':
      return { label: 'Đã duyệt', color: 'bg-emerald-100 text-emerald-800 border-emerald-300' };
    case 'REJECTED':
      return { label: 'Từ chối', color: 'bg-rose-100 text-rose-800 border-rose-300' };
    case 'PENDING':
    default:
      return { label: 'Chờ duyệt', color: 'bg-amber-100 text-amber-800 border-amber-300' };
  }
}
