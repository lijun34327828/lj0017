export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}`;
}

export function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours}小时${minutes % 60}分钟`;
  }
  if (minutes > 0) {
    return `${minutes}分钟${seconds % 60}秒`;
  }
  return `${seconds}秒`;
}

export function getStatusText(status: string): string {
  const statusMap: Record<string, string> = {
    pending: '等待中',
    queued: '队列中',
    processing: '处理中',
    paused: '已暂停',
    completed: '已完成',
    failed: '失败',
  };
  return statusMap[status] || status;
}

export function getStatusColor(status: string): string {
  const colorMap: Record<string, string> = {
    pending: 'text-gray-400',
    queued: 'text-yellow-400',
    processing: 'text-blue-400',
    paused: 'text-orange-400',
    completed: 'text-green-400',
    failed: 'text-red-400',
  };
  return colorMap[status] || 'text-gray-400';
}

export function getStatusBgColor(status: string): string {
  const colorMap: Record<string, string> = {
    pending: 'bg-gray-700/50',
    queued: 'bg-yellow-900/30',
    processing: 'bg-blue-900/30',
    paused: 'bg-orange-900/30',
    completed: 'bg-green-900/30',
    failed: 'bg-red-900/30',
  };
  return colorMap[status] || 'bg-gray-700/50';
}
