import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET /api/projects/files - List files for a project
export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const year = searchParams.get('year');
    const month = searchParams.get('month');
    const fileType = searchParams.get('fileType');

    if (!projectId) {
      return NextResponse.json({ error: 'Thiếu projectId' }, { status: 400 });
    }

    const pId = parseInt(projectId, 10);
    const isAdmin = ['ADMIN', 'MANAGER', 'ACCOUNTANT'].includes(user.role);

    // Verify access
    if (!isAdmin) {
      const isMember = await prisma.projectMember.findUnique({
        where: {
          projectId_userId: {
            projectId: pId,
            userId: user.id,
          },
        },
      });
      if (!isMember) {
        return NextResponse.json({ error: 'Không có quyền truy cập dự án này' }, { status: 403 });
      }
    }

    const where: any = { projectId: pId };
    if (year) where.year = parseInt(year, 10);
    if (month) where.month = parseInt(month, 10);
    if (fileType) where.fileType = fileType;

    const files = await prisma.projectFile.findMany({
      where,
      include: {
        uploadedBy: {
          select: {
            id: true,
            employeeCode: true,
            fullName: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ files });
  } catch (error: any) {
    console.error('Project Files GET error:', error);
    return NextResponse.json(
      { error: 'Lỗi tải danh sách tệp tin: ' + error.message },
      { status: 500 }
    );
  }
}

// POST /api/projects/files - Upload new file to project library
export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });
    }

    const body = await request.json();
    const { projectId, fileName, fileUrl, fileType, fileSize, month, year, category } = body;

    if (!projectId || !fileName || !fileUrl) {
      return NextResponse.json(
        { error: 'Thiếu thông tin tệp tin hoặc dự án' },
        { status: 400 }
      );
    }

    const pId = parseInt(projectId, 10);
    const isAdmin = ['ADMIN', 'MANAGER'].includes(user.role);

    // Check membership
    if (!isAdmin) {
      const isMember = await prisma.projectMember.findUnique({
        where: {
          projectId_userId: {
            projectId: pId,
            userId: user.id,
          },
        },
      });
      if (!isMember) {
        return NextResponse.json({ error: 'Không có quyền tải lên dự án này' }, { status: 403 });
      }
    }

    const file = await prisma.projectFile.create({
      data: {
        projectId: pId,
        uploadedById: user.id,
        fileName: fileName.trim(),
        fileUrl,
        fileType: fileType || 'DOCUMENT',
        fileSize: fileSize || 0,
        month: month ? parseInt(month, 10) : null,
        year: year ? parseInt(year, 10) : null,
        category: category || 'GENERAL',
      },
      include: {
        uploadedBy: {
          select: {
            id: true,
            fullName: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Tải tệp tin lên dự án thành công',
      file,
    });
  } catch (error: any) {
    console.error('Project File POST error:', error);
    return NextResponse.json(
      { error: 'Lỗi tải tệp tin: ' + error.message },
      { status: 500 }
    );
  }
}

// DELETE /api/projects/files - Only Admin can delete files (Anti-Deletion rule for staff)
export async function DELETE(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Nhân viên không có quyền xóa dữ liệu. Vui lòng liên hệ Quản Trị Viên.' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const fileId = searchParams.get('fileId');

    if (!fileId) {
      return NextResponse.json({ error: 'Thiếu fileId' }, { status: 400 });
    }

    await prisma.projectFile.delete({
      where: { id: parseInt(fileId, 10) },
    });

    return NextResponse.json({
      success: true,
      message: 'Đã xóa tệp tin thành công',
    });
  } catch (error: any) {
    console.error('Project File DELETE error:', error);
    return NextResponse.json(
      { error: 'Lỗi xóa tệp: ' + error.message },
      { status: 500 }
    );
  }
}
