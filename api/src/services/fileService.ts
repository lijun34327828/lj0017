import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import sharp from 'sharp';
import type { ImageFile } from '../../../shared/types.js';
import db from '../database/index.js';
import { v4 as uuidv4 } from 'uuid';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const STORAGE_ROOT = path.join(__dirname, '../../storage');
const UPLOADS_DIR = path.join(STORAGE_ROOT, 'uploads');
const CACHE_DIR = path.join(STORAGE_ROOT, 'cache');
const PROCESSED_DIR = path.join(STORAGE_ROOT, 'processed');
const EXPORTS_DIR = path.join(STORAGE_ROOT, 'exports');

[UPLOADS_DIR, CACHE_DIR, PROCESSED_DIR, EXPORTS_DIR].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

export async function saveUploadedFile(
  originalName: string,
  buffer: Buffer,
  mimetype: string
): Promise<ImageFile> {
  const id = uuidv4();
  const ext = path.extname(originalName);
  const filename = `${id}${ext}`;
  const filePath = path.join(UPLOADS_DIR, filename);

  fs.writeFileSync(filePath, buffer);

  let width: number | undefined;
  let height: number | undefined;

  try {
    const metadata = await sharp(buffer).metadata();
    width = metadata.width;
    height = metadata.height;
  } catch (e) {
    console.warn('Could not get image dimensions:', e);
  }

  const imageFile: ImageFile = {
    id,
    originalName,
    filename,
    mimetype,
    size: buffer.length,
    uploadTime: Date.now(),
    width,
    height,
  };

  const stmt = db.prepare(
    'INSERT INTO image_files (id, original_name, filename, mimetype, size, width, height, upload_time) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  );
  stmt.run(
    imageFile.id,
    imageFile.originalName,
    imageFile.filename,
    imageFile.mimetype,
    imageFile.size,
    imageFile.width,
    imageFile.height,
    imageFile.uploadTime
  );

  return imageFile;
}

export function getUploadPath(filename: string): string {
  return path.join(UPLOADS_DIR, filename);
}

export function getProcessedPath(filename: string): string {
  return path.join(PROCESSED_DIR, filename);
}

export function getExportPath(filename: string): string {
  return path.join(EXPORTS_DIR, filename);
}

export function getCachePath(filename: string): string {
  return path.join(CACHE_DIR, filename);
}

export function getImageFile(id: string): ImageFile | null {
  const stmt = db.prepare('SELECT * FROM image_files WHERE id = ?');
  const row = stmt.get(id) as any;
  if (!row) return null;

  return {
    id: row.id,
    originalName: row.original_name,
    filename: row.filename,
    mimetype: row.mimetype,
    size: row.size,
    uploadTime: row.upload_time,
    width: row.width,
    height: row.height,
  };
}

export async function saveProcessedImage(
  taskId: string,
  buffer: Buffer,
  format: string = 'png'
): Promise<string> {
  const filename = `${taskId}_processed.${format}`;
  const filePath = path.join(PROCESSED_DIR, filename);
  fs.writeFileSync(filePath, buffer);
  return filename;
}

export async function exportImage(
  taskId: string,
  buffer: Buffer,
  format: string,
  quality: number
): Promise<string> {
  const id = uuidv4();
  const filename = `${taskId}_${id}.${format}`;
  const filePath = path.join(EXPORTS_DIR, filename);

  let processedBuffer = buffer;
  if (format === 'jpg' || format === 'webp') {
    processedBuffer = await sharp(buffer)
      .jpeg({ quality })
      .toBuffer();
  } else if (format === 'png') {
    processedBuffer = await sharp(buffer).png().toBuffer();
  } else if (format === 'tiff') {
    processedBuffer = await sharp(buffer).tiff().toBuffer();
  }

  fs.writeFileSync(filePath, processedBuffer);
  return filename;
}

export function deleteFile(filePath: string): boolean {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return true;
    }
  } catch (e) {
    console.error('Error deleting file:', e);
  }
  return false;
}
