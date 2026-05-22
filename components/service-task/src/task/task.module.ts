import { Module } from '@nestjs/common';
import { createDb } from '../db/index.js';
import { TaskController } from './task.controller.js';
import { DB_TOKEN, TaskService } from './task.service.js';

@Module({
  controllers: [TaskController],
  providers: [
    TaskService,
    {
      provide: DB_TOKEN,
      useFactory: async () => createDb(),
    },
  ],
  exports: [TaskService],
})
export class TaskModule {}
