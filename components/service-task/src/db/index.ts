import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';
import { migrate } from 'drizzle-orm/pglite/migrator';
import * as schema from './schema/index.js';

/**
 * Build a Drizzle client backed by pglite (in-process PostgreSQL via WebAssembly).
 *
 * Honors Decision #25:
 *   - process.env.PGLITE_DATA_DIR set: filesystem-backed persistence.
 *   - process.env.PGLITE_DATA_DIR unset: in-memory mode for integration tests.
 */
export async function createDb() {
  const dataDir = process.env.PGLITE_DATA_DIR;
  const pglite = dataDir ? new PGlite(dataDir) : new PGlite();
  await pglite.waitReady;
  const db = drizzle(pglite, { schema });
  await migrate(db, { migrationsFolder: './drizzle/migrations' });
  return db;
}

export type Db = Awaited<ReturnType<typeof createDb>>;

export { schema };
