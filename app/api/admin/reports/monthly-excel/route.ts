import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { generateMonthlyExcelReport, MonthlyAttendanceData } from '@/lib/excel-export';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role === 'EMPLOYEE') {
      return NextResponse.json({ error: 'Không có quyền xuất báo cáo kế toán' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const month = parseInt(searchParams.get('month') || (new Date().getMonth() + 1).toString(), 10);
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString(), 10);

    const startDate = new Date(year, month - 1, 1, 0, 0, 0);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);
    const totalDays = new Date(year, month, 0).getDate();

    // 1. Fetch all active employees
    const employees = await prisma.user.findMany({
      where: { isActive: true },
      orderBy: [{ department: 'asc' }, { employeeCode: 'asc' }],
    });

    // 2. Fetch attendances in this month
    const attendances = await prisma.attendance.findMany({
      where: {
        serverTime: { gte: startDate, lte: endDate },
      },
      orderBy: { serverTime: 'asc' },
    });

    // 3. Fetch approved leave requests
    const leaveRequests = await prisma.leaveRequest.findMany({
      where: {
        status: 'APPROVED',
        fromDate: { lte: endDate },
        toDate: { gte: startDate },
      },
    });

    // 4. Transform data for synthesis sheet
    const reportData: MonthlyAttendanceData = {
      month,
      year,
      totalDays,
      users: employees.map((emp: any) => {
        const empAttendances = attendances.filter((a) => a.userId === emp.id);
        const empLeaves = leaveRequests.filter((l) => l.userId === emp.id);

        let totalWorkDays = 0;
        let totalCompensatoryDays = 0;
        let totalPaidLeave = 0;
        let totalWorkedHours = 0;

        const days = [];

        for (let d = 1; d <= totalDays; d++) {
          const dateObj = new Date(year, month - 1, d);
          const dayOfWeek = dateObj.getDay(); // 0 = Sun, 6 = Sat

          const dayStart = new Date(year, month - 1, d, 0, 0, 0);
          const dayEnd = new Date(year, month - 1, d, 23, 59, 59, 999);

          const dayAtts = empAttendances.filter(
            (a) => a.serverTime >= dayStart && a.serverTime <= dayEnd
          );
          const checkIn = dayAtts.find((a) => a.checkType === 'IN');
          const checkOut = dayAtts.find((a) => a.checkType === 'OUT');

          // Check leave on this day
          const leaveOnDay = empLeaves.find((l) => {
            const lStart = new Date(l.fromDate);
            lStart.setHours(0, 0, 0, 0);
            const lEnd = new Date(l.toDate);
            lEnd.setHours(23, 59, 59, 999);
            return dayStart >= lStart && dayStart <= lEnd;
          });

          let symbol = '';
          let workedHours = 0;

          if (checkIn && checkOut) {
            symbol = 'X';
            totalWorkDays += 1;
            const diffMs = new Date(checkOut.serverTime).getTime() - new Date(checkIn.serverTime).getTime();
            workedHours = Math.max(0, Math.round((diffMs / (1000 * 60 * 60)) * 10) / 10);
            totalWorkedHours += workedHours;
          } else if (checkIn || checkOut) {
            symbol = '1/2';
            totalWorkDays += 0.5;
            workedHours = 4.0; // Half day default
            totalWorkedHours += workedHours;
          } else if (leaveOnDay) {
            if (leaveOnDay.leaveType === 'COMPENSATORY') {
              symbol = 'NB';
              totalCompensatoryDays += 1;
            } else if (leaveOnDay.leaveType === 'ANNUAL') {
              symbol = 'P';
              totalPaidLeave += 1;
            } else if (leaveOnDay.leaveType === 'SICK') {
              symbol = 'Ô';
            } else if (leaveOnDay.leaveType === 'PERSONAL') {
              symbol = 'Ro';
              totalPaidLeave += 1;
            } else if (leaveOnDay.leaveType === 'UNPAID') {
              symbol = 'KP';
            } else {
              symbol = 'P';
              totalPaidLeave += 1;
            }
          }

          days.push({
            day: d,
            dayOfWeek,
            symbol,
            inTime: checkIn ? checkIn.serverTime.toISOString() : undefined,
            outTime: checkOut ? checkOut.serverTime.toISOString() : undefined,
            workedHours,
          });
        }

        return {
          id: emp.id,
          employeeCode: emp.employeeCode,
          fullName: emp.fullName,
          department: emp.department,
          contractType: emp.contractType || 'FULL_TIME',
          days,
          totalWorkDays,
          totalCompensatoryDays,
          totalPaidLeave,
          totalWorkedHours: Math.round(totalWorkedHours * 10) / 10,
        };
      }),
    };

    const excelBuffer = await generateMonthlyExcelReport(reportData);

    const fileName = `Bang_Tong_Hop_Cham_Cong_Thang_${month}_${year}_Caritas_Dalat.xlsx`;

    return new NextResponse(new Uint8Array(excelBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    });
  } catch (error: any) {
    console.error('Monthly excel error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
