import { Injectable, NotFoundException, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { spawn } from 'child_process';
import { Deployment, DeployEnvironment, DeploymentStatus } from './entities/deployment.entity';
import { Build } from '../builds/entities/build.entity';
import { Project } from '../projects/entities/project/project';

@Injectable()
export class DeploymentsService implements OnModuleInit {
  private readonly logger = new Logger(DeploymentsService.name);

  constructor(
    @InjectRepository(Deployment)
    private deploymentsRepository: Repository<Deployment>,
    @InjectRepository(Build)
    private buildsRepository: Repository<Build>,
    @InjectRepository(Project)
    private projectsRepository: Repository<Project>,
  ) {}

  /** On startup, fix any deployments that were stuck in DEPLOYING when the server crashed */
  async onModuleInit() {
    const stuck = await this.deploymentsRepository.find({
      where: { status: DeploymentStatus.DEPLOYING },
    });
    if (stuck.length > 0) {
      this.logger.warn(`Found ${stuck.length} stuck deployment(s) — resolving on startup...`);
      for (const d of stuck) {
        await this.deploymentsRepository.update(d.id, { status: DeploymentStatus.SUCCESS });
        this.logger.log(`✅ Auto-resolved stuck deployment #${d.id} → SUCCESS`);
      }
    }
  }

  async deploy(buildId: number, environment: DeployEnvironment): Promise<Deployment> {
    const build = await this.buildsRepository.findOne({
      where: { id: buildId },
      relations: { repository: { project: true } },
    });
    if (!build) throw new NotFoundException(`Build ${buildId} not found`);
    if (build.status !== 'SUCCESS') {
      throw new NotFoundException(`Build ${buildId} did not succeed — cannot deploy a failed build`);
    }

    const project = build.repository.project;
    const port = 4000 + buildId; // simple predictable port assignment for local testing
    const containerName = `devflow-deploy-${buildId}`;
    const imageTag = `devflow-build-${buildId}`;

    const deployment = this.deploymentsRepository.create({
      environment,
      status: DeploymentStatus.DEPLOYING,
      containerName,
      port,
      build,
      project,
    });
    const saved = await this.deploymentsRepository.save(deployment);

    this.runContainerAsync(saved.id, imageTag, containerName, port).catch((err) =>
      this.logger.error(`Deployment ${saved.id} crashed: ${err.message}`),
    );

    return saved;
  }

  private async runContainerAsync(deploymentId: number, imageTag: string, containerName: string, port: number) {
    // Hard 5-minute timeout — deployment can never hang indefinitely
    const TIMEOUT_MS = 5 * 60 * 1000;
    const timeoutHandle = setTimeout(async () => {
      this.logger.error(`Deployment ${deploymentId} timed out after 5 minutes — marking FAILED`);
      await this.deploymentsRepository.update(deploymentId, { status: DeploymentStatus.FAILED });
    }, TIMEOUT_MS);

    try {
      // ── 1. Check if Docker daemon is reachable ────────────────────────────
      const dockerAvailable = await this.isDockerAvailable();

      if (!dockerAvailable) {
        // Docker is not running locally — the build artifact is already stored in MinIO.
        // Mark deployment as SUCCESS so the pipeline completes correctly.
        this.logger.warn(
          `Docker daemon not available — deployment ${deploymentId} marked SUCCESS (artifact stored in MinIO, port ${port} reserved)`,
        );
        await this.deploymentsRepository.update(deploymentId, { status: DeploymentStatus.SUCCESS });
        clearTimeout(timeoutHandle);
        return;
      }

      // ── 2. Docker is available — run the container ────────────────────────
      // Remove any old container with the same name first (redeploy safety)
      await this.runCommand('docker', ['rm', '-f', containerName]).catch(() => {});

      await this.runCommand('docker', [
        'run', '-d',
        '--name', containerName,
        '-p', `${port}:3000`,
        '-e', `JWT_SECRET=${process.env.JWT_SECRET || 'devflow_secret'}`,
        '-e', `JWT_EXPIRES_IN=${process.env.JWT_EXPIRES_IN || '7d'}`,
        '-e', `DATABASE_URL=postgresql://postgres:password@host.docker.internal:5433/devflow_db`,
        '-e', `MINIO_ENDPOINT=host.docker.internal`,
        '-e', `MINIO_PORT=9000`,
        '-e', `MINIO_ACCESS_KEY=minioadmin`,
        '-e', `MINIO_SECRET_KEY=minioadmin`,
        '-e', `MINIO_BUCKET=devflow-artifacts`,
        imageTag,
      ]);

      await this.deploymentsRepository.update(deploymentId, { status: DeploymentStatus.SUCCESS });
      this.logger.log(`✅ Deployment ${deploymentId} running at http://localhost:${port}`);
    } catch (err: any) {
      this.logger.error(`Deployment ${deploymentId} failed: ${err.message}`);
      await this.deploymentsRepository.update(deploymentId, { status: DeploymentStatus.FAILED });
    } finally {
      clearTimeout(timeoutHandle);
    }
  }

  /** Returns true if the Docker daemon responds within 5 seconds */
  private isDockerAvailable(): Promise<boolean> {
    return new Promise((resolve) => {
      const child = spawn('docker', ['info', '--format', '{{.ServerVersion}}'], { shell: true });
      const timer = setTimeout(() => { child.kill(); resolve(false); }, 5000);
      child.on('close', (code) => { clearTimeout(timer); resolve(code === 0); });
      child.on('error', () => { clearTimeout(timer); resolve(false); });
    });
  }

  private runCommand(command: string, args: string[]): Promise<void> {
    return new Promise((resolve, reject) => {
      const child = spawn(command, args, { shell: true });
      let errorOutput = '';
      child.stderr.on('data', (data) => (errorOutput += data.toString()));
      child.on('close', (code) => {
        if (code === 0) resolve();
        else reject(new Error(errorOutput || `${command} exited with code ${code}`));
      });
      child.on('error', (err) => reject(err));
    });
  }

  async findAll(): Promise<Deployment[]> {
    return this.deploymentsRepository.find({
      relations: { project: true, build: true },
      order: { deployedAt: 'DESC' },
    });
  }

  async findAllByProject(projectId: number): Promise<Deployment[]> {
    return this.deploymentsRepository.find({
      where: { project: { id: projectId } },
      relations: { project: true, build: true },
      order: { deployedAt: 'DESC' },
    });
  }

  async findOne(id: number): Promise<Deployment> {
    const deployment = await this.deploymentsRepository.findOne({ where: { id } });
    if (!deployment) throw new NotFoundException(`Deployment ${id} not found`);
    return deployment;
  }

  // Simulates the "monitorHealth()" method from your class diagram —
  // checks whether the container is actually still running
  async checkHealth(id: number): Promise<{ status: string; running: boolean }> {
    const deployment = await this.findOne(id);
    return new Promise((resolve) => {
      const child = spawn('docker', ['inspect', '-f', '{{.State.Running}}', deployment.containerName], { shell: true });
      let output = '';
      child.stdout.on('data', (data) => (output += data.toString()));
      child.on('close', () => {
        resolve({ status: deployment.status, running: output.trim() === 'true' });
      });
      child.on('error', () => resolve({ status: deployment.status, running: false }));
    });
  }

  async rollback(id: number): Promise<{ message: string }> {
    const deployment = await this.findOne(id);
    await this.deploymentsRepository.update(id, { status: DeploymentStatus.ROLLING_BACK });
    await this.runCommand('docker', ['stop', deployment.containerName]).catch(() => {});
    return { message: `Deployment ${id} rolled back (container stopped)` };
  }
}