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

  if (s < 60)  return { label: `${s}s`,  color: 'text-[#555]' };
  if (m < 60)  return { label: `${m}m`,  color: 'text-[#666]' };
  if (h < 24) {
    const rm = m % 60;
    return { label: `${h}h ${rm}m`, color: 'text-[#999]' };
  }
  if (d < 7)   return { label: `${d}d`,  color: 'text-[var(--accent)]' };
  return         { label: `${Math.floor(d / 7)}w`, color: 'text-[var(--accent)]' };
}

function getInterval(createdAt: number): number {
  const ms = Date.now() - createdAt;
  if (ms < 60_000)     return 1_000;
  if (ms < 86_400_000) return 60_000;
  return 3_600_000;
}

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
    <span className={`shrink-0 font-dot text-[11px] tabular-nums ${color}`}>
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
      className={`border-b border-[#1a1a1a] last:border-b-0 transition-colors ${
        isDragging ? 'bg-[#161616] border-[var(--accent)]/20 z-50' : 'bg-[#0a0a0a]'
      }`}
    >
      {/* ── Main row ── */}
      <div className="flex items-center gap-3 px-5 py-4">

        {/* Checkbox — square, Nothing style */}
        <button
          role="checkbox"
          aria-checked={isDone}
          onClick={() => { toggleTask(task.id); setMode('collapsed'); }}
          className={`shrink-0 w-[18px] h-[18px] border flex items-center justify-center transition-all duration-200
            ${isDone ? 'bg-[var(--accent)] border-[var(--accent)]' : 'border-[#333] hover:border-[var(--accent)]'}`}
        >
          {isDone && (
            <svg width="8" height="6" viewBox="0 0 10 8" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
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
          <p className={`text-[14px] leading-snug ${
            isDone ? 'line-through text-[#444]' : mode !== 'collapsed' ? 'text-white' : 'truncate text-white'
          }`}>
            {task.title}
          </p>
          {task.description && mode === 'collapsed' && !isDone && (
            <p className="text-[11px] text-[#555] truncate mt-0.5">{task.description}</p>
          )}
        </button>

        {/* AGE — dot-matrix style */}
        {!isDone && <AgeDisplay createdAt={task.createdAt} />}

        {/* Delete */}
        <button
          onClick={() => deleteTask(task.id)}
          aria-label="Delete"
          className="shrink-0 w-6 h-6 flex items-center justify-center text-[#333] hover:text-[var(--accent)] transition-all"
        >
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <path d="M1 1l8 8M9 1L1 9"/>
          </svg>
        </button>

        {/* Drag grip */}
        {!dragDisabled && (
          <button
            {...attributes} {...listeners}
            aria-label="Drag to reorder"
            className="shrink-0 touch-none cursor-grab active:cursor-grabbing text-[#333] hover:text-[#555] transition-colors"
          >
            <svg width="8" height="14" viewBox="0 0 8 14" fill="currentColor">
              <circle cx="2" cy="2"  r="1" /><circle cx="6" cy="2"  r="1" />
              <circle cx="2" cy="7"  r="1" /><circle cx="6" cy="7"  r="1" />
              <circle cx="2" cy="12" r="1" /><circle cx="6" cy="12" r="1" />
            </svg>
          </button>
        )}
      </div>

      {/* ── Expanded: full read view ── */}
      {mode === 'expanded' && !isDone && (
        <div className="px-5 pb-4 border-t border-[#1a1a1a]">
          <div className="pt-3 flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              {task.description
                ? <p className="text-sm text-[#999] leading-relaxed whitespace-pre-wrap">{task.description}</p>
                : <p className="text-sm text-[#333] italic">No description</p>
              }
            </div>
            <button
              onClick={() => { setEditTitle(task.title); setEditDesc(task.description ?? ''); setMode('editing'); }}
              aria-label="Edit task"
              className="shrink-0 w-8 h-8 flex items-center justify-center border border-[#1a1a1a] hover:border-[var(--accent)] hover:text-[var(--accent)] text-[#555] transition-all"
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
        <div className="px-5 pb-4 border-t border-[#1a1a1a]">
          <div className="pt-3 flex flex-col gap-2">
            <input
              ref={titleRef}
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') cancelEdit(); }}
              className="w-full border border-[#1a1a1a] bg-black px-3 py-2.5 text-sm font-medium text-white outline-none focus:border-[var(--accent)] transition-colors"
            />
            <textarea
              value={editDesc}
              onChange={(e) => setEditDesc(e.target.value)}
              placeholder="Add a note…"
              rows={3}
              className="w-full border border-[#1a1a1a] bg-black px-3 py-2.5 text-sm text-[#999] resize-none placeholder:text-[#333] outline-none focus:border-[var(--accent)] transition-colors"
            />
            <div className="flex gap-2">
              <button onClick={saveEdit}
                className="flex-1 py-2 border border-[var(--accent)] bg-[var(--accent)] text-white text-sm font-semibold font-dot uppercase tracking-wider hover:brightness-110 transition-all">
                Save
              </button>
              <button onClick={cancelEdit}
                className="px-4 py-2 border border-[#1a1a1a] text-[#555] text-sm font-semibold hover:border-[#333] hover:text-[#999] transition-all">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
