import { Router } from 'express';
import {
  handleUpload,
  uploadMiddleware,
  getUploadedFile,
} from '../controllers/uploadController.js';
import {
  createRepairTask,
  getTaskById,
  listTasks,
  pauseTaskById,
  resumeTaskById,
  retryTaskById,
  deleteTask,
  getProcessedFile,
  exportTask,
  downloadExport,
  getStatus,
} from '../controllers/taskController.js';

const router = Router();

router.post('/upload', uploadMiddleware, handleUpload);
router.get('/upload/:filename', getUploadedFile);

router.post('/tasks', createRepairTask);
router.get('/tasks', listTasks);
router.get('/tasks/:id', getTaskById);
router.put('/tasks/:id/pause', pauseTaskById);
router.put('/tasks/:id/resume', resumeTaskById);
router.put('/tasks/:id/retry', retryTaskById);
router.delete('/tasks/:id', deleteTask);

router.get('/processed/:filename', getProcessedFile);

router.post('/export/:taskId', exportTask);
router.get('/export/:filename', downloadExport);

router.get('/history', listTasks);
router.delete('/history/:id', deleteTask);

router.get('/queue/status', getStatus);

router.get('/health', (req, res) => {
  res.json({ success: true, status: 'ok', timestamp: Date.now() });
});

export default router;
