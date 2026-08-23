import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET /api/projects/members?projectId=1 - Get project members
export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    if (!projectId) {
      return NextResponse.json({ error: 'Thiếu projectId' }, { status: 400 });
    }

    const members = await prisma.projectMember.findMany({
      where: { projectId: parseInt(projectId, 10) },
      include: {
        user: {
          select: {
            id: true,
            employeeCode: true,
            fullName: true,
            department: true,
            avatarUrl: true,
            email: true,
            phone: true,
            role: true,
          },
        },
      },
      orderBy: { joinedAt: 'asc' },
    });

    return NextResponse.json({ members });
  } catch (error: any) {
    console.error('Project Members GET error:', error);
    return NextResponse.json(
      { error: 'Lỗi tải thành viên dự án: ' + error.message },
      { status: 500 }
    );
  }
}

// POST /api/projects/members - Assign a user to a project
export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || !['ADMIN', 'MANAGER'].includes(user.role)) {
      return NextResponse.json({ error: 'Không có quyền thực hiện' }, { status: 403 });
    }

    const body = await request.json();
    const { projectId, userId, roleInProject } = body;

    if (!projectId || !userId) {
      return NextResponse.json(
        { error: 'Thiếu thông tin dự án hoặc nhân viên' },
        { status: 400 }
      );
    }

    const member = await prisma.projectMember.upsert({
      where: {
        projectId_userId: {
          projectId: parseInt(projectId, 10),
          userId: parseInt(userId, 10),
        },
      },
      update: {
        roleInProject: roleInProject || 'STAFF',
      },
      create: {
        projectId: parseInt(projectId, 10),
        userId: parseInt(userId, 10),
        roleInProject: roleInProject || 'STAFF',
      },
      include: {
        user: {
          select: {
            id: true,
            employeeCode: true,
            fullName: true,
          },
        },
        project: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
      },
    });

    // Notify employee about project assignment
    await prisma.notification.create({
      data: {
        userId: member.userId,
        title: `📁 Bạn đã được phân công vào Dự Án: ${member.project.name}`,
        content: `Bạn hiện có quyền truy cập dữ liệu và nộp báo cáo định kỳ cho dự án ${member.project.name} (${member.project.code}).`,
        type: 'PROJECT_REPORT',
        link: '/employee/projects',
      },
    });

    return NextResponse.json({
      success: true,
      message: `Đã phân công ${member.user.fullName} vào dự án ${member.project.name}`,
      member,
    });
  } catch (error: any) {
    console.error('Project Member POST error:', error);
    return NextResponse.json(
      { error: 'Lỗi phân công nhân sự: ' + error.message },
      { status: 500 }
    );
  }
}

// DELETE /api/projects/members - Remove user from project
export async function DELETE(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || !['ADMIN', 'MANAGER'].includes(user.role)) {
      return NextResponse.json({ error: 'Không có quyền thực hiện' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const userId = searchParams.get('userId');

    if (!projectId || !userId) {
      return NextResponse.json(
        { error: 'Thiếu projectId hoặc userId' },
        { status: 400 }
      );
    }

    await prisma.projectMember.delete({
      where: {
        projectId_userId: {
          projectId: parseInt(projectId, 10),
          userId: parseInt(userId, 10),
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Đã xóa nhân viên khỏi dự án thành công',
    });
  } catch (error: any) {
    console.error('Project Member DELETE error:', error);
    return NextResponse.json(
      { error: 'Lỗi xóa thành viên: ' + error.message },
      { status: 500 }
    );
  }
}
