import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BugsService } from './bugs.service';
import { BugsController } from './bugs.controller';
import { BugReport } from './entities/bug.entity';
import { Task } from '../tasks/entities/task.entity';
import { User } from '../users/entities/user/user';

@Module({
  imports: [TypeOrmModule.forFeature([BugReport, Task, User])],
  controllers: [BugsController],
  providers: [BugsService],
  exports: [BugsService],
})
export class BugsModule {}