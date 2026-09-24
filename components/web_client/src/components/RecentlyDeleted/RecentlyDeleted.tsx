import './recently-deleted.css';

import type { DeletedItem } from '../../hooks/useRecentlyDeleted';
import { useRecentlyDeleted } from '../../hooks/useRecentlyDeleted';

interface RecentlyDeletedProps {
  open: boolean;
}

export function RecentlyDeleted({ open }: RecentlyDeletedProps) {
  const { items, restore } = useRecentlyDeleted();

  if (!open) {
    return null;
  }

  return (
    <div aria-label="Recently Deleted" className="psykl-recently-deleted" role="region">
      {items.length === 0 ? (
        <p className="psykl-recently-deleted__empty">Nothing deleted in the last 30 days.</p>
      ) : (
        <ul className="psykl-recently-deleted__rows">
          {items.map((item) => (
            <li aria-label={item.title} className="psykl-recently-deleted__row" key={`${item.type}-${item.id}`}>
              <KindGlyph type={item.type} />
              <span className="psykl-recently-deleted__label">
                <span className="psykl-recently-deleted__title">{item.title}</span>
                <span className="psykl-recently-deleted__kind">{kindText(item)}</span>
              </span>
              <span className="psykl-recently-deleted__remaining">{item.daysRemaining}d</span>
              <button
                aria-label={`Restore ${item.title}`}
                className="psykl-recently-deleted__restore"
                onClick={() => void restore(item)}
                type="button"
              >
                Restore
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/**
 * What a row was, and — for a list deleted with its tasks — what pressing
 * Restore brings back, since those tasks also hold rows of their own.
 */
function kindText(item: DeletedItem): string {
  if (item.type === 'task' || !item.itemCount) {
    return item.type;
  }
  return `list · ${item.itemCount} ${item.itemCount === 1 ? 'item' : 'items'}`;
}

function KindGlyph({ type }: { type: DeletedItem['type'] }) {
  return (
    <svg aria-hidden="true" className="psykl-recently-deleted__glyph" viewBox="0 0 24 24">
      {type === 'list' ? (
        <path d="M3.5 7.5a2 2 0 0 1 2-2h3l2 2h6a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-11a2 2 0 0 1-2-2z" />
      ) : (
        <>
          <circle cx="12" cy="12" r="8" />
          <path d="M8.5 12.2l2.5 2.5 4.5-5" />
        </>
      )}
    </svg>
  );
}
