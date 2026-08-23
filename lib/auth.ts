import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import prisma, { ensureDatabaseReady } from './prisma';

const JWT_SECRET = process.env.JWT_SECRET || 'caritas-dalat-chamcong-secure-jwt-key-2026';
const COOKIE_NAME = 'chamcong_session';

export interface UserSession {
  id: number;
  employeeCode: string;
  fullName: string;
  role: 'ADMIN' | 'ACCOUNTANT' | 'MANAGER' | 'EMPLOYEE';
  department: string | null;
  contractType?: string | null;
  avatarUrl?: string | null;
  email: string | null;
  phone: string | null;
}

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function signToken(payload: UserSession): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '30d' });
}

export function verifyToken(token: string): UserSession | null {
  try {
    return jwt.verify(token, JWT_SECRET) as UserSession;
  } catch {
    return null;
  }
}

export async function getCurrentUser(): Promise<UserSession | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return null;

    const session = verifyToken(token);
    if (!session) return null;

    await ensureDatabaseReady();

    // Verify in DB to ensure user is active and retrieve updated avatar & contractType
    const user = await prisma.user.findUnique({
      where: { id: session.id },
      select: {
        id: true,
        employeeCode: true,
        fullName: true,
        role: true,
        department: true,
        contractType: true,
        avatarUrl: true,
        email: true,
        phone: true,
        isActive: true,
      },
    });

    if (!user || !user.isActive) return null;

    return {
      id: user.id,
      employeeCode: user.employeeCode,
      fullName: user.fullName,
      role: user.role as any,
      department: user.department,
      contractType: user.contractType,
      avatarUrl: user.avatarUrl,
      email: user.email,
      phone: user.phone,
    };
  } catch (error) {
    console.error('getCurrentUser error:', error);
    return null;
  }
}

export async function setSessionCookie(session: UserSession) {
  const token = signToken(session);
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 30 * 24 * 60 * 60, // 30 days
    path: '/',
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}
