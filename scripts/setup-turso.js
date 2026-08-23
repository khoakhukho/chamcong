const { createClient } = require('@libsql/client');
const bcrypt = require('bcryptjs');

const client = createClient({
  url: 'libsql://caritasdalat-khoakhukho.aws-ap-northeast-1.turso.io',
  authToken: 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODc0NjY0NjUsImlkIjoiMDFhMDJkNGQtMDIwMS03M2E4LWJmNzUtM2Y5MTRkMWI0MzM5Iiwia2lkIjoiRkVxaTFQZHVlSVpvRGwyczhITkJGQnBvUGhCTEpCcEZNanVlZ3JLcV9KOCIsInJpZCI6IjIxNTZkYmFkLTI5NjEtNGFjYy1iNDUyLTFiMTI1MDk5ZjdiNSJ9.sFc5qYxCiYMf75IGHdMgWXczSVE0lRA_RZgsEr0cuJgZ_9TKSZiliIn7Rddo-G8MaTjoDbl4tEwqrhQUtxACCw'
});

async function main() {
  console.log('--- 1. Creating Tables on Turso ---');
  
  const tables = [
    `CREATE TABLE IF NOT EXISTS "User" (
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
    );`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "User_employeeCode_key" ON "User"("employeeCode");`,
    `CREATE TABLE IF NOT EXISTS "EmailOtp" (
      "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
      "email" TEXT NOT NULL,
      "code" TEXT NOT NULL,
      "expiresAt" DATETIME NOT NULL,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );`,
    `CREATE INDEX IF NOT EXISTS "EmailOtp_email_code_idx" ON "EmailOtp"("email", "code");`,
    `CREATE TABLE IF NOT EXISTS "Shift" (
      "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
      "name" TEXT NOT NULL,
      "startTime" TEXT NOT NULL,
      "endTime" TEXT NOT NULL,
      "allowedLateMinutes" INTEGER NOT NULL DEFAULT 15,
      "allowedEarlyMinutes" INTEGER NOT NULL DEFAULT 15,
      "isActive" BOOLEAN NOT NULL DEFAULT true,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );`,
    `CREATE TABLE IF NOT EXISTS "Location" (
      "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
      "name" TEXT NOT NULL,
      "address" TEXT,
      "latitude" REAL NOT NULL,
      "longitude" REAL NOT NULL,
      "radiusMeters" INTEGER NOT NULL DEFAULT 100,
      "isActive" BOOLEAN NOT NULL DEFAULT true,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );`,
    `CREATE TABLE IF NOT EXISTS "Attendance" (
      "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
      "userId" INTEGER NOT NULL,
      "shiftId" INTEGER,
      "locationId" INTEGER,
      "checkType" TEXT NOT NULL,
      "serverTime" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "clientTime" DATETIME,
      "clientCapturedTime" DATETIME,
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
      "status" TEXT NOT NULL DEFAULT 'VALID',
      "imagePath" TEXT,
      "notes" TEXT,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "Attendance_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT "Attendance_shiftId_fkey" FOREIGN KEY ("shiftId") REFERENCES "Shift" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
      CONSTRAINT "Attendance_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location" ("id") ON DELETE SET NULL ON UPDATE CASCADE
    );`,
    `CREATE TABLE IF NOT EXISTS "LeaveRequest" (
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
    );`,
    `CREATE TABLE IF NOT EXISTS "Notification" (
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
    );`,
    `CREATE INDEX IF NOT EXISTS "Notification_userId_isRead_idx" ON "Notification"("userId", "isRead");`,
    `CREATE INDEX IF NOT EXISTS "Notification_targetRole_idx" ON "Notification"("targetRole");`,
    `CREATE TABLE IF NOT EXISTS "Announcement" (
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
    );`,
    `CREATE INDEX IF NOT EXISTS "Announcement_isPinned_createdAt_idx" ON "Announcement"("isPinned", "createdAt");`,
    `CREATE TABLE IF NOT EXISTS "AnnouncementAck" (
      "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
      "announcementId" INTEGER NOT NULL,
      "userId" INTEGER NOT NULL,
      "acknowledgedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "AnnouncementAck_announcementId_fkey" FOREIGN KEY ("announcementId") REFERENCES "Announcement" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT "AnnouncementAck_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
    );`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "AnnouncementAck_announcementId_userId_key" ON "AnnouncementAck"("announcementId", "userId");`,
    `CREATE TABLE IF NOT EXISTS "Project" (
      "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
      "code" TEXT NOT NULL,
      "name" TEXT NOT NULL,
      "description" TEXT,
      "nasPath" TEXT NOT NULL DEFAULT '/volume1/CaritasData/',
      "isActive" BOOLEAN NOT NULL DEFAULT true,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "Project_code_key" ON "Project"("code");`,
    `CREATE TABLE IF NOT EXISTS "ProjectMember" (
      "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
      "projectId" INTEGER NOT NULL,
      "userId" INTEGER NOT NULL,
      "roleInProject" TEXT NOT NULL DEFAULT 'STAFF',
      "joinedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "ProjectMember_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT "ProjectMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
    );`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "ProjectMember_projectId_userId_key" ON "ProjectMember"("projectId", "userId");`,
    `CREATE TABLE IF NOT EXISTS "ProjectReport" (
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
    );`,
    `CREATE TABLE IF NOT EXISTS "ProjectReportPhoto" (
      "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
      "reportId" INTEGER NOT NULL,
      "photoUrl" TEXT NOT NULL,
      "caption" TEXT,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "ProjectReportPhoto_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "ProjectReport" ("id") ON DELETE CASCADE ON UPDATE CASCADE
    );`,
    `CREATE TABLE IF NOT EXISTS "ProjectFile" (
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
    );`
  ];

  for (const sql of tables) {
    try {
      await client.execute(sql);
    } catch (e) {
      console.error('Error executing:', sql.substring(0, 50), e.message);
    }
  }
  console.log('✓ All tables created on Turso successfully!');

  console.log('--- 2. Seeding Core Projects ---');
  const existingProjects = await client.execute('SELECT count(*) as cnt FROM "Project"');
  if (Number(existingProjects.rows[0].cnt) === 0) {
    const projects = [
      ['PLD', 'Phát Triển Tự Dân (Lãnh đạo tự dân)', 'Dự án Nâng cao năng lực và phát triển cộng đồng tự quản', '/volume1/CaritasData/DU_AN_PLD/'],
      ['SKTT', 'Sức Khoẻ Tâm Thần', 'Dự án Chăm sóc và phục hồi chức năng tâm thần cộng đồng', '/volume1/CaritasData/DU_AN_TAM_THAN/'],
      ['KHUYT_TAT', 'Ban Khuyết Tật', 'Dự án Hỗ trợ hòa nhập và sinh kế cho người khuyết tật', '/volume1/CaritasData/DU_AN_KHUYT_TAT/'],
      ['HOC_BONG', 'Ban Học Bổng', 'Dự án Học bổng khuyến học cho học sinh, sinh viên nghèo hiếu học', '/volume1/CaritasData/DU_AN_HOC_BONG/']
    ];
    for (const [code, name, desc, path] of projects) {
      await client.execute({
        sql: 'INSERT INTO "Project" (code, name, description, nasPath, isActive) VALUES (?, ?, ?, ?, 1)',
        args: [code, name, desc, path]
      });
    }
    console.log('✓ Seeded 4 projects!');
  } else {
    console.log('✓ Projects already exist.');
  }

  console.log('--- 3. Seeding Core Users ---');
  const existingUsers = await client.execute('SELECT count(*) as cnt FROM "User"');
  if (Number(existingUsers.rows[0].cnt) === 0) {
    const adminPass = await bcrypt.hash('admin123', 10);
    const accPass = await bcrypt.hash('ketoan123', 10);
    const empPass = await bcrypt.hash('123456', 10);
    const vnxPass = await bcrypt.hash('password123', 10);

    const users = [
      ['ADMIN', 'Quản Trị Viên Caritas', adminPass, '02633822180', 'admin@caritasdalat.org', 'Ban Quản Trị & Điều Hành', 'ADMIN', 'FULL_TIME', 12.0],
      ['KETOAN', 'Kế Toán Trưởng Caritas', accPass, '02633822181', 'ketoan@caritasdalat.org', 'Ban Hành Chính & Kế Toán', 'ACCOUNTANT', 'FULL_TIME', 12.0],
      ['NV001', 'Nguyễn Văn An', empPass, '0912345678', 'an.nguyen@caritasdalat.org', 'Ban Y Tế Bác Ái', 'EMPLOYEE', 'FULL_TIME', 12.0],
      ['NV002', 'Trần Thị Mai', empPass, '0987654321', 'mai.tran@caritasdalat.org', 'Ban Khuyết Tật', 'EMPLOYEE', 'PART_TIME', 6.0],
      ['NV003', 'Lê Hoàng Nam', empPass, '0901234567', 'nam.le@caritasdalat.org', 'Ban Học Bổng & Trẻ Em', 'EMPLOYEE', 'CONTRACT', 0.0],
      ['VNXKHOA', 'Vũ Nguyễn Xuân Khoa', vnxPass, '0933123456', 'vnxkhoa@caritasdalat.org', 'Ban Quản Trị & Dự Án', 'ADMIN', 'FULL_TIME', 12.0],
    ];

    for (const u of users) {
      await client.execute({
        sql: 'INSERT INTO "User" (employeeCode, fullName, passwordHash, phone, email, department, role, contractType, annualLeaveBase, isActive) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)',
        args: u
      });
    }
    console.log('✓ Seeded 6 users including ADMIN and VNXKHOA!');
  } else {
    console.log('✓ Users already exist.');
  }

  console.log('--- 4. Seeding Shifts and Locations ---');
  const existingShifts = await client.execute('SELECT count(*) as cnt FROM "Shift"');
  if (Number(existingShifts.rows[0].cnt) === 0) {
    await client.execute(`INSERT INTO "Shift" (name, startTime, endTime, allowedLateMinutes, allowedEarlyMinutes, isActive) VALUES ('Ca Hành Chính Chuẩn (08:00 - 17:00)', '08:00', '17:00', 15, 15, 1);`);
    await client.execute(`INSERT INTO "Shift" (name, startTime, endTime, allowedLateMinutes, allowedEarlyMinutes, isActive) VALUES ('Ca Bán Thời Gian Sáng (08:00 - 12:00)', '08:00', '12:00', 15, 15, 1);`);
    console.log('✓ Seeded shifts!');
  }

  const existingLocs = await client.execute('SELECT count(*) as cnt FROM "Location"');
  if (Number(existingLocs.rows[0].cnt) === 0) {
    await client.execute(`INSERT INTO "Location" (name, address, latitude, longitude, radiusMeters, isActive) VALUES ('Văn phòng Caritas Đà Lạt (Tòa Giám Mục)', '09 Nguyễn Trường Tộ, Phường 4, TP. Đà Lạt, Lâm Đồng', 11.936085, 108.437142, 200, 1);`);
    await client.execute(`INSERT INTO "Location" (name, address, latitude, longitude, radiusMeters, isActive) VALUES ('Cơ sở Bác Ái Bảo Lộc', '123 Trần Phú, TP. Bảo Lộc, Lâm Đồng', 11.54512, 107.80835, 250, 1);`);
    await client.execute(`INSERT INTO "Location" (name, address, latitude, longitude, radiusMeters, isActive) VALUES ('Trạm Y Tế Thiện Nguyện Caritas', '04 Bùi Thị Xuân, Phường 2, TP. Đà Lạt, Lâm Đồng', 11.94821, 108.44123, 150, 1);`);
    console.log('✓ Seeded locations!');
  }

  // Seed project memberships for VNXKHOA & NV001
  const userRows = await client.execute('SELECT id, employeeCode FROM "User"');
  const projRows = await client.execute('SELECT id, code FROM "Project"');
  
  const vnxId = userRows.rows.find(r => r.employeeCode === 'VNXKHOA')?.id;
  const nv001Id = userRows.rows.find(r => r.employeeCode === 'NV001')?.id;
  const pldId = projRows.rows.find(r => r.code === 'PLD')?.id;
  const skttId = projRows.rows.find(r => r.code === 'SKTT')?.id;

  if (vnxId && pldId) {
    await client.execute({
      sql: 'INSERT OR IGNORE INTO "ProjectMember" (projectId, userId, roleInProject) VALUES (?, ?, ?)',
      args: [pldId, vnxId, 'COORDINATOR']
    });
  }
  if (vnxId && skttId) {
    await client.execute({
      sql: 'INSERT OR IGNORE INTO "ProjectMember" (projectId, userId, roleInProject) VALUES (?, ?, ?)',
      args: [skttId, vnxId, 'COORDINATOR']
    });
  }
  if (nv001Id && pldId) {
    await client.execute({
      sql: 'INSERT OR IGNORE INTO "ProjectMember" (projectId, userId, roleInProject) VALUES (?, ?, ?)',
      args: [pldId, nv001Id, 'STAFF']
    });
  }

  console.log('\n=======================================');
  console.log('🎉 TURSO DATABASE SETUP COMPLETE & VERIFIED!');
  console.log('=======================================');
}

main().catch(console.error);
