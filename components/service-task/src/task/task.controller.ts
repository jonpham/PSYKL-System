import { Body, Controller, Get, Inject, Post, Req } from '@nestjs/common';
import { TaskInputSchema, type TaskInput, type TaskResponse } from '@psykl/shared-types';
import { ZodValidationPipe } from 'nestjs-zod';
import { TaskService } from './task.service.js';

interface RequestWithUser {
  userId?: string;
}

@Controller('tasks')
export class TaskController {
  constructor(@Inject(TaskService) private readonly tasks: TaskService) {}

  @Post()
  async create(
    @Req() req: RequestWithUser,
    @Body(new ZodValidationPipe(TaskInputSchema)) body: TaskInput,
  ): Promise<TaskResponse> {
    // DevTask 3b replaces this local fallback with the global UserIdGuard.
    return this.tasks.createTask(req.userId ?? 'local', body);
  }

  @Get()
  async list(@Req() req: RequestWithUser): Promise<TaskResponse[]> {
    return this.tasks.listTasks(req.userId ?? 'local');
  }
}
