import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BugReport } from './entities/bug.entity';
import { Task } from '../tasks/entities/task.entity';
import { User } from '../users/entities/user/user';
import { CreateBugDto } from './dto/create-bug.dto';
import { UpdateBugDto } from './dto/update-bug.dto';

@Injectable()
export class BugsService {
  constructor(
    @InjectRepository(BugReport)
    private bugsRepository: Repository<BugReport>,
    @InjectRepository(Task)
    private tasksRepository: Repository<Task>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async create(taskId: number, reporterId: number, dto: CreateBugDto): Promise<BugReport> {
    const task = await this.tasksRepository.findOne({ where: { id: taskId } });
    if (!task) throw new NotFoundException(`Task ${taskId} not found`);

    const reportedBy = await this.usersRepository.findOne({ where: { id: reporterId } });
    if (!reportedBy) throw new NotFoundException(`User ${reporterId} not found`);

    const bug = this.bugsRepository.create({
      ...dto,
      task,
      reportedBy,
    });
    return this.bugsRepository.save(bug);
  }

  async findAllByTask(taskId: number): Promise<BugReport[]> {
    return this.bugsRepository.find({
      where: { task: { id: taskId } },
      relations: { reportedBy: true },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: number): Promise<BugReport> {
    const bug = await this.bugsRepository.findOne({
      where: { id },
      relations: { task: true, reportedBy: true },
    });
    if (!bug) throw new NotFoundException(`Bug ${id} not found`);
    return bug;
  }

  async update(id: number, dto: UpdateBugDto): Promise<BugReport> {
    await this.findOne(id);
    await this.bugsRepository.update(id, dto);
    return this.findOne(id);
  }

  async remove(id: number): Promise<{ message: string }> {
    await this.findOne(id);
    await this.bugsRepository.delete(id);
    return { message: 'Bug report deleted successfully' };
  }
}