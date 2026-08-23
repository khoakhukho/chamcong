import { NextResponse } from 'next/server';
import prisma, { ensureDatabaseReady } from '@/lib/prisma';
import { getCurrentUser, hashPassword } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await ensureDatabaseReady();
    const user = await getCurrentUser();
    if (!user || user.role === 'EMPLOYEE') {
      return NextResponse.json({ error: 'Không có quyền truy cập' }, { status: 403 });
    }

    const [employees, projects] = await Promise.all([
      prisma.user.findMany({
        select: {
          id: true,
          employeeCode: true,
          fullName: true,
          phone: true,
          email: true,
          department: true,
          role: true,
          contractType: true,
          annualLeaveBase: true,
          joinDate: true,
          avatarUrl: true,
          telegramId: true,
          isActive: true,
          createdAt: true,
          projectMemberships: {
            select: {
              id: true,
              projectId: true,
              roleInProject: true,
              project: {
                select: {
                  id: true,
                  code: true,
                  name: true,
                },
              },
            },
          },
        },
        orderBy: [{ id: 'asc' }],
      }),
      prisma.project.findMany({
        where: { isActive: true },
        select: {
          id: true,
          code: true,
          name: true,
          description: true,
        },
        orderBy: { id: 'asc' },
      }),
    ]);

    return NextResponse.json({ employees, projects });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await ensureDatabaseReady();
    const user = await getCurrentUser();
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Chỉ Admin mới có quyền tạo nhân viên' }, { status: 403 });
    }

    const {
      employeeCode,
      fullName,
      password,
      phone,
      email,
      department,
      projectIds,
      role,
      contractType,
      annualLeaveBase,
    } = await req.json();

    if (!employeeCode || !fullName || !password) {
      return NextResponse.json(
        { error: 'Vui lòng nhập Mã nhân viên, Họ tên và Mật khẩu khởi tạo' },
        { status: 400 }
      );
    }

    const codeClean = employeeCode.trim().toUpperCase();

    // Check unique code
    const existing = await prisma.user.findFirst({
      where: {
        OR: [
          { employeeCode: codeClean },
          { employeeCode: codeClean.toLowerCase() },
          { employeeCode: codeClean.toUpperCase() },
        ],
      },
    });
    if (existing) {
      return NextResponse.json({ error: 'Mã nhân viên đã tồn tại trong hệ thống' }, { status: 400 });
    }

    const passwordHash = await hashPassword(password);
    const validContract = ['FULL_TIME', 'PART_TIME', 'CONTRACT'].includes(contractType)
      ? contractType
      : 'FULL_TIME';

    const defaultLeaveBase =
      annualLeaveBase !== undefined
        ? parseFloat(annualLeaveBase)
        : validContract === 'FULL_TIME'
        ? 12.0
        : validContract === 'PART_TIME'
        ? 6.0
        : 0.0;

    // Get selected projects to format department label if needed
    let finalDepartment = department;
    const selectedIds: number[] = Array.isArray(projectIds)
      ? projectIds.map((id: any) => Number(id)).filter((id: number) => !isNaN(id))
      : [];

    if (selectedIds.length > 0) {
      const selectedProjects = await prisma.project.findMany({
        where: { id: { in: selectedIds } },
        select: { code: true, name: true },
      });
      if (selectedProjects.length > 0) {
        finalDepartment = selectedProjects.map((p) => p.name).join(', ');
      }
    }

    const newEmployee = await prisma.user.create({
      data: {
        employeeCode: codeClean,
        fullName: fullName.trim(),
        passwordHash,
        phone: phone || null,
        email: email || null,
        department: finalDepartment || 'Văn Phòng Caritas',
        role: role || 'EMPLOYEE',
        contractType: validContract,
        annualLeaveBase: defaultLeaveBase,
        isActive: true,
      },
    });

    // Create Project Memberships
    if (selectedIds.length > 0) {
      await prisma.projectMember.createMany({
        data: selectedIds.map((pId) => ({
          projectId: pId,
          userId: newEmployee.id,
          roleInProject: role === 'MANAGER' || role === 'ADMIN' ? 'COORDINATOR' : 'STAFF',
        })),
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Tạo tài khoản nhân viên và phân quyền dự án thành công!',
      employee: {
        id: newEmployee.id,
        employeeCode: newEmployee.employeeCode,
        fullName: newEmployee.fullName,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    await ensureDatabaseReady();
    const user = await getCurrentUser();
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Chỉ Admin mới có quyền chỉnh sửa' }, { status: 403 });
    }

    const {
      id,
      fullName,
      password,
      phone,
      email,
      department,
      projectIds,
      role,
      contractType,
      annualLeaveBase,
      isActive,
    } = await req.json();

    if (!id) {
      return NextResponse.json({ error: 'Thiếu ID nhân viên' }, { status: 400 });
    }

    const selectedIds: number[] = Array.isArray(projectIds)
      ? projectIds.map((pid: any) => Number(pid)).filter((pid: number) => !isNaN(pid))
      : [];

    let finalDepartment = department;
    if (selectedIds.length > 0) {
      const selectedProjects = await prisma.project.findMany({
        where: { id: { in: selectedIds } },
        select: { code: true, name: true },
      });
      if (selectedProjects.length > 0) {
        finalDepartment = selectedProjects.map((p) => p.name).join(', ');
      }
    }

    const updateData: any = {
      fullName: fullName?.trim(),
      phone: phone || null,
      email: email || null,
      department: finalDepartment || null,
      role: role || 'EMPLOYEE',
      contractType: contractType || 'FULL_TIME',
      isActive: isActive !== undefined ? isActive : true,
    };

    if (annualLeaveBase !== undefined) {
      updateData.annualLeaveBase = parseFloat(annualLeaveBase);
    }

    if (password && password.trim().length > 0) {
      updateData.passwordHash = await hashPassword(password);
    }

    const updated = await prisma.user.update({
      where: { id: Number(id) },
      data: updateData,
    });

    // Synchronize Project Memberships
    if (projectIds !== undefined) {
      await prisma.projectMember.deleteMany({
        where: { userId: Number(id) },
      });

      if (selectedIds.length > 0) {
        await prisma.projectMember.createMany({
          data: selectedIds.map((pId) => ({
            projectId: pId,
            userId: Number(id),
            roleInProject: role === 'MANAGER' || role === 'ADMIN' ? 'COORDINATOR' : 'STAFF',
          })),
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Cập nhật thông tin nhân viên và phân quyền dự án thành công!',
      employee: updated,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    await ensureDatabaseReady();
    const user = await getCurrentUser();
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Chỉ Admin mới có quyền xóa tài khoản' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = parseInt(searchParams.get('id') || '0', 10);

    if (!id) {
      return NextResponse.json({ error: 'Thiếu ID nhân viên' }, { status: 400 });
    }

    if (id === user.id) {
      return NextResponse.json({ error: 'Không thể tự xóa tài khoản của chính mình' }, { status: 400 });
    }

    await prisma.user.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Đã xóa tài khoản nhân viên thành công',
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
