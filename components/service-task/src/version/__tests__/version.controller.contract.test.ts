import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { AppModule } from '../../app.module.js';
import { UserIdGuard } from '../../auth/user-id.guard.js';

describe('GET /version (Component-layer contract)', () => {
  let app: INestApplication;
  const originalGitSha = process.env.GIT_SHA;

  beforeAll(async () => {
    delete process.env.PGLITE_DATA_DIR;
    process.env.GIT_SHA = 'test-sha-123';
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    app.useGlobalGuards(new UserIdGuard());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
    if (originalGitSha === undefined) {
      delete process.env.GIT_SHA;
    } else {
      process.env.GIT_SHA = originalGitSha;
    }
  });

  it('returns the component name and baked build commit', async () => {
    // Given the service was built with GIT_SHA=test-sha-123

    // When
    const response = await request(app.getHttpServer()).get('/version').set('X-User-Id', 'local');

    // Then
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ component: 'service-task', commit: 'test-sha-123' });
  });

  /**
   * Behavior enforced by:
   * components/service-task/src/auth/user-id.guard.ts
   */
  it('rejects the request when the X-User-Id header is missing', async () => {
    // Given a request without the identity header

    // When / Then
    await request(app.getHttpServer()).get('/version').expect(401);
  });
});
