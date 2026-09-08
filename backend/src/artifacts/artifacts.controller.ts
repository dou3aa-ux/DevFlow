import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ArtifactsService } from './artifacts.service';
import { ArtifactType } from './entities/artifact.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth/jwt-auth.guard';

@Controller('artifacts')
@UseGuards(JwtAuthGuard)
export class ArtifactsController {
  constructor(private readonly artifactsService: ArtifactsService) {}

  @Get()
  findAll(@Query('type') type?: ArtifactType) {
    return this.artifactsService.findAll(type);
  }

  @Post('release')
  createRelease(
    @Body()
    dto: {
      type: ArtifactType;
      version: string;
      releaseNotes?: string;
      fileSize?: string;
      downloadUrl?: string;
    },
  ) {
    return this.artifactsService.createRelease(dto);
  }

  @Get('build/:buildId')
  findByBuild(@Param('buildId') buildId: string) {
    return this.artifactsService.findByBuild(+buildId);
  }

  @Get(':id/download')
  getDownloadUrl(@Param('id') id: string) {
    return this.artifactsService.getDownloadUrl(+id);
  }
}