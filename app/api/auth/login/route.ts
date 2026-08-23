import { NextResponse } from 'next/server';
import prisma, { ensureDatabaseReady } from '@/lib/prisma';
import { comparePassword, setSessionCookie } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const { employeeCode, password } = await req.json();

    if (!employeeCode || !password) {
      return NextResponse.json(
        { error: 'Vui lòng nhập đầy đủ Mã nhân viên và Mật khẩu' },
        { status: 400 }
      );
    }

    const codeRaw = employeeCode.trim();
    const codeUpper = codeRaw.toUpperCase();
    const codeLower = codeRaw.toLowerCase();

    await ensureDatabaseReady();

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { employeeCode: codeRaw },
          { employeeCode: codeUpper },
          { employeeCode: codeLower },
        ],
      },
    });

    if (!user || !user.isActive) {
      return NextResponse.json(
        { error: 'Mã nhân viên không tồn tại hoặc tài khoản đã bị khóa' },
        { status: 401 }
      );
    }

    const isMatch = await comparePassword(password, user.passwordHash);
    if (!isMatch) {
      return NextResponse.json(
        { error: 'Mật khẩu không chính xác' },
        { status: 401 }
      );
    }

    const sessionData = {
      id: user.id,
      employeeCode: user.employeeCode,
      fullName: user.fullName,
      role: user.role as 'ADMIN' | 'MANAGER' | 'EMPLOYEE',
      department: user.department,
      email: user.email,
      phone: user.phone,
    };

    await setSessionCookie(sessionData);

    return NextResponse.json({
      success: true,
      user: sessionData,
    });
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Lỗi máy chủ khi đăng nhập: ' + error.message },
      { status: 500 }
    );
  }
}
