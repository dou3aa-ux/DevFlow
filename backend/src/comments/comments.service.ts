import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Comment } from './entities/comment.entity';
import { Task } from '../tasks/entities/task.entity';
import { User } from '../users/entities/user/user';
import { CreateCommentDto } from './dto/create-comment.dto';

@Injectable()
export class CommentsService {
  constructor(
    @InjectRepository(Comment)
    private commentsRepository: Repository<Comment>,
    @InjectRepository(Task)
    private tasksRepository: Repository<Task>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async create(taskId: number, authorId: number, dto: CreateCommentDto): Promise<Comment> {
    const task = await this.tasksRepository.findOne({ where: { id: taskId } });
    if (!task) throw new NotFoundException(`Task ${taskId} not found`);

    const author = await this.usersRepository.findOne({ where: { id: authorId } });
    if (!author) throw new NotFoundException(`User ${authorId} not found`);

    const comment = this.commentsRepository.create({
      content: dto.content,
      task,
      author,
    });
    return this.commentsRepository.save(comment);
  }

  async findAllByTask(taskId: number): Promise<Comment[]> {
    return this.commentsRepository.find({
      where: { task: { id: taskId } },
      relations: { author: true },
      order: { createdAt: 'ASC' },
    });
  }

  async remove(id: number): Promise<{ message: string }> {
    const comment = await this.commentsRepository.findOne({ where: { id } });
    if (!comment) throw new NotFoundException(`Comment ${id} not found`);
    await this.commentsRepository.delete(id);
    return { message: 'Comment deleted successfully' };
  }
}