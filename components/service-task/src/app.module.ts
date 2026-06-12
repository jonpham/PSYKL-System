import { Module } from '@nestjs/common';

import { IdempotencyModule } from './idempotency/idempotency.module.js';
import { TaskModule } from './task/task.module.js';

@Module({
  imports: [TaskModule, IdempotencyModule],
})
export class AppModule {}
