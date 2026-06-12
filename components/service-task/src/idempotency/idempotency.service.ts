import { ConflictException, Inject, Injectable } from '@nestjs/common';
import { and, eq, isNull } from 'drizzle-orm';

import { type Db, schema } from '../db/index.js';
import type { IdempotencyRow } from '../db/schema/idempotency.js';
import { DB_TOKEN } from '../task/task.service.js';
import {
  type CachedIdempotencyResponse,
  IDEMPOTENCY_TTL_MS,
  type IdempotencyRequestState,
  PENDING_REPLAY_POLL_MS,
  PENDING_REPLAY_TIMEOUT_MS,
} from './idempotency-state.js';
import { hashRequest } from './request-hash.js';

@Injectable()
export class IdempotencyService {
  constructor(@Inject(DB_TOKEN) private readonly db: Db) {}

  hashRequest(input: { method: string; path: string; body: unknown }): string {
    return hashRequest(input);
  }

  async findCachedResponse(
    userId: string,
    idempotencyKey: string,
    requestHash: string,
  ): Promise<CachedIdempotencyResponse | null> {
    const row = await this.findRecord(userId, idempotencyKey);

    if (!row) {
      return null;
    }

    if (row.expiresAt.getTime() <= Date.now()) {
      await this.deleteExpiredRecord(row);
      return null;
    }

    if (row.requestHash !== requestHash) {
      throw new ConflictException('Idempotency-Key was already used with a different request body');
    }

    if (row.statusCode === null || row.responseBody === null) {
      return null;
    }

    return { statusCode: row.statusCode, responseBody: row.responseBody };
  }

  async reserveRequest(userId: string, idempotencyKey: string, requestHash: string): Promise<IdempotencyRequestState> {
    const expiresAt = new Date(Date.now() + IDEMPOTENCY_TTL_MS);
    const [inserted] = await this.db
      .insert(schema.idempotency)
      .values({
        userId,
        idempotencyKey,
        requestHash,
        expiresAt,
        statusCode: null,
        responseBody: null,
      })
      .onConflictDoNothing({
        target: [schema.idempotency.userId, schema.idempotency.idempotencyKey],
      })
      .returning({ idempotencyKey: schema.idempotency.idempotencyKey });

    if (inserted) {
      return { kind: 'reserved' };
    }

    const row = await this.findRecord(userId, idempotencyKey);
    if (!row) {
      return this.reserveRequest(userId, idempotencyKey, requestHash);
    }

    if (row.expiresAt.getTime() <= Date.now()) {
      await this.deleteExpiredRecord(row);
      return this.reserveRequest(userId, idempotencyKey, requestHash);
    }

    if (row.requestHash !== requestHash) {
      throw new ConflictException('Idempotency-Key was already used with a different request body');
    }

    if (row.statusCode !== null && row.responseBody !== null) {
      return { kind: 'cached', cached: { statusCode: row.statusCode, responseBody: row.responseBody } };
    }

    return { kind: 'pending' };
  }

  async completeRequest(
    userId: string,
    idempotencyKey: string,
    requestHash: string,
    statusCode: number,
    responseBody: unknown,
  ): Promise<void> {
    await this.db
      .update(schema.idempotency)
      .set({ statusCode, responseBody })
      .where(this.pendingRequestFilter(userId, idempotencyKey, requestHash));
  }

  async releaseRequest(userId: string, idempotencyKey: string, requestHash: string): Promise<void> {
    await this.db.delete(schema.idempotency).where(this.pendingRequestFilter(userId, idempotencyKey, requestHash));
  }

  async waitForCachedResponse(
    userId: string,
    idempotencyKey: string,
    requestHash: string,
  ): Promise<CachedIdempotencyResponse> {
    const deadline = Date.now() + PENDING_REPLAY_TIMEOUT_MS;

    while (Date.now() <= deadline) {
      const cached = await this.findCachedResponse(userId, idempotencyKey, requestHash);
      if (cached) {
        return cached;
      }
      await new Promise((resolve) => setTimeout(resolve, PENDING_REPLAY_POLL_MS));
    }

    throw new ConflictException('Idempotency-Key is already being processed');
  }

  private async findRecord(userId: string, idempotencyKey: string) {
    const [row] = await this.db
      .select()
      .from(schema.idempotency)
      .where(and(eq(schema.idempotency.userId, userId), eq(schema.idempotency.idempotencyKey, idempotencyKey)));

    return row ?? null;
  }

  private pendingRequestFilter(userId: string, idempotencyKey: string, requestHash: string) {
    return and(
      eq(schema.idempotency.userId, userId),
      eq(schema.idempotency.idempotencyKey, idempotencyKey),
      eq(schema.idempotency.requestHash, requestHash),
      isNull(schema.idempotency.statusCode),
    );
  }

  private async deleteExpiredRecord(row: IdempotencyRow): Promise<void> {
    await this.db
      .delete(schema.idempotency)
      .where(
        and(
          eq(schema.idempotency.userId, row.userId),
          eq(schema.idempotency.idempotencyKey, row.idempotencyKey),
          eq(schema.idempotency.requestHash, row.requestHash),
          eq(schema.idempotency.expiresAt, row.expiresAt),
        ),
      );
  }
}
