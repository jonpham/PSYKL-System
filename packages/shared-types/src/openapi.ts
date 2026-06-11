import { extendZodWithOpenApi, OpenAPIRegistry, OpenApiGeneratorV31 } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';
import {
  TaskDeleteInputSchema,
  TaskInputSchema,
  TaskPatchInputSchema,
  TaskResponseSchema,
  UuidV7Schema,
} from './schemas/task.js';

extendZodWithOpenApi(z);

/**
 * Build the OpenAPI 3.1 document for service-task.
 * service-task runs this at build time and writes the result to openapi.json.
 *
 * Adding a new schema:
 *   1. Define it in src/schemas/.
 *   2. Register it here via registry.register(...).
 *   3. Register any paths that use it via registry.registerPath(...).
 *
 * Routes are defined in this builder so the spec is the single source of truth
 * for the public HTTP Application Programming Interface shape.
 */
export function buildOpenApiDocument(): ReturnType<OpenApiGeneratorV31['generateDocument']> {
  const registry = new OpenAPIRegistry();

  const taskInput = registry.register('TaskInput', TaskInputSchema);
  const taskPatchInput = registry.register('TaskPatchInput', TaskPatchInputSchema);
  const taskDeleteInput = registry.register('TaskDeleteInput', TaskDeleteInputSchema);
  const taskResponse = registry.register('Task', TaskResponseSchema);
  const taskIdParam = z.object({
    id: UuidV7Schema.openapi({
      example: '018fe3f0-7f1a-7b52-8f33-4f4a03a8b8f9',
    }),
  });
  const userIdHeader = z.object({
    'X-User-Id': z.string().openapi({
      param: {
        name: 'X-User-Id',
        in: 'header',
      },
    }),
  });
  const mutatingHeaders = userIdHeader.extend({
    'Idempotency-Key': z
      .string()
      .min(1)
      .openapi({
        param: {
          name: 'Idempotency-Key',
          in: 'header',
        },
      }),
  });
  const listTasksQuery = z.object({
    include_deleted: z
      .enum(['0', '1'])
      .optional()
      .openapi({
        param: {
          name: 'include_deleted',
          in: 'query',
        },
        description: 'Set to 1 to include tombstoned Tasks. Omit or set 0 to exclude tombstones.',
      }),
  });

  registry.registerPath({
    method: 'post',
    path: '/tasks',
    summary: 'Create a Task',
    request: {
      headers: mutatingHeaders,
      body: { content: { 'application/json': { schema: taskInput } } },
    },
    responses: {
      201: { description: 'Created', content: { 'application/json': { schema: taskResponse } } },
      400: { description: 'Bad request - body fails TaskInput validation' },
      401: { description: 'Missing X-User-Id header' },
      403: { description: 'Malformed X-User-Id header' },
      409: { description: 'Same Idempotency-Key was used with a different request body' },
    },
  });

  registry.registerPath({
    method: 'get',
    path: '/tasks',
    summary: 'List Tasks for the current user',
    request: {
      headers: userIdHeader,
      query: listTasksQuery,
    },
    responses: {
      200: {
        description: 'OK',
        content: { 'application/json': { schema: z.array(taskResponse) } },
      },
      401: { description: 'Missing X-User-Id header' },
      403: { description: 'Malformed X-User-Id header' },
    },
  });

  registry.registerPath({
    method: 'patch',
    path: '/tasks/{id}',
    summary: 'Patch a Task with Last-Write-Wins reconciliation',
    request: {
      params: taskIdParam,
      headers: mutatingHeaders,
      body: { content: { 'application/json': { schema: taskPatchInput } } },
    },
    responses: {
      200: { description: 'OK', content: { 'application/json': { schema: taskResponse } } },
      400: { description: 'Bad request - body fails TaskPatchInput validation' },
      401: { description: 'Missing X-User-Id header' },
      403: { description: 'Malformed X-User-Id header' },
      404: { description: 'Task not found for current user' },
      409: { description: 'Same Idempotency-Key was used with a different request body' },
    },
  });

  registry.registerPath({
    method: 'delete',
    path: '/tasks/{id}',
    summary: 'Soft delete a Task with a tombstone',
    request: {
      params: taskIdParam,
      headers: mutatingHeaders,
      body: { content: { 'application/json': { schema: taskDeleteInput } } },
    },
    responses: {
      200: { description: 'OK', content: { 'application/json': { schema: taskResponse } } },
      400: { description: 'Bad request - body fails TaskDeleteInput validation' },
      401: { description: 'Missing X-User-Id header' },
      403: { description: 'Malformed X-User-Id header' },
      404: { description: 'Task not found for current user' },
      409: { description: 'Same Idempotency-Key was used with a different request body' },
    },
  });

  const generator = new OpenApiGeneratorV31(registry.definitions);
  return generator.generateDocument({
    openapi: '3.1.0',
    info: {
      title: 'PSYKL service-task API',
      version: '0.0.0',
      description: 'PSYKL-System service-task REST API. Generated from Zod schemas.',
    },
    servers: [{ url: 'http://localhost:3000', description: 'Local dev' }],
  });
}
