import './task-list.css';

import { useEffect, useMemo, useState } from 'react';

import { useTasks } from '../../hooks/useTasks';
import { taskServiceClient } from '../../services/task-service-client';
import { EmptyState } from './EmptyState';
import { sortTasks } from './sortTasks';
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

  const ordered = useMemo(() => sortTasks(tasks), [tasks]);

  if (loading) {
    return <TaskListSkeleton />;
  }

  // A failed refresh over a list the device can already show is noise: the
  // tasks on screen are real, and the banner only says the network is down.
  if (error && tasks.length === 0) {
    return <p role="alert">{error}</p>;
  }

  if (tasks.length === 0) {
    return <EmptyState />;
  }

  return (
    <ul className="psykl-task-list">
      {ordered.map((task) => (
        <TaskRow isPending={pendingTaskIds.has(task.id)} key={task.id} task={task} />
      ))}
    </ul>
  );
}
