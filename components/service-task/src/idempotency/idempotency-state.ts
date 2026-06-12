export const IDEMPOTENCY_TTL_MS = 24 * 60 * 60 * 1000;
export const PENDING_REPLAY_TIMEOUT_MS = 5000;
export const PENDING_REPLAY_POLL_MS = 25;

export interface CachedIdempotencyResponse {
  statusCode: number;
  responseBody: unknown;
}

export type IdempotencyRequestState =
  | { kind: 'reserved' }
  | { kind: 'pending' }
  | { kind: 'cached'; cached: CachedIdempotencyResponse };
