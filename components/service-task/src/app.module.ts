import { Module } from '@nestjs/common';

import { IdempotencyModule } from './idempotency/idempotency.module.js';
import { ListModule } from './list/list.module.js';
import { TaskModule } from './task/task.module.js';
import { VersionModule } from './version/version.module.js';

@Module({
  imports: [TaskModule, ListModule, IdempotencyModule, VersionModule],
})
export class AppModule {}
