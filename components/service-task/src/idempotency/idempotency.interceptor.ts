import {
  BadRequestException,
  Inject,
  Injectable,
  type CallHandler,
  type ExecutionContext,
  type NestInterceptor,
} from '@nestjs/common';
import { from, mergeMap, of, type Observable } from 'rxjs';
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

    return from(this.idempotency.findCachedResponse(userId, idempotencyKey, requestHash)).pipe(
      mergeMap((cached) => {
        if (cached) {
          response.status(cached.statusCode);
          return of(cached.responseBody);
        }

        return next.handle().pipe(
          mergeMap(async (body) => {
            await this.idempotency.saveResponse(userId, idempotencyKey, requestHash, response.statusCode, body);
            return body;
          }),
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

    return value.trim();
  }

  private routePath(request: RequestWithIdempotency): string {
    return (request.path ?? request.originalUrl ?? request.url ?? '').split('?')[0] ?? '';
  }
}
