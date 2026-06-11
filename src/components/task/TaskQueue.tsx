import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Pause,
  Play,
  RefreshCw,
  Trash2,
  Eye,
  Clock,
  AlertCircle,
  CheckCircle2,
  Loader2,
  ListTodo,
} from 'lucide-react';
import { Button } from '../common/Button';
import { Card, CardContent, CardHeader } from '../common/Card';
import { useTaskStore } from '@/store/useTaskStore';
import { useWebSocket } from '@/hooks/useWebSocket';
import { getTasks, pauseTask, resumeTask, retryTask, deleteTask } from '@/utils/api';
import { formatDate, getStatusText, getStatusColor, getStatusBgColor } from '@/utils/format';
import type { RepairTask } from '@/types';
import { getImageUrl } from '@/utils/api';

const TaskItem: React.FC<{ task: RepairTask }> = ({ task }) => {
  const navigate = useNavigate();
  const updateTask = useTaskStore((state) => state.updateTask);
  const removeTask = useTaskStore((state) => state.removeTask);
  const [isActionLoading, setIsActionLoading] = React.useState<string | null>(null);

  const handlePause = async () => {
    setIsActionLoading('pause');
    try {
      await pauseTask(task.id);
      updateTask(task.id, { status: 'paused' });
    } catch (e) {
      console.error('Pause failed:', e);
    } finally {
      setIsActionLoading(null);
    }
  };

  const handleResume = async () => {
    setIsActionLoading('resume');
    try {
      await resumeTask(task.id);
      updateTask(task.id, { status: 'queued' });
    } catch (e) {
      console.error('Resume failed:', e);
    } finally {
      setIsActionLoading(null);
    }
  };

  const handleRetry = async () => {
    setIsActionLoading('retry');
    try {
      await retryTask(task.id);
      updateTask(task.id, { status: 'queued', progress: 0, progressMessage: '等待处理...' });
    } catch (e) {
      console.error('Retry failed:', e);
    } finally {
      setIsActionLoading(null);
    }
  };

  const handleDelete = async () => {
    if (confirm('确定要删除此任务吗？')) {
      setIsActionLoading('delete');
      try {
        await deleteTask(task.id);
        removeTask(task.id);
      } catch (e) {
        console.error('Delete failed:', e);
      } finally {
        setIsActionLoading(null);
      }
    }
  };

  const handlePreview = () => {
    navigate(`/preview/${task.id}`);
  };

  const StatusIcon = () => {
    switch (task.status) {
      case 'completed':
        return <CheckCircle2 className="w-5 h-5 text-green-400" />;
      case 'failed':
        return <AlertCircle className="w-5 h-5 text-red-400" />;
      case 'processing':
        return <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />;
      case 'paused':
        return <Pause className="w-5 h-5 text-orange-400" />;
      case 'queued':
        return <Clock className="w-5 h-5 text-yellow-400" />;
      default:
        return <ListTodo className="w-5 h-5 text-gray-400" />;
    }
  };

  return (
    <div className={`p-4 rounded-lg border ${getStatusBgColor(task.status)} border-[#C9A962]/10 transition-all hover:border-[#C9A962]/30`}>
      <div className="flex items-start gap-4">
        <div className="w-20 h-20 rounded-lg overflow-hidden bg-[#2D1B0E] flex-shrink-0">
          <img
            src={getImageUrl(task.image.filename)}
            alt={task.image.originalName}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-sm font-medium text-[#F5EDE0] truncate">
                {task.image.originalName}
              </p>
              <p className="text-xs text-[#F5EDE0]/50 mt-1">
                {formatDate(task.createdAt)}
              </p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)} bg-black/30`}>
                <StatusIcon />
                {getStatusText(task.status)}
              </span>
            </div>
          </div>

          {task.status === 'processing' && (
            <div className="mt-3">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-[#F5EDE0]/70">{task.progressMessage}</span>
                <span className="text-[#C9A962] font-medium">{task.progress}%</span>
              </div>
              <div className="h-2 bg-black/30 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#C9A962] to-[#D4B872] rounded-full transition-all duration-500"
                  style={{ width: `${task.progress}%` }}
                />
              </div>
            </div>
          )}

          {task.status === 'failed' && task.error && (
            <p className="mt-2 text-xs text-red-400 bg-red-900/20 px-3 py-2 rounded-lg">
              {task.error}
            </p>
          )}

          <div className="flex items-center gap-2 mt-3">
            {task.status === 'processing' && (
              <Button
                variant="ghost"
                size="sm"
                icon={<Pause className="w-4 h-4" />}
                loading={isActionLoading === 'pause'}
                onClick={handlePause}
              >
                暂停
              </Button>
            )}
            {task.status === 'paused' && (
              <Button
                variant="secondary"
                size="sm"
                icon={<Play className="w-4 h-4" />}
                loading={isActionLoading === 'resume'}
                onClick={handleResume}
              >
                继续
              </Button>
            )}
            {task.status === 'failed' && (
              <Button
                variant="secondary"
                size="sm"
                icon={<RefreshCw className="w-4 h-4" />}
                loading={isActionLoading === 'retry'}
                onClick={handleRetry}
              >
                重试
              </Button>
            )}
            {task.status === 'completed' && (
              <Button
                variant="primary"
                size="sm"
                icon={<Eye className="w-4 h-4" />}
                onClick={handlePreview}
              >
                查看结果
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              icon={<Trash2 className="w-4 h-4" />}
              loading={isActionLoading === 'delete'}
              onClick={handleDelete}
              className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export const TaskQueue: React.FC = () => {
  const tasks = useTaskStore((state) => state.tasks);
  const setTasks = useTaskStore((state) => state.setTasks);
  const setLoading = useTaskStore((state) => state.setLoading);
  const isLoading = useTaskStore((state) => state.isLoading);

  useWebSocket();

  useEffect(() => {
    const loadTasks = async () => {
      setLoading(true);
      try {
        const { list } = await getTasks({ limit: 20 });
        setTasks(list);
      } catch (e) {
        console.error('Load tasks failed:', e);
      } finally {
        setLoading(false);
      }
    };
    loadTasks();
  }, [setTasks, setLoading]);

  const activeTasks = tasks.filter((t) => t.status !== 'completed');
  const completedTasks = tasks.filter((t) => t.status === 'completed');

  return (
    <Card>
      <CardHeader>
        <div>
          <h3 className="text-lg font-semibold text-[#F5EDE0]" style={{ fontFamily: "'Playfair Display', serif" }}>
            任务队列
          </h3>
          <p className="text-xs text-[#F5EDE0]/50 mt-1">
            共 {tasks.length} 个任务，进行中 {activeTasks.length} 个
          </p>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading && tasks.length === 0 ? (
          <div className="text-center py-8 text-[#F5EDE0]/50">
            <Loader2 className="w-8 h-8 mx-auto mb-3 animate-spin opacity-50" />
            <p>加载中...</p>
          </div>
        ) : tasks.length === 0 ? (
          <div className="text-center py-8 text-[#F5EDE0]/50">
            <ListTodo className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>暂无任务</p>
            <p className="text-xs mt-1">上传图片并开始修复</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
            {activeTasks.map((task) => (
              <TaskItem key={task.id} task={task} />
            ))}
            {completedTasks.map((task) => (
              <TaskItem key={task.id} task={task} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
