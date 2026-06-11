import { Request, Response } from 'express';
import { createTask, getTask, getTaskList, deleteTask as deleteTaskFromDb, createExportRecord } from '../services/taskService.js';
import { getImageFile, getProcessedPath, getUploadPath, exportImage } from '../services/fileService.js';
import { addToQueue, pauseTask, resumeTask, retryTask, getQueueStatus } from '../queue/processor.js';
import { CreateTaskRequest, ExportOptions, HistoryFilter } from '../../../shared/types.js';
import fs from 'fs';
import { applyAdjustments } from '../services/imageService.js';
import path from 'path';

export function createRepairTask(req: Request, res: Response) {
  try {
    const request = req.body as CreateTaskRequest;

    const image = getImageFile(request.imageId);
    if (!image) {
      return res.status(404).json({ success: false, error: '图片不存在' });
    }

    const task = createTask(request, image);
    addToQueue(task);

    res.json({
      success: true,
      data: task,
    });
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '创建任务失败',
    });
  }
}

export function getTaskById(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const task = getTask(id);

    if (!task) {
      return res.status(404).json({ success: false, error: '任务不存在' });
    }

    res.json({
      success: true,
      data: task,
    });
  } catch (error) {
    console.error('Get task error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '获取任务失败',
    });
  }
}

export function listTasks(req: Request, res: Response) {
  try {
    const { status, dateFrom, dateTo, search, limit = '50', offset = '0' } = req.query;

    const filter: HistoryFilter = {};
    if (status) filter.status = status as any;
    if (dateFrom) filter.dateFrom = Number(dateFrom);
    if (dateTo) filter.dateTo = Number(dateTo);
    if (search) filter.search = String(search);

    const result = getTaskList(filter, Number(limit), Number(offset));

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('List tasks error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '获取任务列表失败',
    });
  }
}

export function pauseTaskById(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const success = pauseTask(id);

    if (!success) {
      return res.status(404).json({ success: false, error: '任务不存在或无法暂停' });
    }

    res.json({ success: true, message: '任务已暂停' });
  } catch (error) {
    console.error('Pause task error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '暂停任务失败',
    });
  }
}

export function resumeTaskById(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const success = resumeTask(id);

    if (!success) {
      return res.status(404).json({ success: false, error: '任务不存在或无法恢复' });
    }

    res.json({ success: true, message: '任务已恢复' });
  } catch (error) {
    console.error('Resume task error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '恢复任务失败',
    });
  }
}

export function retryTaskById(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const task = getTask(id);

    if (!task) {
      return res.status(404).json({ success: false, error: '任务不存在' });
    }

    retryTask(task);

    res.json({ success: true, message: '任务已重新加入队列' });
  } catch (error) {
    console.error('Retry task error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '重试任务失败',
    });
  }
}

export function deleteTask(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const task = getTask(id);

    if (!task) {
      return res.status(404).json({ success: false, error: '任务不存在' });
    }

    const uploadPath = getUploadPath(task.image.filename);
    if (fs.existsSync(uploadPath)) {
      fs.unlinkSync(uploadPath);
    }

    if (task.processedUrl) {
      const processedFilename = task.processedUrl.split('/').pop();
      if (processedFilename) {
        const processedPath = getProcessedPath(processedFilename);
        if (fs.existsSync(processedPath)) {
          fs.unlinkSync(processedPath);
        }
      }
    }

    deleteTaskFromDb(id);

    res.json({ success: true, message: '任务已删除' });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '删除任务失败',
    });
  }
}

export function getProcessedFile(req: Request, res: Response) {
  const { filename } = req.params;
  const filePath = getProcessedPath(filename);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ success: false, error: '文件不存在' });
  }

  res.setHeader('Content-Type', 'image/png');
  const stream = fs.createReadStream(filePath);
  stream.pipe(res);
}

export async function exportTask(req: Request, res: Response) {
  try {
    const { taskId } = req.params;
    const options = req.body as ExportOptions;

    const task = getTask(taskId);
    if (!task) {
      return res.status(404).json({ success: false, error: '任务不存在' });
    }

    if (!task.processedUrl) {
      return res.status(400).json({ success: false, error: '任务尚未完成' });
    }

    const processedFilename = task.processedUrl.split('/').pop();
    if (!processedFilename) {
      return res.status(400).json({ success: false, error: '无效的处理结果' });
    }

    const processedPath = getProcessedPath(processedFilename);
    let buffer = fs.readFileSync(processedPath);

    buffer = await applyAdjustments(buffer, options.adjustments);

    const filename = await exportImage(taskId, buffer, options.format, options.quality);

    createExportRecord(taskId, options.format, options.quality, options.adjustments, filename);

    const exportUrl = `/api/export/${filename}`;

    res.json({
      success: true,
      data: {
        url: exportUrl,
        filename,
      },
    });
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '导出失败',
    });
  }
}

export function downloadExport(req: Request, res: Response) {
  const { filename } = req.params;
  const filePath = path.join(__dirname, '../../storage/exports', filename);

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
  };

  const contentType = contentTypeMap[ext] || 'application/octet-stream';
  res.setHeader('Content-Type', contentType);
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

  const stream = fs.createReadStream(filePath);
  stream.pipe(res);
}

export function getStatus(req: Request, res: Response) {
  const status = getQueueStatus();
  res.json({
    success: true,
    data: status,
  });
}
