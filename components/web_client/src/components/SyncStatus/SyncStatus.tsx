import './sync-status.css';

import { DestinationGlyph } from '../AppShell/Glyphs';

interface SyncStatusProps {
  active: boolean;
  failedCount: number;
  onOpen: () => void;
  queuedCount: number;
}

// The control only; the panel describing what is queued or failed is the Sync
// destination, which Spec 5 builds.
export function SyncStatus({ active, failedCount, onOpen, queuedCount }: SyncStatusProps) {
  const needsAttention = failedCount + queuedCount > 0;

  return (
    <div className="psykl-sync-status">
      <button
        aria-current={active ? 'page' : undefined}
        aria-label={needsAttention ? 'Sync needs attention' : 'Sync clear'}
        className="psykl-sync-status__control"
        data-status={needsAttention ? 'attention' : 'clear'}
        onClick={onOpen}
        type="button"
      >
        <DestinationGlyph name="sync" />
      </button>
    </div>
  );
}
