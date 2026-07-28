import type { Page } from '@playwright/test';

import type { TaskRow } from './multi-device';

type BrowserStorageTarget = { page: Page };
type SyncQueueEntry = { id: string; idempotency_key: string; op: string; task_id: string };

async function listLocalTasks(target: BrowserStorageTarget): Promise<TaskRow[]> {
  return readObjectStore<TaskRow>(target.page, 'tasks');
}

async function listLocalSyncQueue(target: BrowserStorageTarget): Promise<SyncQueueEntry[]> {
  return readObjectStore<SyncQueueEntry>(target.page, 'sync_queue');
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
    const request = browserIndexedDb.open('psykl', 1);
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

export { listLocalSyncQueue, listLocalTasks };
export type { SyncQueueEntry };
