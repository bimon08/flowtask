'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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

/* ─── Stagger variants ────────────────────────────────────── */
const listContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.04, delayChildren: 0.05 },
  },
};

const listItem = {
  hidden: { opacity: 0, x: -8 },
  show: { opacity: 1, x: 0, transition: { duration: 0.25, ease: 'easeOut' as const } },
};

export default function AllTasksView() {
  const [filter, setFilter] = useState<Filter>('all');

  const tasks        = useTaskStore((s) => s.tasks);
  const clearAllDone = useTaskStore((s) => s.clearAllDone);
  const toggleTask   = useTaskStore((s) => s.toggleTask);

  const rawPending = tasks.filter((t) => t.status === 'pending');
  const rawDone    = tasks.filter((t) => t.status === 'done');

  const pending = filter === 'all'
    ? rawPending.sort((a, b) => a.order - b.order)
    : applyFilter(rawPending, filter).sort((a, b) => a.createdAt - b.createdAt);

  const done = applyFilter(rawDone, filter)
    .sort((a, b) => (b.completedAt ?? 0) - (a.completedAt ?? 0));

  const isEmpty = pending.length === 0 && done.length === 0;

  return (
    <div>
      {/* ── Filter tabs — Nothing style with animated underline ── */}
      <div className="flex gap-0 mb-6 overflow-x-auto no-scrollbar relative">
        {FILTERS.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setFilter(id)}
            className={`relative shrink-0 px-3 py-1.5 font-dot text-[10px] tracking-wider transition-colors duration-150 ${
              filter === id ? 'text-white' : 'text-[#444] hover:text-[#777]'
            }`}
          >
            {label}
            {filter === id && (
              <motion.div
                layoutId="filter-underline"
                className="absolute bottom-0 left-0 right-0 h-[2px] bg-[var(--accent)]"
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />
            )}
          </button>
        ))}
      </div>

      {/* ── Content with crossfade on filter change ── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={filter}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
        >
          {/* ── Empty state — animated ── */}
          {isEmpty && (
            <motion.div
              className="flex flex-col items-center justify-center py-24 select-none"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
            >
              <motion.div
                className="w-12 h-12 border border-[#1a1a1a] flex items-center justify-center mb-4"
                animate={{ borderColor: ['#1a1a1a', '#333', '#1a1a1a'] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              >
                <motion.span
                  className="font-dot text-lg text-[#222]"
                  animate={{ opacity: [0.3, 0.8, 0.3] }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                >
                  ·
                </motion.span>
              </motion.div>
              <p className="font-dot text-[11px] text-[#333] uppercase tracking-wider">
                {filter === 'all' ? 'Nothing to do' : `No tasks from ${filter}`}
              </p>
            </motion.div>
          )}

          {/* ── Pending ── */}
          {pending.length > 0 && (
            <motion.div
              className="border border-[#1a1a1a] bg-[#0a0a0a]"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
            >
              <TaskList tasks={pending} sortMode={filter === 'all' ? 'manual' : 'age'} />
            </motion.div>
          )}

          {/* ── Completed — staggered with AnimatePresence ── */}
          {done.length > 0 && (
            <motion.div
              className="mt-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              <div className="flex items-center justify-between px-1 mb-3">
                <span className="font-dot text-[10px] uppercase tracking-wider text-[#444]">
                  Done · {done.length}
                </span>
                <motion.button
                  onClick={clearAllDone}
                  whileTap={{ scale: 0.9 }}
                  className="font-dot text-[10px] text-[#333] hover:text-[var(--accent)] transition-colors uppercase tracking-wider"
                >
                  Clear
                </motion.button>
              </div>
              <motion.div
                className="border border-[#1a1a1a] bg-[#0a0a0a]"
                variants={listContainer}
                initial="hidden"
                animate="show"
              >
                <AnimatePresence mode="popLayout">
                  {done.map((task, i) => (
                    <motion.div
                      key={task.id}
                      variants={listItem}
                      layout
                      exit={{ opacity: 0, x: -30, height: 0, paddingTop: 0, paddingBottom: 0 }}
                      transition={{ duration: 0.2 }}
                      className={`flex items-center gap-4 px-5 py-4 ${
                        i < done.length - 1 ? 'border-b border-[#1a1a1a]' : ''
                      }`}
                    >
                      <motion.button
                        onClick={() => toggleTask(task.id)}
                        aria-label="Mark as pending"
                        whileTap={{ scale: 0.8 }}
                        className="shrink-0 w-[18px] h-[18px] border border-[#333] flex items-center justify-center hover:border-[#555] transition-all duration-200"
                      >
                        <svg width="8" height="6" viewBox="0 0 10 8" fill="none" stroke="var(--accent)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="1 4 3.5 6.5 9 1"/>
                        </svg>
                      </motion.button>
                      <p className="flex-1 text-[13px] line-through text-[#444] truncate">{task.title}</p>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>
            </motion.div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
