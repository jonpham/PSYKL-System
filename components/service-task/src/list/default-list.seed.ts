import { DEFAULT_LIST_ID, DEFAULT_LIST_TITLE } from '@psykl/shared-types';
import { eq } from 'drizzle-orm';
import { generateKeyBetween } from 'fractional-indexing';

import { type Db, schema } from '../db/index.js';

/**
 * The only user until multi-tenant-auth (#117): the PWA sends `X-User-Id: local`.
 * Decision 15 moves the seed to user creation once users exist.
 */
const SINGLE_USER_ID = 'local';

/** Epoch, so any edit a device makes to a newly created default list wins Last-Write-Wins. */
const SEEDED_UPDATED_AT = new Date(0);

/**
 * Keeps the default list in place (online-offline-modes Decisions 15, 16):
 * - created, ahead of every other list, when it is missing (a fresh database,
 *   or a database that purged it before Decision 16);
 * - restored when a device deleted it before Decision 16, with a fresh edit
 *   time so the restore wins over the old tombstone.
 */
async function seedDefaultList(db: Db): Promise<void> {
  await db.transaction(async (tx) => {
    const rows = await tx
      .select({ id: schema.lists.id, position: schema.lists.position, deletedAt: schema.lists.deletedAt })
      .from(schema.lists)
      .where(eq(schema.lists.userId, SINGLE_USER_ID))
      .orderBy(schema.lists.position);
    const existing = rows.find((row) => row.id === DEFAULT_LIST_ID);
    if (existing) {
      if (existing.deletedAt !== null) {
        const now = new Date();
        await tx
          .update(schema.lists)
          .set({ deletedAt: null, updatedAt: now, serverUpdatedAt: now })
          .where(eq(schema.lists.id, DEFAULT_LIST_ID));
      }
      return;
    }
    await tx
      .insert(schema.lists)
      .values({
        id: DEFAULT_LIST_ID,
        userId: SINGLE_USER_ID,
        title: DEFAULT_LIST_TITLE,
        position: generateKeyBetween(null, rows[0]?.position ?? null),
        updatedAt: SEEDED_UPDATED_AT,
      })
      // lists.id is a global primary key (#117): never fail start-up over it.
      .onConflictDoNothing({ target: schema.lists.id });
  });
}

export { seedDefaultList, SINGLE_USER_ID };
