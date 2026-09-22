import './task-row.css';

import { useEffect, useRef, useState } from 'react';

import type { Task } from '../../../api/client';
import { useTasks } from '../../../hooks/useTasks';
import { useDelayedFlag } from './useDelayedFlag';

const CONFIRM_DELETE_WINDOW_MS = 3000;
// Only surface the pending-sync affordance once a row has been unsynced for this
// long, so fast online syncs don't flash a distracting dimmed row + dot.
const PENDING_AFFORDANCE_DELAY_MS = 2000;

interface TaskRowProps {
  isPending?: boolean;
  task: Task;
}

export function TaskRow({ isPending = false, task }: TaskRowProps) {
  const { deleteTask, patchTask } = useTasks();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(task.title);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const cancelEditRef = useRef(false);
  const confirmTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const showPending = useDelayedFlag(isPending, PENDING_AFFORDANCE_DELAY_MS);

  useEffect(() => {
    return () => {
      if (confirmTimerRef.current) {
        clearTimeout(confirmTimerRef.current);
      }
    };
  }, []);

  function commitTitle(value: string): void {
    const nextTitle = value.trim();
    if (!nextTitle || nextTitle === task.title) {
      return;
    }
    const now = new Date().toISOString();
    void patchTask(task.id, { title: nextTitle, updated_at: now }, { ...task, title: nextTitle, updated_at: now });
  }

  // Enter/Escape blur the input so `onBlur` is the single commit point; Escape
  // arms `cancelEditRef` so the ensuing blur discards the draft.
  function handleEditBlur(): void {
    if (!cancelEditRef.current) {
      commitTitle(draft);
    }
    cancelEditRef.current = false;
    setEditing(false);
  }

  function toggleComplete(): void {
    const now = new Date().toISOString();
    const completedAt = task.completed_at ? null : now;
    void patchTask(
      task.id,
      { completed_at: completedAt, updated_at: now },
      { ...task, completed_at: completedAt, updated_at: now },
    );
  }

  function handleDeleteClick(): void {
    if (!confirmingDelete) {
      setConfirmingDelete(true);
      confirmTimerRef.current = setTimeout(() => setConfirmingDelete(false), CONFIRM_DELETE_WINDOW_MS);
      return;
    }
    if (confirmTimerRef.current) {
      clearTimeout(confirmTimerRef.current);
    }
    setConfirmingDelete(false);
    const now = new Date().toISOString();
    void deleteTask(task.id, { deleted_at: now, updated_at: now }, { ...task, deleted_at: now, updated_at: now });
  }

  const completed = task.completed_at !== null;

  return (
    <li
      aria-label={showPending ? `${task.title} pending sync` : task.title}
      className="psykl-task-row"
      data-completed={completed}
      data-pending={showPending}
    >
      <button
        aria-checked={completed}
        aria-label={completed ? `Mark ${task.title} incomplete` : `Mark ${task.title} complete`}
        className="psykl-task-row__checkbox"
        onClick={toggleComplete}
        role="checkbox"
        type="button"
      >
        <svg aria-hidden="true" className="psykl-task-row__mark" viewBox="0 0 22 22">
          <circle className="psykl-task-row__circle" cx="11" cy="11" r="10" />
          <path className="psykl-task-row__tick" d="M6.2 11.4l3.2 3.2 6.4-6.8" />
        </svg>
      </button>

      {editing ? (
        <input
          aria-label="Edit title"
          autoFocus
          className="psykl-task-row__input"
          maxLength={200}
          onBlur={handleEditBlur}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.currentTarget.blur();
            } else if (event.key === 'Escape') {
              cancelEditRef.current = true;
              event.currentTarget.blur();
            }
          }}
          value={draft}
        />
      ) : (
        <button
          aria-label={`Edit ${task.title}`}
          className="psykl-task-row__title"
          onClick={() => {
            setDraft(task.title);
            setEditing(true);
          }}
          type="button"
        >
          {task.title}
        </button>
      )}

      <button
        aria-label={confirmingDelete ? `Confirm delete ${task.title}` : `Delete ${task.title}`}
        className="psykl-task-row__delete"
        data-armed={confirmingDelete}
        onClick={handleDeleteClick}
        type="button"
      >
        {confirmingDelete ? 'Confirm?' : 'Delete'}
      </button>

      {showPending ? <span aria-label="Pending sync" className="psykl-task-row__pending" role="img" /> : null}
    </li>
  );
}
