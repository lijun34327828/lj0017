import { Request, Response } from 'express';
import multer from 'multer';
import { saveUploadedFile, getUploadPath } from '../services/fileService.js';
import path from 'path';
import fs from 'fs';

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/tiff', 'image/webp', 'image/bmp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('不支持的文件格式'));
    }
  },
});

export const uploadMiddleware = upload.array('images', 20);

export async function handleUpload(req: Request, res: Response) {
  try {
    if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
      return res.status(400).json({ success: false, error: '没有上传文件' });
    }

    const results = [];
    for (const file of req.files) {
      const imageFile = await saveUploadedFile(
        file.originalname,
        file.buffer,
        file.mimetype
      );
      results.push(imageFile);
    }

    res.json({
      success: true,
      data: results,
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '上传失败',
    });
  }
}

export function getUploadedFile(req: Request, res: Response) {
  const { filename } = req.params;
  const filePath = getUploadPath(filename);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ success: false, error: '文件不存在' });
  }

  const ext = path.extname(filename).toLowerCase();
  const contentTypeMap: Record<string, string> = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.tiff': 'image/tiff',
    '.tif': 'image/tiff',
    '.webp': 'image/webp',
    '.bmp': 'image/bmp',
  };

  const contentType = contentTypeMap[ext] || 'application/octet-stream';
  res.setHeader('Content-Type', contentType);

  const stream = fs.createReadStream(filePath);
  stream.pipe(res);
}
