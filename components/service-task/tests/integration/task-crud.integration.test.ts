import { PGlite } from '@electric-sql/pglite';
import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/pglite';
import { migrate } from 'drizzle-orm/pglite/migrator';
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
    const updatedAt = new Date('2026-05-20T12:00:00.000Z');
    await db.insert(schema.tasks).values({
      id,
      userId: 'local',
      title: 'integration test task',
      updatedAt,
    });

    const rows = await db.select().from(schema.tasks).where(eq(schema.tasks.id, id));
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      id,
      userId: 'local',
      title: 'integration test task',
    });
    expect(rows[0]?.createdAt).toBeInstanceOf(Date);
    expect(rows[0]?.updatedAt).toEqual(updatedAt);
    expect(rows[0]?.serverUpdatedAt).toBeInstanceOf(Date);
    expect(rows[0]?.completedAt).toBeNull();
    expect(rows[0]?.deletedAt).toBeNull();
  });

  it('lists Tasks scoped to a user_id', async () => {
    const updatedAt = new Date('2026-05-20T12:00:00.000Z');
    await db.insert(schema.tasks).values([
      { id: uuidv7(), userId: 'alice', title: 'alice 1', updatedAt },
      { id: uuidv7(), userId: 'alice', title: 'alice 2', updatedAt },
      { id: uuidv7(), userId: 'bob', title: 'bob 1', updatedAt },
    ]);

    const aliceRows = await db.select().from(schema.tasks).where(eq(schema.tasks.userId, 'alice'));
    const aliceTitles = aliceRows.map((row) => row.title).sort();
    expect(aliceTitles).toEqual(expect.arrayContaining(['alice 1', 'alice 2']));
    expect(aliceTitles).not.toContain('bob 1');
  });

  it('applies the timestamptz default now() when no createdAt is supplied', async () => {
    const id = uuidv7();
    const updatedAt = new Date('2026-05-20T12:00:00.000Z');
    const before = new Date();
    await db.insert(schema.tasks).values({ id, userId: 'local', title: 'default ts', updatedAt });
    const [row] = await db.select().from(schema.tasks).where(eq(schema.tasks.id, id));
    const after = new Date();

    expect(row?.createdAt.getTime()).toBeGreaterThanOrEqual(before.getTime() - 1000);
    expect(row?.createdAt.getTime()).toBeLessThanOrEqual(after.getTime() + 1000);
  });

  it('migrates an M1-shape tasks table to the M2 task schema with backfilled timestamps', async () => {
    const pglite = new PGlite();
    await pglite.waitReady;
    await pglite.exec(`
      CREATE TABLE IF NOT EXISTS "tasks" (
        "id" text PRIMARY KEY NOT NULL,
        "user_id" text NOT NULL,
        "title" text NOT NULL,
        "created_at" timestamp with time zone DEFAULT now() NOT NULL
      );
    `);

    const id = uuidv7();
    const createdAt = '2026-05-20T12:00:00.000Z';
    await pglite.query(`INSERT INTO "tasks" ("id", "user_id", "title", "created_at") VALUES ($1, $2, $3, $4);`, [
      id,
      'local',
      'm1 row',
      createdAt,
    ]);

    const migratedDb = drizzle(pglite, { schema });
    await migrate(migratedDb, { migrationsFolder: './drizzle/migrations' });

    const [row] = await migratedDb.select().from(schema.tasks).where(eq(schema.tasks.id, id));
    expect(row).toMatchObject({
      id,
      userId: 'local',
      title: 'm1 row',
    });
    expect(row?.createdAt.toISOString()).toBe(createdAt);
    expect(row?.updatedAt?.toISOString()).toBe(createdAt);
    expect(row?.serverUpdatedAt).toBeInstanceOf(Date);
    expect(row?.completedAt).toBeNull();
    expect(row?.deletedAt).toBeNull();
  });
});
