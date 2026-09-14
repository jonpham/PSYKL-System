import { Module } from '@nestjs/common';

import { DeletedController } from './deleted/deleted.controller.js';
import { IdempotencyModule } from './idempotency/idempotency.module.js';
import { ListModule } from './list/list.module.js';
import { TaskModule } from './task/task.module.js';
import { VersionModule } from './version/version.module.js';

@Module({
  imports: [TaskModule, ListModule, IdempotencyModule, VersionModule],
  controllers: [DeletedController],
})
export class AppModule {}
