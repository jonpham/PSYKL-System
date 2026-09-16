import { describe, expect, it } from 'vitest';

import { createListRemote } from '../../api/lists.api-client';
import { createTaskRemote } from '../../api/tasks.api-client';
import type { SyncQueueEntry } from '../../db/idb.types';
import { sendEntry } from '../replay.transport';

const nowIso = '2026-06-12T16:00:00.000Z';

function restoreEntry(overrides: Partial<SyncQueueEntry>): SyncQueueEntry {
  return {
    id: 'q1',
    entity_type: 'task',
    entity_id: 't1',
    op: 'restore',
    body: { updated_at: nowIso },
    idempotency_key: 'idem-1',
    attempts: 0,
    next_attempt_at: nowIso,
    created_at: nowIso,
    ...overrides,
  };
}

describe('sendEntry — restore op', () => {
  it('dispatches a task restore entry to POST /tasks/{id}/restore', async () => {
    // Given
    const taskId = '0196f0a4-8b5a-7000-8000-000000000021';
    await createTaskRemote({ id: taskId, title: 'wash the car', updated_at: nowIso }, 'idem-create-1');
    const entry = restoreEntry({ entity_id: taskId, entity_type: 'task', idempotency_key: 'idem-restore-1' });

    // When
    const result = await sendEntry(entry);

    // Then
    expect(result.status).toBe(200);
    expect((result.data as { deleted_at: string | null }).deleted_at).toBeNull();
  });

  it('dispatches a list restore entry to POST /lists/{id}/restore', async () => {
    // Given
    const listId = '0196f0a4-8b5a-7000-8000-000000000022';
    await createListRemote({ id: listId, title: 'Groceries', position: 'a0', updated_at: nowIso }, 'idem-create-2');
    const entry = restoreEntry({ entity_id: listId, entity_type: 'list', idempotency_key: 'idem-restore-2' });

    // When
    const result = await sendEntry(entry);

    // Then
    expect(result.status).toBe(200);
    expect((result.data as { deleted_at: string | null }).deleted_at).toBeNull();
  });
});
