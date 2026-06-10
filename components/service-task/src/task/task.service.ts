import { Inject, Injectable } from '@nestjs/common';
import type { TaskInput, TaskResponse } from '@psykl/shared-types';
import { eq } from 'drizzle-orm';
import { schema, type Db } from '../db/index.js';

export const DB_TOKEN = Symbol('DB');

@Injectable()
export class TaskService {
  constructor(@Inject(DB_TOKEN) private readonly db: Db) {}

  async createTask(userId: string, input: TaskInput): Promise<TaskResponse> {
    const [row] = await this.db
      .insert(schema.tasks)
      .values({ id: input.id, userId, title: input.title, updatedAt: new Date(input.updated_at) })
      .returning();

    if (!row) {
      throw new Error('Insert returned no row');
    }

    return {
      id: row.id,
      user_id: row.userId,
      title: row.title,
      created_at: row.createdAt.toISOString(),
      completed_at: row.completedAt?.toISOString() ?? null,
      updated_at: row.updatedAt!.toISOString(),
      server_updated_at: row.serverUpdatedAt.toISOString(),
      deleted_at: row.deletedAt?.toISOString() ?? null,
    };
  }

  async listTasks(userId: string): Promise<TaskResponse[]> {
    const rows = await this.db.select().from(schema.tasks).where(eq(schema.tasks.userId, userId));

    return rows.map((row) => ({
      id: row.id,
      user_id: row.userId,
      title: row.title,
      created_at: row.createdAt.toISOString(),
      completed_at: row.completedAt?.toISOString() ?? null,
      updated_at: row.updatedAt!.toISOString(),
      server_updated_at: row.serverUpdatedAt.toISOString(),
      deleted_at: row.deletedAt?.toISOString() ?? null,
    }));
  }
}
