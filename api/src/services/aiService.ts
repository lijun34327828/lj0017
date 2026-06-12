import sharp from 'sharp';
import { RepairOptions, PreprocessConfig } from '../../../shared/types.js';

export async function simulateAIRepair(
  originalBuffer: Buffer,
  options: RepairOptions,
  preprocess: PreprocessConfig,
  onProgress: (progress: number, message: string) => Promise<void> | void
): Promise<Buffer> {
  const totalSteps = options.modes.length + 1;
  let currentStep = 0;

  await onProgress(5, '正在加载图像...');
  await delay(500, onProgress);

  let image = sharp(originalBuffer);

  if (preprocess.rotation !== 0) {
    currentStep++;
    await onProgress(Math.floor((currentStep / totalSteps) * 20 + 10), '正在应用旋转...');
    image = image.rotate(preprocess.rotation);
    await delay(300, onProgress);
  }

  if (preprocess.crop) {
    currentStep++;
    await onProgress(Math.floor((currentStep / totalSteps) * 20 + 10), '正在裁剪图像...');
    const { x, y, width, height } = preprocess.crop;
    image = image.extract({ left: x, top: y, width, height });
    await delay(300, onProgress);
  }

  if (preprocess.spotRemoval && preprocess.spotRemoval.length > 0) {
    currentStep++;
    await onProgress(Math.floor((currentStep / totalSteps) * 20 + 10), '正在去除污点...');
    await delay(400, onProgress);
  }

  let buffer = await image.toBuffer();

  if (options.modes.includes('scratch')) {
    currentStep++;
    await onProgress(Math.floor((currentStep / totalSteps) * 80 + 10), '正在去除划痕...');
    buffer = await simulateScratchRemoval(buffer);
    await delay(800, onProgress);
  }

  if (options.modes.includes('damage')) {
    currentStep++;
    await onProgress(Math.floor((currentStep / totalSteps) * 80 + 10), '正在修补破损区域...');
    buffer = await simulateDamageRepair(buffer);
    await delay(1000, onProgress);
  }

  if (options.modes.includes('enhance')) {
    currentStep++;
    await onProgress(Math.floor((currentStep / totalSteps) * 80 + 10), '正在高清放大...');
    buffer = await simulateEnhancement(buffer, options.upscaleFactor);
    await delay(1200, onProgress);
  }

  if (options.modes.includes('colorize')) {
    currentStep++;
    await onProgress(Math.floor((currentStep / totalSteps) * 80 + 10), '正在智能上色...');
    buffer = await simulateColorization(buffer, options.colorizationStyle || 'natural');
    await delay(1500, onProgress);
  }

  if (options.modes.includes('comprehensive')) {
    currentStep++;
    await onProgress(Math.floor((currentStep / totalSteps) * 80 + 10), '正在进行综合修复...');
    buffer = await simulateComprehensiveRepair(buffer, options);
    await delay(2000, onProgress);
  }

  if (options.preserveStyle) {
    await onProgress(90, '正在保留原始光影风格...');
    buffer = await preserveOriginalStyle(buffer, originalBuffer);
    await delay(500, onProgress);
  }

  await onProgress(95, '正在生成最终图像...');
  await delay(300, onProgress);

  await onProgress(100, '修复完成！');
  return buffer;
}

async function delay(
  ms: number,
  onProgress?: (progress: number, message: string) => Promise<void> | void
): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < ms) {
    const remaining = ms - (Date.now() - start);
    const step = Math.min(remaining, 100);
    await new Promise((resolve) => setTimeout(resolve, step));
    if (onProgress) {
      await onProgress(-1, '');
    }
  }
}

async function simulateScratchRemoval(buffer: Buffer): Promise<Buffer> {
  return sharp(buffer)
    .median(1)
    .sharpen(0.5, 1, 1)
    .toBuffer();
}

async function simulateDamageRepair(buffer: Buffer): Promise<Buffer> {
  return sharp(buffer)
    .modulate({ brightness: 1.03, saturation: 1.05 })
    .sharpen(1, 0.5, 0.5)
    .toBuffer();
}

async function simulateEnhancement(buffer: Buffer, factor: number): Promise<Buffer> {
  const metadata = await sharp(buffer).metadata();
  const width = metadata.width || 1000;
  const height = metadata.height || 800;

  return sharp(buffer)
    .resize(Math.round(width * factor), Math.round(height * factor), {
      kernel: sharp.kernel.lanczos3,
    })
    .sharpen(1.5, 1, 2)
    .modulate({ saturation: 1.1 })
    .toBuffer();
}

async function simulateColorization(
  buffer: Buffer,
  style: 'natural' | 'vintage' | 'vivid'
): Promise<Buffer> {
  let saturation = 1.2;
  let hue = 0;

  switch (style) {
    case 'vintage':
      saturation = 0.9;
      hue = 5;
      break;
    case 'vivid':
      saturation = 1.5;
      hue = -5;
      break;
    default:
      saturation = 1.2;
  }

  const temp = await sharp(buffer).toColourspace('srgb').toBuffer();

  return sharp(temp)
    .modulate({ saturation, hue })
    .tint({ r: 245, g: 240, b: 230 })
    .modulate({ brightness: 1.02 })
    .toBuffer();
}

async function simulateComprehensiveRepair(
  buffer: Buffer,
  options: RepairOptions
): Promise<Buffer> {
  let result = sharp(buffer);

  result = result
    .median(1)
    .modulate({ brightness: 1.05, saturation: 1.15 })
    .sharpen(1.2, 0.8, 1.5);

  if (options.upscaleFactor > 1) {
    const metadata = await sharp(buffer).metadata();
    const width = metadata.width || 1000;
    const height = metadata.height || 800;
    result = result.resize(
      Math.round(width * options.upscaleFactor),
      Math.round(height * options.upscaleFactor),
      { kernel: sharp.kernel.lanczos3 }
    );
  }

  return result.toBuffer();
}

async function preserveOriginalStyle(processed: Buffer, original: Buffer): Promise<Buffer> {
  const originalMeta = await sharp(original).metadata();
  const processedImg = sharp(processed);

  if (originalMeta.space === 'b-w' || originalMeta.space === 'bw') {
    return processedImg
      .modulate({ saturation: 0 })
      .toBuffer();
  }

  return processed;
}
