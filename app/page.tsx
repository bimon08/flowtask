'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import AllTasksView from '@/components/AllTasksView';
import CommitmentsView from '@/components/CommitmentsView';
import AddTaskFAB from '@/components/AddTaskFAB';

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
        {/* Scrim */}
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

        {/* Modal card */}
        <motion.div
          key="card"
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', stiffness: 380, damping: 30 }}
          onClick={(e) => e.stopPropagation()}
          className="relative z-10 w-full max-w-sm rounded-2xl bg-[#1a1a1a] border border-[#2a2a2a] p-6 shadow-2xl"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            id="motto-modal-close"
            aria-label="Close"
            className="absolute top-4 right-4 w-7 h-7 flex items-center justify-center rounded-full bg-[#252525] text-stone-400 hover:text-stone-200 hover:bg-[#2f2f2f] transition-colors"
          >
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <path d="M1 1l8 8M9 1L1 9" />
            </svg>
          </button>

          {/* Icon */}
          <div className="mb-4 flex items-center justify-center w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20">
            <span className="text-lg">⚓</span>
          </div>

          {/* Content */}
          <h2 className="text-base font-bold text-stone-100 mb-1">By hook or by crook</h2>
          <p className="text-[11px] uppercase tracking-wider text-stone-500 font-semibold mb-3">Origin &amp; Meaning</p>
          <p className="text-sm text-stone-400 leading-relaxed mb-4">
            An idiom meaning <span className="text-stone-200 font-medium">by any means necessary</span> — whatever it takes to get the job done.
          </p>
          <p className="text-sm text-stone-500 leading-relaxed mb-4">
            The phrase dates to medieval England, where peasants were allowed to gather fallen wood from a lord&apos;s forest using either a <span className="text-stone-400">hook</span> (a curved blade to pull branches) or a <span className="text-stone-400">crook</span> (a shepherd&apos;s staff to drag them down) — but no other tools. Over centuries it evolved to mean achieving any goal through whatever methods are available.
          </p>
          <div className="rounded-xl border border-[#252525] bg-[#151515] px-4 py-3">
            <p className="text-xs text-stone-500 italic leading-relaxed">
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

  return (
    <main className="min-h-screen bg-[#111111]">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#111111]/95 backdrop-blur-md border-b border-[#1f1f1f]">
        <div className="mx-auto max-w-lg px-5 pt-12 pb-5">

          {/* Motto line */}
          <div className="flex items-center gap-1.5 mb-2">
            <span className="text-[11px] font-semibold tracking-wide text-stone-500 italic">
              By hook or by crook
            </span>
            <button
              id="motto-explain-btn"
              onClick={() => setMottoOpen(true)}
              aria-label="What does this mean?"
              className="
                flex items-center justify-center w-4 h-4 rounded-full
                bg-stone-800 text-stone-500 hover:bg-violet-500/20 hover:text-violet-400
                text-[9px] font-bold border border-stone-700 hover:border-violet-500/40
                transition-all duration-150
              "
            >
              ?
            </button>
          </div>

          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-600 mb-1">My Day</p>
          <h1 className="text-2xl font-bold text-stone-100 tracking-tight">{today}</h1>

          {/* ── View mode tabs: Tasks | Commitments ── */}
          <div className="flex rounded-xl border border-[#2a2a2a] bg-[#1c1c1c] p-1 gap-1 mt-4">
            {([
              { id: 'tasks' as ViewMode, label: 'Tasks', emoji: '✏️' },
              { id: 'commitments' as ViewMode, label: 'Commitments', emoji: '🛡️' },
            ]).map((tab) => (
              <button
                key={tab.id}
                id={`view-tab-${tab.id}`}
                onClick={() => setViewMode(tab.id)}
                className={`
                  relative flex-1 flex items-center justify-center gap-1.5 rounded-lg px-3 py-2
                  text-sm font-medium transition-all duration-150
                  ${viewMode === tab.id ? 'text-stone-100' : 'text-stone-600 hover:text-stone-400'}
                `}
              >
                {viewMode === tab.id && (
                  <motion.span
                    layoutId="view-tab-pill"
                    className="absolute inset-0 rounded-lg bg-[#2a2a2a]"
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

      {/* FAB — always mounted so the sheet stays alive when open */}
      <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50">
        <AddTaskFAB onOpenChange={setSheetOpen} />
      </div>

      {/* Motto modal */}
      {mottoOpen && <MottoModal onClose={() => setMottoOpen(false)} />}
    </main>
  );
}
