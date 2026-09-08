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
  restartContainer: (name: string) =>
    api.post<{ success: boolean; message: string }>(`/infrastructure/containers/${name}/restart`).then((res) => res.data),
  getLogs: (name: string, tail?: number) =>
    api.get<{ logs: string }>(`/infrastructure/containers/${name}/logs${tail ? `?tail=${tail}` : ''}`).then((res) => res.data),
};