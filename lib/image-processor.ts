import fs from 'fs/promises';
import path from 'path';
import sharp from 'sharp';

const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads';

export interface SaveImageResult {
  filePath: string;
  urlPath: string;
  sizeBytes: number;
}

export async function processAndSaveAttendanceImage(
  base64Data: string,
  userId: number
): Promise<SaveImageResult> {
  // Strip data URL prefix if present
  const base64Clean = base64Data.replace(/^data:image\/\w+;base64,/, '');
  const buffer = Buffer.from(base64Clean, 'base64');

  // Process & compress with Sharp: max width 800px, quality 80 webp
  const processedBuffer = await sharp(buffer)
    .resize({
      width: 800,
      height: 800,
      fit: 'inside',
      withoutEnlargement: true,
    })
    .webp({ quality: 80 })
    .toBuffer();

  const now = new Date();
  const year = now.getFullYear().toString();
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const randomSuffix = Math.random().toString(36).substring(2, 8);
  const fileName = `att_user${userId}_${Date.now()}_${randomSuffix}.webp`;

  // If running on Vercel (read-only filesystem except /tmp), return optimized WebP data URL
  if (process.env.VERCEL) {
    const webpBase64 = `data:image/webp;base64,${processedBuffer.toString('base64')}`;
    return {
      filePath: '/tmp/' + fileName,
      urlPath: webpBase64,
      sizeBytes: processedBuffer.length,
    };
  }

  // On Standard Node.js / Synology NAS Docker Server: Save to disk volume
  try {
    const targetDir = path.join(process.cwd(), UPLOAD_DIR, year, month);
    await fs.mkdir(targetDir, { recursive: true });

    const absoluteFilePath = path.join(targetDir, fileName);
    await fs.writeFile(absoluteFilePath, processedBuffer);

    const urlPath = `/uploads/${year}/${month}/${fileName}`;

    return {
      filePath: absoluteFilePath,
      urlPath,
      sizeBytes: processedBuffer.length,
    };
  } catch (err) {
    console.warn('Filesystem write failed, falling back to base64 data URL:', err);
    return {
      filePath: fileName,
      urlPath: `data:image/webp;base64,${processedBuffer.toString('base64')}`,
      sizeBytes: processedBuffer.length,
    };
  }
}
