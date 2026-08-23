import { NextResponse } from 'next/server';
import prisma, { ensureDatabaseReady } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });
    }

    await ensureDatabaseReady();

    // Query notifications for user specifically OR for user's role OR for ALL
    const notifications = await prisma.notification.findMany({
      where: {
        OR: [
          { userId: user.id },
          { targetRole: user.role },
          { targetRole: 'ALL' },
          ...(user.role === 'ADMIN' ? [{ targetRole: 'MANAGER' }] : []),
        ],
      },
      orderBy: { createdAt: 'desc' },
      take: 30,
    });

    const unreadCount = notifications.filter((n) => !n.isRead).length;

    return NextResponse.json({
      notifications,
      unreadCount,
    });
  } catch (error: any) {
    console.error('notifications GET error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });
    }

    await ensureDatabaseReady();
    const { id, markAll } = await req.json();

    if (markAll) {
      await prisma.notification.updateMany({
        where: {
          OR: [
            { userId: user.id },
            { targetRole: user.role },
            { targetRole: 'ALL' },
          ],
          isRead: false,
        },
        data: { isRead: true },
      });
      return NextResponse.json({ success: true, message: 'Đã đánh dấu đọc tất cả' });
    }

    if (id) {
      await prisma.notification.update({
        where: { id: parseInt(id, 10) },
        data: { isRead: true },
      });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Tham số không hợp lệ' }, { status: 400 });
  } catch (error: any) {
    console.error('notifications PATCH error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
