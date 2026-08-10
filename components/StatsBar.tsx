'use client';

import { Task } from '@/types/task';

interface StatsBarProps {
  pending: Task[];
  done: Task[];
}

export default function StatsBar({ pending, done }: StatsBarProps) {
  const totalMinutes = pending.reduce((sum, t) => sum + (t.estimatedMinutes ?? 0), 0);
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  const timeLabel = totalMinutes > 0
    ? hours > 0 ? `${hours}h ${mins > 0 ? `${mins}m` : ''}`.trim() : `${mins}m`
    : null;

  return (
    <div className="flex flex-wrap items-center gap-2 mb-4">
      <span className="rounded-full border border-stone-200 bg-white px-3 py-1 text-[12px] font-medium text-stone-600 shadow-sm">
        {pending.length} pending
      </span>
      {done.length > 0 && (
        <span className="rounded-full border border-green-100 bg-green-50 px-3 py-1 text-[12px] font-medium text-green-600 shadow-sm">
          {done.length} done ✓
        </span>
      )}
      {timeLabel && (
        <span className="rounded-full border border-violet-100 bg-violet-50 px-3 py-1 text-[12px] font-medium text-violet-600 shadow-sm">
          ~{timeLabel} remaining
        </span>
      )}
    </div>
  );
}
