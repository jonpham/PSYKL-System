import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { afterAll, beforeAll } from 'vitest';

import { AppModule } from '../../app.module.js';
import { UserIdGuard } from '../../auth/user-id.guard.js';
import type { Db } from '../../db/index.js';
import { DB_TOKEN } from '../../task/task.service.js';

interface ListCreateBody {
  id: string;
  title: string;
  position: string;
  updated_at: string;
}

interface ListDeleteBody {
  deleted_at: string;
}

interface ListRestoreBody {
  updated_at: string;
}

type RequestBody = string | object | undefined;

/**
 * List routes carry no `Idempotency-Key` handling — unlike TaskController's
 * harness, List mutations are not idempotency-protected. See
 * components/service-task/src/idempotency/idempotency.interceptor.ts:85-89.
 */
export function listControllerHarness() {
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
    get app() {
      return app;
    },
    createList(input: { userId?: string; body: RequestBody }) {
      return request(app.getHttpServer())
        .post('/lists')
        .set('X-User-Id', input.userId ?? 'local')
        .send(input.body);
    },
    getLists(input: { userId?: string } = {}) {
      return request(app.getHttpServer())
        .get('/lists')
        .set('X-User-Id', input.userId ?? 'local');
    },
    deleteList(input: { id: string; userId?: string; body: RequestBody }) {
      return request(app.getHttpServer())
        .delete(`/lists/${input.id}`)
        .set('X-User-Id', input.userId ?? 'local')
        .send(input.body);
    },
    restoreList(input: { id: string; userId?: string; body: RequestBody }) {
      return request(app.getHttpServer())
        .post(`/lists/${input.id}/restore`)
        .set('X-User-Id', input.userId ?? 'local')
        .send(input.body);
    },
  };
}

export function listCreateBody(overrides: Partial<ListCreateBody> = {}): ListCreateBody {
  return {
    id: validListId('100'),
    title: 'list',
    position: 'a0',
    updated_at: '2026-05-20T12:00:00.000Z',
    ...overrides,
  };
}

export function listDeleteBody(overrides: Partial<ListDeleteBody> = {}): ListDeleteBody {
  return {
    deleted_at: '2026-05-20T12:00:00.000Z',
    ...overrides,
  };
}

export function listRestoreBody(overrides: Partial<ListRestoreBody> = {}): ListRestoreBody {
  return {
    updated_at: '2026-05-20T12:00:00.000Z',
    ...overrides,
  };
}

export function validListId(suffix: string): string {
  return `0193e1c0-9abc-7000-8000-000000000${suffix}`;
}
