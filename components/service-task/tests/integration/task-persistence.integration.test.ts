import { eq } from 'drizzle-orm';
import { v7 as uuidv7 } from 'uuid';
import { beforeAll, describe, expect, it } from 'vitest';

import { type Db, schema } from '../../src/db/index.js';
import { createIntegrationDb, insertTask } from './task.integration-support.js';

describe('Drizzle + pglite Task persistence', () => {
  let db: Db;

  beforeAll(async () => {
    db = await createIntegrationDb();
  });

  it('inserts a Task and reads it back', async () => {
    const id = uuidv7();
    const updatedAt = new Date('2026-05-20T12:00:00.000Z');

    // Given
    const title = 'integration test task';

    // When
    await insertTask(db, { id, title, updatedAt });
    const rows = await db.select().from(schema.tasks).where(eq(schema.tasks.id, id));

    // Then
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      id,
      userId: 'local',
      title,
    });
    expect(rows[0]?.createdAt).toBeInstanceOf(Date);
    expect(rows[0]?.updatedAt).toEqual(updatedAt);
    expect(rows[0]?.serverUpdatedAt).toBeInstanceOf(Date);
    expect(rows[0]?.completedAt).toBeNull();
    expect(rows[0]?.deletedAt).toBeNull();
  });

  it('lists Tasks scoped to a user_id', async () => {
    const updatedAt = new Date('2026-05-20T12:00:00.000Z');
    await insertTask(db, { userId: 'alice', title: 'alice 1', updatedAt });
    await insertTask(db, { userId: 'alice', title: 'alice 2', updatedAt });
    await insertTask(db, { userId: 'bob', title: 'bob 1', updatedAt });

    // Given
    const currentUserId = 'alice';

    // When
    const rows = await db.select().from(schema.tasks).where(eq(schema.tasks.userId, currentUserId));

    // Then
    const titles = rows.map((row) => row.title).sort();
    expect(titles).toEqual(expect.arrayContaining(['alice 1', 'alice 2']));
    expect(titles).not.toContain('bob 1');
  });

  it('applies the timestamptz default now() when no createdAt is supplied', async () => {
    const id = uuidv7();
    const updatedAt = new Date('2026-05-20T12:00:00.000Z');

    // Given
    const beforeInsert = new Date();

    // When
    await insertTask(db, { id, title: 'default ts', updatedAt });
    const [row] = await db.select().from(schema.tasks).where(eq(schema.tasks.id, id));
    const afterInsert = new Date();

    // Then
    expect(row?.createdAt.getTime()).toBeGreaterThanOrEqual(beforeInsert.getTime() - 1000);
    expect(row?.createdAt.getTime()).toBeLessThanOrEqual(afterInsert.getTime() + 1000);
  });
});
