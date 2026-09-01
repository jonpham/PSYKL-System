import { z } from 'zod';

import { UuidV7Schema } from '../schemas/task.js';

/**
 * Shared OpenAPI header/param builders for service-task routes.
 *
 * These are factory functions, not top-level consts, so their `.openapi(...)`
 * calls run only when invoked from `buildOpenApiDocument()` — after
 * `extendZodWithOpenApi(z)` has already run in `openapi.ts`. A top-level
 * const here would evaluate at module-import time, before that extension is
 * registered, and `.openapi()` would not exist yet.
 */
export function userIdHeaderSchema() {
  return z.object({
    'X-User-Id': z.string().openapi({
      param: {
        name: 'X-User-Id',
        in: 'header',
      },
    }),
  });
}

export function mutatingHeadersSchema() {
  return userIdHeaderSchema().extend({
    'Idempotency-Key': UuidV7Schema.openapi({
      param: {
        name: 'Idempotency-Key',
        in: 'header',
      },
    }),
  });
}

export function idParamSchema(example: string) {
  return z.object({
    id: UuidV7Schema.openapi({ example }),
  });
}
