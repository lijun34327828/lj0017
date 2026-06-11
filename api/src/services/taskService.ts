import db from '../database/index.js';
import { v4 as uuidv4 } from 'uuid';
import {
  RepairTask,
  CreateTaskRequest,
  ImageFile,
  TaskStatus,
  HistoryFilter,
} from '../../../shared/types.js';
import { getImageFile } from './fileService.js';

export function createTask(request: CreateTaskRequest, image: ImageFile): RepairTask {
  const id = uuidv4();
  const now = Date.now();

  const task: RepairTask = {
    id,
    imageId: request.imageId,
    image,
    preprocess: request.preprocess,
    options: request.options,
    status: 'pending',
    progress: 0,
    progressMessage: '任务已创建',
    originalUrl: `/api/upload/${image.filename}`,
    createdAt: now,
  };

  const stmt = db.prepare(
    'INSERT INTO repair_tasks (id, image_id, preprocess_config, repair_options, status, progress, progress_message, original_url, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
  );
  stmt.run(
    task.id,
    task.imageId,
    JSON.stringify(task.preprocess),
    JSON.stringify(task.options),
    task.status,
    task.progress,
    task.progressMessage,
    task.originalUrl,
    task.createdAt
  );

  return task;
}

export function getTask(id: string): RepairTask | null {
  const stmt = db.prepare('SELECT * FROM repair_tasks WHERE id = ?');
  const row = stmt.get(id) as any;
  if (!row) return null;

  const image = getImageFile(row.image_id);
  if (!image) return null;

  return {
    id: row.id,
    imageId: row.image_id,
    image,
    preprocess: JSON.parse(row.preprocess_config),
    options: JSON.parse(row.repair_options),
    status: row.status,
    progress: row.progress,
    progressMessage: row.progress_message,
    originalUrl: row.original_url,
    processedUrl: row.processed_url,
    createdAt: row.created_at,
    startedAt: row.started_at,
    completedAt: row.completed_at,
    error: row.error,
  };
}

export function getTaskList(filter?: HistoryFilter, limit: number = 50, offset: number = 0): {
  list: RepairTask[];
  total: number;
} {
  let whereClauses: string[] = [];
  let params: any[] = [];

  if (filter?.status) {
    whereClauses.push('status = ?');
    params.push(filter.status);
  }

  if (filter?.dateFrom) {
    whereClauses.push('created_at >= ?');
    params.push(filter.dateFrom);
  }

  if (filter?.dateTo) {
    whereClauses.push('created_at <= ?');
    params.push(filter.dateTo);
  }

  if (filter?.search) {
    whereClauses.push(
      'id IN (SELECT id FROM repair_tasks WHERE image_id IN (SELECT id FROM image_files WHERE original_name LIKE ?))'
    );
    params.push(`%${filter.search}%`);
  }

  const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

  const countStmt = db.prepare(`SELECT COUNT(*) as count FROM repair_tasks ${whereSql}`);
  const countResult = countStmt.get(...params) as { count: number };
  const total = countResult.count;

  const stmt = db.prepare(
    `SELECT * FROM repair_tasks ${whereSql} ORDER BY created_at DESC LIMIT ? OFFSET ?`
  );
  const rows = stmt.all(...params, limit, offset) as any[];

  const list: RepairTask[] = [];
  for (const row of rows) {
    const image = getImageFile(row.image_id);
    if (image) {
      list.push({
        id: row.id,
        imageId: row.image_id,
        image,
        preprocess: JSON.parse(row.preprocess_config),
        options: JSON.parse(row.repair_options),
        status: row.status,
        progress: row.progress,
        progressMessage: row.progress_message,
        originalUrl: row.original_url,
        processedUrl: row.processed_url,
        createdAt: row.created_at,
        startedAt: row.started_at,
        completedAt: row.completed_at,
        error: row.error,
      });
    }
  }

  return { list, total };
}

export function updateTaskProgress(
  taskId: string,
  status: TaskStatus,
  progress: number,
  message: string
): boolean {
  const stmt = db.prepare(
    'UPDATE repair_tasks SET status = ?, progress = ?, progress_message = ?, started_at = COALESCE(started_at, ?) WHERE id = ?'
  );
  const result = stmt.run(
    status,
    progress,
    message,
    status === 'processing' ? Date.now() : null,
    taskId
  );
  return result.changes > 0;
}

export function updateTaskCompleted(taskId: string, processedUrl: string): boolean {
  const now = Date.now();
  const stmt = db.prepare(
    'UPDATE repair_tasks SET status = ?, progress = ?, progress_message = ?, processed_url = ?, completed_at = ? WHERE id = ?'
  );
  const result = stmt.run('completed', 100, '修复完成', processedUrl, now, taskId);
  return result.changes > 0;
}

export function updateTaskFailed(taskId: string, error: string): boolean {
  const stmt = db.prepare(
    'UPDATE repair_tasks SET status = ?, progress_message = ?, error = ? WHERE id = ?'
  );
  const result = stmt.run('failed', '处理失败', error, taskId);
  return result.changes > 0;
}

export function deleteTask(taskId: string): boolean {
  const stmt = db.prepare('DELETE FROM repair_tasks WHERE id = ?');
  const result = stmt.run(taskId);
  return result.changes > 0;
}

export function createExportRecord(
  taskId: string,
  format: string,
  quality: number,
  adjustments: any,
  filename: string
): string {
  const id = uuidv4();
  const now = Date.now();

  const stmt = db.prepare(
    'INSERT INTO export_records (id, task_id, format, quality, adjustments, filename, export_time) VALUES (?, ?, ?, ?, ?, ?, ?)'
  );
  stmt.run(id, taskId, format, quality, JSON.stringify(adjustments), filename, now);

  return id;
}
