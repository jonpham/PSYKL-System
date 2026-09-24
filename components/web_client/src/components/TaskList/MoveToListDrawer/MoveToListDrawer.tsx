import '../../../styles/drawer.css';
import './move-to-list-drawer.css';

import { useEffect, useRef, useState } from 'react';

import { useActiveListId } from '../../../hooks/useActiveList';
import { useLists } from '../../../hooks/useLists';

interface MoveToListDrawerProps {
  onClose: () => void;
  onMove: (listId: string) => void;
}

/**
 * The destinations are every list except the one the user is looking at —
 * moving tasks to the list they are already in is not an outcome worth offering.
 */
export function MoveToListDrawer({ onClose, onMove }: MoveToListDrawerProps) {
  const { lists } = useLists();
  const activeListId = useActiveListId();
  const [chosen, setChosen] = useState<string | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeRef.current?.focus();
    const dismiss = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', dismiss);
    return () => window.removeEventListener('keydown', dismiss);
  }, [onClose]);

  const destinations = lists.filter((list) => list.id !== activeListId);

  return (
    <div aria-label="Move to:" aria-modal="true" className="psykl-drawer-sheet psykl-move-drawer" role="dialog">
      <header className="psykl-move-drawer__header">
        <button
          aria-label="Cancel"
          className="psykl-move-drawer__control"
          onClick={onClose}
          ref={closeRef}
          type="button"
        >
          <svg aria-hidden="true" viewBox="0 0 24 24">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
        <h3>Move to:</h3>
        <button
          aria-label="Move"
          className="psykl-move-drawer__control"
          data-confirm="true"
          disabled={chosen === null}
          onClick={() => {
            if (chosen !== null) onMove(chosen);
          }}
          type="button"
        >
          <svg aria-hidden="true" viewBox="0 0 24 24">
            <path d="M5 12.5l4.5 4.5L19 7.5" />
          </svg>
        </button>
      </header>

      {destinations.length === 0 ? (
        <p className="psykl-move-drawer__empty">There is nowhere else to move these tasks yet.</p>
      ) : (
        <ul className="psykl-move-drawer__lists" role="radiogroup">
          {destinations.map((list) => (
            <li key={list.id}>
              <button
                aria-checked={chosen === list.id}
                className="psykl-move-drawer__list"
                onClick={() => setChosen(list.id)}
                role="radio"
                type="button"
              >
                <span className="psykl-move-drawer__dot" data-chosen={chosen === list.id} />
                {list.title}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
