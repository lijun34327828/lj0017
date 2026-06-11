export interface ImageFile {
  id: string;
  originalName: string;
  filename: string;
  mimetype: string;
  size: number;
  uploadTime: number;
  width?: number;
  height?: number;
}

export interface PreprocessConfig {
  rotation: number;
  crop?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  spotRemoval?: Array<{ x: number; y: number; radius: number }>;
}

export type RepairMode = 'scratch' | 'damage' | 'enhance' | 'colorize' | 'comprehensive';

export interface RepairOptions {
  modes: RepairMode[];
  preserveStyle: boolean;
  upscaleFactor: 1 | 2 | 4;
  colorizationStyle?: 'natural' | 'vintage' | 'vivid';
}

export type TaskStatus = 'pending' | 'queued' | 'processing' | 'paused' | 'completed' | 'failed';

export interface RepairTask {
  id: string;
  imageId: string;
  image: ImageFile;
  preprocess: PreprocessConfig;
  options: RepairOptions;
  status: TaskStatus;
  progress: number;
  progressMessage: string;
  originalUrl: string;
  processedUrl?: string;
  createdAt: number;
  startedAt?: number;
  completedAt?: number;
  error?: string;
}

export interface Adjustments {
  brightness: number;
  contrast: number;
  sharpness: number;
  saturation?: number;
}

export type ExportFormat = 'jpg' | 'png' | 'webp' | 'tiff';

export interface ExportOptions {
  format: ExportFormat;
  quality: number;
  adjustments: Adjustments;
}

export interface UploadResponse {
  success: boolean;
  data: ImageFile[];
}

export interface CreateTaskRequest {
  imageId: string;
  preprocess: PreprocessConfig;
  options: RepairOptions;
}

export interface CreateTaskResponse {
  success: boolean;
  data: RepairTask;
}

export interface TaskListResponse {
  success: boolean;
  data: {
    list: RepairTask[];
    total: number;
  };
}

export interface ProgressUpdate {
  type: 'progress';
  taskId: string;
  status: TaskStatus;
  progress: number;
  message: string;
}

export interface HistoryFilter {
  status?: TaskStatus;
  dateFrom?: number;
  dateTo?: number;
  repairMode?: RepairMode;
  search?: string;
}
