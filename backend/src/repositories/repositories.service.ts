import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository as TypeOrmRepository } from 'typeorm';
import { Repository } from './entities/repository.entity';
import { Commit } from './entities/commit.entity';
import { Project } from '../projects/entities/project/project';
import { CreateRepositoryDto } from './dto/create-repository.dto';

@Injectable()
export class RepositoriesService {
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
}