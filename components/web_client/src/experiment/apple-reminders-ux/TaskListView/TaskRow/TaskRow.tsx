import './task-row.css';

import { useRef, useState } from 'react';

import type { Task } from '../../../../api/client';

interface TaskRowProps {
  isPending?: boolean;
  onRename: (title: string) => void;
  onToggle: () => void;
  task: Task;
}

export function TaskRow({ isPending = false, onRename, onToggle, task }: TaskRowProps) {
  const completed = task.completed_at !== null;
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(task.title);
  const cancelledRef = useRef(false);

  function startEditing(): void {
    setDraft(task.title);
    setEditing(true);
  }

  function commit(): void {
    const nextTitle = draft.trim();
    setEditing(false);
    if (cancelledRef.current) {
      cancelledRef.current = false;
      return;
    }
    if (nextTitle && nextTitle !== task.title) {
      onRename(nextTitle);
    }
  }

  return (
    <li className="reminders-row" data-completed={completed} data-pending={isPending}>
      <button
        aria-checked={completed}
        aria-label={`${completed ? 'Reopen' : 'Complete'} ${task.title}`}
        className="reminders-row__checkbox"
        onClick={onToggle}
        role="checkbox"
        type="button"
      >
        <svg aria-hidden="true" className="reminders-row__mark" viewBox="0 0 22 22">
          <circle className="reminders-row__circle" cx="11" cy="11" r="10" />
          <path className="reminders-row__tick" d="M6.2 11.4l3.2 3.2 6.4-6.8" />
        </svg>
      </button>

      {editing ? (
        <input
          aria-label="Edit title"
          autoFocus
          className="reminders-row__input"
          maxLength={200}
          onBlur={commit}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Escape') {
              cancelledRef.current = true;
            }
            if (event.key === 'Enter' || event.key === 'Escape') {
              event.currentTarget.blur();
            }
          }}
          value={draft}
        />
      ) : (
        <button aria-label={`Edit ${task.title}`} className="reminders-row__title" onClick={startEditing} type="button">
          {task.title}
        </button>
      )}

      {isPending ? <span aria-label="Waiting to sync" className="reminders-row__pending" role="img" /> : null}
    </li>
  );
}
