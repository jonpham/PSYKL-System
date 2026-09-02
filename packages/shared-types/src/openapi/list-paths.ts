import type { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';

import {
  DeletedResponseSchema,
  ListDeleteInputSchema,
  ListInputSchema,
  ListPatchInputSchema,
  ListRestoreInputSchema,
  ListSchema,
} from '../schemas/list.js';
import { idParamSchema, mutatingHeadersSchema, userIdHeaderSchema } from './shared.js';

/** Registers the /lists routes and their component schemas on `registry`. */
export function registerListPaths(registry: OpenAPIRegistry): void {
  const listInput = registry.register('ListInput', ListInputSchema);
  const listPatchInput = registry.register('ListPatchInput', ListPatchInputSchema);
  const listDeleteInput = registry.register('ListDeleteInput', ListDeleteInputSchema);
  const listRestoreInput = registry.register('ListRestoreInput', ListRestoreInputSchema);
  const deletedResponse = registry.register('DeletedResponse', DeletedResponseSchema);
  const listResponse = registry.register('List', ListSchema);
  const listIdParam = idParamSchema('018fe3f0-7f1a-7b52-8f33-4f4a03a8b8fa');
  const userIdHeader = userIdHeaderSchema();
  const mutatingHeaders = mutatingHeadersSchema();

  registry.registerPath({
    method: 'post',
    path: '/lists',
    summary: 'Create a List',
    request: {
      headers: mutatingHeaders,
      body: { content: { 'application/json': { schema: listInput } } },
    },
    responses: {
      201: { description: 'Created', content: { 'application/json': { schema: listResponse } } },
      400: { description: 'Bad request - body fails ListInput validation' },
      401: { description: 'Missing X-User-Id header' },
      403: { description: 'Malformed X-User-Id header' },
      409: { description: 'Same Idempotency-Key was used with a different request body' },
    },
  });

  registry.registerPath({
    method: 'get',
    path: '/lists',
    summary: 'List Lists for the current user',
    request: {
      headers: userIdHeader,
    },
    responses: {
      200: {
        description: 'OK',
        content: { 'application/json': { schema: z.array(listResponse) } },
      },
      401: { description: 'Missing X-User-Id header' },
      403: { description: 'Malformed X-User-Id header' },
    },
  });

  registry.registerPath({
    method: 'patch',
    path: '/lists/{id}',
    summary: 'Patch a List with Last-Write-Wins reconciliation',
    request: {
      params: listIdParam,
      headers: mutatingHeaders,
      body: { content: { 'application/json': { schema: listPatchInput } } },
    },
    responses: {
      200: { description: 'OK', content: { 'application/json': { schema: listResponse } } },
      400: { description: 'Bad request - body fails ListPatchInput validation' },
      401: { description: 'Missing X-User-Id header' },
      403: { description: 'Malformed X-User-Id header' },
      404: { description: 'List not found for current user' },
      409: { description: 'Same Idempotency-Key was used with a different request body' },
    },
  });

  registry.registerPath({
    method: 'delete',
    path: '/lists/{id}',
    summary: 'Soft delete a List with a tombstone',
    request: {
      params: listIdParam,
      headers: mutatingHeaders,
      body: { content: { 'application/json': { schema: listDeleteInput } } },
    },
    responses: {
      200: { description: 'OK', content: { 'application/json': { schema: listResponse } } },
      400: { description: 'Bad request - body fails ListDeleteInput validation' },
      401: { description: 'Missing X-User-Id header' },
      403: { description: 'Malformed X-User-Id header' },
      404: { description: 'List not found for current user' },
      409: { description: 'Same Idempotency-Key was used with a different request body' },
    },
  });

  registry.registerPath({
    method: 'post',
    path: '/lists/{id}/restore',
    summary: 'Restore a soft-deleted List with Last-Write-Wins reconciliation',
    request: {
      params: listIdParam,
      headers: userIdHeader,
      body: { content: { 'application/json': { schema: listRestoreInput } } },
    },
    responses: {
      200: { description: 'OK', content: { 'application/json': { schema: listResponse } } },
      400: { description: 'Bad request - body fails ListRestoreInput validation' },
      401: { description: 'Missing X-User-Id header' },
      403: { description: 'Malformed X-User-Id header' },
      404: { description: 'List not found for current user' },
    },
  });

  registry.registerPath({
    method: 'get',
    path: '/deleted',
    summary: 'List every List and Task tombstone within the 30-day Recently Deleted window',
    request: { headers: userIdHeader },
    responses: {
      200: { description: 'OK', content: { 'application/json': { schema: deletedResponse } } },
      401: { description: 'Missing X-User-Id header' },
      403: { description: 'Malformed X-User-Id header' },
    },
  });
}
