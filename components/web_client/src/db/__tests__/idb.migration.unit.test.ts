import { describe, expect, it } from 'vitest';

import { migrateQueueEntryV1ToV2 } from '../idb';

describe('migrateQueueEntryV1ToV2', () => {
  it('maps task_id onto entity_type and entity_id', () => {
    // Given a v1 queue entry keyed by task_id
    const v1 = {
      id: '018f0000-0000-7000-8000-000000000001',
      task_id: '018f0000-0000-7000-8000-000000000002',
      op: 'create' as const,
      body: { title: 'Buy coffee' },
      idempotency_key: '018f0000-0000-7000-8000-000000000003',
      attempts: 0,
      next_attempt_at: '2026-08-18T10:00:00.000Z',
      created_at: '2026-08-18T10:00:00.000Z',
    };

    // When it is migrated
    const v2 = migrateQueueEntryV1ToV2(v1);

    // Then the task reference becomes an entity reference and task_id is gone
    expect(v2).toEqual({
      id: v1.id,
      entity_type: 'task',
      entity_id: v1.task_id,
      op: 'create',
      body: { title: 'Buy coffee' },
      idempotency_key: v1.idempotency_key,
      attempts: 0,
      next_attempt_at: v1.next_attempt_at,
      created_at: v1.created_at,
    });
    expect('task_id' in v2).toBe(false);
  });
});
