import type { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface.js';

// Every mutation the client sends carries an Idempotency-Key (see
// idempotency.interceptor.ts, which requires it). A header the client sends but
// this list omits is a write the browser refuses before it leaves the device —
// silently, because a blocked preflight never reaches a server log.
const ALLOWED_HEADERS = ['Content-Type', 'X-User-Id', 'Idempotency-Key'];

function corsOptions(): CorsOptions {
  return {
    origin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
    allowedHeaders: ALLOWED_HEADERS,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  };
}

export { ALLOWED_HEADERS, corsOptions };
