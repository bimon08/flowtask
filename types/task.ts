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

