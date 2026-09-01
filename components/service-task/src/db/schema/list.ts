import { pgTable, text, timestamp } from 'drizzle-orm/pg-core';

/**
 * PSYKL List table.
 *
 * NO foreign key from tasks.list_id to lists.id. An offline client can create a
 * Task inside a List before that List has synced, and the server must accept the
 * reference. Integrity is an application concern (orphan sweep, Spec 2).
 * See docs/initiatives/todo-experience/DESIGN.md -> Offline Posture.
 *
 * `position` is a fractional-index key and MUST be created with COLLATE "C" so
 * Postgres byte ordering matches JavaScript string comparison on the client.
 * Drizzle does not emit column collation; the generated migration is hand-edited.
 */
export const lists = pgTable('lists', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  title: text('title').notNull(),
  position: text('position').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull(),
  serverUpdatedAt: timestamp('server_updated_at', { withTimezone: true }).notNull().defaultNow(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
});

export type ListRow = typeof lists.$inferSelect;
export type ListInsert = typeof lists.$inferInsert;
