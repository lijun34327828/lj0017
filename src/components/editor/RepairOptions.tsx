import React, { useState } from 'react';
import {
  Wand2,
  Scissors,
  Zap,
  Palette,
  Sparkles,
  Play,
} from 'lucide-react';
import { Button } from '../common/Button';
import { Card, CardContent, CardHeader } from '../common/Card';
import { useImageStore } from '@/store/useImageStore';
import { useTaskStore } from '@/store/useTaskStore';
import { createRepairTask } from '@/utils/api';
import type { RepairMode, RepairOptions as RepairOptionsType } from '@/types';

interface RepairModeOption {
  value: RepairMode;
  label: string;
  description: string;
  icon: React.ReactNode;
}

const repairModes: RepairModeOption[] = [
  {
    value: 'scratch',
    label: '划痕去除',
    description: '去除照片中的划痕和折痕',
    icon: <Scissors className="w-5 h-5" />,
  },
  {
    value: 'damage',
    label: '破损补全',
    description: '修复破损缺失的区域',
    icon: <Wand2 className="w-5 h-5" />,
  },
  {
    value: 'enhance',
    label: '高清放大',
    description: '人像增强与分辨率提升',
    icon: <Zap className="w-5 h-5" />,
  },
  {
    value: 'colorize',
    label: '智能上色',
    description: '为黑白照片自动上色',
    icon: <Palette className="w-5 h-5" />,
  },
  {
    value: 'comprehensive',
    label: '综合修复',
    description: '一键完成所有修复操作',
    icon: <Sparkles className="w-5 h-5" />,
  },
];

export const RepairOptions: React.FC = () => {
  const [selectedModes, setSelectedModes] = useState<RepairMode[]>(['scratch', 'damage']);
  const [preserveStyle, setPreserveStyle] = useState(true);
  const [upscaleFactor, setUpscaleFactor] = useState<1 | 2 | 4>(2);
  const [colorizationStyle, setColorizationStyle] = useState<'natural' | 'vintage' | 'vivid'>('natural');
  const [isProcessing, setIsProcessing] = useState(false);

  const selectedImageId = useImageStore((state) => state.selectedImageId);
  const editorState = useImageStore((state) => state.editorState);
  const uploadedImages = useImageStore((state) => state.uploadedImages);
  const addTask = useTaskStore((state) => state.addTask);

  const selectedImage = uploadedImages.find((img) => img.id === selectedImageId);

  const toggleMode = (mode: RepairMode) => {
    if (mode === 'comprehensive') {
      setSelectedModes(['comprehensive']);
      return;
    }

    setSelectedModes((prev) => {
      const filtered = prev.filter((m) => m !== 'comprehensive');
      if (filtered.includes(mode)) {
        return filtered.filter((m) => m !== mode);
      }
      return [...filtered, mode];
    });
  };

  const handleStartRepair = async () => {
    if (!selectedImageId || !selectedImage) return;

    setIsProcessing(true);
    try {
      const options: RepairOptionsType = {
        modes: selectedModes,
        preserveStyle,
        upscaleFactor,
        colorizationStyle: selectedModes.includes('colorize') || selectedModes.includes('comprehensive')
          ? colorizationStyle
          : undefined,
      };

      const preprocess = {
        rotation: editorState.rotation,
        crop: editorState.crop,
        spotRemoval: editorState.spots.length > 0 ? editorState.spots : undefined,
      };

      const task = await createRepairTask(selectedImageId, preprocess, options);
      addTask(task);
    } catch (error) {
      console.error('Failed to create task:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <h3 className="text-lg font-semibold text-[#F5EDE0]" style={{ fontFamily: "'Playfair Display', serif" }}>
          AI 修复选项
        </h3>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-[#F5EDE0] mb-3">
            修复模式
          </label>
          <div className="space-y-2">
            {repairModes.map((mode) => (
              <button
                key={mode.value}
                onClick={() => toggleMode(mode.value)}
                className={`w-full p-3 rounded-lg border text-left transition-all duration-200 ${
                  selectedModes.includes(mode.value)
                    ? 'border-[#C9A962] bg-[#C9A962]/10 text-[#F5EDE0]'
                    : 'border-[#C9A962]/20 bg-transparent text-[#F5EDE0]/70 hover:border-[#C9A962]/40 hover:text-[#F5EDE0]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      selectedModes.includes(mode.value)
                        ? 'bg-[#C9A962]/20 text-[#C9A962]'
                        : 'bg-white/5 text-[#F5EDE0]/50'
                    }`}
                  >
                    {mode.icon}
                  </div>
                  <div>
                    <p className="font-medium">{mode.label}</p>
                    <p className="text-xs text-[#F5EDE0]/50">{mode.description}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {(selectedModes.includes('enhance') || selectedModes.includes('comprehensive')) && (
          <div>
            <label className="block text-sm font-medium text-[#F5EDE0] mb-3">
              放大倍数
            </label>
            <div className="flex gap-2">
              {[1, 2, 4].map((factor) => (
                <button
                  key={factor}
                  onClick={() => setUpscaleFactor(factor as 1 | 2 | 4)}
                  className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                    upscaleFactor === factor
                      ? 'bg-[#C9A962] text-[#2D1B0E]'
                      : 'bg-white/5 text-[#F5EDE0]/70 hover:bg-white/10'
                  }`}
                >
                  {factor}x
                </button>
              ))}
            </div>
          </div>
        )}

        {(selectedModes.includes('colorize') || selectedModes.includes('comprehensive')) && (
          <div>
            <label className="block text-sm font-medium text-[#F5EDE0] mb-3">
              上色风格
            </label>
            <div className="flex gap-2">
              {[
                { value: 'natural', label: '自然' },
                { value: 'vintage', label: '复古' },
                { value: 'vivid', label: '鲜艳' },
              ].map((style) => (
                <button
                  key={style.value}
                  onClick={() => setColorizationStyle(style.value as any)}
                  className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                    colorizationStyle === style.value
                      ? 'bg-[#C9A962] text-[#2D1B0E]'
                      : 'bg-white/5 text-[#F5EDE0]/70 hover:bg-white/10'
                  }`}
                >
                  {style.label}
                </button>
              ))}
            </div>
          </div>
        )}

        <div>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={preserveStyle}
              onChange={(e) => setPreserveStyle(e.target.checked)}
              className="w-5 h-5 rounded border-[#C9A962]/30 bg-transparent text-[#C9A962] focus:ring-[#C9A962]"
            />
            <div>
              <span className="text-sm font-medium text-[#F5EDE0]">
                保留原始光影风格
              </span>
              <p className="text-xs text-[#F5EDE0]/50">
                修复时保留照片的原始质感和年代感
              </p>
            </div>
          </label>
        </div>

        <Button
          variant="primary"
          size="lg"
          icon={<Play className="w-5 h-5" />}
          loading={isProcessing}
          disabled={!selectedImageId || selectedModes.length === 0}
          onClick={handleStartRepair}
          className="w-full"
        >
          开始修复
        </Button>
      </CardContent>
    </Card>
  );
};
