import { http, HttpResponse } from 'msw';

import type { Task } from '../api/client';

let store: Task[] = [];

export function resetStore() {
  store = [];
}

export const handlers = [
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
    };
    store = [task, ...store];

    return HttpResponse.json(task, { status: 201 });
  }),
];
