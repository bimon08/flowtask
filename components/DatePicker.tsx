'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface DatePickerProps {
  value: string;          // 'YYYY-MM-DD' or ''
  min?: string;           // 'YYYY-MM-DD'
  onChange: (date: string) => void;
}

const DAYS  = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const MONTHS = ['January','February','March','April','May','June',
                'July','August','September','October','November','December'];

function toYMD(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

export default function DatePicker({ value, min, onChange }: DatePickerProps) {
  const today = new Date();
  today.setHours(0,0,0,0);

  const [viewYear,  setViewYear]  = useState(() => value ? parseInt(value.slice(0,4))  : today.getFullYear());
  const [viewMonth, setViewMonth] = useState(() => value ? parseInt(value.slice(5,7))-1 : today.getMonth());
  const [dir, setDir] = useState(1);   // +1 = forward, -1 = backward

  const minDate = min ? new Date(min + 'T00:00:00') : today;

  function navigate(delta: number) {
    setDir(delta);
    let m = viewMonth + delta;
    let y = viewYear;
    if (m > 11) { m = 0; y++; }
    if (m < 0)  { m = 11; y--; }
    setViewMonth(m);
    setViewYear(y);
  }

  const cells = useMemo(() => {
    const first = new Date(viewYear, viewMonth, 1);
    const startPad = first.getDay();           // 0=Sun
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const result: (number | null)[] = Array(startPad).fill(null);
    for (let d = 1; d <= daysInMonth; d++) result.push(d);
    return result;
  }, [viewYear, viewMonth]);

  const slideKey = `${viewYear}-${viewMonth}`;

  return (
    <div className="rounded-2xl border-2 border-stone-200 bg-white overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-stone-100">
        <button
          onClick={() => navigate(-1)}
          className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-stone-100 transition-colors text-stone-500"
          aria-label="Previous month"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="10 4 6 8 10 12" />
          </svg>
        </button>

        <span className="text-sm font-bold text-stone-900">
          {MONTHS[viewMonth]} {viewYear}
        </span>

        <button
          onClick={() => navigate(1)}
          className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-stone-100 transition-colors text-stone-500"
          aria-label="Next month"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 4 10 8 6 12" />
          </svg>
        </button>
      </div>

      {/* Day labels */}
      <div className="grid grid-cols-7 px-2 pt-2">
        {DAYS.map((d) => (
          <div key={d} className="text-center text-[10px] font-bold text-stone-400 py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="overflow-hidden">
        <AnimatePresence mode="wait" initial={false} custom={dir}>
          <motion.div
            key={slideKey}
            custom={dir}
            initial={{ x: dir * 40, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: dir * -40, opacity: 0 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="grid grid-cols-7 px-2 pb-3 gap-y-1"
          >
            {cells.map((day, i) => {
              if (!day) return <div key={`pad-${i}`} />;

              const cellDate = new Date(viewYear, viewMonth, day);
              cellDate.setHours(0,0,0,0);
              const ymd       = toYMD(cellDate);
              const isToday   = ymd === toYMD(today);
              const isSelected = ymd === value;
              const isPast    = cellDate < minDate;

              return (
                <button
                  key={ymd}
                  disabled={isPast}
                  onClick={() => onChange(ymd)}
                  className={`
                    mx-auto flex items-center justify-center
                    w-9 h-9 rounded-xl text-sm font-medium
                    transition-all duration-150
                    ${isPast
                      ? 'text-stone-300 cursor-not-allowed'
                      : isSelected
                        ? 'bg-violet-500 text-white shadow-sm'
                        : isToday
                          ? 'border-2 border-violet-300 text-violet-600 hover:bg-violet-50'
                          : 'text-stone-700 hover:bg-stone-100'
                    }
                  `}
                >
                  {day}
                </button>
              );
            })}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
