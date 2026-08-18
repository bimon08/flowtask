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
        <div className="flex flex-col items-center justify-center py-24 select-none">
          {/* Nothing-style dot grid icon */}
          <div className="grid grid-cols-3 gap-1 mb-4">
            {[...Array(9)].map((_, i) => (
              <div key={i} className={`w-2 h-2 ${i === 4 ? 'bg-[var(--accent)]' : 'bg-[#1a1a1a]'}`} />
            ))}
          </div>
          <p className="font-dot text-[11px] text-[#333] uppercase tracking-wider mb-1">No commitments</p>
          <p className="text-[11px] text-[#222] text-center max-w-[240px]">
            Tap + to start a time-bound challenge
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

      {/* ── Past commitments ── */}
      {past.length > 0 && (
        <div className="mt-8">
          <button
            onClick={() => setShowPast(!showPast)}
            className="flex items-center gap-2 font-dot text-[10px] uppercase tracking-wider text-[#444] mb-3 hover:text-[#777] transition-colors"
          >
            <motion.span
              animate={{ rotate: showPast ? 90 : 0 }}
              transition={{ duration: 0.15 }}
              className="inline-block"
            >
              ▶
            </motion.span>
            PAST · {past.length}
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
