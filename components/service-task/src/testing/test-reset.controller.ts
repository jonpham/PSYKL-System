import { Controller, HttpCode, Inject, NotFoundException, Post } from '@nestjs/common';
import { sql } from 'drizzle-orm';

import type { Db } from '../db/index.js';
import { DB_TOKEN } from '../task/task.service.js';

/**
 * Opt-in flag for the test-only reset route. It is set by
 * `docker-compose.e2e.yml` and nowhere else: the base compose file, the
 * Dockerfile, and the deployed chart all leave it unset, so the route answers
 * 404 in every environment a user can reach.
 */
const TEST_RESET_FLAG = 'PSYKL_TEST_RESET';

function testResetEnabled(): boolean {
  return process.env[TEST_RESET_FLAG] === 'enabled';
}

/**
 * Wipes all server state so an end-to-end test starts from a clean service.
 *
 * Playwright already gives each test a fresh browser context, so local state is
 * isolated; the service is the only thing every test shares. Per-user isolation
 * would be the better answer and is what the Task specs do, but it is blocked
 * for Lists by the default-list id collision (GitHub issue #117), so the suite
 * shares one user and resets the service instead.
 */
@Controller()
export class TestResetController {
  constructor(@Inject(DB_TOKEN) private readonly db: Db) {}

  @Post('test/reset')
  @HttpCode(200)
  async reset(): Promise<{ reset: true }> {
    if (!testResetEnabled()) {
      throw new NotFoundException();
    }

    // One statement, so a test can never observe tasks cleared but lists not.
    // Idempotency records go too: a replayed key must not return a cached
    // response describing a row the reset removed.
    await this.db.execute(sql`truncate table tasks, lists, idempotency restart identity`);
    return { reset: true };
  }
}

export { TEST_RESET_FLAG, testResetEnabled };
