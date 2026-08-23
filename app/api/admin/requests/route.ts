import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { getLeaveTypeLabel } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role === 'EMPLOYEE') {
      return NextResponse.json({ error: 'Không có quyền truy cập' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');

    const where: any = {};
    if (status && status !== 'ALL') {
      where.status = status;
    }

    const requests = await prisma.leaveRequest.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            employeeCode: true,
            fullName: true,
            department: true,
          },
        },
        approvedBy: {
          select: {
            id: true,
            fullName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ requests });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role === 'EMPLOYEE') {
      return NextResponse.json({ error: 'Không có quyền duyệt đơn' }, { status: 403 });
    }

    const { id, status, reviewNotes } = await req.json();

    if (!id || !['APPROVED', 'REJECTED'].includes(status)) {
      return NextResponse.json(
        { error: 'ID đơn hoặc trạng thái duyệt không hợp lệ' },
        { status: 400 }
      );
    }

    const updated = await prisma.leaveRequest.update({
      where: { id: Number(id) },
      data: {
        status,
        reviewNotes: reviewNotes || null,
        approvedById: user.id,
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            employeeCode: true,
          },
        },
      },
    });

    // Create Notification targeted directly to the Employee
    try {
      const typeLabel = getLeaveTypeLabel(updated.leaveType);
      const isApproved = status === 'APPROVED';
      await prisma.notification.create({
        data: {
          userId: updated.userId,
          title: isApproved ? `✓ Đơn xin nghỉ đã được DUYỆT` : `✕ Đơn xin nghỉ ĐÃ BỊ TỪ CHỐI`,
          content: `${typeLabel} của bạn đã được ${isApproved ? 'phê duyệt' : 'từ chối'} bởi ${user.fullName}. ${reviewNotes ? `Ý kiến / Lý do: "${reviewNotes}"` : ''}`,
          type: isApproved ? 'LEAVE_APPROVED' : 'LEAVE_REJECTED',
          link: '/employee/requests',
        },
      });
    } catch (notifErr) {
      console.warn('Notification creation error:', notifErr);
    }

    return NextResponse.json({
      success: true,
      message: status === 'APPROVED' ? 'Đã duyệt đơn thành công!' : 'Đã từ chối đơn!',
      request: updated,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
