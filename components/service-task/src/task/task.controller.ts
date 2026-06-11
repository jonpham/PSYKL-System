import { Body, Controller, Get, Inject, Param, Patch, Post, Req } from '@nestjs/common';
import {
  TaskInputSchema,
  TaskPatchInputSchema,
  type TaskInput,
  type TaskPatchInput,
  type TaskResponse,
} from '@psykl/shared-types';
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
    return this.tasks.createTask(req.userId!, body);
  }

  @Get()
  async list(@Req() req: RequestWithUser): Promise<TaskResponse[]> {
    return this.tasks.listTasks(req.userId!);
  }

  @Patch(':id')
  async patch(
    @Req() req: RequestWithUser,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(TaskPatchInputSchema)) body: TaskPatchInput,
  ): Promise<TaskResponse> {
    return this.tasks.patchTask(req.userId!, id, body);
  }
}
