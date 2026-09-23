import './task-row.css';

import type { PointerEvent } from 'react';
import { useRef, useState } from 'react';

import type { Task } from '../../../api/client';
import { useTasks } from '../../../hooks/useTasks';
import { useDelayedFlag } from './useDelayedFlag';

// Only surface the pending-sync affordance once a row has been unsynced for this
// long, so fast online syncs don't flash a distracting dimmed row + dot.
const PENDING_AFFORDANCE_DELAY_MS = 2000;

interface TaskRowProps {
  /** The row is under the user's finger in a re-order drag. */
  isDragging?: boolean;
  isPending?: boolean;
  /** Starts a pointer drag from the handle; absent when the row cannot move. */
  onDragStart?: (event: PointerEvent<HTMLButtonElement>) => void;
  /** Keyboard equivalent of dragging the handle one row up or down. */
  onReorder?: (delta: -1 | 1) => void;
  onToggleSelect?: () => void;
  /** Selection mode: the row pools into a batch instead of editing in place. */
  selectable?: boolean;
  selected?: boolean;
  task: Task;
}

export function TaskRow({
  isDragging = false,
  isPending = false,
  onDragStart,
  onReorder,
  onToggleSelect,
  selectable = false,
  selected = false,
  task,
}: TaskRowProps) {
  const { patchTask } = useTasks();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(task.title);
  const cancelEditRef = useRef(false);
  const showPending = useDelayedFlag(isPending, PENDING_AFFORDANCE_DELAY_MS);

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

  const completed = task.completed_at !== null;
  const selectLabel = selectable ? `${selected ? 'Deselect' : 'Select'} ${task.title}` : null;

  return (
    <li
      aria-label={showPending ? `${task.title} pending sync` : task.title}
      className="psykl-task-row"
      data-completed={completed}
      data-dragging={isDragging}
      data-pending={showPending}
      data-selected={selected}
      data-task-id={task.id}
    >
      <button
        aria-checked={selectable ? selected : completed}
        aria-label={selectLabel ?? (completed ? `Mark ${task.title} incomplete` : `Mark ${task.title} complete`)}
        className="psykl-task-row__checkbox"
        onClick={selectable ? onToggleSelect : toggleComplete}
        role="checkbox"
        type="button"
      >
        <svg aria-hidden="true" className="psykl-task-row__mark" viewBox="0 0 22 22">
          <circle className="psykl-task-row__circle" cx="11" cy="11" r="10" />
          <path className="psykl-task-row__tick" d="M6.2 11.4l3.2 3.2 6.4-6.8" />
        </svg>
      </button>

      {selectable ? (
        <button
          aria-label={selectLabel ?? task.title}
          className="psykl-task-row__title"
          data-selectable="true"
          onClick={onToggleSelect}
          type="button"
        >
          {task.title}
        </button>
      ) : editing ? (
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

      {showPending ? <span aria-label="Pending sync" className="psykl-task-row__pending" role="img" /> : null}

      {/* Only open tasks carry a handle: completed rows stay ordered by when
       * they were completed, so there is nothing for a drag to mean there. */}
      {selectable && onReorder && !completed ? (
        <button
          aria-label={`Reorder ${task.title}`}
          className="psykl-task-row__handle"
          onKeyDown={(event) => {
            if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return;
            event.preventDefault();
            onReorder(event.key === 'ArrowUp' ? -1 : 1);
          }}
          onPointerDown={onDragStart}
          type="button"
        >
          <svg aria-hidden="true" viewBox="0 0 24 24">
            <path d="M5 9h14M5 15h14" />
          </svg>
        </button>
      ) : null}
    </li>
  );
}
