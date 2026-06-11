import { describe, expect, it } from 'vitest';
import { buildOpenApiDocument } from './openapi';

describe('buildOpenApiDocument', () => {
  it('produces an OpenAPI 3.1 document with /tasks paths and Task schema', () => {
    const doc = buildOpenApiDocument();
    expect(doc.openapi).toBe('3.1.0');
    expect(doc.paths?.['/tasks']?.post).toBeDefined();
    expect(doc.paths?.['/tasks']?.get).toBeDefined();
    expect(doc.paths?.['/tasks/{id}']?.patch).toBeDefined();
    expect(doc.components?.schemas?.Task).toBeDefined();
    expect(doc.components?.schemas?.TaskInput).toBeDefined();
    expect(doc.components?.schemas?.TaskPatchInput).toBeDefined();
  });

  it('declares X-User-Id header as required on every endpoint', () => {
    const doc = buildOpenApiDocument();
    const postParams = doc.paths?.['/tasks']?.post?.parameters ?? [];
    const getParams = doc.paths?.['/tasks']?.get?.parameters ?? [];
    const patchParams = doc.paths?.['/tasks/{id}']?.patch?.parameters ?? [];
    const findUserId = (params: typeof postParams) => params.find((parameter) => parameter.name === 'X-User-Id');
    expect(findUserId(postParams)).toMatchObject({ required: true });
    expect(findUserId(getParams)).toMatchObject({ required: true });
    expect(findUserId(patchParams)).toMatchObject({ required: true });
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
});
