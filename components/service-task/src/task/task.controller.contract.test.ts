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
    const res = await request(app.getHttpServer())
      .post('/tasks')
      .set('X-User-Id', 'local')
      .set('Content-Type', 'application/json')
      .send({ title: 'first task' })
      .expect(201);

    expect(res.body).toMatchObject({
      user_id: 'local',
      title: 'first task',
    });
    expect(res.body.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
    expect(typeof res.body.created_at).toBe('string');
  });

  it('POST /tasks with empty title returns 400', async () => {
    await request(app.getHttpServer())
      .post('/tasks')
      .set('X-User-Id', 'local')
      .send({ title: '' })
      .expect(400);
  });

  it('POST /tasks with extra fields returns 400 (strict schema)', async () => {
    await request(app.getHttpServer())
      .post('/tasks')
      .set('X-User-Id', 'local')
      .send({ title: 'x', user_id: 'spoofed' })
      .expect(400);
  });

  it('GET /tasks returns 200 and only the current user_id tasks', async () => {
    await request(app.getHttpServer()).post('/tasks').set('X-User-Id', 'alice').send({ title: 'a1' }).expect(201);
    await request(app.getHttpServer()).post('/tasks').set('X-User-Id', 'alice').send({ title: 'a2' }).expect(201);
    await request(app.getHttpServer()).post('/tasks').set('X-User-Id', 'bob').send({ title: 'b1' }).expect(201);

    const aliceRes = await request(app.getHttpServer()).get('/tasks').set('X-User-Id', 'alice').expect(200);
    const aliceTitles = (aliceRes.body as Array<{ title: string }>).map((task) => task.title).sort();
    expect(aliceTitles).toEqual(expect.arrayContaining(['a1', 'a2']));
    expect(aliceTitles).not.toContain('b1');
  });
});
