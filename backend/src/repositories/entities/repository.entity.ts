import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, CreateDateColumn ,OneToOne, JoinColumn} from 'typeorm';
import { Project } from '../../projects/entities/project/project';
import { Commit } from './commit.entity';

export enum GitProvider {
    GITHUB = 'GITHUB',
    GITLAB = 'GITLAB',
}

@Entity('repositories')
export class Repository {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    url!: string;

    @Column({ type: 'enum', enum: GitProvider })
    provider!: GitProvider;

    @Column({ nullable: true })
    accessToken!: string;

    @OneToOne(() => Project, { onDelete: 'CASCADE' })@JoinColumn()
    project!: Project;

    @OneToMany(() => Commit, (commit) => commit.repository)
    commits!: Commit[];

    @CreateDateColumn({ type: 'timestamp' })
    connectedAt!: Date;
}