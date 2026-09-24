import './task-row.css';

import type { PointerEvent, ReactNode } from 'react';
import { useRef } from 'react';

import { SwipeRail } from './SwipeRail';
import { useDelayedFlag } from './useDelayedFlag';
import type { RowSwipe as RowSwipeActions } from './useRowSwipe';
import { useRowSwipe } from './useRowSwipe';

// Only surface the pending-sync affordance once a row has been unsynced for this
// long, so fast online syncs don't flash a distracting dimmed row + dot.
const PENDING_AFFORDANCE_DELAY_MS = 2000;

interface RowSwipe extends RowSwipeActions {
  /** Accessible name of the cover that takes a tap while the rail is open. */
  dismissLabel: string;
  onDelete: () => void;
  onDetails: () => void;
}

interface TaskRowProps {
  /** The trailing slot's other occupant: a control for this row alone, shown
   * when the row carries no re-order handle. The two are mutually exclusive by
   * construction, so a tap in that column means one thing at a time. */
  action?: ReactNode;
  /** Anything that belongs to this row but not to its box — the details
   * drawer. Rendered last so it paints over the list. */
  children?: ReactNode;
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
  /** Present only on rows that reveal actions behind them. A selection-mode
   * row passes nothing: that column is the drag handle's, and a row that both
   * swipes and drags would make a horizontal gesture ambiguous. */
  swipe?: RowSwipe;
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
 * The trailing column is shared: it holds the re-order handle in selection
 * mode and a per-row control (the details button) outside it.
 *
 * It holds no mutation. What a tap means — toggle completion, or pool the row
 * into a batch — belongs to `EditableTaskRow` and `SelectableTaskRow`, because
 * that is the only thing the two modes genuinely disagree about (including what
 * the leading control claims to assistive tech).
 *
 * When a caller supplies `swipe`, the row's contents sit on a surface that
 * slides left over a rail painted behind it. The rail is revealed, never
 * pushed, and both of its actions stay reachable without a pointer through the
 * details drawer — the gesture is a shortcut, not the only route to anything.
 */
export function TaskRow({
  action,
  checkboxLabel,
  children,
  checked,
  completed,
  disabled = false,
  isDragging = false,
  isPending = false,
  onCheckboxClick,
  onDragStart,
  onReorder,
  selected = false,
  swipe,
  taskId,
  title,
  titleText,
}: TaskRowProps) {
  const showPending = useDelayedFlag(isPending, PENDING_AFFORDANCE_DELAY_MS);
  const rowRef = useRef<HTMLLIElement>(null);
  const railRef = useRef<HTMLDivElement>(null);

  const { committing, offset, onPointerDown, tracking } = useRowSwipe({
    enabled: swipe !== undefined && !disabled,
    railRef,
    rowRef,
    swipe,
  });

  return (
    <li
      aria-label={showPending ? `${titleText} pending sync` : titleText}
      className="psykl-task-row"
      data-committing={swipe ? committing : undefined}
      data-completed={completed}
      data-dragging={isDragging}
      data-pending={showPending}
      data-selected={selected}
      data-swipe-open={swipe ? swipe.open : undefined}
      data-swiping={swipe ? tracking : undefined}
      data-task-id={taskId}
      ref={rowRef}
      style={
        swipe
          ? ({ '--swipe-offset': offset === undefined ? undefined : `${offset}px` } as React.CSSProperties)
          : undefined
      }
    >
      {swipe ? (
        <SwipeRail
          mounted={swipe.open || tracking}
          onDelete={swipe.onDelete}
          onDetails={swipe.onDetails}
          open={swipe.open}
          ref={railRef}
          titleText={titleText}
        />
      ) : null}

      <div className="psykl-task-row__surface" onPointerDown={swipe ? onPointerDown : undefined}>
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
        {action && !onReorder ? <span className="psykl-task-row__action">{action}</span> : null}

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

        {/* An open row has slid its own controls half off the screen, where a
         * tap on what is left would mean something the user did not aim at. */}
        {swipe?.open ? (
          <button
            aria-label={swipe.dismissLabel}
            className="psykl-task-row__dismiss"
            onClick={() => swipe.onOpenChange(false)}
            type="button"
          />
        ) : null}
      </div>

      {children}
    </li>
  );
}
