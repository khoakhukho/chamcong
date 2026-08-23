import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// PUT /api/admin/projects/reports/review - Approve or request revision on a report
export async function PUT(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || !['ADMIN', 'MANAGER'].includes(user.role)) {
      return NextResponse.json({ error: 'Không có quyền thực hiện' }, { status: 403 });
    }

    const body = await request.json();
    const { reportId, status, reviewNotes } = body;

    if (!reportId || !['APPROVED', 'REVISION_REQUESTED'].includes(status)) {
      return NextResponse.json(
        { error: 'Thiếu mã báo cáo hoặc trạng thái phê duyệt không hợp lệ' },
        { status: 400 }
      );
    }

    const existingReport = await prisma.projectReport.findUnique({
      where: { id: parseInt(reportId, 10) },
      include: {
        project: true,
        user: true,
      },
    });

    if (!existingReport) {
      return NextResponse.json({ error: 'Không tìm thấy báo cáo' }, { status: 404 });
    }

    const updatedReport = await prisma.projectReport.update({
      where: { id: parseInt(reportId, 10) },
      data: {
        status,
        approvedById: user.id,
        reviewNotes: reviewNotes?.trim() || null,
        updatedAt: new Date(),
      },
      include: {
        project: true,
        user: true,
        approvedBy: {
          select: {
            id: true,
            fullName: true,
          },
        },
      },
    });

    // Notify Submitting Employee
    const isApproved = status === 'APPROVED';
    await prisma.notification.create({
      data: {
        userId: existingReport.userId,
        title: isApproved
          ? `✓ Báo cáo Tháng ${existingReport.month}/${existingReport.year} đã được DUYỆT`
          : `⚠️ Yêu cầu BỔ SUNG Báo cáo Tháng ${existingReport.month}/${existingReport.year}`,
        content: `Báo cáo Dự án ${existingReport.project.name} của bạn đã được ${
          isApproved ? 'phê duyệt bởi' : 'yêu cầu bổ sung bởi'
        } ${user.fullName}.${
          reviewNotes ? ` Ý kiến đánh giá: "${reviewNotes}"` : ''
        }`,
        type: 'PROJECT_REPORT',
        link: '/employee/projects',
      },
    });

    return NextResponse.json({
      success: true,
      message: isApproved
        ? 'Đã phê duyệt báo cáo thành công'
        : 'Đã gửi yêu cầu bổ sung báo cáo đến nhân viên',
      report: updatedReport,
    });
  } catch (error: any) {
    console.error('Report Review PUT error:', error);
    return NextResponse.json(
      { error: 'Lỗi đánh giá báo cáo: ' + error.message },
      { status: 500 }
    );
  }
}
