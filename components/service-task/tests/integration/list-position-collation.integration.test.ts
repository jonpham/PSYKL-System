import { beforeEach, describe, expect, it } from 'vitest';

import { createTestApp, type TestApp } from './task.integration-support.js';

/**
 * Behavior enforced by:
 * components/service-task/drizzle/migrations/0004_nebulous_karen_page.sql  (COLLATE "C" on lists.position)
 */
describe('list position collation', () => {
  let app: TestApp;

  beforeEach(async () => {
    app = await createTestApp();
  });

  it('orders positions the same way JavaScript does', async () => {
    // Given keys whose locale-collated order differs from their byte order
    const keys = ['a0', 'A0', 'a0V', 'Z', 'a1', '_0'];
    for (const [index, position] of keys.entries()) {
      await app
        .post('/lists')
        .send({
          id: `018f0000-0000-7000-8000-00000000000${String(index)}`,
          title: position,
          position,
          updated_at: '2026-08-18T10:00:00.000Z',
        })
        .expect(201);
    }

    // When the server returns them ordered by position
    const response = await app.get('/lists?order=position').expect(200);
    const serverOrder = (response.body as { position: string }[]).map((row) => row.position);

    // Then that order matches JavaScript's own string sort exactly
    expect(serverOrder).toEqual([...keys].sort());
  });
});
