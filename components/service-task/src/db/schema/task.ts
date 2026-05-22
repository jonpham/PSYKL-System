import { pgTable, text, timestamp } from 'drizzle-orm/pg-core';

/**
 * PSYKL Task table.
 *
 * Honors DESIGN.md:
 *   - Decision #19: id is text (UUID v7 generated app-side in TaskService).
 *   - Decision #20: created_at is timestamptz with DB default now().
 *   - Decision #31: text column type (not uuid) for type-portability + no pgcrypto.
 *   - Premise 7: user_id on every row; service guard enforces ownership.
 */
export const tasks = pgTable('tasks', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  title: text('title').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export type TaskRow = typeof tasks.$inferSelect;
export type TaskInsert = typeof tasks.$inferInsert;
