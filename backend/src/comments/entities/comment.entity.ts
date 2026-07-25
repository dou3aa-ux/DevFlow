import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { Task } from '../../tasks/entities/task.entity';
import { User } from '../../users/entities/user/user';

@Entity('comments')
export class Comment {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ type: 'text' })
    content!: string;

    @ManyToOne(() => Task, { onDelete: 'CASCADE' })
    task!: Task;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    author!: User;

    @CreateDateColumn({ type: 'timestamp' })
    createdAt!: Date;
}