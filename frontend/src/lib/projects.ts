import { api } from './api';
import type { AdminUser } from './users';

export interface Project {
  id: number;
  name: string;
  description: string;
  status: string;
  createdAt: string;
}

export interface ProjectMember {
  id: number;
  username: string;
  email: string;
  role: string;
}

export interface ProjectDetail extends Project {
  members: ProjectMember[];
}

export const projectsApi = {
  getAll: () => api.get<Project[]>('/projects').then((res) => res.data),

  getAllAdmin: () => api.get<Project[]>('/projects/admin/all').then((res) => res.data),

  getOne: (id: number) => api.get<ProjectDetail>(`/projects/${id}`).then((res) => res.data),

  create: (data: { name: string; description?: string; memberIds?: number[] }) =>
    api.post<Project>('/projects', data).then((res) => res.data),

  addMember: (projectId: number, userId: number) =>
    api.post(`/projects/${projectId}/members`, { userId }).then((res) => res.data),

  removeMember: (projectId: number, userId: number) =>
    api.delete(`/projects/${projectId}/members/${userId}`).then((res) => res.data),

  remove: (id: number) => api.delete(`/projects/${id}`).then((res) => res.data),
};