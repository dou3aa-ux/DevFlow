import { Entity, PrimaryColumn, Column, ManyToOne } from 'typeorm';
import { Repository } from './repository.entity';

@Entity('commits')
export class Commit {
  @PrimaryColumn()
  sha!: string; // commit hash IS the primary key, matches your ERD

  @Column({ type: 'text' })
  message!: string;

  @Column()
  author!: string;

  @Column({ type: 'timestamp' })
  committedAt!: Date;

  @ManyToOne(() => Repository, (repo) => repo.commits, { onDelete: 'CASCADE' })
  repository!: Repository;
}