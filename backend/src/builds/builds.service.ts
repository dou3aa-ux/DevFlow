import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository as TypeOrmRepository } from 'typeorm';
import { spawn } from 'child_process';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { Build, BuildStatus } from './entities/build.entity';
import { Repository } from '../repositories/entities/repository.entity';
import { ArtifactsService } from '../artifacts/artifacts.service';
import { ArtifactType } from '../artifacts/entities/artifact.entity';

@Injectable()
export class BuildsService {
  private readonly logger = new Logger(BuildsService.name);

  constructor(
    @InjectRepository(Build)
    private buildsRepository: TypeOrmRepository<Build>,
    @InjectRepository(Repository)
    private reposRepository: TypeOrmRepository<Repository>,
    private artifactsService: ArtifactsService,
  ) {}

  // Called by the webhook (or manually) — creates the Build record and kicks off the real work in the background
  async trigger(repositoryId: number, commitSha: string): Promise<Build> {
    const repository = await this.reposRepository.findOne({ where: { id: repositoryId } });
    if (!repository) throw new NotFoundException(`Repository ${repositoryId} not found`);

    const build = this.buildsRepository.create({
      repository,
      commitSha,
      version: commitSha.substring(0, 7),
      status: BuildStatus.PENDING,
    });
    const saved = await this.buildsRepository.save(build);

    // Fire and forget — don't make the webhook/caller wait for the whole build to finish
    this.runBuildAsync(saved.id, repository.url, commitSha).catch((err) =>
      this.logger.error(`Build ${saved.id} crashed: ${err.message}`),
    );

    return saved;
  }

  private async runBuildAsync(buildId: number, repoUrl: string, commitSha: string) {
    const workDir = path.join(os.tmpdir(), `devflow-build-${buildId}`);
    let logs = '';

    const appendLog = (chunk: string) => {
      logs += chunk;
    };

    try {
      await this.updateStatus(buildId, BuildStatus.RUNNING);

      // 1. Clone the repo
      appendLog(`\n=== Cloning ${repoUrl} ===\n`);
      await this.runCommand('git', ['clone', repoUrl, workDir], appendLog);

      // 2. Checkout the specific commit (if it's a real sha, not a test placeholder)
      appendLog(`\n=== Checking out ${commitSha} ===\n`);
      await this.runCommand('git', ['checkout', commitSha], appendLog, workDir);

      // 3. Build the Docker image
      const imageTag = `devflow-build-${buildId}`;
      const buildContext = path.join(workDir, 'backend'); // Dockerfile lives inside backend/
      appendLog(`\n=== Building Docker image: ${imageTag} ===\n`);
      await this.runCommand('docker', ['build', '-t', imageTag, '.'], appendLog, buildContext);

      // 4. Export the image to a tar file
      const tarPath = path.join(os.tmpdir(), `devflow-build-${buildId}.tar`);
      appendLog(`\n=== Exporting image to tar ===\n`);
      await this.runCommand('docker', ['save', '-o', tarPath, imageTag], appendLog);

      // 5. Upload the tar to MinIO and record it as an Artifact
      appendLog(`\n=== Uploading artifact to storage ===\n`);
      const build = await this.buildsRepository.findOne({ where: { id: buildId } });
      if (build) {
        await this.artifactsService.saveArtifact(build, ArtifactType.DOCKER_IMAGE, imageTag, tarPath);
      }
      fs.rm(tarPath, () => {}); // clean up the local tar file after upload

      appendLog(`\n=== Build ${buildId} SUCCESS ===\n`);
      await this.finish(buildId, BuildStatus.SUCCESS, logs);
    } catch (err: any) {
      appendLog(`\n=== Build ${buildId} FAILED: ${err.message} ===\n`);
      await this.finish(buildId, BuildStatus.FAILED, logs);
    } finally {
      // Clean up the cloned folder regardless of outcome
      fs.rm(workDir, { recursive: true, force: true }, () => {});
    }
  }

  // Runs a shell command and streams its output into the log buffer
  private runCommand(command: string, args: string[], onLog: (chunk: string) => void, cwd?: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const child = spawn(command, args, { cwd, shell: true });
      child.stdout.on('data', (data) => onLog(data.toString()));
      child.stderr.on('data', (data) => onLog(data.toString()));

      child.on('close', (code) => {
        if (code === 0) resolve();
        else reject(new Error(`${command} exited with code ${code}`));
      });

      child.on('error', (err) => reject(err));
    });
  }

  private async updateStatus(buildId: number, status: BuildStatus) {
    await this.buildsRepository.update(buildId, { status });
  }

  private async finish(buildId: number, status: BuildStatus, logs: string) {
    await this.buildsRepository.update(buildId, {
      status,
      logs,
      finishedAt: new Date(),
    });
  }

  async findAllByRepository(repositoryId: number): Promise<Build[]> {
    return this.buildsRepository.find({
      where: { repository: { id: repositoryId } },
      order: { startedAt: 'DESC' },
    });
  }

  async findOne(id: number): Promise<Build> {
    const build = await this.buildsRepository.findOne({ where: { id } });
    if (!build) throw new NotFoundException(`Build ${id} not found`);
    return build;
  }
}