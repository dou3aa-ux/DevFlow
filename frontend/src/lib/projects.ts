import { api } from './api';
import type { AdminUser } from './users';

export interface Project {
  id: number;
  name: string;
  description: string;
  status: string;
  createdAt: string;
  members?: AdminUser[];
}

export const projectsApi = {
  getAll: () => api.get<Project[]>('/projects').then((r) => r.data),

  getAllAdmin: () =>
    api.get<Project[]>('/projects/admin/all').then((r) => r.data),

  create: (data: {
  name: string;
  description?: string;
  memberIds?: number[];
}) => api.post<Project>('/projects', data).then((r) => r.data),

  addMember: (projectId: number, userId: number) =>
    api.post(`/projects/${projectId}/members`, { userId }).then((r) => r.data),

  removeMember: (projectId: number, userId: number) =>
    api.delete(`/projects/${projectId}/members/${userId}`).then((r) => r.data),
};