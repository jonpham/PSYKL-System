import { http, HttpResponse } from 'msw';

import type { components } from '../api/types';

type List = components['schemas']['List'];

let listStore: List[] = [];

export function resetListStore() {
  listStore = [];
}

export const listHandlers = [
  http.get('*/lists', ({ request }) => {
    if (request.headers.get('x-user-id') !== 'local') {
      return new HttpResponse(null, { status: 401 });
    }

    return HttpResponse.json(listStore);
  }),

  http.post('*/lists', async ({ request }) => {
    if (request.headers.get('x-user-id') !== 'local') {
      return new HttpResponse(null, { status: 401 });
    }
    if (!request.headers.get('idempotency-key')) {
      return new HttpResponse(null, { status: 400 });
    }

    const body = (await request.json()) as { id?: string; title?: string; position?: string; updated_at?: string };
    if (!body.id || !body.title || !body.position || !body.updated_at) {
      return new HttpResponse(null, { status: 400 });
    }

    const now = new Date().toISOString();
    const list: List = {
      id: body.id,
      user_id: 'local',
      title: body.title,
      position: body.position,
      created_at: now,
      updated_at: body.updated_at,
      server_updated_at: now,
      deleted_at: null,
    };
    listStore = [...listStore, list];

    return HttpResponse.json(list, { status: 201 });
  }),

  http.patch('*/lists/:id', async ({ params, request }) => {
    if (request.headers.get('x-user-id') !== 'local') {
      return new HttpResponse(null, { status: 401 });
    }
    if (!request.headers.get('idempotency-key')) {
      return new HttpResponse(null, { status: 400 });
    }

    const id = String(params['id']);
    const existing = listStore.find((list) => list.id === id);
    if (!existing) {
      return new HttpResponse(null, { status: 404 });
    }

    const body = (await request.json()) as { title?: string; position?: string; updated_at?: string };
    if (!body.updated_at) {
      return new HttpResponse(null, { status: 400 });
    }

    const nextList: List = {
      ...existing,
      position: body.position ?? existing.position,
      title: body.title ?? existing.title,
      updated_at: body.updated_at,
      server_updated_at: new Date().toISOString(),
    };
    listStore = listStore.map((list) => (list.id === id ? nextList : list));

    return HttpResponse.json(nextList);
  }),

  http.delete('*/lists/:id', async ({ params, request }) => {
    if (request.headers.get('x-user-id') !== 'local') {
      return new HttpResponse(null, { status: 401 });
    }
    if (!request.headers.get('idempotency-key')) {
      return new HttpResponse(null, { status: 400 });
    }

    const id = String(params['id']);
    const existing = listStore.find((list) => list.id === id);
    if (!existing) {
      return new HttpResponse(null, { status: 404 });
    }

    const body = (await request.json()) as { deleted_at?: string; updated_at?: string };
    if (!body.deleted_at || !body.updated_at) {
      return new HttpResponse(null, { status: 400 });
    }

    const nextList: List = {
      ...existing,
      deleted_at: body.deleted_at,
      updated_at: body.updated_at,
      server_updated_at: new Date().toISOString(),
    };
    listStore = listStore.map((list) => (list.id === id ? nextList : list));

    return HttpResponse.json(nextList);
  }),
];
