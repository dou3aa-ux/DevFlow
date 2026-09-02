import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import {
  Layout,
  CheckCircle,
  Clock,
  AlertCircle,
  GitBranch,
  Hammer,
  Rocket,
  GitPullRequest,
  Activity,
  Server,
  Wifi,
  ChevronRight,
  Terminal,
  Code2,
  Calendar,
} from 'lucide-react';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';
import { useAuth } from '../context/AuthContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const api = axios.create({ baseURL: API_URL });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const fetchMyTasks = async () => {
  const { data } = await api.get('/tasks/my-tasks');
  return data;
};

const fetchRecentBuilds = async () => {
  const { data } = await api.get('/builds/recent');
  return data;
};

/* ─── Config ─── */
const STATUS_LABEL: Record<string, { label: string; color: string; bg: string }> = {
  TODO: { label: 'To Do', color: 'text-slate-400', bg: 'bg-slate-500/10' },
  IN_PROGRESS: { label: 'In Progress', color: 'text-blue-400', bg: 'bg-blue-500/10' },
  IN_REVIEW: { label: 'In Review', color: 'text-purple-400', bg: 'bg-purple-500/10' },
  DONE: { label: 'Done', color: 'text-green-400', bg: 'bg-green-500/10' },
};

const PRIORITY_DOT: Record<string, string> = {
  LOW: 'bg-slate-500',
  MEDIUM: 'bg-blue-500',
  HIGH: 'bg-orange-500',
  CRITICAL: 'bg-red-500',
};

const BUILD_STATUS: Record<string, { color: string; dot: string; label: string }> = {
  SUCCESS: { color: 'text-green-400', dot: 'bg-green-500', label: 'Passed' },
  FAILED: { color: 'text-red-400', dot: 'bg-red-500', label: 'Failed' },
  RUNNING: { color: 'text-blue-400', dot: 'bg-blue-500', label: 'Processing' },
  PENDING: { color: 'text-slate-400', dot: 'bg-slate-500', label: 'Pending' },
};

function CircleDot({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
    </svg>
  );
}

export default function DeveloperDashboard() {
  const { user } = useAuth();
  const { data: tasks, isLoading: tasksLoading } = useQuery({ queryKey: ['myTasks'], queryFn: fetchMyTasks });
  const { data: builds, isLoading: buildsLoading } = useQuery({ queryKey: ['recentBuilds'], queryFn: fetchRecentBuilds, refetchInterval: 10000 });

  const taskCount = tasks?.length || 0;
  const doneCount = tasks?.filter((t: any) => t.status === 'DONE').length || 0;
  const progress = taskCount > 0 ? Math.round((doneCount / taskCount) * 100) : 0;

  return (
    <div className="min-h-screen bg-[#050508] flex">
      <Sidebar />

      <div className="flex-1 flex flex-col">
        <Topbar projects={[]} selectedProjectId={null} onSelectProject={() => {}} />

        <main className="flex-1 p-8 space-y-6">
          {/* ═══ Welcome Banner ═══ */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-[#0e0e14] border border-white/5 rounded-2xl p-8 flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-white mb-2">Welcome back, {user?.username}!</h1>
                <p className="text-slate-400 mb-6">Ready to deploy? Sprint ends in 3 days.</p>
                <div className="flex gap-3">
                  <button className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition flex items-center gap-2">
                    <Rocket className="w-4 h-4" />
                    Deploy to Staging
                  </button>
                  <button className="bg-white/5 hover:bg-white/10 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition border border-white/10 flex items-center gap-2">
                    <GitPullRequest className="w-4 h-4" />
                    View PRs
                  </button>
                </div>
              </div>
              <div className="flex flex-col items-center">
                <div className="relative w-32 h-32">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="42" fill="none" stroke="#1e1e28" strokeWidth="8" />
                    <circle
                      cx="50" cy="50" r="42" fill="none" stroke="#a855f7"
                      strokeWidth="8" strokeDasharray={`${(progress / 100) * 264} 264`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-2xl font-bold text-white">{progress}%</span>
                  </div>
                </div>
                <p className="text-sm text-slate-400 mt-3">Sprint Progress</p>
              </div>
            </div>

            {/* System Status */}
            <div className="bg-[#0e0e14] border border-white/5 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-semibold">System Status</h3>
                <span className="flex items-center gap-1.5 text-xs bg-green-500/10 text-green-400 px-2.5 py-1 rounded-full border border-green-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400" /> Operational
                </span>
              </div>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-400">API Latency</span>
                    <span className="text-green-400">42ms</span>
                  </div>
                  <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-green-500 rounded-full" style={{ width: '20%' }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-400">Server Load</span>
                    <span className="text-purple-400">68%</span>
                  </div>
                  <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-purple-500 rounded-full" style={{ width: '68%' }} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ═══ Assigned to Me + Environment Status ═══ */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Assigned to Me */}
            <div className="lg:col-span-2 bg-[#0e0e14] border border-white/5 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Layout className="w-5 h-5 text-purple-400" />
                  <h3 className="text-white font-semibold">Assigned to Me</h3>
                  <span className="px-2 py-0.5 text-xs bg-white/5 text-slate-400 rounded-full">{taskCount}</span>
                </div>
                <button className="text-xs text-slate-400 hover:text-white border border-white/10 rounded px-3 py-1.5 flex items-center gap-1">
                  View All <ChevronRight className="w-3 h-3" />
                </button>
              </div>

              {tasksLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : tasks?.length === 0 ? (
                <p className="text-slate-500 text-sm py-6 text-center">No tasks assigned.</p>
              ) : (
                <div className="space-y-2">
                  {tasks.map((task: any) => {
                    const st = STATUS_LABEL[task.status] || STATUS_LABEL.TODO;
                    const pri = PRIORITY_DOT[task.priority] || PRIORITY_DOT.MEDIUM;
                    return (
                      <div
                        key={task.id}
                        className="flex items-center justify-between bg-white/[0.02] hover:bg-white/[0.04] border border-white/5 rounded-xl p-4 transition"
                      >
                        <div className="flex items-center gap-3">
                          <span className={`w-2 h-2 rounded-full ${pri}`} />
                          <div>
                            <p className="text-white text-sm font-medium">{task.title}</p>
                            <p className="text-xs text-slate-500">
                              DEV-{task.id} • {task.project?.name || 'No Project'}
                              {task.sprint?.name ? ` • ${task.sprint.name}` : ''}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${st.bg} ${st.color}`}>
                            {task.status === 'DONE' ? <CheckCircle className="w-3 h-3" /> :
                             task.status === 'IN_PROGRESS' ? <Clock className="w-3 h-3" /> :
                             <CircleDot className="w-3 h-3" />}
                            {st.label}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Environment Status */}
            <div className="bg-[#0e0e14] border border-white/5 rounded-2xl p-6">
              <h3 className="text-white font-semibold mb-4">Environment Status</h3>
              <div className="space-y-3">
                {/* Web App */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/5">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center">
                      <Wifi className="w-4 h-4 text-blue-400" />
                    </div>
                    <div>
                      <p className="text-white text-sm font-medium">Web App</p>
                      <p className="text-[11px] text-slate-500">v2.4.1 • Production</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400">Online</span>
                    <span className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                  </div>
                </div>

                {/* Latest Build */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/5">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-purple-500/10 flex items-center justify-center">
                      <Hammer className="w-4 h-4 text-purple-400" />
                    </div>
                    <div>
                      <p className="text-white text-sm font-medium">Latest Build</p>
                      <p className="text-[11px] text-slate-500">
                        {builds?.[0]?.commitSha?.slice(0, 7) || 'No builds yet'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400">
                      {builds?.[0] ? (builds[0].status === 'SUCCESS' ? 'Passed' : builds[0].status === 'FAILED' ? 'Failed' : 'Processing') : '—'}
                    </span>
                    <span className={`w-2 h-2 rounded-full ${builds?.[0] ? BUILD_STATUS[builds[0].status]?.dot || 'bg-slate-500' : 'bg-slate-500'} shadow-[0_0_8px_rgba(0,0,0,0.3)]`} />
                  </div>
                </div>

                {/* API */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/5">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-green-500/10 flex items-center justify-center">
                      <Server className="w-4 h-4 text-green-400" />
                    </div>
                    <div>
                      <p className="text-white text-sm font-medium">API Gateway</p>
                      <p className="text-[11px] text-slate-500">99.99% uptime</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400">Healthy</span>
                    <span className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ═══ Recent Activity + Pipeline Status ═══ */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Activity */}
            <div className="bg-[#0e0e14] border border-white/5 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Activity className="w-5 h-5 text-purple-400" />
                  <h3 className="text-white font-semibold">Recent Activity</h3>
                </div>
                <span className="text-[11px] text-slate-500 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> Live
                </span>
              </div>

              {buildsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : builds?.length === 0 ? (
                <p className="text-slate-500 text-sm py-6 text-center">No recent activity.</p>
              ) : (
                <div className="relative space-y-6 pl-4">
                  <div className="absolute left-[19px] top-2 bottom-2 w-px bg-white/5" />
                  {builds.slice(0, 5).map((build: any) => {
                    const cfg = BUILD_STATUS[build.status] || BUILD_STATUS.PENDING;
                    const isSuccess = build.status === 'SUCCESS';
                    return (
                      <div key={build.id} className="relative flex items-start gap-4">
                        <div className={`relative z-10 w-2.5 h-2.5 rounded-full mt-1.5 ${cfg.dot} ring-4 ring-[#0e0e14]`} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-sm text-white font-medium">
                              {isSuccess ? 'Build completed' : build.status === 'FAILED' ? 'Build failed' : 'Build started'}
                              <span className="font-mono text-slate-600 ml-2 text-xs">#{build.id}</span>
                            </p>
                            <span className="text-[11px] text-slate-600 shrink-0">
                              {build.startedAt ? new Date(build.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5 truncate">
                            {build.commitMessage || `${build.branch || 'unknown'} @ ${build.commitSha?.slice(0, 7)}`}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Pipeline Status */}
            <div className="bg-[#0e0e14] border border-white/5 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <GitBranch className="w-5 h-5 text-purple-400" />
                  <h3 className="text-white font-semibold">Pipeline Status</h3>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                  <span className="text-xs text-slate-500">Auto-refresh</span>
                </div>
              </div>

              {buildsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : builds?.length === 0 ? (
                <p className="text-slate-500 text-sm py-6 text-center">No builds yet.</p>
              ) : (
                <div className="space-y-3">
                  {builds.slice(0, 4).map((build: any) => {
                    const cfg = BUILD_STATUS[build.status] || BUILD_STATUS.PENDING;
                    return (
                      <div key={build.id} className="flex items-center gap-4 p-3.5 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${build.status === 'SUCCESS' ? 'bg-green-500/10' : build.status === 'FAILED' ? 'bg-red-500/10' : 'bg-blue-500/10'}`}>
                          {build.status === 'SUCCESS' ? <CheckCircle className="w-5 h-5 text-green-400" /> :
                           build.status === 'FAILED' ? <AlertCircle className="w-5 h-5 text-red-400" /> :
                           <Clock className="w-5 h-5 text-blue-400" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-white truncate">{build.commitMessage || `Build #${build.id}`}</p>
                            <span className={`text-xs font-medium ${cfg.color} shrink-0 ml-2`}>{cfg.label}</span>
                          </div>
                          <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-500">
                            <span className="font-mono bg-black/30 px-1.5 py-0.5 rounded text-slate-400">{build.commitSha?.slice(0, 7) || '???????'}</span>
                            <span>{build.branch || 'unknown'}</span>
                            <span>{build.repository?.name || 'Unknown'}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}