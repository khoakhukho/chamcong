import { NextResponse } from 'next/server';
import prisma, { ensureDatabaseReady } from '@/lib/prisma';
import { createAndSendOtp } from '@/lib/mailer';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    await ensureDatabaseReady();

    const { email, employeeCode } = await req.json();

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Vui lòng nhập địa chỉ email hợp lệ' }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Check if email already registered
    const existingEmail = await prisma.user.findFirst({
      where: { email: cleanEmail },
    });

    if (existingEmail) {
      return NextResponse.json(
        { error: `Địa chỉ email "${cleanEmail}" đã được liên kết với một tài khoản khác.` },
        { status: 409 }
      );
    }

    if (employeeCode) {
      const codeClean = employeeCode.trim().toLowerCase();
      const existingCode = await prisma.user.findFirst({
        where: { employeeCode: { equals: codeClean } },
      });
      if (existingCode) {
        return NextResponse.json(
          { error: `Tên đăng nhập "${codeClean}" đã có người sử dụng. Vui lòng chọn tên khác.` },
          { status: 409 }
        );
      }
    }

    const result = await createAndSendOtp(cleanEmail);

    return NextResponse.json({
      success: true,
      message: result.message,
      // In development / demo if SMTP is not configured, provide preview code for instant test
      previewOtp: !process.env.SMTP_HOST ? result.code : undefined,
    });
  } catch (error: any) {
    console.error('send-otp error:', error);
    return NextResponse.json({ error: 'Lỗi gửi mã OTP: ' + error.message }, { status: 500 });
  }
}
