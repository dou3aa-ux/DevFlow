import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SprintsService } from './sprints.service';
import { SprintsController } from './sprints.controller';
import { Sprint } from './entities/sprint.entity';
import { Project } from '../projects/entities/project/project';

@Module({
  imports: [TypeOrmModule.forFeature([Sprint, Project])],
  controllers: [SprintsController],
  providers: [SprintsService],
  exports: [SprintsService],
})
export class SprintsModule {}