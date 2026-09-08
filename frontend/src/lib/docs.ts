export interface DocItem {
  id: string;
  title: string;
  category: 'Architecture' | 'API & Backend' | 'CI/CD & Pipelines' | 'DevOps & Cloud' | 'Mobile & QA';
  lastUpdated: string;
  author: string;
  readTime: string;
  content: string;
}

const STORAGE_KEY = 'devflow_docs_v1';

const DEFAULT_DOCS: DocItem[] = [
  {
    id: 'arch-overview',
    title: 'DevFlow System Architecture & Overview',
    category: 'Architecture',
    lastUpdated: '2026-09-01',
    author: 'Tech Lead',
    readTime: '5 min read',
    content: `# DevFlow Architecture Overview

DevFlow is organized as an enterprise workspace unifying project management, git integrations, automated CI/CD pipelines, container orchestration, and mobile testing.

### Core Components
1. **Frontend**: React 19, TypeScript, Vite, Tailwind CSS with custom glassmorphism design tokens.
2. **Backend**: NestJS, TypeORM, PostgreSQL 16, Redis 7 for real-time task sync and caching.
3. **Storage**: MinIO S3-compatible object store for Docker images and Android APK artifacts.
4. **DevOps Engine**: Local Docker engine daemon bridge with direct container telemetry and process inspection.
5. **Mobile Workspace**: React Native Expo application for testers and developers.

### Security & RBAC
- Role-based access control with 5 distinct personas:
  - **Administrator**: User provisioning, role matrix, cluster configuration, container lifecycle.
  - **Project Manager**: Project planning, sprint velocity, task assignment, progress tracking.
  - **Developer**: Commits, PR pipelines, build logs, container previews.
  - **QA Tester**: Bug submissions, device diagnostics, APK releases, test feedback.
  - **Stakeholder**: Preview deployments, feature approval, sign-off checklist.`,
  },
  {
    id: 'cicd-pipelines',
    title: 'Automated CI/CD & Webhook Triggering',
    category: 'CI/CD & Pipelines',
    lastUpdated: '2026-09-03',
    author: 'DevOps Engineer',
    readTime: '4 min read',
    content: `# Automated CI/CD Pipelines

DevFlow connects directly to GitHub or GitLab repositories via webhooks.

### Webhook Event Workflow
- **Push Event**:
  - Automatically records commit SHAs, authors, and timestamps.
  - Spawns background worker to clone the branch and build the Docker image.
  - Bundles the container artifact into MinIO storage.
  - Emits status update via NestJS gateway.
- **Pull Request Event**:
  - Triggers test execution and ephemeral preview deployment.
  - Generates unique preview URL: \`http://localhost:4000 + buildId\`.`,
  },
  {
    id: 'mobile-distribution',
    title: 'Android APK Distribution & QR Code Testing Workflow',
    category: 'Mobile & QA',
    lastUpdated: '2026-09-04',
    author: 'QA Lead',
    readTime: '3 min read',
    content: `# Android APK Distribution Guide

DevFlow provides an end-to-end mobile testing workflow tailored for QA engineers and Android developers.

### How it Works
1. **Automated Upload**:
   - Each compiled APK is versioned (semantic versioning, e.g. \`v1.2.4\`) and stored securely.
2. **QR Code Scanning**:
   - The DevFlow web workspace renders dynamic SVG QR codes directly on screen.
   - QA testers point their Android camera or DevFlow mobile companion app to instantly download and install the package without USB cables.
3. **Tester Push Notifications**:
   - With a single click, QA leads trigger targeted push notifications alerting all assigned mobile testers of new builds and release notes.
4. **Bug Reporting with Device Context**:
   - Testers submit issues directly with device model, Android OS version, reproduction steps, and screenshot attachments.`,
  },
  {
    id: 'deployment-runbook',
    title: 'Infrastructure & Container Monitoring Runbook',
    category: 'DevOps & Cloud',
    lastUpdated: '2026-09-05',
    author: 'Site Reliability Engineer',
    readTime: '6 min read',
    content: `# Infrastructure Monitoring & Incident Runbook

DevFlow features real-time container health monitoring and resource consumption tracking.

### Monitoring Metrics
- **CPU & Memory**: Real-time stats polled directly from the Docker daemon.
- **Container State**: \`RUNNING\`, \`STOPPED\`, or \`DEGRADED\`.
- **System Logs**: Live inspection of standard output and error buffers.

### Recovery Actions
- **Restart Container**: Trigger \`POST /infrastructure/containers/:name/restart\` from the admin dashboard.
- **Rollback Deployment**: Use the \`Rollback\` control in CI/CD or Deployments view to immediately spin down a faulty container and revert to the previous stable release.`,
  },
];

export const docsApi = {
  getAll: (): DocItem[] => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    return DEFAULT_DOCS;
  },

  getById: (id: string): DocItem | undefined => {
    const all = docsApi.getAll();
    return all.find((d) => d.id === id);
  },

  save: (doc: DocItem): void => {
    const all = docsApi.getAll();
    const idx = all.findIndex((d) => d.id === doc.id);
    if (idx >= 0) {
      all[idx] = doc;
    } else {
      all.unshift(doc);
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  },

  delete: (id: string): void => {
    const all = docsApi.getAll().filter((d) => d.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  },
};
