import './delete-list-dialog.css';

import { useEffect, useRef } from 'react';

/** What happens to the tasks the list still holds. */
type DeleteListMode = 'just-list' | 'with-items';

interface DeleteListDialogProps {
  /** Live tasks in the list — what the user stands to lose. */
  itemCount: number;
  listTitle: string;
  onCancel: () => void;
  onDelete: (mode: DeleteListMode) => void;
}

/**
 * Deleting a list is the one destructive action in the app that can take other
 * records with it, so it asks rather than arming: a second press on a menu item
 * cannot express "and the items too".
 *
 * An empty list is offered a single deletion. With nothing inside, keeping the
 * items and taking them along are the same outcome, and a choice between two
 * identical results is only a chance to get it wrong.
 *
 * Cancel holds the initial focus and sits last in the tab order after the
 * destructive options, so no press of Enter on an freshly-opened dialog deletes
 * anything.
 */
export function DeleteListDialog({ itemCount, listTitle, onCancel, onDelete }: DeleteListDialogProps) {
  const cancelRef = useRef<HTMLButtonElement>(null);
  const holdsItems = itemCount > 0;

  useEffect(() => {
    cancelRef.current?.focus();
    const dismiss = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', dismiss);
    return () => window.removeEventListener('keydown', dismiss);
  }, [onCancel]);

  return (
    <div className="psykl-delete-list-dialog__scrim">
      <div aria-label={`Delete "${listTitle}"?`} aria-modal="true" className="psykl-delete-list-dialog" role="dialog">
        <header className="psykl-delete-list-dialog__header">
          <h3>Delete &ldquo;{listTitle}&rdquo;?</h3>
          {holdsItems ? (
            <p className="psykl-delete-list-dialog__detail">
              It still holds {itemCount} {itemCount === 1 ? 'item' : 'items'}.
            </p>
          ) : null}
        </header>

        {holdsItems ? (
          <>
            <button
              className="psykl-delete-list-dialog__choice"
              data-destructive="true"
              onClick={() => onDelete('with-items')}
              type="button"
            >
              Delete With Items
            </button>
            <button
              className="psykl-delete-list-dialog__choice"
              data-destructive="true"
              onClick={() => onDelete('just-list')}
              type="button"
            >
              Delete Just the List
            </button>
          </>
        ) : (
          <button
            className="psykl-delete-list-dialog__choice"
            data-destructive="true"
            onClick={() => onDelete('just-list')}
            type="button"
          >
            Delete List
          </button>
        )}

        <button className="psykl-delete-list-dialog__choice" onClick={onCancel} ref={cancelRef} type="button">
          Cancel
        </button>
      </div>
    </div>
  );
}

export type { DeleteListMode };
