import {
  BadRequestException,
  type CallHandler,
  type ExecutionContext,
  Inject,
  Injectable,
  type NestInterceptor,
} from '@nestjs/common';
import { UuidV7Schema } from '@psykl/shared-types';
import { catchError, from, mergeMap, type Observable, of, throwError } from 'rxjs';

import { IdempotencyService } from './idempotency.service.js';

interface RequestWithIdempotency {
  body?: unknown;
  headers: Record<string, string | string[] | undefined>;
  method: string;
  originalUrl?: string;
  path?: string;
  url?: string;
  userId?: string;
}

interface ResponseWithStatus {
  status(statusCode: number): ResponseWithStatus;
  statusCode: number;
}

@Injectable()
export class IdempotencyInterceptor implements NestInterceptor {
  constructor(@Inject(IdempotencyService) private readonly idempotency: IdempotencyService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = context.switchToHttp();
    const request = http.getRequest<RequestWithIdempotency>();
    const response = http.getResponse<ResponseWithStatus>();

    if (!this.requiresIdempotency(request)) {
      return next.handle();
    }

    const idempotencyKey = this.readIdempotencyKey(request);
    const userId = request.userId;
    if (!userId) {
      return next.handle();
    }

    const requestHash = this.idempotency.hashRequest({
      method: request.method,
      path: this.routePath(request),
      body: request.body ?? null,
    });

    return from(this.idempotency.reserveRequest(userId, idempotencyKey, requestHash)).pipe(
      mergeMap((state) => {
        if (state.kind === 'cached') {
          response.status(state.cached.statusCode);
          return of(state.cached.responseBody);
        }

        if (state.kind === 'pending') {
          return from(this.idempotency.waitForCachedResponse(userId, idempotencyKey, requestHash)).pipe(
            mergeMap((cached) => {
              response.status(cached.statusCode);
              return of(cached.responseBody);
            }),
          );
        }

        return next.handle().pipe(
          mergeMap(async (body) => {
            await this.idempotency.completeRequest(userId, idempotencyKey, requestHash, response.statusCode, body);
            return body;
          }),
          catchError((error: unknown) =>
            from(this.idempotency.releaseRequest(userId, idempotencyKey, requestHash)).pipe(
              mergeMap(() => throwError(() => error)),
            ),
          ),
        );
      }),
    );
  }

  private requiresIdempotency(request: RequestWithIdempotency): boolean {
    return (
      ['POST', 'PATCH', 'DELETE'].includes(request.method.toUpperCase()) && this.routePath(request).startsWith('/tasks')
    );
  }

  private readIdempotencyKey(request: RequestWithIdempotency): string {
    const raw = request.headers['idempotency-key'] ?? request.headers['Idempotency-Key'];
    const value = Array.isArray(raw) ? raw[0] : raw;

    if (!value?.trim()) {
      throw new BadRequestException('Idempotency-Key header is required');
    }

    const parsed = UuidV7Schema.safeParse(value.trim());
    if (!parsed.success) {
      throw new BadRequestException('Idempotency-Key must be a UUID v7');
    }

    return parsed.data;
  }

  private routePath(request: RequestWithIdempotency): string {
    return (request.path ?? request.originalUrl ?? request.url ?? '').split('?')[0] ?? '';
  }
}
