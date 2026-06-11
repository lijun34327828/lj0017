import sharp from 'sharp';
import { Adjustments } from '../../../shared/types.js';

export async function applyAdjustments(
  buffer: Buffer,
  adjustments: Adjustments
): Promise<Buffer> {
  let image = sharp(buffer);

  const brightness = 1 + adjustments.brightness / 100;
  const contrast = 1 + adjustments.contrast / 100;
  const saturation = 1 + (adjustments.saturation || 0) / 100;

  image = image.modulate({
    brightness,
    saturation,
  });

  if (adjustments.contrast !== 0) {
    image = image.linear(contrast, -(128 * (contrast - 1)));
  }

  if (adjustments.sharpness !== 0) {
    const sigma = Math.abs(adjustments.sharpness) / 20;
    image = image.sharpen(
      Math.max(0.5, sigma),
      1,
      adjustments.sharpness > 0 ? 2 : 0
    );
  }

  return image.toBuffer();
}

export async function convertFormat(
  buffer: Buffer,
  format: 'jpg' | 'png' | 'webp' | 'tiff',
  quality: number = 90
): Promise<Buffer> {
  switch (format) {
    case 'jpg':
      return sharp(buffer).jpeg({ quality, mozjpeg: true }).toBuffer();
    case 'png':
      return sharp(buffer).png({ compressionLevel: 6 }).toBuffer();
    case 'webp':
      return sharp(buffer).webp({ quality, lossless: false }).toBuffer();
    case 'tiff':
      return sharp(buffer).tiff({ quality, compression: 'lzw' }).toBuffer();
    default:
      return buffer;
  }
}

export async function getImageDimensions(buffer: Buffer): Promise<{ width: number; height: number }> {
  const metadata = await sharp(buffer).metadata();
  return {
    width: metadata.width || 0,
    height: metadata.height || 0,
  };
}

export async function generateThumbnail(buffer: Buffer, size: number = 200): Promise<Buffer> {
  return sharp(buffer)
    .resize(size, size, {
      fit: 'inside',
      withoutEnlargement: true,
    })
    .jpeg({ quality: 80 })
    .toBuffer();
}
