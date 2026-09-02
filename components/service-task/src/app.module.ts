import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';

import { DeletedController } from './deleted/deleted.controller.js';
import { IdempotencyModule } from './idempotency/idempotency.module.js';
import { ListModule } from './list/list.module.js';
import { CLOCK_TOKEN, PurgeService } from './purge/purge.service.js';
import { TaskModule } from './task/task.module.js';
import { VersionModule } from './version/version.module.js';

@Module({
  imports: [TaskModule, ListModule, IdempotencyModule, VersionModule, ScheduleModule.forRoot()],
  controllers: [DeletedController],
  providers: [PurgeService, { provide: CLOCK_TOKEN, useValue: () => new Date() }],
})
export class AppModule {}
