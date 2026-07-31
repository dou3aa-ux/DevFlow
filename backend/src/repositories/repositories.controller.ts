import { Controller, Get,Delete, Post, Body, Param, UseGuards, Query } from '@nestjs/common';
import { RepositoriesService } from './repositories.service';
import { CreateRepositoryDto } from './dto/create-repository.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth/jwt-auth.guard';

@Controller('repositories')
@UseGuards(JwtAuthGuard)
export class RepositoriesController {
  constructor(private readonly repositoriesService: RepositoriesService) {}

  @Post()
  linkToProject(@Query('projectId') projectId: string, @Body() dto: CreateRepositoryDto) {
    return this.repositoriesService.linkToProject(+projectId, dto);
  }

  @Get()
  findByProject(@Query('projectId') projectId: string) {
    return this.repositoriesService.findByProject(+projectId);
  }

  @Get(':id/commits')
  getCommits(@Param('id') id: string) {
    return this.repositoriesService.getCommits(+id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
  return this.repositoriesService.remove(+id);
}
}