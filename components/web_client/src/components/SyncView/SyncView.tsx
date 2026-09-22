import './sync-view.css';

import type { FailedOpEntry, SyncQueueEntry } from '../../db/idb.types';

interface SyncViewProps {
  failed: FailedOpEntry[];
  queued: SyncQueueEntry[];
}

const entityNoun: Record<string, string> = { list: 'list', task: 'task' };
const opVerb: Record<string, string> = {
  create: 'Added',
  delete: 'Deleted',
  patch: 'Edited',
  restore: 'Restored',
};

function describeEntry(entry: SyncQueueEntry): string {
  return `${opVerb[entry.op] ?? 'Changed'} a ${entityNoun[entry.entity_type] ?? 'record'}`;
}

/** What this device has done that the server has not confirmed. Durable, so a
 * user can open it hours later — unlike the transient banner it replaces. */
export function SyncView({ failed, queued }: SyncViewProps) {
  if (queued.length === 0 && failed.length === 0) {
    return <p className="psykl-sync-view__clear">Everything is synced.</p>;
  }

  return (
    <div className="psykl-sync-view">
      {queued.length > 0 ? (
        <section aria-label="Waiting to sync" className="psykl-sync-view__section">
          <h3>Waiting to sync ({queued.length})</h3>
          <ul>
            {queued.map((entry) => (
              <li key={entry.id}>
                <span>{describeEntry(entry)}</span>
                <time dateTime={entry.created_at}>{new Date(entry.created_at).toLocaleString()}</time>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {failed.length > 0 ? (
        <section aria-label="Could not be sent" className="psykl-sync-view__section">
          <h3>Could not be sent ({failed.length})</h3>
          <ul>
            {failed.map((entry) => (
              <li key={entry.id}>
                <span>{describeEntry(entry)}</span>
                <span className="psykl-sync-view__reason">{entry.error}</span>
                <time dateTime={entry.failed_at}>{new Date(entry.failed_at).toLocaleString()}</time>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
