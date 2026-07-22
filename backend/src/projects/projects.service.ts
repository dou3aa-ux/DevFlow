import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Project } from './entities/project/project';
import { User } from '../users/entities/user/user';

@Injectable()
export class ProjectsService {
    constructor(
    @InjectRepository(Project)
    private projectsRepository: Repository<Project>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    ) {}

    async create(createProjectDto: any, userId: number): Promise<Project> {
    const project = this.projectsRepository.create({
        ...createProjectDto,
    } as Project);

    const savedProject = await this.projectsRepository.save(project);

    const creator = await this.usersRepository.findOne({ where: { id: userId } });
    if (creator) {
        savedProject.members = [creator];
        await this.projectsRepository.save(savedProject);
    }

    return savedProject;
    }

    async findAll(userId: number): Promise<Project[]> {
    return this.projectsRepository.find({
        relations: { members: true },
        where: {
        members: { id: userId },
        },
    });
    }

    async findOne(id: number): Promise<Project> {
    const project = await this.projectsRepository.findOne({
        where: { id },
        relations: { members: true },
    });

    if (!project) {
        throw new NotFoundException(`Project with ID ${id} not found`);
    }

    return project;
    }

    async update(id: number, updateProjectDto: any): Promise<Project> {
        await this.findOne(id);
        await this.projectsRepository.update(id, updateProjectDto);
        return this.findOne(id);
    }

    async remove(id: number): Promise<{ message: string }> {
        await this.findOne(id);
        await this.projectsRepository.delete(id);
        return { message: 'Project deleted successfully' };
    }

    async addMember(projectId: number, userId: number): Promise<Project> {
    const project = await this.findOne(projectId);
    const user = await this.usersRepository.findOne({ where: { id: userId } });

    if (!user) throw new NotFoundException('User not found');

    if (!project.members) project.members = [];

    const alreadyMember = project.members.some((m) => m.id === user.id);
    if (!alreadyMember) {
        project.members.push(user);
    }

    return this.projectsRepository.save(project);
    }
}