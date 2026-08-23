import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET /api/projects/reports - Query reports
export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const month = searchParams.get('month');
    const year = searchParams.get('year');
    const status = searchParams.get('status');
    const myReportsOnly = searchParams.get('myReportsOnly') === 'true';

    const isAdmin = ['ADMIN', 'MANAGER', 'ACCOUNTANT'].includes(user.role);

    const where: any = {};

    if (projectId) {
      where.projectId = parseInt(projectId, 10);
    }

    if (month) {
      where.month = parseInt(month, 10);
    }

    if (year) {
      where.year = parseInt(year, 10);
    }

    if (status) {
      where.status = status;
    }

    if (myReportsOnly || !isAdmin) {
      where.userId = user.id;
    }

    const reports = await prisma.projectReport.findMany({
      where,
      include: {
        project: {
          select: {
            id: true,
            code: true,
            name: true,
            nasPath: true,
          },
        },
        user: {
          select: {
            id: true,
            employeeCode: true,
            fullName: true,
            department: true,
            avatarUrl: true,
          },
        },
        approvedBy: {
          select: {
            id: true,
            fullName: true,
          },
        },
        photos: {
          select: {
            id: true,
            photoUrl: true,
            caption: true,
            createdAt: true,
          },
        },
      },
      orderBy: [
        { year: 'desc' },
        { month: 'desc' },
        { createdAt: 'desc' },
      ],
    });

    return NextResponse.json({ reports });
  } catch (error: any) {
    console.error('Project Reports GET error:', error);
    return NextResponse.json(
      { error: 'Lỗi tải danh sách báo cáo: ' + error.message },
      { status: 500 }
    );
  }
}

// POST /api/projects/reports - Submit a new monthly report
export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });
    }

    const body = await request.json();
    const {
      projectId,
      month,
      year,
      title,
      summary,
      wordDocUrl,
      wordDocName,
      wordDocSize,
      photos,
    } = body;

    if (!projectId || !month || !year || !title) {
      return NextResponse.json(
        { error: 'Vui lòng điền đầy đủ Dự án, Tháng, Năm và Tiêu đề báo cáo' },
        { status: 400 }
      );
    }

    const pId = parseInt(projectId, 10);
    const m = parseInt(month, 10);
    const y = parseInt(year, 10);

    // Verify user is assigned to project or is admin
    const isMember = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId: pId,
          userId: user.id,
        },
      },
    });

    const isAdmin = ['ADMIN', 'MANAGER'].includes(user.role);

    if (!isMember && !isAdmin) {
      return NextResponse.json(
        { error: 'Bạn không thuộc danh sách nhân sự của dự án này' },
        { status: 403 }
      );
    }

    const project = await prisma.project.findUnique({
      where: { id: pId },
    });

    if (!project) {
      return NextResponse.json({ error: 'Không tìm thấy dự án' }, { status: 404 });
    }

    // Create Report
    const report = await prisma.projectReport.create({
      data: {
        projectId: pId,
        userId: user.id,
        month: m,
        year: y,
        title: title.trim(),
        summary: summary?.trim() || null,
        wordDocUrl: wordDocUrl || null,
        wordDocName: wordDocName || null,
        wordDocSize: wordDocSize || null,
        status: 'SUBMITTED',
        photos: {
          create: Array.isArray(photos)
            ? photos.map((p: any) => ({
                photoUrl: p.photoUrl,
                caption: p.caption?.trim() || null,
              }))
            : [],
        },
      },
      include: {
        project: true,
        photos: true,
      },
    });

    // Notify Admin / General Coordinators
    const photoCount = Array.isArray(photos) ? photos.length : 0;
    await prisma.notification.create({
      data: {
        targetRole: 'ADMIN',
        title: `📄 Báo cáo mới: ${user.fullName} (${project.code})`,
        content: `${user.fullName} vừa nộp Báo cáo Tháng ${m}/${y} cho dự án ${project.name}${
          wordDocName ? ` (Kèm file Word: ${wordDocName})` : ''
        }${photoCount > 0 ? ` + ${photoCount} ảnh thực địa` : ''}.`,
        type: 'PROJECT_REPORT',
        link: `/admin/projects?tab=reports&reportId=${report.id}`,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Đã nộp Báo cáo Tháng ${m}/${y} Dự án ${project.name} thành công!`,
      report,
    });
  } catch (error: any) {
    console.error('Project Report POST error:', error);
    return NextResponse.json(
      { error: 'Lỗi nộp báo cáo: ' + error.message },
      { status: 500 }
    );
  }
}
