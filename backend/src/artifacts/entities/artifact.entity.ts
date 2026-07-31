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

    @Column()
    storageKey!: string; // the object name inside MinIO

    @OneToOne(() => Build)
    @JoinColumn()
    build!: Build;

    @CreateDateColumn({ type: 'timestamp' })
    createdAt!: Date;
}