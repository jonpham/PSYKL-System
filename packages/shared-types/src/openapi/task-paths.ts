import type { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';

import {
  TaskDeleteInputSchema,
  TaskInputSchema,
  TaskPatchInputSchema,
  TaskResponseSchema,
  TaskRestoreInputSchema,
} from '../schemas/task.js';
import { idParamSchema, mutatingHeadersSchema, userIdHeaderSchema } from './shared.js';

/** Registers the /tasks routes and their component schemas on `registry`. */
export function registerTaskPaths(registry: OpenAPIRegistry): void {
  const taskInput = registry.register('TaskInput', TaskInputSchema);
  const taskPatchInput = registry.register('TaskPatchInput', TaskPatchInputSchema);
  const taskDeleteInput = registry.register('TaskDeleteInput', TaskDeleteInputSchema);
  const taskRestoreInput = registry.register('TaskRestoreInput', TaskRestoreInputSchema);
  const taskResponse = registry.register('Task', TaskResponseSchema);
  const taskIdParam = idParamSchema('018fe3f0-7f1a-7b52-8f33-4f4a03a8b8f9');
  const userIdHeader = userIdHeaderSchema();
  const mutatingHeaders = mutatingHeadersSchema();
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

  registry.registerPath({
    method: 'post',
    path: '/tasks/{id}/restore',
    summary: 'Restore a soft-deleted Task with Last-Write-Wins reconciliation',
    request: {
      params: taskIdParam,
      headers: mutatingHeaders,
      body: { content: { 'application/json': { schema: taskRestoreInput } } },
    },
    responses: {
      200: { description: 'OK', content: { 'application/json': { schema: taskResponse } } },
      400: { description: 'Bad request - body fails TaskRestoreInput validation' },
      401: { description: 'Missing X-User-Id header' },
      403: { description: 'Malformed X-User-Id header' },
      404: { description: 'Task not found for current user' },
      409: { description: 'Same Idempotency-Key was used with a different request body' },
    },
  });
}
