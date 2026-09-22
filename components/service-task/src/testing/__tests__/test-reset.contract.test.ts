import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import { AppModule } from '../../app.module.js';
import { UserIdGuard } from '../../auth/user-id.guard.js';
import { TEST_RESET_FLAG } from '../test-reset.controller.js';

const caller = 'reset-contract-user';

describe('POST /test/reset', () => {
  let app: INestApplication;

  beforeAll(async () => {
    delete process.env.PGLITE_DATA_DIR;
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    app.useGlobalGuards(new UserIdGuard());
    await app.init();
  });

  afterEach(() => {
    delete process.env[TEST_RESET_FLAG];
  });

  afterAll(async () => {
    await app.close();
  });

  /**
   * Behavior enforced by:
   * components/service-task/src/testing/test-reset.controller.ts
   */
  it('is not there at all unless the environment opts in', async () => {
    // Given a service started without the test-only flag
    delete process.env[TEST_RESET_FLAG];

    // When / Then — indistinguishable from a route that was never registered
    await request(app.getHttpServer()).post('/test/reset').set('X-User-Id', caller).expect(404);
  });

  it('leaves no tasks or lists behind for any user', async () => {
    // Given two different users with data on the server
    process.env[TEST_RESET_FLAG] = 'enabled';
    await seedList(app, 'first-user', validId('001'));
    await seedTask(app, 'second-user', validId('002'), validId('012'));

    // When the suite resets the server between tests
    await request(app.getHttpServer()).post('/test/reset').set('X-User-Id', caller).expect(200);

    // Then neither user's rows survive — isolation is not scoped to one caller
    await expectEmpty(app, 'first-user');
    await expectEmpty(app, 'second-user');
  });

  it('forgets replayed idempotency keys so a reused key is a fresh write', async () => {
    // Given a task written under a key, then a reset. Task writes are the
    // idempotency-protected ones (idempotency.interceptor.ts).
    process.env[TEST_RESET_FLAG] = 'enabled';
    const taskId = validId('003');
    const key = validId('013');
    await seedTask(app, 'third-user', taskId, key);
    await request(app.getHttpServer()).post('/test/reset').set('X-User-Id', caller).expect(200);

    // When the same key is used again after the reset
    await seedTask(app, 'third-user', taskId, key);

    // Then the write lands, rather than replaying a cached response describing
    // a row that the reset removed
    const response = await request(app.getHttpServer()).get('/tasks').set('X-User-Id', 'third-user').expect(200);
    expect(response.body).toHaveLength(1);
  });
});

async function seedList(app: INestApplication, ownerId: string, listId: string): Promise<void> {
  await request(app.getHttpServer())
    .post('/lists')
    .set('X-User-Id', ownerId)
    .send({ id: listId, position: 'a0', title: 'Groceries', updated_at: '2026-09-22T00:00:00.000Z' })
    .expect(201);
}

async function seedTask(app: INestApplication, ownerId: string, taskId: string, key: string): Promise<void> {
  await request(app.getHttpServer())
    .post('/tasks')
    .set('X-User-Id', ownerId)
    .set('Idempotency-Key', key)
    .send({ id: taskId, title: 'wash the car', updated_at: '2026-09-22T00:00:00.000Z' })
    .expect(201);
}

async function expectEmpty(app: INestApplication, ownerId: string): Promise<void> {
  const tasks = await request(app.getHttpServer()).get('/tasks').set('X-User-Id', ownerId).expect(200);
  const lists = await request(app.getHttpServer()).get('/lists').set('X-User-Id', ownerId).expect(200);
  expect(tasks.body).toEqual([]);
  expect(lists.body).toEqual([]);
}

function validId(suffix: string): string {
  return `0199aaaa-0000-7000-8000-000000000${suffix}`;
}
