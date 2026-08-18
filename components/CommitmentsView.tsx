'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTaskStore } from '@/store/useTaskStore';
import CommitmentCard from './CommitmentCard';

/* ─── Stagger variants ────────────────────────────────────── */
const staggerContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.05 },
  },
};

const staggerItem = {
  hidden: { opacity: 0, y: 16, scale: 0.97 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.35, ease: 'easeOut' as const } },
};

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
      {/* ── Empty state — animated dot grid ── */}
      {isEmpty && (
        <motion.div
          className="flex flex-col items-center justify-center py-24 select-none"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          <div className="grid grid-cols-3 gap-1.5 mb-5">
            {[...Array(9)].map((_, i) => (
              <motion.div
                key={i}
                className={`w-2.5 h-2.5 rounded-sm ${i === 4 ? 'bg-[var(--accent)]' : 'bg-[#1a1a1a]'}`}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: i * 0.05, type: 'spring', stiffness: 400, damping: 15 }}
              />
            ))}
          </div>
          <motion.p
            className="font-dot text-[11px] text-[#333] uppercase tracking-wider mb-1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            No commitments
          </motion.p>
          <motion.p
            className="text-[11px] text-[#222] text-center max-w-[240px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            Tap + to start a time-bound challenge
          </motion.p>
        </motion.div>
      )}

      {/* ── Active commitments — staggered entry ── */}
      {active.length > 0 && (
        <motion.div
          className="flex flex-col gap-3"
          variants={staggerContainer}
          initial="hidden"
          animate="show"
        >
          <AnimatePresence mode="popLayout">
            {active.map((c) => (
              <motion.div key={c.id} variants={staggerItem} layout>
                <CommitmentCard commitment={c} />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {/* ── Past commitments — collapsible with animation ── */}
      {past.length > 0 && (
        <motion.div
          className="mt-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <motion.button
            onClick={() => setShowPast(!showPast)}
            whileTap={{ scale: 0.97 }}
            className="flex items-center gap-2 font-dot text-[10px] uppercase tracking-wider text-[#444] mb-3 hover:text-[#777] transition-colors"
          >
            <motion.span
              animate={{ rotate: showPast ? 90 : 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className="inline-block"
            >
              ▶
            </motion.span>
            PAST · {past.length}
          </motion.button>

          <AnimatePresence>
            {showPast && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className="overflow-hidden"
              >
                <motion.div
                  className="flex flex-col gap-3"
                  variants={staggerContainer}
                  initial="hidden"
                  animate="show"
                >
                  {past.map((c) => (
                    <motion.div key={c.id} variants={staggerItem}>
                      <CommitmentCard commitment={c} />
                    </motion.div>
                  ))}
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
}
