import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TasksService } from './tasks.service';
import { TasksController } from './tasks.controller';
import { Task } from './entities/task.entity';
import { Project } from '../projects/entities/project/project';
import { Sprint } from '../sprints/entities/sprint.entity';
import { User } from '../users/entities/user/user';

@Module({
  imports: [TypeOrmModule.forFeature([Task, Project, Sprint, User])],
  controllers: [TasksController],
  providers: [TasksService],
  exports: [TasksService],
})
export class TasksModule {}