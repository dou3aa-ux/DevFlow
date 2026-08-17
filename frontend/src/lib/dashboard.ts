import { tasksApi } from './tasks';
import type { Task } from './tasks';
import { projectsApi } from './projects';
import type { Project } from './projects';
import { devopsApi } from './devops';
import type { Deployment } from './devops';

export interface ActivityItem {
  id: string;
  type: 'deployment' | 'task';
  title: string;
  subtitle: string;
  timestamp: string;
  color: 'green' | 'red' | 'purple';
}

export interface DashboardData {
  projects: Project[];
  myTasks: Task[];
  sprintProgress: number; // % of DONE tasks across all projects
  totalTasks: number;
  deployments: Deployment[];
  activity: ActivityItem[];
  deployFrequency: { week: string; count: number }[];
}

export const dashboardApi = {
  async getOverview(currentUserId: number): Promise<DashboardData> {
    const projects = await projectsApi.getAll();

    let allTasks: Task[] = [];
    let allDeployments: Deployment[] = [];

    await Promise.all(
      projects.map(async (p) => {
        try {
          const tasks = await tasksApi.getAll(p.id);
          allTasks = [...allTasks, ...tasks.map((t) => ({ ...t, project: { id: p.id, name: p.name } }))];
        } catch {
          // no tasks yet for this project
        }
        try {
          const deployments = await devopsApi.getDeployments(p.id);
          allDeployments = [...allDeployments, ...deployments];
        } catch {
          // no deployments yet for this project
        }
      })
    );

    const doneCount = allTasks.filter((t) => t.status === 'DONE').length;
    const sprintProgress = allTasks.length > 0 ? Math.round((doneCount / allTasks.length) * 100) : 0;

    const myTasks = allTasks
      .filter((t) => t.assignee?.id === currentUserId && t.status !== 'DONE')
      .slice(0, 5);

    const activity: ActivityItem[] = allDeployments
      .sort((a, b) => new Date(b.deployedAt).getTime() - new Date(a.deployedAt).getTime())
      .slice(0, 5)
      .map((d) => ({
        id: `deploy-${d.id}`,
        type: 'deployment',
        title: d.status === 'SUCCESS' ? 'Server deployment successful' : 'Deployment failed',
        subtitle: `${d.environment} environment`,
        timestamp: d.deployedAt,
        color: d.status === 'SUCCESS' ? 'green' : 'red',
      }));

    const now = new Date();
    const weeks: { week: string; count: number }[] = [1, 2, 3, 4].map((n) => ({ week: `Week ${n}`, count: 0 }));
    allDeployments.forEach((d) => {
      const daysAgo = Math.floor((now.getTime() - new Date(d.deployedAt).getTime()) / (1000 * 60 * 60 * 24));
      const weekIndex = Math.min(3, Math.floor(daysAgo / 7));
      weeks[3 - weekIndex].count += 1;
    });

    return {
      projects,
      myTasks,
      sprintProgress,
      totalTasks: allTasks.length,
      deployments: allDeployments,
      activity,
      deployFrequency: weeks,
    };
  },
};