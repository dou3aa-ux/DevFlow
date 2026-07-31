import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ArtifactsService } from './artifacts.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth/jwt-auth.guard';

@Controller('artifacts')
@UseGuards(JwtAuthGuard)
export class ArtifactsController {
  constructor(private readonly artifactsService: ArtifactsService) {}

  @Get('build/:buildId')
  findByBuild(@Param('buildId') buildId: string) {
    return this.artifactsService.findByBuild(+buildId);
  }

  @Get(':id/download')
  getDownloadUrl(@Param('id') id: string) {
    return this.artifactsService.getDownloadUrl(+id);
  }
}