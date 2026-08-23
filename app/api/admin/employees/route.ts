import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser, hashPassword } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || user.role === 'EMPLOYEE') {
      return NextResponse.json({ error: 'Không có quyền truy cập' }, { status: 403 });
    }

    const employees = await prisma.user.findMany({
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
        telegramId: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: [{ department: 'asc' }, { id: 'asc' }],
    });

    return NextResponse.json({ employees });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
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
    const existing = await prisma.user.findUnique({
      where: { employeeCode: codeClean },
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

    const newEmployee = await prisma.user.create({
      data: {
        employeeCode: codeClean,
        fullName: fullName.trim(),
        passwordHash,
        phone: phone || null,
        email: email || null,
        department: department || 'Ban Y Tế Bác Ái',
        role: role || 'EMPLOYEE',
        contractType: validContract,
        annualLeaveBase: defaultLeaveBase,
        isActive: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Tạo tài khoản nhân viên thành công!',
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
      role,
      contractType,
      annualLeaveBase,
      isActive,
    } = await req.json();

    if (!id) {
      return NextResponse.json({ error: 'Thiếu ID nhân viên' }, { status: 400 });
    }

    const updateData: any = {
      fullName: fullName?.trim(),
      phone: phone || null,
      email: email || null,
      department: department || null,
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

    return NextResponse.json({
      success: true,
      message: 'Cập nhật thông tin nhân viên thành công!',
      employee: updated,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
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
