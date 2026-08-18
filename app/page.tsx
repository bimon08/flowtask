'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import AllTasksView from '@/components/AllTasksView';
import CommitmentsView from '@/components/CommitmentsView';
import AddTaskFAB from '@/components/AddTaskFAB';
import { useDevSeed } from '@/hooks/useDevSeed';

type ViewMode = 'tasks' | 'commitments';

function MottoModal({ onClose }: { onClose: () => void }) {
  return (
    <AnimatePresence>
      <motion.div
        key="backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-4 pb-8 sm:pb-0"
        onClick={onClose}
      >
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />

        <motion.div
          key="card"
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', stiffness: 380, damping: 30 }}
          onClick={(e) => e.stopPropagation()}
          className="relative z-10 w-full max-w-sm rounded-none border border-[#1a1a1a] bg-black p-6 shadow-2xl"
        >
          <button
            onClick={onClose}
            id="motto-modal-close"
            aria-label="Close"
            className="absolute top-4 right-4 w-7 h-7 flex items-center justify-center text-[#555] hover:text-white transition-colors"
          >
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <path d="M1 1l8 8M9 1L1 9" />
            </svg>
          </button>

          <h2 className="font-dot text-sm text-[var(--accent)] mb-1 uppercase">By hook or by crook</h2>
          <p className="text-[10px] uppercase tracking-[0.2em] text-[#555] font-semibold mb-3">Origin &amp; Meaning</p>
          <p className="text-sm text-[#999] leading-relaxed mb-4">
            An idiom meaning <span className="text-white font-medium">by any means necessary</span> — whatever it takes to get the job done.
          </p>
          <p className="text-sm text-[#666] leading-relaxed mb-4">
            The phrase dates to medieval England, where peasants were allowed to gather fallen wood using either a <span className="text-[#999]">hook</span> or a <span className="text-[#999]">crook</span> — but no other tools.
          </p>
          <div className="border border-[#1a1a1a] bg-[#0a0a0a] px-4 py-3">
            <p className="text-xs text-[#555] italic leading-relaxed">
              &quot;I&apos;ll finish every task on this list — by hook or by crook.&quot;
            </p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default function Home() {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [mottoOpen, setMottoOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('tasks');

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
  });

  useDevSeed();

  return (
    <main className="min-h-screen bg-black">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-black/95 backdrop-blur-md border-b border-[#1a1a1a]">
        <div className="mx-auto max-w-lg px-5 pt-12 pb-5">

          {/* Motto line */}
          <motion.div
            className="flex items-center gap-1.5 mb-3"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          >
            <span className="font-dot text-[10px] text-[var(--accent)] uppercase tracking-wider">
              By hook or by crook
            </span>
            <button
              id="motto-explain-btn"
              onClick={() => setMottoOpen(true)}
              aria-label="What does this mean?"
              className="
                flex items-center justify-center w-3.5 h-3.5
                text-[#333] hover:text-[var(--accent)]
                text-[8px] font-bold
                transition-all duration-150
              "
            >
              (?)
            </button>
          </motion.div>

          {/* Date — dot-matrix style */}
          <motion.h1
            className="font-dot text-xl text-white tracking-tight mb-1"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1, ease: 'easeOut' }}
          >
            {today}
          </motion.h1>

          {/* Decorative dot line */}
          <div className="dot-line h-[2px] w-full mb-5 opacity-50" />

          {/* ── View mode tabs: Tasks | Commitments ── */}
          <div className="flex gap-0">
            {([
              { id: 'tasks' as ViewMode, label: 'TASKS' },
              { id: 'commitments' as ViewMode, label: 'COMMITMENTS' },
            ]).map((tab) => (
              <button
                key={tab.id}
                id={`view-tab-${tab.id}`}
                onClick={() => setViewMode(tab.id)}
                className={`
                  relative flex-1 py-2.5 text-center
                  font-dot text-[11px] tracking-wider
                  transition-colors duration-200
                  ${viewMode === tab.id
                    ? 'text-white'
                    : 'text-[#444] border-b border-[#1a1a1a] hover:text-[#777]'}
                `}
              >
                {tab.label}
                {viewMode === tab.id && (
                  <motion.div
                    layoutId="view-tab-underline"
                    className="absolute bottom-0 left-0 right-0 h-[2px] bg-[var(--accent)]"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="mx-auto max-w-lg px-5 pb-40 pt-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={viewMode}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
          >
            {viewMode === 'tasks' ? <AllTasksView /> : <CommitmentsView />}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* FAB */}
      <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50">
        <AddTaskFAB onOpenChange={setSheetOpen} defaultMode={viewMode === 'commitments' ? 'commitment' : 'task'} />
      </div>

      {/* Motto modal */}
      {mottoOpen && <MottoModal onClose={() => setMottoOpen(false)} />}
    </main>
  );
}
