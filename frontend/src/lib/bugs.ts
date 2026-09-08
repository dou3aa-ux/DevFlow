import { api } from './api';

export type BugSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type BugStatus = 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE';

export interface BugReport {
  id: number;
  title: string;
  description?: string;
  severity: BugSeverity;
  status: BugStatus;
  deviceInfo?: string;
  screenshotUrl?: string;
  createdAt: string;
  task: {
    id: number;
    title: string;
    project?: {
      id: number;
      name: string;
    };
  };
  reportedBy: {
    id: number;
    username: string;
    email: string;
    role: string;
  };
}

export interface CreateBugPayload {
  title: string;
  description?: string;
  severity?: BugSeverity;
  deviceInfo?: string;
  screenshotUrl?: string;
}

export const bugsApi = {
  getAll: (projectId?: number, taskId?: number) => {
    const params = new URLSearchParams();
    if (projectId) params.append('projectId', String(projectId));
    if (taskId) params.append('taskId', String(taskId));
    const query = params.toString() ? `?${params.toString()}` : '';
    return api.get<BugReport[]>(`/bugs${query}`).then((r) => r.data);
  },

  getOne: (id: number) =>
    api.get<BugReport>(`/bugs/${id}`).then((r) => r.data),

  create: (taskId: number, payload: CreateBugPayload) =>
    api.post<BugReport>(`/bugs?taskId=${taskId}`, payload).then((r) => r.data),

  updateStatus: (id: number, status: BugStatus) =>
    api.patch<BugReport>(`/bugs/${id}`, { status }).then((r) => r.data),

  update: (id: number, payload: Partial<CreateBugPayload & { status: BugStatus }>) =>
    api.patch<BugReport>(`/bugs/${id}`, payload).then((r) => r.data),

  delete: (id: number) =>
    api.delete(`/bugs/${id}`).then((r) => r.data),
};
