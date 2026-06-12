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

  async function cacheResponse(idempotencyKey: string, requestHash: string, responseBody: unknown) {
    await service.reserveRequest('local', idempotencyKey, requestHash);
    await service.completeRequest('local', idempotencyKey, requestHash, 201, responseBody);
  }

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
    await cacheResponse('integration-replay', requestHash, responseBody);

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
    await cacheResponse('integration-conflict', firstHash, { title: 'first' });

    // When / Then
    await expect(service.findCachedResponse('local', 'integration-conflict', secondHash)).rejects.toMatchObject({
      status: 409,
    });
  });

  it('does not overwrite an unexpired completed response for the same key', async () => {
    const requestHash = service.hashRequest({ method: 'POST', path: '/tasks', body: { title: 'first write wins' } });
    const firstBody = { title: 'first' };
    const secondBody = { title: 'second' };

    // Given
    await cacheResponse('0193e1c0-5678-7000-8000-000000000060', requestHash, firstBody);

    // When
    await service.completeRequest('local', '0193e1c0-5678-7000-8000-000000000060', requestHash, 201, secondBody);

    // Then
    await expect(
      service.findCachedResponse('local', '0193e1c0-5678-7000-8000-000000000060', requestHash),
    ).resolves.toEqual({
      statusCode: 201,
      responseBody: firstBody,
    });
  });

  it('reserves an in-progress key before a mutation response is saved', async () => {
    const requestHash = service.hashRequest({
      method: 'POST',
      path: '/tasks',
      body: { id: '0193e1c0-1234-7000-8000-000000000061' },
    });

    // Given
    const key = '0193e1c0-5678-7000-8000-000000000061';

    // When
    const first = await service.reserveRequest('local', key, requestHash);
    const second = await service.reserveRequest('local', key, requestHash);
    await service.completeRequest('local', key, requestHash, 201, { id: 'created' });
    const third = await service.reserveRequest('local', key, requestHash);

    // Then
    expect(first).toEqual({ kind: 'reserved' });
    expect(second).toEqual({ kind: 'pending' });
    expect(third).toEqual({
      kind: 'cached',
      cached: { statusCode: 201, responseBody: { id: 'created' } },
    });
  });

  it('treats expired keys as misses so the mutation can apply again', async () => {
    const firstHash = service.hashRequest({ method: 'POST', path: '/tasks', body: { title: 'expired first' } });
    const secondHash = service.hashRequest({ method: 'POST', path: '/tasks', body: { title: 'expired second' } });
    await cacheResponse('integration-expired', firstHash, { title: 'expired first' });

    // Given
    await db
      .update(schema.idempotency)
      .set({ expiresAt: new Date('2026-05-20T11:00:00.000Z') })
      .where(eq(schema.idempotency.idempotencyKey, 'integration-expired'));

    // When / Then
    await expect(service.findCachedResponse('local', 'integration-expired', secondHash)).resolves.toBeNull();
  });
});
