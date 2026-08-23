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

  const now = new Date();
  const year = now.getFullYear().toString();
  const month = (now.getMonth() + 1).toString().padStart(2, '0');

  // Subfolder by Year/Month
  const targetDir = path.join(process.cwd(), UPLOAD_DIR, year, month);
  await fs.mkdir(targetDir, { recursive: true });

  const randomSuffix = Math.random().toString(36).substring(2, 8);
  const fileName = `att_user${userId}_${Date.now()}_${randomSuffix}.webp`;
  const absoluteFilePath = path.join(targetDir, fileName);

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

  await fs.writeFile(absoluteFilePath, processedBuffer);

  const urlPath = `/uploads/${year}/${month}/${fileName}`;

  return {
    filePath: absoluteFilePath,
    urlPath,
    sizeBytes: processedBuffer.length,
  };
}
