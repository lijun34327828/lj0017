import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Download,
  Sun,
  Contrast,
  Focus,
  Palette,
  RotateCcw,
  Check,
  FileImage,
} from 'lucide-react';
import { Button } from '@/components/common/Button';
import { Card, CardContent, CardHeader } from '@/components/common/Card';
import { getTask, exportImage as apiExportImage } from '@/utils/api';
import { useTaskStore } from '@/store/useTaskStore';
import type { RepairTask, Adjustments, ExportFormat } from '@/types';
import { formatDate, formatFileSize } from '@/utils/format';
import { getImageUrl } from '@/utils/api';

const defaultAdjustments: Adjustments = {
  brightness: 0,
  contrast: 0,
  sharpness: 0,
  saturation: 0,
};

const Preview: React.FC = () => {
  const { taskId } = useParams<{ taskId: string }>();
  const navigate = useNavigate();
  const [task, setTask] = useState<RepairTask | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [adjustments, setAdjustments] = useState<Adjustments>(defaultAdjustments);
  const [exportFormat, setExportFormat] = useState<ExportFormat>('jpg');
  const [exportQuality, setExportQuality] = useState(90);
  const [isExporting, setIsExporting] = useState(false);
  const [exportUrl, setExportUrl] = useState<string | null>(null);
  const [sliderPosition, setSliderPosition] = useState(50);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const compareContainerRef = useRef<HTMLDivElement>(null);

  const updateTask = useTaskStore((state) => state.updateTask);

  useEffect(() => {
    if (taskId) {
      loadTask();
    }
  }, [taskId]);

  useEffect(() => {
    if (task?.processedUrl && canvasRef.current) {
      applyAdjustmentsToCanvas();
    }
  }, [task, adjustments]);

  const loadTask = async () => {
    if (!taskId) return;
    setIsLoading(true);
    try {
      const taskData = await getTask(taskId);
      setTask(taskData);
      updateTask(taskId, taskData);
    } catch (e) {
      console.error('Load task failed:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const applyAdjustmentsToCanvas = async () => {
    if (!task?.processedUrl || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const processedFilename = task.processedUrl.split('/').pop();
    if (!processedFilename) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;

      ctx.drawImage(img, 0, 0);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      const brightness = adjustments.brightness * 2.55;
      const contrast = (adjustments.contrast + 100) / 100;
      const saturation = 1 + adjustments.saturation / 100;

      for (let i = 0; i < data.length; i += 4) {
        let r = data[i];
        let g = data[i + 1];
        let b = data[i + 2];

        r = (r - 128) * contrast + 128 + brightness;
        g = (g - 128) * contrast + 128 + brightness;
        b = (b - 128) * contrast + 128 + brightness;

        if (saturation !== 1) {
          const gray = 0.2989 * r + 0.587 * g + 0.114 * b;
          r = gray + saturation * (r - gray);
          g = gray + saturation * (g - gray);
          b = gray + saturation * (b - gray);
        }

        data[i] = Math.max(0, Math.min(255, r));
        data[i + 1] = Math.max(0, Math.min(255, g));
        data[i + 2] = Math.max(0, Math.min(255, b));
      }

      if (adjustments.sharpness !== 0) {
        ctx.putImageData(imageData, 0, 0);
        applySharpness(ctx, canvas.width, canvas.height, adjustments.sharpness);
      } else {
        ctx.putImageData(imageData, 0, 0);
      }
    };
    img.src = getImageUrl(processedFilename, 'processed');
  };

  const applySharpness = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    amount: number
  ) => {
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    const weights = generateSharpnessKernel(amount);

    const output = ctx.createImageData(width, height);
    const dst = output.data;

    const kernelSize = 3;
    const half = Math.floor(kernelSize / 2);

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let r = 0, g = 0, b = 0;

        for (let ky = 0; ky < kernelSize; ky++) {
          for (let kx = 0; kx < kernelSize; kx++) {
            const px = Math.min(width - 1, Math.max(0, x + kx - half));
            const py = Math.min(height - 1, Math.max(0, y + ky - half));
            const idx = (py * width + px) * 4;

            const weight = weights[ky * kernelSize + kx];
            r += data[idx] * weight;
            g += data[idx + 1] * weight;
            b += data[idx + 2] * weight;
          }
        }

        const idx = (y * width + x) * 4;
        dst[idx] = Math.max(0, Math.min(255, r));
        dst[idx + 1] = Math.max(0, Math.min(255, g));
        dst[idx + 2] = Math.max(0, Math.min(255, b));
        dst[idx + 3] = 255;
      }
    }

    ctx.putImageData(output, 0, 0);
  };

  const generateSharpnessKernel = (amount: number): number[] => {
    const intensity = Math.abs(amount) / 50;
    const center = 1 + 4 * intensity;
    const neighbor = -intensity;
    return [neighbor, neighbor, neighbor, neighbor, center, neighbor, neighbor, neighbor, neighbor];
  };

  const handleAdjustmentChange = (key: keyof Adjustments, value: number) => {
    setAdjustments((prev) => ({ ...prev, [key]: value }));
    setExportUrl(null);
  };

  const resetAdjustments = () => {
    setAdjustments(defaultAdjustments);
    setExportUrl(null);
  };

  const handleExport = async () => {
    if (!taskId) return;
    setIsExporting(true);
    try {
      const result = await apiExportImage(taskId, {
        format: exportFormat,
        quality: exportQuality,
        adjustments,
      });
      setExportUrl(getImageUrl(result.filename, 'export'));

      const link = document.createElement('a');
      link.href = getImageUrl(result.filename, 'export');
      link.download = `repaired_${task?.image.originalName.replace(/\.[^/.]+$/, '')}.${exportFormat}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      console.error('Export failed:', e);
    } finally {
      setIsExporting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center text-[#F5EDE0]/50">
          <div className="w-10 h-10 border-2 border-[#C9A962]/30 border-t-[#C9A962] rounded-full animate-spin mx-auto mb-4" />
          <p>加载中...</p>
        </div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="text-center py-16 text-[#F5EDE0]/50">
        <FileImage className="w-16 h-16 mx-auto mb-4 opacity-20" />
        <p className="text-lg">任务不存在</p>
        <Button variant="secondary" className="mt-4" onClick={() => navigate('/history')}>
          返回历史记录
        </Button>
      </div>
    );
  }

  const processedFilename = task.processedUrl?.split('/').pop();

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          icon={<ArrowLeft className="w-4 h-4" />}
          onClick={() => navigate(-1)}
        >
          返回
        </Button>
        <div>
          <h1
            className="text-2xl font-bold text-[#F5EDE0]"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            修复结果预览
          </h1>
          <p className="text-sm text-[#F5EDE0]/50 mt-1">
            {task.image.originalName} · {formatDate(task.createdAt)} · {formatFileSize(task.image.size)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        <div className="xl:col-span-3 space-y-6">
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold text-[#F5EDE0]" style={{ fontFamily: "'Playfair Display', serif" }}>
                修复前后对比
              </h3>
            </CardHeader>
            <CardContent>
              <div
                ref={compareContainerRef}
                className="relative overflow-hidden rounded-lg bg-[#0f0905] aspect-[4/3] max-h-[600px]"
              >
                <div className="absolute inset-0">
                  <img
                    src={getImageUrl(task.image.filename)}
                    alt="修复前"
                    className="w-full h-full object-contain"
                    draggable={false}
                  />
                </div>
                <div
                  className="absolute inset-0 overflow-hidden"
                  style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
                >
                  <img
                    src={task.processedUrl ? getImageUrl(processedFilename!, 'processed') : ''}
                    alt="修复后"
                    className="w-full h-full object-contain"
                    draggable={false}
                  />
                </div>
                <div
                  className="absolute top-0 bottom-0 w-1 bg-[#C9A962] cursor-ew-resize pointer-events-none"
                  style={{ left: `${sliderPosition}%`, transform: 'translateX(-50%)' }}
                >
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-[#C9A962] rounded-full flex items-center justify-center shadow-lg pointer-events-auto">
                    <div className="flex gap-0.5">
                      <div className="w-0.5 h-3 bg-[#2D1B0E] rounded" />
                      <div className="w-0.5 h-3 bg-[#2D1B0E] rounded" />
                    </div>
                  </div>
                </div>
                <div
                  className="absolute inset-y-0 w-full cursor-ew-resize"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    const container = compareContainerRef.current;
                    if (!container) return;
                    const handleMove = (moveEvent: MouseEvent) => {
                      const rect = container.getBoundingClientRect();
                      const x = moveEvent.clientX - rect.left;
                      const percent = Math.max(0, Math.min(100, (x / rect.width) * 100));
                      setSliderPosition(percent);
                    };
                    const handleUp = () => {
                      document.removeEventListener('mousemove', handleMove);
                      document.removeEventListener('mouseup', handleUp);
                    };
                    document.addEventListener('mousemove', handleMove);
                    document.addEventListener('mouseup', handleUp);
                  }}
                />
                <div className="absolute bottom-4 left-4 px-3 py-1.5 bg-black/60 backdrop-blur-sm rounded-lg text-xs text-[#F5EDE0]">
                  修复前
                </div>
                <div className="absolute bottom-4 right-4 px-3 py-1.5 bg-[#C9A962]/80 backdrop-blur-sm rounded-lg text-xs text-[#2D1B0E] font-medium">
                  修复后
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold text-[#F5EDE0]" style={{ fontFamily: "'Playfair Display', serif" }}>
                调整预览
              </h3>
            </CardHeader>
            <CardContent>
              <div className="bg-[#0f0905] rounded-lg overflow-hidden flex items-center justify-center p-4">
                <canvas
                  ref={canvasRef}
                  className="max-w-full max-h-[500px] rounded shadow-xl"
                  style={{ boxShadow: '0 0 60px rgba(201, 169, 98, 0.1)' }}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between w-full">
                <h3 className="text-lg font-semibold text-[#F5EDE0]" style={{ fontFamily: "'Playfair Display', serif" }}>
                  图像调整
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  icon={<RotateCcw className="w-4 h-4" />}
                  onClick={resetAdjustments}
                >
                  重置
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <AdjustmentSlider
                icon={<Sun className="w-5 h-5" />}
                label="亮度"
                value={adjustments.brightness}
                min="-50"
                max="50"
                onChange={(v) => handleAdjustmentChange('brightness', v)}
              />
              <AdjustmentSlider
                icon={<Contrast className="w-5 h-5" />}
                label="对比度"
                value={adjustments.contrast}
                min="-50"
                max="50"
                onChange={(v) => handleAdjustmentChange('contrast', v)}
              />
              <AdjustmentSlider
                icon={<Focus className="w-5 h-5" />}
                label="锐度"
                value={adjustments.sharpness}
                min="-50"
                max="50"
                onChange={(v) => handleAdjustmentChange('sharpness', v)}
              />
              <AdjustmentSlider
                icon={<Palette className="w-5 h-5" />}
                label="饱和度"
                value={adjustments.saturation || 0}
                min="-50"
                max="50"
                onChange={(v) => handleAdjustmentChange('saturation', v)}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold text-[#F5EDE0]" style={{ fontFamily: "'Playfair Display', serif" }}>
                导出设置
              </h3>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#F5EDE0] mb-2">
                  导出格式
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(['jpg', 'png', 'webp', 'tiff'] as const).map((format) => (
                    <button
                      key={format}
                      onClick={() => {
                        setExportFormat(format);
                        setExportUrl(null);
                      }}
                      className={`py-2 px-3 rounded-lg text-sm font-medium uppercase transition-all ${
                        exportFormat === format
                          ? 'bg-[#C9A962] text-[#2D1B0E]'
                          : 'bg-white/5 text-[#F5EDE0]/70 hover:bg-white/10'
                      }`}
                    >
                      {format}
                    </button>
                  ))}
                </div>
              </div>

              {(exportFormat === 'jpg' || exportFormat === 'webp') && (
                <div>
                  <label className="block text-sm font-medium text-[#F5EDE0] mb-2">
                    质量: {exportQuality}%
                  </label>
                  <input
                    type="range"
                    min="50"
                    max="100"
                    value={exportQuality}
                    onChange={(e) => {
                      setExportQuality(Number(e.target.value));
                      setExportUrl(null);
                    }}
                    className="w-full accent-[#C9A962]"
                  />
                </div>
              )}

              <Button
                variant="primary"
                size="lg"
                icon={exportUrl ? <Check className="w-5 h-5" /> : <Download className="w-5 h-5" />}
                loading={isExporting}
                onClick={handleExport}
                className="w-full"
              >
                {exportUrl ? '已导出' : '下载图片'}
              </Button>

              {exportUrl && (
                <p className="text-xs text-center text-green-400">
                  图片已准备好下载
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

interface AdjustmentSliderProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  min: string;
  max: string;
  onChange: (value: number) => void;
}

const AdjustmentSlider: React.FC<AdjustmentSliderProps> = ({
  icon,
  label,
  value,
  min,
  max,
  onChange,
}) => {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-[#C9A962]">{icon}</span>
          <span className="text-sm font-medium text-[#F5EDE0]">{label}</span>
        </div>
        <span className="text-sm text-[#C9A962] font-mono w-12 text-right">
          {value > 0 ? '+' : ''}
          {value}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-[#C9A962]"
      />
      <div className="flex justify-between text-xs text-[#F5EDE0]/30 mt-1">
        <span>{min}</span>
        <span>0</span>
        <span>{max}</span>
      </div>
    </div>
  );
};

export default Preview;
