import { api } from './api';

export interface Project {
    id: number;
    name: string;
    description: string;
    status: string;
    createdAt: string;
}

export const projectsApi = {
    getAll: () => api.get<Project[]>('/projects').then((res) => res.data),
    create: (data: { name: string; description?: string }) =>
    api.post<Project>('/projects', data).then((res) => res.data),
};