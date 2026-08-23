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
    const {
      checkType,
      imageData,
      latitude,
      longitude,
      locationAddress,
      clientLocationAddress,
      clientCapturedTime,
      isOfflineSync,
      notes,
    } = body;

    if (!checkType || !['IN', 'OUT'].includes(checkType)) {
      return NextResponse.json({ error: 'Loại chấm công không hợp lệ (IN/OUT)' }, { status: 400 });
    }

    if (!imageData || typeof imageData !== 'string' || !imageData.startsWith('data:image')) {
      return NextResponse.json({ error: 'Ảnh chấm công bắt buộc phải được chụp trực tiếp từ camera' }, { status: 400 });
    }

    const serverNow = new Date();
    // If synced offline, use the actual moment the employee captured the photo
    const effectiveTime = clientCapturedTime ? new Date(clientCapturedTime) : serverNow;

    // 1. Check Geofencing with Database Locations
    const locations = await prisma.location.findMany({
      where: { isActive: true },
    });

    let isValidLocation = true;
    let nearestLocationName: string | null = null;
    let distanceMeters = 0;
    let finalAddress = locationAddress || clientLocationAddress || '';

    if (latitude != null && longitude != null) {
      const geoResult = checkGeofence({ latitude, longitude }, locations);
      isValidLocation = true; // All community / field locations are valid
      distanceMeters = geoResult.distanceMeters;
      nearestLocationName = geoResult.nearestLocation?.name || null;

      if (!finalAddress) {
        finalAddress = await getAddressFromCoordinates({ latitude, longitude });
      }
    } else {
      isValidLocation = true;
      finalAddress = 'Không có tọa độ GPS';
    }

    // 2. Shift & Late/Early Calculation based on effective punch time
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
      const parts = gmt7Formatter.formatToParts(effectiveTime);
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

    // 4. Notes formatting for offline sync
    let finalNotes = notes || '';
    if (isOfflineSync) {
      const syncNote = `[Chấm công Offline lúc ${effectiveTime.toLocaleTimeString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })} - Đã tự động đồng bộ]`;
      finalNotes = finalNotes ? `${syncNote} ${finalNotes}` : syncNote;
    }

    // 5. Save Attendance in Database
    const attendance = await prisma.attendance.create({
      data: {
        userId: user.id,
        shiftId: defaultShift?.id,
        checkType,
        serverTime: effectiveTime,
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
        notes: finalNotes || null,
      },
    });

    return NextResponse.json({
      success: true,
      message:
        checkType === 'IN'
          ? 'Chấm công VÀO CA thành công!'
          : 'Chấm công RA CA thành công!',
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
