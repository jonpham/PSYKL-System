import { v7 as uuidv7 } from 'uuid';

import type { Db } from '../../src/db/index.js';
import { schema } from '../../src/db/index.js';
import { ListService } from '../../src/list/list.service.js';

export async function insertList(
  db: Db,
  input: {
    id?: string;
    userId?: string;
    title: string;
    position?: string;
    updatedAt: Date;
    deletedAt?: Date;
  },
): Promise<string> {
  const id = input.id ?? uuidv7();
  await db.insert(schema.lists).values({
    id,
    userId: input.userId ?? 'local',
    title: input.title,
    position: input.position ?? 'a0',
    updatedAt: input.updatedAt,
    deletedAt: input.deletedAt,
  });
  return id;
}

export function listService(db: Db): ListService {
  return new ListService(db);
}
