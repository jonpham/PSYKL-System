import { Inject, Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { and, isNotNull, lt } from 'drizzle-orm';

import { type Db, schema } from '../db/index.js';
import { DB_TOKEN } from '../task/task.service.js';

export const CLOCK_TOKEN = Symbol('CLOCK');
export type Clock = () => Date;

// 30-day Recently Deleted retention window. See DESIGN.md -> Offline Posture.
const RECENTLY_DELETED_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;

export interface PurgeResult {
  tasksPurged: number;
  listsPurged: number;
}

@Injectable()
export class PurgeService {
  private readonly logger = new Logger(PurgeService.name);

  constructor(
    @Inject(DB_TOKEN) private readonly db: Db,
    @Inject(CLOCK_TOKEN) private readonly clock: Clock,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async purgeExpiredTombstones(): Promise<PurgeResult> {
    const cutoff = new Date(this.clock().getTime() - RECENTLY_DELETED_WINDOW_MS);

    const purgedTasks = await this.db
      .delete(schema.tasks)
      .where(and(isNotNull(schema.tasks.deletedAt), lt(schema.tasks.deletedAt, cutoff)))
      .returning({ id: schema.tasks.id });
    for (const row of purgedTasks) {
      this.logger.log(`purged task ${row.id}`);
    }

    const purgedLists = await this.db
      .delete(schema.lists)
      .where(and(isNotNull(schema.lists.deletedAt), lt(schema.lists.deletedAt, cutoff)))
      .returning({ id: schema.lists.id });
    for (const row of purgedLists) {
      this.logger.log(`purged list ${row.id}`);
    }

    return { tasksPurged: purgedTasks.length, listsPurged: purgedLists.length };
  }
}
