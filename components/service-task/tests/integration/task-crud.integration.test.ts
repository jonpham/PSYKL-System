import { eq } from 'drizzle-orm';
import { v7 as uuidv7 } from 'uuid';
import { beforeAll, describe, expect, it } from 'vitest';
import { createDb, schema, type Db } from '../../src/db/index.js';

describe('Drizzle + pglite Task CRUD', () => {
  let db: Db;

  beforeAll(async () => {
    delete process.env.PGLITE_DATA_DIR;
    db = await createDb();
  });

  it('inserts a Task and reads it back', async () => {
    const id = uuidv7();
    await db.insert(schema.tasks).values({
      id,
      userId: 'local',
      title: 'integration test task',
    });

    const rows = await db.select().from(schema.tasks).where(eq(schema.tasks.id, id));
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      id,
      userId: 'local',
      title: 'integration test task',
    });
    expect(rows[0]?.createdAt).toBeInstanceOf(Date);
  });

  it('lists Tasks scoped to a user_id', async () => {
    await db.insert(schema.tasks).values([
      { id: uuidv7(), userId: 'alice', title: 'alice 1' },
      { id: uuidv7(), userId: 'alice', title: 'alice 2' },
      { id: uuidv7(), userId: 'bob', title: 'bob 1' },
    ]);

    const aliceRows = await db.select().from(schema.tasks).where(eq(schema.tasks.userId, 'alice'));
    const aliceTitles = aliceRows.map((row) => row.title).sort();
    expect(aliceTitles).toEqual(expect.arrayContaining(['alice 1', 'alice 2']));
    expect(aliceTitles).not.toContain('bob 1');
  });

  it('applies the timestamptz default now() when no createdAt is supplied', async () => {
    const id = uuidv7();
    const before = new Date();
    await db.insert(schema.tasks).values({ id, userId: 'local', title: 'default ts' });
    const [row] = await db.select().from(schema.tasks).where(eq(schema.tasks.id, id));
    const after = new Date();

    expect(row?.createdAt.getTime()).toBeGreaterThanOrEqual(before.getTime() - 1000);
    expect(row?.createdAt.getTime()).toBeLessThanOrEqual(after.getTime() + 1000);
  });
});
