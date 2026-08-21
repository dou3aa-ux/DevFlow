import { api } from './api';

export type UserRole =
    | 'ADMINISTRATOR'
    | 'PROJECT_MANAGER'
    | 'DEVELOPER'
    | 'QA_TESTER'
    | 'STAKEHOLDER';

export interface AdminUser {
    id: number;
    username: string;
    email: string;
    role: UserRole;
    isActive: boolean;
    createdAt: string;
}

export interface AdminCreateUserPayload {
    username: string;
    email: string;
    password: string;
    role: UserRole;
}

export const usersApi = {
    getAll: () => api.get<AdminUser[]>('/users').then((r) => r.data),

    create: (payload: AdminCreateUserPayload) =>
    api.post<AdminUser>('/users', payload).then((r) => r.data),

    updateRole: (id: number, role: UserRole) =>
    api.patch<AdminUser>(`/users/${id}/role`, { role }).then((r) => r.data),

    updateStatus: (id: number, isActive: boolean) =>
    api.patch<AdminUser>(`/users/${id}/status`, { isActive }).then((r) => r.data),
};

export const ROLE_LABELS: Record<UserRole, string> = {
    ADMINISTRATOR: 'Administrator',
    PROJECT_MANAGER: 'Project Manager',
    DEVELOPER: 'Developer',
    QA_TESTER: 'QA Tester',
    STAKEHOLDER: 'Stakeholder',
};

export const ROLE_OPTIONS: UserRole[] = [
    'PROJECT_MANAGER',
    'DEVELOPER',
    'QA_TESTER',
    'STAKEHOLDER',
    'ADMINISTRATOR',
];