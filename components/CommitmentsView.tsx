'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTaskStore } from '@/store/useTaskStore';
import CommitmentCard from './CommitmentCard';

export default function CommitmentsView() {
  const commitments = useTaskStore((s) => s.commitments);
  const [showPast, setShowPast] = useState(false);

  const active    = commitments.filter((c) => c.status === 'active');
  const broken    = commitments.filter((c) => c.status === 'broken');
  const completed = commitments.filter((c) => c.status === 'completed');
  const past      = [...broken, ...completed].sort((a, b) => (b.brokenAt ?? b.completedAt ?? 0) - (a.brokenAt ?? a.completedAt ?? 0));

  const isEmpty = commitments.length === 0;

  return (
    <div>
      {/* ── Empty state ── */}
      {isEmpty && (
        <div className="flex flex-col items-center justify-center py-24 text-stone-700 select-none">
          <div className="w-16 h-16 rounded-2xl bg-[#1c1c1c] border border-[#2a2a2a] flex items-center justify-center mb-4">
            <span className="text-2xl">🛡️</span>
          </div>
          <p className="text-sm text-stone-500 mb-1">No commitments yet</p>
          <p className="text-xs text-stone-600 text-center max-w-[240px]">
            Tap the + button and choose &quot;Commitment&quot; to start a time-bound challenge
          </p>
        </div>
      )}

      {/* ── Active commitments ── */}
      {active.length > 0 && (
        <div className="flex flex-col gap-3">
          <AnimatePresence mode="popLayout">
            {active.map((c) => (
              <CommitmentCard key={c.id} commitment={c} />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* ── Past commitments (broken + completed) ── */}
      {past.length > 0 && (
        <div className="mt-8">
          <button
            onClick={() => setShowPast(!showPast)}
            className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.15em] text-stone-600 mb-3 hover:text-stone-400 transition-colors"
          >
            <motion.svg
              width="8" height="8" viewBox="0 0 8 8"
              fill="currentColor"
              animate={{ rotate: showPast ? 90 : 0 }}
              transition={{ duration: 0.15 }}
            >
              <path d="M2 0l4 4-4 4z" />
            </motion.svg>
            Past · {past.length}
          </button>

          <AnimatePresence>
            {showPast && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col gap-3 overflow-hidden"
              >
                {past.map((c) => (
                  <CommitmentCard key={c.id} commitment={c} />
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
