import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role === 'EMPLOYEE') {
      return NextResponse.json({ error: 'Không có quyền truy cập' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const dateStr = searchParams.get('date'); // YYYY-MM-DD
    const department = searchParams.get('department');
    const employeeId = searchParams.get('employeeId');
    const checkType = searchParams.get('checkType');
    const status = searchParams.get('status'); // 'LATE', 'EARLY', 'INVALID_LOC'

    const where: any = {};

    if (dateStr) {
      const [y, m, d] = dateStr.split('-').map(Number);
      const dayStart = new Date(y, m - 1, d, 0, 0, 0);
      const dayEnd = new Date(y, m - 1, d, 23, 59, 59, 999);
      where.serverTime = { gte: dayStart, lte: dayEnd };
    }

    if (department && department !== 'ALL') {
      where.user = { department };
    }

    if (employeeId && employeeId !== 'ALL') {
      where.userId = Number(employeeId);
    }

    if (checkType && checkType !== 'ALL') {
      where.checkType = checkType;
    }

    if (status === 'LATE') {
      where.isLate = true;
    } else if (status === 'EARLY') {
      where.isEarlyLeave = true;
    } else if (status === 'INVALID_LOC') {
      where.isValidLocation = false;
    }

    const attendances = await prisma.attendance.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            employeeCode: true,
            fullName: true,
            department: true,
            phone: true,
          },
        },
        shift: true,
      },
      orderBy: { serverTime: 'desc' },
      take: 200,
    });

    return NextResponse.json({ attendances });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
