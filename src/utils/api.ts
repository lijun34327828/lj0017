import axios from 'axios';
import { API_BASE_URL } from '../types';
import type {
  ImageFile,
  RepairTask,
  CreateTaskRequest,
  RepairOptions,
  CreateTaskResponse,
  TaskListResponse,
  UploadResponse,
  ExportOptions,
} from '../types';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000,
});

export async function uploadImages(files: File[]): Promise<ImageFile[]> {
  const formData = new FormData();
  files.forEach((file) => {
    formData.append('images', file);
  });

  const response = await api.post<UploadResponse>('/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data.data;
}

export async function createRepairTask(
  imageId: string,
  preprocess: CreateTaskRequest['preprocess'],
  options: RepairOptions
): Promise<RepairTask> {
  const request: CreateTaskRequest = {
    imageId,
    preprocess,
    options,
  };

  const response = await api.post<CreateTaskResponse>('/tasks', request);
  return response.data.data;
}

export async function getTasks(params?: {
  status?: string;
  limit?: number;
  offset?: number;
  search?: string;
}): Promise<{ list: RepairTask[]; total: number }> {
  const response = await api.get<TaskListResponse>('/tasks', { params });
  return response.data.data;
}

export async function getTask(id: string): Promise<RepairTask> {
  const response = await api.get<CreateTaskResponse>(`/tasks/${id}`);
  return response.data.data;
}

export async function pauseTask(id: string): Promise<void> {
  await api.put(`/tasks/${id}/pause`);
}

export async function resumeTask(id: string): Promise<void> {
  await api.put(`/tasks/${id}/resume`);
}

export async function retryTask(id: string): Promise<void> {
  await api.put(`/tasks/${id}/retry`);
}

export async function deleteTask(id: string): Promise<void> {
  await api.delete(`/tasks/${id}`);
}

export async function exportImage(
  taskId: string,
  options: ExportOptions
): Promise<{ url: string; filename: string }> {
  const response = await api.post(`/export/${taskId}`, options);
  return response.data.data;
}

export async function getHealth(): Promise<boolean> {
  try {
    const response = await api.get('/health');
    return response.data.success;
  } catch {
    return false;
  }
}

export function getImageUrl(filename: string, type: 'upload' | 'processed' | 'export' = 'upload'): string {
  const pathMap: Record<string, string> = {
    upload: '/uploads',
    processed: '/processed',
    export: '/exports',
  };
  return `${pathMap[type]}/${filename}`;
}
