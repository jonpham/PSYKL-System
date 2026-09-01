import { z } from 'zod';

import { TimestampSchema, UuidV7Schema } from './task.js';

/**
 * PSYKL List data-model entity.
 * A Task belongs to at most one List via a nullable `list_id` with NO foreign key —
 * the server accepts a reference it has not seen yet, because an offline client can
 * create a Task before its List has synced. See the initiative DESIGN.md -> Offline Posture.
 */
export const ListSchema = z
  .object({
    id: UuidV7Schema.describe('UUID v7, client-generated'),
    user_id: z.string().min(1),
    title: z.string().min(1).max(100),
    position: z
      .string()
      .min(1)
      .max(64)
      .describe('Fractional index key; stored as text COLLATE "C" so Postgres byte order matches JS'),
    created_at: TimestampSchema,
    updated_at: TimestampSchema.describe('Client-supplied intent timestamp for Last-Write-Wins'),
    server_updated_at: TimestampSchema,
    deleted_at: TimestampSchema.nullable(),
  })
  .strict();

export type List = z.infer<typeof ListSchema>;

export const ListInputSchema = z
  .object({
    id: UuidV7Schema,
    title: z.string().min(1).max(100),
    position: z.string().min(1).max(64),
    updated_at: TimestampSchema,
  })
  .strict();

export type ListInput = z.infer<typeof ListInputSchema>;

export const ListPatchInputSchema = z
  .object({
    title: z.string().min(1).max(100).optional(),
    position: z.string().min(1).max(64).optional(),
    updated_at: TimestampSchema,
  })
  .strict()
  .refine((input) => input.title !== undefined || input.position !== undefined, {
    message: 'At least one patch field is required',
  });

export type ListPatchInput = z.infer<typeof ListPatchInputSchema>;

export const ListDeleteInputSchema = z.object({ deleted_at: TimestampSchema }).strict();

export type ListDeleteInput = z.infer<typeof ListDeleteInputSchema>;
