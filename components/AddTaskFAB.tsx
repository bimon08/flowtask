'use client';

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTaskStore } from '@/store/useTaskStore';

interface AddTaskFABProps {
  className?: string;
  onOpenChange?: (open: boolean) => void;
  defaultMode?: FormMode;
}

type FormMode = 'task' | 'commitment';

const DURATION_PRESETS = [7, 21, 30, 40, 90];

export default function AddTaskFAB({ className = '', onOpenChange, defaultMode = 'task' }: AddTaskFABProps) {
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
      setMode(defaultMode);
      const t = setTimeout(() => titleRef.current?.focus(), 120);
      return () => clearTimeout(t);
    }
    setTitle(''); setDescription(''); setMode(defaultMode);
    setDuration(30); setCustomDuration(''); setShowCustom(false);
  }, [open, defaultMode]);

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
      {/* FAB button — Nothing style: square with cross */}
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
              className={`flex items-center justify-center w-14 h-14 rounded-full bg-[var(--accent)] shadow-lg shadow-[var(--accent)]/20 ${className}`}
              aria-label="Add task"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
                <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </motion.button>
            <span className="font-dot text-[9px] text-[#555] uppercase tracking-wider">
              {defaultMode === 'task' ? 'New task' : 'New commitment'}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Backdrop + Sheet */}
      {typeof document !== 'undefined' && createPortal(
        <>
          <AnimatePresence>
            {open && (
              <motion.div key="backdrop"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 z-40 bg-black/80 cursor-pointer"
                onClick={() => setOpen(false)}
              />
            )}
          </AnimatePresence>

          <AnimatePresence>
            {open && (
              <motion.div key="sheet"
                initial={{ y: '110%' }} animate={{ y: 0 }} exit={{ y: '110%' }}
                transition={{ type: 'spring', stiffness: 360, damping: 36 }}
                className="fixed bottom-0 left-0 right-0 z-50 bg-black border-t border-[#1a1a1a] flex flex-col"
                style={{ maxHeight: '85dvh' }}
              >
                {/* Handle — dot style */}
                <div className="flex justify-center pt-4 pb-2">
                  <div className="flex gap-1">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="w-1.5 h-1.5 bg-[#333]" />
                    ))}
                  </div>
                </div>

                {/* Header */}
                <div className="flex items-center justify-between px-5 py-3">
                  <h2 className="font-dot text-sm text-white uppercase tracking-wider">
                    {mode === 'task' ? 'New Task' : 'New Commitment'}
                  </h2>
                  <button onClick={() => setOpen(false)} aria-label="Close"
                    className="w-8 h-8 flex items-center justify-center text-[#555] hover:text-white transition-colors">
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <path d="M1 1l10 10M11 1L1 11"/>
                    </svg>
                  </button>
                </div>

                {/* Inputs */}
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
                      w-full border border-[#1a1a1a] bg-[#0a0a0a]
                      px-4 py-3.5 text-base font-medium text-white
                      placeholder:text-[#333]
                      outline-none focus:border-[var(--accent)]
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
                      w-full border border-[#1a1a1a] bg-[#0a0a0a]
                      px-4 py-3 text-sm text-[#999] resize-none
                      placeholder:text-[#333]
                      outline-none focus:border-[var(--accent)]
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
                        <p className="font-dot text-[10px] uppercase tracking-wider text-[#555] mb-2">
                          Duration
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {DURATION_PRESETS.map((d) => (
                            <button
                              key={d}
                              onClick={() => { setDuration(d); setShowCustom(false); }}
                              className={`
                                px-3.5 py-2 font-dot text-[11px] transition-all duration-150
                                ${!showCustom && duration === d
                                  ? 'bg-[var(--accent-soft)] text-[var(--accent)] border border-[var(--accent)]/30'
                                  : 'bg-[#0a0a0a] text-[#555] border border-[#1a1a1a] hover:text-[#999] hover:border-[#333]'}
                              `}
                            >
                              {d}D
                            </button>
                          ))}
                          <button
                            onClick={() => setShowCustom(true)}
                            className={`
                              px-3.5 py-2 font-dot text-[11px] transition-all duration-150
                              ${showCustom
                                ? 'bg-[var(--accent-soft)] text-[var(--accent)] border border-[var(--accent)]/30'
                                : 'bg-[#0a0a0a] text-[#555] border border-[#1a1a1a] hover:text-[#999] hover:border-[#333]'}
                            `}
                          >
                            CUSTOM
                          </button>
                        </div>

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
                                    flex-1 border border-[#1a1a1a] bg-[#0a0a0a]
                                    px-3 py-2.5 text-sm text-white placeholder:text-[#333]
                                    outline-none focus:border-[var(--accent)] transition-colors
                                  "
                                />
                                <span className="font-dot text-[11px] text-[#555]">DAYS</span>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Footer */}
                <div className="shrink-0 px-5 pt-2 pb-10 border-t border-[#1a1a1a]">
                  <motion.button
                    id="fab-submit"
                    onClick={submit}
                    disabled={!canSubmit}
                    whileTap={canSubmit ? { scale: 0.97 } : {}}
                    className="
                      w-full py-4
                      bg-[var(--accent)] text-white font-dot text-sm uppercase tracking-wider
                      disabled:opacity-30 disabled:cursor-not-allowed
                      hover:brightness-110
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
