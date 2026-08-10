# FlowTask — Agent Build Instructions

## Project Goal
Build **FlowTask**: a frictionless micro-task & time-tracking PWA scoped to hours and days (max 1 week). Offline-first, no backend.

## Tech Stack (STRICT — do not deviate)
- **Framework:** Next.js (App Router) + TypeScript — already scaffolded
- **Styling:** Tailwind CSS v4 (already installed) — use Tailwind utility classes directly, NO custom CSS files beyond `globals.css`
- **UI Components:** `@heroui/react` (already installed) — use for Card, Input, Checkbox, Button primitives
- **Animations:** `framer-motion` (already installed) — AnimatePresence + layout prop for enter/exit
- **Drag & Drop:** `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities` (already installed)
- **State:** `zustand` with `persist` middleware → `localStorage` only. NO backend, no server actions for data.
- **PWA:** `next-pwa` (already installed), manifest at `app/manifest.ts`

## What Is Already Done ✅
- `types/task.ts` — Task, TaskScope, TaskStatus interfaces
- `store/useTaskStore.ts` — full Zustand store with persist, addTask, toggleTask, editTask, deleteTask, reorderTasks (dnd-kit arrayMove), clearDone
- `app/manifest.ts` — PWA manifest
- `next.config.ts` — next-pwa config
- `public/icons/icon-192.png` and `public/icons/icon-512.png` — PWA icons
- `public/offline.html` — offline fallback

## YOUR TASK: Build Everything Below

Build all files in this exact order. Do NOT skip or simplify any file.

---

### STEP 1 — `app/globals.css` (OVERWRITE existing)

Replace the entire file with:

```css
@import "tailwindcss";

@theme inline {
  --font-sans: 'Inter', system-ui, sans-serif;
}

:root {
  --background: #fafaf9;
  --foreground: #1c1917;
}

* {
  box-sizing: border-box;
}

html, body {
  height: 100%;
}

body {
  background: var(--background);
  color: var(--foreground);
  font-family: var(--font-sans);
  -webkit-font-smoothing: antialiased;
}

/* Scrollbar styling */
::-webkit-scrollbar { width: 6px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: #d6d3d1; border-radius: 99px; }
```

---

### STEP 2 — `app/layout.tsx` (OVERWRITE existing)

```tsx
import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { HeroUIProvider } from '@heroui/react';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'FlowTask — Micro-Task Tracker',
  description: 'Frictionless micro-task tracking scoped to hours, days, and one week.',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'FlowTask',
  },
};

export const viewport: Viewport = {
  themeColor: '#fafaf9',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.className}>
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
      </head>
      <body className="min-h-full bg-stone-50">
        <HeroUIProvider>
          {children}
        </HeroUIProvider>
      </body>
    </html>
  );
}
```

---

### STEP 3 — `components/QuickCapture.tsx` (CREATE NEW)

A prominent task input. Enter key saves and clears while keeping focus. Support optional time estimate (e.g. "30m" suffix parsed from input).

```tsx
'use client';

import { useRef, useState, KeyboardEvent } from 'react';
import { motion } from 'framer-motion';
import { useTaskStore } from '@/store/useTaskStore';
import { TaskScope } from '@/types/task';

interface QuickCaptureProps {
  scope: TaskScope;
}

function parseMinutes(raw: string): { title: string; minutes?: number } {
  const match = raw.match(/^(.+?)\s+(\d+)m\s*$/i);
  if (match) return { title: match[1].trim(), minutes: parseInt(match[2]) };
  return { title: raw.trim() };
}

export default function QuickCapture({ scope }: QuickCaptureProps) {
  const [value, setValue] = useState('');
  const [shake, setShake] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const addTask = useTaskStore((s) => s.addTask);

  const submit = () => {
    const trimmed = value.trim();
    if (!trimmed) {
      setShake(true);
      setTimeout(() => setShake(false), 500);
      return;
    }
    const { title, minutes } = parseMinutes(trimmed);
    addTask(title, scope, minutes);
    setValue('');
    inputRef.current?.focus();
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') submit();
  };

  return (
    <motion.div
      animate={shake ? { x: [0, -8, 8, -6, 6, 0] } : { x: 0 }}
      transition={{ duration: 0.4 }}
      className="relative flex items-center gap-2"
    >
      <div className="relative flex-1">
        <input
          ref={inputRef}
          id={`quick-capture-${scope}`}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={scope === 'today' ? 'Add a task for today… (+ 30m for estimate)' : 'Plan something this week…'}
          autoComplete="off"
          className="
            w-full rounded-xl border border-stone-200 bg-white px-4 py-3.5
            text-sm text-stone-800 placeholder:text-stone-400
            shadow-sm outline-none ring-0
            transition-all duration-200
            focus:border-violet-400 focus:ring-2 focus:ring-violet-100
            min-h-[44px]
          "
        />
        <kbd className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 hidden sm:inline-flex items-center gap-1 rounded border border-stone-200 bg-stone-50 px-1.5 py-0.5 text-[10px] font-medium text-stone-400">
          ↵
        </kbd>
      </div>
      <button
        onClick={submit}
        id={`quick-capture-submit-${scope}`}
        className="
          flex items-center justify-center w-11 h-11 rounded-xl
          bg-violet-500 text-white text-lg font-bold
          shadow-sm hover:bg-violet-600 active:scale-95
          transition-all duration-150 shrink-0
        "
        aria-label="Add task"
      >
        +
      </button>
    </motion.div>
  );
}
```

---

### STEP 4 — `components/SortableTaskItem.tsx` (CREATE NEW)

The core task row. Compose dnd-kit's `useSortable` hook with `framer-motion`'s `motion.div` and HeroUI `Checkbox`. Double-click title to inline-edit.

```tsx
'use client';

import { useState, useRef, useEffect } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion } from 'framer-motion';
import { Checkbox } from '@heroui/react';
import { useTaskStore } from '@/store/useTaskStore';
import { Task } from '@/types/task';

interface SortableTaskItemProps {
  task: Task;
}

export default function SortableTaskItem({ task }: SortableTaskItemProps) {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(task.title);
  const editRef = useRef<HTMLInputElement>(null);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: task.id });

  const toggleTask = useTaskStore((s) => s.toggleTask);
  const editTask = useTaskStore((s) => s.editTask);
  const deleteTask = useTaskStore((s) => s.deleteTask);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  useEffect(() => {
    if (editing) editRef.current?.focus();
  }, [editing]);

  const saveEdit = () => {
    if (editValue.trim()) editTask(task.id, editValue);
    else setEditValue(task.title);
    setEditing(false);
  };

  const onEditKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') saveEdit();
    if (e.key === 'Escape') { setEditValue(task.title); setEditing(false); }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0, marginBottom: 0 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      ref={setNodeRef}
      style={style}
      className={`
        group flex items-center gap-3 rounded-xl border border-stone-200 bg-white
        px-3 py-3 shadow-sm
        transition-shadow duration-150
        ${isDragging ? 'shadow-lg scale-[1.02] z-50 border-violet-300' : 'hover:shadow-md'}
        ${task.status === 'done' ? 'opacity-50' : ''}
        touch-none
      `}
    >
      {/* Drag Handle */}
      <button
        {...attributes}
        {...listeners}
        id={`drag-handle-${task.id}`}
        aria-label="Drag to reorder"
        className="
          flex items-center justify-center w-6 h-6 shrink-0
          text-stone-300 hover:text-stone-500
          cursor-grab active:cursor-grabbing
          transition-colors touch-none
        "
      >
        <svg width="10" height="16" viewBox="0 0 10 16" fill="currentColor">
          <circle cx="2" cy="2" r="1.5" /><circle cx="8" cy="2" r="1.5" />
          <circle cx="2" cy="8" r="1.5" /><circle cx="8" cy="8" r="1.5" />
          <circle cx="2" cy="14" r="1.5" /><circle cx="8" cy="14" r="1.5" />
        </svg>
      </button>

      {/* Checkbox */}
      <Checkbox
        isSelected={task.status === 'done'}
        onValueChange={() => toggleTask(task.id)}
        aria-label={`Mark "${task.title}" as ${task.status === 'done' ? 'pending' : 'done'}`}
        classNames={{
          base: 'w-[44px] h-[44px] min-w-[44px] flex items-center justify-center',
          wrapper: 'rounded-md border-stone-300',
        }}
        color="secondary"
      />

      {/* Title — double click to edit */}
      <div className="flex-1 min-w-0">
        {editing ? (
          <input
            ref={editRef}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={saveEdit}
            onKeyDown={onEditKeyDown}
            id={`edit-task-${task.id}`}
            className="
              w-full bg-transparent text-sm text-stone-800 outline-none
              border-b border-violet-400 pb-0.5
            "
          />
        ) : (
          <div className="flex items-center gap-2">
            <span
              onDoubleClick={() => { setEditValue(task.title); setEditing(true); }}
              className={`
                text-sm leading-snug select-none cursor-text truncate
                ${task.status === 'done' ? 'line-through text-stone-400' : 'text-stone-800'}
              `}
              title="Double-click to edit"
            >
              {task.title}
            </span>
            {task.estimatedMinutes && (
              <span className="shrink-0 rounded-full bg-violet-50 px-2 py-0.5 text-[10px] font-medium text-violet-500">
                {task.estimatedMinutes}m
              </span>
            )}
          </div>
        )}
      </div>

      {/* Delete */}
      <button
        onClick={() => deleteTask(task.id)}
        id={`delete-task-${task.id}`}
        aria-label="Delete task"
        className="
          opacity-0 group-hover:opacity-100 focus:opacity-100
          flex items-center justify-center w-6 h-6 shrink-0
          text-stone-300 hover:text-red-400
          transition-all duration-150 rounded
        "
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
          <path d="M1 1l10 10M11 1L1 11" />
        </svg>
      </button>
    </motion.div>
  );
}
```

---

### STEP 5 — `components/TaskList.tsx` (CREATE NEW)

Wraps the DnD context and AnimatePresence for a sorted, animated list of pending tasks.

```tsx
'use client';

import { useCallback } from 'react';
import {
  DndContext,
  PointerSensor,
  TouchSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  closestCenter,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { AnimatePresence } from 'framer-motion';
import { useTaskStore } from '@/store/useTaskStore';
import { Task, TaskScope } from '@/types/task';
import SortableTaskItem from './SortableTaskItem';

interface TaskListProps {
  scope: TaskScope;
  tasks: Task[];
}

export default function TaskList({ scope, tasks }: TaskListProps) {
  const reorderTasks = useTaskStore((s) => s.reorderTasks);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (over && active.id !== over.id) {
        reorderTasks(scope, String(active.id), String(over.id));
      }
    },
    [scope, reorderTasks]
  );

  const sorted = [...tasks].sort((a, b) => a.order - b.order);
  const ids = sorted.map((t) => t.id);

  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-stone-300 select-none">
        <svg className="mb-2" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <p className="text-sm">Nothing here yet — add your first task above</p>
      </div>
    );
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        <div className="flex flex-col gap-2">
          <AnimatePresence mode="popLayout">
            {sorted.map((task) => (
              <SortableTaskItem key={task.id} task={task} />
            ))}
          </AnimatePresence>
        </div>
      </SortableContext>
    </DndContext>
  );
}
```

---

### STEP 6 — `components/DoneList.tsx` (CREATE NEW)

The "momentum log" — animated completed items for the day.

```tsx
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
              className="flex items-center gap-3 rounded-lg border border-stone-100 bg-stone-50 px-3 py-2.5"
            >
              <span className="text-green-400 text-sm">✓</span>
              <span className="flex-1 text-sm line-through text-stone-400 truncate">
                {task.title}
              </span>
              {task.estimatedMinutes && (
                <span className="text-[10px] text-stone-300">{task.estimatedMinutes}m</span>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
```

---

### STEP 7 — `components/StatsBar.tsx` (CREATE NEW)

Summary chip row showing pending count, done count, and estimated time.

```tsx
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
```

---

### STEP 8 — `components/TodayView.tsx` (CREATE NEW)

```tsx
'use client';

import { useTaskStore } from '@/store/useTaskStore';
import QuickCapture from './QuickCapture';
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

      <QuickCapture scope="today" />
      <StatsBar pending={pending} done={done} />
      <TaskList scope="today" tasks={pending} />
      <DoneList scope="today" tasks={done} />
    </div>
  );
}
```

---

### STEP 9 — `components/WeekView.tsx` (CREATE NEW)

```tsx
'use client';

import { useTaskStore } from '@/store/useTaskStore';
import QuickCapture from './QuickCapture';
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

      <QuickCapture scope="week" />
      <StatsBar pending={pending} done={done} />
      <TaskList scope="week" tasks={pending} />
      <DoneList scope="week" tasks={done} />
    </div>
  );
}
```

---

### STEP 10 — `app/page.tsx` (OVERWRITE existing)

Main shell with Today / Week tabs.

```tsx
'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import TodayView from '@/components/TodayView';
import WeekView from '@/components/WeekView';

type Tab = 'today' | 'week';

const tabs: { id: Tab; label: string; emoji: string }[] = [
  { id: 'today', label: 'Today', emoji: '⚡' },
  { id: 'week', label: 'Week', emoji: '📋' },
];

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>('today');

  return (
    <main className="min-h-screen bg-stone-50">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-stone-200 bg-stone-50/90 backdrop-blur-sm">
        <div className="mx-auto max-w-2xl px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">✓</span>
            <span className="text-base font-bold text-stone-900 tracking-tight">FlowTask</span>
          </div>
          {/* Tab switcher */}
          <div className="flex rounded-xl border border-stone-200 bg-white p-1 gap-1 shadow-sm">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                id={`tab-${tab.id}`}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  relative flex items-center gap-1.5 rounded-lg px-4 py-1.5
                  text-sm font-medium transition-colors duration-150
                  ${activeTab === tab.id ? 'text-stone-900' : 'text-stone-400 hover:text-stone-600'}
                `}
              >
                {activeTab === tab.id && (
                  <motion.span
                    layoutId="tab-pill"
                    className="absolute inset-0 rounded-lg bg-stone-100"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                <span className="relative z-10">{tab.emoji}</span>
                <span className="relative z-10">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="mx-auto max-w-2xl px-4 py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
          >
            {activeTab === 'today' ? <TodayView /> : <WeekView />}
          </motion.div>
        </AnimatePresence>
      </div>
    </main>
  );
}
```

---

## After Writing All Files — Run These Commands

```bash
# Verify build
npm run build

# Start dev server
npm run dev
```

Fix any TypeScript or import errors before marking complete.

## Success Criteria
- [ ] `npm run build` passes with 0 errors
- [ ] Dev server starts on http://localhost:3000
- [ ] Today tab: can add tasks with Enter, drag to reorder, check to complete (animates to Done), double-click to edit
- [ ] Week tab: same interactions, independent list
- [ ] No TypeScript errors
- [ ] PWA manifest loads at /manifest.webmanifest
