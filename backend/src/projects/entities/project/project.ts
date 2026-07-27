import { Entity, PrimaryGeneratedColumn, Column, ManyToMany, JoinTable, CreateDateColumn,OneToOne } from 'typeorm';
import { User } from '../../../users/entities/user/user';
import { Repository } from '../../../repositories/entities/repository.entity';

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

    @OneToOne(() => Repository, (repo) => repo.project)
    repository!: Repository;
}