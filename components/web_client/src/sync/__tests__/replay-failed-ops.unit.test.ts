import 'fake-indexeddb/auto';

import { deleteDB } from 'idb';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { enqueueSyncOp, listFailedOps } from '../../db/idb';
import { replay } from '../replay';

const databaseName = 'psykl';
const taskId = '0196f0a4-8b5a-7000-8000-000000000001';
const nowIso = '2026-06-12T16:00:00.000Z';
const laterIso = '2026-06-12T16:01:00.000Z';

afterEach(async () => {
  vi.restoreAllMocks();
  await deleteDB(databaseName);
});

describe('failed sync operations', () => {
  it('moves a 4xx response to failed_ops and deletes the queue row', async () => {
    // Given
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    await enqueueFailure(0);

    // When
    const result = await replay({
      now: () => new Date(nowIso),
      owner: 'page',
      transport: vi.fn().mockResolvedValue({ error: 'invalid task', status: 400 }),
    });

    // Then
    expect(result).toEqual({ failed: 1, replayed: 0, retried: 0 });
    expect(consoleError).toHaveBeenCalledWith('Permanent sync failure', {
      error: 'invalid task',
      id: 'op-000',
      status: 400,
    });
    const failedOps = await listFailedOps();
    expect(failedOps).toEqual([
      expect.objectContaining({
        error: 'invalid task',
        failed_at: nowIso,
        id: 'op-000',
      }),
    ]);
  });

  it('warns when failed_ops reaches 50 rows and caps the store at 100 rows', async () => {
    // Given
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    for (let index = 0; index < 100; index += 1) {
      await enqueueFailure(index);
    }

    // When
    const result = await replay({
      now: () => new Date(laterIso),
      owner: 'page',
      transport: vi.fn().mockResolvedValue({ error: 'invalid task', status: 400 }),
    });

    // Then
    expect(result).toEqual({ failed: 100, replayed: 0, retried: 0 });
    expect(consoleError).toHaveBeenCalledTimes(100);
    expect(consoleWarn).toHaveBeenCalledWith('Sync failed_ops reached warning threshold', {
      count: 50,
      threshold: 50,
    });
    expect(await listFailedOps()).toHaveLength(100);

    // Given
    await enqueueFailure(100, laterIso);

    // When
    await replay({
      now: () => new Date(laterIso),
      owner: 'page',
      transport: vi.fn().mockResolvedValue({ error: 'invalid task', status: 400 }),
    });

    // Then
    const cappedFailedOps = await listFailedOps();
    expect(cappedFailedOps).toHaveLength(100);
    expect(cappedFailedOps.at(0)?.id).toBe('op-001');
    expect(cappedFailedOps.at(-1)?.id).toBe('op-100');
  });
});

async function enqueueFailure(
  index: number,
  createdAt = new Date(Date.parse(nowIso) + index).toISOString(),
): Promise<void> {
  await enqueueSyncOp({
    id: `op-${index.toString().padStart(3, '0')}`,
    task_id: taskId,
    op: 'patch',
    body: { title: `failed ${index}`, updated_at: nowIso },
    idempotency_key: `0196f0a4-8b5a-7000-8000-${index.toString().padStart(12, '0')}`,
    attempts: 0,
    next_attempt_at: createdAt,
    created_at: createdAt,
  });
}
