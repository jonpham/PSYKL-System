import './sync-status.css';

interface SyncStatusProps {
  active: boolean;
  failedCount: number;
  onOpen: () => void;
  queuedCount: number;
}

export function SyncStatus({ active, failedCount, onOpen, queuedCount }: SyncStatusProps) {
  const attentionCount = failedCount + queuedCount;
  const needsAttention = attentionCount > 0;
  const accessibleLabel = needsAttention ? `Sync needs attention: ${attentionCount} changes` : 'Sync clear';

  return (
    <div className="reminders-sync-status">
      <button
        aria-current={active ? 'page' : undefined}
        aria-label={accessibleLabel}
        className="reminders-sync-status__control"
        data-status={needsAttention ? 'attention' : 'clear'}
        onClick={onOpen}
        type="button"
      >
        <span aria-hidden="true">↻</span> Sync
        {needsAttention ? <span className="reminders-sync-status__count">{attentionCount}</span> : null}
      </button>
      {active ? (
        <section aria-labelledby="reminders-sync-status-title" className="reminders-sync-status__details">
          <h2 id="reminders-sync-status-title">{needsAttention ? 'Needs attention' : 'All changes synced'}</h2>
          <p>Waiting to sync: {queuedCount}</p>
          <p>Permanently failed: {failedCount}</p>
          {queuedCount > 0 ? <p>Waiting changes remain saved on this device until sync succeeds.</p> : null}
          {failedCount > 0 ? <p>Failed changes could not be sent after repeated attempts.</p> : null}
        </section>
      ) : null}
    </div>
  );
}
