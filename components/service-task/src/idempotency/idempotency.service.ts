import { ConflictException, Inject, Injectable } from '@nestjs/common';
import { createHash } from 'node:crypto';
import { and, eq } from 'drizzle-orm';
import { schema, type Db } from '../db/index.js';
import { DB_TOKEN } from '../task/task.service.js';

const IDEMPOTENCY_TTL_MS = 24 * 60 * 60 * 1000;

export interface CachedIdempotencyResponse {
  statusCode: number;
  responseBody: unknown;
}

@Injectable()
export class IdempotencyService {
  constructor(@Inject(DB_TOKEN) private readonly db: Db) {}

  hashRequest(input: { method: string; path: string; body: unknown }): string {
    return createHash('sha256').update(stableStringify(input)).digest('hex');
  }

  async findCachedResponse(
    userId: string,
    idempotencyKey: string,
    requestHash: string,
  ): Promise<CachedIdempotencyResponse | null> {
    const [row] = await this.db
      .select()
      .from(schema.idempotency)
      .where(and(eq(schema.idempotency.userId, userId), eq(schema.idempotency.idempotencyKey, idempotencyKey)));

    if (!row) {
      return null;
    }

    if (row.expiresAt.getTime() <= Date.now()) {
      await this.deleteRecord(userId, idempotencyKey);
      return null;
    }

    if (row.requestHash !== requestHash) {
      throw new ConflictException('Idempotency-Key was already used with a different request body');
    }

    return {
      statusCode: row.statusCode,
      responseBody: row.responseBody,
    };
  }

  async saveResponse(
    userId: string,
    idempotencyKey: string,
    requestHash: string,
    statusCode: number,
    responseBody: unknown,
  ): Promise<void> {
    await this.db
      .insert(schema.idempotency)
      .values({
        userId,
        idempotencyKey,
        requestHash,
        statusCode,
        responseBody,
        expiresAt: new Date(Date.now() + IDEMPOTENCY_TTL_MS),
      })
      .onConflictDoUpdate({
        target: [schema.idempotency.userId, schema.idempotency.idempotencyKey],
        set: {
          requestHash,
          statusCode,
          responseBody,
          expiresAt: new Date(Date.now() + IDEMPOTENCY_TTL_MS),
          createdAt: new Date(),
        },
      });
  }

  private async deleteRecord(userId: string, idempotencyKey: string): Promise<void> {
    await this.db
      .delete(schema.idempotency)
      .where(and(eq(schema.idempotency.userId, userId), eq(schema.idempotency.idempotencyKey, idempotencyKey)));
  }
}

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(',')}]`;
  }

  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    return `{${Object.keys(record)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableStringify(record[key])}`)
      .join(',')}}`;
  }

  return JSON.stringify(value);
}
