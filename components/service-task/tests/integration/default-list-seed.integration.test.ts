import { DEFAULT_LIST_ID } from '@psykl/shared-types';
import { eq } from 'drizzle-orm';
import { beforeEach, describe, expect, it } from 'vitest';

import { type Db, schema } from '../../src/db/index.js';
import { seedDefaultList, SINGLE_USER_ID } from '../../src/list/default-list.seed.js';
import { insertList, listService } from './list.integration-support.js';
import { createIntegrationDb } from './task.integration-support.js';

/**
 * Behavior enforced by:
 * components/service-task/src/list/default-list.seed.ts (Decisions 15, 16)
 */
describe('default list seed', () => {
  let db: Db;
  const rowsFor = (userId: string) =>
    db.select().from(schema.lists).where(eq(schema.lists.userId, userId)).orderBy(schema.lists.position);

  beforeEach(async () => {
    db = await createIntegrationDb();
  });

  it('creates the default list on a fresh database', async () => {
    // When
    await seedDefaultList(db);

    // Then
    const rows = await rowsFor(SINGLE_USER_ID);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ id: DEFAULT_LIST_ID, title: 'Tasks', position: 'a0', deletedAt: null });
    expect(rows[0]!.updatedAt.toISOString()).toBe('1970-01-01T00:00:00.000Z');
  });

  it('seeds once however many times the service starts', async () => {
    // When
    await seedDefaultList(db);
    await seedDefaultList(db);

    // Then
    expect(await rowsFor(SINGLE_USER_ID)).toHaveLength(1);
  });

  it('restores a default list deleted before Decision 16', async () => {
    // Given
    await seedDefaultList(db);
    await db
      .update(schema.lists)
      .set({ deletedAt: new Date('2026-11-01T00:00:00.000Z') })
      .where(eq(schema.lists.id, DEFAULT_LIST_ID));

    // When the service restarts
    await seedDefaultList(db);

    // Then it is back, with an edit time newer than the old delete
    const [row] = await rowsFor(SINGLE_USER_ID);
    expect(row).toMatchObject({ id: DEFAULT_LIST_ID, deletedAt: null });
    expect(row!.updatedAt.getTime()).toBeGreaterThan(new Date('2026-11-01T00:00:00.000Z').getTime());
  });

  it("recreates a purged default list ahead of the user's lists", async () => {
    // Given the default list was purged and another list holds a0
    await insertList(db, { title: 'Groceries', position: 'a0', updatedAt: new Date('2026-11-01T00:00:00.000Z') });

    // When
    await seedDefaultList(db);

    // Then the default list is first, on its own key
    const rows = await rowsFor(SINGLE_USER_ID);
    expect(rows.map((row) => row.title)).toEqual(['Tasks', 'Groceries']);
    expect(rows[0]!.position < 'a0').toBe(true);
  });

  it('seeds nothing for any other user', async () => {
    // When
    await seedDefaultList(db);

    // Then
    expect(await rowsFor('someone-else')).toHaveLength(0);
  });

  it("lets a device's own edit of the default list win", async () => {
    // Given
    await seedDefaultList(db);

    // When a device renames it (any real timestamp is newer than the seed)
    const renamed = await listService(db).patchList(SINGLE_USER_ID, DEFAULT_LIST_ID, {
      title: 'Inbox',
      updated_at: '2026-11-13T10:00:00.000Z',
    });

    // Then
    expect(renamed.title).toBe('Inbox');
  });

  it("answers a device's own create of the default list with the seeded row", async () => {
    // Given
    await seedDefaultList(db);

    // When a device that bootstrapped offline syncs its create
    const response = await listService(db).createList(SINGLE_USER_ID, {
      id: DEFAULT_LIST_ID,
      title: 'Tasks',
      position: 'a0',
      updated_at: '2026-11-13T09:00:00.000Z',
    });

    // Then the one shared row, not a second list
    expect(response.id).toBe(DEFAULT_LIST_ID);
    expect(await rowsFor(SINGLE_USER_ID)).toHaveLength(1);
  });
});
