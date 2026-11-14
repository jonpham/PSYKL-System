import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { DEFAULT_LIST_ID } from '@psykl/shared-types';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { prepareApp } from '../app.bootstrap.js';
import { AppModule } from '../app.module.js';

/**
 * Behavior enforced by:
 * components/service-task/src/app.bootstrap.ts (what main.ts runs before listen)
 */
describe('service start-up', () => {
  let app: INestApplication;

  beforeAll(async () => {
    delete process.env.PGLITE_DATA_DIR;
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    await prepareApp(app);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('starts with the default list already on the server', async () => {
    // When
    const response = await request(app.getHttpServer()).get('/lists').set('X-User-Id', 'local').expect(200);

    // Then
    expect(response.body).toEqual([expect.objectContaining({ id: DEFAULT_LIST_ID, title: 'Tasks', position: 'a0' })]);
  });

  it('still rejects a request with no X-User-Id', async () => {
    // When / Then
    await request(app.getHttpServer()).get('/lists').expect(401);
  });
});
