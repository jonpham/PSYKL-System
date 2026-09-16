import 'fake-indexeddb/auto';

import { act, renderHook, waitFor } from '@testing-library/react';
import { deleteDB } from 'idb';
import { afterEach, describe, expect, it } from 'vitest';

import { enqueueSyncOp } from '../../db/idb';
import { useSyncDiscrepancy } from '../useSyncDiscrepancy';
import { notifyTasksChanged } from '../useTasks';

const databaseName = 'psykl';

afterEach(async () => {
  await deleteDB(databaseName);
});

describe('useSyncDiscrepancy', () => {
  it('reports the current queue depth and level, and updates on change notifications', async () => {
    // Given an empty queue
    const { result } = renderHook(() => useSyncDiscrepancy());
    await waitFor(() => expect(result.current.count).toBe(0));
    expect(result.current.level).toBe('ok');

    // When 25 entries are queued and a change notification fires
    for (let index = 0; index < 25; index += 1) {
      await enqueueSyncOp({
        id: `seed-${index}`,
        entity_type: 'task',
        entity_id: `task-${index}`,
        op: 'create',
        body: {},
        idempotency_key: `idem-${index}`,
        attempts: 0,
        next_attempt_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      });
    }
    await act(async () => {
      await notifyTasksChanged();
    });

    // Then the hook reflects the new depth and level
    await waitFor(() => expect(result.current.count).toBe(25));
    expect(result.current.level).toBe('nag');
  });
});
