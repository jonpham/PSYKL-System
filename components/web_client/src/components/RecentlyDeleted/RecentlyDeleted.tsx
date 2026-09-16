import { useRecentlyDeleted } from '../../hooks/useRecentlyDeleted';

interface RecentlyDeletedProps {
  onClose?: () => void;
  open: boolean;
}

export function RecentlyDeleted({ onClose, open }: RecentlyDeletedProps) {
  const { items, restore } = useRecentlyDeleted();

  if (!open) {
    return null;
  }

  return (
    <div
      aria-label="Recently Deleted"
      role="dialog"
      style={{ border: '1px solid #ccc', borderRadius: 4, padding: '1rem' }}
    >
      {items.length === 0 ? (
        <p>Nothing deleted in the last 30 days.</p>
      ) : (
        <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
          {items.map((item) => (
            <li
              aria-label={item.title}
              key={`${item.type}-${item.id}`}
              style={{
                alignItems: 'center',
                borderBottom: '1px solid #eee',
                display: 'flex',
                gap: '0.5rem',
                padding: '0.5rem 0',
              }}
            >
              <span style={{ flex: 1 }}>{item.title}</span>
              <span style={{ color: '#666', fontSize: '0.85em' }}>{item.daysRemaining}d</span>
              <button aria-label={`Restore ${item.title}`} onClick={() => void restore(item)} type="button">
                Restore
              </button>
            </li>
          ))}
        </ul>
      )}
      {onClose ? (
        <button onClick={onClose} style={{ marginTop: '0.5rem' }} type="button">
          Close
        </button>
      ) : null}
    </div>
  );
}
