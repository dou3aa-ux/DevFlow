import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { Build } from '../../builds/entities/build.entity';
import { Project } from '../../projects/entities/project/project';

export enum DeployEnvironment {
    PREVIEW = 'PREVIEW',
    STAGING = 'STAGING',
    PRODUCTION = 'PRODUCTION',
}

export enum DeploymentStatus {
    DEPLOYING = 'DEPLOYING',
    SUCCESS = 'SUCCESS',
    FAILED = 'FAILED',
    ROLLING_BACK = 'ROLLING_BACK',
}

@Entity('deployments')
export class Deployment {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ type: 'enum', enum: DeployEnvironment, default: DeployEnvironment.PREVIEW })
    environment!: DeployEnvironment;

    @Column({ type: 'enum', enum: DeploymentStatus, default: DeploymentStatus.DEPLOYING })
    status!: DeploymentStatus;

    @Column({ nullable: true })
    containerName!: string;

    @Column({ nullable: true })
    port!: number;

    @ManyToOne(() => Build)
    build!: Build;

    @ManyToOne(() => Project, { onDelete: 'CASCADE' })
    project!: Project;

    @CreateDateColumn({ type: 'timestamp' })
    deployedAt!: Date;
}