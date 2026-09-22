import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { AppModule } from '../../app.module.js';
import { corsOptions } from '../cors.options.js';

const browserOrigin = 'http://localhost:5173';

describe('CORS (Component-layer contract)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    delete process.env.PGLITE_DATA_DIR;
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    app.enableCors(corsOptions());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  /**
   * Behavior enforced by:
   * components/service-task/src/http/cors.options.ts
   */
  describe('preflight for a write', () => {
    it('allows the headers every mutation actually sends', async () => {
      // Given a browser about to POST a task the way the client does
      const response = await request(app.getHttpServer())
        .options('/tasks')
        .set('Origin', browserOrigin)
        .set('Access-Control-Request-Method', 'POST')
        .set('Access-Control-Request-Headers', 'content-type,x-user-id,idempotency-key');

      // Then — a header the client sends but the server does not advertise is a
      // write the browser refuses before it leaves the device
      const allowed = (response.headers['access-control-allow-headers'] ?? '').toLowerCase();
      expect(allowed).toContain('content-type');
      expect(allowed).toContain('x-user-id');
      expect(allowed).toContain('idempotency-key');
    });

    it('allows the methods the client writes with', async () => {
      // When / Then
      const response = await request(app.getHttpServer())
        .options('/tasks')
        .set('Origin', browserOrigin)
        .set('Access-Control-Request-Method', 'PATCH');

      const methods = (response.headers['access-control-allow-methods'] ?? '').toUpperCase();
      for (const method of ['GET', 'POST', 'PATCH', 'DELETE']) {
        expect(methods).toContain(method);
      }
    });
  });
});
