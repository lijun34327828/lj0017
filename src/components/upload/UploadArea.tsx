import React, { useCallback, useState, useRef } from 'react';
import { Upload, Image as ImageIcon, X, FileImage } from 'lucide-react';
import { Button } from '../common/Button';
import { Card } from '../common/Card';
import { uploadImages } from '@/utils/api';
import { useImageStore } from '@/store/useImageStore';
import { formatFileSize } from '@/utils/format';
import type { ImageFile } from '@/types';
import { getImageUrl } from '@/utils/api';

export const UploadArea: React.FC = () => {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const addImages = useImageStore((state) => state.addImages);
  const uploadedImages = useImageStore((state) => state.uploadedImages);
  const selectedImageId = useImageStore((state) => state.selectedImageId);
  const selectImage = useImageStore((state) => state.selectImage);
  const removeImage = useImageStore((state) => state.removeImage);
  const clearAll = useImageStore((state) => state.clearAll);

  const handleFiles = useCallback(
    async (files: FileList | File[]) => {
      const fileArray = Array.isArray(files) ? files : Array.from(files);
      const imageFiles = fileArray.filter((file) => file.type.startsWith('image/'));

      if (imageFiles.length === 0) {
        setUploadError('请选择图片文件');
        return;
      }

      setIsUploading(true);
      setUploadError(null);

      try {
        const uploaded = await uploadImages(imageFiles);
        addImages(uploaded);
      } catch (error) {
        setUploadError(error instanceof Error ? error.message : '上传失败');
      } finally {
        setIsUploading(false);
      }
    },
    [addImages]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      if (e.dataTransfer.files.length > 0) {
        handleFiles(e.dataTransfer.files);
      }
    },
    [handleFiles]
  );

  const handleClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files?.length) {
        handleFiles(e.target.files);
        e.target.value = '';
      }
    },
    [handleFiles]
  );

  if (uploadedImages.length > 0) {
    return (
      <Card className="mb-6">
        <div className="px-5 py-3 border-b border-[#C9A962]/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileImage className="w-4 h-4 text-[#C9A962]" />
            <span className="text-sm font-medium text-[#F5EDE0]">
              已上传 {uploadedImages.length} 张图片
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              icon={<Upload className="w-4 h-4" />}
              onClick={handleClick}
            >
              添加图片
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={clearAll}
            >
              清空全部
            </Button>
          </div>
        </div>
        <div className="p-4 overflow-x-auto">
          <div className="flex gap-3 min-w-max">
            {uploadedImages.map((image: ImageFile) => (
              <div
                key={image.id}
                className={`relative group cursor-pointer transition-all duration-200 ${
                  selectedImageId === image.id
                    ? 'ring-2 ring-[#C9A962] ring-offset-2 ring-offset-[#1a1008]'
                    : 'hover:ring-2 hover:ring-[#C9A962]/50 hover:ring-offset-2 hover:ring-offset-[#1a1008]'
                }`}
                onClick={() => selectImage(image.id)}
              >
                <div className="w-28 h-28 rounded-lg overflow-hidden bg-[#2D1B0E]">
                  <img
                    src={getImageUrl(image.filename)}
                    alt={image.originalName}
                    className="w-full h-full object-cover"
                  />
                </div>
                <button
                  className="absolute top-1 right-1 w-6 h-6 rounded-full bg-red-600 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeImage(image.id);
                  }}
                >
                  <X className="w-3 h-3" />
                </button>
                <div className="mt-1 text-center">
                  <p className="text-xs text-[#F5EDE0]/70 truncate w-28">
                    {image.originalName}
                  </p>
                  <p className="text-xs text-[#C9A962]/60">
                    {formatFileSize(image.size)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleInputChange}
        />
      </Card>
    );
  }

  return (
    <Card className="mb-6">
      <div
        className={`p-12 border-2 border-dashed rounded-xl text-center transition-all duration-200 cursor-pointer ${
          isDragging
            ? 'border-[#C9A962] bg-[#C9A962]/10'
            : 'border-[#C9A962]/30 hover:border-[#C9A962]/60 hover:bg-[#C9A962]/5'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#C9A962]/10 flex items-center justify-center">
          <ImageIcon className="w-8 h-8 text-[#C9A962]" />
        </div>
        <h3 className="text-lg font-semibold text-[#F5EDE0] mb-2">
          拖拽图片到此处或点击上传
        </h3>
        <p className="text-sm text-[#F5EDE0]/50 mb-4">
          支持 JPG、PNG、TIFF、WebP 格式，单张最大 50MB
        </p>
        <Button
          variant="primary"
          size="lg"
          icon={<Upload className="w-5 h-5" />}
          loading={isUploading}
          onClick={(e) => {
            e.stopPropagation();
            handleClick();
          }}
        >
          选择图片
        </Button>
        {uploadError && (
          <p className="mt-4 text-sm text-red-400">{uploadError}</p>
        )}
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleInputChange}
      />
    </Card>
  );
};
