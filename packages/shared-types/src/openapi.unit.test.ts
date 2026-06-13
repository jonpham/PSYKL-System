import { describe, expect, it } from 'vitest';

import { buildOpenApiDocument } from './openapi';

describe('buildOpenApiDocument', () => {
  it('produces an OpenAPI 3.1 document with /tasks paths and Task schema', () => {
    const doc = buildOpenApiDocument();
    expect(doc.openapi).toBe('3.1.0');
    expect(doc.paths?.['/tasks']?.post).toBeDefined();
    expect(doc.paths?.['/tasks']?.get).toBeDefined();
    expect(doc.paths?.['/tasks/{id}']?.patch).toBeDefined();
    expect(doc.paths?.['/tasks/{id}']?.delete).toBeDefined();
    expect(doc.components?.schemas?.Task).toBeDefined();
    expect(doc.components?.schemas?.TaskInput).toBeDefined();
    expect(doc.components?.schemas?.TaskPatchInput).toBeDefined();
    expect(doc.components?.schemas?.TaskDeleteInput).toBeDefined();
  });

  it('declares X-User-Id header as required on every endpoint', () => {
    const doc = buildOpenApiDocument();
    const postParams = doc.paths?.['/tasks']?.post?.parameters ?? [];
    const getParams = doc.paths?.['/tasks']?.get?.parameters ?? [];
    const patchParams = doc.paths?.['/tasks/{id}']?.patch?.parameters ?? [];
    const deleteParams = doc.paths?.['/tasks/{id}']?.delete?.parameters ?? [];
    const findUserId = (params: typeof postParams) => params.find((parameter) => parameter.name === 'X-User-Id');
    expect(findUserId(postParams)).toMatchObject({ required: true });
    expect(findUserId(getParams)).toMatchObject({ required: true });
    expect(findUserId(patchParams)).toMatchObject({ required: true });
    expect(findUserId(deleteParams)).toMatchObject({ required: true });
  });

  it('declares Idempotency-Key header as required only on mutating endpoints', () => {
    const doc = buildOpenApiDocument();
    const postParams = doc.paths?.['/tasks']?.post?.parameters ?? [];
    const getParams = doc.paths?.['/tasks']?.get?.parameters ?? [];
    const patchParams = doc.paths?.['/tasks/{id}']?.patch?.parameters ?? [];
    const deleteParams = doc.paths?.['/tasks/{id}']?.delete?.parameters ?? [];
    const findIdempotencyKey = (params: typeof postParams) =>
      params.find((parameter) => parameter.name === 'Idempotency-Key');

    expect(findIdempotencyKey(postParams)).toMatchObject({ required: true });
    expect(findIdempotencyKey(patchParams)).toMatchObject({ required: true });
    expect(findIdempotencyKey(deleteParams)).toMatchObject({ required: true });
    expect(findIdempotencyKey(getParams)).toBeUndefined();
  });

  it('declares Idempotency-Key as UUID v7 on mutating endpoints', () => {
    const doc = buildOpenApiDocument();
    const postParams = doc.paths?.['/tasks']?.post?.parameters ?? [];
    const idempotencyKey = postParams.find((parameter) => parameter.name === 'Idempotency-Key');

    expect(idempotencyKey).toMatchObject({
      schema: expect.objectContaining({
        pattern: expect.stringContaining('-7'),
      }),
    });
  });

  it('declares PATCH /tasks/{id} path parameter and body schema', () => {
    const doc = buildOpenApiDocument();
    const patchOperation = doc.paths?.['/tasks/{id}']?.patch;
    const patchParams = patchOperation?.parameters ?? [];
    const taskId = patchParams.find((parameter) => parameter.name === 'id');
    const body = patchOperation?.requestBody?.content?.['application/json']?.schema;

    expect(taskId).toMatchObject({ in: 'path', required: true });
    expect(body).toMatchObject({ $ref: '#/components/schemas/TaskPatchInput' });
  });

  it('declares GET /tasks include_deleted query parameter', () => {
    const doc = buildOpenApiDocument();
    const getParams = doc.paths?.['/tasks']?.get?.parameters ?? [];
    const includeDeleted = getParams.find((parameter) => parameter.name === 'include_deleted');

    expect(includeDeleted).toMatchObject({ in: 'query', required: false });
  });

  it('declares DELETE /tasks/{id} path parameter and body schema', () => {
    const doc = buildOpenApiDocument();
    const deleteOperation = doc.paths?.['/tasks/{id}']?.delete;
    const deleteParams = deleteOperation?.parameters ?? [];
    const taskId = deleteParams.find((parameter) => parameter.name === 'id');
    const body = deleteOperation?.requestBody?.content?.['application/json']?.schema;

    expect(taskId).toMatchObject({ in: 'path', required: true });
    expect(body).toMatchObject({ $ref: '#/components/schemas/TaskDeleteInput' });
  });
});
