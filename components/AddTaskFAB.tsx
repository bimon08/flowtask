'use client';

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTaskStore } from '@/store/useTaskStore';

interface AddTaskFABProps {
  className?: string;
  onOpenChange?: (open: boolean) => void;
}

type FormMode = 'task' | 'commitment';

const DURATION_PRESETS = [7, 21, 30, 40, 90];

export default function AddTaskFAB({ className = '', onOpenChange }: AddTaskFABProps) {
  const [open, setOpenRaw]         = useState(false);
  const setOpen = (v: boolean)     => { setOpenRaw(v); onOpenChange?.(v); };
  const [mode, setMode]            = useState<FormMode>('task');
  const [title, setTitle]          = useState('');
  const [description, setDescription] = useState('');
  const [duration, setDuration]    = useState(30);
  const [customDuration, setCustomDuration] = useState('');
  const [showCustom, setShowCustom] = useState(false);
  const titleRef = useRef<HTMLInputElement>(null);
  const addTask       = useTaskStore((s) => s.addTask);
  const addCommitment = useTaskStore((s) => s.addCommitment);

  useEffect(() => {
    if (open) {
      const t = setTimeout(() => titleRef.current?.focus(), 120);
      return () => clearTimeout(t);
    }
    setTitle(''); setDescription(''); setMode('task');
    setDuration(30); setCustomDuration(''); setShowCustom(false);
  }, [open]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const canSubmit = title.trim().length > 0;

  const submit = () => {
    if (!canSubmit) return;
    if (mode === 'task') {
      addTask(title.trim(), 'today', description.trim() || undefined);
    } else {
      const finalDuration = showCustom ? (parseInt(customDuration) || 30) : duration;
      addCommitment(title.trim(), finalDuration, description.trim() || undefined);
    }
    setOpen(false);
  };

  return (
    <>
      {/* FAB button */}
      <AnimatePresence>
        {!open && (
          <motion.div
            key="fab-btn"
            className="flex flex-col items-center gap-1.5"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 28 }}
          >
            <motion.button
              id="fab-add-task"
              onClick={() => setOpen(true)}
              whileTap={{ scale: 0.92 }}
              className={`flex items-center justify-center w-14 h-14 rounded-full bg-[#1c1c1c] border border-[#2a2a2a] shadow-lg ${className}`}
              aria-label="Add task"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
                <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </motion.button>
            <span className="text-xs font-semibold text-stone-500 tracking-wide">Add task</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Backdrop + Sheet — portaled to body */}
      {typeof document !== 'undefined' && createPortal(
        <>
          <AnimatePresence>
            {open && (
              <motion.div key="backdrop"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 z-40 bg-black/60 backdrop-blur-[2px] cursor-pointer"
                onClick={() => setOpen(false)}
              />
            )}
          </AnimatePresence>

          <AnimatePresence>
            {open && (
              <motion.div key="sheet"
                initial={{ y: '110%' }} animate={{ y: 0 }} exit={{ y: '110%' }}
                transition={{ type: 'spring', stiffness: 360, damping: 36 }}
                className="fixed bottom-0 left-0 right-0 z-50 bg-[#111111] rounded-t-[28px] shadow-2xl flex flex-col"
                style={{ maxHeight: '85dvh' }}
              >
                {/* Handle */}
                <div className="flex justify-center pt-4 pb-2">
                  <div className="w-9 h-1 rounded-full bg-[#333]" />
                </div>

                {/* Header */}
                <div className="flex items-center justify-between px-5 py-3">
                  <h2 className="text-base font-bold text-stone-100">
                    {mode === 'task' ? 'New task' : 'New commitment'}
                  </h2>
                  <button onClick={() => setOpen(false)} aria-label="Close"
                    className="w-8 h-8 flex items-center justify-center rounded-full bg-[#2a2a2a] hover:bg-[#333] text-stone-500 transition-colors">
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <path d="M1 1l10 10M11 1L1 11"/>
                    </svg>
                  </button>
                </div>

                {/* ── Mode toggle: Task | Commitment ── */}
                <div className="px-5 pb-3">
                  <div className="flex rounded-xl border border-[#2a2a2a] bg-[#1c1c1c] p-1 gap-1">
                    {([
                      { id: 'task' as FormMode, label: '✏️ Task' },
                      { id: 'commitment' as FormMode, label: '🛡️ Commitment' },
                    ]).map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setMode(tab.id)}
                        className={`
                          relative flex-1 flex items-center justify-center gap-1.5 rounded-lg px-3 py-2
                          text-sm font-medium transition-all duration-150
                          ${mode === tab.id ? 'text-stone-100' : 'text-stone-600 hover:text-stone-400'}
                        `}
                      >
                        {mode === tab.id && (
                          <motion.span
                            layoutId="mode-pill"
                            className="absolute inset-0 rounded-lg bg-[#2a2a2a]"
                            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                          />
                        )}
                        <span className="relative z-10">{tab.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Inputs — scrollable middle */}
                <div className="flex-1 overflow-y-auto px-5 pt-2 pb-4">
                  <input
                    ref={titleRef}
                    id="fab-task-title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) submit(); }}
                    placeholder={mode === 'task' ? 'Task title' : 'What are you committing to?'}
                    autoComplete="off"
                    className="
                      w-full rounded-2xl border border-[#2a2a2a] bg-[#1c1c1c]
                      px-4 py-3.5 text-base font-medium text-stone-100
                      placeholder:text-stone-600
                      outline-none focus:border-stone-600
                      transition-all duration-200 mb-3
                    "
                  />
                  <textarea
                    id="fab-task-desc"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder={mode === 'task' ? 'Add a note… (optional)' : 'Your motivation (optional)'}
                    rows={2}
                    className="
                      w-full rounded-2xl border border-[#2a2a2a] bg-[#1c1c1c]
                      px-4 py-3 text-sm text-stone-300 resize-none
                      placeholder:text-stone-600
                      outline-none focus:border-stone-600
                      transition-all duration-200
                    "
                  />

                  {/* ── Duration picker (commitment mode only) ── */}
                  <AnimatePresence>
                    {mode === 'commitment' && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="mt-3 overflow-hidden"
                      >
                        <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-stone-600 mb-2">
                          Duration
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {DURATION_PRESETS.map((d) => (
                            <button
                              key={d}
                              onClick={() => { setDuration(d); setShowCustom(false); }}
                              className={`
                                px-3.5 py-2 rounded-xl text-sm font-semibold transition-all duration-150
                                ${!showCustom && duration === d
                                  ? 'bg-violet-500/15 text-violet-400 border border-violet-500/25'
                                  : 'bg-[#1c1c1c] text-stone-500 border border-[#2a2a2a] hover:text-stone-300'}
                              `}
                            >
                              {d}d
                            </button>
                          ))}
                          <button
                            onClick={() => setShowCustom(true)}
                            className={`
                              px-3.5 py-2 rounded-xl text-sm font-semibold transition-all duration-150
                              ${showCustom
                                ? 'bg-violet-500/15 text-violet-400 border border-violet-500/25'
                                : 'bg-[#1c1c1c] text-stone-500 border border-[#2a2a2a] hover:text-stone-300'}
                            `}
                          >
                            Custom
                          </button>
                        </div>

                        {/* Custom duration input */}
                        <AnimatePresence>
                          {showCustom && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              className="mt-2 overflow-hidden"
                            >
                              <div className="flex items-center gap-2">
                                <input
                                  type="number"
                                  min="1"
                                  max="365"
                                  value={customDuration}
                                  onChange={(e) => setCustomDuration(e.target.value)}
                                  placeholder="Enter days"
                                  className="
                                    flex-1 rounded-xl border border-[#2a2a2a] bg-[#1c1c1c]
                                    px-3 py-2.5 text-sm text-stone-100 placeholder:text-stone-600
                                    outline-none focus:border-violet-500 transition-colors
                                  "
                                />
                                <span className="text-sm text-stone-500">days</span>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Footer — always pinned at bottom */}
                <div className="shrink-0 px-5 pt-2 pb-10 border-t border-[#1f1f1f]">
                  <motion.button
                    id="fab-submit"
                    onClick={submit}
                    disabled={!canSubmit}
                    whileTap={canSubmit ? { scale: 0.97 } : {}}
                    className="
                      w-full py-4 rounded-2xl
                      bg-[#1c1c1c] border border-[#2a2a2a] text-stone-100 font-bold text-base
                      hover:bg-[#242424]
                      disabled:opacity-30 disabled:cursor-not-allowed
                      transition-all duration-150
                    "
                  >
                    {mode === 'task' ? 'Add Task' : 'Start Commitment'}
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </>,
        document.body
      )}
    </>
  );
}
