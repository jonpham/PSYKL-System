import { eq } from 'drizzle-orm';
import { beforeAll, describe, expect, it } from 'vitest';
import { createDb, schema, type Db } from '../../src/db/index.js';
import { IdempotencyService } from '../../src/idempotency/idempotency.service.js';

describe('IdempotencyService + pglite', () => {
  let db: Db;
  let service: IdempotencyService;

  beforeAll(async () => {
    delete process.env.PGLITE_DATA_DIR;
    db = await createDb();
    service = new IdempotencyService(db);
  });

  /**
   * Behavior implemented by:
   * components/service-task/src/idempotency/idempotency.service.ts
   */
  it('saves and replays a cached response for the same request hash', async () => {
    const requestHash = service.hashRequest({
      method: 'POST',
      path: '/tasks',
      body: { id: '0193e1c0-1234-7000-8000-000000000040' },
    });

    // Given
    const responseBody = { id: '0193e1c0-1234-7000-8000-000000000040', title: 'cached' };
    await service.saveResponse('local', 'integration-replay', requestHash, 201, responseBody);

    // When / Then
    await expect(service.findCachedResponse('local', 'integration-replay', requestHash)).resolves.toEqual({
      statusCode: 201,
      responseBody,
    });
  });

  it('rejects the same key with a different request hash before expiry', async () => {
    const firstHash = service.hashRequest({ method: 'POST', path: '/tasks', body: { title: 'first' } });

    // Given
    const secondHash = service.hashRequest({ method: 'POST', path: '/tasks', body: { title: 'second' } });
    await service.saveResponse('local', 'integration-conflict', firstHash, 201, { title: 'first' });

    // When / Then
    await expect(service.findCachedResponse('local', 'integration-conflict', secondHash)).rejects.toMatchObject({
      status: 409,
    });
  });

  it('treats expired keys as misses so the mutation can apply again', async () => {
    const firstHash = service.hashRequest({ method: 'POST', path: '/tasks', body: { title: 'expired first' } });
    const secondHash = service.hashRequest({ method: 'POST', path: '/tasks', body: { title: 'expired second' } });
    await service.saveResponse('local', 'integration-expired', firstHash, 201, { title: 'expired first' });

    // Given
    await db
      .update(schema.idempotency)
      .set({ expiresAt: new Date('2026-05-20T11:00:00.000Z') })
      .where(eq(schema.idempotency.idempotencyKey, 'integration-expired'));

    // When / Then
    await expect(service.findCachedResponse('local', 'integration-expired', secondHash)).resolves.toBeNull();
  });
});
