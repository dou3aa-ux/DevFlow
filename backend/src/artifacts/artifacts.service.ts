import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Artifact, ArtifactType } from './entities/artifact.entity';
import { StorageService } from '../storage/storage.service';
import { Build } from '../builds/entities/build.entity';

@Injectable()
export class ArtifactsService {
  constructor(
    @InjectRepository(Artifact)
    private artifactsRepository: Repository<Artifact>,
    private storageService: StorageService,
  ) {}

  async saveArtifact(build: Build, type: ArtifactType, version: string, localFilePath: string): Promise<Artifact> {
    const objectName = `builds/${build.id}/${version}.tar`;
    await this.storageService.uploadFile(localFilePath, objectName);

    const artifact = this.artifactsRepository.create({
      type,
      version,
      storageKey: objectName,
      build,
    });
    return this.artifactsRepository.save(artifact);
  }

  async findByBuild(buildId: number): Promise<Artifact> {
    const artifact = await this.artifactsRepository.findOne({ where: { build: { id: buildId } } });
    if (!artifact) throw new NotFoundException(`No artifact found for build ${buildId}`);
    return artifact;
  }

  async getDownloadUrl(id: number): Promise<{ downloadUrl: string }> {
    const artifact = await this.artifactsRepository.findOne({ where: { id } });
    if (!artifact) throw new NotFoundException(`Artifact ${id} not found`);
    const downloadUrl = await this.storageService.getPresignedUrl(artifact.storageKey);
    return { downloadUrl };
  }
}