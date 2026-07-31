import { Controller, Get, Post, Body, Param, UseGuards, Query } from '@nestjs/common';
import { DeploymentsService } from './deployments.service';
import { CreateDeploymentDto } from './dto/create-deployment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth/jwt-auth.guard';

@Controller('deployments')
@UseGuards(JwtAuthGuard)
export class DeploymentsController {
  constructor(private readonly deploymentsService: DeploymentsService) {}

  @Post()
  deploy(@Body() dto: CreateDeploymentDto) {
    return this.deploymentsService.deploy(dto.buildId, dto.environment);
  }

  @Get()
  findAllByProject(@Query('projectId') projectId: string) {
    return this.deploymentsService.findAllByProject(+projectId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.deploymentsService.findOne(+id);
  }

  @Get(':id/health')
  checkHealth(@Param('id') id: string) {
    return this.deploymentsService.checkHealth(+id);
  }

  @Post(':id/rollback')
  rollback(@Param('id') id: string) {
    return this.deploymentsService.rollback(+id);
  }
}