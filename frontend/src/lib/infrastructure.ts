import { api } from './api';

export interface ContainerInfo {
  name: string;
  image: string;
  status: string;
  state: 'RUNNING' | 'STOPPED' | 'DEGRADED';
  cpuPercent: string;
  memPercent: string;
}

export const infrastructureApi = {
  getContainers: () => api.get<ContainerInfo[]>('/infrastructure/containers').then((res) => res.data),
};