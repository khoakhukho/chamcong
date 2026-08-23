import { NextResponse } from 'next/server';
import prisma, { ensureDatabaseReady } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

/**
 * Build the correct Prisma WHERE clause for notifications based on user role.
 * - ADMIN / ACCOUNTANT: see notifications sent to them by userId, OR targetRole='ADMIN', OR targetRole='ALL'
 * - MANAGER: see targetRole='MANAGER' OR targetRole='ADMIN' OR targetRole='ALL' OR their userId
 * - EMPLOYEE: see their own userId notifications OR targetRole='ALL' only
 *   (EMPLOYEE must NOT see ADMIN/MANAGER-scoped notifications)
 */
function buildNotificationWhere(user: { id: number; role: string }) {
  if (user.role === 'ADMIN' || user.role === 'ACCOUNTANT') {
    return {
      OR: [
        { userId: user.id },
        { targetRole: 'ADMIN' },
        { targetRole: 'ALL' },
      ],
    };
  }

  if (user.role === 'MANAGER') {
    return {
      OR: [
        { userId: user.id },
        { targetRole: 'MANAGER' },
        { targetRole: 'ADMIN' }, // Managers can see admin-scoped notifs too
        { targetRole: 'ALL' },
      ],
    };
  }

  // EMPLOYEE role - only personal notifications OR broadcast-to-ALL
  return {
    OR: [
      { userId: user.id },
      { targetRole: 'ALL' },
    ],
  };
}

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });
    }

    await ensureDatabaseReady();

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const onlyUnread = searchParams.get('unread') === 'true';
    const skip = (page - 1) * limit;

    const whereClause = buildNotificationWhere(user);

    // Apply optional unread filter
    const finalWhere = onlyUnread
      ? { AND: [whereClause, { isRead: false }] }
      : whereClause;

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where: finalWhere,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.notification.count({ where: finalWhere }),
    ]);

    // Always compute unread from the base (non-filtered) where clause
    const unreadCount = await prisma.notification.count({
      where: { AND: [whereClause, { isRead: false }] },
    });

    return NextResponse.json({
      notifications,
      unreadCount,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      hasMore: skip + notifications.length < total,
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

    const whereClause = buildNotificationWhere(user);

    if (markAll) {
      await prisma.notification.updateMany({
        where: { AND: [whereClause, { isRead: false }] },
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
