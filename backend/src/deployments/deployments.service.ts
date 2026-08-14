import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { spawn } from 'child_process';
import { Deployment, DeployEnvironment, DeploymentStatus } from './entities/deployment.entity';
import { Build } from '../builds/entities/build.entity';
import { Project } from '../projects/entities/project/project';

@Injectable()
export class DeploymentsService {
  private readonly logger = new Logger(DeploymentsService.name);

  constructor(
    @InjectRepository(Deployment)
    private deploymentsRepository: Repository<Deployment>,
    @InjectRepository(Build)
    private buildsRepository: Repository<Build>,
    @InjectRepository(Project)
    private projectsRepository: Repository<Project>,
  ) {}

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
    try {
      // Remove any old container with the same name first (in case of a redeploy)
      await this.runCommand('docker', ['rm', '-f', containerName]).catch(() => {});

      // Run the image, mapping the container's port 3000 to a unique host port
     // await this.runCommand('docker', [
       // 'run', '-d',
       // '--name', containerName,
       // '-p', `${port}:3000`,
        //imageTag,
      //]);

      await this.runCommand('docker', [
      'run', '-d',
      '--name', containerName,
      '-p', `${port}:3000`,
      '-e', `JWT_SECRET=${process.env.JWT_SECRET}`,
      '-e', `JWT_EXPIRES_IN=${process.env.JWT_EXPIRES_IN}`,
      '-e', `DATABASE_URL=postgresql://postgres:password@host.docker.internal:5678/devflow_db`,
      '-e', `MINIO_ENDPOINT=host.docker.internal`,
      '-e', `MINIO_PORT=9000`,
      '-e', `MINIO_ACCESS_KEY=minioadmin`,
      '-e', `MINIO_SECRET_KEY=minioadmin`,
      '-e', `MINIO_BUCKET=devflow-artifacts`,
      imageTag,
      ]);

      await this.deploymentsRepository.update(deploymentId, { status: DeploymentStatus.SUCCESS });
      this.logger.log(`Deployment ${deploymentId} running at http://localhost:${port}`);
    } catch (err: any) {
      this.logger.error(`Deployment ${deploymentId} failed: ${err.message}`);
      await this.deploymentsRepository.update(deploymentId, { status: DeploymentStatus.FAILED });
    }
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

  async findAllByProject(projectId: number): Promise<Deployment[]> {
    return this.deploymentsRepository.find({
      where: { project: { id: projectId } },
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