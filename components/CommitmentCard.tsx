'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTaskStore } from '@/store/useTaskStore';
import { Commitment } from '@/types/task';

/* ─── Helpers ────────────────────────────────────────────── */

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function daysBetween(startMs: number, nowMs: number): number {
  const start = new Date(startMs);
  start.setHours(0, 0, 0, 0);
  const now = new Date(nowMs);
  now.setHours(0, 0, 0, 0);
  return Math.floor((now.getTime() - start.getTime()) / 86_400_000) + 1;
}

function dateISO(startMs: number, dayOffset: number): string {
  const d = new Date(startMs);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + dayOffset);
  return d.toISOString().slice(0, 10);
}

/* ─── SVG Progress Ring ──────────────────────────────────── */

function ProgressRing({ progress, status }: { progress: number; status: string }) {
  const size = 88;
  const stroke = 5;
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - Math.min(progress, 1) * circumference;

  const ringColor =
    status === 'completed' ? '#22c55e' :
    status === 'broken'    ? '#ef4444' :
    '#8b5cf6';

  const trackColor = status === 'broken' ? '#3a1c1c' : '#2a2a2a';

  return (
    <svg width={size} height={size} className="shrink-0 -rotate-90">
      {/* Track */}
      <circle
        cx={size / 2} cy={size / 2} r={r}
        fill="none" stroke={trackColor} strokeWidth={stroke}
      />
      {/* Progress arc */}
      <motion.circle
        cx={size / 2} cy={size / 2} r={r}
        fill="none" stroke={ringColor} strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={circumference}
        initial={{ strokeDashoffset: circumference }}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 1, ease: 'easeOut' }}
      />
    </svg>
  );
}

/* ─── Streak Dots (last 7 days) ──────────────────────────── */

function StreakDots({ commitment }: { commitment: Commitment }) {
  const today = todayISO();
  const dots: { date: string; filled: boolean; isToday: boolean }[] = [];

  for (let i = 6; i >= 0; i--) {
    const date = dateISO(Date.now() - i * 86_400_000, 0);
    // Only show dots for dates that fall within the commitment period
    const commitStart = new Date(commitment.startedAt);
    commitStart.setHours(0, 0, 0, 0);
    const dotDate = new Date(date);
    if (dotDate < commitStart) continue;

    dots.push({
      date,
      filled: commitment.checkedInDates.includes(date),
      isToday: date === today,
    });
  }

  return (
    <div className="flex items-center gap-1.5">
      {dots.map((dot) => (
        <div key={dot.date} className="relative flex items-center justify-center">
          <div
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              dot.filled
                ? 'bg-violet-500'
                : dot.isToday
                ? 'bg-[#333] ring-1 ring-violet-500/50'
                : 'bg-[#333]'
            }`}
          />
          {dot.isToday && !dot.filled && (
            <motion.div
              className="absolute inset-0 w-2 h-2 rounded-full ring-1 ring-violet-400/40"
              animate={{ scale: [1, 1.8, 1], opacity: [0.6, 0, 0.6] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          )}
        </div>
      ))}
    </div>
  );
}

/* ─── Commitment Card ────────────────────────────────────── */

interface CommitmentCardProps {
  commitment: Commitment;
}

export default function CommitmentCard({ commitment }: CommitmentCardProps) {
  const [confirmBreak, setConfirmBreak] = useState(false);
  const [justCheckedIn, setJustCheckedIn] = useState(false);

  const checkIn  = useTaskStore((s) => s.checkInCommitment);
  const breakIt  = useTaskStore((s) => s.breakCommitment);
  const restart  = useTaskStore((s) => s.restartCommitment);
  const deleteIt = useTaskStore((s) => s.deleteCommitment);

  const today = todayISO();
  const alreadyCheckedIn = commitment.checkedInDates.includes(today);
  const currentDay = commitment.status === 'active'
    ? Math.min(daysBetween(commitment.startedAt, Date.now()), commitment.durationDays)
    : (commitment.brokenOnDay ?? commitment.durationDays);
  const progress = currentDay / commitment.durationDays;
  const daysLeft = Math.max(0, commitment.durationDays - currentDay);

  // Auto-complete: if currentDay >= durationDays and all checked in
  useEffect(() => {
    if (
      commitment.status === 'active' &&
      currentDay >= commitment.durationDays &&
      commitment.checkedInDates.length >= commitment.durationDays
    ) {
      // Store handles this in checkInCommitment already, but just in case
    }
  }, [commitment, currentDay]);

  const handleCheckIn = () => {
    checkIn(commitment.id);
    setJustCheckedIn(true);
    setTimeout(() => setJustCheckedIn(false), 1200);
  };

  const handleBreak = () => {
    if (!confirmBreak) {
      setConfirmBreak(true);
      setTimeout(() => setConfirmBreak(false), 3000);
      return;
    }
    breakIt(commitment.id);
    setConfirmBreak(false);
  };

  const statusBadge = {
    active: { label: 'Active', color: 'bg-violet-500/15 text-violet-400 border-violet-500/20' },
    broken: { label: `Broken · Day ${commitment.brokenOnDay}`, color: 'bg-red-500/15 text-red-400 border-red-500/20' },
    completed: { label: 'Completed 🏆', color: 'bg-green-500/15 text-green-400 border-green-500/20' },
  }[commitment.status];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12, height: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className={`
        relative rounded-2xl border bg-[#1c1c1c] p-5
        transition-all duration-200
        ${commitment.status === 'broken' ? 'border-red-500/20' :
          commitment.status === 'completed' ? 'border-green-500/20' :
          'border-[#2a2a2a]'}
      `}
    >
      {/* ── Header: badge + delete ── */}
      <div className="flex items-center justify-between mb-4">
        <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${statusBadge.color}`}>
          {statusBadge.label}
        </span>
        <button
          onClick={() => deleteIt(commitment.id)}
          aria-label="Delete commitment"
          className="w-6 h-6 flex items-center justify-center rounded-full text-stone-700 hover:text-red-400 hover:bg-red-400/10 transition-all"
        >
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <path d="M1 1l8 8M9 1L1 9" />
          </svg>
        </button>
      </div>

      {/* ── Body: ring + info ── */}
      <div className="flex items-center gap-5">
        {/* Progress ring with day counter in center */}
        <div className="relative flex items-center justify-center">
          <ProgressRing progress={progress} status={commitment.status} />
          <div className="absolute inset-0 flex flex-col items-center justify-center rotate-0">
            <span className="text-lg font-bold text-stone-100 tabular-nums leading-none">
              {commitment.status === 'completed' ? '✓' : currentDay}
            </span>
            <span className="text-[9px] text-stone-500 mt-0.5">
              {commitment.status === 'completed' ? 'done' : `of ${commitment.durationDays}`}
            </span>
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h3 className="text-[15px] font-semibold text-stone-100 mb-1 leading-snug">
            {commitment.title}
          </h3>
          {commitment.description && (
            <p className="text-xs text-stone-500 mb-2 line-clamp-2">{commitment.description}</p>
          )}

          {/* Streak dots */}
          {commitment.status === 'active' && (
            <div className="mb-2">
              <StreakDots commitment={commitment} />
            </div>
          )}

          {/* Days left */}
          {commitment.status === 'active' && (
            <p className="text-[11px] text-stone-500">
              {daysLeft > 0 ? `${daysLeft} day${daysLeft !== 1 ? 's' : ''} left` : 'Final day!'}
            </p>
          )}
        </div>
      </div>

      {/* ── Actions ── */}
      <div className="mt-4 flex gap-2">
        {commitment.status === 'active' && (
          <>
            {/* Check-in button */}
            <motion.button
              onClick={handleCheckIn}
              disabled={alreadyCheckedIn}
              whileTap={!alreadyCheckedIn ? { scale: 0.95 } : {}}
              className={`
                flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200
                ${alreadyCheckedIn
                  ? 'bg-[#252525] text-stone-600 cursor-default'
                  : 'bg-violet-500/15 text-violet-400 border border-violet-500/20 hover:bg-violet-500/25 active:bg-violet-500/30'}
              `}
            >
              <AnimatePresence mode="wait">
                {justCheckedIn ? (
                  <motion.span key="done" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                    ✓ Checked in!
                  </motion.span>
                ) : alreadyCheckedIn ? (
                  <span key="already">Checked in today ✓</span>
                ) : (
                  <span key="cta">I stayed strong today</span>
                )}
              </AnimatePresence>
            </motion.button>

            {/* Break button */}
            <button
              onClick={handleBreak}
              className={`
                px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
                ${confirmBreak
                  ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                  : 'bg-[#252525] text-stone-600 hover:text-stone-400'}
              `}
            >
              {confirmBreak ? 'Confirm' : 'I broke it'}
            </button>
          </>
        )}

        {commitment.status === 'broken' && (
          <motion.button
            onClick={() => restart(commitment.id)}
            whileTap={{ scale: 0.95 }}
            className="flex-1 py-2.5 rounded-xl bg-violet-500/15 text-violet-400 border border-violet-500/20 text-sm font-semibold hover:bg-violet-500/25 transition-all"
          >
            🔄 Start Over
          </motion.button>
        )}

        {commitment.status === 'completed' && (
          <div className="flex-1 py-2.5 rounded-xl bg-green-500/10 text-center text-green-400 text-sm font-semibold">
            Challenge complete! 🎉
          </div>
        )}
      </div>
    </motion.div>
  );
}
