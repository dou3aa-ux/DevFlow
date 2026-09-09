import { useEffect, useState, useCallback } from 'react';
import {
  Play,
  Check,
  Loader2,
  X,
  Clock,
  GitBranch,
  Terminal,
  Server,
  RotateCw,
  Plus,
  ExternalLink,
  Shield,
  Layers,
  History,
} from 'lucide-react';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';
import { devopsApi } from '../lib/devops';
import type { Repository, Commit, Build, Deployment } from '../lib/devops';
import { projectsApi } from '../lib/projects';
import type { Project } from '../lib/projects';

function timeAgo(iso: string) {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} mins ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hours ago`;
  return `${Math.floor(hrs / 24)} days ago`;
}

function duration(start: string, end: string | null) {
  const startMs = new Date(start).getTime();
  const endMs = end ? new Date(end).getTime() : Date.now();
  const totalSec = Math.floor((endMs - startMs) / 1000);
  const mm = String(Math.floor(totalSec / 60)).padStart(2, '0');
  const ss = String(totalSec % 60).padStart(2, '0');
  return `${mm}:${ss}`;
}

type StageState = 'pending' | 'processing' | 'success' | 'failed';

function StageIcon({ state }: { state: StageState }) {
  const base = 'w-16 h-16 rounded-2xl flex items-center justify-center border-2 shadow-lg';
  if (state === 'success')
    return (
      <div className={`${base} border-green-500 bg-green-500/10 text-green-400`}>
        <Check size={24} />
      </div>
    );
  if (state === 'processing')
    return (
      <div className={`${base} border-purple-500 bg-purple-500/10 text-purple-400 animate-pulse`}>
        <Loader2 size={24} className="animate-spin" />
      </div>
    );
  if (state === 'failed')
    return (
      <div className={`${base} border-red-500 bg-red-500/10 text-red-400`}>
        <X size={24} />
      </div>
    );
  return (
    <div className={`${base} border-white/10 bg-[#12121a] text-slate-600`}>
      <Clock size={22} />
    </div>
  );
}

export default function CiCdPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectId, setProjectId] = useState<number | null>(null);
  const [repo, setRepo] = useState<Repository | null>(null);
  const [latestCommit, setLatestCommit] = useState<Commit | null>(null);
  const [build, setBuild] = useState<Build | null>(null);
  const [buildsHistory, setBuildsHistory] = useState<Build[]>([]);
  const [deployment, setDeployment] = useState<Deployment | null>(null);
  const [triggering, setTriggering] = useState(false);

  // Link repository modal
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkProvider, setLinkProvider] = useState<'GITHUB' | 'GITLAB'>('GITHUB');
  const [linking, setLinking] = useState(false);

  useEffect(() => {
    projectsApi.getAll().then((projs) => {
      setProjects(projs);
      if (projs.length > 0) setProjectId(projs[0].id);
    });
  }, []);

  const loadRepoData = useCallback(async (pid: number) => {
    const r = await devopsApi.getRepository(pid);
    setRepo(r);
    if (!r) {
      setLatestCommit(null);
      setBuild(null);
      setBuildsHistory([]);
      setDeployment(null);
      return;
    }

    // Always sync the latest commits from GitHub API first, then read from DB
    await devopsApi.syncCommits(r.id);

    const commits = await devopsApi.getCommits(r.id).catch(() => []);
    if (commits.length > 0) setLatestCommit(commits[0]);

    const builds = await devopsApi.getBuilds(r.id).catch(() => []);
    setBuildsHistory(builds);
    if (builds.length > 0) setBuild(builds[0]);

    const deployments = await devopsApi.getDeployments(pid).catch(() => []);
    if (deployments.length > 0) setDeployment(deployments[0]);
  }, []);

  useEffect(() => {
    if (projectId) loadRepoData(projectId);
  }, [projectId, loadRepoData]);

  // Poll the active build every 3s while it's running
  useEffect(() => {
    if (!build || build.status === 'SUCCESS' || build.status === 'FAILED') return;
    const interval = setInterval(async () => {
      const updated = await devopsApi.getBuild(build.id);
      setBuild(updated);
      if (projectId) loadRepoData(projectId);
    }, 3000);
    return () => clearInterval(interval);
  }, [build, projectId, loadRepoData]);

  const handleRunPipeline = async () => {
    if (!repo || !latestCommit) return;
    setTriggering(true);
    try {
      const newBuild = await devopsApi.triggerBuild(repo.id, latestCommit.sha);
      setBuild(newBuild);
      setDeployment(null);
      if (projectId) loadRepoData(projectId);
    } finally {
      setTriggering(false);
    }
  };

  const handleDeploy = async () => {
    if (!build) return;
    const dep = await devopsApi.deploy(build.id, 'PREVIEW');
    setDeployment(dep);
  };

  const handleLinkRepo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId || !linkUrl.trim()) return;
    setLinking(true);
    try {
      await devopsApi.linkRepository(projectId, linkUrl.trim(), linkProvider);
      setShowLinkModal(false);
      setLinkUrl('');
      loadRepoData(projectId);
    } finally {
      setLinking(false);
    }
  };

  const buildState: StageState =
    !build ? 'pending' : build.status === 'SUCCESS' ? 'success' : build.status === 'FAILED' ? 'failed' : 'processing';
  const deployState: StageState =
    !deployment ? 'pending' : deployment.status === 'SUCCESS' ? 'success' : deployment.status === 'FAILED' ? 'failed' : 'processing';

  return (
    <div className="min-h-screen bg-[#050508] flex">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Topbar projects={projects} selectedProjectId={projectId} onSelectProject={setProjectId} />

        <main className="flex-1 p-8 space-y-6">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold text-white tracking-tight">CI/CD Pipeline Orchestrator</h1>
              <span className="flex items-center gap-1 text-xs text-purple-400 bg-purple-500/10 border border-purple-500/20 rounded-full px-3 py-1 font-mono">
                branch: main
              </span>
              {build && <span className="text-xs text-slate-500">Last executed: {timeAgo(build.startedAt)}</span>}
            </div>

            <div className="flex items-center gap-3">
              {repo && (
                <div className="flex flex-col items-end gap-1">
                  <button
                    onClick={handleRunPipeline}
                    disabled={triggering || !latestCommit}
                    title={!latestCommit ? 'No commits found. Push a commit or wait for the webhook to register one.' : ''}
                    className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-40 disabled:cursor-not-allowed text-white px-5 py-2.5 rounded-lg text-xs font-medium transition shadow-lg shadow-purple-600/20"
                  >
                    <Play size={14} /> {triggering ? 'Starting Pipeline...' : 'Trigger Pipeline'}
                  </button>
                  {!latestCommit && (
                    <span className="text-[10px] text-amber-400/80 font-mono">
                      No commits detected — push to your repo or configure the webhook
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {!repo ? (
            <div className="bg-[#0e0e14] border border-white/5 rounded-2xl p-12 text-center max-w-xl mx-auto space-y-4 shadow-xl">
              <div className="w-14 h-14 rounded-2xl bg-purple-600/10 border border-purple-600/20 flex items-center justify-center text-purple-400 mx-auto">
                <GitBranch size={26} />
              </div>
              <h3 className="text-xl font-bold text-white">No Git Repository Connected</h3>
              <p className="text-slate-400 text-xs leading-relaxed max-w-md mx-auto">
                Connect a GitHub or GitLab repository to automatically trigger CI testing, containerize builds, and generate preview environments.
              </p>
              <button
                onClick={() => setShowLinkModal(true)}
                className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-5 py-2.5 rounded-xl text-xs font-medium transition shadow-lg shadow-purple-600/20"
              >
                <Plus size={15} /> Connect Repository
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Repository info bar */}
              <div className="bg-[#0e0e14] border border-white/5 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-purple-600/10 border border-purple-600/20 flex items-center justify-center text-purple-400">
                    <GitBranch size={17} />
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 font-medium">Connected Source</span>
                    <p className="text-xs font-mono text-white">{repo.url}</p>
                  </div>
                </div>

                <div className="flex items-center gap-6 text-xs">
                  <div>
                    <span className="text-slate-500">Provider:</span>{' '}
                    <span className="text-purple-400 font-semibold">{repo.provider}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Webhook Status:</span>{' '}
                    <span className="text-green-400 font-semibold">Active & Listening</span>
                  </div>
                </div>
              </div>

              {/* Pipeline Visual Stages */}
              <div className="bg-[#0e0e14] border border-white/5 rounded-2xl p-10 shadow-xl">
                <div className="flex items-center justify-center gap-8 mb-10">
                  {/* Build Stage */}
                  <div className="flex flex-col items-center gap-3">
                    <StageIcon state={buildState} />
                    <div className="text-center">
                      <p className="text-white font-semibold text-xs">Docker Build & Package</p>
                      <p
                        className={`text-[11px] font-mono mt-0.5 ${
                          buildState === 'success'
                            ? 'text-green-400'
                            : buildState === 'failed'
                            ? 'text-red-400'
                            : buildState === 'processing'
                            ? 'text-purple-400'
                            : 'text-slate-500'
                        }`}
                      >
                        {!build ? 'Pending...' : build.status}
                      </p>
                    </div>
                  </div>

                  <div className={`h-0.5 w-28 ${buildState === 'success' ? 'bg-purple-500' : 'bg-white/10'}`} />

                  {/* Deploy Stage */}
                  <div className="flex flex-col items-center gap-3">
                    <StageIcon state={deployState} />
                    <div className="text-center">
                      <p className="text-white font-semibold text-xs">Preview Deployment</p>
                      <p
                        className={`text-[11px] font-mono mt-0.5 ${
                          deployState === 'success'
                            ? 'text-green-400'
                            : deployState === 'failed'
                            ? 'text-red-400'
                            : deployState === 'processing'
                            ? 'text-purple-400'
                            : 'text-slate-500'
                        }`}
                      >
                        {!deployment ? 'Pending...' : deployment.status}
                      </p>
                    </div>
                  </div>
                </div>

                {buildState === 'success' && !deployment && (
                  <div className="flex justify-center mb-6">
                    <button
                      onClick={handleDeploy}
                      className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white px-6 py-2.5 rounded-xl text-xs font-medium transition shadow-lg shadow-purple-600/20"
                    >
                      Deploy to Preview Environment
                    </button>
                  </div>
                )}

                {deployment?.status === 'SUCCESS' && (
                  <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 flex items-center justify-between max-w-md mx-auto mb-6 text-xs">
                    <div className="flex items-center gap-2 text-green-400 font-medium">
                      <Server size={16} />
                      <span>Preview Live on Port {deployment.port}</span>
                    </div>
                    <a
                      href={`http://localhost:${deployment.port}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-white hover:text-green-300 flex items-center gap-1 font-semibold underline"
                    >
                      Launch <ExternalLink size={12} />
                    </a>
                  </div>
                )}

                {build && (
                  <div className="flex flex-wrap items-center justify-center gap-8 text-xs border-t border-white/5 pt-6 text-slate-400">
                    <span>
                      Pipeline Run: <strong className="text-white font-mono">#{build.id}</strong>
                    </span>
                    <span>
                      Commit: <strong className="text-purple-400 font-mono">{build.commitSha.slice(0, 7)}</strong>
                    </span>
                    <span>
                      Duration:{' '}
                      <strong className="text-white font-mono">
                        {duration(build.startedAt, build.finishedAt)}
                      </strong>
                    </span>
                  </div>
                )}
              </div>

              {/* Build Logs Terminal */}
              {build?.logs && (
                <div className="bg-black border border-white/10 rounded-2xl overflow-hidden shadow-xl">
                  <div className="flex items-center justify-between px-4 py-3 bg-[#0e0e14] border-b border-white/5">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-red-500" />
                      <span className="w-3 h-3 rounded-full bg-yellow-500" />
                      <span className="w-3 h-3 rounded-full bg-green-500" />
                      <span className="text-slate-400 text-xs font-mono ml-2">build-{build.id}.log</span>
                    </div>
                  </div>
                  <pre className="p-4 text-xs text-green-400 font-mono overflow-x-auto max-h-80 overflow-y-auto whitespace-pre-wrap leading-relaxed">
                    {build.logs}
                  </pre>
                </div>
              )}

              {/* Pipeline Execution History */}
              <div className="bg-[#0e0e14] border border-white/5 rounded-2xl p-6 shadow-xl space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <History size={17} className="text-purple-400" /> Pipeline History
                  </h3>
                  <span className="text-xs text-slate-500">{buildsHistory.length} total runs</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="text-slate-500 border-b border-white/5">
                        <th className="pb-3 font-medium">Build ID</th>
                        <th className="pb-3 font-medium">Commit SHA</th>
                        <th className="pb-3 font-medium">Status</th>
                        <th className="pb-3 font-medium">Started</th>
                        <th className="pb-3 font-medium">Duration</th>
                        <th className="pb-3 font-medium text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {buildsHistory.map((b) => (
                        <tr key={b.id} className="hover:bg-white/[0.01]">
                          <td className="py-3 font-mono font-medium text-white">#{b.id}</td>
                          <td className="py-3 font-mono text-purple-400">{b.commitSha.slice(0, 7)}</td>
                          <td className="py-3">
                            <span
                              className={`px-2 py-0.5 rounded-full font-semibold text-[10px] ${
                                b.status === 'SUCCESS'
                                  ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                                  : b.status === 'FAILED'
                                  ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                                  : 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                              }`}
                            >
                              {b.status}
                            </span>
                          </td>
                          <td className="py-3 text-slate-400">{new Date(b.startedAt).toLocaleDateString()}</td>
                          <td className="py-3 text-slate-400 font-mono">{duration(b.startedAt, b.finishedAt)}</td>
                          <td className="py-3 text-right">
                            <button
                              onClick={() => setBuild(b)}
                              className="text-slate-400 hover:text-white underline text-[11px]"
                            >
                              View Logs
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Link Repository Modal */}
      {showLinkModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#0e0e14] border border-white/10 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in-95">
            <div className="p-6 border-b border-white/5 flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <GitBranch size={18} className="text-purple-400" /> Link Git Repository
              </h3>
              <button onClick={() => setShowLinkModal(false)} className="text-slate-500 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleLinkRepo} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Repository URL</label>
                <input
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="https://github.com/organization/repo"
                  className="w-full bg-[#12121a] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder:text-slate-600 outline-none focus:border-purple-500 font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Git Provider</label>
                <select
                  value={linkProvider}
                  onChange={(e) => setLinkProvider(e.target.value as 'GITHUB' | 'GITLAB')}
                  className="w-full bg-[#12121a] border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-purple-500 cursor-pointer"
                >
                  <option value="GITHUB">GitHub</option>
                  <option value="GITLAB">GitLab</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setShowLinkModal(false)}
                  className="px-4 py-2 rounded-lg text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={linking}
                  className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white px-5 py-2 rounded-lg text-xs font-medium transition"
                >
                  {linking ? 'Linking...' : 'Connect Repository'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}