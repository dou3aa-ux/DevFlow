import { Injectable, NotFoundException, ConflictException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository as TypeOrmRepository } from 'typeorm';
import { Repository } from './entities/repository.entity';
import { Commit } from './entities/commit.entity';
import { Project } from '../projects/entities/project/project';
import { CreateRepositoryDto } from './dto/create-repository.dto';

@Injectable()
export class RepositoriesService {
  private readonly logger = new Logger(RepositoriesService.name);

  constructor(
    @InjectRepository(Repository)
    private reposRepository: TypeOrmRepository<Repository>,
    @InjectRepository(Commit)
    private commitsRepository: TypeOrmRepository<Commit>,
    @InjectRepository(Project)
    private projectsRepository: TypeOrmRepository<Project>,
  ) {}

  async linkToProject(projectId: number, dto: CreateRepositoryDto): Promise<Repository> {
    const project = await this.projectsRepository.findOne({
      where: { id: projectId },
      relations: { repository: true },
    });
    if (!project) throw new NotFoundException(`Project ${projectId} not found`);
    if (project.repository) throw new ConflictException('This project already has a linked repository');

    const repo = this.reposRepository.create({ ...dto, project });
    return this.reposRepository.save(repo);
  }

  async findAll(): Promise<Repository[]> {
    return this.reposRepository.find({
      relations: { project: true },
      order: { connectedAt: 'DESC' },
    });
  }

  async findByProject(projectId: number): Promise<Repository> {
    const repo = await this.reposRepository.findOne({ where: { project: { id: projectId } } });
    if (!repo) throw new NotFoundException(`No repository linked to project ${projectId}`);
    return repo;
  }

  async findOne(id: number): Promise<Repository> {
    const repo = await this.reposRepository.findOne({ where: { id } });
    if (!repo) throw new NotFoundException(`Repository ${id} not found`);
    return repo;
  }

  async getCommits(repositoryId: number): Promise<Commit[]> {
    return this.commitsRepository.find({
      where: { repository: { id: repositoryId } },
      order: { committedAt: 'DESC' },
    });
  }

  // Called by the webhook — saves a new commit, ignores duplicates by sha
  async saveCommit(repositoryId: number, sha: string, message: string, author: string, committedAt: Date): Promise<Commit> {
    const repository = await this.findOne(repositoryId);

    const existing = await this.commitsRepository.findOne({ where: { sha } });
    if (existing) return existing; // avoid duplicate inserts if GitHub resends the webhook

    const commit = this.commitsRepository.create({ sha, message, author, committedAt, repository });
    return this.commitsRepository.save(commit);
  }

  async remove(id: number): Promise<{ message: string }> {
  const repo = await this.findOne(id);
  await this.reposRepository.delete(repo.id);
  return { message: 'Repository unlinked successfully' };
}

  /**
   * Sync commits from the GitHub API into the local DB.
   * Strategy 1: GitHub REST API (works for public repos, or private with accessToken)
   * Strategy 2: git ls-remote fallback — gets the real HEAD SHA without cloning.
   */
  async syncCommitsFromGitHub(repositoryId: number): Promise<Commit[]> {
    const repo = await this.findOne(repositoryId);

    // ── Strategy 1: GitHub REST API ─────────────────────────────────────────
    const match = repo.url.match(/github\.com[/:]([^/]+\/[^/]+?)(?:\.git)?$/);
    if (match) {
      const repoPath = match[1];
      const apiUrl = `https://api.github.com/repos/${repoPath}/commits?per_page=20`;
      const headers: Record<string, string> = {
        Accept: 'application/vnd.github+json',
        'User-Agent': 'DevFlow-App/1.0',
        'X-GitHub-Api-Version': '2022-11-28',
      };
      if (repo.accessToken) headers['Authorization'] = `Bearer ${repo.accessToken}`;

      try {
        const res = await fetch(apiUrl, { headers });
        const body = await res.json() as any;
        this.logger.log(`GitHub API [${res.status}] for ${apiUrl}`);

        if (res.ok && Array.isArray(body) && body.length > 0) {
          const saved: Commit[] = [];
          for (const c of body) {
            const sha: string = c.sha;
            const message: string = c.commit?.message?.split('\n')[0] || '';
            const author: string = c.commit?.author?.name || c.author?.login || 'unknown';
            const committedAt = new Date(c.commit?.author?.date || Date.now());
            const commit = await this.saveCommit(repositoryId, sha, message, author, committedAt);
            saved.push(commit);
          }
          this.logger.log(`✅ Synced ${saved.length} commits via GitHub API for repo ${repositoryId}`);
          return saved;
        }

        // Log what went wrong so it shows in backend console
        if (!res.ok) {
          this.logger.warn(`⚠️  GitHub API error ${res.status}: ${JSON.stringify(body)}`);
        }
      } catch (err: any) {
        this.logger.error(`GitHub API fetch failed: ${err.message}`);
      }
    }

    // ── Strategy 2: git ls-remote (no clone, just reads remote refs) ────────
    this.logger.log(`🔁 Falling back to git ls-remote for ${repo.url}`);
    try {
      const sha = await this.getHeadShaViaLsRemote(repo.url, repo.accessToken);
      if (sha) {
        const commit = await this.saveCommit(
          repositoryId,
          sha,
          'Latest commit (synced via ls-remote)',
          'git',
          new Date(),
        );
        this.logger.log(`✅ Synced HEAD commit via ls-remote: ${sha.slice(0, 7)}`);
        return [commit];
      }
    } catch (err: any) {
      this.logger.error(`git ls-remote failed: ${err.message}`);
    }

    this.logger.warn(`❌ Could not sync commits for repo ${repositoryId} — no method succeeded`);
    return [];
  }

  /** Run "git ls-remote <url> HEAD" and return the SHA */
  private getHeadShaViaLsRemote(repoUrl: string, accessToken?: string): Promise<string | null> {
    return new Promise((resolve) => {
      const { spawn } = require('child_process');
      // Inject token into HTTPS URL if provided
      let url = repoUrl;
      if (accessToken && url.startsWith('https://')) {
        url = url.replace('https://', `https://${accessToken}@`);
      }
      const child = spawn('git', ['ls-remote', url, 'HEAD'], { shell: true });
      let output = '';
      child.stdout.on('data', (d: Buffer) => (output += d.toString()));
      child.on('close', () => {
        const sha = output.trim().split(/\s+/)[0] || null;
        resolve(sha && sha.length === 40 ? sha : null);
      });
      child.on('error', () => resolve(null));
    });
  }
}