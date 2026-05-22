import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { afterAll, beforeAll, describe, it } from 'vitest';
import { AppModule } from '../app.module.js';
import { UserIdGuard } from './user-id.guard.js';

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

  it('rejects POST /tasks with no X-User-Id header (401)', async () => {
    await request(app.getHttpServer()).post('/tasks').send({ title: 'x' }).expect(401);
  });

  it('rejects GET /tasks with no X-User-Id header (401)', async () => {
    await request(app.getHttpServer()).get('/tasks').expect(401);
  });

  it('rejects POST /tasks with empty X-User-Id header (403)', async () => {
    await request(app.getHttpServer()).post('/tasks').set('X-User-Id', '').send({ title: 'x' }).expect(403);
  });

  it('rejects POST /tasks with whitespace-only X-User-Id (403)', async () => {
    await request(app.getHttpServer()).post('/tasks').set('X-User-Id', '   ').send({ title: 'x' }).expect(403);
  });
});
