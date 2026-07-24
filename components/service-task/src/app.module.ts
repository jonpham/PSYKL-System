import { Module } from '@nestjs/common';

import { IdempotencyModule } from './idempotency/idempotency.module.js';
import { TaskModule } from './task/task.module.js';
import { VersionModule } from './version/version.module.js';

@Module({
  imports: [TaskModule, IdempotencyModule, VersionModule],
})
export class AppModule {}
