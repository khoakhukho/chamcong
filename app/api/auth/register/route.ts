import { NextResponse } from 'next/server';
import prisma, { ensureDatabaseReady } from '@/lib/prisma';
import { hashPassword, setSessionCookie, UserSession } from '@/lib/auth';
import { verifyOtpCode } from '@/lib/mailer';

export const dynamic = 'force-dynamic';

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
      otp,
      avatarUrl,
    } = body;

    if (!employeeCode || !fullName || !password || !email) {
      return NextResponse.json(
        { error: 'Vui lòng điền đầy đủ Tên đăng nhập, Họ tên, Email và Mật khẩu' },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const codeClean = employeeCode.trim().toLowerCase(); // e.g. vnxkhoa

    if (codeClean.length < 3) {
      return NextResponse.json(
        { error: 'Tên đăng nhập / Mã nhân sự tối thiểu 3 ký tự (VD: vnxkhoa, annguyen)' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Mật khẩu tối thiểu 6 ký tự' },
        { status: 400 }
      );
    }

    // Verify OTP
    if (!otp) {
      return NextResponse.json(
        { error: 'Vui lòng nhập mã OTP 6 số đã được gửi qua email để xác thực' },
        { status: 400 }
      );
    }

    const isOtpValid = await verifyOtpCode(cleanEmail, otp);
    if (!isOtpValid) {
      return NextResponse.json(
        { error: 'Mã xác thực OTP không chính xác hoặc đã hết hạn (5 phút). Vui lòng thử lại.' },
        { status: 400 }
      );
    }

    // Check unique employee code / username
    const existingCode = await prisma.user.findFirst({
      where: { employeeCode: { equals: codeClean } },
    });

    if (existingCode) {
      return NextResponse.json(
        { error: `Tên đăng nhập "${codeClean}" đã tồn tại. Vui lòng chọn tên khác.` },
        { status: 409 }
      );
    }

    // Check unique email
    const existingEmail = await prisma.user.findFirst({
      where: { email: cleanEmail },
    });

    if (existingEmail) {
      return NextResponse.json(
        { error: `Email "${cleanEmail}" đã được đăng ký tài khoản khác.` },
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
        email: cleanEmail,
        department: department || 'Ban Y Tế Bác Ái',
        role: 'EMPLOYEE',
        contractType: validContract,
        annualLeaveBase: annualBase,
        avatarUrl: avatarUrl || null,
        isActive: true,
      },
    });

    const sessionData: UserSession = {
      id: newUser.id,
      employeeCode: newUser.employeeCode,
      fullName: newUser.fullName,
      role: newUser.role as any,
      department: newUser.department,
      contractType: newUser.contractType,
      avatarUrl: newUser.avatarUrl,
      email: newUser.email,
      phone: newUser.phone,
    };

    await setSessionCookie(sessionData);

    return NextResponse.json({
      success: true,
      message: 'Đăng ký tài khoản và xác thực email thành công!',
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
