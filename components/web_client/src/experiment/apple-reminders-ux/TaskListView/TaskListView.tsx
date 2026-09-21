import './task-list-view.css';

import { Fragment, useEffect, useMemo, useState } from 'react';

import type { Task } from '../../../api/client';
import { useTasks } from '../../../hooks/useTasks';
import { taskServiceClient } from '../../../services/task-service-client';
import { CaptureRow } from './CaptureRow';
import { sortTasks } from './sortTasks';
import { TaskRow } from './TaskRow';

interface TaskListViewProps {
  onCompletedCountChange?: (count: number) => void;
  showCompleted?: boolean;
}

export function TaskListView({ onCompletedCountChange, showCompleted = true }: TaskListViewProps) {
  const { createTask, error, loading, patchTask, tasks } = useTasks();
  const [capturing, setCapturing] = useState(false);
  const [pendingTaskIds, setPendingTaskIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (tasks.length === 0 || typeof indexedDB === 'undefined') {
      setPendingTaskIds((current) => (current.size === 0 ? current : new Set()));
      return;
    }
    let cancelled = false;
    void taskServiceClient.listPending().then((ids) => {
      if (!cancelled) setPendingTaskIds(new Set(ids));
    });
    return () => {
      cancelled = true;
    };
  }, [tasks]);

  const ordered = useMemo(
    () => sortTasks(tasks).filter((task) => showCompleted || task.completed_at === null),
    [showCompleted, tasks],
  );

  // The shell's list menu needs this number, but it should not open a second
  // subscription to every task to get it — this view already has them.
  const completedCount = tasks.filter((task) => task.completed_at !== null).length;
  useEffect(() => {
    onCompletedCountChange?.(completedCount);
  }, [completedCount, onCompletedCountChange]);
  // The capture row belongs at the end of the open tasks, not at the end of the
  // list — a new task should never appear beneath the completed ones.
  const openCount = ordered.filter((task) => task.completed_at === null).length;

  function toggle(task: Task): void {
    const now = new Date().toISOString();
    const completedAt = task.completed_at ? null : now;
    void patchTask(
      task.id,
      { completed_at: completedAt, updated_at: now },
      { ...task, completed_at: completedAt, updated_at: now },
    );
  }

  function rename(task: Task, title: string): void {
    const now = new Date().toISOString();
    void patchTask(task.id, { title, updated_at: now }, { ...task, title, updated_at: now });
  }

  const captureRow = (
    <CaptureRow
      onCancel={() => setCapturing(false)}
      onCreate={async (title) => {
        await createTask(title);
      }}
    />
  );

  return (
    <div className="reminders-list">
      {/* Offline-first: a failed fetch is only news when the device has nothing
       * to show. Otherwise the header's sync control already carries it. */}
      {error && ordered.length === 0 ? (
        <p className="reminders-list__error" role="alert">
          {error}
        </p>
      ) : null}

      {loading ? (
        <p className="reminders-list__placeholder">Loading…</p>
      ) : ordered.length === 0 && !capturing ? (
        <p className="reminders-list__placeholder">No Reminders</p>
      ) : (
        <ul className="reminders-list__rows">
          {ordered.map((task, index) => (
            <Fragment key={task.id}>
              <TaskRow
                isPending={pendingTaskIds.has(task.id)}
                onRename={(title) => rename(task, title)}
                onToggle={() => toggle(task)}
                task={task}
              />
              {capturing && index + 1 === openCount ? captureRow : null}
            </Fragment>
          ))}
          {capturing && openCount === 0 ? captureRow : null}
        </ul>
      )}

      <div className="reminders-list__capture-bar">
        <button
          aria-label="New Reminder"
          className="reminders-list__capture"
          onClick={() => setCapturing(true)}
          type="button"
        >
          <svg aria-hidden="true" className="reminders-list__capture-glyph" viewBox="0 0 24 24">
            <path d="M12 5v14M5 12h14" />
          </svg>
        </button>
      </div>
    </div>
  );
}
