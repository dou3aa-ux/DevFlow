import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { Project } from '../../projects/entities/project/project';
import { Sprint } from '../../sprints/entities/sprint.entity';
import { User } from '../../users/entities/user/user';

export enum TaskStatus {
    TODO = 'TODO',
    IN_PROGRESS = 'IN_PROGRESS',
    IN_REVIEW = 'IN_REVIEW',
    DONE = 'DONE',
}

export enum TaskPriority {
    LOW = 'LOW',
    MEDIUM = 'MEDIUM',
    HIGH = 'HIGH',
    CRITICAL = 'CRITICAL',
}

@Entity('tasks')
export class Task {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    title!: string;

    @Column({ nullable: true })
    description!: string;

    @Column({ type: 'enum', enum: TaskStatus, default: TaskStatus.TODO })
    status!: TaskStatus;

    @Column({ type: 'enum', enum: TaskPriority, default: TaskPriority.MEDIUM })
    priority!: TaskPriority;

    @ManyToOne(() => Project, { onDelete: 'CASCADE' })
    project!: Project;

    @ManyToOne(() => Sprint, { nullable: true, onDelete: 'SET NULL' })
    sprint!: Sprint | null;

    @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
    assignee!: User | null;

    @CreateDateColumn({ type: 'timestamp' })
    createdAt!: Date;
}