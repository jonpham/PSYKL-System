import './selection-bar.css';

interface SelectionBarProps {
  count: number;
  onComplete: () => void;
  onDelete: () => void;
  onMove: () => void;
}

/**
 * Reminders puts batch actions on a flat bar centred over the list, on the same
 * plane the capture button occupies — the bar and the capture button are never
 * both on screen, because selecting and capturing are different modes.
 *
 * The bar arrives with the mode rather than with the first selection, so the
 * mode always has a visible control surface. With nothing pooled it reads as
 * dimmed and its actions are disabled: unavailable, not absent.
 */
export function SelectionBar({ count, onComplete, onDelete, onMove }: SelectionBarProps) {
  const empty = count === 0;

  return (
    <div
      aria-label={empty ? 'Nothing selected' : `${count} selected`}
      className="psykl-selection-bar"
      data-empty={empty}
      role="toolbar"
    >
      <button
        aria-label="Mark selected tasks complete"
        className="psykl-selection-bar__action"
        disabled={empty}
        onClick={onComplete}
        type="button"
      >
        <svg aria-hidden="true" viewBox="0 0 22 22">
          <circle cx="11" cy="11" fill="none" r="9" />
          <circle cx="11" cy="11" fill="currentcolor" r="5.5" stroke="none" />
        </svg>
      </button>

      <button
        aria-label="Move selected tasks"
        className="psykl-selection-bar__action"
        disabled={empty}
        onClick={onMove}
        type="button"
      >
        <svg aria-hidden="true" viewBox="0 0 24 24">
          <path d="M4 7h10M4 12h10M4 17h6M17 14v6M14 17h6" />
        </svg>
      </button>

      <button
        aria-label="Delete selected tasks"
        className="psykl-selection-bar__action"
        data-destructive="true"
        disabled={empty}
        onClick={onDelete}
        type="button"
      >
        <svg aria-hidden="true" viewBox="0 0 24 24">
          <path d="M5 7h14M10 7V5h4v2M7 7l1 12h8l1-12M10 11v5M14 11v5" />
        </svg>
      </button>
    </div>
  );
}
