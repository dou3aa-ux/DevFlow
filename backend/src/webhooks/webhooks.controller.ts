import { Controller, Post, Body, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { RepositoriesService } from '../repositories/repositories.service';
import { BuildsService } from '../builds/builds.service';
import { Build } from '../builds/entities/build.entity';

@Controller('webhooks')
export class WebhooksController {
  constructor(
    private readonly repositoriesService: RepositoriesService,
    private readonly buildsService: BuildsService,
  ) {}

  @Post('github/:repositoryId')
  @HttpCode(HttpStatus.ACCEPTED)
  async handleGithubPush(@Param('repositoryId') repositoryId: string, @Body() payload: any) {
    const commits = payload.commits || [];
    let lastSha: string | null = null;

    for (const c of commits) {
      await this.repositoriesService.saveCommit(
        +repositoryId,
        c.id,
        c.message,
        c.author?.name || 'unknown',
        new Date(c.timestamp),
      );
      lastSha = c.id;
    }

    let build: Build | null = null;
    if (lastSha) {
      build = await this.buildsService.trigger(+repositoryId, lastSha);
    }

    return { received: true, commitsProcessed: commits.length, buildTriggered: build?.id ?? null };
  }
}