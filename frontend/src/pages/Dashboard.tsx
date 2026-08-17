import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';
import { useAuth } from '../context/AuthContext';
import { dashboardApi } from '../lib/dashboard';
import type { DashboardData } from '../lib/dashboard';

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  TODO: { label: 'To Do', color: 'text-slate-400' },
  IN_PROGRESS: { label: 'In Progress', color: 'text-blue-400' },
  IN_REVIEW: { label: 'In Review', color: 'text-purple-400' },
  DONE: { label: 'Done', color: 'text-green-400' },
};

const PRIORITY_DOT: Record<string, string> = {
  LOW: 'bg-slate-500',
  MEDIUM: 'bg-blue-500',
  HIGH: 'bg-orange-500',
  CRITICAL: 'bg-red-500',
};

function timeAgo(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} mins ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hours ago`;
  return `${Math.floor(hrs / 24)} days ago`;
}

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    dashboardApi.getOverview(user.id).then((d) => {
      setData(d);
      if (d.projects.length > 0) setSelectedProjectId(d.projects[0].id);
      setLoading(false);
    });
  }, [user]);

  if (loading || !data) {
    return (
      <div className="min-h-screen bg-[#050508] flex items-center justify-center text-slate-500">
        Loading dashboard...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050508] flex">
      <Sidebar />

      <div className="flex-1 flex flex-col">
        <Topbar
          projects={data.projects}
          selectedProjectId={selectedProjectId}
          onSelectProject={setSelectedProjectId}
        />

        <main className="flex-1 p-8 space-y-6">
          {/* Welcome + System Status row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-[#0e0e14] border border-white/5 rounded-2xl p-8 flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-white mb-2">Welcome back, {user?.username}!</h1>
                <p className="text-slate-400 mb-6">
                  {data.totalTasks > 0
                    ? `${data.totalTasks} tasks tracked across ${data.projects.length} project(s).`
                    : 'No tasks yet — create a project to get started.'}
                </p>
                <div className="flex gap-3">
                  <Link
                    to={selectedProjectId ? `/projects/${selectedProjectId}` : '/projects'}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition"
                  >
                    Go to Board
                  </Link>
                  <Link
                    to="/projects"
                    className="bg-white/5 hover:bg-white/10 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition border border-white/10"
                  >
                    View Projects
                  </Link>
                </div>
              </div>
              <div className="flex flex-col items-center">
                <div className="relative w-32 h-32">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="42" fill="none" stroke="#1e1e28" strokeWidth="8" />
                    <circle
                      cx="50"
                      cy="50"
                      r="42"
                      fill="none"
                      stroke="#22c55e"
                      strokeWidth="8"
                      strokeDasharray={`${(data.sprintProgress / 100) * 264} 264`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-2xl font-bold text-white">{data.sprintProgress}%</span>
                  </div>
                </div>
                <p className="text-sm text-slate-400 mt-3">Task Completion</p>
              </div>
            </div>

            <div className="bg-[#0e0e14] border border-white/5 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-semibold">System Status</h3>
                <span className="flex items-center gap-1.5 text-xs bg-green-500/10 text-green-400 px-2.5 py-1 rounded-full border border-green-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400" /> Operational
                </span>
              </div>
              <p className="text-xs text-slate-500 mb-4">
                Live metrics require the Monitoring module (Prometheus/Grafana) — not built yet, so this is illustrative.
              </p>
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

          {/* Assigned to Me + Environment Status */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-[#0e0e14] border border-white/5 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-semibold">Assigned to Me</h3>
                <Link to="/projects" className="text-xs text-slate-400 hover:text-white border border-white/10 rounded px-3 py-1.5">
                  View All
                </Link>
              </div>
              {data.myTasks.length === 0 ? (
                <p className="text-slate-500 text-sm py-6 text-center">No tasks assigned to you right now.</p>
              ) : (
                <div className="space-y-2">
                  {data.myTasks.map((task) => (
                    <div
                      key={task.id}
                      className="flex items-center justify-between bg-white/[0.02] hover:bg-white/[0.04] border border-white/5 rounded-xl p-4 transition"
                    >
                      <div className="flex items-center gap-3">
                        <span className={`w-2 h-2 rounded-full ${PRIORITY_DOT[task.priority]}`} />
                        <div>
                          <p className="text-white text-sm font-medium">{task.title}</p>
                          <p className="text-xs text-slate-500">{task.project?.name}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-medium ${STATUS_LABEL[task.status]?.color}`}>
                          {STATUS_LABEL[task.status]?.label}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-[#0e0e14] border border-white/5 rounded-2xl p-6">
              <h3 className="text-white font-semibold mb-4">Environment Status</h3>
              {data.deployments.length === 0 ? (
                <p className="text-slate-500 text-sm py-6 text-center">No deployments yet.</p>
              ) : (
                <div className="space-y-2">
                  {data.deployments.slice(0, 4).map((d) => (
                    <div
                      key={d.id}
                      className={`flex items-center justify-between rounded-xl p-3 border ${
                        d.status === 'FAILED' ? 'bg-red-500/5 border-red-500/20' : 'bg-white/[0.02] border-white/5'
                      }`}
                    >
                      <div>
                        <p className="text-white text-sm font-medium">{d.environment}</p>
                        <p className="text-xs text-slate-500">Port {d.port}</p>
                      </div>
                      <span
                        className={`text-xs font-medium ${
                          d.status === 'SUCCESS' ? 'text-green-400' : d.status === 'FAILED' ? 'text-red-400' : 'text-purple-400'
                        }`}
                      >
                        {d.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Recent Activity + Deployment Frequency */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-[#0e0e14] border border-white/5 rounded-2xl p-6">
              <h3 className="text-white font-semibold mb-4">Recent Activity</h3>
              {data.activity.length === 0 ? (
                <p className="text-slate-500 text-sm py-6 text-center">No recent activity yet.</p>
              ) : (
                <div className="space-y-4">
                  {data.activity.map((item) => (
                    <div key={item.id} className="flex gap-3">
                      <span
                        className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                          item.color === 'green' ? 'bg-green-500' : item.color === 'red' ? 'bg-red-500' : 'bg-purple-500'
                        }`}
                      />
                      <div>
                        <p className="text-xs text-slate-500">{timeAgo(item.timestamp)}</p>
                        <p className="text-sm text-white">{item.title}</p>
                        <p className="text-xs text-slate-500">{item.subtitle}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="lg:col-span-2 bg-[#0e0e14] border border-white/5 rounded-2xl p-6">
              <h3 className="text-white font-semibold mb-4">Deployment Frequency</h3>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={data.deployFrequency}>
                  <defs>
                    <linearGradient id="deployGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#a855f7" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="#a855f7" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="week" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{ background: '#12121a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }}
                    labelStyle={{ color: '#94a3b8' }}
                  />
                  <Area type="monotone" dataKey="count" stroke="#a855f7" strokeWidth={2} fill="url(#deployGradient)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}