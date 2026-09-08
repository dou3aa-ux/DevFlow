import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { Build } from '../../builds/entities/build.entity';

export enum ArtifactType {
    DOCKER_IMAGE = 'DOCKER_IMAGE',
    APK = 'APK',
    ZIP = 'ZIP',
    EXECUTABLE = 'EXECUTABLE',
}

@Entity('artifacts')
export class Artifact {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ type: 'enum', enum: ArtifactType })
    type!: ArtifactType;

    @Column()
    version!: string;

    @Column({ nullable: true })
    storageKey!: string; // the object name inside MinIO

    @Column({ type: 'text', nullable: true })
    releaseNotes?: string;

    @Column({ nullable: true })
    fileSize?: string;

    @Column({ nullable: true })
    downloadUrl?: string;

    @OneToOne(() => Build, { nullable: true })
    @JoinColumn()
    build?: Build;

    @CreateDateColumn({ type: 'timestamp' })
    createdAt!: Date;
}