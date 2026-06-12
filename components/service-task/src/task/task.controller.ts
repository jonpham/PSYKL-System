import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import {
  type TaskDeleteInput,
  TaskDeleteInputSchema,
  type TaskInput,
  TaskInputSchema,
  type TaskPatchInput,
  TaskPatchInputSchema,
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
  async list(
    @Req() req: RequestWithUser,
    @Query('include_deleted') includeDeleted: string | undefined,
  ): Promise<TaskResponse[]> {
    return this.tasks.listTasks(req.userId!, { includeDeleted: this.parseIncludeDeleted(includeDeleted) });
  }

  @Patch(':id')
  async patch(
    @Req() req: RequestWithUser,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(TaskPatchInputSchema)) body: TaskPatchInput,
  ): Promise<TaskResponse> {
    return this.tasks.patchTask(req.userId!, id, body);
  }

  @Delete(':id')
  async delete(
    @Req() req: RequestWithUser,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(TaskDeleteInputSchema)) body: TaskDeleteInput,
  ): Promise<TaskResponse> {
    return this.tasks.deleteTask(req.userId!, id, body);
  }

  private parseIncludeDeleted(value: string | undefined): boolean {
    if (value === undefined || value === '0') {
      return false;
    }

    if (value === '1') {
      return true;
    }

    throw new BadRequestException('include_deleted must be 0 or 1');
  }
}
