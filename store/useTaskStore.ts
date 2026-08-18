import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { arrayMove } from '@dnd-kit/sortable';
import { Task, TaskScope, TaskStatus, Commitment } from '@/types/task';

// ── Helpers ──────────────────────────────────────────────────

function todayISO(): string {
  return new Date().toISOString().slice(0, 10); // "2026-08-18"
}

function daysBetween(startMs: number, nowMs: number): number {
  const start = new Date(startMs);
  start.setHours(0, 0, 0, 0);
  const now = new Date(nowMs);
  now.setHours(0, 0, 0, 0);
  return Math.floor((now.getTime() - start.getTime()) / 86_400_000) + 1;
}

// ── Store interface ──────────────────────────────────────────

interface TaskStore {
  tasks: Task[];
  commitments: Commitment[];

  // Task actions
  addTask: (title: string, scope: TaskScope, description?: string) => void;
  toggleTask: (id: string) => void;
  editTask: (id: string, title: string, description?: string) => void;
  deleteTask: (id: string) => void;
  reorderTasks: (scope: TaskScope, activeId: string, overId: string) => void;
  reorderAllTasks: (activeId: string, overId: string) => void;
  clearDone: (scope: TaskScope) => void;
  clearAllDone: () => void;

  // Commitment actions
  addCommitment: (title: string, durationDays: number, description?: string) => void;
  checkInCommitment: (id: string) => void;
  breakCommitment: (id: string) => void;
  restartCommitment: (id: string) => void;
  deleteCommitment: (id: string) => void;
}

export const useTaskStore = create<TaskStore>()(
  persist(
    (set, get) => ({
      tasks: [],
      commitments: [],

      // ── Task actions (unchanged) ─────────────────────────────

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

      // ── Commitment actions ───────────────────────────────────

      addCommitment: (title, durationDays, description) => {
        const now = Date.now();
        const commitment: Commitment = {
          id: crypto.randomUUID(),
          title: title.trim(),
          description: description?.trim() || undefined,
          status: 'active',
          durationDays,
          startedAt: now,
          checkedInDates: [],
          createdAt: now,
        };
        set((state) => ({ commitments: [...state.commitments, commitment] }));
      },

      checkInCommitment: (id) => {
        const today = todayISO();
        set((state) => ({
          commitments: state.commitments.map((c) => {
            if (c.id !== id || c.status !== 'active') return c;
            if (c.checkedInDates.includes(today)) return c; // already checked in

            const updated = { ...c, checkedInDates: [...c.checkedInDates, today] };

            // Check if commitment is now complete
            const currentDay = daysBetween(c.startedAt, Date.now());
            if (currentDay >= c.durationDays && updated.checkedInDates.length >= c.durationDays) {
              updated.status = 'completed';
              updated.completedAt = Date.now();
            }

            return updated;
          }),
        }));
      },

      breakCommitment: (id) => {
        set((state) => ({
          commitments: state.commitments.map((c) => {
            if (c.id !== id || c.status !== 'active') return c;
            const currentDay = daysBetween(c.startedAt, Date.now());
            return {
              ...c,
              status: 'broken' as const,
              brokenAt: Date.now(),
              brokenOnDay: currentDay,
            };
          }),
        }));
      },

      restartCommitment: (id) => {
        const now = Date.now();
        set((state) => ({
          commitments: state.commitments.map((c) => {
            if (c.id !== id) return c;
            return {
              ...c,
              status: 'active' as const,
              startedAt: now,
              checkedInDates: [],
              brokenAt: undefined,
              brokenOnDay: undefined,
              completedAt: undefined,
            };
          }),
        }));
      },

      deleteCommitment: (id) => {
        set((state) => ({
          commitments: state.commitments.filter((c) => c.id !== id),
        }));
      },
    }),
    {
      name: 'flowtask-store',
    }
  )
);
