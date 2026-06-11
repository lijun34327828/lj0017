import React from 'react';
import { UploadArea } from '@/components/upload/UploadArea';
import { ImageEditor } from '@/components/editor/ImageEditor';
import { RepairOptions } from '@/components/editor/RepairOptions';
import { TaskQueue } from '@/components/task/TaskQueue';

const Workbench: React.FC = () => {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center mb-8 pt-4">
        <h1
          className="text-4xl font-bold text-[#F5EDE0] mb-3"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          老照片智能修复工作室
        </h1>
        <p className="text-[#F5EDE0]/60 max-w-2xl mx-auto">
          上传您的老旧破损照片，通过 AI 智能算法完成划痕去除、破损补全、高清放大与智能上色，
          保留原始光影风格，让珍贵回忆重现光彩
        </p>
      </div>

      <UploadArea />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          <ImageEditor />
        </div>
        <div className="space-y-6">
          <RepairOptions />
          <TaskQueue />
        </div>
      </div>
    </div>
  );
};

export default Workbench;
