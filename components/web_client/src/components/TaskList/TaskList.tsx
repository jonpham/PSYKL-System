import './task-list.css';

import { Fragment, useEffect, useMemo, useState } from 'react';

import { useTasks } from '../../hooks/useTasks';
import { taskServiceClient } from '../../services/task-service-client';
import { PlusGlyph } from '../AppShell/Glyphs';
import { CaptureRow } from './CaptureRow';
import { EmptyState } from './EmptyState';
import { sortTasks } from './sortTasks';
import { TaskListSkeleton } from './TaskListSkeleton';
import { TaskRow } from './TaskRow';

export function TaskList() {
  const { createTask, error, loading, tasks } = useTasks();
  const [capturing, setCapturing] = useState(false);
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

  const captureRow = (
    <CaptureRow
      onCancel={() => setCapturing(false)}
      onCreate={async (title) => {
        await createTask(title);
      }}
    />
  );

  // Capture belongs at the end of the open tasks, not the end of the list — a
  // new task should never appear beneath the completed ones.
  const openCount = ordered.filter((task) => task.completed_at === null).length;

  return (
    <>
      {tasks.length === 0 && !capturing ? (
        <EmptyState />
      ) : (
        <ul className="psykl-task-list">
          {ordered.map((task, index) => (
            <Fragment key={task.id}>
              <TaskRow isPending={pendingTaskIds.has(task.id)} task={task} />
              {capturing && index + 1 === openCount ? captureRow : null}
            </Fragment>
          ))}
          {capturing && openCount === 0 ? captureRow : null}
        </ul>
      )}

      <button
        aria-label="New Task"
        className="psykl-task-list__capture"
        onClick={() => setCapturing(true)}
        type="button"
      >
        <PlusGlyph />
        New Task
      </button>
    </>
  );
}
