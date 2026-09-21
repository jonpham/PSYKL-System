import './recently-deleted-view.css';

import { useRecentlyDeleted } from '../../../hooks/useRecentlyDeleted';

/** The production RecentlyDeleted renders as a bordered dialog with its own
 * inline styles, which read as a different app inside this shell (review note
 * 11). This is the same data in the shell's own row language. */
export function RecentlyDeletedView() {
  const { items, restore } = useRecentlyDeleted();

  if (items.length === 0) {
    return <p className="reminders-deleted__empty">Nothing deleted in the last 30 days.</p>;
  }

  return (
    <ul className="reminders-deleted__rows">
      {items.map((item) => (
        <li aria-label={item.title} className="reminders-deleted__row" key={`${item.type}-${item.id}`}>
          <span className="reminders-deleted__title">{item.title}</span>
          <span className="reminders-deleted__meta">{item.daysRemaining}d left</span>
          <button
            aria-label={`Restore ${item.title}`}
            className="reminders-deleted__restore"
            onClick={() => void restore(item)}
            type="button"
          >
            Restore
          </button>
        </li>
      ))}
    </ul>
  );
}
