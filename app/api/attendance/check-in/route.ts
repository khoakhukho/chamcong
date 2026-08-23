import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { checkGeofence, getAddressFromCoordinates } from '@/lib/geofencing';
import { processAndSaveAttendanceImage } from '@/lib/image-processor';

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Chưa đăng nhập hoặc phiên đã hết hạn' }, { status: 401 });
    }

    const body = await req.json();
    const { checkType, imageData, latitude, longitude, clientLocationAddress, notes } = body;

    if (!checkType || !['IN', 'OUT'].includes(checkType)) {
      return NextResponse.json({ error: 'Loại chấm công không hợp lệ (IN/OUT)' }, { status: 400 });
    }

    if (!imageData || typeof imageData !== 'string' || !imageData.startsWith('data:image')) {
      return NextResponse.json({ error: 'Ảnh chấm công bắt buộc phải được chụp trực tiếp từ camera' }, { status: 400 });
    }

    const serverNow = new Date();

    // 1. Check Geofencing with Database Locations
    const locations = await prisma.location.findMany({
      where: { isActive: true },
    });

    let isValidLocation = true;
    let nearestLocationName: string | null = null;
    let distanceMeters = 0;
    let finalAddress = clientLocationAddress || '';

    if (latitude != null && longitude != null) {
      const geoResult = checkGeofence({ latitude, longitude }, locations);
      isValidLocation = geoResult.isValid;
      distanceMeters = geoResult.distanceMeters;
      nearestLocationName = geoResult.nearestLocation?.name || null;

      if (!finalAddress) {
        finalAddress = await getAddressFromCoordinates({ latitude, longitude });
      }
    } else {
      isValidLocation = false;
      finalAddress = 'Không thể lấy tọa độ GPS của thiết bị';
    }

    // 2. Shift & Late/Early Calculation
    const defaultShift = await prisma.shift.findFirst({
      where: { isActive: true },
    });

    let isLate = false;
    let lateMinutes = 0;
    let isEarlyLeave = false;
    let earlyMinutes = 0;

    if (defaultShift) {
      // Calculate based on GMT+7 local time
      const gmt7Formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Asia/Ho_Chi_Minh',
        hour: 'numeric',
        minute: 'numeric',
        hour12: false,
      });
      const parts = gmt7Formatter.formatToParts(serverNow);
      const currentHour = parseInt(parts.find((p) => p.type === 'hour')?.value || '0', 10);
      const currentMinute = parseInt(parts.find((p) => p.type === 'minute')?.value || '0', 10);
      const currentTotalMinutes = currentHour * 60 + currentMinute;

      const [startHour, startMin] = defaultShift.startTime.split(':').map(Number);
      const shiftStartTotalMinutes = startHour * 60 + startMin;

      const [endHour, endMin] = defaultShift.endTime.split(':').map(Number);
      const shiftEndTotalMinutes = endHour * 60 + endMin;

      if (checkType === 'IN') {
        const threshold = shiftStartTotalMinutes + defaultShift.allowedLateMinutes;
        if (currentTotalMinutes > threshold) {
          isLate = true;
          lateMinutes = currentTotalMinutes - shiftStartTotalMinutes;
        }
      } else if (checkType === 'OUT') {
        const threshold = shiftEndTotalMinutes - defaultShift.allowedEarlyMinutes;
        if (currentTotalMinutes < threshold) {
          isEarlyLeave = true;
          earlyMinutes = shiftEndTotalMinutes - currentTotalMinutes;
        }
      }
    }

    // 3. Save Compressed Image
    const savedImage = await processAndSaveAttendanceImage(imageData, user.id);

    // 4. Save Attendance in Database
    const attendance = await prisma.attendance.create({
      data: {
        userId: user.id,
        shiftId: defaultShift?.id,
        checkType,
        serverTime: serverNow,
        latitude: latitude ?? null,
        longitude: longitude ?? null,
        locationAddress: finalAddress,
        nearestLocationName,
        distanceMeters,
        isValidLocation,
        isLate,
        lateMinutes,
        isEarlyLeave,
        earlyMinutes,
        imagePath: savedImage.urlPath,
        notes: notes || null,
      },
    });

    return NextResponse.json({
      success: true,
      message: checkType === 'IN' ? 'Chấm công VÀO CA thành công!' : 'Chấm công RA CA thành công!',
      attendance: {
        id: attendance.id,
        checkType: attendance.checkType,
        serverTime: attendance.serverTime,
        isValidLocation: attendance.isValidLocation,
        nearestLocationName: attendance.nearestLocationName,
        distanceMeters: attendance.distanceMeters,
        isLate: attendance.isLate,
        lateMinutes: attendance.lateMinutes,
        isEarlyLeave: attendance.isEarlyLeave,
        earlyMinutes: attendance.earlyMinutes,
        imagePath: attendance.imagePath,
      },
    });
  } catch (error: any) {
    console.error('Attendance check error:', error);
    return NextResponse.json(
      { error: 'Lỗi ghi nhận chấm công: ' + error.message },
      { status: 500 }
    );
  }
}
