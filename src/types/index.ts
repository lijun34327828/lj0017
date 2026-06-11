export * from '../../shared/types';

export interface EditorState {
  rotation: number;
  zoom: number;
  isCropping: boolean;
  isSpotRemoving: boolean;
  brushSize: number;
  spots: Array<{ x: number; y: number; radius: number }>;
  crop?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface PreviewAdjustments {
  brightness: number;
  contrast: number;
  sharpness: number;
  saturation: number;
}

export const API_BASE_URL = '/api';
export const WS_BASE_URL = '/ws';
