import prisma from './prisma';

export interface LeaveBalanceSummary {
  annualLeaveAccruedTotal: number; // Phép năm tích lũy đến hiện tại
  annualLeaveUsed: number;         // Phép năm đã nghỉ được duyệt
  annualLeaveRemaining: number;    // Phép năm còn lại khả dụng
  compensatoryAvailableThisWeek: number; // Số ngày nghỉ bù khả dụng trong tuần này
  compensatoryExpiresAt: string;  // Hạn sử dụng nghỉ bù (Chủ Nhật cuối tuần này)
  weekendWorkDaysPreviousWeek: number; // Số ngày làm thêm T7/CN tuần trước
  compensatoryUsedThisWeek: number; // Đã nghỉ bù trong tuần này
}

/**
 * Returns Monday (00:00:00) and Sunday (23:59:59) for a given date
 */
export function getWeekRange(date: Date = new Date()) {
  const d = new Date(date);
  const day = d.getDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat
  const diffToMonday = day === 0 ? -6 : 1 - day;

  const monday = new Date(d);
  monday.setDate(d.getDate() + diffToMonday);
  monday.setHours(0, 0, 0, 0);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  return { monday, sunday };
}

/**
 * Calculates Leave Balances including Annual Leave and Weekly Compensatory Leave
 */
export async function calculateUserLeaveBalances(
  userId: number,
  referenceDate: Date = new Date()
): Promise<LeaveBalanceSummary> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      joinDate: true,
      annualLeaveBase: true,
      contractType: true,
    },
  });

  const currentYear = referenceDate.getFullYear();
  const currentMonth = referenceDate.getMonth(); // 0..11

  // 1. Calculate Annual Leave Accrual (1 day per working month in current year)
  // For Part-time or Contract, annualLeaveBase might be 0 or custom
  const baseRatePerMonth = (user?.annualLeaveBase ?? 12.0) / 12.0;
  
  // Accrued months in current year (1..12)
  const monthsAccrued = currentMonth + 1;
  const annualLeaveAccruedTotal = Math.round(monthsAccrued * baseRatePerMonth * 10) / 10;

  // 2. Query Approved Annual Leave Taken in current year
  const yearStart = new Date(currentYear, 0, 1, 0, 0, 0, 0);
  const yearEnd = new Date(currentYear, 11, 31, 23, 59, 59, 999);

  const annualLeaveRequests = await prisma.leaveRequest.findMany({
    where: {
      userId,
      leaveType: 'ANNUAL',
      status: 'APPROVED',
      fromDate: { gte: yearStart, lte: yearEnd },
    },
  });

  const annualLeaveUsed = annualLeaveRequests.reduce((sum, req) => sum + req.daysCount, 0);
  const annualLeaveRemaining = Math.max(0, Math.round((annualLeaveAccruedTotal - annualLeaveUsed) * 10) / 10);

  // 3. Calculate Compensatory Leave (Nghỉ Bù)
  // Rule: Weekend work (Sat/Sun) in PREVIOUS week grants compensatory days in CURRENT week.
  // Unused compensatory days expire at the end of CURRENT week.
  const { monday: currentMonday, sunday: currentSunday } = getWeekRange(referenceDate);

  // Previous week range
  const prevMonday = new Date(currentMonday);
  prevMonday.setDate(currentMonday.getDate() - 7);
  const prevSunday = new Date(currentSunday);
  prevSunday.setDate(currentSunday.getDate() - 7);

  // Find unique weekend dates worked in previous week (Saturday & Sunday)
  const prevWeekAttendances = await prisma.attendance.findMany({
    where: {
      userId,
      serverTime: { gte: prevMonday, lte: prevSunday },
    },
    select: { serverTime: true },
  });

  const weekendWorkDates = new Set<string>();
  for (const att of prevWeekAttendances) {
    const d = new Date(att.serverTime);
    const dayOfWeek = d.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) { // Sunday or Saturday
      const dateKey = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
      weekendWorkDates.add(dateKey);
    }
  }

  const weekendWorkDaysPreviousWeek = weekendWorkDates.size;

  // Query Approved Compensatory Leave used in current week
  const compensatoryRequests = await prisma.leaveRequest.findMany({
    where: {
      userId,
      leaveType: 'COMPENSATORY',
      status: 'APPROVED',
      fromDate: { gte: currentMonday, lte: currentSunday },
    },
  });

  const compensatoryUsedThisWeek = compensatoryRequests.reduce((sum, req) => sum + req.daysCount, 0);
  const compensatoryAvailableThisWeek = Math.max(0, weekendWorkDaysPreviousWeek - compensatoryUsedThisWeek);

  const expiresFormatted = new Intl.DateTimeFormat('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(currentSunday);

  return {
    annualLeaveAccruedTotal,
    annualLeaveUsed,
    annualLeaveRemaining,
    compensatoryAvailableThisWeek,
    compensatoryExpiresAt: expiresFormatted,
    weekendWorkDaysPreviousWeek,
    compensatoryUsedThisWeek,
  };
}
