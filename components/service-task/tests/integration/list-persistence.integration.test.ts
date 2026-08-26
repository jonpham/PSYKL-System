import { beforeEach, describe, expect, it } from 'vitest';

import { createTestApp, type TestApp } from './task.integration-support.js';

describe('list persistence', () => {
  let app: TestApp;

  beforeEach(async () => {
    app = await createTestApp();
  });

  it('round-trips a list through create and list', async () => {
    // Given a client-generated list
    const input = {
      id: '018f0000-0000-7000-8000-000000000001',
      title: 'Groceries',
      position: 'a0',
      updated_at: '2026-08-18T10:00:00.000Z',
    };

    // When it is created and read back
    await app.post('/lists').send(input).expect(201);
    const response = await app.get('/lists').expect(200);

    // Then the stored row carries ownership and the server audit stamp
    expect(response.body).toHaveLength(1);
    expect(response.body[0]).toMatchObject({ id: input.id, title: 'Groceries', position: 'a0' });
    expect(response.body[0].user_id).toBe('local');
    expect(response.body[0].server_updated_at).toBeTruthy();
  });

  it('ignores a patch whose updated_at is not newer than the stored row', async () => {
    // Given an existing list updated at 10:00
    const input = {
      id: '018f0000-0000-7000-8000-000000000001',
      title: 'Groceries',
      position: 'a0',
      updated_at: '2026-08-18T10:00:00.000Z',
    };
    await app.post('/lists').send(input).expect(201);

    // When a stale patch from 09:00 arrives
    const response = await app
      .patch(`/lists/${input.id}`)
      .send({ title: 'Stale', updated_at: '2026-08-18T09:00:00.000Z' })
      .expect(200);

    // Then the stored row is returned unchanged, matching TaskService.patchTask
    expect(response.body.title).toBe('Groceries');
    expect(response.body.updated_at).toBe('2026-08-18T10:00:00.000Z');
  });
});
