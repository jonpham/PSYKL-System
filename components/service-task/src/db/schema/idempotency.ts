import { integer, jsonb, pgTable, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core';

export const idempotency = pgTable(
  'idempotency',
  {
    userId: text('user_id').notNull(),
    idempotencyKey: text('idempotency_key').notNull(),
    requestHash: text('request_hash').notNull(),
    statusCode: integer('status_code'),
    responseBody: jsonb('response_body').$type<unknown>(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    userKeyUnique: uniqueIndex('idempotency_user_key_unique').on(table.userId, table.idempotencyKey),
  }),
);

export type IdempotencyRow = typeof idempotency.$inferSelect;
export type IdempotencyInsert = typeof idempotency.$inferInsert;
