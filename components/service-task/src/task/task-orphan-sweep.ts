import { and, eq, inArray, isNull } from 'drizzle-orm';

import { type Db, schema } from '../db/index.js';

/**
 * A Task whose list_id matches no live List (deleted, or never synced because
 * task.list_id carries no foreign key) is reassigned to the earliest-position
 * live List for this user, and the fix is persisted so it heals without a
 * background job. "Default list" here matches the client's own definition in
 * web_client/src/hooks/useLists.default-list.ts: the earliest-position active
 * list, not a hardcoded well-known id.
 *
 * Used by TaskService.listTasks — split into its own file to keep
 * task.service.ts under the project's max-lines lint rule.
 */
export async function healOrphanedListReferences(
  db: Db,
  userId: string,
  rows: (typeof schema.tasks.$inferSelect)[],
): Promise<(typeof schema.tasks.$inferSelect)[]> {
  const referencedListIds = [...new Set(rows.map((row) => row.listId).filter((id): id is string => id !== null))];
  if (referencedListIds.length === 0) {
    return rows;
  }

  const liveLists = await db
    .select({ id: schema.lists.id })
    .from(schema.lists)
    .where(
      and(eq(schema.lists.userId, userId), isNull(schema.lists.deletedAt), inArray(schema.lists.id, referencedListIds)),
    );
  const liveListIds = new Set(liveLists.map((list) => list.id));
  const orphans = rows.filter((row) => row.listId !== null && !liveListIds.has(row.listId));
  if (orphans.length === 0) {
    return rows;
  }

  const [defaultList] = await db
    .select({ id: schema.lists.id })
    .from(schema.lists)
    .where(and(eq(schema.lists.userId, userId), isNull(schema.lists.deletedAt)))
    .orderBy(schema.lists.position)
    .limit(1);
  if (!defaultList) {
    return rows;
  }

  const orphanIds = orphans.map((row) => row.id);
  await db.update(schema.tasks).set({ listId: defaultList.id }).where(inArray(schema.tasks.id, orphanIds));

  return rows.map((row) => (orphanIds.includes(row.id) ? { ...row, listId: defaultList.id } : row));
}
