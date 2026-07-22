import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Sprint } from './entities/sprint.entity';
import { Project } from '../projects/entities/project/project';
import { CreateSprintDto } from './dto/create-sprint.dto';
import { UpdateSprintDto } from './dto/update-sprint.dto';

@Injectable()
export class SprintsService {
  constructor(
    @InjectRepository(Sprint)
    private sprintsRepository: Repository<Sprint>,
    @InjectRepository(Project)
    private projectsRepository: Repository<Project>,
  ) {}

  async create(projectId: number, dto: CreateSprintDto): Promise<Sprint> {
    const project = await this.projectsRepository.findOne({ where: { id: projectId } });
    if (!project) throw new NotFoundException(`Project ${projectId} not found`);

    const sprint = this.sprintsRepository.create({
      ...dto,
      project,
    });
    return this.sprintsRepository.save(sprint);
  }

  async findAllByProject(projectId: number): Promise<Sprint[]> {
    return this.sprintsRepository.find({
      where: { project: { id: projectId } },
      relations: { project: true },
    });
  }

  async findOne(id: number): Promise<Sprint> {
    const sprint = await this.sprintsRepository.findOne({
      where: { id },
      relations: { project: true },
    });
    if (!sprint) throw new NotFoundException(`Sprint ${id} not found`);
    return sprint;
  }

  async update(id: number, dto: UpdateSprintDto): Promise<Sprint> {
    await this.findOne(id);
    await this.sprintsRepository.update(id, dto);
    return this.findOne(id);
  }

  async remove(id: number): Promise<{ message: string }> {
    await this.findOne(id);
    await this.sprintsRepository.delete(id);
    return { message: 'Sprint deleted successfully' };
  }
}