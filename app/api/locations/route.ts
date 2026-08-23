import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const locations = await prisma.location.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        address: true,
        latitude: true,
        longitude: true,
        radiusMeters: true,
      },
    });

    return NextResponse.json({ locations });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Lỗi lấy danh sách địa điểm: ' + error.message },
      { status: 500 }
    );
  }
}
