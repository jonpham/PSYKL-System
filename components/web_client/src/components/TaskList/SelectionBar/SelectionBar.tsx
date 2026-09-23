import './selection-bar.css';

interface SelectionBarProps {
  count: number;
  onComplete: () => void;
  onDelete: () => void;
  onMove: () => void;
}

/**
 * Reminders puts batch actions on a floating bar centred over the list, on the
 * same plane the capture button occupies — the bar and the capture button are
 * never both on screen, because selecting and capturing are different modes.
 */
export function SelectionBar({ count, onComplete, onDelete, onMove }: SelectionBarProps) {
  return (
    <div aria-label={`${count} selected`} className="psykl-selection-bar" role="toolbar">
      <button
        aria-label="Mark selected tasks complete"
        className="psykl-selection-bar__action"
        onClick={onComplete}
        type="button"
      >
        <svg aria-hidden="true" viewBox="0 0 22 22">
          <circle cx="11" cy="11" fill="currentcolor" r="9" />
        </svg>
      </button>

      <button aria-label="Move selected tasks" className="psykl-selection-bar__action" onClick={onMove} type="button">
        <svg aria-hidden="true" viewBox="0 0 24 24">
          <path d="M4 7h10M4 12h10M4 17h6M17 14v6M14 17h6" />
        </svg>
      </button>

      <button
        aria-label="Delete selected tasks"
        className="psykl-selection-bar__action"
        data-destructive="true"
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
