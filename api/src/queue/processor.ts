import { RepairTask, TaskStatus } from '../../../shared/types.js';
import { simulateAIRepair } from '../services/aiService.js';
import { getUploadPath, saveProcessedImage } from '../services/fileService.js';
import fs from 'fs';
import { updateTaskProgress, updateTaskCompleted, updateTaskFailed } from '../services/taskService.js';
import { broadcastProgress } from '../websocket/server.js';

interface QueueItem {
  task: RepairTask;
  isPaused: boolean;
  abortController: AbortController;
  resumeResolver: (() => void) | null;
  resumePromise: Promise<void> | null;
}

const taskQueue: QueueItem[] = [];
const processingTasks = new Map<string, QueueItem>();
let isProcessing = false;
const MAX_CONCURRENT = 2;

export function addToQueue(task: RepairTask) {
  const item: QueueItem = {
    task,
    isPaused: false,
    abortController: new AbortController(),
    resumeResolver: null,
    resumePromise: null,
  };
  taskQueue.push(item);
  updateTaskStatus(task.id, 'queued', 0, '等待处理...');
  broadcastProgress({
    type: 'progress',
    taskId: task.id,
    status: 'queued',
    progress: 0,
    message: '等待处理...',
  });
  processQueue();
}

export function pauseTask(taskId: string): boolean {
  const processing = processingTasks.get(taskId);
  if (processing) {
    processing.isPaused = true;
    let resolver: (() => void) | null = null;
    processing.resumePromise = new Promise<void>((resolve) => {
      resolver = resolve;
    });
    processing.resumeResolver = resolver;
    updateTaskStatus(taskId, 'paused', processing.task.progress, '已暂停');
    broadcastProgress({
      type: 'progress',
      taskId,
      status: 'paused',
      progress: processing.task.progress,
      message: '已暂停',
    });
    return true;
  }

  const queuedIndex = taskQueue.findIndex((item) => item.task.id === taskId);
  if (queuedIndex !== -1) {
    taskQueue[queuedIndex].isPaused = true;
    updateTaskStatus(taskId, 'paused', 0, '已暂停');
    broadcastProgress({
      type: 'progress',
      taskId,
      status: 'paused',
      progress: 0,
      message: '已暂停',
    });
    return true;
  }

  return false;
}

export function resumeTask(taskId: string): boolean {
  const processing = processingTasks.get(taskId);
  if (processing && processing.isPaused) {
    processing.isPaused = false;
    if (processing.resumeResolver) {
      processing.resumeResolver();
      processing.resumeResolver = null;
      processing.resumePromise = null;
    }
    updateTaskStatus(taskId, 'processing', processing.task.progress, '继续处理...');
    broadcastProgress({
      type: 'progress',
      taskId,
      status: 'processing',
      progress: processing.task.progress,
      message: '继续处理...',
    });
    return true;
  }

  const queuedIndex = taskQueue.findIndex((item) => item.task.id === taskId);
  if (queuedIndex !== -1 && taskQueue[queuedIndex].isPaused) {
    taskQueue[queuedIndex].isPaused = false;
    updateTaskStatus(taskId, 'queued', 0, '等待处理...');
    broadcastProgress({
      type: 'progress',
      taskId,
      status: 'queued',
      progress: 0,
      message: '等待处理...',
    });
    processQueue();
    return true;
  }

  return false;
}

export function retryTask(task: RepairTask) {
  const item: QueueItem = {
    task: { ...task, status: 'pending', progress: 0, progressMessage: '重试中...' },
    isPaused: false,
    abortController: new AbortController(),
    resumeResolver: null,
    resumePromise: null,
  };
  taskQueue.push(item);
  updateTaskStatus(task.id, 'queued', 0, '等待处理...');
  broadcastProgress({
    type: 'progress',
    taskId: task.id,
    status: 'queued',
    progress: 0,
    message: '等待处理...',
  });
  processQueue();
}

async function processQueue() {
  if (isProcessing) return;
  isProcessing = true;

  while (taskQueue.length > 0 || processingTasks.size > 0) {
    while (processingTasks.size < MAX_CONCURRENT && taskQueue.length > 0) {
      const nextIndex = taskQueue.findIndex((item) => !item.isPaused);
      if (nextIndex === -1) break;

      const item = taskQueue.splice(nextIndex, 1)[0];
      processingTasks.set(item.task.id, item);
      processTask(item);
    }

    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  isProcessing = false;
}

async function processTask(item: QueueItem) {
  const { task } = item;

  try {
    updateTaskStatus(task.id, 'processing', 5, '正在加载图像...');
    broadcastProgress({
      type: 'progress',
      taskId: task.id,
      status: 'processing',
      progress: 5,
      message: '正在加载图像...',
    });

    const uploadPath = getUploadPath(task.image.filename);
    const originalBuffer = fs.readFileSync(uploadPath);

    let lastProgress = 0;

    const resultBuffer = await simulateAIRepair(
      originalBuffer,
      task.options,
      task.preprocess,
      async (progress, message) => {
        while (item.isPaused && item.resumePromise) {
          await item.resumePromise;
        }
        if (progress < 0) return;
        if (progress > lastProgress) {
          lastProgress = progress;
          item.task.progress = progress;
          item.task.progressMessage = message;
          updateTaskStatus(task.id, 'processing', progress, message);
          broadcastProgress({
            type: 'progress',
            taskId: task.id,
            status: 'processing',
            progress,
            message,
          });
        }
      }
    );

    const processedFilename = await saveProcessedImage(task.id, resultBuffer, 'png');
    const processedUrl = `/api/processed/${processedFilename}`;

    updateTaskCompleted(task.id, processedUrl);
    broadcastProgress({
      type: 'progress',
      taskId: task.id,
      status: 'completed',
      progress: 100,
      message: '修复完成！',
    });
  } catch (error) {
    console.error('Task processing error:', error);
    const errorMessage = error instanceof Error ? error.message : '处理失败';
    updateTaskFailed(task.id, errorMessage);
    broadcastProgress({
      type: 'progress',
      taskId: task.id,
      status: 'failed',
      progress: task.progress,
      message: errorMessage,
    });
  } finally {
    processingTasks.delete(task.id);
  }
}

function updateTaskStatus(
  taskId: string,
  status: TaskStatus,
  progress: number,
  message: string
) {
  updateTaskProgress(taskId, status, progress, message);
}

export function getQueueStatus() {
  return {
    queued: taskQueue.length,
    processing: processingTasks.size,
    paused: [...processingTasks.values(), ...taskQueue].filter((i) => i.isPaused).length,
  };
}
