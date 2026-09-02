import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { TaskDeleteInput, TaskInput, TaskPatchInput, TaskResponse, TaskRestoreInput } from '@psykl/shared-types';
import { and, eq, gte, isNotNull, isNull } from 'drizzle-orm';

import { clampFutureTimestamp } from '../db/clamp-future-timestamp.js';
import { type Db, schema } from '../db/index.js';

export const DB_TOKEN = Symbol('DB');

// 30-day Recently Deleted retention window. See DESIGN.md -> Offline Posture.
const RECENTLY_DELETED_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;

@Injectable()
export class TaskService {
  constructor(@Inject(DB_TOKEN) private readonly db: Db) {}

  async createTask(userId: string, input: TaskInput): Promise<TaskResponse> {
    const [row] = await this.db
      .insert(schema.tasks)
      .values({
        id: input.id,
        userId,
        title: input.title,
        updatedAt: clampFutureTimestamp(new Date(input.updated_at)),
        listId: input.list_id ?? null,
      })
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
    const updatedAt = clampFutureTimestamp(new Date(input.updated_at));

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
        ...(input.list_id !== undefined ? { listId: input.list_id } : {}),
        deletedAt: null,
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
    const updatedAt = clampFutureTimestamp(new Date(input.updated_at));

    if (updatedAt.getTime() <= current.updatedAt!.getTime()) {
      return this.toResponse(current);
    }

    const [row] = await this.db
      .update(schema.tasks)
      .set({
        deletedAt: updatedAt,
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

  async restoreTask(userId: string, taskId: string, input: TaskRestoreInput): Promise<TaskResponse> {
    const current = await this.findTaskForUser(userId, taskId);
    const updatedAt = clampFutureTimestamp(new Date(input.updated_at));

    if (updatedAt.getTime() <= current.updatedAt!.getTime()) {
      return this.toResponse(current);
    }

    const [row] = await this.db
      .update(schema.tasks)
      .set({
        deletedAt: null,
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

  async listDeletedTasks(userId: string): Promise<TaskResponse[]> {
    const cutoff = new Date(Date.now() - RECENTLY_DELETED_WINDOW_MS);
    const rows = await this.db
      .select()
      .from(schema.tasks)
      .where(
        and(eq(schema.tasks.userId, userId), isNotNull(schema.tasks.deletedAt), gte(schema.tasks.deletedAt, cutoff)),
      );

    return rows.map((row) => this.toResponse(row));
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
      list_id: row.listId ?? null,
    };
  }
}
