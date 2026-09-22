import 'fake-indexeddb/auto';

import { deleteDB } from 'idb';
import { afterEach, describe, expect, it } from 'vitest';

import type { Task } from '../../api/client';
import type { SyncQueueEntry } from '../../db/idb.types';
import { listStaleWrites } from '../../preferences/staleWrites';
import { emitStaleWriteIfSuperseded } from '../stale-write';

const intended = '2026-06-01T09:00:00.000Z';

function entry(overrides: Partial<SyncQueueEntry> = {}): SyncQueueEntry {
  return {
    id: 'queue-1',
    entity_type: 'task',
    entity_id: 'task-1',
    op: 'patch',
    body: { title: 'Dentist: reschedule', updated_at: intended },
    idempotency_key: 'key-1',
    attempts: 0,
    next_attempt_at: intended,
    created_at: intended,
    ...overrides,
  };
}

function serverTask(overrides: Partial<Task> = {}): Task {
  return {
    id: 'task-1',
    user_id: 'local',
    title: 'Call the dentist back',
    created_at: intended,
    completed_at: null,
    updated_at: '2026-06-01T10:00:00.000Z',
    server_updated_at: '2026-06-01T10:00:00.500Z',
    deleted_at: null,
    list_id: null,
    ...overrides,
  };
}

afterEach(async () => {
  await deleteDB('psykl');
});

describe('recording a superseded write', () => {
  it('keeps what this device wrote alongside what replaced it', async () => {
    // Given the server kept a newer row from another device
    await emitStaleWriteIfSuperseded(entry(), serverTask());

    // When
    const [record] = await listStaleWrites();

    // Then
    expect(record).toMatchObject({
      entityId: 'task-1',
      won: { title: 'Call the dentist back' },
      wrote: { title: 'Dentist: reschedule' },
    });
  });

  it('records nothing when the server echoed what we sent', async () => {
    // Given no other device touched the row
    await emitStaleWriteIfSuperseded(entry(), serverTask({ updated_at: intended }));

    // When / Then
    await expect(listStaleWrites()).resolves.toEqual([]);
  });

  it('records nothing for a create or a delete, which cannot conflict this way', async () => {
    // Given
    await emitStaleWriteIfSuperseded(entry({ op: 'create' }), serverTask());
    await emitStaleWriteIfSuperseded(entry({ op: 'delete' }), serverTask());

    // When / Then
    await expect(listStaleWrites()).resolves.toEqual([]);
  });
});
