import './recently-deleted.css';

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
              <span className="psykl-recently-deleted__title">{item.title}</span>
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
