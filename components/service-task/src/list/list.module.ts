import { Module } from '@nestjs/common';

import { TaskModule } from '../task/task.module.js';
import { ListController } from './list.controller.js';
import { ListService } from './list.service.js';

/**
 * Imports TaskModule instead of re-providing DB_TOKEN. TaskModule already
 * creates and exports the single PGlite-backed DB_TOKEN provider; a second
 * `useFactory: async () => createDb()` here would open a second, disconnected
 * PGlite instance — Lists and Tasks would live in two different databases,
 * and in production two PGlite instances would race to open the same
 * PGLITE_DATA_DIR directory concurrently. See DevTask 3 brief -> Deviation 1.
 */
@Module({
  imports: [TaskModule],
  controllers: [ListController],
  providers: [ListService],
  exports: [ListService],
})
export class ListModule {}
