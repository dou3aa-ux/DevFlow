import { Controller, Get, Post, Body, Patch, Param, Delete, Request, UseGuards, Query } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { UpdateTaskStatusDto } from './dto/update-task-status.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/enums/role.enum';

@Controller('tasks')
@UseGuards(JwtAuthGuard)
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.PROJECT_MANAGER, UserRole.ADMINISTRATOR)
  create(@Query('projectId') projectId: string, @Body() dto: CreateTaskDto) {
  return this.tasksService.create(+projectId, dto);
  }

  @Get()
  findAllByProject(@Query('projectId') projectId: string) {
    return this.tasksService.findAllByProject(+projectId);
  }

  @Get('board')
  getBoard(@Query('projectId') projectId: string) {
    return this.tasksService.getBoardByProject(+projectId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.tasksService.findOne(+id);
  }

  @Get('my-tasks')
  @UseGuards(JwtAuthGuard)
  async getMyTasks(@Request() req) {
    const userId = req.user.userId;
    return this.tasksService.findByAssignee(userId);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateTaskDto) {
    return this.tasksService.update(+id, dto);
  }

  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body() dto: UpdateTaskStatusDto) {
    return this.tasksService.updateStatus(+id, dto.status);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.tasksService.remove(+id);
  }
}