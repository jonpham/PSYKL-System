import type { Ref } from 'react';

interface SwipeRailProps {
  /** False while the rail is closed and still: its controls are unmounted so a
   * list of rows does not carry an invisible second Details and Delete each. */
  mounted: boolean;
  onDelete: () => void;
  onDetails: () => void;
  /** The rail is only reachable once it is open — mid-drag it is on screen but
   * not yet a target. */
  open: boolean;
  ref: Ref<HTMLDivElement>;
  /** Names both controls, so a screen reader hears which task they act on. */
  titleText: string;
}

/**
 * The two actions painted behind a task row, revealed by swiping it left.
 *
 * Delete takes one press here, unlike the drawer's two: arriving at this rail
 * already took a deliberate gesture across a quarter of the row, and the task
 * lands in Recently Deleted either way.
 */
function SwipeRail({ mounted, onDelete, onDetails, open, ref, titleText }: SwipeRailProps) {
  return (
    <div className="psykl-task-row__rail" inert={!open} ref={ref}>
      {mounted ? (
        <>
          <button
            aria-label={`Details for ${titleText}`}
            className="psykl-task-row__rail-action"
            data-kind="details"
            onClick={onDetails}
            type="button"
          >
            <svg aria-hidden="true" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="9" />
              <path d="M12 11v5" />
              <path d="M12 7.6v0.1" />
            </svg>
            Details
          </button>
          <button
            aria-label={`Delete ${titleText}`}
            className="psykl-task-row__rail-action"
            data-kind="delete"
            onClick={onDelete}
            type="button"
          >
            <TrashGlyph />
            Delete
          </button>
        </>
      ) : null}
    </div>
  );
}

/**
 * The same delete wearing the whole row, shown once a swipe is past the commit
 * threshold. It is a sibling of the rail rather than part of it so it can fill
 * the row's own box — the rail only spans the width the surface uncovers.
 */
function DeletePane() {
  return (
    <span aria-hidden="true" className="psykl-task-row__commit">
      <TrashGlyph />
      Delete
    </span>
  );
}

function TrashGlyph() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="M5 7h14M10 7V5h4v2M7 7l1 12h8l1-12M10 11v5M14 11v5" />
    </svg>
  );
}

export { DeletePane, SwipeRail };
