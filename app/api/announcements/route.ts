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

    const announcements = await prisma.announcement.findMany({
      include: {
        createdBy: {
          select: { id: true, fullName: true, employeeCode: true },
        },
        acknowledgments: {
          where: { userId: user.id },
          select: { acknowledgedAt: true },
        },
      },
      orderBy: [
        { isPinned: 'desc' },
        { createdAt: 'desc' },
      ],
    });

    const formatted = announcements.map((a) => ({
      id: a.id,
      title: a.title,
      content: a.content,
      category: a.category,
      isPinned: a.isPinned,
      requireAck: a.requireAck,
      createdAt: a.createdAt,
      createdBy: a.createdBy,
      hasAcknowledged: a.acknowledgments.length > 0,
      acknowledgedAt: a.acknowledgments[0]?.acknowledgedAt || null,
    }));

    return NextResponse.json({ announcements: formatted });
  } catch (error: any) {
    console.error('announcements GET error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || !['ADMIN', 'MANAGER', 'ACCOUNTANT'].includes(user.role)) {
      return NextResponse.json({ error: 'Không có quyền tạo thông báo' }, { status: 403 });
    }

    await ensureDatabaseReady();

    const { title, content, category, isPinned, requireAck } = await req.json();

    if (!title || !content) {
      return NextResponse.json({ error: 'Vui lòng điền tiêu đề và nội dung thông báo' }, { status: 400 });
    }

    const announcement = await prisma.announcement.create({
      data: {
        title: title.trim(),
        content: content.trim(),
        category: category || 'GENERAL',
        isPinned: isPinned || false,
        requireAck: requireAck !== false,
        createdById: user.id,
      },
    });

    // Create Broadcast Notification for all users (targetRole: 'ALL' ensures every role sees it)
    try {
      await prisma.notification.create({
        data: {
          targetRole: 'ALL',
          title: `📢 ${title.trim()}`,
          content: content.substring(0, 150) + (content.length > 150 ? '...' : ''),
          type: 'ANNOUNCEMENT',
          link: '/chamcong', // Employee's main page where announcements appear
        },
      });
    } catch (notifErr) {
      console.warn('Broadcast notification create error:', notifErr);
    }

    return NextResponse.json({
      success: true,
      message: 'Đã phát thông báo thành công cho toàn thể nhân sự!',
      announcement,
    });
  } catch (error: any) {
    console.error('announcements POST error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
