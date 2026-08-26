import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { v7 as uuidv7 } from 'uuid';

import { AppModule } from '../../src/app.module.js';
import { UserIdGuard } from '../../src/auth/user-id.guard.js';
import { createDb, type Db, schema } from '../../src/db/index.js';
import { TaskService } from '../../src/task/task.service.js';

export async function createIntegrationDb(): Promise<Db> {
  delete process.env.PGLITE_DATA_DIR;
  return createDb();
}

/**
 * A thin HTTP-request surface over a real, in-process NestJS app for
 * integration tests that exercise a full request (routing, validation,
 * guard, service, DB) rather than calling the service layer directly.
 * Requests default to `X-User-Id: local`, mirroring the rest of the
 * integration suite's implicit "local" single-user convention.
 */
export interface TestApp {
  post(path: string): request.Test;
  get(path: string): request.Test;
  patch(path: string): request.Test;
  delete(path: string): request.Test;
  close(): Promise<void>;
}

export async function createTestApp(): Promise<TestApp> {
  delete process.env.PGLITE_DATA_DIR;
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
  const app: INestApplication = moduleRef.createNestApplication();
  app.useGlobalGuards(new UserIdGuard());
  await app.init();
  const server = app.getHttpServer() as Parameters<typeof request>[0];

  return {
    post: (path: string) => request(server).post(path).set('X-User-Id', 'local'),
    get: (path: string) => request(server).get(path).set('X-User-Id', 'local'),
    patch: (path: string) => request(server).patch(path).set('X-User-Id', 'local'),
    delete: (path: string) => request(server).delete(path).set('X-User-Id', 'local'),
    close: () => app.close(),
  };
}

export async function insertTask(
  db: Db,
  input: {
    id?: string;
    userId?: string;
    title: string;
    updatedAt: Date;
    deletedAt?: Date;
  },
): Promise<string> {
  const id = input.id ?? uuidv7();
  await db.insert(schema.tasks).values({
    id,
    userId: input.userId ?? 'local',
    title: input.title,
    updatedAt: input.updatedAt,
    deletedAt: input.deletedAt,
  });
  return id;
}

export function taskService(db: Db): TaskService {
  return new TaskService(db);
}
