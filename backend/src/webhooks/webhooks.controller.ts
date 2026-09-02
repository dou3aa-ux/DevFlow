import { Controller, Post, Body, Param, Headers, HttpCode, HttpStatus } from '@nestjs/common';
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
  async handleGithubWebhook(
    @Param('repositoryId') repositoryId: string,
    @Body() payload: any,
    @Headers('x-github-event') event: string,
    @Headers('x-hub-signature-256') signature: string,
  ) {
    console.log(`📡 Received GitHub event: ${event} for repo ${repositoryId}`);

    // ─── PUSH EVENT ───
    if (event === 'push') {
      const commits = payload.commits || [];
      const branch = payload.ref?.replace('refs/heads/', '') || 'unknown';
      let lastSha: string | null = null;

      // Save commits to DB
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

      // Trigger build
      let build: Build | null = null;
      if (lastSha) {
       // build = await this.buildsService.trigger(+repositoryId, lastSha);
        build = await this.buildsService.trigger(+repositoryId, lastSha, branch, commits[0]?.message);
        console.log(`🚀 Build triggered for ${branch} @ ${lastSha.slice(0, 7)}`);
      }

      return {
        received: true,
        event: 'push',
        branch,
        commitsProcessed: commits.length,
        buildTriggered: build?.id ?? null,
      };
    }

    // ─── PULL REQUEST EVENT ───
    if (event === 'pull_request') {
      const { action, pull_request } = payload;

      if (action === 'opened' || action === 'synchronize') {
        const build = await this.buildsService.trigger(
        +repositoryId,
        pull_request.head.sha,
        pull_request.head.ref,                    // branch name
        `PR #${pull_request.number}: ${pull_request.title}`,  // commit message
        );
        console.log(`🔀 PR #${pull_request.number} build triggered`);

        return {
          received: true,
          event: 'pull_request',
          action,
          prNumber: pull_request.number,
          buildTriggered: build?.id ?? null,
        };
      }

      return { received: true, event: 'pull_request', action, buildTriggered: null };
    }

    // ─── IGNORE OTHER EVENTS ───
    return { received: true, event, ignored: true };
  }
}