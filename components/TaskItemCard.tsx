'use client';

import { Task } from '@/types/task';

function formatDue(ts: number): { label: string; urgent: boolean } {
  const now = new Date();
  const due = new Date(ts);
  const diffDays = Math.ceil(
    (due.setHours(0,0,0,0) - new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()) / 86400000
  );
  if (diffDays < 0)  return { label: 'Overdue', urgent: true };
  if (diffDays === 0) return { label: 'Today', urgent: false };
  if (diffDays === 1) return { label: 'Tomorrow', urgent: false };
  return { label: new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), urgent: false };
}

interface TaskItemCardProps {
  task: Task;
  /** True when rendered inside DragOverlay — adds elevation + scale */
  floating?: boolean;
}

export default function TaskItemCard({ task, floating = false }: TaskItemCardProps) {
  const isDone = task.status === 'done';

  return (
    <div
      className={`
        flex items-center gap-3 rounded-xl border bg-white
        px-3 py-3
        ${floating
          ? 'border-violet-300 shadow-2xl scale-[1.03] rotate-[0.8deg] cursor-grabbing'
          : 'border-stone-200 shadow-sm'
        }
        ${isDone ? 'opacity-50' : ''}
      `}
    >
      {/* Drag handle dots */}
      <span className="flex items-center justify-center w-6 h-6 shrink-0 text-stone-300">
        <svg width="10" height="16" viewBox="0 0 10 16" fill="currentColor">
          <circle cx="2" cy="2" r="1.5" /><circle cx="8" cy="2" r="1.5" />
          <circle cx="2" cy="8" r="1.5" /><circle cx="8" cy="8" r="1.5" />
          <circle cx="2" cy="14" r="1.5" /><circle cx="8" cy="14" r="1.5" />
        </svg>
      </span>

      {/* Checkbox (visual only — not interactive in overlay) */}
      <span
        className={`
          flex items-center justify-center w-[22px] h-[22px] shrink-0 rounded-md border-2
          ${isDone ? 'bg-violet-500 border-violet-500' : 'bg-white border-stone-300'}
        `}
      >
        {isDone && (
          <svg width="12" height="10" viewBox="0 0 12 10" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="1 5 4.5 8.5 11 1" />
          </svg>
        )}
      </span>

      {/* Title + badges */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={`text-sm leading-snug truncate ${isDone ? 'line-through text-stone-400' : 'text-stone-800'}`}>
            {task.title}
          </span>
          {task.estimatedMinutes && (
            <span className="shrink-0 rounded-full bg-violet-50 px-2 py-0.5 text-[10px] font-medium text-violet-500">
              {task.estimatedMinutes}m
            </span>
          )}
          {task.dueDate && !isDone && (() => {
            const { label, urgent } = formatDue(task.dueDate);
            return (
              <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                urgent ? 'bg-red-50 text-red-500'
                : label === 'Today' ? 'bg-amber-50 text-amber-600'
                : 'bg-stone-100 text-stone-500'
              }`}>
                {label}
              </span>
            );
          })()}
        </div>
      </div>

      {/* Delete placeholder (no-op in overlay) */}
      <span className="w-7 h-7 shrink-0" />
    </div>
  );
}
