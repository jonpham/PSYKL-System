import createClient from 'openapi-fetch';
import type { paths } from './types';

const baseUrl = (import.meta.env['VITE_API_URL'] as string | undefined) ?? 'http://localhost:3000';

const headers = {
  'X-User-Id': 'local',
  'Content-Type': 'application/json',
} as const;

export const apiClient = createClient<paths>({
  baseUrl,
  headers,
  fetch: (request) => globalThis.fetch(request),
});

export const taskRequestParams = {
  params: {
    header: {
      'X-User-Id': 'local',
    },
  },
} as const;

export function taskMutationRequestParams(idempotencyKey: string) {
  return {
    params: {
      header: {
        'X-User-Id': 'local',
        'Idempotency-Key': idempotencyKey,
      },
    },
  } as const;
}

export type Task = paths['/tasks']['get']['responses']['200']['content']['application/json'][number];
export type TaskInput = NonNullable<paths['/tasks']['post']['requestBody']>['content']['application/json'];
