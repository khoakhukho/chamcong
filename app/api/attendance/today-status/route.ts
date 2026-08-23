import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });
    }

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const attendances = await prisma.attendance.findMany({
      where: {
        userId: user.id,
        serverTime: {
          gte: todayStart,
          lte: todayEnd,
        },
      },
      orderBy: { serverTime: 'asc' },
    });

    const checkIn = attendances.find((a) => a.checkType === 'IN') || null;
    const checkOut = attendances.filter((a) => a.checkType === 'OUT').pop() || null;

    const defaultShift = await prisma.shift.findFirst({
      where: { isActive: true },
    });

    return NextResponse.json({
      checkIn,
      checkOut,
      allToday: attendances,
      shift: defaultShift,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
