import { eq } from 'drizzle-orm';
import { v7 as uuidv7 } from 'uuid';
import { beforeAll, describe, expect, it } from 'vitest';

import type { Db } from '../../src/db/index.js';
import { schema } from '../../src/db/index.js';
import { PurgeService } from '../../src/purge/purge.service.js';
import { insertList } from './list.integration-support.js';
import { createIntegrationDb, insertTask, taskService } from './task.integration-support.js';

describe('PurgeService.purgeExpiredTombstones', () => {
  let db: Db;

  beforeAll(async () => {
    db = await createIntegrationDb();
  });

  // Fixed "now" so the 30-day boundary is deterministic instead of drifting
  // with the real wall clock (see recently-deleted-restore.integration.test.ts
  // for why real-Date.now()-relative fixtures are needed elsewhere).
  const now = new Date('2026-06-20T00:00:00.000Z');
  const daysBefore = (days: number) => new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

  it('purges a Task tombstoned 31 days ago, keeps one tombstoned 29 days ago', async () => {
    const purgedId = uuidv7();
    const keptId = uuidv7();
    await insertTask(db, { id: purgedId, title: 'purge me', updatedAt: daysBefore(31), deletedAt: daysBefore(31) });
    await insertTask(db, { id: keptId, title: 'keep me', updatedAt: daysBefore(29), deletedAt: daysBefore(29) });

    // Given
    const purge = new PurgeService(db, () => now);

    // When
    const result = await purge.purgeExpiredTombstones();

    // Then
    expect(result.tasksPurged).toBeGreaterThanOrEqual(1);
    const remaining = await taskService(db).listTasks('local', { includeDeleted: true });
    expect(remaining.map((task) => task.id)).not.toContain(purgedId);
    expect(remaining.map((task) => task.id)).toContain(keptId);
  });

  it('purges a List tombstoned 31 days ago, keeps one tombstoned 29 days ago', async () => {
    const purgedId = uuidv7();
    const keptId = uuidv7();
    await insertList(db, { id: purgedId, title: 'purge me', updatedAt: daysBefore(31), deletedAt: daysBefore(31) });
    await insertList(db, { id: keptId, title: 'keep me', updatedAt: daysBefore(29), deletedAt: daysBefore(29) });

    // Given
    const purge = new PurgeService(db, () => now);

    // When
    const result = await purge.purgeExpiredTombstones();

    // Then — a raw select, not ListService.listDeletedLists, since that method
    // filters against the real Date.now() window, not this test's fixed clock.
    expect(result.listsPurged).toBeGreaterThanOrEqual(1);
    const remainingRows = await db.select().from(schema.lists).where(eq(schema.lists.userId, 'local'));
    const remainingIds = remainingRows.map((row) => row.id);
    expect(remainingIds).toContain(keptId);
    expect(remainingIds).not.toContain(purgedId);
  });

  it('never purges a row restored before the 30-day boundary', async () => {
    const id = uuidv7();
    await insertTask(db, { id, title: 'restored in time', updatedAt: daysBefore(31), deletedAt: daysBefore(31) });
    await taskService(db).restoreTask('local', id, { updated_at: daysBefore(1).toISOString() });

    // Given
    const purge = new PurgeService(db, () => now);

    // When
    await purge.purgeExpiredTombstones();

    // Then
    const rows = await taskService(db).listTasks('local', { includeDeleted: true });
    expect(rows.map((task) => task.id)).toContain(id);
  });
});
