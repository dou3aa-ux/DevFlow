import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DeploymentsService } from './deployments.service';
import { DeploymentsController } from './deployments.controller';
import { Deployment } from './entities/deployment.entity';
import { Build } from '../builds/entities/build.entity';
import { Project } from '../projects/entities/project/project';

@Module({
  imports: [TypeOrmModule.forFeature([Deployment, Build, Project])],
  controllers: [DeploymentsController],
  providers: [DeploymentsService],
  exports: [DeploymentsService],
})
export class DeploymentsModule {}