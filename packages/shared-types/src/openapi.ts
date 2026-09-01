import { extendZodWithOpenApi, OpenApiGeneratorV31, OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';

import { registerListPaths } from './openapi/list-paths.js';
import { registerTaskPaths } from './openapi/task-paths.js';

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
 * Routes are defined per-entity in src/openapi/*-paths.ts so the spec is the
 * single source of truth for the public HTTP Application Programming
 * Interface shape, while keeping any one file under the max-lines lint rule.
 */
export function buildOpenApiDocument(): ReturnType<OpenApiGeneratorV31['generateDocument']> {
  const registry = new OpenAPIRegistry();

  registerTaskPaths(registry);
  registerListPaths(registry);

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
