import { useEffect, useRef, useState } from 'react';

import type { Task } from '../../../api/client';
import type { SyncQueueEntry } from '../../../db/idb.types';
import { enqueueWithReplay } from '../../../sync/page-triggers';
import { enqueue, replay } from '../../../sync/replay';
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

  async function submit(op: SyncQueueEntry['op'], body: unknown, optimisticTask: Task): Promise<void> {
    await enqueueWithReplay({
      enqueue: () => enqueue({ body, entityId: task.id, entityType: 'task', op, optimisticTask }),
      replay,
    });
  }

  function commitTitle(value: string): void {
    const nextTitle = value.trim();
    if (!nextTitle || nextTitle === task.title) {
      return;
    }
    const now = new Date().toISOString();
    void submit('patch', { title: nextTitle, updated_at: now }, { ...task, title: nextTitle, updated_at: now });
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
    void submit(
      'patch',
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
    void submit('delete', { deleted_at: now, updated_at: now }, { ...task, deleted_at: now, updated_at: now });
  }

  const completed = task.completed_at !== null;

  return (
    <li
      aria-label={showPending ? `${task.title} pending sync` : task.title}
      style={{
        alignItems: 'center',
        borderBottom: '1px solid #eee',
        display: 'flex',
        gap: '0.5rem',
        opacity: showPending ? 0.6 : 1,
        padding: '0.5rem 0',
      }}
    >
      <input
        aria-label={completed ? `Mark ${task.title} incomplete` : `Mark ${task.title} complete`}
        checked={completed}
        onChange={toggleComplete}
        type="checkbox"
      />

      {editing ? (
        <input
          aria-label="Edit title"
          autoFocus
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
          style={{ flex: 1, padding: '0.25rem' }}
          value={draft}
        />
      ) : (
        <button
          aria-label={`Edit ${task.title}`}
          onClick={() => {
            setDraft(task.title);
            setEditing(true);
          }}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'text',
            flex: 1,
            padding: 0,
            textAlign: 'left',
            textDecoration: completed ? 'line-through' : 'none',
          }}
          type="button"
        >
          {task.title}
        </button>
      )}

      {showPending ? (
        <span aria-label="Pending sync" style={{ color: '#8a6d00', fontSize: '0.85em' }}>
          ●
        </span>
      ) : null}

      <time dateTime={task.created_at} style={{ color: '#666', fontSize: '0.85em' }}>
        {new Date(task.created_at).toLocaleString()}
      </time>

      <button
        aria-label={confirmingDelete ? `Confirm delete ${task.title}` : `Delete ${task.title}`}
        onClick={handleDeleteClick}
        type="button"
      >
        {confirmingDelete ? 'Confirm?' : 'Delete'}
      </button>
    </li>
  );
}
