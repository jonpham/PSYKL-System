import { beforeEach, describe, expect, it } from 'vitest';

import { createTestApp, type TestApp } from './task.integration-support.js';

/**
 * Behavior enforced by:
 * components/service-task/src/list/list.service.ts (createList → appendPosition)
 */
describe('server-assigned list position', () => {
  let app: TestApp;
  const id = (suffix: string) => `018f0000-0000-7000-8000-0000000000${suffix}`;
  const create = (suffix: string, extra: Record<string, unknown> = {}) =>
    app
      .post('/lists')
      .send({ id: id(suffix), title: `list ${suffix}`, updated_at: '2026-11-13T10:00:00.000Z', ...extra });

  beforeEach(async () => {
    app = await createTestApp();
  });

  it('gives the first list the first key', async () => {
    // When
    const response = await create('01').expect(201);

    // Then — the key a device would have picked
    expect(response.body.position).toBe('a0');
  });

  it('appends after the last list', async () => {
    // Given
    await create('01', { position: 'a0' }).expect(201);
    await create('02', { position: 'a1' }).expect(201);

    // When
    const response = await create('03').expect(201);

    // Then
    expect(response.body.position > 'a1').toBe(true);
    const order = (await app.get('/lists').expect(200)).body.map((list: { id: string }) => list.id);
    expect(order).toEqual([id('01'), id('02'), id('03')]);
  });

  it('appends after a deleted list too', async () => {
    // Given the last list is in Recently Deleted
    await create('01', { position: 'a0' }).expect(201);
    await create('02', { position: 'a5' }).expect(201);
    await app
      .delete(`/lists/${id('02')}`)
      .send({ deleted_at: '2026-11-13T11:00:00.000Z' })
      .expect(200);

    // When
    const response = await create('03').expect(201);

    // Then restoring the deleted one can never collide with it
    expect(response.body.position > 'a5').toBe(true);
  });

  it("ignores another user's lists", async () => {
    // Given
    await app
      .post('/lists')
      .set('X-User-Id', 'someone-else')
      .send({ id: id('09'), title: 'theirs', position: 'a9', updated_at: '2026-11-13T10:00:00.000Z' })
      .expect(201);

    // When
    const response = await create('01').expect(201);

    // Then
    expect(response.body.position).toBe('a0');
  });

  it('gives two simultaneous creates distinct positions', async () => {
    // Given
    await create('01', { position: 'a0' }).expect(201);

    // When
    const [first, second] = await Promise.all([create('02'), create('03')]);

    // Then
    expect([first.status, second.status]).toEqual([201, 201]);
    const positions: string[] = [first.body.position, second.body.position];
    expect(new Set(positions).size).toBe(2);
    expect(positions.every((position) => position > 'a0')).toBe(true);
  });

  it('keeps a position the client sent, verbatim', async () => {
    // When — the sync path's provisional position
    const response = await create('01', { position: 'a0V' }).expect(201);

    // Then
    expect(response.body.position).toBe('a0V');
  });

  it('returns the stored list when the same id is created again', async () => {
    // Given
    const created = await create('01').expect(201);
    await create('02', { position: 'a5' }).expect(201);

    // When a device re-sends the first create, still without a position
    const replay = await create('01').expect(201);

    // Then the stored row comes back, not a new position after a5
    expect(replay.body.position).toBe(created.body.position);
  });
});
