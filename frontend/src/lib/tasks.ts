import { api } from './api';

export interface Task {
    id: number;
    title: string;
    description: string;
    status: 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE';
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export type Board = Record<Task['status'], Task[]>;

export const tasksApi = {
    getBoard: (projectId: number) =>
        api.get<Board>(`/tasks/board?projectId=${projectId}`).then((res) => res.data),
    create: (projectId: number, data: { title: string; description?: string; priority?: Task['priority'] }) =>
        api.post<Task>(`/tasks?projectId=${projectId}`, data).then((res) => res.data),
    updateStatus: (taskId: number, status: Task['status']) =>
        api.patch<Task>(`/tasks/${taskId}/status`, { status }).then((res) => res.data),
};