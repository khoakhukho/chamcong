import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const month = parseInt(searchParams.get('month') || (new Date().getMonth() + 1).toString(), 10);
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString(), 10);

    const startDate = new Date(year, month - 1, 1, 0, 0, 0);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    const attendances = await prisma.attendance.findMany({
      where: {
        userId: user.id,
        serverTime: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { serverTime: 'desc' },
    });

    const leaveRequests = await prisma.leaveRequest.findMany({
      where: {
        userId: user.id,
        fromDate: { lte: endDate },
        toDate: { gte: startDate },
      },
      orderBy: { fromDate: 'desc' },
    });

    return NextResponse.json({
      month,
      year,
      attendances,
      leaveRequests,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
