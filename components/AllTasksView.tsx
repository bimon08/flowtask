'use client';

import { useState } from 'react';
import { useTaskStore } from '@/store/useTaskStore';
import TaskList from './TaskList';
import { Task } from '@/types/task';

type Filter = 'all' | 'today' | 'week' | 'month' | 'year';

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all',   label: 'ALL'   },
  { id: 'today', label: 'TODAY' },
  { id: 'week',  label: 'WEEK'  },
  { id: 'month', label: 'MONTH' },
  { id: 'year',  label: 'YEAR'  },
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
      {/* ── Filter tabs — Nothing style ── */}
      <div className="flex gap-0 mb-6 overflow-x-auto no-scrollbar">
        {FILTERS.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setFilter(id)}
            className={`shrink-0 px-3 py-1.5 font-dot text-[10px] tracking-wider transition-all duration-150 border-b ${
              filter === id
                ? 'text-white border-[var(--accent)]'
                : 'text-[#444] border-transparent hover:text-[#777]'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── Empty state ── */}
      {isEmpty && (
        <div className="flex flex-col items-center justify-center py-24 select-none">
          {/* Dot-matrix circle */}
          <div className="w-12 h-12 border border-[#1a1a1a] flex items-center justify-center mb-4">
            <span className="font-dot text-lg text-[#222]">·</span>
          </div>
          <p className="font-dot text-[11px] text-[#333] uppercase tracking-wider">
            {filter === 'all' ? 'Nothing to do' : `No tasks from ${filter}`}
          </p>
        </div>
      )}

      {/* ── Pending ── */}
      {pending.length > 0 && (
        <div className="border border-[#1a1a1a] bg-[#0a0a0a]">
          <TaskList tasks={pending} sortMode={filter === 'all' ? 'manual' : 'age'} />
        </div>
      )}

      {/* ── Completed ── */}
      {done.length > 0 && (
        <div className="mt-8">
          <div className="flex items-center justify-between px-1 mb-3">
            <span className="font-dot text-[10px] uppercase tracking-wider text-[#444]">
              Done · {done.length}
            </span>
            <button
              onClick={clearAllDone}
              className="font-dot text-[10px] text-[#333] hover:text-[var(--accent)] transition-colors uppercase tracking-wider"
            >
              Clear
            </button>
          </div>
          <div className="border border-[#1a1a1a] bg-[#0a0a0a]">
            {done.map((task, i) => (
              <div
                key={task.id}
                className={`flex items-center gap-4 px-5 py-4 ${
                  i < done.length - 1 ? 'border-b border-[#1a1a1a]' : ''
                }`}
              >
                <button
                  onClick={() => toggleTask(task.id)}
                  aria-label="Mark as pending"
                  className="shrink-0 w-[18px] h-[18px] border border-[#333] flex items-center justify-center hover:border-[#555] transition-all duration-200"
                >
                  <svg width="8" height="6" viewBox="0 0 10 8" fill="none" stroke="var(--accent)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="1 4 3.5 6.5 9 1"/>
                  </svg>
                </button>
                <p className="flex-1 text-[13px] line-through text-[#444] truncate">{task.title}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
