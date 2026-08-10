'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useTaskStore } from '@/store/useTaskStore';
import { Task, TaskScope } from '@/types/task';

interface DoneListProps {
  scope: TaskScope;
  tasks: Task[];
}

export default function DoneList({ scope, tasks }: DoneListProps) {
  const clearDone = useTaskStore((s) => s.clearDone);
  const toggleTask = useTaskStore((s) => s.toggleTask);

  if (tasks.length === 0) return null;

  return (
    <div className="mt-6">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-stone-400">
            Done
          </span>
          <span className="rounded-full bg-stone-100 px-2 py-0.5 text-[11px] font-medium text-stone-500">
            {tasks.length}
          </span>
        </div>
        <button
          onClick={() => clearDone(scope)}
          id={`clear-done-${scope}`}
          className="text-xs text-stone-400 hover:text-red-400 transition-colors"
        >
          Clear all
        </button>
      </div>

      <div className="flex flex-col gap-1.5">
        <AnimatePresence mode="popLayout">
          {tasks.map((task) => (
            <motion.div
              key={task.id}
              layout
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="group flex items-center gap-3 rounded-lg border border-stone-100 bg-stone-50 px-3 py-2.5"
            >
              <span className="text-green-400 text-sm shrink-0">✓</span>
              <span className="flex-1 text-sm line-through text-stone-400 truncate">
                {task.title}
              </span>
              {task.estimatedMinutes && (
                <span className="text-[10px] text-stone-300 shrink-0">{task.estimatedMinutes}m</span>
              )}
              <button
                onClick={() => toggleTask(task.id)}
                id={`undo-task-${task.id}`}
                aria-label="Mark as pending"
                title="Undo — mark as pending"
                className="
                  flex items-center justify-center w-7 h-7 shrink-0 rounded-lg
                  bg-violet-50 text-violet-400 hover:bg-violet-100 active:bg-violet-200
                  transition-all duration-150
                "
              >
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 4h7a4 4 0 1 1 0 8H1" />
                  <polyline points="4 1 1 4 4 7" />
                </svg>
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
