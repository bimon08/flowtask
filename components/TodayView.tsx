'use client';

import { useTaskStore } from '@/store/useTaskStore';
import TaskList from './TaskList';
import DoneList from './DoneList';
import StatsBar from './StatsBar';

export default function TodayView() {
  const tasks = useTaskStore((s) => s.tasks);

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  const pending = tasks
    .filter((t) => t.scope === 'today' && t.status === 'pending')
    .sort((a, b) => a.order - b.order);

  const done = tasks
    .filter((t) => t.scope === 'today' && t.status === 'done')
    .sort((a, b) => (b.completedAt ?? 0) - (a.completedAt ?? 0));

  return (
    <div className="flex flex-col gap-5">
      <div>
        <p className="text-[11px] uppercase tracking-widest text-stone-400 font-semibold mb-0.5">Today</p>
        <h2 className="text-xl font-bold text-stone-900">{today}</h2>
      </div>

      <StatsBar pending={pending} done={done} />
      <TaskList tasks={pending} />
      <DoneList scope="today" tasks={done} />
    </div>
  );
}
