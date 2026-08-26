import 'fake-indexeddb/auto';

import { deleteDB } from 'idb';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { Task } from '../../api/client';
import { enqueueSyncOp, listSyncQueue } from '../../db/idb';
import { enqueue, replay } from '../replay';

const databaseName = 'psykl';
const taskId = '0196f0a4-8b5a-7000-8000-000000000001';
const nowIso = '2026-06-12T16:00:00.000Z';
const laterIso = '2026-06-12T16:01:00.000Z';

const serverTask: Task = {
  id: taskId,
  user_id: 'local',
  title: 'server task',
  created_at: nowIso,
  completed_at: null,
  updated_at: nowIso,
  server_updated_at: laterIso,
  deleted_at: null,
  list_id: null,
};

afterEach(async () => {
  vi.restoreAllMocks();
  await deleteDB(databaseName);
});

describe('enqueue', () => {
  it('generates a UUID v7 operation id and idempotency key', async () => {
    // When
    const entry = await enqueue(
      {
        body: { title: 'queued', updated_at: nowIso },
        entityId: taskId,
        entityType: 'task',
        op: 'patch',
      },
      {
        now: () => new Date(nowIso),
      },
    );

    // Then
    const uuidV7Pattern = /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/u;
    expect(entry.id).toMatch(uuidV7Pattern);
    expect(entry.idempotency_key).toMatch(uuidV7Pattern);
    await expect(listSyncQueue()).resolves.toEqual([
      expect.objectContaining({
        attempts: 0,
        body: { title: 'queued', updated_at: nowIso },
        created_at: nowIso,
        entity_id: taskId,
        entity_type: 'task',
        next_attempt_at: nowIso,
        op: 'patch',
      }),
    ]);
  });
});

describe('replay', () => {
  it('replays due queue entries in FIFO order and deletes successful rows', async () => {
    // Given
    await enqueueSyncOp({
      id: 'op-2',
      entity_type: 'task',
      entity_id: taskId,
      op: 'patch',
      body: { title: 'second', updated_at: nowIso },
      idempotency_key: '0196f0a4-8b5a-7000-8000-000000000002',
      attempts: 0,
      next_attempt_at: nowIso,
      created_at: '2026-06-12T16:00:02.000Z',
    });
    await enqueueSyncOp({
      id: 'op-1',
      entity_type: 'task',
      entity_id: taskId,
      op: 'create',
      body: { id: taskId, title: 'first', updated_at: nowIso },
      idempotency_key: '0196f0a4-8b5a-7000-8000-000000000003',
      attempts: 0,
      next_attempt_at: nowIso,
      created_at: '2026-06-12T16:00:01.000Z',
    });
    const transport = vi.fn().mockResolvedValue({ data: serverTask, status: 200 });

    // When
    const result = await replay({
      now: () => new Date(laterIso),
      owner: 'page',
      transport,
    });

    // Then
    expect(result).toEqual({ failed: 0, replayed: 2, retried: 0 });
    expect(transport.mock.calls.map(([entry]) => entry.id)).toEqual(['op-1', 'op-2']);
    await expect(listSyncQueue()).resolves.toEqual([]);
  });

  it('backs off a 5xx response and keeps the queue row', async () => {
    // Given
    await enqueueSyncOp({
      id: 'op-1',
      entity_type: 'task',
      entity_id: taskId,
      op: 'patch',
      body: { title: 'retry later', updated_at: nowIso },
      idempotency_key: '0196f0a4-8b5a-7000-8000-000000000002',
      attempts: 0,
      next_attempt_at: nowIso,
      created_at: nowIso,
    });

    // When
    const result = await replay({
      now: () => new Date(nowIso),
      owner: 'page',
      transport: vi.fn().mockResolvedValue({ error: 'server unavailable', status: 503 }),
    });

    // Then
    expect(result).toEqual({ failed: 0, replayed: 0, retried: 1 });
    await expect(listSyncQueue()).resolves.toEqual([
      expect.objectContaining({
        attempts: 1,
        id: 'op-1',
        next_attempt_at: '2026-06-12T16:00:02.000Z',
      }),
    ]);
  });

  it('backs off a network error and keeps the queue row', async () => {
    // Given
    await enqueueSyncOp({
      id: 'op-1',
      entity_type: 'task',
      entity_id: taskId,
      op: 'patch',
      body: { title: 'retry after network', updated_at: nowIso },
      idempotency_key: '0196f0a4-8b5a-7000-8000-000000000002',
      attempts: 1,
      next_attempt_at: nowIso,
      created_at: nowIso,
    });

    // When
    const result = await replay({
      now: () => new Date(nowIso),
      owner: 'page',
      transport: vi.fn().mockRejectedValue(new Error('offline')),
    });

    // Then
    expect(result).toEqual({ failed: 0, replayed: 0, retried: 1 });
    await expect(listSyncQueue()).resolves.toEqual([
      expect.objectContaining({
        attempts: 2,
        id: 'op-1',
        next_attempt_at: '2026-06-12T16:00:04.000Z',
      }),
    ]);
  });
});
