'use client';

import { useState, useRef, useEffect } from 'react';
import { DraggableProvidedDragHandleProps } from '@hello-pangea/dnd';
import { useTaskStore } from '@/store/useTaskStore';
import { Task } from '@/types/task';

function formatDue(ts: number): { label: string; color: string } {
  const now  = new Date();
  const diffDays = Math.ceil(
    (new Date(ts).setHours(0,0,0,0) - new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()) / 86400000
  );
  if (diffDays < 0)  return { label: 'Overdue',   color: 'bg-red-50 text-red-400' };
  if (diffDays === 0) return { label: 'Today',     color: 'bg-amber-50 text-amber-500' };
  if (diffDays === 1) return { label: 'Tomorrow',  color: 'bg-stone-100 text-stone-500' };
  return {
    label: new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    color: 'bg-stone-100 text-stone-500',
  };
}

interface TaskRowProps {
  task: Task;
  dragHandleProps: DraggableProvidedDragHandleProps | null | undefined;
  isDragging: boolean;
}

export default function TaskRow({ task, dragHandleProps, isDragging }: TaskRowProps) {
  const [editing,   setEditing]   = useState(false);
  const [editValue, setEditValue] = useState(task.title);
  const editRef = useRef<HTMLInputElement>(null);

  const toggleTask = useTaskStore((s) => s.toggleTask);
  const editTask   = useTaskStore((s) => s.editTask);
  const deleteTask = useTaskStore((s) => s.deleteTask);

  useEffect(() => { if (editing) editRef.current?.focus(); }, [editing]);

  const saveEdit = () => {
    const v = editValue.trim();
    if (v) editTask(task.id, v); else setEditValue(task.title);
    setEditing(false);
  };

  const isDone = task.status === 'done';

  return (
    <div
      className={`
        flex items-center gap-3 rounded-2xl bg-white px-4 py-3.5
        transition-all duration-150
        ${isDragging
          ? 'shadow-xl ring-1 ring-violet-200 scale-[1.02] rotate-[0.5deg]'
          : 'shadow-sm hover:shadow-md'
        }
      `}
    >
      {/* Checkbox */}
      <button
        role="checkbox"
        aria-checked={isDone}
        onClick={() => toggleTask(task.id)}
        id={`checkbox-${task.id}`}
        aria-label={`Mark as ${isDone ? 'pending' : 'done'}`}
        className={`
          shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center
          transition-all duration-200
          ${isDone
            ? 'bg-violet-500 border-violet-500'
            : 'border-stone-300 hover:border-violet-400 bg-white'
          }
        `}
      >
        {isDone && (
          <svg width="10" height="8" viewBox="0 0 10 8" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="1 4 3.5 6.5 9 1" />
          </svg>
        )}
      </button>

      {/* Title */}
      <div className="flex-1 min-w-0">
        {editing ? (
          <input
            ref={editRef}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={saveEdit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') saveEdit();
              if (e.key === 'Escape') { setEditValue(task.title); setEditing(false); }
            }}
            id={`edit-task-${task.id}`}
            className="w-full bg-transparent text-sm text-stone-800 outline-none border-b border-violet-400"
          />
        ) : (
          <div className="flex flex-wrap items-center gap-1.5">
            <span
              onDoubleClick={() => { setEditValue(task.title); setEditing(true); }}
              className={`text-sm leading-snug truncate max-w-full ${isDone ? 'line-through text-stone-400' : 'text-stone-800 font-medium'}`}
            >
              {task.title}
            </span>
            {task.estimatedMinutes && (
              <span className="rounded-full bg-violet-50 px-2 py-0.5 text-[10px] font-semibold text-violet-500">
                {task.estimatedMinutes}m
              </span>
            )}
            {task.dueDate && !isDone && (() => {
              const { label, color } = formatDue(task.dueDate);
              return <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${color}`}>{label}</span>;
            })()}
          </div>
        )}
      </div>

      {/* Delete */}
      <button
        onClick={() => deleteTask(task.id)}
        id={`delete-task-${task.id}`}
        aria-label="Delete task"
        className="shrink-0 w-6 h-6 flex items-center justify-center rounded-full text-stone-300 hover:text-red-400 hover:bg-red-50 transition-all duration-150"
      >
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M1 1l8 8M9 1L1 9" />
        </svg>
      </button>

      {/* Drag handle — subtle grip on the right */}
      <div
        {...(dragHandleProps ?? {})}
        id={`drag-handle-${task.id}`}
        aria-label="Drag to reorder"
        className="shrink-0 w-5 flex items-center justify-center text-stone-200 hover:text-stone-400 cursor-grab active:cursor-grabbing transition-colors"
      >
        <svg width="8" height="14" viewBox="0 0 8 14" fill="currentColor">
          <circle cx="2" cy="2"  r="1.2" /><circle cx="6" cy="2"  r="1.2" />
          <circle cx="2" cy="7"  r="1.2" /><circle cx="6" cy="7"  r="1.2" />
          <circle cx="2" cy="12" r="1.2" /><circle cx="6" cy="12" r="1.2" />
        </svg>
      </div>
    </div>
  );
}
