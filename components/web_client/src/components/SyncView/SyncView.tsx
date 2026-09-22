import './sync-view.css';

import { useState } from 'react';

import type { FailedOpEntry, SyncQueueEntry } from '../../db/idb.types';
import type { StaleWriteRecord } from '../../preferences/staleWrites';

interface SyncViewProps {
  failed: FailedOpEntry[];
  onDismissReplacedEdit?: (id: string) => void;
  queued: SyncQueueEntry[];
  replacedEdits: StaleWriteRecord[];
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
export function SyncView({ failed, onDismissReplacedEdit, queued, replacedEdits }: SyncViewProps) {
  if (queued.length === 0 && failed.length === 0 && replacedEdits.length === 0) {
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

      {replacedEdits.length > 0 ? (
        <section aria-label="Replaced by another device" className="psykl-sync-view__section">
          <h3>Replaced by another device ({replacedEdits.length})</h3>
          <ul>
            {replacedEdits.map((record) => (
              <ReplacedEdit key={record.id} onDismiss={onDismissReplacedEdit} record={record} />
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}

/** Collapsed by default: the fact that an edit was replaced is the headline, and
 * the two versions are the detail a user opens when they want to retype it. */
function ReplacedEdit({ onDismiss, record }: { onDismiss?: (id: string) => void; record: StaleWriteRecord }) {
  const [open, setOpen] = useState(false);

  return (
    <li>
      <button onClick={() => setOpen((current) => !current)} type="button">
        What happened to this edit?
      </button>
      {open ? (
        <dl className="psykl-sync-view__versions">
          <dt>You wrote</dt>
          <dd>{record.wrote.title}</dd>
          <dt>It now reads</dt>
          <dd>{record.won.title}</dd>
        </dl>
      ) : null}
      <time dateTime={record.recordedAt}>{new Date(record.recordedAt).toLocaleString()}</time>
      <button onClick={() => onDismiss?.(record.id)} type="button">
        Dismiss
      </button>
    </li>
  );
}
