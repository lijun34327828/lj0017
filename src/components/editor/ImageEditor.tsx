import React, { useRef } from 'react';
import {
  RotateCcw,
  RotateCw,
  Crop,
  Eraser,
  ZoomIn,
  ZoomOut,
  X,
  Trash2,
  Check,
} from 'lucide-react';
import { Button } from '../common/Button';
import { Card, CardContent } from '../common/Card';
import { useImageStore } from '@/store/useImageStore';
import { useImageEditor } from '@/hooks/useImageEditor';
import { getImageUrl } from '@/utils/api';

export const ImageEditor: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const uploadedImages = useImageStore((state) => state.uploadedImages);
  const selectedImageId = useImageStore((state) => state.selectedImageId);
  const editorState = useImageStore((state) => state.editorState);
  const resetEditor = useImageStore((state) => state.resetEditor);

  const selectedImage = uploadedImages.find((img) => img.id === selectedImageId);
  const imageUrl = selectedImage ? getImageUrl(selectedImage.filename) : null;

  const {
    handleCanvasClick,
    rotateLeft,
    rotateRight,
    setZoom,
    startCropping,
    startSpotRemoving,
    cancelEdit,
    clearSpots,
    setBrushSize,
  } = useImageEditor(canvasRef, imageUrl);

  if (!selectedImage) {
    return (
      <Card className="h-full flex items-center justify-center min-h-[500px]">
        <div className="text-center text-[#F5EDE0]/50">
          <p>请选择一张图片进行编辑</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col">
      <div className="px-5 py-3 border-b border-[#C9A962]/10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-[#F5EDE0]">
            {selectedImage.originalName}
          </span>
          <span className="text-xs text-[#F5EDE0]/50">
            {selectedImage.width} × {selectedImage.height}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-black/30 rounded-lg px-2 py-1">
            <button
              className="p-1 hover:bg-white/10 rounded transition-colors text-[#F5EDE0]/70 hover:text-[#F5EDE0]"
              onClick={() => setZoom(editorState.zoom - 10)}
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-xs text-[#F5EDE0] w-12 text-center">
              {editorState.zoom}%
            </span>
            <button
              className="p-1 hover:bg-white/10 rounded transition-colors text-[#F5EDE0]/70 hover:text-[#F5EDE0]"
              onClick={() => setZoom(editorState.zoom + 10)}
            >
              <ZoomIn className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="px-5 py-3 border-b border-[#C9A962]/10 flex items-center gap-2 flex-wrap">
        <Button
          variant={editorState.isCropping ? 'primary' : 'secondary'}
          size="sm"
          icon={<Crop className="w-4 h-4" />}
          onClick={editorState.isCropping ? cancelEdit : startCropping}
        >
          {editorState.isCropping ? '取消裁剪' : '裁剪'}
        </Button>
        <Button
          variant={editorState.isSpotRemoving ? 'primary' : 'secondary'}
          size="sm"
          icon={<Eraser className="w-4 h-4" />}
          onClick={editorState.isSpotRemoving ? cancelEdit : startSpotRemoving}
        >
          {editorState.isSpotRemoving ? '取消修补' : '污点修补'}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          icon={<RotateCcw className="w-4 h-4" />}
          onClick={rotateLeft}
        >
          左旋
        </Button>
        <Button
          variant="ghost"
          size="sm"
          icon={<RotateCw className="w-4 h-4" />}
          onClick={rotateRight}
        >
          右旋
        </Button>

        {editorState.isSpotRemoving && (
          <div className="flex items-center gap-3 ml-4">
            <label className="text-sm text-[#F5EDE0]/70">画笔大小:</label>
            <input
              type="range"
              min="5"
              max="100"
              value={editorState.brushSize}
              onChange={(e) => setBrushSize(Number(e.target.value))}
              className="w-32 accent-[#C9A962]"
            />
            <span className="text-sm text-[#C9A962] w-8">
              {editorState.brushSize}
            </span>
            <Button
              variant="ghost"
              size="sm"
              icon={<Trash2 className="w-4 h-4" />}
              onClick={clearSpots}
            >
              清除标记 ({editorState.spots.length})
            </Button>
          </div>
        )}

        {(editorState.isCropping || editorState.isSpotRemoving) && (
          <div className="ml-auto flex items-center gap-2">
            <Button variant="ghost" size="sm" icon={<X className="w-4 h-4" />} onClick={cancelEdit}>
              取消
            </Button>
            <Button variant="primary" size="sm" icon={<Check className="w-4 h-4" />} onClick={cancelEdit}>
              应用
            </Button>
          </div>
        )}

        {(editorState.rotation !== 0 || editorState.spots.length > 0) && !editorState.isCropping && !editorState.isSpotRemoving && (
          <Button
            variant="ghost"
            size="sm"
            icon={<RotateCcw className="w-4 h-4" />}
            onClick={resetEditor}
            className="ml-auto"
          >
            重置编辑
          </Button>
        )}
      </div>

      <CardContent className="flex-1 overflow-auto flex items-center justify-center bg-[#0f0905]">
        <div
          className={`relative ${
            editorState.isSpotRemoving ? 'cursor-crosshair' : 'cursor-default'
          }`}
        >
          <canvas
            ref={canvasRef}
            onClick={handleCanvasClick}
            className="max-w-full"
            style={{
              maxHeight: 'calc(100vh - 400px)',
              boxShadow: '0 0 60px rgba(201, 169, 98, 0.1)',
            }}
          />
        </div>
      </CardContent>
    </Card>
  );
};
