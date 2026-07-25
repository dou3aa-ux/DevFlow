import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task, TaskStatus } from './entities/task.entity';
import { Project } from '../projects/entities/project/project';
import { Sprint } from '../sprints/entities/sprint.entity';
import { User } from '../users/entities/user/user';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private tasksRepository: Repository<Task>,
    @InjectRepository(Project)
    private projectsRepository: Repository<Project>,
    @InjectRepository(Sprint)
    private sprintsRepository: Repository<Sprint>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async create(projectId: number, dto: CreateTaskDto): Promise<Task> {
    const project = await this.projectsRepository.findOne({ where: { id: projectId } });
    if (!project) throw new NotFoundException(`Project ${projectId} not found`);

    const task = this.tasksRepository.create({
      title: dto.title,
      description: dto.description,
      priority: dto.priority,
      project,
    });

    if (dto.sprintId) {
      const sprint = await this.sprintsRepository.findOne({ where: { id: dto.sprintId } });
      if (!sprint) throw new NotFoundException(`Sprint ${dto.sprintId} not found`);
      task.sprint = sprint;
    }

    if (dto.assigneeId) {
      const assignee = await this.usersRepository.findOne({ where: { id: dto.assigneeId } });
      if (!assignee) throw new NotFoundException(`User ${dto.assigneeId} not found`);
      task.assignee = assignee;
    }

    return this.tasksRepository.save(task);
  }

  async findAllByProject(projectId: number): Promise<Task[]> {
    return this.tasksRepository.find({
      where: { project: { id: projectId } },
      relations: { project: true, sprint: true, assignee: true },
    });
  }

  async findOne(id: number): Promise<Task> {
    const task = await this.tasksRepository.findOne({
      where: { id },
      relations: { project: true, sprint: true, assignee: true },
    });
    if (!task) throw new NotFoundException(`Task ${id} not found`);
    return task;
  }

  async update(id: number, dto: UpdateTaskDto): Promise<Task> {
    const task = await this.findOne(id);

    if (dto.title !== undefined) task.title = dto.title;
    if (dto.description !== undefined) task.description = dto.description;
    if (dto.priority !== undefined) task.priority = dto.priority;

    if (dto.sprintId !== undefined) {
      const sprint = await this.sprintsRepository.findOne({ where: { id: dto.sprintId } });
      if (!sprint) throw new NotFoundException(`Sprint ${dto.sprintId} not found`);
      task.sprint = sprint;
    }

    if (dto.assigneeId !== undefined) {
      const assignee = await this.usersRepository.findOne({ where: { id: dto.assigneeId } });
      if (!assignee) throw new NotFoundException(`User ${dto.assigneeId} not found`);
      task.assignee = assignee;
    }

    return this.tasksRepository.save(task);
  }

  // Dedicated method for the Kanban drag-and-drop move
  async updateStatus(id: number, status: TaskStatus): Promise<Task> {
    const task = await this.findOne(id);
    task.status = status;
    return this.tasksRepository.save(task);
  }

  async remove(id: number): Promise<{ message: string }> {
    await this.findOne(id);
    await this.tasksRepository.delete(id);
    return { message: 'Task deleted successfully' };
  }

  // Powers the Kanban board view: tasks grouped by status
  async getBoardByProject(projectId: number) {
    const tasks = await this.findAllByProject(projectId);
    const board: Record<TaskStatus, Task[]> = {
      [TaskStatus.TODO]: [],
      [TaskStatus.IN_PROGRESS]: [],
      [TaskStatus.IN_REVIEW]: [],
      [TaskStatus.DONE]: [],
    };
    for (const task of tasks) {
      board[task.status].push(task);
    }
    return board;
  }
}