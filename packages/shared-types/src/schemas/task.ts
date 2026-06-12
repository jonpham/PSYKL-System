import { z } from 'zod';

const uuidV7Pattern = /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const UuidV7Schema = z.string().uuid().regex(uuidV7Pattern, 'Expected UUID v7');
export const TimestampSchema = z.string().datetime({ offset: true });

/**
 * PSYKL Task data-model entity.
 * Stored in service-task's pglite database. Identified by app-generated UUID v7.
 * `user_id` carries ownership (see DESIGN.md Premise 7 + 8).
 *
 * NOTE: this is the PSYKL data-model `Task` entity. The workflow concept "DevTask"
 * (a PR-sized unit of work) is unrelated. See AGENTS.md -> Key Stages.
 */
export const TaskSchema = z
  .object({
    id: UuidV7Schema.describe('UUID v7, client-generated'),
    user_id: z.string().min(1).describe('Owner; "local" in M1/M2, real auth in M4+'),
    title: z.string().min(1).max(200).describe('User-visible task title'),
    created_at: TimestampSchema.describe('ISO 8601 timestamp from the database (timestamptz)'),
    completed_at: TimestampSchema.nullable().describe('Client-supplied completion timestamp; null means not complete'),
    updated_at: TimestampSchema.describe('Client-supplied intent timestamp for Last-Write-Wins comparison'),
    server_updated_at: TimestampSchema.describe('Server-stamped audit timestamp'),
    deleted_at: TimestampSchema.nullable().describe('Client-supplied tombstone timestamp; null means not deleted'),
  })
  .strict();

export type Task = z.infer<typeof TaskSchema>;

/**
 * Request body shape for POST /tasks.
 * id is client-generated UUID v7 so offline-created Tasks have stable identity.
 * user_id comes from the X-User-Id header via the global UserIdGuard.
 * created_at and server_updated_at come from the database/service.
 */
export const TaskInputSchema = z
  .object({
    id: UuidV7Schema,
    title: z.string().min(1).max(200),
    updated_at: TimestampSchema,
  })
  .strict();

export type TaskInput = z.infer<typeof TaskInputSchema>;

export const TaskPatchInputSchema = z
  .object({
    title: z.string().min(1).max(200).optional(),
    completed_at: TimestampSchema.nullable().optional(),
    updated_at: TimestampSchema,
  })
  .strict()
  .refine((input) => input.title !== undefined || input.completed_at !== undefined, {
    message: 'At least one patch field is required',
  });

export type TaskPatchInput = z.infer<typeof TaskPatchInputSchema>;

export const TaskDeleteInputSchema = z
  .object({
    deleted_at: TimestampSchema,
    updated_at: TimestampSchema,
  })
  .strict()
  .refine((input) => input.deleted_at === input.updated_at, {
    message: 'deleted_at must equal updated_at',
    path: ['deleted_at'],
  });

export type TaskDeleteInput = z.infer<typeof TaskDeleteInputSchema>;

/**
 * Response shape for POST /tasks and the individual elements of GET /tasks.
 * Identical to TaskSchema today; kept as a separate name so future
 * server-side derived fields can extend the response without breaking the
 * persistence schema.
 */
export const TaskResponseSchema = TaskSchema;

export type TaskResponse = z.infer<typeof TaskResponseSchema>;
