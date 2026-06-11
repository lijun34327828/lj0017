import { create } from 'zustand';
import type { RepairTask, ProgressUpdate } from '../types';

interface TaskStore {
  tasks: RepairTask[];
  isLoading: boolean;
  error: string | null;
  setTasks: (tasks: RepairTask[]) => void;
  addTask: (task: RepairTask) => void;
  updateTask: (id: string, updates: Partial<RepairTask>) => void;
  removeTask: (id: string) => void;
  handleProgressUpdate: (update: ProgressUpdate) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  getTask: (id: string) => RepairTask | undefined;
}

export const useTaskStore = create<TaskStore>((set, get) => ({
  tasks: [],
  isLoading: false,
  error: null,

  setTasks: (tasks) => set({ tasks }),

  addTask: (task) =>
    set((state) => ({
      tasks: [task, ...state.tasks],
    })),

  updateTask: (id, updates) =>
    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === id ? { ...t, ...updates } : t
      ),
    })),

  removeTask: (id) =>
    set((state) => ({
      tasks: state.tasks.filter((t) => t.id !== id),
    })),

  handleProgressUpdate: (update) =>
    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === update.taskId
          ? {
              ...t,
              status: update.status,
              progress: update.progress,
              progressMessage: update.message,
            }
          : t
      ),
    })),

  setLoading: (loading) => set({ isLoading: loading }),

  setError: (error) => set({ error }),

  getTask: (id) => get().tasks.find((t) => t.id === id),
}));
