import { api } from './api';

export interface Repository {
  id: number;
  url: string;
  provider: string;
  connectedAt: string;
}

export interface Commit {
  sha: string;
  message: string;
  author: string;
  committedAt: string;
}

export interface Build {
  id: number;
  commitSha: string;
  version: string;
  status: 'PENDING' | 'RUNNING' | 'SUCCESS' | 'FAILED';
  logs: string | null;
  startedAt: string;
  finishedAt: string | null;
}

export interface Deployment {
  id: number;
  environment: string;
  status: 'DEPLOYING' | 'SUCCESS' | 'FAILED' | 'ROLLING_BACK';
  port: number;
  deployedAt: string;
}

export const devopsApi = {
  getRepository: (projectId: number) =>
    api.get<Repository>(`/repositories?projectId=${projectId}`)
      .then((res) => res.data)
      .catch(() => null),

  linkRepository: (projectId: number, url: string, provider: string) =>
    api.post<Repository>(`/repositories?projectId=${projectId}`, { url, provider }).then((res) => res.data),

  getCommits: (repositoryId: number) =>
    api.get<Commit[]>(`/repositories/${repositoryId}/commits`).then((res) => res.data),

  getBuilds: (repositoryId: number) =>
    api.get<Build[]>(`/builds?repositoryId=${repositoryId}`).then((res) => res.data),

  getBuild: (buildId: number) =>
    api.get<Build>(`/builds/${buildId}`).then((res) => res.data),

  triggerBuild: (repositoryId: number, commitSha: string) =>
    api.post<Build>(`/builds/trigger?repositoryId=${repositoryId}&commitSha=${commitSha}`).then((res) => res.data),

  getDeployments: (projectId: number) =>
    api.get<Deployment[]>(`/deployments?projectId=${projectId}`).then((res) => res.data),

  deploy: (buildId: number, environment: string) =>
    api.post<Deployment>('/deployments', { buildId, environment }).then((res) => res.data),
};