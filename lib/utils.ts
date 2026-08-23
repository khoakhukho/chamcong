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
      return 'Nghỉ phép năm (Có lương)';
    case 'COMPENSATORY':
      return 'Nghỉ bù cuối tuần (Có lương)';
    case 'SICK':
      return 'Nghỉ ốm đau (BHXH)';
    case 'PERSONAL':
      return 'Việc riêng có lương (Hiếu hỷ)';
    case 'UNPAID':
      return 'Nghỉ việc riêng không lương';
    case 'LATE_EXCUSE':
      return 'Giải trình quên quẹt thẻ / Đi muộn';
    default:
      return type;
  }
}

export function getContractTypeLabel(type: string | null | undefined): string {
  switch (type) {
    case 'FULL_TIME':
      return 'Toàn thời gian';
    case 'PART_TIME':
      return 'Bán thời gian';
    case 'CONTRACT':
      return 'Khoán việc';
    default:
      return 'Toàn thời gian';
  }
}

export function getRoleLabel(role: string | null | undefined): string {
  switch (role) {
    case 'ADMIN':
      return 'Quản trị viên';
    case 'ACCOUNTANT':
      return 'Kế toán';
    case 'MANAGER':
      return 'Trưởng bộ phận';
    case 'EMPLOYEE':
      return 'Nhân viên';
    default:
      return 'Nhân viên';
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
