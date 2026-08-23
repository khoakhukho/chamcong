import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding for CHAMCONG (Caritas Đà Lạt)...');

  // 1. Create Shifts
  const defaultShift = await prisma.shift.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      name: 'Ca Hành Chính Chuẩn (08:00 - 17:00)',
      startTime: '08:00',
      endTime: '17:00',
      allowedLateMinutes: 15,
      allowedEarlyMinutes: 15,
      isActive: true,
    },
  });

  const partTimeShift = await prisma.shift.upsert({
    where: { id: 2 },
    update: {},
    create: {
      id: 2,
      name: 'Ca Sáng Bán Thời Gian (08:00 - 12:00)',
      startTime: '08:00',
      endTime: '12:00',
      allowedLateMinutes: 10,
      allowedEarlyMinutes: 10,
      isActive: true,
    },
  });

  console.log('✅ Shifts initialized:', [defaultShift.name, partTimeShift.name]);

  // 2. Create Locations
  const loc1 = await prisma.location.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      name: 'Văn phòng Caritas Đà Lạt (Tòa Giám Mục)',
      address: '09 Nguyễn Trường Tộ, Phường 4, TP. Đà Lạt, Lâm Đồng',
      latitude: 11.936085,
      longitude: 108.437142,
      radiusMeters: 200,
      isActive: true,
    },
  });

  const loc2 = await prisma.location.upsert({
    where: { id: 2 },
    update: {},
    create: {
      id: 2,
      name: 'Cơ sở Bác Ái Bảo Lộc',
      address: '123 Trần Phú, TP. Bảo Lộc, Lâm Đồng',
      latitude: 11.54512,
      longitude: 107.80835,
      radiusMeters: 250,
      isActive: true,
    },
  });

  const loc3 = await prisma.location.upsert({
    where: { id: 3 },
    update: {},
    create: {
      id: 3,
      name: 'Trạm Y Tế Thiện Nguyện Caritas',
      address: '04 Bùi Thị Xuân, Phường 2, TP. Đà Lạt, Lâm Đồng',
      latitude: 11.94821,
      longitude: 108.44123,
      radiusMeters: 150,
      isActive: true,
    },
  });

  console.log('✅ Locations initialized:', [loc1.name, loc2.name, loc3.name]);

  // 3. Create Users
  const adminPassword = await bcrypt.hash('admin123', 10);
  const employeePassword = await bcrypt.hash('123456', 10);

  const admin = await prisma.user.upsert({
    where: { employeeCode: 'ADMIN' },
    update: {
      passwordHash: adminPassword,
    },
    create: {
      employeeCode: 'ADMIN',
      fullName: 'Quản Trị Viên Caritas',
      passwordHash: adminPassword,
      phone: '02633822180',
      email: 'admin@caritasdalat.org',
      department: 'Ban Quản Trị & Điều Hành',
      role: 'ADMIN',
      isActive: true,
    },
  });

  const emp1 = await prisma.user.upsert({
    where: { employeeCode: 'NV001' },
    update: {
      passwordHash: employeePassword,
    },
    create: {
      employeeCode: 'NV001',
      fullName: 'Nguyễn Văn An',
      passwordHash: employeePassword,
      phone: '0912345678',
      email: 'an.nguyen@caritasdalat.org',
      department: 'Ban Y Tế Bác Ái',
      role: 'EMPLOYEE',
      isActive: true,
    },
  });

  const emp2 = await prisma.user.upsert({
    where: { employeeCode: 'NV002' },
    update: {
      passwordHash: employeePassword,
    },
    create: {
      employeeCode: 'NV002',
      fullName: 'Trần Thị Mai',
      passwordHash: employeePassword,
      phone: '0987654321',
      email: 'mai.tran@caritasdalat.org',
      department: 'Ban Khuyết Tật',
      role: 'EMPLOYEE',
      isActive: true,
    },
  });

  const emp3 = await prisma.user.upsert({
    where: { employeeCode: 'NV003' },
    update: {
      passwordHash: employeePassword,
    },
    create: {
      employeeCode: 'NV003',
      fullName: 'Lê Hoàng Nam',
      passwordHash: employeePassword,
      phone: '0901234567',
      email: 'nam.le@caritasdalat.org',
      department: 'Ban Học Bổng & Trẻ Em',
      role: 'EMPLOYEE',
      isActive: true,
    },
  });

  console.log('✅ Users initialized:');
  console.log('   - Admin: ADMIN / admin123');
  console.log('   - Employee 1: NV001 / 123456 (Nguyễn Văn An)');
  console.log('   - Employee 2: NV002 / 123456 (Trần Thị Mai)');
  console.log('   - Employee 3: NV003 / 123456 (Lê Hoàng Nam)');

  console.log('🎉 Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
