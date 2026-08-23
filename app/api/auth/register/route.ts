import { NextResponse } from 'next/server';
import prisma, { ensureDatabaseReady } from '@/lib/prisma';
import { hashPassword, setSessionCookie, UserSession } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    await ensureDatabaseReady();

    const body = await req.json();
    const {
      employeeCode,
      fullName,
      password,
      department,
      contractType,
      phone,
      email,
    } = body;

    if (!employeeCode || !fullName || !password) {
      return NextResponse.json(
        { error: 'Vui lòng điền đầy đủ Mã nhân viên, Họ tên và Mật khẩu' },
        { status: 400 }
      );
    }

    const codeClean = employeeCode.trim().toUpperCase();

    if (codeClean.length < 3) {
      return NextResponse.json(
        { error: 'Mã nhân viên tối thiểu 3 ký tự (VD: NV005, CC01)' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Mật khẩu tối thiểu 6 ký tự' },
        { status: 400 }
      );
    }

    // Check existing
    const existing = await prisma.user.findUnique({
      where: { employeeCode: codeClean },
    });

    if (existing) {
      return NextResponse.json(
        { error: `Mã nhân viên "${codeClean}" đã tồn tại trên hệ thống. Vui lòng chọn mã khác hoặc liên hệ Ban Quản Trị.` },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);
    const validContract = ['FULL_TIME', 'PART_TIME', 'CONTRACT'].includes(contractType)
      ? contractType
      : 'FULL_TIME';

    const annualBase = validContract === 'FULL_TIME' ? 12.0 : validContract === 'PART_TIME' ? 6.0 : 0.0;

    const newUser = await prisma.user.create({
      data: {
        employeeCode: codeClean,
        fullName: fullName.trim(),
        passwordHash,
        phone: phone ? phone.trim() : null,
        email: email ? email.trim().toLowerCase() : null,
        department: department || 'Ban Y Tế Bác Ái',
        role: 'EMPLOYEE',
        contractType: validContract,
        annualLeaveBase: annualBase,
        isActive: true,
      },
    });

    const sessionData: UserSession = {
      id: newUser.id,
      employeeCode: newUser.employeeCode,
      fullName: newUser.fullName,
      role: newUser.role as any,
      department: newUser.department,
      email: newUser.email,
      phone: newUser.phone,
    };

    await setSessionCookie(sessionData);

    return NextResponse.json({
      success: true,
      message: 'Đăng ký tài khoản thành công!',
      user: sessionData,
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Lỗi máy chủ khi đăng ký: ' + error.message },
      { status: 500 }
    );
  }
}
