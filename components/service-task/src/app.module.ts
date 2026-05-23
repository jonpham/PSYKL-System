import { Module } from '@nestjs/common';
import { TaskModule } from './task/task.module.js';

@Module({
  imports: [TaskModule],
})
export class AppModule {}
