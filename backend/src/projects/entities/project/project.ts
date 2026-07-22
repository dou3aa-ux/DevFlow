import { Entity, PrimaryGeneratedColumn, Column, ManyToMany, JoinTable, CreateDateColumn } from 'typeorm';
import { User } from '../../../users/entities/user/user';

export enum ProjectStatus {
    PLANNING = 'PLANNING',
    ACTIVE = 'ACTIVE',
    ON_HOLD = 'ON_HOLD',
    COMPLETED = 'COMPLETED',
    ARCHIVED = 'ARCHIVED',
}

@Entity('projects')
export class Project {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    name!: string;

    @Column({ nullable: true })
    description!: string;

    @Column({ type: 'enum', enum: ProjectStatus, default: ProjectStatus.PLANNING })
    status!: ProjectStatus;

    @ManyToMany(() => User, (user) => user.projects, { cascade: true })
    @JoinTable()
    members!: User[];

    @CreateDateColumn({ type: 'timestamp' })
    createdAt!: Date;
}