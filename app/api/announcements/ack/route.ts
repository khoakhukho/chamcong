import { NextResponse } from 'next/server';
import prisma, { ensureDatabaseReady } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });
    }

    await ensureDatabaseReady();

    const { announcementId } = await req.json();

    if (!announcementId) {
      return NextResponse.json({ error: 'Thiếu ID thông báo' }, { status: 400 });
    }

    const annId = parseInt(announcementId, 10);

    const ack = await prisma.announcementAck.upsert({
      where: {
        announcementId_userId: {
          announcementId: annId,
          userId: user.id,
        },
      },
      update: {
        acknowledgedAt: new Date(),
      },
      create: {
        announcementId: annId,
        userId: user.id,
        acknowledgedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: '✓ Bạn đã xác nhận nhận được thông báo thành công!',
      acknowledgedAt: ack.acknowledgedAt,
    });
  } catch (error: any) {
    console.error('announcement ack error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || !['ADMIN', 'MANAGER', 'ACCOUNTANT'].includes(user.role)) {
      return NextResponse.json({ error: 'Không có quyền truy cập' }, { status: 403 });
    }

    await ensureDatabaseReady();

    const { searchParams } = new URL(req.url);
    const announcementId = searchParams.get('announcementId');

    if (!announcementId) {
      return NextResponse.json({ error: 'Thiếu ID thông báo' }, { status: 400 });
    }

    const annId = parseInt(announcementId, 10);

    // Get announcement details
    const announcement = await prisma.announcement.findUnique({
      where: { id: annId },
    });

    if (!announcement) {
      return NextResponse.json({ error: 'Không tìm thấy thông báo' }, { status: 404 });
    }

    // Get all active employees
    const employees = await prisma.user.findMany({
      where: { isActive: true },
      select: {
        id: true,
        employeeCode: true,
        fullName: true,
        department: true,
        contractType: true,
        avatarUrl: true,
      },
      orderBy: { fullName: 'asc' },
    });

    // Get acks
    const acks = await prisma.announcementAck.findMany({
      where: { announcementId: annId },
      select: {
        userId: true,
        acknowledgedAt: true,
      },
    });

    const ackMap = new Map<number, Date>();
    acks.forEach((a) => ackMap.set(a.userId, a.acknowledgedAt));

    const report = employees.map((emp) => ({
      ...emp,
      hasAcknowledged: ackMap.has(emp.id),
      acknowledgedAt: ackMap.get(emp.id) || null,
    }));

    const totalCount = employees.length;
    const ackCount = acks.length;

    return NextResponse.json({
      announcement,
      totalEmployees: totalCount,
      acknowledgedCount: ackCount,
      unacknowledgedCount: totalCount - ackCount,
      report,
    });
  } catch (error: any) {
    console.error('announcement ack stats error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
