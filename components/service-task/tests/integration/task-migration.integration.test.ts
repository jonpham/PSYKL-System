import { PGlite } from '@electric-sql/pglite';
import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/pglite';
import { migrate } from 'drizzle-orm/pglite/migrator';
import { v7 as uuidv7 } from 'uuid';
import { describe, expect, it } from 'vitest';

import { schema } from '../../src/db/index.js';

describe('Drizzle + pglite Task migrations', () => {
  /**
   * Migration files live under:
   * components/service-task/drizzle/migrations/
   */
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

    // Given
    const id = uuidv7();
    const createdAt = '2026-05-20T12:00:00.000Z';
    await pglite.query(`INSERT INTO "tasks" ("id", "user_id", "title", "created_at") VALUES ($1, $2, $3, $4);`, [
      id,
      'local',
      'm1 row',
      createdAt,
    ]);

    // When
    const migratedDb = drizzle(pglite, { schema });
    await migrate(migratedDb, { migrationsFolder: './drizzle/migrations' });
    const [row] = await migratedDb.select().from(schema.tasks).where(eq(schema.tasks.id, id));

    // Then
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
