import { Controller, Get, Post, Param, Request, UseGuards, Query } from '@nestjs/common';
import { BuildsService } from './builds.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth/jwt-auth.guard';

@Controller('builds')
@UseGuards(JwtAuthGuard)
export class BuildsController {
  constructor(private readonly buildsService: BuildsService) {}

  @Post('trigger')
  trigger(@Query('repositoryId') repositoryId: string, @Query('commitSha') commitSha: string) {
    return this.buildsService.trigger(+repositoryId, commitSha);
  }

  @Get()
  findAllByRepository(@Query('repositoryId') repositoryId: string) {
    return this.buildsService.findAllByRepository(+repositoryId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.buildsService.findOne(+id);
  }

  @Get('recent')
  @UseGuards(JwtAuthGuard)
  async getRecentBuilds(@Request() req) {
    // Get builds from repositories the user has access to
    // For now, return last 20 builds across all repos
    return this.buildsService.findRecent(20);
  }
}