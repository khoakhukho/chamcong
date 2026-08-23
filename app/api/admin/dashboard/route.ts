import { NextResponse } from 'next/server';
import prisma, { ensureDatabaseReady } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await ensureDatabaseReady();
    const user = await getCurrentUser();
    if (!user || user.role === 'EMPLOYEE') {
      return NextResponse.json({ error: 'Không có quyền truy cập quản trị' }, { status: 403 });
    }

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    // 1. Total active employees
    const totalEmployees = await prisma.user.count({
      where: { isActive: true, role: 'EMPLOYEE' },
    });

    // 2. All attendances today
    const todayAttendances = await prisma.attendance.findMany({
      where: {
        serverTime: { gte: todayStart, lte: todayEnd },
      },
      include: {
        user: {
          select: {
            id: true,
            employeeCode: true,
            fullName: true,
            department: true,
          },
        },
      },
      orderBy: { serverTime: 'desc' },
    });

    // Unique users who checked in today
    const checkedInUserIds = new Set(
      todayAttendances.filter((a) => a.checkType === 'IN').map((a) => a.userId)
    );

    const checkedInCount = checkedInUserIds.size;
    const notCheckedInCount = Math.max(0, totalEmployees - checkedInCount);

    // Late count
    const lateCount = todayAttendances.filter((a) => a.checkType === 'IN' && a.isLate).length;

    // Location invalid count
    const invalidLocationCount = todayAttendances.filter((a) => !a.isValidLocation).length;

    // Pending leave requests
    const pendingLeaveCount = await prisma.leaveRequest.count({
      where: { status: 'PENDING' },
    });

    // Active shifts & locations count
    const totalLocations = await prisma.location.count({ where: { isActive: true } });

    return NextResponse.json({
      stats: {
        totalEmployees,
        checkedInCount,
        notCheckedInCount,
        lateCount,
        invalidLocationCount,
        pendingLeaveCount,
        totalLocations,
      },
      recentAttendances: todayAttendances.slice(0, 20),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
