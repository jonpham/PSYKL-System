import { afterEach, describe, expect, it, vi } from 'vitest';

import type { Task } from '../../api/client';
import type { SyncQueueEntry } from '../../db/idb.types';
import { emitStaleWriteIfSuperseded } from '../stale-write';

function patchEntry(bodyUpdatedAt: string): SyncQueueEntry {
  return {
    id: 'op-1',
    entity_type: 'task',
    entity_id: 'task-1',
    op: 'patch',
    body: { title: 'mine', updated_at: bodyUpdatedAt },
    idempotency_key: 'key-1',
    attempts: 0,
    next_attempt_at: '2026-06-01T09:00:00.000Z',
    created_at: '2026-06-01T09:00:00.000Z',
  };
}

function serverTask(updatedAt: string): Task {
  return {
    id: 'task-1',
    user_id: 'local',
    title: 'theirs',
    created_at: '2026-06-01T08:00:00.000Z',
    completed_at: null,
    updated_at: updatedAt,
    server_updated_at: '2026-06-01T12:00:00.500Z',
    deleted_at: null,
  };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('emitStaleWriteIfSuperseded', () => {
  it('dispatches sync:stale-write when the server did not echo the sent updated_at', () => {
    // Given a patch whose updated_at the server replaced with its own newer row
    const dispatch = vi.spyOn(globalThis, 'dispatchEvent');

    // When
    emitStaleWriteIfSuperseded(patchEntry('2026-06-01T09:00:00.000Z'), serverTask('2026-06-01T12:00:00.000Z'));

    // Then
    expect(dispatch).toHaveBeenCalledTimes(1);
    const event = dispatch.mock.calls[0]?.[0] as CustomEvent<{ task: Task }>;
    expect(event.type).toBe('sync:stale-write');
    expect(event.detail.task.title).toBe('theirs');
  });

  it('does not dispatch when the server echoed the sent updated_at (our write won)', () => {
    // Given
    const dispatch = vi.spyOn(globalThis, 'dispatchEvent');

    // When
    emitStaleWriteIfSuperseded(patchEntry('2026-06-01T09:00:00.000Z'), serverTask('2026-06-01T09:00:00.000Z'));

    // Then
    expect(dispatch).not.toHaveBeenCalled();
  });

  it('does not dispatch for non-patch ops', () => {
    // Given
    const dispatch = vi.spyOn(globalThis, 'dispatchEvent');
    const deleteEntry: SyncQueueEntry = { ...patchEntry('2026-06-01T09:00:00.000Z'), op: 'delete' };

    // When
    emitStaleWriteIfSuperseded(deleteEntry, serverTask('2026-06-01T12:00:00.000Z'));

    // Then
    expect(dispatch).not.toHaveBeenCalled();
  });
});
