import { useEffect, useState } from 'react';

import { listSyncQueue } from '../../db/idb';
import { useTasks } from '../../hooks/useTasks';
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
    void listSyncQueue().then((queue) => {
      if (!cancelled) {
        setPendingTaskIds((current) => {
          if (queue.length === 0 && current.size === 0) {
            return current;
          }
          return new Set(queue.map((entry) => entry.task_id));
        });
      }
    });
    return () => {
      cancelled = true;
    };
  }, [tasks]);

  if (loading) {
    return <p>Loading...</p>;
  }

  if (error) {
    return <p role="alert">{error}</p>;
  }

  if (tasks.length === 0) {
    return <p>No tasks yet. Create one above.</p>;
  }

  return (
    <ul style={{ listStyle: 'none', padding: 0 }}>
      {tasks.map((task) => (
        <TaskRow isPending={pendingTaskIds.has(task.id)} key={task.id} task={task} />
      ))}
    </ul>
  );
}
