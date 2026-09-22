import { openPsyklDb } from '../db/idb';

/**
 * Empties every object store rather than deleting the database.
 *
 * `deleteDB` is blocked for as long as any other connection is open, and a
 * background replay from the story before can still be holding one — the
 * delete then never lands, and the next story inherits that story's rows.
 * Clearing through a connection of our own cannot be blocked.
 */
async function clearLocalDatabase(): Promise<void> {
  await withDatabase(async (database) => {
    await Promise.all([...database.objectStoreNames].map((store) => database.clear(store)));
  });
}

/** Empties one store, for a story that must not inherit any of it. */
async function clearStore(name: 'lists' | 'tasks'): Promise<void> {
  await withDatabase(async (database) => {
    await database.clear(name);
  });
}

async function withDatabase(use: (database: Awaited<ReturnType<typeof openPsyklDb>>) => Promise<void>): Promise<void> {
  const database = await openPsyklDb();
  try {
    await use(database);
  } finally {
    database.close();
  }
}

export { clearLocalDatabase, clearStore };
