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
    const { title } = parseMinutes(trimmed);
    addTask(title, scope);
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
