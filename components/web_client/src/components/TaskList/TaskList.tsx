import { useEffect, useState } from 'react';

import { useTasks } from '../../hooks/useTasks';
import { taskServiceClient } from '../../services/task-service-client';
import { EmptyState } from './EmptyState';
import { TaskListSkeleton } from './TaskListSkeleton';
import { TaskRow } from './TaskRow';

export function TaskList() {
  const { error, loading, tasks } = useTasks();
  const [pendingTaskIds, setPendingTaskIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (tasks.length === 0) {
      setPendingTaskIds((current) => (current.size === 0 ? current : new Set()));
      return;
    }

    if (typeof indexedDB === 'undefined') {
      return;
    }

    let cancelled = false;
    void taskServiceClient.listPending().then((ids) => {
      if (!cancelled) {
        setPendingTaskIds((current) => {
          if (ids.length === 0 && current.size === 0) {
            return current;
          }
          return new Set(ids);
        });
      }
    });
    return () => {
      cancelled = true;
    };
  }, [tasks]);

  if (loading) {
    return <TaskListSkeleton />;
  }

  if (error) {
    return <p role="alert">{error}</p>;
  }

  if (tasks.length === 0) {
    return <EmptyState />;
  }

  return (
    <ul style={{ listStyle: 'none', padding: 0 }}>
      {tasks.map((task) => (
        <TaskRow isPending={pendingTaskIds.has(task.id)} key={task.id} task={task} />
      ))}
    </ul>
  );
}
