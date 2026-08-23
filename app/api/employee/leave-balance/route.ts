import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { calculateUserLeaveBalances } from '@/lib/leave-calculator';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });
    }

    const balances = await calculateUserLeaveBalances(user.id);

    return NextResponse.json({
      success: true,
      balances,
    });
  } catch (error: any) {
    console.error('leave-balance error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
