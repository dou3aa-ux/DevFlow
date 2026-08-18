import { Injectable } from '@nestjs/common';
import { spawn } from 'child_process';

export interface ContainerInfo {
  name: string;
  image: string;
  status: string;
  state: 'RUNNING' | 'STOPPED' | 'DEGRADED';
  cpuPercent: string;
  memPercent: string;
}

@Injectable()
export class InfrastructureService {
  private runCommand(command: string, args: string[]): Promise<string> {
    return new Promise((resolve, reject) => {
      const child = spawn(command, args, { shell: true });
      let output = '';
      let errorOutput = '';
      child.stdout.on('data', (data) => (output += data.toString()));
      child.stderr.on('data', (data) => (errorOutput += data.toString()));
      child.on('close', (code) => {
        if (code === 0) resolve(output);
        else reject(new Error(errorOutput || `${command} exited with code ${code}`));
      });
      child.on('error', (err) => reject(err));
    });
  }

  async getContainers(): Promise<ContainerInfo[]> {
    // List all containers (running + stopped), one JSON object per line
    const psOutput = await this.runCommand('docker', [
      'ps', '-a', '--format', '"{{json .}}"',
    ]);

    const containers = psOutput
      .trim()
      .split('\n')
      .filter(Boolean)
      .map((line) => JSON.parse(line.replace(/^"|"$/g, '').replace(/\\"/g, '"')));

    // Get live CPU/Mem stats for running containers only (docker stats hangs on stopped ones)
    let statsMap: Record<string, { cpu: string; mem: string }> = {};
    try {
      const statsOutput = await this.runCommand('docker', [
        'stats', '--no-stream', '--format', '"{{json .}}"',
      ]);
      statsOutput
        .trim()
        .split('\n')
        .filter(Boolean)
        .forEach((line) => {
          const s = JSON.parse(line.replace(/^"|"$/g, '').replace(/\\"/g, '"'));
          statsMap[s.Name] = { cpu: s.CPUPerc, mem: s.MemPerc };
        });
    } catch {
      // docker stats can fail if nothing is running; ignore and leave statsMap empty
    }

    return containers.map((c): ContainerInfo => {
      const isRunning = c.State === 'running';
      const stats = statsMap[c.Names];
      return {
        name: c.Names,
        image: c.Image,
        status: c.Status,
        state: isRunning ? 'RUNNING' : 'STOPPED',
        cpuPercent: stats?.cpu ?? '0.00%',
        memPercent: stats?.mem ?? '0.00%',
      };
    });
  }
}