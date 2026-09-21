import 'fake-indexeddb/auto';

import { act, renderHook, waitFor } from '@testing-library/react';
import { deleteDB } from 'idb';
import { afterEach, describe, expect, it } from 'vitest';

import { putFailedOp } from '../../../../db/idb';
import { notifyTasksChanged } from '../../../../hooks/useTasks';
import { useFailedSyncCount } from '../useFailedSyncCount';

const databaseName = 'psykl';

afterEach(async () => {
  await deleteDB(databaseName);
});

describe('useFailedSyncCount', () => {
  it('updates when a permanent sync failure is recorded', async () => {
    // Arrange
    const { result } = renderHook(() => useFailedSyncCount());
    await waitFor(() => expect(result.current).toBe(0));

    // Act
    await putFailedOp({
      id: 'failed-1',
      entity_type: 'task',
      entity_id: 'task-1',
      op: 'create',
      body: {},
      idempotency_key: 'idem-1',
      attempts: 10,
      next_attempt_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      failed_at: new Date().toISOString(),
      error: 'Gave up after 10 attempts',
    });
    await act(async () => {
      await notifyTasksChanged();
    });

    // Assert
    await waitFor(() => expect(result.current).toBe(1));
  });
});
