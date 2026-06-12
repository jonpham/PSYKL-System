import { v7 as uuidv7 } from 'uuid';

import { createDb, type Db, schema } from '../../src/db/index.js';
import { TaskService } from '../../src/task/task.service.js';

export async function createIntegrationDb(): Promise<Db> {
  delete process.env.PGLITE_DATA_DIR;
  return createDb();
}

export async function insertTask(
  db: Db,
  input: {
    id?: string;
    userId?: string;
    title: string;
    updatedAt: Date;
    deletedAt?: Date;
  },
): Promise<string> {
  const id = input.id ?? uuidv7();
  await db.insert(schema.tasks).values({
    id,
    userId: input.userId ?? 'local',
    title: input.title,
    updatedAt: input.updatedAt,
    deletedAt: input.deletedAt,
  });
  return id;
}

export function taskService(db: Db): TaskService {
  return new TaskService(db);
}
