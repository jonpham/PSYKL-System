import { useSyncDiscrepancy } from '../../hooks/useSyncDiscrepancy';
import { SyncStatus, useFailedSyncCount } from '../SyncStatus';

interface HeaderSyncStatusProps {
  active: boolean;
  onOpen: () => void;
}

/**
 * The header's sync control with its counts. A component of its own so the
 * IndexedDB reads behind the counts run only while it is shown, which is only
 * with Offline Mode on (online-offline-modes DESIGN.md Premise 3).
 */
export function HeaderSyncStatus({ active, onOpen }: HeaderSyncStatusProps) {
  const { count: queuedCount } = useSyncDiscrepancy();
  const failedCount = useFailedSyncCount();
  return <SyncStatus active={active} failedCount={failedCount} onOpen={onOpen} queuedCount={queuedCount} />;
}
