import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { TaskDeleteInput, TaskInput, TaskPatchInput, TaskResponse } from '@psykl/shared-types';
import { and, eq, isNull } from 'drizzle-orm';
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

    return this.toResponse(row);
  }

  async listTasks(userId: string, options: { includeDeleted?: boolean } = {}): Promise<TaskResponse[]> {
    const rows = await this.db
      .select()
      .from(schema.tasks)
      .where(
        options.includeDeleted
          ? eq(schema.tasks.userId, userId)
          : and(eq(schema.tasks.userId, userId), isNull(schema.tasks.deletedAt)),
      );

    return rows.map((row) => this.toResponse(row));
  }

  async patchTask(userId: string, taskId: string, input: TaskPatchInput): Promise<TaskResponse> {
    const current = await this.findTaskForUser(userId, taskId);
    const updatedAt = this.clampFutureTimestamp(new Date(input.updated_at));

    if (updatedAt.getTime() <= current.updatedAt!.getTime()) {
      return this.toResponse(current);
    }

    const [row] = await this.db
      .update(schema.tasks)
      .set({
        ...(input.title !== undefined ? { title: input.title } : {}),
        ...(input.completed_at !== undefined
          ? { completedAt: input.completed_at === null ? null : new Date(input.completed_at) }
          : {}),
        updatedAt,
        serverUpdatedAt: new Date(),
      })
      .where(and(eq(schema.tasks.id, taskId), eq(schema.tasks.userId, userId)))
      .returning();

    if (!row) {
      throw new NotFoundException('Task not found');
    }

    return this.toResponse(row);
  }

  async deleteTask(userId: string, taskId: string, input: TaskDeleteInput): Promise<TaskResponse> {
    const current = await this.findTaskForUser(userId, taskId);
    const updatedAt = this.clampFutureTimestamp(new Date(input.updated_at));

    if (updatedAt.getTime() <= current.updatedAt!.getTime()) {
      return this.toResponse(current);
    }

    const [row] = await this.db
      .update(schema.tasks)
      .set({
        deletedAt: this.clampFutureTimestamp(new Date(input.deleted_at)),
        updatedAt,
        serverUpdatedAt: new Date(),
      })
      .where(and(eq(schema.tasks.id, taskId), eq(schema.tasks.userId, userId)))
      .returning();

    if (!row) {
      throw new NotFoundException('Task not found');
    }

    return this.toResponse(row);
  }

  private async findTaskForUser(userId: string, taskId: string) {
    const [row] = await this.db
      .select()
      .from(schema.tasks)
      .where(and(eq(schema.tasks.id, taskId), eq(schema.tasks.userId, userId)));

    if (!row) {
      throw new NotFoundException('Task not found');
    }

    return row;
  }

  private clampFutureTimestamp(timestamp: Date): Date {
    const now = new Date();
    const maxFuture = new Date(now.getTime() + 5 * 60 * 1000);
    return timestamp.getTime() > maxFuture.getTime() ? now : timestamp;
  }

  private toResponse(row: typeof schema.tasks.$inferSelect): TaskResponse {
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
}
