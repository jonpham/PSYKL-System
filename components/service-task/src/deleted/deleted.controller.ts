import { Controller, Get, Inject, Req } from '@nestjs/common';
import type { DeletedResponse } from '@psykl/shared-types';

import { ListService } from '../list/list.service.js';
import { TaskService } from '../task/task.service.js';

interface RequestWithUser {
  userId?: string;
}

@Controller()
export class DeletedController {
  constructor(
    @Inject(TaskService) private readonly tasks: TaskService,
    @Inject(ListService) private readonly lists: ListService,
  ) {}

  @Get('deleted')
  async listDeleted(@Req() req: RequestWithUser): Promise<DeletedResponse> {
    const [lists, tasks] = await Promise.all([
      this.lists.listDeletedLists(req.userId!),
      this.tasks.listDeletedTasks(req.userId!),
    ]);
    return { lists, tasks };
  }
}
