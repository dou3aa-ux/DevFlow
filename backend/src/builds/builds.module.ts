import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BuildsService } from './builds.service';
import { BuildsController } from './builds.controller';
import { Build } from './entities/build.entity';
import { Repository } from '../repositories/entities/repository.entity';
import { ArtifactsModule } from '../artifacts/artifacts.module';

@Module({
  imports: [TypeOrmModule.forFeature([Build, Repository]), ArtifactsModule],
  controllers: [BuildsController],
  providers: [BuildsService],
  exports: [BuildsService],
})
export class BuildsModule {}