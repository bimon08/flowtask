'use client';

import { useEffect, useRef } from 'react';
import { useTaskStore } from '@/store/useTaskStore';

/**
 * Seeds the store with dummy tasks & commitments in development only.
 * Safe to import anywhere — it's a no-op in production.
 */
export function useDevSeed() {
  const seeded = useRef(false);
  const tasks       = useTaskStore((s) => s.tasks);
  const commitments = useTaskStore((s) => s.commitments);
  const addTask       = useTaskStore((s) => s.addTask);
  const addCommitment = useTaskStore((s) => s.addCommitment);
  const checkIn       = useTaskStore((s) => s.checkInCommitment);
  const toggleTask    = useTaskStore((s) => s.toggleTask);

  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return;
    if (seeded.current) return;
    if (tasks.length > 0 || commitments.length > 0) return; // don't overwrite real data
    seeded.current = true;

    // ── Dummy tasks ──────────────────────────────────────
    const dummyTasks = [
      'Review pull request for auth module',
      'Fix navbar alignment on mobile',
      'Write unit tests for payment flow',
      'Update API docs for v2 endpoints',
      'Refactor database queries — use joins',
      'Design dark mode toggle component',
      'Prepare slides for Friday standup',
    ];

    dummyTasks.forEach((title) => {
      addTask(title, 'today');
    });

    // Mark a couple as done after a tick (so they have IDs)
    setTimeout(() => {
      const current = useTaskStore.getState().tasks;
      if (current.length >= 7) {
        toggleTask(current[4].id); // "Refactor database queries"
        toggleTask(current[6].id); // "Prepare slides"
      }
    }, 100);

    // ── Dummy commitments ────────────────────────────────
    // Active commitment — started 12 days ago
    addCommitment('No WhatsApp or Instagram', 40, 'Stay focused. No stories, no status checks.');

    setTimeout(() => {
      const coms = useTaskStore.getState().commitments;
      if (coms.length >= 1) {
        const c = coms[0];
        // Backdate the start to 12 days ago
        const twelveDaysAgo = Date.now() - 12 * 86_400_000;
        const checkedDates: string[] = [];
        for (let i = 0; i < 10; i++) {
          const d = new Date(twelveDaysAgo + i * 86_400_000);
          checkedDates.push(d.toISOString().slice(0, 10));
        }
        // Directly patch the store for realistic seed data
        useTaskStore.setState((state) => ({
          commitments: state.commitments.map((cm) =>
            cm.id === c.id
              ? { ...cm, startedAt: twelveDaysAgo, checkedInDates: checkedDates }
              : cm
          ),
        }));
      }
    }, 150);

    // A second commitment — 7 day challenge
    addCommitment('Morning run before 7 AM', 7, 'Build the habit. No excuses.');

    setTimeout(() => {
      const coms = useTaskStore.getState().commitments;
      if (coms.length >= 2) {
        const c = coms[1];
        const threeDaysAgo = Date.now() - 3 * 86_400_000;
        const checkedDates: string[] = [];
        for (let i = 0; i < 2; i++) {
          const d = new Date(threeDaysAgo + i * 86_400_000);
          checkedDates.push(d.toISOString().slice(0, 10));
        }
        useTaskStore.setState((state) => ({
          commitments: state.commitments.map((cm) =>
            cm.id === c.id
              ? { ...cm, startedAt: threeDaysAgo, checkedInDates: checkedDates }
              : cm
          ),
        }));
      }
    }, 200);

  }, [tasks, commitments, addTask, addCommitment, checkIn, toggleTask]);
}
