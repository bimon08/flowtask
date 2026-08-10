'use client';

import { useState } from 'react';
import { useTaskStore } from '@/store/useTaskStore';
import TaskList from './TaskList';
import { Task } from '@/types/task';

type Filter = 'all' | 'today' | 'week' | 'month' | 'year';

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all',   label: 'All'   },
  { id: 'today', label: 'Today' },
  { id: 'week',  label: 'Week'  },
  { id: 'month', label: 'Month' },
  { id: 'year',  label: 'Year'  },
];

function periodStart(filter: Filter): number {
  const now = new Date();
  switch (filter) {
    case 'today': {
      const d = new Date(now); d.setHours(0,0,0,0); return d.getTime();
    }
    case 'week': {
      const d = new Date(now); d.setDate(d.getDate() - d.getDay()); d.setHours(0,0,0,0); return d.getTime();
    }
    case 'month': {
      return new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    }
    case 'year': {
      return new Date(now.getFullYear(), 0, 1).getTime();
    }
    default: return 0;
  }
}

function applyFilter(tasks: Task[], filter: Filter): Task[] {
  if (filter === 'all') return tasks;
  const from = periodStart(filter);
  return tasks.filter((t) => t.createdAt >= from);
}

export default function AllTasksView() {
  const [filter, setFilter] = useState<Filter>('all');

  const tasks        = useTaskStore((s) => s.tasks);
  const clearAllDone = useTaskStore((s) => s.clearAllDone);
  const toggleTask   = useTaskStore((s) => s.toggleTask);

  const rawPending = tasks.filter((t) => t.status === 'pending');
  const rawDone    = tasks.filter((t) => t.status === 'done');

  // Apply filter, then sort: age-sorted when filtered, manual when 'all'
  const pending = filter === 'all'
    ? rawPending.sort((a, b) => a.order - b.order)
    : applyFilter(rawPending, filter).sort((a, b) => a.createdAt - b.createdAt);

  const done = applyFilter(rawDone, filter)
    .sort((a, b) => (b.completedAt ?? 0) - (a.completedAt ?? 0));

  const isEmpty = pending.length === 0 && done.length === 0;

  return (
    <div>
      {/* ── Filter tabs ── */}
      <div className="flex gap-1 mb-5 overflow-x-auto no-scrollbar">
        {FILTERS.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setFilter(id)}
            className={`shrink-0 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 ${
              filter === id
                ? 'bg-[#2a2a2a] text-stone-200'
                : 'text-stone-600 hover:text-stone-400'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── Empty state ── */}
      {isEmpty && (
        <div className="flex flex-col items-center justify-center py-24 text-stone-700 select-none">
          <svg className="mb-3" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
            <circle cx="12" cy="12" r="9"/>
            <path d="M9 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <p className="text-sm">
            {filter === 'all' ? 'Nothing to do — enjoy your day' : `No tasks from this ${filter}`}
          </p>
        </div>
      )}

      {/* ── Pending ── */}
      {pending.length > 0 && (
        <div className="rounded-2xl overflow-hidden bg-[#1c1c1c]">
          <TaskList tasks={pending} sortMode={filter === 'all' ? 'manual' : 'age'} />
        </div>
      )}

      {/* ── Completed ── */}
      {done.length > 0 && (
        <div className="mt-8">
          <div className="flex items-center justify-between px-1 mb-3">
            <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-stone-600">
              Completed · {done.length}
            </span>
            <button
              onClick={clearAllDone}
              className="text-xs text-stone-600 hover:text-red-400 transition-colors"
            >
              Clear all
            </button>
          </div>
          <div className="rounded-2xl overflow-hidden bg-[#1c1c1c]">
            {done.map((task, i) => (
              <div
                key={task.id}
                className={`flex items-center gap-4 px-5 py-4 ${
                  i < done.length - 1 ? 'border-b border-[#2a2a2a]' : ''
                }`}
              >
                <button
                  onClick={() => toggleTask(task.id)}
                  aria-label="Mark as pending"
                  className="shrink-0 w-[22px] h-[22px] rounded-full bg-[#2a2a2a] border-2 border-[#333] flex items-center justify-center hover:border-stone-500 transition-all duration-200"
                >
                  <svg width="10" height="8" viewBox="0 0 10 8" fill="none" stroke="#57534e" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="1 4 3.5 6.5 9 1"/>
                  </svg>
                </button>
                <p className="flex-1 text-[15px] line-through text-stone-600 truncate">{task.title}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
