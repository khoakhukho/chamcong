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
    days: {
      day: number;
      dayOfWeek: number; // 0 = Sunday, 6 = Saturday
      symbol: string; // 'X', '1/2', 'P', 'Ô', 'Ro', 'KP', ''
      inTime?: string;
      outTime?: string;
      isLate?: boolean;
      lateMinutes?: number;
    }[];
    totalWorkDays: number;
    totalPaidLeave: number;
    totalLateCount: number;
    totalLateMinutes: number;
  }[];
}

export interface AttendanceLogItem {
  id: number;
  employeeCode: string;
  fullName: string;
  department: string;
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
 * Generates Monthly Synthesis Excel Buffer using ExcelJS
 */
export async function generateMonthlyExcelReport(
  data: MonthlyAttendanceData
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Caritas Đà Lạt - Hệ Thống Chấm Công';
  workbook.created = new Date();

  const sheet = workbook.addWorksheet(`Thang_${data.month}_${data.year}`, {
    views: [{ showGridLines: true }],
    pageSetup: { orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0 },
  });

  // 1. Header Organization Info
  sheet.mergeCells('A1:H1');
  const orgCell = sheet.getCell('A1');
  orgCell.value = 'BAN BÁC ÁI XÃ HỘI - CARITAS GIÁO PHẬN ĐÀ LẠT';
  orgCell.font = { bold: true, size: 12, color: { argb: 'FFC00000' } }; // Caritas Red
  orgCell.alignment = { vertical: 'middle', horizontal: 'left' };

  sheet.mergeCells('A2:H2');
  const subOrgCell = sheet.getCell('A2');
  subOrgCell.value = 'Địa chỉ: 09 Nguyễn Trường Tộ, Phường 4, TP. Đà Lạt | Website: caritasdalat.org';
  subOrgCell.font = { italic: true, size: 10, color: { argb: 'FF555555' } };

  // 2. Report Title
  const lastColLetter = getColumnLetter(4 + data.totalDays + 5);
  sheet.mergeCells(`A4:${lastColLetter}4`);
  const titleCell = sheet.getCell('A4');
  titleCell.value = `BẢNG CHẤM CÔNG TỔNG HỢP THÁNG ${data.month.toString().padStart(2, '0')}/${data.year}`;
  titleCell.font = { bold: true, size: 16, color: { argb: 'FF1A365D' } };
  titleCell.alignment = { vertical: 'middle', horizontal: 'center' };

  sheet.addRow([]); // Blank row 5

  // 3. Header Table (Row 6 & 7)
  // Row 6: Main Titles
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

  const daysStartCol = 5; // Column E
  const daysEndCol = daysStartCol + data.totalDays - 1;

  sheet.mergeCells(6, daysStartCol, 6, daysEndCol);
  const daysHeaderCell = sheet.getCell(6, daysStartCol);
  daysHeaderCell.value = `NGÀY TRONG THÁNG ${data.month}/${data.year}`;
  daysHeaderCell.alignment = { horizontal: 'center', vertical: 'middle' };

  // Summary Columns Header
  const colWorkDays = daysEndCol + 1;
  const colPaidLeave = daysEndCol + 2;
  const colTotalReal = daysEndCol + 3;
  const colLateCount = daysEndCol + 4;
  const colLateMins = daysEndCol + 5;

  sheet.mergeCells(6, colWorkDays, 7, colWorkDays);
  sheet.getCell(6, colWorkDays).value = 'Công\nĐi làm (X)';

  sheet.mergeCells(6, colPaidLeave, 7, colPaidLeave);
  sheet.getCell(6, colPaidLeave).value = 'Nghỉ phép\nCó lương (P)';

  sheet.mergeCells(6, colTotalReal, 7, colTotalReal);
  sheet.getCell(6, colTotalReal).value = 'TỔNG CÔNG\nTHỰC TẾ';

  sheet.mergeCells(6, colLateCount, 7, colLateCount);
  sheet.getCell(6, colLateCount).value = 'Số lần\nĐi trễ';

  sheet.mergeCells(6, colLateMins, 7, colLateMins);
  sheet.getCell(6, colLateMins).value = 'Số phút\nĐi trễ';

  // Row 7: Day Numbers (1..31)
  const row7 = sheet.getRow(7);
  row7.height = 20;

  for (let d = 1; d <= data.totalDays; d++) {
    const colIndex = daysStartCol + d - 1;
    const dayCell = sheet.getCell(7, colIndex);
    dayCell.value = d;
    dayCell.alignment = { horizontal: 'center', vertical: 'middle' };

    // Check if Sunday / Saturday
    const dateObj = new Date(data.year, data.month - 1, d);
    const dayOfWeek = dateObj.getDay();
    if (dayOfWeek === 0) {
      // Sunday: red tint
      dayCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFFFCCCC' },
      };
    } else if (dayOfWeek === 6) {
      // Saturday: light yellow
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
      cell.font = { bold: true, size: 10, color: { argb: 'FF000000' } };
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
  data.users.forEach((user, index) => {
    const r = sheet.getRow(currentRow);
    r.height = 22;

    sheet.getCell(currentRow, 1).value = index + 1;
    sheet.getCell(currentRow, 2).value = user.employeeCode;
    sheet.getCell(currentRow, 3).value = user.fullName;
    sheet.getCell(currentRow, 4).value = user.department || 'Chung';

    // Days 1..totalDays
    user.days.forEach((dayData) => {
      const colIdx = daysStartCol + dayData.day - 1;
      const cell = sheet.getCell(currentRow, colIdx);
      cell.value = dayData.symbol || '';
      cell.alignment = { horizontal: 'center', vertical: 'middle' };

      // Highlight weekend columns
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

      // Font color for specific symbols
      if (dayData.symbol === 'X') {
        cell.font = { bold: true, color: { argb: 'FF059669' } }; // Green
      } else if (dayData.symbol === 'KP') {
        cell.font = { bold: true, color: { argb: 'FFDC2626' } }; // Red
      } else if (dayData.symbol === 'P') {
        cell.font = { bold: true, color: { argb: 'FF2563EB' } }; // Blue
      }
    });

    // Summary Excel Formulas
    const firstDayLetter = getColumnLetter(daysStartCol);
    const lastDayLetter = getColumnLetter(daysEndCol);

    // Công đi làm: COUNTIF(E8:AI8, "X") + COUNTIF(E8:AI8, "1/2")*0.5
    const workDayCell = sheet.getCell(currentRow, colWorkDays);
    workDayCell.value = {
      formula: `COUNTIF(${firstDayLetter}${currentRow}:${lastDayLetter}${currentRow},"X")+COUNTIF(${firstDayLetter}${currentRow}:${lastDayLetter}${currentRow},"1/2")*0.5`,
      result: user.totalWorkDays,
    };
    workDayCell.alignment = { horizontal: 'center', vertical: 'middle' };

    // Phép có lương: COUNTIF(..., "P")
    const paidLeaveCell = sheet.getCell(currentRow, colPaidLeave);
    paidLeaveCell.value = {
      formula: `COUNTIF(${firstDayLetter}${currentRow}:${lastDayLetter}${currentRow},"P")`,
      result: user.totalPaidLeave,
    };
    paidLeaveCell.alignment = { horizontal: 'center', vertical: 'middle' };

    // Tổng công thực tế: Công đi làm + Phép
    const colWorkLetter = getColumnLetter(colWorkDays);
    const colPaidLetter = getColumnLetter(colPaidLeave);
    const totalRealCell = sheet.getCell(currentRow, colTotalReal);
    totalRealCell.value = {
      formula: `${colWorkLetter}${currentRow}+${colPaidLetter}${currentRow}`,
      result: user.totalWorkDays + user.totalPaidLeave,
    };
    totalRealCell.font = { bold: true, color: { argb: 'FF0F766E' } };
    totalRealCell.alignment = { horizontal: 'center', vertical: 'middle' };

    // Số lần đi trễ
    const lateCountCell = sheet.getCell(currentRow, colLateCount);
    lateCountCell.value = user.totalLateCount;
    lateCountCell.alignment = { horizontal: 'center', vertical: 'middle' };
    if (user.totalLateCount > 0) {
      lateCountCell.font = { color: { argb: 'FFD97706' }, bold: true };
    }

    // Số phút đi trễ
    const lateMinsCell = sheet.getCell(currentRow, colLateMins);
    lateMinsCell.value = user.totalLateMinutes;
    lateMinsCell.alignment = { horizontal: 'center', vertical: 'middle' };

    // Border for data row
    for (let c = 1; c <= colLateMins; c++) {
      sheet.getCell(currentRow, c).border = getThinBorder();
    }

    currentRow++;
  });

  // 5. Total Row
  const totalRowIndex = currentRow;
  sheet.mergeCells(totalRowIndex, 1, totalRowIndex, 4);
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

  // Total summary columns
  const colWorkLetter = getColumnLetter(colWorkDays);
  const colPaidLetter = getColumnLetter(colPaidLeave);
  const colRealLetter = getColumnLetter(colTotalReal);

  sheet.getCell(totalRowIndex, colWorkDays).value = {
    formula: `SUM(${colWorkLetter}8:${colWorkLetter}${totalRowIndex - 1})`,
  };
  sheet.getCell(totalRowIndex, colPaidLeave).value = {
    formula: `SUM(${colPaidLetter}8:${colPaidLetter}${totalRowIndex - 1})`,
  };
  sheet.getCell(totalRowIndex, colTotalReal).value = {
    formula: `SUM(${colRealLetter}8:${colRealLetter}${totalRowIndex - 1})`,
  };

  for (let c = 1; c <= colLateMins; c++) {
    const cCell = sheet.getCell(totalRowIndex, c);
    cCell.border = getThinBorder();
    cCell.font = { bold: true };
    cCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFF1F5F9' },
    };
  }

  // 6. Legend / Notes at Bottom
  currentRow += 2;
  sheet.mergeCells(currentRow, 1, currentRow, 10);
  const legendTitle = sheet.getCell(currentRow, 1);
  legendTitle.value = 'GHI CHÚ KÝ HIỆU CHẤM CÔNG:';
  legendTitle.font = { bold: true, size: 10 };

  currentRow++;
  const legends = [
    'X: Làm đủ ngày công (1 công)',
    '1/2: Làm nửa ngày (0.5 công)',
    'P: Nghỉ phép năm có lương',
    'Ô: Nghỉ ốm hưởng BHXH',
    'Ro: Nghỉ việc riêng không lương',
    'KP: Nghỉ không phép',
  ];
  sheet.mergeCells(currentRow, 1, currentRow, 15);
  sheet.getCell(currentRow, 1).value = legends.join('   |   ');
  sheet.getCell(currentRow, 1).font = { italic: true, size: 9, color: { argb: 'FF475569' } };

  // 7. Signature Area
  currentRow += 2;
  const signRow = currentRow;
  sheet.mergeCells(signRow, 2, signRow, 5);
  const sign1 = sheet.getCell(signRow, 2);
  sign1.value = 'NGƯỜI LẬP BẢNG\n(Ký & ghi rõ họ tên)';
  sign1.font = { bold: true };
  sign1.alignment = { horizontal: 'center', wrapText: true };

  sheet.mergeCells(signRow, colTotalReal - 4, signRow, colTotalReal);
  const sign2 = sheet.getCell(signRow, colTotalReal - 4);
  sign2.value = `Đà Lạt, ngày ${data.totalDays} tháng ${data.month} năm ${data.year}\nGIÁM ĐỐC CARITAS ĐÀ LẠT\n(Ký & đóng dấu)`;
  sign2.font = { bold: true };
  sign2.alignment = { horizontal: 'center', wrapText: true };

  // Set column widths
  sheet.getColumn(1).width = 6;  // STT
  sheet.getColumn(2).width = 12; // Ma NV
  sheet.getColumn(3).width = 24; // Ho ten
  sheet.getColumn(4).width = 20; // Phong ban
  for (let d = 1; d <= data.totalDays; d++) {
    sheet.getColumn(daysStartCol + d - 1).width = 4.2;
  }
  sheet.getColumn(colWorkDays).width = 13;
  sheet.getColumn(colPaidLeave).width = 14;
  sheet.getColumn(colTotalReal).width = 15;
  sheet.getColumn(colLateCount).width = 10;
  sheet.getColumn(colLateMins).width = 10;

  const arrayBuffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(arrayBuffer);
}

/**
 * Generates Detail Log Excel Buffer using ExcelJS
 */
export async function generateAttendanceLogsExcelReport(
  logs: AttendanceLogItem[],
  title: string = 'NHẬT KÝ CHI TIẾT QUẸT THẺ CHẤM CÔNG'
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Caritas Đà Lạt';
  const sheet = workbook.addWorksheet('Nhat_Ky_Quet_The');

  // Title
  sheet.mergeCells('A1:L1');
  const titleCell = sheet.getCell('A1');
  titleCell.value = title.toUpperCase();
  titleCell.font = { bold: true, size: 14, color: { argb: 'FF1E293B' } };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  sheet.getRow(1).height = 30;

  sheet.mergeCells('A2:L2');
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
    'Trạng thái ca',
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
      fgColor: { argb: 'FF0F766E' }, // Teal
    };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = getThinBorder();
  });

  // Data rows
  logs.forEach((item, idx) => {
    const coordDisplay =
      item.latitude && item.longitude
        ? `${item.latitude.toFixed(5)}, ${item.longitude.toFixed(5)}`
        : 'Chưa có GPS';

    const row = sheet.addRow([
      idx + 1,
      item.employeeCode,
      item.fullName,
      item.department,
      item.checkType === 'IN' ? 'VÀO CA (Check-in)' : 'RA CA (Check-out)',
      format(item.serverTime, 'dd/MM/yyyy HH:mm:ss'),
      item.locationAddress || item.nearestLocationName || 'Không xác định',
      coordDisplay,
      item.latitude ? '✓ Đã lấy GPS' : 'Chưa lấy GPS',
      item.isLate
        ? `Trễ ${item.lateMinutes} phút`
        : item.isEarlyLeave
        ? `Về sớm ${item.earlyMinutes} phút`
        : 'Đúng giờ',
      item.notes || '',
      item.imagePath,
    ]);

    row.height = 20;
    row.eachCell((cell, colNum) => {
      cell.border = getThinBorder();
      cell.alignment = { vertical: 'middle' };
      if ([1, 2, 5, 6, 8, 9, 10].includes(colNum)) {
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
      }
      if (colNum === 10 && item.isLate) {
        cell.font = { color: { argb: 'FFD97706' }, bold: true };
      }
    });
  });

  // Column widths
  sheet.getColumn(1).width = 6;
  sheet.getColumn(2).width = 12;
  sheet.getColumn(3).width = 24;
  sheet.getColumn(4).width = 20;
  sheet.getColumn(5).width = 18;
  sheet.getColumn(6).width = 22;
  sheet.getColumn(7).width = 30;
  sheet.getColumn(8).width = 14;
  sheet.getColumn(9).width = 26;
  sheet.getColumn(10).width = 20;
  sheet.getColumn(11).width = 25;
  sheet.getColumn(12).width = 35;

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
