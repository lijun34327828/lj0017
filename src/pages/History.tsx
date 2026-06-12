import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Filter,
  Download,
  Trash2,
  Eye,
  Calendar,
  RefreshCw,
  Image as ImageIcon,
} from 'lucide-react';
import { Button } from '@/components/common/Button';
import { Card, CardContent, CardHeader } from '@/components/common/Card';
import { getTasks, deleteTask, retryTask, getImageUrl } from '@/utils/api';
import { useTaskStore } from '@/store/useTaskStore';
import { formatDate, formatFileSize, getStatusText, getStatusColor, getStatusBgColor } from '@/utils/format';
import type { RepairTask, TaskStatus, RepairMode } from '@/types';

const REPAIR_MODE_LABELS: Record<RepairMode, string> = {
  scratch: '划痕去除',
  damage: '破损补全',
  enhance: '高清放大',
  colorize: '智能上色',
  comprehensive: '综合修复',
};

const ALL_STATUSES: Array<TaskStatus | 'all'> = ['all', 'pending', 'queued', 'processing', 'paused', 'completed', 'failed'];

const History: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'all'>('all');
  const [repairTypeFilter, setRepairTypeFilter] = useState<RepairMode | 'all'>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());

  const tasks = useTaskStore((state) => state.tasks);
  const setTasks = useTaskStore((state) => state.setTasks);
  const removeTask = useTaskStore((state) => state.removeTask);
  const updateTask = useTaskStore((state) => state.updateTask);

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    setIsLoading(true);
    try {
      const { list } = await getTasks({ limit: 500 });
      setTasks(list);
    } catch (e) {
      console.error('Load tasks failed:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
  };

  const handleStatusChange = (status: TaskStatus | 'all') => {
    setStatusFilter(status);
    setSelectedTasks(new Set());
  };

  const handleRepairTypeChange = (mode: RepairMode | 'all') => {
    setRepairTypeFilter(mode);
    setSelectedTasks(new Set());
  };

  const toggleSelect = (taskId: string) => {
    setSelectedTasks((prev) => {
      const next = new Set(prev);
      if (next.has(taskId)) {
        next.delete(taskId);
      } else {
        next.add(taskId);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedTasks.size === filteredTasks.length) {
      setSelectedTasks(new Set());
    } else {
      setSelectedTasks(new Set(filteredTasks.map((t) => t.id)));
    }
  };

  const handleDelete = async (taskId: string) => {
    if (confirm('确定要删除此任务吗？')) {
      try {
        await deleteTask(taskId);
        removeTask(taskId);
        setSelectedTasks((prev) => {
          const next = new Set(prev);
          next.delete(taskId);
          return next;
        });
      } catch (e) {
        console.error('Delete failed:', e);
      }
    }
  };

  const handleBatchDelete = async () => {
    if (confirm(`确定要删除选中的 ${selectedTasks.size} 个任务吗？`)) {
      for (const taskId of selectedTasks) {
        try {
          await deleteTask(taskId);
          removeTask(taskId);
        } catch (e) {
          console.error('Delete failed:', e);
        }
      }
      setSelectedTasks(new Set());
    }
  };

  const handleRetry = async (taskId: string) => {
    try {
      await retryTask(taskId);
      updateTask(taskId, { status: 'queued', progress: 0, progressMessage: '等待处理...' });
    } catch (e) {
      console.error('Retry failed:', e);
    }
  };

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      if (statusFilter !== 'all' && task.status !== statusFilter) return false;
      if (repairTypeFilter !== 'all' && !task.options.modes.includes(repairTypeFilter)) return false;
      if (searchQuery && !task.image.originalName.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });
  }, [tasks, statusFilter, repairTypeFilter, searchQuery]);

  const completedTasks = useMemo(
    () => filteredTasks.filter((t) => t.status === 'completed'),
    [filteredTasks]
  );

  const handleDownload = async (task: RepairTask) => {
    if (!task.processedUrl) {
      alert('该任务尚未完成，暂无下载文件');
      return;
    }
    try {
      const filename = task.processedUrl.split('/').pop()!;
      const url = getImageUrl(filename, 'processed');
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      const originalBaseName = task.image.originalName.replace(/\.[^/.]+$/, '');
      link.download = `${originalBaseName}_修复后.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(downloadUrl);
    } catch (e) {
      console.error('Download failed:', e);
      alert('下载失败，请稍后重试');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1
            className="text-3xl font-bold text-[#F5EDE0]"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            历史记录
          </h1>
          <p className="text-[#F5EDE0]/50 mt-1">
            共 {filteredTasks.length} 个任务，已完成 {completedTasks.length} 个
          </p>
        </div>
        <div className="flex items-center gap-3">
          {selectedTasks.size > 0 && (
            <Button
              variant="danger"
              size="sm"
              icon={<Trash2 className="w-4 h-4" />}
              onClick={handleBatchDelete}
            >
              删除选中 ({selectedTasks.size})
            </Button>
          )}
          <Button
            variant="secondary"
            size="sm"
            icon={<RefreshCw className="w-4 h-4" />}
            onClick={loadTasks}
          >
            刷新
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4 w-full items-start sm:items-center justify-between">
            <div className="flex items-center gap-4 flex-wrap">
              <form onSubmit={handleSearch} className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#F5EDE0]/50" />
                <input
                  type="text"
                  placeholder="搜索文件名..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 bg-black/30 border border-[#C9A962]/20 rounded-lg text-[#F5EDE0] text-sm focus:outline-none focus:border-[#C9A962]/50 w-64"
                />
              </form>

              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-[#F5EDE0]/50" />
                <div className="flex gap-1 flex-wrap">
                  {ALL_STATUSES.map((status) => (
                    <button
                      key={status}
                      onClick={() => handleStatusChange(status)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        statusFilter === status
                          ? 'bg-[#C9A962] text-[#2D1B0E]'
                          : 'bg-white/5 text-[#F5EDE0]/70 hover:bg-white/10'
                      }`}
                    >
                      {status === 'all' ? '全部' : getStatusText(status)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-[#F5EDE0]/50">修复类型:</span>
                <div className="flex gap-1 flex-wrap">
                  {(['all', 'scratch', 'damage', 'enhance', 'colorize', 'comprehensive'] as const).map((mode) => (
                    <button
                      key={mode}
                      onClick={() => handleRepairTypeChange(mode)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        repairTypeFilter === mode
                          ? 'bg-[#8B5CF6] text-white'
                          : 'bg-white/5 text-[#F5EDE0]/70 hover:bg-white/10'
                      }`}
                    >
                      {mode === 'all' ? '全部' : REPAIR_MODE_LABELS[mode]}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedTasks.size === filteredTasks.length && filteredTasks.length > 0}
                onChange={toggleSelectAll}
                className="w-4 h-4 rounded border-[#C9A962]/30 bg-transparent text-[#C9A962] focus:ring-[#C9A962]"
              />
              <span className="text-sm text-[#F5EDE0]/70">全选</span>
            </label>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-12 text-[#F5EDE0]/50">
              <div className="w-8 h-8 border-2 border-[#C9A962]/30 border-t-[#C9A962] rounded-full animate-spin mx-auto mb-3" />
              <p>加载中...</p>
            </div>
          ) : filteredTasks.length === 0 ? (
            <div className="text-center py-16 text-[#F5EDE0]/50">
              <ImageIcon className="w-16 h-16 mx-auto mb-4 opacity-20" />
              <p className="text-lg">暂无历史记录</p>
              <p className="text-sm mt-2">上传图片并开始修复以查看记录</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  isSelected={selectedTasks.has(task.id)}
                  onToggleSelect={() => toggleSelect(task.id)}
                  onPreview={() => navigate(`/preview/${task.id}`)}
                  onDelete={() => handleDelete(task.id)}
                  onRetry={() => handleRetry(task.id)}
                  onDownload={() => handleDownload(task)}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

interface TaskCardProps {
  task: RepairTask;
  isSelected: boolean;
  onToggleSelect: () => void;
  onPreview: () => void;
  onDelete: () => void;
  onRetry: () => void;
  onDownload: () => void;
}

const TaskCard: React.FC<TaskCardProps> = ({
  task,
  isSelected,
  onToggleSelect,
  onPreview,
  onDelete,
  onRetry,
  onDownload,
}) => {
  return (
    <div
      className={`group relative rounded-xl border overflow-hidden transition-all duration-300 ${
        isSelected
          ? 'border-[#C9A962] ring-2 ring-[#C9A962]/30'
          : 'border-[#C9A962]/10 hover:border-[#C9A962]/30'
      } ${getStatusBgColor(task.status)}`}
    >
      <div className="absolute top-2 left-2 z-10">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={onToggleSelect}
          onClick={(e) => e.stopPropagation()}
          className="w-4 h-4 rounded border-[#C9A962]/30 bg-black/50 text-[#C9A962] focus:ring-[#C9A962]"
        />
      </div>

      <div className="absolute top-2 right-2 z-10">
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
            task.status
          )} bg-black/50 backdrop-blur-sm`}
        >
          {getStatusText(task.status)}
        </span>
      </div>

      <div className="aspect-[4/3] bg-[#2D1B0E] relative overflow-hidden">
        <img
          src={task.processedUrl ? getImageUrl(task.processedUrl.split('/').pop()!, 'processed') : getImageUrl(task.image.filename)}
          alt={task.image.originalName}
          className="w-full h-full object-cover"
        />
        {task.status === 'processing' && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <div className="text-center">
              <div className="w-10 h-10 border-2 border-[#C9A962]/30 border-t-[#C9A962] rounded-full animate-spin mx-auto mb-2" />
              <p className="text-sm text-[#C9A962] font-medium">{task.progress}%</p>
            </div>
          </div>
        )}
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
          {task.status === 'completed' && (
            <Button
              variant="primary"
              size="sm"
              icon={<Eye className="w-4 h-4" />}
              onClick={onPreview}
            >
              查看
            </Button>
          )}
          {task.status === 'failed' && (
            <Button
              variant="secondary"
              size="sm"
              icon={<RefreshCw className="w-4 h-4" />}
              onClick={onRetry}
            >
              重试
            </Button>
          )}
        </div>
      </div>

      <div className="p-3">
        <p className="text-sm font-medium text-[#F5EDE0] truncate" title={task.image.originalName}>
          {task.image.originalName}
        </p>
        <div className="flex items-center gap-3 mt-2 text-xs text-[#F5EDE0]/50">
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {formatDate(task.createdAt)}
          </span>
          <span>{formatFileSize(task.image.size)}</span>
        </div>
        <div className="flex flex-wrap gap-1 mt-2">
          {task.options.modes.map((mode) => (
            <span
              key={mode}
              className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-[#8B5CF6]/20 text-[#A78BFA] border border-[#8B5CF6]/30"
            >
              {REPAIR_MODE_LABELS[mode]}
            </span>
          ))}
        </div>
        <div className="flex items-center gap-2 mt-3">
          {task.status === 'completed' && (
            <>
              <Button
                variant="ghost"
                size="sm"
                icon={<Eye className="w-4 h-4" />}
                onClick={onPreview}
                className="flex-1"
              >
                查看
              </Button>
              <Button
                variant="ghost"
                size="sm"
                icon={<Download className="w-4 h-4" />}
                onClick={onDownload}
                className="flex-1"
              >
                下载
              </Button>
            </>
          )}
          <Button
            variant="ghost"
            size="sm"
            icon={<Trash2 className="w-4 h-4" />}
            onClick={onDelete}
            className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
          />
        </div>
      </div>
    </div>
  );
};

export default History;
