import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { afterAll, beforeAll, describe, it } from 'vitest';

import { AppModule } from '../../app.module.js';
import { UserIdGuard } from '../user-id.guard.js';

describe('UserIdGuard (Component-layer contract)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    delete process.env.PGLITE_DATA_DIR;
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    app.useGlobalGuards(new UserIdGuard());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  /**
   * Behavior enforced by:
   * components/service-task/src/auth/user-id.guard.ts
   */
  describe('X-User-Id header', () => {
    it('rejects POST /tasks when the header is missing', async () => {
      // Given
      const requestWithoutUserId = request(app.getHttpServer()).post('/tasks').send({ title: 'x' });

      // When / Then
      await requestWithoutUserId.expect(401);
    });

    it('rejects GET /tasks when the header is missing', async () => {
      // Given
      const requestWithoutUserId = request(app.getHttpServer()).get('/tasks');

      // When / Then
      await requestWithoutUserId.expect(401);
    });

    it('rejects PATCH /tasks/:id when the header is missing', async () => {
      // Given
      const requestWithoutUserId = request(app.getHttpServer())
        .patch('/tasks/0193e1c0-1234-7000-8000-000000000000')
        .send({ title: 'x', updated_at: '2026-05-20T12:00:00.000Z' });

      // When / Then
      await requestWithoutUserId.expect(401);
    });

    it('rejects POST /tasks when the header is empty', async () => {
      // Given
      const emptyUserId = '';

      // When / Then
      await request(app.getHttpServer()).post('/tasks').set('X-User-Id', emptyUserId).send({ title: 'x' }).expect(403);
    });

    it('rejects POST /tasks when the header is whitespace-only', async () => {
      // Given
      const whitespaceUserId = '   ';

      // When / Then
      await request(app.getHttpServer())
        .post('/tasks')
        .set('X-User-Id', whitespaceUserId)
        .send({ title: 'x' })
        .expect(403);
    });
  });
});
