import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || user.role === 'EMPLOYEE') {
      return NextResponse.json({ error: 'Không có quyền truy cập' }, { status: 403 });
    }

    const shifts = await prisma.shift.findMany({
      orderBy: { id: 'asc' },
    });

    return NextResponse.json({ shifts });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Chỉ Admin mới có quyền thao tác' }, { status: 403 });
    }

    const { name, startTime, endTime, allowedLateMinutes, allowedEarlyMinutes } = await req.json();

    if (!name || !startTime || !endTime) {
      return NextResponse.json({ error: 'Vui lòng nhập đầy đủ tên ca, giờ vào và giờ ra' }, { status: 400 });
    }

    const shift = await prisma.shift.create({
      data: {
        name,
        startTime,
        endTime,
        allowedLateMinutes: Number(allowedLateMinutes) || 15,
        allowedEarlyMinutes: Number(allowedEarlyMinutes) || 15,
        isActive: true,
      },
    });

    return NextResponse.json({ success: true, shift });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Chỉ Admin mới có quyền thao tác' }, { status: 403 });
    }

    const { id, name, startTime, endTime, allowedLateMinutes, allowedEarlyMinutes, isActive } =
      await req.json();

    const updated = await prisma.shift.update({
      where: { id: Number(id) },
      data: {
        name,
        startTime,
        endTime,
        allowedLateMinutes: Number(allowedLateMinutes),
        allowedEarlyMinutes: Number(allowedEarlyMinutes),
        isActive: isActive !== undefined ? isActive : true,
      },
    });

    return NextResponse.json({ success: true, shift: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
