import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path: segments } = await params;
    const uploadDir = process.env.UPLOAD_DIR || './uploads';
    const filePath = path.join(process.cwd(), uploadDir, ...segments);

    // Prevent directory traversal attacks
    const normalized = path.normalize(filePath);
    const rootUploads = path.resolve(process.cwd(), uploadDir);
    if (!normalized.startsWith(rootUploads)) {
      return new NextResponse('Forbidden', { status: 403 });
    }

    const fileBuffer = await fs.readFile(normalized);

    return new NextResponse(new Uint8Array(fileBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'image/webp',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch {
    return new NextResponse('Image not found', { status: 404 });
  }
}
