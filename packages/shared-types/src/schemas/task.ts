import { z } from 'zod';

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
    id: z.string().uuid().describe('UUID v7, app-generated in TaskService'),
    user_id: z.string().min(1).describe('Owner; "local" in M1/M2, real auth in M4+'),
    title: z.string().min(1).max(200).describe('User-visible task title'),
    created_at: z.string().datetime({ offset: true }).describe('ISO 8601 timestamp from the database (timestamptz)'),
  })
  .strict();

export type Task = z.infer<typeof TaskSchema>;

/**
 * Request body shape for POST /tasks. The client sends only the title;
 * id is generated server-side (UUID v7), user_id comes from the X-User-Id header
 * via the global UserIdGuard, created_at comes from the database default.
 */
export const TaskInputSchema = z
  .object({
    title: z.string().min(1).max(200),
  })
  .strict();

export type TaskInput = z.infer<typeof TaskInputSchema>;

/**
 * Response shape for POST /tasks and the individual elements of GET /tasks.
 * Identical to TaskSchema today; kept as a separate name so future
 * server-side derived fields can extend the response without breaking the
 * persistence schema.
 */
export const TaskResponseSchema = TaskSchema;

export type TaskResponse = z.infer<typeof TaskResponseSchema>;
