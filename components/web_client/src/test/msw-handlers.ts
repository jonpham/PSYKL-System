import { HttpResponse, http } from 'msw';
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

    const body = (await request.json()) as { title?: string };
    if (!body.title || body.title.length > 200) {
      return new HttpResponse(null, { status: 400 });
    }

    const task: Task = {
      id: `01940000-0000-7000-8000-${String(store.length).padStart(12, '0')}`,
      user_id: 'local',
      title: body.title,
      created_at: new Date().toISOString(),
    };
    store = [task, ...store];

    return HttpResponse.json(task, { status: 201 });
  }),
];
