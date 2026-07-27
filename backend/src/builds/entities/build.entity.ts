import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { Repository } from '../../repositories/entities/repository.entity';

export enum BuildStatus {
  PENDING = 'PENDING',
  RUNNING = 'RUNNING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
}

@Entity('builds')
export class Build {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  commitSha!: string;

  @Column({ nullable: true })
  version!: string;

  @Column({ type: 'enum', enum: BuildStatus, default: BuildStatus.PENDING })
  status!: BuildStatus;

  @Column({ type: 'text', nullable: true })
  logs!: string;

  @ManyToOne(() => Repository, { onDelete: 'CASCADE' })
  repository!: Repository;

  @CreateDateColumn({ type: 'timestamp' })
  startedAt!: Date;

  @Column({ type: 'timestamp', nullable: true })
  finishedAt!: Date;
}