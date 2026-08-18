export type TaskScope = 'today' | 'week';
export type TaskStatus = 'pending' | 'done';

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  scope: TaskScope;
  createdAt: number;
  completedAt?: number;
  dueDate?: number;
  order: number;
  estimatedMinutes?: number;
}

// ── Commitments ──────────────────────────────────────────────

export type CommitmentStatus = 'active' | 'broken' | 'completed';

export interface Commitment {
  id: string;
  title: string;
  description?: string;
  status: CommitmentStatus;
  durationDays: number;
  startedAt: number;
  checkedInDates: string[];   // ISO date strings, e.g. "2026-08-18"
  brokenAt?: number;
  brokenOnDay?: number;
  completedAt?: number;
  createdAt: number;
}
