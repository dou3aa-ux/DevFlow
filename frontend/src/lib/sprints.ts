import { api } from './api';

export interface Sprint {
    id: number;
    name: string;
    goal: string;
    startDate: string;
    endDate: string;
}

export const sprintsApi = {
    getAll: (projectId: number) =>
    api.get<Sprint[]>(`/sprints?projectId=${projectId}`).then((res) => res.data),
};