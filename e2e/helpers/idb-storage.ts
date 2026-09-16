import type { Page } from '@playwright/test';

import type { TaskRow } from './multi-device';

type BrowserStorageTarget = { page: Page };
type SyncQueueEntry = {
  entity_id: string;
  entity_type: 'list' | 'task';
  id: string;
  idempotency_key: string;
  op: string;
};

async function listLocalTasks(target: BrowserStorageTarget): Promise<TaskRow[]> {
  return readObjectStore<TaskRow>(target.page, 'tasks');
}

async function listLocalSyncQueue(target: BrowserStorageTarget): Promise<SyncQueueEntry[]> {
  return readObjectStore<SyncQueueEntry>(target.page, 'sync_queue');
}

/**
 * Seeds `count` fake sync_queue entries directly into IndexedDB, bypassing
 * the real create-Task UI flow — creating 100 real tasks through the form
 * per test run is too slow for CI. Callers must `page.reload()` afterward
 * so `useSyncDiscrepancy`'s mount-time read picks up the seeded depth (a
 * direct IDB write does not fire the app's in-memory change notifications).
 */
async function seedSyncQueue(target: BrowserStorageTarget, count: number): Promise<void> {
  await target.page.evaluate(async (n) => {
    type BrowserRequest = {
      error: unknown;
      onerror: (() => void) | null;
      onsuccess: (() => void) | null;
      result: any;
    };
    type BrowserTransaction = {
      objectStore: (store: string) => { put: (value: unknown) => void };
      onerror: (() => void) | null;
      oncomplete: (() => void) | null;
      error: unknown;
    };
    type BrowserDatabase = {
      close: () => void;
      transaction: (store: string, mode: 'readwrite') => BrowserTransaction;
    };
    const browserIndexedDb = (
      globalThis as typeof globalThis & {
        indexedDB: { open: (databaseName: string, version: number) => BrowserRequest };
      }
    ).indexedDB;
    const request = browserIndexedDb.open('psykl', 2);
    const db = await new Promise<BrowserDatabase>((resolve, reject) => {
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result as BrowserDatabase);
    });
    try {
      const transaction = db.transaction('sync_queue', 'readwrite');
      const store = transaction.objectStore('sync_queue');
      for (let index = 0; index < n; index += 1) {
        store.put({
          id: `e2e-seed-${index}-${Date.now()}`,
          entity_type: 'list',
          entity_id: `e2e-seed-list-${index}`,
          op: 'create',
          body: {},
          idempotency_key: `e2e-seed-idem-${index}`,
          attempts: 0,
          next_attempt_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
        });
      }
      await new Promise<void>((resolve, reject) => {
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
      });
    } finally {
      db.close();
    }
  }, count);
}

async function readObjectStore<T>(page: Page, storeName: string): Promise<T[]> {
  return page.evaluate(async (name) => {
    type BrowserRequest = {
      error: unknown;
      onerror: (() => void) | null;
      onsuccess: (() => void) | null;
      result: any;
    };
    type BrowserDatabase = {
      close: () => void;
      transaction: (
        store: string,
        mode: 'readonly',
      ) => {
        objectStore: (store: string) => {
          getAll: () => BrowserRequest;
        };
      };
    };
    const browserIndexedDb = (
      globalThis as typeof globalThis & {
        indexedDB: { open: (databaseName: string, version: number) => BrowserRequest };
      }
    ).indexedDB;
    const request = browserIndexedDb.open('psykl', 2);
    const db = await new Promise<BrowserDatabase>((resolve, reject) => {
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result as BrowserDatabase);
    });
    try {
      return await new Promise<T[]>((resolve, reject) => {
        const getAll = db.transaction(name, 'readonly').objectStore(name).getAll();
        getAll.onerror = () => reject(getAll.error);
        getAll.onsuccess = () => resolve(getAll.result as T[]);
      });
    } finally {
      db.close();
    }
  }, storeName);
}

export { listLocalSyncQueue, listLocalTasks, seedSyncQueue };
export type { SyncQueueEntry };
