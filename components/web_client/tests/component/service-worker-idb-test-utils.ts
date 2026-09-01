import type { Page } from '@playwright/test';

const taskId = '0198f5c9-52f2-7000-8000-000000000010';

async function seedSyncQueue(page: Page, input: { id: string; taskTitle: string }): Promise<void> {
  await page.evaluate(
    async ({ id, taskIdValue, taskTitle }) => {
      const openDb = async () =>
        await new Promise<IDBDatabase>((resolve, reject) => {
          const request = indexedDB.open('psykl', 2);
          request.onerror = () => reject(request.error);
          request.onsuccess = () => resolve(request.result);
        });
      const put = async (db: IDBDatabase, storeName: string, value: unknown) =>
        await new Promise<void>((resolve, reject) => {
          const request = db.transaction(storeName, 'readwrite').objectStore(storeName).put(value);
          request.onerror = () => reject(request.error);
          request.onsuccess = () => resolve();
        });
      const db = await openDb();
      const now = new Date().toISOString();
      await put(db, 'sync_queue', {
        id,
        entity_type: 'task',
        entity_id: taskIdValue,
        op: 'create',
        body: { id: taskIdValue, title: taskTitle, updated_at: now },
        idempotency_key: '0198f5c9-52f2-7000-8000-000000000011',
        attempts: 0,
        next_attempt_at: now,
        created_at: now,
      });
      db.close();
    },
    { id: input.id, taskIdValue: taskId, taskTitle: input.taskTitle },
  );
}

async function seedReplayLock(page: Page): Promise<void> {
  await page.evaluate(async () => {
    const openDb = async () =>
      await new Promise<IDBDatabase>((resolve, reject) => {
        const request = indexedDB.open('psykl', 2);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
      });
    const put = async (db: IDBDatabase, storeName: string, value: unknown) =>
      await new Promise<void>((resolve, reject) => {
        const request = db.transaction(storeName, 'readwrite').objectStore(storeName).put(value);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve();
      });
    const db = await openDb();
    await put(db, 'sync_meta', {
      key: 'replay_lock',
      value: { owner: 'page', heartbeat_at: new Date().toISOString() },
    });
    db.close();
  });
}

async function readSyncQueueLength(page: Page): Promise<number> {
  return await page.evaluate(async () => {
    const openDb = async () =>
      await new Promise<IDBDatabase>((resolve, reject) => {
        const request = indexedDB.open('psykl', 2);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
      });
    const getAll = async (db: IDBDatabase, storeName: string) =>
      await new Promise<unknown[]>((resolve, reject) => {
        const request = db.transaction(storeName, 'readonly').objectStore(storeName).getAll();
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
      });
    const db = await openDb();
    const rows = await getAll(db, 'sync_queue');
    db.close();
    return rows.length;
  });
}

async function readTaskTitles(page: Page): Promise<string[]> {
  return await page.evaluate(async () => {
    const openDb = async () =>
      await new Promise<IDBDatabase>((resolve, reject) => {
        const request = indexedDB.open('psykl', 2);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
      });
    const getAll = async (db: IDBDatabase, storeName: string) =>
      await new Promise<unknown[]>((resolve, reject) => {
        const request = db.transaction(storeName, 'readonly').objectStore(storeName).getAll();
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
      });
    const db = await openDb();
    const rows = await getAll(db, 'tasks');
    db.close();
    return rows.map((row) => (row as { title: string }).title);
  });
}

export { readSyncQueueLength, readTaskTitles, seedReplayLock, seedSyncQueue };
