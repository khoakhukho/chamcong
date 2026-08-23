import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { getLeaveTypeLabel, formatDateVN } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });
    }

    const requests = await prisma.leaveRequest.findMany({
      where: { userId: user.id },
      include: {
        approvedBy: {
          select: { fullName: true, employeeCode: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ requests });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });
    }

    const { leaveType, fromDate, toDate, reason, daysCount } = await req.json();

    if (!leaveType || !fromDate || !toDate || !reason) {
      return NextResponse.json(
        { error: 'Vui lòng điền đầy đủ loại đơn, ngày bắt đầu, ngày kết thúc và lý do' },
        { status: 400 }
      );
    }

    const from = new Date(fromDate);
    const to = new Date(toDate);

    if (to < from) {
      return NextResponse.json(
        { error: 'Ngày kết thúc không được nhỏ hơn ngày bắt đầu' },
        { status: 400 }
      );
    }

    const count = daysCount ? parseFloat(daysCount) : 1;

    const request = await prisma.leaveRequest.create({
      data: {
        userId: user.id,
        leaveType,
        fromDate: from,
        toDate: to,
        daysCount: count,
        reason,
        status: 'PENDING',
      },
    });

    // Create Notifications for Admin AND Manager (HR) roles
    try {
      const typeLabel = getLeaveTypeLabel(leaveType);
      const notifTitle = `📋 Đơn xin nghỉ mới: ${user.fullName} (${user.employeeCode})`;
      const notifContent = `${user.fullName} vừa nộp ${typeLabel} (${count} ngày, từ ${formatDateVN(from)} đến ${formatDateVN(to)}). Lý do: "${reason}"`;

      // Notify ADMIN role
      await prisma.notification.create({
        data: {
          targetRole: 'ADMIN',
          title: notifTitle,
          content: notifContent,
          type: 'LEAVE_REQUEST',
          link: '/admin/requests',
        },
      });

      // Also notify MANAGER role (HR/coordinator can review)
      await prisma.notification.create({
        data: {
          targetRole: 'MANAGER',
          title: notifTitle,
          content: notifContent,
          type: 'LEAVE_REQUEST',
          link: '/admin/requests',
        },
      });
    } catch (notifErr) {
      console.warn('Notification creation error:', notifErr);
    }

    return NextResponse.json({
      success: true,
      message: 'Gửi đơn thành công! Vui lòng chờ Ban Quản Trị / HR xét duyệt.',
      request,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
