import { api } from './api';

export interface Comment {
  id: number;
  content: string;
  createdAt: string;
  author: {
    id: number;
    username: string;
    email: string;
    role: string;
  };
}

export const commentsApi = {
  getByTask: (taskId: number) =>
    api.get<Comment[]>(`/comments?taskId=${taskId}`).then((r) => r.data),

  create: (taskId: number, content: string) =>
    api.post<Comment>(`/comments?taskId=${taskId}`, { content }).then((r) => r.data),

  delete: (commentId: number) =>
    api.delete(`/comments/${commentId}`).then((r) => r.data),
};
