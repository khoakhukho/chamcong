import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

// On Vercel Serverless environment, copy seed database to /tmp if needed
if (process.env.VERCEL) {
  const tmpDbPath = '/tmp/chamcong.db';
  if (!fs.existsSync(tmpDbPath)) {
    const candidatePaths = [
      path.join(process.cwd(), 'prisma', 'data', 'chamcong.db'),
      path.join(process.cwd(), 'data', 'chamcong.db'),
      path.join(process.cwd(), 'chamcong.db'),
    ];

    for (const p of candidatePaths) {
      if (fs.existsSync(p)) {
        try {
          fs.copyFileSync(p, tmpDbPath);
          break;
        } catch (e) {
          console.error('Error copying db to /tmp:', e);
        }
      }
    }
  }
  process.env.DATABASE_URL = `file:${tmpDbPath}`;
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;
