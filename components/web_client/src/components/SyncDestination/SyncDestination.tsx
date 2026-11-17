import { useSyncRecords } from '../../hooks/useSyncRecords';
import { SyncView } from '../SyncView';

interface SyncDestinationProps {
  open: boolean;
}

/**
 * The Sync destination with its records. Mounted for as long as Offline Mode
 * is on, like Recently Deleted, so the records are already loaded when the
 * user opens it; never mounted with Offline Mode off (Premise 3).
 */
export function SyncDestination({ open }: SyncDestinationProps) {
  const syncRecords = useSyncRecords();
  if (!open) {
    return null;
  }
  return (
    <SyncView
      failed={syncRecords.failed}
      onDismissReplacedEdit={syncRecords.dismissReplacedEdit}
      queued={syncRecords.queued}
      replacedEdits={syncRecords.replacedEdits}
    />
  );
}
