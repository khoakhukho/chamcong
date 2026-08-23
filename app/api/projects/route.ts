import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET /api/projects - Get accessible projects
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });
    }

    const isAdmin = ['ADMIN', 'MANAGER', 'ACCOUNTANT'].includes(user.role);

    let projects;
    if (isAdmin) {
      // Admin sees all active projects
      projects = await prisma.project.findMany({
        where: { isActive: true },
        include: {
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  employeeCode: true,
                  fullName: true,
                  department: true,
                  avatarUrl: true,
                },
              },
            },
          },
          _count: {
            select: {
              reports: true,
              files: true,
              members: true,
            },
          },
        },
        orderBy: { code: 'asc' },
      });
    } else {
      // Employee only sees projects they belong to
      projects = await prisma.project.findMany({
        where: {
          isActive: true,
          members: {
            some: {
              userId: user.id,
            },
          },
        },
        include: {
          members: {
            where: { userId: user.id },
            select: {
              roleInProject: true,
              joinedAt: true,
            },
          },
          _count: {
            select: {
              reports: true,
              files: true,
            },
          },
        },
        orderBy: { code: 'asc' },
      });
    }

    return NextResponse.json({ projects, isAdmin });
  } catch (error: any) {
    console.error('Projects GET error:', error);
    return NextResponse.json(
      { error: 'Lỗi tải danh sách dự án: ' + error.message },
      { status: 500 }
    );
  }
}

// POST /api/projects - Admin creates/updates a project
export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Không có quyền thực hiện' }, { status: 403 });
    }

    const body = await request.json();
    const { code, name, description, nasPath } = body;

    if (!code || !name) {
      return NextResponse.json(
        { error: 'Vui lòng nhập mã dự án và tên dự án' },
        { status: 400 }
      );
    }

    const project = await prisma.project.upsert({
      where: { code: code.trim().toUpperCase() },
      update: {
        name: name.trim(),
        description: description?.trim() || null,
        nasPath: nasPath?.trim() || `/volume1/CaritasData/DU_AN_${code.trim().toUpperCase()}/`,
      },
      create: {
        code: code.trim().toUpperCase(),
        name: name.trim(),
        description: description?.trim() || null,
        nasPath: nasPath?.trim() || `/volume1/CaritasData/DU_AN_${code.trim().toUpperCase()}/`,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Lưu thông tin dự án thành công',
      project,
    });
  } catch (error: any) {
    console.error('Project POST error:', error);
    return NextResponse.json(
      { error: 'Lỗi lưu dự án: ' + error.message },
      { status: 500 }
    );
  }
}
