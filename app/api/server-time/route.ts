import { NextResponse } from 'next/server';
import { format } from 'date-fns';

export const dynamic = 'force-dynamic';

export async function GET() {
  const now = new Date();
  
  // Format in GMT+7
  const formattedTime = new Intl.DateTimeFormat('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(now);

  return NextResponse.json({
    iso: now.toISOString(),
    timestamp: now.getTime(),
    formattedTime,
  });
}
