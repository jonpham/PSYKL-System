import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type {
  List as ListResponse,
  ListDeleteInput,
  ListInput,
  ListPatchInput,
  ListRestoreInput,
} from '@psykl/shared-types';
import { and, eq, gte, isNotNull, isNull } from 'drizzle-orm';

import { clampFutureTimestamp } from '../db/clamp-future-timestamp.js';
import { type Db, schema } from '../db/index.js';
import { DB_TOKEN } from '../task/task.service.js';

// 30-day Recently Deleted retention window. See DESIGN.md -> Offline Posture.
const RECENTLY_DELETED_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;

@Injectable()
export class ListService {
  constructor(@Inject(DB_TOKEN) private readonly db: Db) {}

  async createList(userId: string, input: ListInput): Promise<ListResponse> {
    // onConflictDoNothing: two devices can race to create the same default-list
    // id (see list-persistence.integration.test.ts for why).
    const [inserted] = await this.db
      .insert(schema.lists)
      .values({
        id: input.id,
        userId,
        title: input.title,
        position: input.position,
        updatedAt: new Date(input.updated_at),
      })
      .onConflictDoNothing({ target: schema.lists.id })
      .returning();
    if (inserted) {
      return this.toResponse(inserted);
    }
    return this.toResponse(await this.requireList(userId, input.id));
  }

  async listLists(userId: string): Promise<ListResponse[]> {
    const rows = await this.db
      .select()
      .from(schema.lists)
      .where(and(eq(schema.lists.userId, userId), isNull(schema.lists.deletedAt)))
      .orderBy(schema.lists.position);
    return rows.map((row) => this.toResponse(row));
  }

  async patchList(userId: string, id: string, input: ListPatchInput): Promise<ListResponse> {
    const existing = await this.requireList(userId, id);
    const incoming = clampFutureTimestamp(new Date(input.updated_at));

    // Last-Write-Wins, matching TaskService.patchTask: a write that is not newer is
    // a silent no-op returning the stored row, NOT a 409. The client reconciles from
    // the response body. Diverging here would give Lists different semantics to Tasks.
    if (incoming.getTime() <= existing.updatedAt.getTime()) {
      return this.toResponse(existing);
    }

    const [row] = await this.db
      .update(schema.lists)
      .set({
        ...(input.title === undefined ? {} : { title: input.title }),
        ...(input.position === undefined ? {} : { position: input.position }),
        updatedAt: incoming,
        serverUpdatedAt: new Date(),
      })
      .where(and(eq(schema.lists.id, id), eq(schema.lists.userId, userId)))
      .returning();
    return this.toResponse(row!);
  }

  async deleteList(userId: string, id: string, input: ListDeleteInput): Promise<ListResponse> {
    await this.requireList(userId, id);
    const [row] = await this.db
      .update(schema.lists)
      .set({ deletedAt: new Date(input.deleted_at), serverUpdatedAt: new Date() })
      .where(and(eq(schema.lists.id, id), eq(schema.lists.userId, userId)))
      .returning();
    return this.toResponse(row!);
  }

  async restoreList(userId: string, id: string, input: ListRestoreInput): Promise<ListResponse> {
    const existing = await this.requireList(userId, id);
    const incoming = clampFutureTimestamp(new Date(input.updated_at));

    if (incoming.getTime() <= existing.updatedAt.getTime()) {
      return this.toResponse(existing);
    }

    const [row] = await this.db
      .update(schema.lists)
      .set({
        deletedAt: null,
        updatedAt: incoming,
        serverUpdatedAt: new Date(),
      })
      .where(and(eq(schema.lists.id, id), eq(schema.lists.userId, userId)))
      .returning();
    return this.toResponse(row!);
  }

  async listDeletedLists(userId: string): Promise<ListResponse[]> {
    const cutoff = new Date(Date.now() - RECENTLY_DELETED_WINDOW_MS);
    const rows = await this.db
      .select()
      .from(schema.lists)
      .where(
        and(eq(schema.lists.userId, userId), isNotNull(schema.lists.deletedAt), gte(schema.lists.deletedAt, cutoff)),
      )
      .orderBy(schema.lists.position);
    return rows.map((row) => this.toResponse(row));
  }

  private async requireList(userId: string, id: string) {
    const [row] = await this.db
      .select()
      .from(schema.lists)
      .where(and(eq(schema.lists.id, id), eq(schema.lists.userId, userId)));
    if (!row) {
      throw new NotFoundException('List not found');
    }
    return row;
  }

  private toResponse(row: typeof schema.lists.$inferSelect): ListResponse {
    return {
      id: row.id,
      user_id: row.userId,
      title: row.title,
      position: row.position,
      created_at: row.createdAt.toISOString(),
      updated_at: row.updatedAt.toISOString(),
      server_updated_at: row.serverUpdatedAt.toISOString(),
      deleted_at: row.deletedAt?.toISOString() ?? null,
    };
  }
}
