'use client';

import { useCallback } from 'react';
import {
  DndContext,
  PointerSensor,
  TouchSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  closestCenter,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { AnimatePresence } from 'framer-motion';
import { useTaskStore } from '@/store/useTaskStore';
import { Task } from '@/types/task';
import SortableTaskItem from './SortableTaskItem';

interface TaskListProps {
  tasks: Task[];
  sortMode?: 'manual' | 'age';
}

export default function TaskList({ tasks, sortMode = 'manual' }: TaskListProps) {
  const reorderAllTasks = useTaskStore((s) => s.reorderAllTasks);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor,   { activationConstraint: { delay: 80, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const onDragEnd = useCallback((e: DragEndEvent) => {
    if (sortMode !== 'manual') return;
    if (e.over && e.active.id !== e.over.id)
      reorderAllTasks(String(e.active.id), String(e.over.id));
  }, [reorderAllTasks, sortMode]);

  const ids = tasks.map((t) => t.id);

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        <div>
          <AnimatePresence mode="popLayout">
            {tasks.map((task) => (
              <SortableTaskItem key={task.id} task={task} dragDisabled={sortMode !== 'manual'} />
            ))}
          </AnimatePresence>
        </div>
      </SortableContext>
    </DndContext>
  );
}
