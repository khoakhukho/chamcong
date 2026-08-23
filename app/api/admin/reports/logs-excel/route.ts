import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { generateAttendanceLogsExcelReport, AttendanceLogItem } from '@/lib/excel-export';
import { format } from 'date-fns';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role === 'EMPLOYEE') {
      return NextResponse.json({ error: 'Không có quyền xuất báo cáo' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const fromDateStr = searchParams.get('from');
    const toDateStr = searchParams.get('to');

    const where: any = {};
    if (fromDateStr && toDateStr) {
      where.serverTime = {
        gte: new Date(`${fromDateStr}T00:00:00`),
        lte: new Date(`${toDateStr}T23:59:59`),
      };
    }

    const attendances = await prisma.attendance.findMany({
      where,
      include: {
        user: true,
      },
      orderBy: { serverTime: 'desc' },
    });

    const logs: AttendanceLogItem[] = attendances.map((a) => ({
      id: a.id,
      employeeCode: a.user.employeeCode,
      fullName: a.user.fullName,
      department: a.user.department || 'Chung',
      checkType: a.checkType,
      serverTime: a.serverTime,
      locationAddress: a.locationAddress || '',
      nearestLocationName: a.nearestLocationName || '',
      latitude: a.latitude,
      longitude: a.longitude,
      distanceMeters: a.distanceMeters || 0,
      isValidLocation: a.isValidLocation,
      isLate: a.isLate,
      lateMinutes: a.lateMinutes,
      isEarlyLeave: a.isEarlyLeave,
      earlyMinutes: a.earlyMinutes,
      imagePath: a.imagePath,
      notes: a.notes || '',
    }));

    const excelBuffer = await generateAttendanceLogsExcelReport(
      logs,
      `NHẬT KÝ CHI TIẾT CHẤM CÔNG CARITAS ĐÀ LẠT`
    );

    const fileName = `Nhat_Ky_Cham_Cong_${format(new Date(), 'yyyyMMdd_HHmmss')}.xlsx`;

    return new NextResponse(new Uint8Array(excelBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
