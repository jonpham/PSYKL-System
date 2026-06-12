import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { eq } from 'drizzle-orm';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { UserIdGuard } from '../auth/user-id.guard.js';
import { AppModule } from '../app.module.js';
import { schema, type Db } from '../db/index.js';
import { DB_TOKEN } from './task.service.js';

describe('TaskController contract', () => {
  let app: INestApplication;
  let db: Db;

  beforeAll(async () => {
    delete process.env.PGLITE_DATA_DIR;
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    app.useGlobalGuards(new UserIdGuard());
    await app.init();
    db = app.get<Db>(DB_TOKEN);
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /tasks with valid body returns 201 and the persisted record', async () => {
    const id = '0193e1c0-1234-7000-8000-000000000000';
    const res = await request(app.getHttpServer())
      .post('/tasks')
      .set('X-User-Id', 'local')
      .set('Idempotency-Key', 'contract-post-valid')
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
      .set('Idempotency-Key', 'contract-post-empty-title')
      .send({ id: '0193e1c0-1234-7000-8000-000000000001', title: '', updated_at: '2026-05-20T12:00:00.000Z' })
      .expect(400);
  });

  it('POST /tasks with a non-v7 UUID id returns 400', async () => {
    await request(app.getHttpServer())
      .post('/tasks')
      .set('X-User-Id', 'local')
      .set('Idempotency-Key', 'contract-post-bad-id')
      .send({ id: '0193e1c0-1234-4000-8000-000000000001', title: 'bad id', updated_at: '2026-05-20T12:00:00.000Z' })
      .expect(400);
  });

  it('POST /tasks with extra fields returns 400 (strict schema)', async () => {
    await request(app.getHttpServer())
      .post('/tasks')
      .set('X-User-Id', 'local')
      .set('Idempotency-Key', 'contract-post-extra-fields')
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
      .set('Idempotency-Key', 'contract-list-alice-1')
      .send({ id: '0193e1c0-1234-7000-8000-000000000003', title: 'a1', updated_at: '2026-05-20T12:00:00.000Z' })
      .expect(201);
    await request(app.getHttpServer())
      .post('/tasks')
      .set('X-User-Id', 'alice')
      .set('Idempotency-Key', 'contract-list-alice-2')
      .send({ id: '0193e1c0-1234-7000-8000-000000000004', title: 'a2', updated_at: '2026-05-20T12:00:00.000Z' })
      .expect(201);
    await request(app.getHttpServer())
      .post('/tasks')
      .set('X-User-Id', 'bob')
      .set('Idempotency-Key', 'contract-list-bob-1')
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
      .set('Idempotency-Key', 'contract-patch-create-valid')
      .send({ id, title: 'before', updated_at: '2026-05-20T12:00:00.000Z' })
      .expect(201);

    const res = await request(app.getHttpServer())
      .patch(`/tasks/${id}`)
      .set('X-User-Id', 'local')
      .set('Idempotency-Key', 'contract-patch-valid')
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
      .set('Idempotency-Key', 'contract-patch-create-stale')
      .send({ id, title: 'current', updated_at: '2026-05-20T12:05:00.000Z' })
      .expect(201);

    const res = await request(app.getHttpServer())
      .patch(`/tasks/${id}`)
      .set('X-User-Id', 'local')
      .set('Idempotency-Key', 'contract-patch-stale')
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
      .set('Idempotency-Key', 'contract-patch-invalid')
      .send({ title: '' })
      .expect(400);
  });

  it('PATCH /tasks/:id with missing row returns 404', async () => {
    await request(app.getHttpServer())
      .patch('/tasks/0193e1c0-1234-7000-8000-000000000013')
      .set('X-User-Id', 'local')
      .set('Idempotency-Key', 'contract-patch-missing')
      .send({ title: 'missing', updated_at: '2026-05-20T12:00:00.000Z' })
      .expect(404);
  });

  it('DELETE /tasks/:id returns 200, tombstones the Task, and default GET hides it', async () => {
    const id = '0193e1c0-1234-7000-8000-000000000020';
    await request(app.getHttpServer())
      .post('/tasks')
      .set('X-User-Id', 'local')
      .set('Idempotency-Key', 'contract-delete-create-success')
      .send({ id, title: 'to delete', updated_at: '2026-05-20T12:00:00.000Z' })
      .expect(201);

    const deleteRes = await request(app.getHttpServer())
      .delete(`/tasks/${id}`)
      .set('X-User-Id', 'local')
      .set('Idempotency-Key', 'contract-delete-success')
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
      .set('Idempotency-Key', 'contract-delete-create-stale')
      .send({ id, title: 'current', updated_at: '2026-05-20T12:05:00.000Z' })
      .expect(201);

    const deleteRes = await request(app.getHttpServer())
      .delete(`/tasks/${id}`)
      .set('X-User-Id', 'local')
      .set('Idempotency-Key', 'contract-delete-stale')
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
      .set('Idempotency-Key', 'contract-delete-missing')
      .send({
        deleted_at: '2026-05-20T12:00:00.000Z',
        updated_at: '2026-05-20T12:00:00.000Z',
      })
      .expect(404);
  });

  it('POST /tasks requires Idempotency-Key', async () => {
    await request(app.getHttpServer())
      .post('/tasks')
      .set('X-User-Id', 'local')
      .send({
        id: '0193e1c0-1234-7000-8000-000000000030',
        title: 'missing key',
        updated_at: '2026-05-20T12:00:00.000Z',
      })
      .expect(400);
  });

  it('PATCH /tasks/:id requires Idempotency-Key', async () => {
    await request(app.getHttpServer())
      .patch('/tasks/0193e1c0-1234-7000-8000-000000000031')
      .set('X-User-Id', 'local')
      .send({ title: 'missing key', updated_at: '2026-05-20T12:00:00.000Z' })
      .expect(400);
  });

  it('DELETE /tasks/:id requires Idempotency-Key', async () => {
    await request(app.getHttpServer())
      .delete('/tasks/0193e1c0-1234-7000-8000-000000000032')
      .set('X-User-Id', 'local')
      .send({
        deleted_at: '2026-05-20T12:00:00.000Z',
        updated_at: '2026-05-20T12:00:00.000Z',
      })
      .expect(400);
  });

  it('replays the cached response for the same Idempotency-Key and request body within 24 hours', async () => {
    const body = {
      id: '0193e1c0-1234-7000-8000-000000000033',
      title: 'replayed',
      updated_at: '2026-05-20T12:00:00.000Z',
    };

    const first = await request(app.getHttpServer())
      .post('/tasks')
      .set('X-User-Id', 'local')
      .set('Idempotency-Key', 'contract-post-replay')
      .send(body)
      .expect(201);
    const second = await request(app.getHttpServer())
      .post('/tasks')
      .set('X-User-Id', 'local')
      .set('Idempotency-Key', 'contract-post-replay')
      .send(body)
      .expect(201);

    expect(second.body).toEqual(first.body);
  });

  it('returns 409 when the same Idempotency-Key is reused with a different request body before expiry', async () => {
    await request(app.getHttpServer())
      .post('/tasks')
      .set('X-User-Id', 'local')
      .set('Idempotency-Key', 'contract-post-conflict')
      .send({
        id: '0193e1c0-1234-7000-8000-000000000034',
        title: 'first',
        updated_at: '2026-05-20T12:00:00.000Z',
      })
      .expect(201);

    await request(app.getHttpServer())
      .post('/tasks')
      .set('X-User-Id', 'local')
      .set('Idempotency-Key', 'contract-post-conflict')
      .send({
        id: '0193e1c0-1234-7000-8000-000000000035',
        title: 'different',
        updated_at: '2026-05-20T12:00:00.000Z',
      })
      .expect(409);
  });

  it('applies a reused Idempotency-Key again after the cached response expires', async () => {
    await request(app.getHttpServer())
      .post('/tasks')
      .set('X-User-Id', 'local')
      .set('Idempotency-Key', 'contract-post-expired')
      .send({
        id: '0193e1c0-1234-7000-8000-000000000036',
        title: 'expired first',
        updated_at: '2026-05-20T12:00:00.000Z',
      })
      .expect(201);

    await db
      .update(schema.idempotency)
      .set({ expiresAt: new Date('2026-05-20T11:00:00.000Z') })
      .where(eq(schema.idempotency.idempotencyKey, 'contract-post-expired'));

    await request(app.getHttpServer())
      .post('/tasks')
      .set('X-User-Id', 'local')
      .set('Idempotency-Key', 'contract-post-expired')
      .send({
        id: '0193e1c0-1234-7000-8000-000000000037',
        title: 'expired second',
        updated_at: '2026-05-20T12:00:00.000Z',
      })
      .expect(201);
  });
});
