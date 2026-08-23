import ExcelJS from 'exceljs';
import { format } from 'date-fns';

export interface MonthlyAttendanceData {
  month: number;
  year: number;
  totalDays: number;
  users: {
    id: number;
    employeeCode: string;
    fullName: string;
    department: string | null;
    contractType: string; // 'FULL_TIME' | 'PART_TIME' | 'CONTRACT'
    days: {
      day: number;
      dayOfWeek: number; // 0 = Sunday, 6 = Saturday
      symbol: string; // 'X', '1/2', 'NB', 'P', 'Ô', 'Ro', 'KP', ''
      inTime?: string;
      outTime?: string;
      workedHours?: number;
    }[];
    totalWorkDays: number;
    totalCompensatoryDays: number; // Số ngày nghỉ bù (NB)
    totalPaidLeave: number;        // Số ngày phép năm (P)
    totalWorkedHours: number;      // Tổng số giờ làm (Bán thời gian / Khoán)
  }[];
}

export interface AttendanceLogItem {
  id: number;
  employeeCode: string;
  fullName: string;
  department: string;
  contractType?: string;
  checkType: string;
  serverTime: Date;
  locationAddress: string;
  nearestLocationName: string;
  latitude?: number | null;
  longitude?: number | null;
  distanceMeters: number;
  isValidLocation: boolean;
  isLate: boolean;
  lateMinutes: number;
  isEarlyLeave: boolean;
  earlyMinutes: number;
  imagePath: string;
  notes: string;
}

/**
 * Generates Standard Accounting Monthly Synthesis Excel Buffer using ExcelJS
 */
export async function generateMonthlyExcelReport(
  data: MonthlyAttendanceData
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Caritas Giáo Phận Đà Lạt - Kế Toán & Quản Trị';
  workbook.created = new Date();

  // ==========================================
  // SHEET 1: BẢNG TỔNG HỢP CÔNG THÁNG (CHUẨN KẾ TOÁN)
  // ==========================================
  const sheet = workbook.addWorksheet(`Tong_Hop_Thang_${data.month}_${data.year}`, {
    views: [{ showGridLines: true }],
    pageSetup: { orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0 },
  });

  // 1. Header Organization Info
  sheet.mergeCells('A1:I1');
  const orgCell = sheet.getCell('A1');
  orgCell.value = 'BAN BÁC ÁI XÃ HỘI - CARITAS GIÁO PHẬN ĐÀ LẠT';
  orgCell.font = { bold: true, size: 12, color: { argb: 'FFC00000' } };
  orgCell.alignment = { vertical: 'middle', horizontal: 'left' };

  sheet.mergeCells('A2:I2');
  const subOrgCell = sheet.getCell('A2');
  subOrgCell.value = 'Địa chỉ: 09 Nguyễn Trường Tộ, Phường 4, TP. Đà Lạt | Website: caritasdalat.org';
  subOrgCell.font = { italic: true, size: 10, color: { argb: 'FF555555' } };

  // 2. Report Title
  const daysStartCol = 6; // Column F (STT, MaNV, HoTen, PhongBan, LoaiHD)
  const daysEndCol = daysStartCol + data.totalDays - 1;
  const colWorkDays = daysEndCol + 1;
  const colCompensatory = daysEndCol + 2;
  const colPaidLeave = daysEndCol + 3;
  const colTotalReal = daysEndCol + 4;
  const colTotalHours = daysEndCol + 5;

  const lastColLetter = getColumnLetter(colTotalHours);
  sheet.mergeCells(`A4:${lastColLetter}4`);
  const titleCell = sheet.getCell('A4');
  titleCell.value = `BẢNG CHẤM CÔNG TỔNG HỢP THÁNG ${data.month.toString().padStart(2, '0')}/${data.year}`;
  titleCell.font = { bold: true, size: 16, color: { argb: 'FF1A365D' } };
  titleCell.alignment = { vertical: 'middle', horizontal: 'center' };

  sheet.addRow([]); // Blank row 5

  // 3. Header Table (Row 6 & 7)
  const row6 = sheet.getRow(6);
  row6.height = 28;

  sheet.mergeCells('A6:A7');
  sheet.getCell('A6').value = 'STT';

  sheet.mergeCells('B6:B7');
  sheet.getCell('B6').value = 'Mã NV';

  sheet.mergeCells('C6:C7');
  sheet.getCell('C6').value = 'Họ và Tên';

  sheet.mergeCells('D6:D7');
  sheet.getCell('D6').value = 'Phòng ban / Bộ phận';

  sheet.mergeCells('E6:E7');
  sheet.getCell('E6').value = 'Loại HĐ';

  sheet.mergeCells(6, daysStartCol, 6, daysEndCol);
  const daysHeaderCell = sheet.getCell(6, daysStartCol);
  daysHeaderCell.value = `NGÀY TRONG THÁNG ${data.month}/${data.year}`;
  daysHeaderCell.alignment = { horizontal: 'center', vertical: 'middle' };

  // Summary Columns Header
  sheet.mergeCells(6, colWorkDays, 7, colWorkDays);
  sheet.getCell(6, colWorkDays).value = 'Công\nĐi làm (X)';

  sheet.mergeCells(6, colCompensatory, 7, colCompensatory);
  sheet.getCell(6, colCompensatory).value = 'Nghỉ bù\n(NB)';

  sheet.mergeCells(6, colPaidLeave, 7, colPaidLeave);
  sheet.getCell(6, colPaidLeave).value = 'Phép năm\n(P)';

  sheet.mergeCells(6, colTotalReal, 7, colTotalReal);
  sheet.getCell(6, colTotalReal).value = 'TỔNG CÔNG\nTÍNH LƯƠNG';

  sheet.mergeCells(6, colTotalHours, 7, colTotalHours);
  sheet.getCell(6, colTotalHours).value = 'Tổng Giờ\nLàm Việc';

  // Row 7: Day Numbers (1..totalDays)
  const row7 = sheet.getRow(7);
  row7.height = 20;

  for (let d = 1; d <= data.totalDays; d++) {
    const colIndex = daysStartCol + d - 1;
    const dayCell = sheet.getCell(7, colIndex);
    dayCell.value = d;
    dayCell.alignment = { horizontal: 'center', vertical: 'middle' };

    const dateObj = new Date(data.year, data.month - 1, d);
    const dayOfWeek = dateObj.getDay();
    if (dayOfWeek === 0) {
      dayCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFFFCCCC' },
      };
    } else if (dayOfWeek === 6) {
      dayCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFFFF2CC' },
      };
    }
  }

  // Style Header rows 6 & 7
  for (let r = 6; r <= 7; r++) {
    const rObj = sheet.getRow(r);
    rObj.eachCell((cell) => {
      cell.font = { bold: true, size: 9, color: { argb: 'FF000000' } };
      cell.alignment = {
        vertical: 'middle',
        horizontal: 'center',
        wrapText: true,
      };
      cell.border = getThinBorder();
      if (!cell.fill) {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFE2E8F0' },
        };
      }
    });
  }

  // 4. Fill Employee Data Rows
  let currentRow = 8;
  data.users.forEach((u, index) => {
    const r = sheet.getRow(currentRow);
    r.height = 22;

    const contractShort =
      u.contractType === 'PART_TIME'
        ? 'Bán thời gian'
        : u.contractType === 'CONTRACT'
        ? 'Khoán'
        : 'Toàn thời gian';

    sheet.getCell(currentRow, 1).value = index + 1;
    sheet.getCell(currentRow, 2).value = u.employeeCode;
    sheet.getCell(currentRow, 3).value = u.fullName;
    sheet.getCell(currentRow, 4).value = u.department || 'Chung';
    sheet.getCell(currentRow, 5).value = contractShort;

    // Days 1..totalDays
    u.days.forEach((dayData) => {
      const colIdx = daysStartCol + dayData.day - 1;
      const cell = sheet.getCell(currentRow, colIdx);
      cell.value = dayData.symbol || '';
      cell.alignment = { horizontal: 'center', vertical: 'middle' };

      if (dayData.dayOfWeek === 0) {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFFF0F0' },
        };
      } else if (dayData.dayOfWeek === 6) {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFFFAED' },
        };
      }

      if (dayData.symbol === 'X') {
        cell.font = { bold: true, color: { argb: 'FF059669' } };
      } else if (dayData.symbol === 'NB') {
        cell.font = { bold: true, color: { argb: 'FF0284C7' } }; // Sky Blue for Compensatory
      } else if (dayData.symbol === 'P') {
        cell.font = { bold: true, color: { argb: 'FF2563EB' } }; // Blue for Annual Leave
      } else if (dayData.symbol === 'KP') {
        cell.font = { bold: true, color: { argb: 'FFDC2626' } }; // Red
      }
    });

    // Formulas
    const firstDayLetter = getColumnLetter(daysStartCol);
    const lastDayLetter = getColumnLetter(daysEndCol);

    // Công đi làm (X + 1/2*0.5)
    const workDayCell = sheet.getCell(currentRow, colWorkDays);
    workDayCell.value = {
      formula: `COUNTIF(${firstDayLetter}${currentRow}:${lastDayLetter}${currentRow},"X")+COUNTIF(${firstDayLetter}${currentRow}:${lastDayLetter}${currentRow},"1/2")*0.5`,
      result: u.totalWorkDays,
    };
    workDayCell.alignment = { horizontal: 'center', vertical: 'middle' };

    // Nghỉ bù (NB)
    const compCell = sheet.getCell(currentRow, colCompensatory);
    compCell.value = {
      formula: `COUNTIF(${firstDayLetter}${currentRow}:${lastDayLetter}${currentRow},"NB")`,
      result: u.totalCompensatoryDays,
    };
    compCell.alignment = { horizontal: 'center', vertical: 'middle' };

    // Phép năm (P)
    const paidLeaveCell = sheet.getCell(currentRow, colPaidLeave);
    paidLeaveCell.value = {
      formula: `COUNTIF(${firstDayLetter}${currentRow}:${lastDayLetter}${currentRow},"P")`,
      result: u.totalPaidLeave,
    };
    paidLeaveCell.alignment = { horizontal: 'center', vertical: 'middle' };

    // Tổng công tính lương = Đi làm + Nghỉ bù + Phép năm
    const colWorkLetter = getColumnLetter(colWorkDays);
    const colCompLetter = getColumnLetter(colCompensatory);
    const colPaidLetter = getColumnLetter(colPaidLeave);
    const totalRealCell = sheet.getCell(currentRow, colTotalReal);
    totalRealCell.value = {
      formula: `${colWorkLetter}${currentRow}+${colCompLetter}${currentRow}+${colPaidLetter}${currentRow}`,
      result: u.totalWorkDays + u.totalCompensatoryDays + u.totalPaidLeave,
    };
    totalRealCell.font = { bold: true, color: { argb: 'FF0F766E' } };
    totalRealCell.alignment = { horizontal: 'center', vertical: 'middle' };

    // Tổng giờ làm (dành cho Bán thời gian / Khoán)
    const totalHoursCell = sheet.getCell(currentRow, colTotalHours);
    totalHoursCell.value = u.totalWorkedHours;
    totalHoursCell.alignment = { horizontal: 'center', vertical: 'middle' };
    totalHoursCell.numFmt = '#,##0.0';

    for (let c = 1; c <= colTotalHours; c++) {
      sheet.getCell(currentRow, c).border = getThinBorder();
    }

    currentRow++;
  });

  // 5. Total Summary Row
  const totalRowIndex = currentRow;
  sheet.mergeCells(totalRowIndex, 1, totalRowIndex, 5);
  const totalLabelCell = sheet.getCell(totalRowIndex, 1);
  totalLabelCell.value = 'TỔNG CỘNG TOÀN CƠ QUAN';
  totalLabelCell.font = { bold: true };
  totalLabelCell.alignment = { horizontal: 'center', vertical: 'middle' };

  for (let d = 1; d <= data.totalDays; d++) {
    const colIdx = daysStartCol + d - 1;
    const colLet = getColumnLetter(colIdx);
    const dayTotalCell = sheet.getCell(totalRowIndex, colIdx);
    dayTotalCell.value = {
      formula: `COUNTIF(${colLet}8:${colLet}${totalRowIndex - 1},"X")`,
    };
    dayTotalCell.font = { bold: true };
    dayTotalCell.alignment = { horizontal: 'center', vertical: 'middle' };
  }

  const colWorkLetter = getColumnLetter(colWorkDays);
  const colCompLetter = getColumnLetter(colCompensatory);
  const colPaidLetter = getColumnLetter(colPaidLeave);
  const colRealLetter = getColumnLetter(colTotalReal);
  const colHoursLetter = getColumnLetter(colTotalHours);

  sheet.getCell(totalRowIndex, colWorkDays).value = {
    formula: `SUM(${colWorkLetter}8:${colWorkLetter}${totalRowIndex - 1})`,
  };
  sheet.getCell(totalRowIndex, colCompensatory).value = {
    formula: `SUM(${colCompLetter}8:${colCompLetter}${totalRowIndex - 1})`,
  };
  sheet.getCell(totalRowIndex, colPaidLeave).value = {
    formula: `SUM(${colPaidLetter}8:${colPaidLetter}${totalRowIndex - 1})`,
  };
  sheet.getCell(totalRowIndex, colTotalReal).value = {
    formula: `SUM(${colRealLetter}8:${colRealLetter}${totalRowIndex - 1})`,
  };
  sheet.getCell(totalRowIndex, colTotalHours).value = {
    formula: `SUM(${colHoursLetter}8:${colHoursLetter}${totalRowIndex - 1})`,
  };

  for (let c = 1; c <= colTotalHours; c++) {
    const cCell = sheet.getCell(totalRowIndex, c);
    cCell.border = getThinBorder();
    cCell.font = { bold: true };
    cCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFF1F5F9' },
    };
  }

  // 6. Legend
  currentRow += 2;
  sheet.mergeCells(currentRow, 1, currentRow, 10);
  const legendTitle = sheet.getCell(currentRow, 1);
  legendTitle.value = 'GHI CHÚ KÝ HIỆU CHẤM CÔNG CARITAS ĐÀ LẠT:';
  legendTitle.font = { bold: true, size: 10 };

  currentRow++;
  const legends = [
    'X: Làm đủ ngày công (1.0)',
    '1/2: Nửa ngày công (0.5)',
    'NB: Nghỉ bù làm thêm T7/CN (Có lương)',
    'P: Nghỉ phép năm (Có lương)',
    'Ô: Nghỉ ốm (BHXH)',
    'Ro: Việc riêng có lương (Hiếu hỷ)',
    'KP: Nghỉ không hưởng lương',
  ];
  sheet.mergeCells(currentRow, 1, currentRow, 16);
  sheet.getCell(currentRow, 1).value = legends.join('   |   ');
  sheet.getCell(currentRow, 1).font = { italic: true, size: 9, color: { argb: 'FF475569' } };

  // 7. Signature
  currentRow += 2;
  const signRow = currentRow;
  sheet.mergeCells(signRow, 2, signRow, 5);
  const sign1 = sheet.getCell(signRow, 2);
  sign1.value = 'KẾ TOÁN TRƯỞNG / NGƯỜI LẬP BẢNG\n(Ký & ghi rõ họ tên)';
  sign1.font = { bold: true };
  sign1.alignment = { horizontal: 'center', wrapText: true };

  sheet.mergeCells(signRow, colTotalReal - 4, signRow, colTotalReal);
  const sign2 = sheet.getCell(signRow, colTotalReal - 4);
  sign2.value = `Đà Lạt, ngày ${data.totalDays} tháng ${data.month} năm ${data.year}\nGIÁM ĐỐC CARITAS ĐÀ LẠT\n(Ký & đóng dấu)`;
  sign2.font = { bold: true };
  sign2.alignment = { horizontal: 'center', wrapText: true };

  // Column widths
  sheet.getColumn(1).width = 5;  // STT
  sheet.getColumn(2).width = 11; // Ma NV
  sheet.getColumn(3).width = 24; // Ho ten
  sheet.getColumn(4).width = 20; // Phong ban
  sheet.getColumn(5).width = 15; // Loai HD
  for (let d = 1; d <= data.totalDays; d++) {
    sheet.getColumn(daysStartCol + d - 1).width = 4.2;
  }
  sheet.getColumn(colWorkDays).width = 12;
  sheet.getColumn(colCompensatory).width = 12;
  sheet.getColumn(colPaidLeave).width = 12;
  sheet.getColumn(colTotalReal).width = 15;
  sheet.getColumn(colTotalHours).width = 14;

  const arrayBuffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(arrayBuffer);
}

/**
 * Generates Detail Log Excel Buffer with GPS information
 */
export async function generateAttendanceLogsExcelReport(
  logs: AttendanceLogItem[],
  title: string = 'NHẬT KÝ CHI TIẾT QUẸT THẺ CHẤM CÔNG CARITAS ĐÀ LẠT'
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Caritas Đà Lạt';
  const sheet = workbook.addWorksheet('Nhat_Ky_Quet_The');

  // Title
  sheet.mergeCells('A1:K1');
  const titleCell = sheet.getCell('A1');
  titleCell.value = title.toUpperCase();
  titleCell.font = { bold: true, size: 14, color: { argb: 'FF1E293B' } };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  sheet.getRow(1).height = 30;

  sheet.mergeCells('A2:K2');
  const timeCell = sheet.getCell('A2');
  timeCell.value = `Thời gian xuất báo cáo: ${format(new Date(), 'dd/MM/yyyy HH:mm:ss')}`;
  timeCell.font = { italic: true, size: 10, color: { argb: 'FF64748B' } };
  timeCell.alignment = { horizontal: 'center', vertical: 'middle' };

  sheet.addRow([]);

  // Headers
  const headers = [
    'STT',
    'Mã NV',
    'Họ và Tên',
    'Phòng ban',
    'Loại quẹt',
    'Thời gian (Server GMT+7)',
    'Vị trí / Địa chỉ thực tế',
    'Tọa độ GPS',
    'Tình trạng GPS',
    'Ghi chú',
    'Ảnh xác thực',
  ];

  const headerRow = sheet.addRow(headers);
  headerRow.height = 25;
  headerRow.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF0F766E' },
    };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = getThinBorder();
  });

  // Data rows
  logs.forEach((item, idx) => {
    const coordDisplay =
      item.latitude && item.longitude
        ? `${item.latitude.toFixed(5)}, ${item.longitude.toFixed(5)}`
        : 'Không có GPS';

    const row = sheet.addRow([
      idx + 1,
      item.employeeCode,
      item.fullName,
      item.department,
      item.checkType === 'IN' ? 'VÀO CA (Check-in)' : 'RA CA (Check-out)',
      format(item.serverTime, 'dd/MM/yyyy HH:mm:ss'),
      item.locationAddress || item.nearestLocationName || 'Khu vực hoạt động',
      coordDisplay,
      item.latitude ? '✓ Đã lấy GPS' : 'Chưa lấy GPS',
      item.notes || '',
      item.imagePath,
    ]);

    row.height = 20;
    row.eachCell((cell, colNum) => {
      cell.border = getThinBorder();
      cell.alignment = { vertical: 'middle' };
      if ([1, 2, 5, 6, 8, 9].includes(colNum)) {
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
      }
    });
  });

  sheet.getColumn(1).width = 6;
  sheet.getColumn(2).width = 12;
  sheet.getColumn(3).width = 24;
  sheet.getColumn(4).width = 20;
  sheet.getColumn(5).width = 18;
  sheet.getColumn(6).width = 22;
  sheet.getColumn(7).width = 32;
  sheet.getColumn(8).width = 24;
  sheet.getColumn(9).width = 16;
  sheet.getColumn(10).width = 26;
  sheet.getColumn(11).width = 30;

  const arrayBuffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(arrayBuffer);
}

function getThinBorder(): Partial<ExcelJS.Borders> {
  return {
    top: { style: 'thin', color: { argb: 'FFCBD5E1' } },
    left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
    bottom: { style: 'thin', color: { argb: 'FFCBD5E1' } },
    right: { style: 'thin', color: { argb: 'FFCBD5E1' } },
  };
}

function getColumnLetter(colIndex: number): string {
  let temp: number;
  let letter = '';
  while (colIndex > 0) {
    temp = (colIndex - 1) % 26;
    letter = String.fromCharCode(temp + 65) + letter;
    colIndex = (colIndex - temp - 1) / 26;
  }
  return letter;
}
