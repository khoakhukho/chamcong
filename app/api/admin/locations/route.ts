import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || user.role === 'EMPLOYEE') {
      return NextResponse.json({ error: 'Không có quyền truy cập' }, { status: 403 });
    }

    const locations = await prisma.location.findMany({
      orderBy: { id: 'asc' },
    });

    return NextResponse.json({ locations });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Chỉ Admin mới có quyền tạo địa điểm' }, { status: 403 });
    }

    const { name, address, latitude, longitude, radiusMeters } = await req.json();

    if (!name || latitude == null || longitude == null) {
      return NextResponse.json(
        { error: 'Vui lòng nhập Tên địa điểm, Vĩ độ (Latitude) và Kinh độ (Longitude)' },
        { status: 400 }
      );
    }

    const loc = await prisma.location.create({
      data: {
        name,
        address: address || null,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        radiusMeters: Number(radiusMeters) || 100,
        isActive: true,
      },
    });

    return NextResponse.json({ success: true, location: loc });
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

    const { id, name, address, latitude, longitude, radiusMeters, isActive } = await req.json();

    const updated = await prisma.location.update({
      where: { id: Number(id) },
      data: {
        name,
        address: address || null,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        radiusMeters: Number(radiusMeters),
        isActive: isActive !== undefined ? isActive : true,
      },
    });

    return NextResponse.json({ success: true, location: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Chỉ Admin mới có quyền xóa' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Thiếu ID địa điểm' }, { status: 400 });

    await prisma.location.delete({
      where: { id: Number(id) },
    });

    return NextResponse.json({ success: true, message: 'Đã xóa địa điểm' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
