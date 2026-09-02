import { Body, Controller, Delete, Get, HttpCode, Inject, Param, Patch, Post, Req } from '@nestjs/common';
import {
  type List as ListResponse,
  type ListDeleteInput,
  ListDeleteInputSchema,
  type ListInput,
  ListInputSchema,
  type ListPatchInput,
  ListPatchInputSchema,
  type ListRestoreInput,
  ListRestoreInputSchema,
} from '@psykl/shared-types';
import { ZodValidationPipe } from 'nestjs-zod';

import { ListService } from './list.service.js';

interface RequestWithUser {
  userId?: string;
}

@Controller('lists')
export class ListController {
  constructor(@Inject(ListService) private readonly lists: ListService) {}

  @Post()
  async create(
    @Req() req: RequestWithUser,
    @Body(new ZodValidationPipe(ListInputSchema)) body: ListInput,
  ): Promise<ListResponse> {
    return this.lists.createList(req.userId!, body);
  }

  @Get()
  async list(@Req() req: RequestWithUser): Promise<ListResponse[]> {
    return this.lists.listLists(req.userId!);
  }

  @Patch(':id')
  async patch(
    @Req() req: RequestWithUser,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(ListPatchInputSchema)) body: ListPatchInput,
  ): Promise<ListResponse> {
    return this.lists.patchList(req.userId!, id, body);
  }

  @Delete(':id')
  async delete(
    @Req() req: RequestWithUser,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(ListDeleteInputSchema)) body: ListDeleteInput,
  ): Promise<ListResponse> {
    return this.lists.deleteList(req.userId!, id, body);
  }

  @Post(':id/restore')
  @HttpCode(200)
  async restore(
    @Req() req: RequestWithUser,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(ListRestoreInputSchema)) body: ListRestoreInput,
  ): Promise<ListResponse> {
    return this.lists.restoreList(req.userId!, id, body);
  }
}
