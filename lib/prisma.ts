import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';

let dbUrl = process.env.DATABASE_URL || 'file:./data/chamcong.db';

if (process.env.VERCEL) {
  const tmpDbPath = '/tmp/chamcong.db';
  dbUrl = `file:${tmpDbPath}`;
  process.env.DATABASE_URL = dbUrl;
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  isDbInitialized: boolean | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: {
      db: {
        url: dbUrl,
      },
    },
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

/**
 * Self-healing DB initialization function for Vercel Serverless / Fresh Environments
 */
export async function ensureDatabaseReady() {
  if (globalForPrisma.isDbInitialized) return;

  try {
    // 1. Create tables if they don't exist
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "User" (
        "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
        "employeeCode" TEXT NOT NULL,
        "fullName" TEXT NOT NULL,
        "passwordHash" TEXT NOT NULL,
        "phone" TEXT,
        "email" TEXT,
        "department" TEXT,
        "role" TEXT NOT NULL DEFAULT 'EMPLOYEE',
        "contractType" TEXT NOT NULL DEFAULT 'FULL_TIME',
        "joinDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "annualLeaveBase" REAL NOT NULL DEFAULT 12.0,
        "avatarUrl" TEXT,
        "telegramId" TEXT,
        "isActive" BOOLEAN NOT NULL DEFAULT true,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await prisma.$executeRawUnsafe(`
      CREATE UNIQUE INDEX IF NOT EXISTS "User_employeeCode_key" ON "User"("employeeCode");
    `);

    // Column migrations if table already existed without new columns
    try {
      await prisma.$executeRawUnsafe(`ALTER TABLE "User" ADD COLUMN "contractType" TEXT NOT NULL DEFAULT 'FULL_TIME';`);
    } catch {}
    try {
      await prisma.$executeRawUnsafe(`ALTER TABLE "User" ADD COLUMN "joinDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP;`);
    } catch {}
    try {
      await prisma.$executeRawUnsafe(`ALTER TABLE "User" ADD COLUMN "annualLeaveBase" REAL NOT NULL DEFAULT 12.0;`);
    } catch {}
    try {
      await prisma.$executeRawUnsafe(`ALTER TABLE "User" ADD COLUMN "avatarUrl" TEXT;`);
    } catch {}

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "EmailOtp" (
        "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
        "email" TEXT NOT NULL,
        "code" TEXT NOT NULL,
        "expiresAt" DATETIME NOT NULL,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);
    try {
      await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "EmailOtp_email_code_idx" ON "EmailOtp"("email", "code");`);
    } catch {}

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Shift" (
        "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
        "name" TEXT NOT NULL,
        "startTime" TEXT NOT NULL,
        "endTime" TEXT NOT NULL,
        "allowedLateMinutes" INTEGER NOT NULL DEFAULT 15,
        "allowedEarlyMinutes" INTEGER NOT NULL DEFAULT 15,
        "isActive" BOOLEAN NOT NULL DEFAULT true,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Location" (
        "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
        "name" TEXT NOT NULL,
        "address" TEXT,
        "latitude" REAL NOT NULL,
        "longitude" REAL NOT NULL,
        "radiusMeters" INTEGER NOT NULL DEFAULT 100,
        "isActive" BOOLEAN NOT NULL DEFAULT true,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Attendance" (
        "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
        "userId" INTEGER NOT NULL,
        "shiftId" INTEGER,
        "checkType" TEXT NOT NULL,
        "serverTime" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "clientTime" DATETIME,
        "latitude" REAL,
        "longitude" REAL,
        "locationAddress" TEXT,
        "nearestLocationName" TEXT,
        "distanceMeters" REAL,
        "isValidLocation" BOOLEAN NOT NULL DEFAULT true,
        "isLate" BOOLEAN NOT NULL DEFAULT false,
        "lateMinutes" INTEGER NOT NULL DEFAULT 0,
        "isEarlyLeave" BOOLEAN NOT NULL DEFAULT false,
        "earlyMinutes" INTEGER NOT NULL DEFAULT 0,
        "imagePath" TEXT NOT NULL,
        "notes" TEXT,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "Attendance_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT "Attendance_shiftId_fkey" FOREIGN KEY ("shiftId") REFERENCES "Shift" ("id") ON DELETE SET NULL ON UPDATE CASCADE
      );
    `);

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "LeaveRequest" (
        "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
        "userId" INTEGER NOT NULL,
        "leaveType" TEXT NOT NULL,
        "fromDate" DATETIME NOT NULL,
        "toDate" DATETIME NOT NULL,
        "daysCount" REAL NOT NULL DEFAULT 1.0,
        "reason" TEXT NOT NULL,
        "status" TEXT NOT NULL DEFAULT 'PENDING',
        "approvedById" INTEGER,
        "reviewNotes" TEXT,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "LeaveRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT "LeaveRequest_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
      );
    `);

    // 2. Check if admin user exists, if not seed default users & locations
    const userCount = await prisma.user.count();
    if (userCount === 0) {
      const adminPass = await bcrypt.hash('admin123', 10);
      const accPass = await bcrypt.hash('ketoan123', 10);
      const empPass = await bcrypt.hash('123456', 10);

      await prisma.user.createMany({
        data: [
          {
            employeeCode: 'ADMIN',
            fullName: 'Quản Trị Viên Caritas',
            passwordHash: adminPass,
            phone: '02633822180',
            email: 'admin@caritasdalat.org',
            department: 'Ban Quản Trị & Điều Hành',
            role: 'ADMIN',
            contractType: 'FULL_TIME',
            annualLeaveBase: 12.0,
            isActive: true,
          },
          {
            employeeCode: 'KETOAN',
            fullName: 'Kế Toán Trưởng Caritas',
            passwordHash: accPass,
            phone: '02633822181',
            email: 'ketoan@caritasdalat.org',
            department: 'Ban Hành Chính & Kế Toán',
            role: 'ACCOUNTANT',
            contractType: 'FULL_TIME',
            annualLeaveBase: 12.0,
            isActive: true,
          },
          {
            employeeCode: 'NV001',
            fullName: 'Nguyễn Văn An',
            passwordHash: empPass,
            phone: '0912345678',
            email: 'an.nguyen@caritasdalat.org',
            department: 'Ban Y Tế Bác Ái',
            role: 'EMPLOYEE',
            contractType: 'FULL_TIME',
            annualLeaveBase: 12.0,
            isActive: true,
          },
          {
            employeeCode: 'NV002',
            fullName: 'Trần Thị Mai',
            passwordHash: empPass,
            phone: '0987654321',
            email: 'mai.tran@caritasdalat.org',
            department: 'Ban Khuyết Tật',
            role: 'EMPLOYEE',
            contractType: 'PART_TIME',
            annualLeaveBase: 6.0,
            isActive: true,
          },
          {
            employeeCode: 'NV003',
            fullName: 'Lê Hoàng Nam',
            passwordHash: empPass,
            phone: '0901234567',
            email: 'nam.le@caritasdalat.org',
            department: 'Ban Học Bổng & Trẻ Em',
            role: 'EMPLOYEE',
            contractType: 'CONTRACT',
            annualLeaveBase: 0.0,
            isActive: true,
          },
        ],
      });

      await prisma.shift.createMany({
        data: [
          {
            name: 'Ca Hành Chính Chuẩn (08:00 - 17:00)',
            startTime: '08:00',
            endTime: '17:00',
            allowedLateMinutes: 15,
            allowedEarlyMinutes: 15,
            isActive: true,
          },
          {
            name: 'Ca Bán Thời Gian Sáng (08:00 - 12:00)',
            startTime: '08:00',
            endTime: '12:00',
            allowedLateMinutes: 15,
            allowedEarlyMinutes: 15,
            isActive: true,
          },
        ],
      });

      await prisma.location.createMany({
        data: [
          {
            name: 'Văn phòng Caritas Đà Lạt (Tòa Giám Mục)',
            address: '09 Nguyễn Trường Tộ, Phường 4, TP. Đà Lạt, Lâm Đồng',
            latitude: 11.936085,
            longitude: 108.437142,
            radiusMeters: 200,
            isActive: true,
          },
          {
            name: 'Cơ sở Bác Ái Bảo Lộc',
            address: '123 Trần Phú, TP. Bảo Lộc, Lâm Đồng',
            latitude: 11.54512,
            longitude: 107.80835,
            radiusMeters: 250,
            isActive: true,
          },
          {
            name: 'Trạm Y Tế Thiện Nguyện Caritas',
            address: '04 Bùi Thị Xuân, Phường 2, TP. Đà Lạt, Lâm Đồng',
            latitude: 11.94821,
            longitude: 108.44123,
            radiusMeters: 150,
            isActive: true,
          },
        ],
      });
    }

    globalForPrisma.isDbInitialized = true;
  } catch (err) {
    console.error('ensureDatabaseReady error:', err);
  }
}

export default prisma;
