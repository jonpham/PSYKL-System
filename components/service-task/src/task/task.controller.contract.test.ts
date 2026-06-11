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

  it('GET /tasks rejects unparseable include_deleted values', async () => {
    await request(app.getHttpServer()).get('/tasks?include_deleted=true').set('X-User-Id', 'local').expect(400);
  });

  it('PATCH /tasks/:id with valid body returns 200 and the patched record', async () => {
    const id = '0193e1c0-1234-7000-8000-000000000010';
    await request(app.getHttpServer())
      .post('/tasks')
      .set('X-User-Id', 'local')
      .send({ id, title: 'before', updated_at: '2026-05-20T12:00:00.000Z' })
      .expect(201);

    const res = await request(app.getHttpServer())
      .patch(`/tasks/${id}`)
      .set('X-User-Id', 'local')
      .send({ title: 'after', updated_at: '2026-05-20T12:05:00.000Z' })
      .expect(200);

    expect(res.body).toMatchObject({
      id,
      user_id: 'local',
      title: 'after',
      updated_at: '2026-05-20T12:05:00.000Z',
    });
  });

  it('PATCH /tasks/:id with stale updated_at returns 200 and current record', async () => {
    const id = '0193e1c0-1234-7000-8000-000000000011';
    await request(app.getHttpServer())
      .post('/tasks')
      .set('X-User-Id', 'local')
      .send({ id, title: 'current', updated_at: '2026-05-20T12:05:00.000Z' })
      .expect(201);

    const res = await request(app.getHttpServer())
      .patch(`/tasks/${id}`)
      .set('X-User-Id', 'local')
      .send({ title: 'stale', updated_at: '2026-05-20T12:00:00.000Z' })
      .expect(200);

    expect(res.body).toMatchObject({
      id,
      title: 'current',
      updated_at: '2026-05-20T12:05:00.000Z',
    });
  });

  it('PATCH /tasks/:id with invalid body returns 400', async () => {
    await request(app.getHttpServer())
      .patch('/tasks/0193e1c0-1234-7000-8000-000000000012')
      .set('X-User-Id', 'local')
      .send({ title: '' })
      .expect(400);
  });

  it('PATCH /tasks/:id with missing row returns 404', async () => {
    await request(app.getHttpServer())
      .patch('/tasks/0193e1c0-1234-7000-8000-000000000013')
      .set('X-User-Id', 'local')
      .send({ title: 'missing', updated_at: '2026-05-20T12:00:00.000Z' })
      .expect(404);
  });

  it('DELETE /tasks/:id returns 200, tombstones the Task, and default GET hides it', async () => {
    const id = '0193e1c0-1234-7000-8000-000000000020';
    await request(app.getHttpServer())
      .post('/tasks')
      .set('X-User-Id', 'local')
      .send({ id, title: 'to delete', updated_at: '2026-05-20T12:00:00.000Z' })
      .expect(201);

    const deleteRes = await request(app.getHttpServer())
      .delete(`/tasks/${id}`)
      .set('X-User-Id', 'local')
      .send({
        deleted_at: '2026-05-20T12:05:00.000Z',
        updated_at: '2026-05-20T12:05:00.000Z',
      })
      .expect(200);

    expect(deleteRes.body).toMatchObject({
      id,
      deleted_at: '2026-05-20T12:05:00.000Z',
      updated_at: '2026-05-20T12:05:00.000Z',
    });

    const defaultGet = await request(app.getHttpServer()).get('/tasks').set('X-User-Id', 'local').expect(200);
    expect((defaultGet.body as Array<{ id: string }>).map((task) => task.id)).not.toContain(id);

    const withDeleted = await request(app.getHttpServer())
      .get('/tasks?include_deleted=1')
      .set('X-User-Id', 'local')
      .expect(200);
    expect((withDeleted.body as Array<{ id: string }>).map((task) => task.id)).toContain(id);
  });

  it('DELETE /tasks/:id with stale updated_at returns 200 and current row', async () => {
    const id = '0193e1c0-1234-7000-8000-000000000021';
    await request(app.getHttpServer())
      .post('/tasks')
      .set('X-User-Id', 'local')
      .send({ id, title: 'current', updated_at: '2026-05-20T12:05:00.000Z' })
      .expect(201);

    const deleteRes = await request(app.getHttpServer())
      .delete(`/tasks/${id}`)
      .set('X-User-Id', 'local')
      .send({
        deleted_at: '2026-05-20T12:00:00.000Z',
        updated_at: '2026-05-20T12:00:00.000Z',
      })
      .expect(200);

    expect(deleteRes.body).toMatchObject({
      id,
      title: 'current',
      deleted_at: null,
      updated_at: '2026-05-20T12:05:00.000Z',
    });
  });

  it('DELETE /tasks/:id with missing row returns 404', async () => {
    await request(app.getHttpServer())
      .delete('/tasks/0193e1c0-1234-7000-8000-000000000022')
      .set('X-User-Id', 'local')
      .send({
        deleted_at: '2026-05-20T12:00:00.000Z',
        updated_at: '2026-05-20T12:00:00.000Z',
      })
      .expect(404);
  });
});
