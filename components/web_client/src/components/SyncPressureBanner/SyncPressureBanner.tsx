import { useSyncPressure } from '../../hooks/useSyncPressure';

export function SyncPressureBanner() {
  const { count, level } = useSyncPressure();

  if (level === 'ok') {
    return null;
  }

  return (
    <p
      role="status"
      style={{
        background: '#fff3cd',
        border: '1px solid #ffe08a',
        borderRadius: 4,
        margin: '1rem 0 0',
        padding: '0.5rem 0.75rem',
      }}
    >
      {count} changes waiting to sync. Reconnect to save them.
    </p>
  );
}
