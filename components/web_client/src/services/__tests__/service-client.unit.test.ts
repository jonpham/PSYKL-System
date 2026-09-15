import { describe, expect, it, vi } from 'vitest';

import type { EntityApiResult } from '../../api/tasks.api-client';
import type { SyncClient } from '../../sync/sync-client';
import { createServiceClient, type EntityApiClient } from '../service-client';

interface Widget {
  id: string;
  title: string;
}

const widget: Widget = { id: 'w1', title: 'Widget' };

function fakeApiClient(overrides: Partial<EntityApiClient<Widget, unknown, unknown, unknown>> = {}) {
  return {
    create: vi.fn(() => Promise.resolve<EntityApiResult<Widget>>({ data: widget, status: 201 })),
    delete: vi.fn(() => Promise.resolve<EntityApiResult<Widget>>({ data: widget, status: 200 })),
    list: vi.fn(() => Promise.resolve<EntityApiResult<Widget[]>>({ data: [widget], status: 200 })),
    patch: vi.fn(() => Promise.resolve<EntityApiResult<Widget>>({ data: widget, status: 200 })),
    restore: vi.fn(() => Promise.resolve<EntityApiResult<Widget>>({ data: widget, status: 200 })),
    ...overrides,
  };
}

function fakeSyncClient(overrides: Partial<SyncClient<Widget, unknown, unknown, unknown>> = {}) {
  return {
    create: vi.fn(() => Promise.resolve(widget)),
    delete: vi.fn(() => Promise.resolve()),
    list: vi.fn(() => Promise.resolve([widget])),
    listPending: vi.fn(() => Promise.resolve(['w1'])),
    patch: vi.fn(() => Promise.resolve(widget)),
    restore: vi.fn(() => Promise.resolve(widget)),
    ...overrides,
  };
}

describe('createServiceClient — offlineCapable: true', () => {
  it('routes create/patch/delete/restore/list/listPending to the sync client, never the api client', async () => {
    // Given
    const apiClient = fakeApiClient();
    const syncClient = fakeSyncClient();
    const client = createServiceClient({ apiClient, offlineCapable: true, syncClient });

    // When
    await client.create('w1', {}, widget);
    await client.patch('w1', {}, widget);
    await client.delete('w1', {}, widget);
    await client.restore('w1', {}, widget);
    await client.list();
    await client.listPending();

    // Then
    expect(syncClient.create).toHaveBeenCalledWith('w1', {}, widget);
    expect(syncClient.patch).toHaveBeenCalledWith('w1', {}, widget);
    expect(syncClient.delete).toHaveBeenCalledWith('w1', {}, widget);
    expect(syncClient.restore).toHaveBeenCalledWith('w1', {}, widget);
    expect(syncClient.list).toHaveBeenCalled();
    expect(syncClient.listPending).toHaveBeenCalled();
    expect(apiClient.create).not.toHaveBeenCalled();
    expect(apiClient.patch).not.toHaveBeenCalled();
    expect(apiClient.delete).not.toHaveBeenCalled();
    expect(apiClient.restore).not.toHaveBeenCalled();
    expect(apiClient.list).not.toHaveBeenCalled();
  });
});

describe('createServiceClient — offlineCapable: false', () => {
  it('routes create/patch/delete/list directly to the api client and unwraps {data}', async () => {
    // Given
    const apiClient = fakeApiClient();
    const client = createServiceClient({ apiClient, offlineCapable: false });

    // When
    const created = await client.create('w1', {}, widget);
    const patched = await client.patch('w1', {}, widget);
    await client.delete('w1', {}, widget);
    const restored = await client.restore('w1', {}, widget);
    const listed = await client.list();

    // Then
    expect(created).toEqual(widget);
    expect(patched).toEqual(widget);
    expect(restored).toEqual(widget);
    expect(listed).toEqual([widget]);
    expect(apiClient.create).toHaveBeenCalledWith({}, expect.any(String));
    expect(apiClient.patch).toHaveBeenCalledWith('w1', {}, expect.any(String));
    expect(apiClient.delete).toHaveBeenCalledWith('w1', {}, expect.any(String));
    expect(apiClient.restore).toHaveBeenCalledWith('w1', expect.any(String));
    expect(apiClient.list).toHaveBeenCalled();
  });

  it('listPending() is empty — direct-mode entities are never locally queued', async () => {
    // Given
    const apiClient = fakeApiClient();
    const client = createServiceClient({ apiClient, offlineCapable: false });

    // When / Then
    await expect(client.listPending()).resolves.toEqual([]);
  });

  it('throws when the api client returns an error instead of data', async () => {
    // Given
    const apiClient = fakeApiClient({
      create: vi.fn(() => Promise.resolve<EntityApiResult<Widget>>({ error: 'boom', status: 400 })),
    });
    const client = createServiceClient({ apiClient, offlineCapable: false });

    // When / Then
    await expect(client.create('w1', {}, widget)).rejects.toThrow();
  });
});
