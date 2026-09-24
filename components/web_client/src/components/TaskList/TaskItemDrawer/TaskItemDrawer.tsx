import '../../../styles/drawer.css';
import './task-item-drawer.css';

import { useEffect, useRef, useState } from 'react';

import type { Task } from '../../../api/client';

interface TaskItemDrawerProps {
  onClose: () => void;
  onDelete: () => void;
  onRename: (title: string) => void;
  task: Task;
}

/**
 * One task, on its own: what it is called, when it happened, and the way to get
 * rid of it without entering selection mode for a batch of one.
 *
 * The header is `MoveToListDrawer`'s grammar unchanged — ✕ discards and closes,
 * ✓ commits and closes, Escape reads as ✕ — because both are the same kind of
 * surface and a user should not have to learn two.
 *
 * Delete takes two presses the way the selection bar's does (`SelectionBar`):
 * the first arms the same control rather than raising a louder second one, and
 * anything that changes what the press would destroy disarms it.
 */
export function TaskItemDrawer({ onClose, onDelete, onRename, task }: TaskItemDrawerProps) {
  const [draft, setDraft] = useState(task.title);
  const [armed, setArmed] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeRef.current?.focus();
    const dismiss = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', dismiss);
    return () => window.removeEventListener('keydown', dismiss);
  }, [onClose]);

  const trimmed = draft.trim();
  const renamed = trimmed.length > 0 && trimmed !== task.title;

  return (
    <div className="psykl-drawer-scrim">
      <div aria-label="Task" aria-modal="true" className="psykl-drawer-sheet psykl-task-drawer" role="dialog">
        <header className="psykl-task-drawer__header">
          <button
            aria-label="Cancel"
            className="psykl-task-drawer__control"
            onClick={onClose}
            ref={closeRef}
            type="button"
          >
            <svg aria-hidden="true" viewBox="0 0 24 24">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
          <h3>Task</h3>
          <button
            aria-label="Save"
            className="psykl-task-drawer__control"
            data-confirm="true"
            disabled={!renamed}
            onClick={() => {
              onRename(trimmed);
              onClose();
            }}
            type="button"
          >
            <svg aria-hidden="true" viewBox="0 0 24 24">
              <path d="M5 12.5l4.5 4.5L19 7.5" />
            </svg>
          </button>
        </header>

        {/* No visible label: a single large field under a header reading "Task" is
         * already the title, and a caption over it only repeats the obvious. */}
        <div className="psykl-task-drawer__field">
          <input
            aria-label="Title"
            className="psykl-task-drawer__input"
            maxLength={200}
            onChange={(event) => {
              setDraft(event.target.value);
              // The title is part of what a delete would destroy, so changing it
              // retires a confirmation the user gave about the older task.
              setArmed(false);
            }}
            type="text"
            value={draft}
          />
        </div>

        <dl className="psykl-task-drawer__details">
          <Detail label="Completed" value={task.completed_at} />
          <Detail label="Last updated" value={task.updated_at} />
          <Detail label="Created" value={task.created_at} />
        </dl>

        <div className="psykl-task-drawer__footer">
          <button
            aria-label={armed ? `Confirm deleting ${task.title}` : 'Delete task'}
            className="psykl-task-drawer__delete"
            data-armed={armed}
            onClick={() => {
              if (!armed) {
                setArmed(true);
                return;
              }
              onDelete();
              onClose();
            }}
            type="button"
          >
            {armed ? 'Delete Task?' : 'Delete Task'}
          </button>
        </div>
      </div>
    </div>
  );
}

/** A timestamp a user can read. An em dash means the moment has not happened —
 * never a blank, which reads as a surface that failed to load. */
function Detail({ label, value }: { label: string; value: string | null }) {
  return (
    <div aria-label={label} className="psykl-task-drawer__detail" role="group">
      <dt>{label}</dt>
      <dd>{value === null ? '—' : formatMoment(value)}</dd>
    </div>
  );
}

function formatMoment(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}
