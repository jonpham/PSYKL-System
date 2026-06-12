import type { CallHandler, ExecutionContext } from '@nestjs/common';
import { lastValueFrom, of, throwError } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';

import { IdempotencyInterceptor } from '../idempotency.interceptor.js';
import type { IdempotencyService } from '../idempotency.service.js';

function httpContext(input: {
  body?: unknown;
  headers?: Record<string, string>;
  method?: string;
  path?: string;
  userId?: string;
  response?: { status: ReturnType<typeof vi.fn>; statusCode: number };
}): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => ({
        body: input.body ?? null,
        headers: input.headers ?? {},
        method: input.method ?? 'POST',
        path: input.path ?? '/tasks',
        userId: input.userId ?? 'local',
      }),
      getResponse: () => input.response ?? { status: vi.fn(), statusCode: 201 },
    }),
  } as unknown as ExecutionContext;
}

describe('IdempotencyInterceptor', () => {
  it('replays a pending duplicate request without invoking the handler again', async () => {
    const response = { status: vi.fn(), statusCode: 201 };
    const service = {
      findCachedResponse: vi.fn(async () => null),
      hashRequest: vi.fn(() => 'same-request-hash'),
      reserveRequest: vi.fn(async () => ({ kind: 'pending' })),
      waitForCachedResponse: vi.fn(async () => ({
        statusCode: 201,
        responseBody: { id: '0193e1c0-1234-7000-8000-000000000070' },
      })),
    } as unknown as IdempotencyService;
    const next = { handle: vi.fn(() => of({ id: 'should-not-run' })) } as CallHandler;
    const interceptor = new IdempotencyInterceptor(service);

    // Given
    const context = httpContext({
      body: { id: '0193e1c0-1234-7000-8000-000000000070' },
      headers: { 'idempotency-key': '0193e1c0-5678-7000-8000-000000000070' },
      response,
    });

    // When
    const body = await lastValueFrom(interceptor.intercept(context, next));

    // Then
    expect(next.handle).not.toHaveBeenCalled();
    expect(response.status).toHaveBeenCalledWith(201);
    expect(body).toEqual({ id: '0193e1c0-1234-7000-8000-000000000070' });
  });

  it('releases a reserved key when the handler fails before a response is cached', async () => {
    const error = new Error('request failed');
    const service = {
      completeRequest: vi.fn(),
      hashRequest: vi.fn(() => 'failed-request-hash'),
      releaseRequest: vi.fn(async () => undefined),
      reserveRequest: vi.fn(async () => ({ kind: 'reserved' })),
    } as unknown as IdempotencyService;
    const next = { handle: vi.fn(() => throwError(() => error)) } as CallHandler;
    const interceptor = new IdempotencyInterceptor(service);

    // Given
    const context = httpContext({
      body: { title: '' },
      headers: { 'idempotency-key': '0193e1c0-5678-7000-8000-000000000071' },
    });

    // When / Then
    await expect(lastValueFrom(interceptor.intercept(context, next))).rejects.toBe(error);
    expect(service.releaseRequest).toHaveBeenCalledWith(
      'local',
      '0193e1c0-5678-7000-8000-000000000071',
      'failed-request-hash',
    );
  });
});
