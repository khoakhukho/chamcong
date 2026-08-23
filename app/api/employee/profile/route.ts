import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser, setSessionCookie } from '@/lib/auth';
import { processAndSaveAttendanceImage } from '@/lib/image-processor';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        employeeCode: true,
        fullName: true,
        phone: true,
        email: true,
        department: true,
        role: true,
        contractType: true,
        avatarUrl: true,
        annualLeaveBase: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ user: dbUser });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });
    }

    const { fullName, phone, avatarImageData } = await req.json();

    let newAvatarUrl = user.avatarUrl;

    if (avatarImageData && typeof avatarImageData === 'string' && avatarImageData.startsWith('data:image')) {
      const processed = await processAndSaveAttendanceImage(avatarImageData, user.id);
      newAvatarUrl = processed.urlPath;
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        fullName: fullName ? fullName.trim() : user.fullName,
        phone: phone ? phone.trim() : user.phone,
        avatarUrl: newAvatarUrl,
      },
    });

    // Update cookie session
    await setSessionCookie({
      ...user,
      fullName: updated.fullName,
      phone: updated.phone,
      avatarUrl: updated.avatarUrl,
    });

    return NextResponse.json({
      success: true,
      message: 'Cập nhật ảnh đại diện và hồ sơ thành công!',
      user: {
        id: updated.id,
        employeeCode: updated.employeeCode,
        fullName: updated.fullName,
        avatarUrl: updated.avatarUrl,
        phone: updated.phone,
      },
    });
  } catch (error: any) {
    console.error('profile update error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
