import { beforeEach, describe, expect, it } from 'vitest';

import { createTestApp, type TestApp } from './task.integration-support.js';

/**
 * The absence of a foreign key is deliberate. An offline client can create a Task
 * inside a List before that List has synced. See DESIGN.md -> Offline Posture.
 */
describe('task list reference', () => {
  let app: TestApp;

  beforeEach(async () => {
    app = await createTestApp();
  });

  it('accepts a task referencing a list the server has never seen', async () => {
    // Given a list id that was minted on a client and has not synced yet
    const unseenListId = '018f0000-0000-7000-8000-0000000000ff';

    // When a task arrives referencing it
    const response = await app
      .post('/tasks')
      .set('Idempotency-Key', '018f0000-0000-7000-8000-0000000000aa')
      .send({
        id: '018f0000-0000-7000-8000-000000000001',
        title: 'Milk',
        list_id: unseenListId,
        updated_at: '2026-08-18T10:00:00.000Z',
      })
      .expect(201);

    // Then it is stored with the reference intact rather than rejected
    expect(response.body.list_id).toBe(unseenListId);
  });
});
