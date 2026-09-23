import './selection-bar.css';

import { useEffect, useState } from 'react';

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
 *
 * Delete takes two presses, the way deleting a list does in the list menu: the
 * first arms the action — the trash opens its lid and the button fills — and
 * the second performs it. Anything that changes what would be destroyed, or
 * moves the user's attention elsewhere in the bar, disarms it.
 */
export function SelectionBar({ count, onComplete, onDelete, onMove }: SelectionBarProps) {
  const empty = count === 0;
  const [armed, setArmed] = useState(false);

  // What is pooled is what delete would destroy, so a changed pool retires the
  // confirmation rather than carrying it over to a different set of tasks.
  useEffect(() => {
    setArmed(false);
  }, [count]);

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
        onClick={() => {
          setArmed(false);
          onComplete();
        }}
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
        onClick={() => {
          setArmed(false);
          onMove();
        }}
        type="button"
      >
        <svg aria-hidden="true" viewBox="0 0 24 24">
          <path d="M4 7h10M4 12h10M4 17h6M17 14v6M14 17h6" />
        </svg>
      </button>

      <button
        aria-label={armed ? `Confirm deleting ${count} ${count === 1 ? 'task' : 'tasks'}` : 'Delete selected tasks'}
        className="psykl-selection-bar__action"
        data-armed={armed}
        data-destructive="true"
        disabled={empty}
        onClick={() => {
          if (!armed) {
            setArmed(true);
            return;
          }
          setArmed(false);
          onDelete();
        }}
        type="button"
      >
        {armed ? (
          /* Lid lifted and tilted: the can is open, waiting for the second press. */
          <svg aria-hidden="true" viewBox="0 0 24 24">
            <path d="M4.5 5.6l14 2.2M10.6 4.6l4-0.4M7.5 9.5l1 10h8l0.6-7M10 12.5v5M14 12v5" />
          </svg>
        ) : (
          <svg aria-hidden="true" viewBox="0 0 24 24">
            <path d="M5 7h14M10 7V5h4v2M7 7l1 12h8l1-12M10 11v5M14 11v5" />
          </svg>
        )}
      </button>
    </div>
  );
}
