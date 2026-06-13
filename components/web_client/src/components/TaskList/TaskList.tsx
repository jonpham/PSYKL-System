import { useEffect, useState } from 'react';

import { listSyncQueue } from '../../db/idb';
import { useTasks } from '../../hooks/useTasks';

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
      {tasks.map((task) => {
        const isPending = pendingTaskIds.has(task.id);
        return (
          <li
            aria-label={isPending ? `${task.title} pending sync` : task.title}
            key={task.id}
            style={{
              borderBottom: '1px solid #eee',
              opacity: isPending ? 0.6 : 1,
              padding: '0.5rem 0',
            }}
          >
            <span>{task.title}</span>
            {isPending ? (
              <span
                aria-label="Pending sync"
                style={{
                  color: '#8a6d00',
                  display: 'inline-block',
                  fontSize: '0.85em',
                  marginLeft: '0.5rem',
                }}
                title="Pending sync"
              >
                ●
              </span>
            ) : null}
            <time dateTime={task.created_at} style={{ color: '#666', float: 'right', fontSize: '0.85em' }}>
              {new Date(task.created_at).toLocaleString()}
            </time>
          </li>
        );
      })}
    </ul>
  );
}
