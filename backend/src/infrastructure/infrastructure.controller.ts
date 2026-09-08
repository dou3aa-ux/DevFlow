import { Controller, Get, Post, Param, Query, UseGuards } from '@nestjs/common';
import { InfrastructureService } from './infrastructure.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth/jwt-auth.guard';

@Controller('infrastructure')
@UseGuards(JwtAuthGuard)
export class InfrastructureController {
  constructor(private readonly infrastructureService: InfrastructureService) {}

  @Get('containers')
  getContainers() {
    return this.infrastructureService.getContainers();
  }

  @Post('containers/:name/restart')
  restartContainer(@Param('name') name: string) {
    return this.infrastructureService.restartContainer(name);
  }

  @Get('containers/:name/logs')
  getContainerLogs(@Param('name') name: string, @Query('tail') tail?: string) {
    return this.infrastructureService.getContainerLogs(name, tail ? +tail : 100);
  }
}