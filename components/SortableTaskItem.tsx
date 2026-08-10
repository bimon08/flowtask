'use client';

import { useState, useRef, useEffect } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useTaskStore } from '@/store/useTaskStore';
import { Task } from '@/types/task';

/* ─── Age logic ──────────────────────────────────────────── */

function getAge(createdAt: number): { label: string; color: string } {
  const ms = Date.now() - createdAt;
  const s  = Math.floor(ms / 1000);
  const m  = Math.floor(ms / 60_000);
  const h  = Math.floor(ms / 3_600_000);
  const d  = Math.floor(ms / 86_400_000);

  if (s < 60)  return { label: `${s}s`,  color: 'text-stone-500' };
  if (m < 60)  return { label: `${m}m`,  color: 'text-stone-400' };
  if (h < 24) {
    const rm = m % 60;
    return { label: `${h}h ${rm}m`, color: 'text-amber-400' };
  }
  if (d < 7)   return { label: `${d}d`,  color: 'text-orange-400' };
  return         { label: `${Math.floor(d / 7)}w`, color: 'text-red-400' };
}

function getInterval(createdAt: number): number {
  const ms = Date.now() - createdAt;
  if (ms < 60_000)     return 1_000;    // every second
  if (ms < 86_400_000) return 60_000;   // every minute (covers hours range too)
  return 3_600_000;                      // every hour for day+ old tasks
}

/** Always-visible live age counter. Color escalates as task ages. */
function AgeDisplay({ createdAt }: { createdAt: number }) {
  const [, setTick] = useState(0);

  useEffect(() => {
    let timerId: ReturnType<typeof setTimeout>;
    const schedule = () => {
      timerId = setTimeout(() => {
        setTick((t) => t + 1);
        schedule();
      }, getInterval(createdAt));
    };
    schedule();
    return () => clearTimeout(timerId);
  }, [createdAt]);

  const { label, color } = getAge(createdAt);

  return (
    <span className={`shrink-0 text-sm font-bold tabular-nums ${color}`}>
      {label}
    </span>
  );
}

/* ─── Task row ───────────────────────────────────────────── */

type Mode = 'collapsed' | 'expanded' | 'editing';

interface Props { task: Task; dragDisabled?: boolean; }

export default function SortableTaskItem({ task, dragDisabled = false }: Props) {
  const [mode, setMode]           = useState<Mode>('collapsed');
  const [editTitle, setEditTitle] = useState(task.title);
  const [editDesc,  setEditDesc]  = useState(task.description ?? '');
  const titleRef = useRef<HTMLInputElement>(null);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: task.id });

  const toggleTask = useTaskStore((s) => s.toggleTask);
  const editTask   = useTaskStore((s) => s.editTask);
  const deleteTask = useTaskStore((s) => s.deleteTask);

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 999 : undefined,
    position: 'relative',
  };

  useEffect(() => { setEditTitle(task.title); },         [task.title]);
  useEffect(() => { setEditDesc(task.description ?? ''); }, [task.description]);
  useEffect(() => {
    if (mode === 'editing') setTimeout(() => titleRef.current?.focus(), 80);
  }, [mode]);

  const saveEdit = () => {
    const t = editTitle.trim();
    if (t) editTask(task.id, t, editDesc);
    else   setEditTitle(task.title);
    setMode('collapsed');
  };
  const cancelEdit = () => {
    setEditTitle(task.title); setEditDesc(task.description ?? '');
    setMode('collapsed');
  };

  const isDone = task.status === 'done';

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`border-b border-[#242424] last:border-b-0 transition-colors ${
        isDragging ? 'bg-[#242424] shadow-2xl rounded-xl border-transparent z-50' : 'bg-[#1c1c1c]'
      }`}
    >
      {/* ── Main row ── */}
      <div className="flex items-center gap-3 px-5 py-4">

        {/* Checkbox */}
        <button
          role="checkbox"
          aria-checked={isDone}
          onClick={() => { toggleTask(task.id); setMode('collapsed'); }}
          className={`shrink-0 w-[22px] h-[22px] rounded-full border-2 flex items-center justify-center transition-all duration-200
            ${isDone ? 'bg-violet-500 border-violet-500' : 'border-stone-600 hover:border-violet-500'}`}
        >
          {isDone && (
            <svg width="10" height="8" viewBox="0 0 10 8" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="1 4 3.5 6.5 9 1"/>
            </svg>
          )}
        </button>

        {/* Title + description preview — tap to expand */}
        <button
          className="flex-1 min-w-0 text-left"
          onClick={() => !isDone && setMode((m) => m === 'collapsed' ? 'expanded' : 'collapsed')}
          disabled={isDone}
        >
          <p className={`text-[15px] leading-snug ${
            isDone ? 'line-through text-stone-600' : mode !== 'collapsed' ? 'text-stone-100' : 'truncate text-stone-100'
          }`}>
            {task.title}
          </p>
          {task.description && mode === 'collapsed' && !isDone && (
            <p className="text-xs text-stone-500 truncate mt-0.5">{task.description}</p>
          )}
        </button>

        {/* ── AGE — always visible, prominent ── */}
        {!isDone && <AgeDisplay createdAt={task.createdAt} />}

        {/* Delete */}
        <button
          onClick={() => deleteTask(task.id)}
          aria-label="Delete"
          className="shrink-0 w-7 h-7 flex items-center justify-center rounded-full text-stone-700 hover:text-red-400 hover:bg-red-400/10 transition-all"
        >
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <path d="M1 1l8 8M9 1L1 9"/>
          </svg>
        </button>

        {/* Drag grip — hidden when sort is not manual */}
        {!dragDisabled && (
          <button
            {...attributes} {...listeners}
            aria-label="Drag to reorder"
            className="shrink-0 touch-none cursor-grab active:cursor-grabbing text-stone-700 hover:text-stone-500 transition-colors"
          >
            <svg width="8" height="14" viewBox="0 0 8 14" fill="currentColor">
              <circle cx="2" cy="2"  r="1.2"/><circle cx="6" cy="2"  r="1.2"/>
              <circle cx="2" cy="7"  r="1.2"/><circle cx="6" cy="7"  r="1.2"/>
              <circle cx="2" cy="12" r="1.2"/><circle cx="6" cy="12" r="1.2"/>
            </svg>
          </button>
        )}
      </div>

      {/* ── Expanded: full read view ── */}
      {mode === 'expanded' && !isDone && (
        <div className="px-5 pb-4 border-t border-[#252525]">
          <div className="pt-3 flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              {task.description
                ? <p className="text-sm text-stone-400 leading-relaxed whitespace-pre-wrap">{task.description}</p>
                : <p className="text-sm text-stone-700 italic">No description</p>
              }
            </div>
            {/* Pencil */}
            <button
              onClick={() => { setEditTitle(task.title); setEditDesc(task.description ?? ''); setMode('editing'); }}
              aria-label="Edit task"
              className="shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-[#2a2a2a] hover:bg-violet-500/20 hover:text-violet-400 text-stone-500 transition-all"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* ── Editing ── */}
      {mode === 'editing' && !isDone && (
        <div className="px-5 pb-4 border-t border-[#252525]">
          <div className="pt-3 flex flex-col gap-2">
            <input
              ref={titleRef}
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') cancelEdit(); }}
              className="w-full rounded-xl border border-[#2a2a2a] bg-[#252525] px-3 py-2.5 text-sm font-medium text-stone-100 outline-none focus:border-violet-500 transition-colors"
            />
            <textarea
              value={editDesc}
              onChange={(e) => setEditDesc(e.target.value)}
              placeholder="Add a note…"
              rows={3}
              className="w-full rounded-xl border border-[#2a2a2a] bg-[#252525] px-3 py-2.5 text-sm text-stone-300 resize-none placeholder:text-stone-700 outline-none focus:border-violet-500 transition-colors"
            />
            <div className="flex gap-2">
              <button onClick={saveEdit}
                className="flex-1 py-2 rounded-xl bg-violet-500 text-white text-sm font-semibold hover:bg-violet-600 transition-colors">
                Save
              </button>
              <button onClick={cancelEdit}
                className="px-4 py-2 rounded-xl bg-[#2a2a2a] text-stone-400 text-sm font-semibold hover:bg-[#333] transition-colors">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
