import React, { useState, useEffect } from 'react';
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
import { getTasks, deleteTask, retryTask } from '@/utils/api';
import { useTaskStore } from '@/store/useTaskStore';
import { formatDate, formatFileSize, getStatusText, getStatusColor, getStatusBgColor } from '@/utils/format';
import type { RepairTask, TaskStatus } from '@/types';
import { getImageUrl } from '@/utils/api';

const History: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'all'>('all');
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
      const params: any = { limit: 100 };
      if (statusFilter !== 'all') params.status = statusFilter;
      if (searchQuery) params.search = searchQuery;

      const { list } = await getTasks(params);
      setTasks(list);
    } catch (e) {
      console.error('Load tasks failed:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadTasks();
  };

  const handleStatusChange = (status: TaskStatus | 'all') => {
    setStatusFilter(status);
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

  const filteredTasks = tasks.filter((task) => {
    if (statusFilter !== 'all' && task.status !== statusFilter) return false;
    if (searchQuery && !task.image.originalName.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const completedTasks = filteredTasks.filter((t) => t.status === 'completed');

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
                <div className="flex gap-1">
                  {(['all', 'pending', 'processing', 'completed', 'failed'] as const).map((status) => (
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
}

const TaskCard: React.FC<TaskCardProps> = ({
  task,
  isSelected,
  onToggleSelect,
  onPreview,
  onDelete,
  onRetry,
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
        <div className="flex items-center gap-2 mt-3">
          {task.status === 'completed' && (
            <Button
              variant="ghost"
              size="sm"
              icon={<Download className="w-4 h-4" />}
              onClick={onPreview}
              className="flex-1"
            >
              下载
            </Button>
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
