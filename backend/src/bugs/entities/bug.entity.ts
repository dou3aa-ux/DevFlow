import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { Task } from '../../tasks/entities/task.entity';
import { User } from '../../users/entities/user/user';
import { TaskPriority, TaskStatus } from '../../tasks/entities/task.entity';

@Entity('bug_reports')
export class BugReport {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    title!: string;

    @Column({ type: 'text', nullable: true })
    description!: string;

    @Column({ type: 'enum', enum: TaskPriority, default: TaskPriority.MEDIUM })
    severity!: TaskPriority;

    @Column({ type: 'enum', enum: TaskStatus, default: TaskStatus.TODO })
    status!: TaskStatus;

    @Column({ nullable: true })
    deviceInfo!: string;

    @Column({ nullable: true })
    screenshotUrl!: string;

    @ManyToOne(() => Task, { onDelete: 'CASCADE' })
    task!: Task;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    reportedBy!: User;

    @CreateDateColumn({ type: 'timestamp' })
    createdAt!: Date;
}