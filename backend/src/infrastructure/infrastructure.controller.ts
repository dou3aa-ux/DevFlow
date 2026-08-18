import { Controller, Get, UseGuards } from '@nestjs/common';
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
}