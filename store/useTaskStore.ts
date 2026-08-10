import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { arrayMove } from '@dnd-kit/sortable';
import { Task, TaskScope, TaskStatus } from '@/types/task';

interface TaskStore {
  tasks: Task[];
  addTask: (title: string, scope: TaskScope, description?: string) => void;
  toggleTask: (id: string) => void;
  editTask: (id: string, title: string, description?: string) => void;
  deleteTask: (id: string) => void;
  reorderTasks: (scope: TaskScope, activeId: string, overId: string) => void;
  reorderAllTasks: (activeId: string, overId: string) => void;
  clearDone: (scope: TaskScope) => void;
  clearAllDone: () => void;
}

export const useTaskStore = create<TaskStore>()(
  persist(
    (set, get) => ({
      tasks: [],

      addTask: (title, scope, description) => {
        const { tasks } = get();
        const allPending = tasks.filter((t) => t.status === 'pending');
        const minOrder = allPending.length > 0 ? Math.min(...allPending.map((t) => t.order)) : 1;
        const newTask: Task = {
          id: crypto.randomUUID(),
          title: title.trim(),
          description: description?.trim() || undefined,
          status: 'pending',
          scope,
          createdAt: Date.now(),
          order: minOrder - 1,
        };
        set((state) => ({ tasks: [...state.tasks, newTask] }));
      },

      toggleTask: (id) => {
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === id
              ? {
                  ...t,
                  status: (t.status === 'pending' ? 'done' : 'pending') as TaskStatus,
                  completedAt: t.status === 'pending' ? Date.now() : undefined,
                }
              : t
          ),
        }));
      },

      editTask: (id, title, description) => {
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === id ? { ...t, title: title.trim(), description: description?.trim() || undefined } : t
          ),
        }));
      },

      deleteTask: (id) => {
        set((state) => ({ tasks: state.tasks.filter((t) => t.id !== id) }));
      },

      reorderTasks: (scope, activeId, overId) => {
        const { tasks } = get();
        const scopePending = tasks
          .filter((t) => t.scope === scope && t.status === 'pending')
          .sort((a, b) => a.order - b.order);

        const activeIndex = scopePending.findIndex((t) => t.id === activeId);
        const overIndex = scopePending.findIndex((t) => t.id === overId);

        if (activeIndex === -1 || overIndex === -1) return;

        const reordered = arrayMove(scopePending, activeIndex, overIndex).map(
          (t, idx) => ({ ...t, order: idx })
        );

        set((state) => ({
          tasks: state.tasks.map((t) => {
            const updated = reordered.find((r) => r.id === t.id);
            return updated ?? t;
          }),
        }));
      },

      clearDone: (scope) => {
        set((state) => ({
          tasks: state.tasks.filter((t) => !(t.scope === scope && t.status === 'done')),
        }));
      },

      reorderAllTasks: (activeId, overId) => {
        const { tasks } = get();
        const pending = tasks.filter((t) => t.status === 'pending').sort((a, b) => a.order - b.order);
        const activeIndex = pending.findIndex((t) => t.id === activeId);
        const overIndex   = pending.findIndex((t) => t.id === overId);
        if (activeIndex === -1 || overIndex === -1) return;
        const reordered = arrayMove(pending, activeIndex, overIndex).map((t, idx) => ({ ...t, order: idx }));
        set((state) => ({
          tasks: state.tasks.map((t) => reordered.find((r) => r.id === t.id) ?? t),
        }));
      },

      clearAllDone: () => {
        set((state) => ({ tasks: state.tasks.filter((t) => t.status !== 'done') }));
      },
    }),
    {
      name: 'flowtask-store',
    }
  )
);
