import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { afterAll, beforeAll } from 'vitest';
import { UserIdGuard } from '../../auth/user-id.guard.js';
import { AppModule } from '../../app.module.js';
import type { Db } from '../../db/index.js';
import { DB_TOKEN } from '../task.service.js';

interface TaskCreateBody {
  id: string;
  title: string;
  updated_at: string;
}

interface TaskPatchBody {
  title?: string;
  completed_at?: string | null;
  updated_at: string;
}

interface TaskDeleteBody {
  deleted_at: string;
  updated_at: string;
}

type RequestBody = string | object | undefined;

export function taskControllerHarness() {
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

  return {
    get db() {
      return db;
    },
    postTask(input: { userId?: string; idempotencyKey?: string; body: RequestBody }) {
      const req = request(app.getHttpServer())
        .post('/tasks')
        .set('X-User-Id', input.userId ?? 'local');
      if (input.idempotencyKey) {
        req.set('Idempotency-Key', input.idempotencyKey);
      }
      return req.send(input.body);
    },
    getTasks(input: { userId?: string; includeDeleted?: string } = {}) {
      const query = input.includeDeleted === undefined ? '' : `?include_deleted=${input.includeDeleted}`;
      return request(app.getHttpServer())
        .get(`/tasks${query}`)
        .set('X-User-Id', input.userId ?? 'local');
    },
    patchTask(input: { id: string; userId?: string; idempotencyKey?: string; body: RequestBody }) {
      const req = request(app.getHttpServer())
        .patch(`/tasks/${input.id}`)
        .set('X-User-Id', input.userId ?? 'local');
      if (input.idempotencyKey) {
        req.set('Idempotency-Key', input.idempotencyKey);
      }
      return req.send(input.body);
    },
    deleteTask(input: { id: string; userId?: string; idempotencyKey?: string; body: RequestBody }) {
      const req = request(app.getHttpServer())
        .delete(`/tasks/${input.id}`)
        .set('X-User-Id', input.userId ?? 'local');
      if (input.idempotencyKey) {
        req.set('Idempotency-Key', input.idempotencyKey);
      }
      return req.send(input.body);
    },
  };
}

export function taskCreateBody(overrides: Partial<TaskCreateBody> = {}): TaskCreateBody {
  return {
    id: validTaskId('100'),
    title: 'task',
    updated_at: '2026-05-20T12:00:00.000Z',
    ...overrides,
  };
}

export function taskPatchBody(overrides: Partial<TaskPatchBody> = {}): TaskPatchBody {
  return {
    title: 'updated task',
    updated_at: '2026-05-20T12:00:00.000Z',
    ...overrides,
  };
}

export function taskDeleteBody(overrides: Partial<TaskDeleteBody> = {}): TaskDeleteBody {
  return {
    deleted_at: '2026-05-20T12:00:00.000Z',
    updated_at: '2026-05-20T12:00:00.000Z',
    ...overrides,
  };
}

export function validTaskId(suffix: string): string {
  return `0193e1c0-1234-7000-8000-000000000${suffix}`;
}
