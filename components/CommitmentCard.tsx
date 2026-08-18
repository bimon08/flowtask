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

function dateISO(ms: number): string {
  const d = new Date(ms);
  d.setHours(0, 0, 0, 0);
  return d.toISOString().slice(0, 10);
}

/* ─── Circular Dot Progress Ring ─────────────────────────── */
/* A ring made of small circles — Nothing OS style.          */
/* Filled dots = progress, unfilled = remaining.             */

function DotRing({ current, total, status, size = 100 }: {
  current: number; total: number; status: string; size?: number;
}) {
  const dotCount = Math.min(total, 60); // max 60 dots on the ring
  const filledCount = Math.round((current / total) * dotCount);
  const radius = (size - 12) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const dotRadius = total <= 14 ? 3.5 : total <= 30 ? 2.5 : 2;

  const filledColor = status === 'completed' ? 'var(--success)' :
                      status === 'broken' ? 'var(--accent)' : '#ffffff';
  const emptyColor = '#1a1a1a';

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {Array.from({ length: dotCount }).map((_, i) => {
        // Start from top (12 o'clock), go clockwise
        const angle = (i / dotCount) * Math.PI * 2 - Math.PI / 2;
        const x = cx + radius * Math.cos(angle);
        const y = cy + radius * Math.sin(angle);
        const isFilled = i < filledCount;

        return (
          <motion.circle
            key={i}
            cx={x}
            cy={y}
            r={dotRadius}
            fill={isFilled ? filledColor : emptyColor}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.012, duration: 0.2 }}
          />
        );
      })}
    </svg>
  );
}

/* ─── Streak Dots (last 7 days) ──────────────────────────── */

function StreakDots({ commitment }: { commitment: Commitment }) {
  const today = todayISO();
  const dots: { date: string; filled: boolean; isToday: boolean }[] = [];

  for (let i = 6; i >= 0; i--) {
    const date = dateISO(Date.now() - i * 86_400_000);
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
                ? 'bg-white'
                : dot.isToday
                ? 'bg-[#1a1a1a] ring-1 ring-[var(--accent)]/50 rounded-full'
                : 'bg-[#1a1a1a]'
            }`}
          />
          {dot.isToday && !dot.filled && (
            <motion.div
              className="absolute inset-0 w-2 h-2 rounded-full ring-1 ring-[var(--accent)]/40"
              animate={{ opacity: [0.6, 0, 0.6] }}
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
  const daysLeft = Math.max(0, commitment.durationDays - currentDay);
  const pct = Math.round((currentDay / commitment.durationDays) * 100);

  useEffect(() => {
    // Auto-complete handled in store
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

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12, height: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className={`
        relative border bg-[#0a0a0a] p-5
        transition-all duration-200
        ${commitment.status === 'broken' ? 'border-[var(--accent)]/30' :
          commitment.status === 'completed' ? 'border-[var(--success)]/30' :
          'border-[#1a1a1a]'}
      `}
    >
      {/* ── Header: status + delete ── */}
      <div className="flex items-center justify-between mb-4">
        <span className={`font-dot text-[10px] uppercase tracking-wider ${
          commitment.status === 'active' ? 'text-white' :
          commitment.status === 'broken' ? 'text-[var(--accent)]' :
          'text-[var(--success)]'
        }`}>
          {commitment.status === 'active' ? '● ACTIVE' :
           commitment.status === 'broken' ? `✕ BROKEN · DAY ${commitment.brokenOnDay}` :
           '✓ COMPLETED'}
        </span>
        <button
          onClick={() => deleteIt(commitment.id)}
          aria-label="Delete commitment"
          className="w-6 h-6 flex items-center justify-center text-[#333] hover:text-[var(--accent)] transition-all"
        >
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <path d="M1 1l8 8M9 1L1 9" />
          </svg>
        </button>
      </div>

      {/* ── Title ── */}
      <h3 className="text-[15px] font-medium text-white mb-1 leading-snug">
        {commitment.title}
      </h3>
      {commitment.description && (
        <p className="text-[11px] text-[#555] mb-5 line-clamp-2">{commitment.description}</p>
      )}

      {/* ── Progress: Circle ring + day counter side by side ── */}
      <div className="flex items-center gap-5 mb-5">
        {/* Dot ring with day number in center */}
        <div className="relative shrink-0">
          <DotRing
            current={currentDay}
            total={commitment.durationDays}
            status={commitment.status}
            size={100}
          />
          {/* Center content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-dot text-2xl text-white leading-none tabular-nums">
              {commitment.status === 'completed' ? '✓' : currentDay}
            </span>
            <span className="font-dot text-[8px] text-[#555] uppercase mt-1">
              / {commitment.durationDays}
            </span>
          </div>
        </div>

        {/* Stats */}
        <div className="flex flex-col gap-2">
          <div>
            <span className="font-dot text-[9px] text-[#555] uppercase block">Progress</span>
            <span className="font-dot text-lg text-white">{pct}%</span>
          </div>
          {commitment.status === 'active' && (
            <div>
              <span className="font-dot text-[9px] text-[#555] uppercase block">Remaining</span>
              <span className="font-dot text-sm text-[#999]">
                {daysLeft > 0 ? `${daysLeft} day${daysLeft !== 1 ? 's' : ''}` : 'FINAL DAY'}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ── Streak dots (active only) ── */}
      {commitment.status === 'active' && (
        <div className="flex items-center gap-2 mb-4">
          <span className="font-dot text-[9px] text-[#333] uppercase">7D</span>
          <StreakDots commitment={commitment} />
        </div>
      )}

      {/* ── Decorative dot line ── */}
      <div className="dot-line h-[2px] w-full mb-4 opacity-30" />

      {/* ── Actions ── */}
      <div className="flex gap-2">
        {commitment.status === 'active' && (
          <>
            <motion.button
              onClick={handleCheckIn}
              disabled={alreadyCheckedIn}
              whileTap={!alreadyCheckedIn ? { scale: 0.95 } : {}}
              className={`
                flex-1 py-2.5 font-dot text-[11px] uppercase tracking-wider transition-all duration-200
                ${alreadyCheckedIn
                  ? 'bg-[#0a0a0a] text-[#333] border border-[#1a1a1a] cursor-default'
                  : 'bg-white text-black border border-white hover:bg-[#eee] active:bg-[#ddd]'}
              `}
            >
              <AnimatePresence mode="wait">
                {justCheckedIn ? (
                  <motion.span key="done" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                    ✓ DONE
                  </motion.span>
                ) : alreadyCheckedIn ? (
                  <span key="already">CHECKED IN ✓</span>
                ) : (
                  <span key="cta">CHECK IN</span>
                )}
              </AnimatePresence>
            </motion.button>

            <button
              onClick={handleBreak}
              className={`
                px-4 py-2.5 font-dot text-[11px] uppercase tracking-wider transition-all duration-200
                ${confirmBreak
                  ? 'bg-[var(--accent-soft)] text-[var(--accent)] border border-[var(--accent)]/30'
                  : 'bg-[#0a0a0a] text-[#333] border border-[#1a1a1a] hover:text-[#555] hover:border-[#333]'}
              `}
            >
              {confirmBreak ? 'CONFIRM' : 'BROKE IT'}
            </button>
          </>
        )}

        {commitment.status === 'broken' && (
          <motion.button
            onClick={() => restart(commitment.id)}
            whileTap={{ scale: 0.95 }}
            className="flex-1 py-2.5 font-dot text-[11px] uppercase tracking-wider bg-white text-black border border-white hover:bg-[#eee] transition-all"
          >
            ↻ RESTART
          </motion.button>
        )}

        {commitment.status === 'completed' && (
          <div className="flex-1 py-2.5 font-dot text-[11px] uppercase tracking-wider text-center text-[var(--success)] border border-[var(--success)]/20 bg-[var(--success-soft)]">
            CHALLENGE COMPLETE
          </div>
        )}
      </div>
    </motion.div>
  );
}
