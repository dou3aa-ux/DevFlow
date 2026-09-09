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
   * Works without a public webhook — just calls the GitHub REST API directly.
   * Uses the repo's stored accessToken if available, falls back to unauthenticated.
   */
  async syncCommitsFromGitHub(repositoryId: number): Promise<Commit[]> {
    const repo = await this.findOne(repositoryId);

    // Parse owner/repo from URL, e.g. https://github.com/owner/repo or git@github.com:owner/repo.git
    const match = repo.url.match(/github\.com[/:]([^/]+\/[^/]+?)(?:\.git)?$/);
    if (!match) {
      this.logger.warn(`Cannot parse GitHub owner/repo from URL: ${repo.url}`);
      return [];
    }
    const repoPath = match[1];
    const apiUrl = `https://api.github.com/repos/${repoPath}/commits?per_page=20`;

    const headers: Record<string, string> = {
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    };
    if (repo.accessToken) {
      headers['Authorization'] = `Bearer ${repo.accessToken}`;
    }

    let data: any[];
    try {
      const res = await fetch(apiUrl, { headers });
      if (!res.ok) {
        this.logger.warn(`GitHub API returned ${res.status} for ${apiUrl}`);
        return [];
      }
      data = await res.json() as any[];
    } catch (err: any) {
      this.logger.error(`Failed to fetch commits from GitHub: ${err.message}`);
      return [];
    }

    const saved: Commit[] = [];
    for (const c of data) {
      const sha: string = c.sha;
      const message: string = c.commit?.message?.split('\n')[0] || '';
      const author: string = c.commit?.author?.name || c.author?.login || 'unknown';
      const committedAt = new Date(c.commit?.author?.date || Date.now());
      const commit = await this.saveCommit(repositoryId, sha, message, author, committedAt);
      saved.push(commit);
    }
    this.logger.log(`Synced ${saved.length} commits for repo ${repositoryId}`);
    return saved;
  }
}