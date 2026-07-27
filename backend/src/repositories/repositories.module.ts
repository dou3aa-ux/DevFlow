import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RepositoriesService } from './repositories.service';
import { RepositoriesController } from './repositories.controller';
import { Repository } from './entities/repository.entity';
import { Commit } from './entities/commit.entity';
import { Project } from '../projects/entities/project/project';

@Module({
  imports: [TypeOrmModule.forFeature([Repository, Commit, Project])],
  controllers: [RepositoriesController],
  providers: [RepositoriesService],
  exports: [RepositoriesService],
})
export class RepositoriesModule {}