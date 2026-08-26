import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { afterAll, beforeAll, describe, it } from 'vitest';

import { AppModule } from '../../app.module.js';
import { UserIdGuard } from '../../auth/user-id.guard.js';

/**
 * Behavior enforced by:
 * components/service-task/src/auth/user-id.guard.ts
 */
describe('list routes reject requests without a user id', () => {
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

  function requestWithoutUserId(method: 'post' | 'get' | 'patch' | 'delete', path: string) {
    return request(app.getHttpServer())[method](path).send({});
  }

  it.each([
    ['post', '/lists'],
    ['get', '/lists'],
    ['patch', '/lists/018f0000-0000-7000-8000-000000000001'],
    ['delete', '/lists/018f0000-0000-7000-8000-000000000001'],
  ] as const)('%s %s returns 401 with no X-User-Id header', async (method, path) => {
    // When / Then
    await requestWithoutUserId(method, path).expect(401);
  });
});
