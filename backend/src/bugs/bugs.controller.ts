import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query, Req } from '@nestjs/common';
import { BugsService } from './bugs.service';
import { CreateBugDto } from './dto/create-bug.dto';
import { UpdateBugDto } from './dto/update-bug.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth/jwt-auth.guard';

@Controller('bugs')
@UseGuards(JwtAuthGuard)
export class BugsController {
  constructor(private readonly bugsService: BugsService) {}

  @Post()
  create(@Query('taskId') taskId: string, @Body() dto: CreateBugDto, @Req() req: any) {
    const reporterId = req.user.userId;
    return this.bugsService.create(+taskId, reporterId, dto);
  }

  @Get()
  findAll(
    @Query('taskId') taskId?: string,
    @Query('projectId') projectId?: string,
  ) {
    if (taskId) {
      return this.bugsService.findAllByTask(+taskId);
    }
    return this.bugsService.findAll(projectId ? +projectId : undefined);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.bugsService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateBugDto) {
    return this.bugsService.update(+id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.bugsService.remove(+id);
  }
}