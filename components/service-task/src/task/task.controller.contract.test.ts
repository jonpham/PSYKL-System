import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { UserIdGuard } from '../auth/user-id.guard.js';
import { AppModule } from '../app.module.js';

describe('TaskController contract', () => {
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

  it('POST /tasks with valid body returns 201 and the persisted record', async () => {
    const id = '0193e1c0-1234-7000-8000-000000000000';
    const res = await request(app.getHttpServer())
      .post('/tasks')
      .set('X-User-Id', 'local')
      .set('Content-Type', 'application/json')
      .send({ id, title: 'first task', updated_at: '2026-05-20T12:00:00.000Z' })
      .expect(201);

    expect(res.body).toMatchObject({
      id,
      user_id: 'local',
      title: 'first task',
      completed_at: null,
      updated_at: '2026-05-20T12:00:00.000Z',
      deleted_at: null,
    });
    expect(typeof res.body.created_at).toBe('string');
    expect(typeof res.body.server_updated_at).toBe('string');
  });

  it('POST /tasks with empty title returns 400', async () => {
    await request(app.getHttpServer())
      .post('/tasks')
      .set('X-User-Id', 'local')
      .send({ id: '0193e1c0-1234-7000-8000-000000000001', title: '', updated_at: '2026-05-20T12:00:00.000Z' })
      .expect(400);
  });

  it('POST /tasks with a non-v7 UUID id returns 400', async () => {
    await request(app.getHttpServer())
      .post('/tasks')
      .set('X-User-Id', 'local')
      .send({ id: '0193e1c0-1234-4000-8000-000000000001', title: 'bad id', updated_at: '2026-05-20T12:00:00.000Z' })
      .expect(400);
  });

  it('POST /tasks with extra fields returns 400 (strict schema)', async () => {
    await request(app.getHttpServer())
      .post('/tasks')
      .set('X-User-Id', 'local')
      .send({
        id: '0193e1c0-1234-7000-8000-000000000002',
        title: 'x',
        updated_at: '2026-05-20T12:00:00.000Z',
        user_id: 'spoofed',
      })
      .expect(400);
  });

  it('GET /tasks returns 200 and only the current user_id tasks', async () => {
    await request(app.getHttpServer())
      .post('/tasks')
      .set('X-User-Id', 'alice')
      .send({ id: '0193e1c0-1234-7000-8000-000000000003', title: 'a1', updated_at: '2026-05-20T12:00:00.000Z' })
      .expect(201);
    await request(app.getHttpServer())
      .post('/tasks')
      .set('X-User-Id', 'alice')
      .send({ id: '0193e1c0-1234-7000-8000-000000000004', title: 'a2', updated_at: '2026-05-20T12:00:00.000Z' })
      .expect(201);
    await request(app.getHttpServer())
      .post('/tasks')
      .set('X-User-Id', 'bob')
      .send({ id: '0193e1c0-1234-7000-8000-000000000005', title: 'b1', updated_at: '2026-05-20T12:00:00.000Z' })
      .expect(201);

    const aliceRes = await request(app.getHttpServer()).get('/tasks').set('X-User-Id', 'alice').expect(200);
    const aliceTitles = (aliceRes.body as Array<{ title: string }>).map((task) => task.title).sort();
    expect(aliceTitles).toEqual(expect.arrayContaining(['a1', 'a2']));
    expect(aliceTitles).not.toContain('b1');
  });
});
