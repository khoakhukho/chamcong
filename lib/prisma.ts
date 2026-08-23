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

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Notification" (
        "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
        "userId" INTEGER,
        "targetRole" TEXT,
        "title" TEXT NOT NULL,
        "content" TEXT NOT NULL,
        "type" TEXT NOT NULL,
        "link" TEXT,
        "isRead" BOOLEAN NOT NULL DEFAULT false,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
      );
    `);
    try {
      await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "Notification_userId_isRead_idx" ON "Notification"("userId", "isRead");`);
    } catch {}
    try {
      await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "Notification_targetRole_idx" ON "Notification"("targetRole");`);
    } catch {}

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Announcement" (
        "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
        "title" TEXT NOT NULL,
        "content" TEXT NOT NULL,
        "category" TEXT NOT NULL DEFAULT 'GENERAL',
        "isPinned" BOOLEAN NOT NULL DEFAULT false,
        "requireAck" BOOLEAN NOT NULL DEFAULT true,
        "createdById" INTEGER NOT NULL,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "Announcement_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
      );
    `);
    try {
      await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "Announcement_isPinned_createdAt_idx" ON "Announcement"("isPinned", "createdAt");`);
    } catch {}

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "AnnouncementAck" (
        "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
        "announcementId" INTEGER NOT NULL,
        "userId" INTEGER NOT NULL,
        "acknowledgedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "AnnouncementAck_announcementId_fkey" FOREIGN KEY ("announcementId") REFERENCES "Announcement" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT "AnnouncementAck_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
      );
    `);
    try {
      await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "AnnouncementAck_announcementId_userId_key" ON "AnnouncementAck"("announcementId", "userId");`);
    } catch {}
    try {
      await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "AnnouncementAck_announcementId_idx" ON "AnnouncementAck"("announcementId");`);
    } catch {}
    try {
      await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "AnnouncementAck_userId_idx" ON "AnnouncementAck"("userId");`);
    } catch {}

    // Phase 1: Projects DDL
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Project" (
        "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
        "code" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "description" TEXT,
        "nasPath" TEXT NOT NULL DEFAULT '/volume1/CaritasData/',
        "isActive" BOOLEAN NOT NULL DEFAULT true,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);
    try {
      await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "Project_code_key" ON "Project"("code");`);
    } catch {}

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "ProjectMember" (
        "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
        "projectId" INTEGER NOT NULL,
        "userId" INTEGER NOT NULL,
        "roleInProject" TEXT NOT NULL DEFAULT 'STAFF',
        "joinedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "ProjectMember_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT "ProjectMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
      );
    `);
    try {
      await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "ProjectMember_projectId_userId_key" ON "ProjectMember"("projectId", "userId");`);
    } catch {}
    try {
      await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "ProjectMember_projectId_idx" ON "ProjectMember"("projectId");`);
    } catch {}
    try {
      await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "ProjectMember_userId_idx" ON "ProjectMember"("userId");`);
    } catch {}

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "ProjectReport" (
        "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
        "projectId" INTEGER NOT NULL,
        "userId" INTEGER NOT NULL,
        "month" INTEGER NOT NULL,
        "year" INTEGER NOT NULL,
        "title" TEXT NOT NULL,
        "summary" TEXT,
        "wordDocUrl" TEXT,
        "wordDocName" TEXT,
        "wordDocSize" INTEGER,
        "status" TEXT NOT NULL DEFAULT 'SUBMITTED',
        "approvedById" INTEGER,
        "reviewNotes" TEXT,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "ProjectReport_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT "ProjectReport_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT "ProjectReport_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
      );
    `);
    try {
      await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "ProjectReport_projectId_year_month_idx" ON "ProjectReport"("projectId", "year", "month");`);
    } catch {}
    try {
      await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "ProjectReport_userId_idx" ON "ProjectReport"("userId");`);
    } catch {}

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "ProjectReportPhoto" (
        "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
        "reportId" INTEGER NOT NULL,
        "photoUrl" TEXT NOT NULL,
        "caption" TEXT,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "ProjectReportPhoto_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "ProjectReport" ("id") ON DELETE CASCADE ON UPDATE CASCADE
      );
    `);
    try {
      await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "ProjectReportPhoto_reportId_idx" ON "ProjectReportPhoto"("reportId");`);
    } catch {}

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "ProjectFile" (
        "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
        "projectId" INTEGER NOT NULL,
        "uploadedById" INTEGER NOT NULL,
        "fileName" TEXT NOT NULL,
        "fileUrl" TEXT NOT NULL,
        "fileType" TEXT NOT NULL DEFAULT 'DOCUMENT',
        "fileSize" INTEGER NOT NULL DEFAULT 0,
        "month" INTEGER,
        "year" INTEGER,
        "category" TEXT NOT NULL DEFAULT 'GENERAL',
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "ProjectFile_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT "ProjectFile_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
      );
    `);
    try {
      await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "ProjectFile_projectId_year_month_idx" ON "ProjectFile"("projectId", "year", "month");`);
    } catch {}

    // Seed 4 Core Projects
    const projectCount = await prisma.project.count();
    if (projectCount === 0) {
      await prisma.project.createMany({
        data: [
          {
            code: 'PLD',
            name: 'Phát Triển Tự Dân (Lãnh đạo tự dân)',
            description: 'Dự án Nâng cao năng lực và phát triển cộng đồng tự quản',
            nasPath: '/volume1/CaritasData/DU_AN_PLD/',
            isActive: true,
          },
          {
            code: 'SKTT',
            name: 'Sức Khoẻ Tâm Thần',
            description: 'Dự án Chăm sóc và phục hồi chức năng tâm thần cộng đồng',
            nasPath: '/volume1/CaritasData/DU_AN_TAM_THAN/',
            isActive: true,
          },
          {
            code: 'KHUYT_TAT',
            name: 'Ban Khuyết Tật',
            description: 'Dự án Hỗ trợ hòa nhập và sinh kế cho người khuyết tật',
            nasPath: '/volume1/CaritasData/DU_AN_KHUYT_TAT/',
            isActive: true,
          },
          {
            code: 'HOC_BONG',
            name: 'Ban Học Bổng',
            description: 'Dự án Học bổng khuyến học cho học sinh, sinh viên nghèo hiếu học',
            nasPath: '/volume1/CaritasData/DU_AN_HOC_BONG/',
            isActive: true,
          },
        ],
      });
    }

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
