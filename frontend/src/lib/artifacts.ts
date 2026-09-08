import { api } from './api';

export type ArtifactType = 'DOCKER_IMAGE' | 'APK' | 'ZIP' | 'EXECUTABLE';

export interface Artifact {
  id: number;
  type: ArtifactType;
  version: string;
  storageKey?: string;
  releaseNotes?: string;
  fileSize?: string;
  downloadUrl?: string;
  createdAt: string;
  build?: {
    id: number;
    commitSha: string;
    branch?: string;
    commitMessage?: string;
    startedAt: string;
  };
}

export interface CreateReleasePayload {
  type: ArtifactType;
  version: string;
  releaseNotes?: string;
  fileSize?: string;
  downloadUrl?: string;
}

export const artifactsApi = {
  getAll: (type?: ArtifactType) => {
    const query = type ? `?type=${type}` : '';
    return api.get<Artifact[]>(`/artifacts${query}`).then((r) => r.data);
  },

  getByBuild: (buildId: number) =>
    api.get<Artifact>(`/artifacts/build/${buildId}`).then((r) => r.data),

  getDownloadUrl: (id: number) =>
    api.get<{ downloadUrl: string }>(`/artifacts/${id}/download`).then((r) => r.data),

  createRelease: (payload: CreateReleasePayload) =>
    api.post<Artifact>('/artifacts/release', payload).then((r) => r.data),
};
