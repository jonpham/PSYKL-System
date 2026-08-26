import { http, HttpResponse } from 'msw';

import type { Task } from '../api/client';

let store: Task[] = [];

export function resetStore() {
  store = [];
}

export const handlers = [
  http.get('*/version', () => HttpResponse.json({ component: 'service-task', commit: 'dev' })),

  http.get('*/tasks', ({ request }) => {
    if (request.headers.get('x-user-id') !== 'local') {
      return new HttpResponse(null, { status: 401 });
    }

    return HttpResponse.json(store);
  }),

  http.post('*/tasks', async ({ request }) => {
    if (request.headers.get('x-user-id') !== 'local') {
      return new HttpResponse(null, { status: 401 });
    }
    if (!request.headers.get('idempotency-key')) {
      return new HttpResponse(null, { status: 400 });
    }

    const body = (await request.json()) as { id?: string; title?: string; updated_at?: string };
    if (!body.id || !body.title || !body.updated_at || body.title.length > 200) {
      return new HttpResponse(null, { status: 400 });
    }

    const now = new Date().toISOString();
    const task: Task = {
      id: body.id,
      user_id: 'local',
      title: body.title,
      created_at: now,
      completed_at: null,
      updated_at: body.updated_at,
      server_updated_at: now,
      deleted_at: null,
      list_id: null,
    };
    store = [task, ...store];

    return HttpResponse.json(task, { status: 201 });
  }),

  http.patch('*/tasks/:id', async ({ params, request }) => {
    if (request.headers.get('x-user-id') !== 'local') {
      return new HttpResponse(null, { status: 401 });
    }
    if (!request.headers.get('idempotency-key')) {
      return new HttpResponse(null, { status: 400 });
    }

    const id = String(params['id']);
    const existing = store.find((task) => task.id === id);
    if (!existing) {
      return new HttpResponse(null, { status: 404 });
    }

    const body = (await request.json()) as { completed_at?: string | null; title?: string; updated_at?: string };
    if (!body.updated_at) {
      return new HttpResponse(null, { status: 400 });
    }

    const nextTask: Task = {
      ...existing,
      completed_at: body.completed_at ?? existing.completed_at,
      title: body.title ?? existing.title,
      updated_at: body.updated_at,
      server_updated_at: new Date().toISOString(),
    };
    store = store.map((task) => (task.id === id ? nextTask : task));

    return HttpResponse.json(nextTask);
  }),

  http.delete('*/tasks/:id', async ({ params, request }) => {
    if (request.headers.get('x-user-id') !== 'local') {
      return new HttpResponse(null, { status: 401 });
    }
    if (!request.headers.get('idempotency-key')) {
      return new HttpResponse(null, { status: 400 });
    }

    const id = String(params['id']);
    const existing = store.find((task) => task.id === id);
    if (!existing) {
      return new HttpResponse(null, { status: 404 });
    }

    const body = (await request.json()) as { deleted_at?: string; updated_at?: string };
    if (!body.deleted_at || !body.updated_at) {
      return new HttpResponse(null, { status: 400 });
    }

    const nextTask: Task = {
      ...existing,
      deleted_at: body.deleted_at,
      updated_at: body.updated_at,
      server_updated_at: new Date().toISOString(),
    };
    store = store.map((task) => (task.id === id ? nextTask : task));

    return HttpResponse.json(nextTask);
  }),
];
