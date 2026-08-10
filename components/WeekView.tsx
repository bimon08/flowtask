'use client';

import { useTaskStore } from '@/store/useTaskStore';
import TaskList from './TaskList';
import DoneList from './DoneList';
import StatsBar from './StatsBar';

export default function WeekView() {
  const tasks = useTaskStore((s) => s.tasks);

  const pending = tasks
    .filter((t) => t.scope === 'week' && t.status === 'pending')
    .sort((a, b) => a.order - b.order);

  const done = tasks
    .filter((t) => t.scope === 'week' && t.status === 'done')
    .sort((a, b) => (b.completedAt ?? 0) - (a.completedAt ?? 0));

  // Days remaining in the week
  const dayOfWeek = new Date().getDay();
  const daysLeft = 7 - dayOfWeek;

  return (
    <div className="flex flex-col gap-5">
      <div>
        <p className="text-[11px] uppercase tracking-widest text-stone-400 font-semibold mb-0.5">This Week</p>
        <h2 className="text-xl font-bold text-stone-900">
          Pipeline
          <span className="ml-2 text-sm font-normal text-stone-400">
            {daysLeft} day{daysLeft !== 1 ? 's' : ''} left
          </span>
        </h2>
      </div>

      <StatsBar pending={pending} done={done} />
      <TaskList tasks={pending} />
      <DoneList scope="week" tasks={done} />
    </div>
  );
}
