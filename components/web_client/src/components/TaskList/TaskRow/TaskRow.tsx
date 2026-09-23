import './task-row.css';

import type { PointerEvent, ReactNode } from 'react';

import { useDelayedFlag } from './useDelayedFlag';

// Only surface the pending-sync affordance once a row has been unsynced for this
// long, so fast online syncs don't flash a distracting dimmed row + dot.
const PENDING_AFFORDANCE_DELAY_MS = 2000;

interface TaskRowProps {
  /** Accessible name of the leading control — what a tap on it will do. */
  checkboxLabel: string;
  /** Drives the control's `aria-checked`; what "checked" means is the caller's. */
  checked: boolean;
  /** Drives the bordered fill and the struck-through title. */
  completed: boolean;
  /** The row's controls are inert — a batch it belongs to is in flight. */
  disabled?: boolean;
  /** The row is under the user's finger in a re-order drag. */
  isDragging?: boolean;
  isPending?: boolean;
  onCheckboxClick?: () => void;
  /** Starts a pointer drag from the handle; absent when the row cannot move. */
  onDragStart?: (event: PointerEvent<HTMLButtonElement>) => void;
  /** Keyboard equivalent of dragging the handle one row up or down. Giving the
   * shell either reorder prop is what puts a handle on the row — it is not tied
   * to selection mode, so ordinary rows can become draggable without a fork. */
  onReorder?: (delta: -1 | 1) => void;
  /** Drives the tick, which means "in the current selection" and nothing else. */
  selected?: boolean;
  taskId: string;
  /** The title area: a button, an input, whatever the behaviour needs. */
  title: ReactNode;
  /** Plain-text title, for the row's and the handle's accessible names. */
  titleText: string;
}

/**
 * The presentation shell every task row shares: the row box, the leading mark,
 * a title slot, the pending affordance, and the re-order handle.
 *
 * It holds no mutation. What a tap means — toggle completion, or pool the row
 * into a batch — belongs to `EditableTaskRow` and `SelectableTaskRow`, because
 * that is the only thing the two modes genuinely disagree about (including what
 * the leading control claims to assistive tech).
 */
export function TaskRow({
  checkboxLabel,
  checked,
  completed,
  disabled = false,
  isDragging = false,
  isPending = false,
  onCheckboxClick,
  onDragStart,
  onReorder,
  selected = false,
  taskId,
  title,
  titleText,
}: TaskRowProps) {
  const showPending = useDelayedFlag(isPending, PENDING_AFFORDANCE_DELAY_MS);

  return (
    <li
      aria-label={showPending ? `${titleText} pending sync` : titleText}
      className="psykl-task-row"
      data-completed={completed}
      data-dragging={isDragging}
      data-pending={showPending}
      data-selected={selected}
      data-task-id={taskId}
    >
      <button
        aria-checked={checked}
        aria-label={checkboxLabel}
        className="psykl-task-row__checkbox"
        disabled={disabled}
        onClick={onCheckboxClick}
        role="checkbox"
        type="button"
      >
        <svg aria-hidden="true" className="psykl-task-row__mark" viewBox="0 0 22 22">
          <circle className="psykl-task-row__circle" cx="11" cy="11" r="10" />
          {/* Completion is a ring with a filled core, the way Reminders draws
           * it — never a solid disc, which would read as a selected row. */}
          <circle className="psykl-task-row__core" cx="11" cy="11" r="5.5" />
          <path className="psykl-task-row__tick" d="M6.2 11.4l3.2 3.2 6.4-6.8" />
        </svg>
      </button>

      {title}

      {showPending ? <span aria-label="Pending sync" className="psykl-task-row__pending" role="img" /> : null}

      {/* Completed rows stay ordered by when they were completed, so a drag
       * there would have nothing to mean. */}
      {onReorder && !completed ? (
        <button
          aria-label={`Reorder ${titleText}`}
          className="psykl-task-row__handle"
          disabled={disabled}
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
