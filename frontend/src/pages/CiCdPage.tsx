import { useEffect, useState, useCallback } from 'react';
import { Play, Check, Loader2, X, Clock } from 'lucide-react';
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
  return `${Math.floor(mins / 60)} hours ago`;
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
  const base = 'w-16 h-16 rounded-2xl flex items-center justify-center border-2';
  if (state === 'success') return <div className={`${base} border-green-500 text-green-400`}><Check size={24} /></div>;
  if (state === 'processing') return <div className={`${base} border-purple-500 text-purple-400 animate-pulse`}><Loader2 size={24} className="animate-spin" /></div>;
  if (state === 'failed') return <div className={`${base} border-red-500 text-red-400`}><X size={24} /></div>;
  return <div className={`${base} border-white/10 text-slate-600`}><Clock size={22} /></div>;
}

export default function CiCdPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectId, setProjectId] = useState<number | null>(null);
  const [repo, setRepo] = useState<Repository | null>(null);
  const [latestCommit, setLatestCommit] = useState<Commit | null>(null);
  const [build, setBuild] = useState<Build | null>(null);
  const [deployment, setDeployment] = useState<Deployment | null>(null);
  const [triggering, setTriggering] = useState(false);

  useEffect(() => {
    projectsApi.getAll().then((projs) => {
      setProjects(projs);
      if (projs.length > 0) setProjectId(projs[0].id);
    });
  }, []);

  const loadRepoData = useCallback(async (pid: number) => {
    const r = await devopsApi.getRepository(pid);
    setRepo(r);
    if (!r) return;

    const commits = await devopsApi.getCommits(r.id).catch(() => []);
    if (commits.length > 0) setLatestCommit(commits[0]);

    const builds = await devopsApi.getBuilds(r.id).catch(() => []);
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
    }, 3000);
    return () => clearInterval(interval);
  }, [build]);

  const handleRunPipeline = async () => {
    if (!repo || !latestCommit) return;
    setTriggering(true);
    const newBuild = await devopsApi.triggerBuild(repo.id, latestCommit.sha);
    setBuild(newBuild);
    setDeployment(null);
    setTriggering(false);
  };

  const handleDeploy = async () => {
    if (!build) return;
    const dep = await devopsApi.deploy(build.id, 'PREVIEW');
    setDeployment(dep);
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

        <main className="flex-1 p-8">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold text-white">Pipeline Orchestrator</h1>
              <span className="flex items-center gap-1 text-sm text-purple-400 bg-purple-500/10 border border-purple-500/20 rounded-full px-3 py-1">
                main
              </span>
              {build && <span className="text-sm text-slate-500">Last run: {timeAgo(build.startedAt)}</span>}
            </div>
            <button
              onClick={handleRunPipeline}
              disabled={!repo || !latestCommit || triggering}
              className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-40 disabled:cursor-not-allowed text-white px-5 py-2.5 rounded-lg text-sm font-medium transition"
            >
              <Play size={16} /> {triggering ? 'Starting...' : 'Run Pipeline'}
            </button>
          </div>

          {!repo ? (
            <div className="bg-[#0e0e14] border border-white/5 rounded-2xl p-10 text-center text-slate-500">
              No repository linked to this project yet — link one from the project's Kanban board first.
            </div>
          ) : (
            <div className="bg-[#0e0e14] border border-white/5 rounded-2xl p-10">
              <div className="flex items-center justify-center gap-8 mb-10">
                <div className="flex flex-col items-center gap-3">
                  <StageIcon state={buildState} />
                  <div className="text-center">
                    <p className="text-white font-semibold text-sm">Build</p>
                    <p className={`text-xs ${buildState === 'success' ? 'text-green-400' : buildState === 'failed' ? 'text-red-400' : buildState === 'processing' ? 'text-purple-400' : 'text-slate-500'}`}>
                      {!build ? 'Pending...' : build.status}
                    </p>
                  </div>
                </div>

                <div className={`h-0.5 w-24 ${buildState === 'success' ? 'bg-purple-500' : 'bg-white/10'}`} />

                <div className="flex flex-col items-center gap-3">
                  <StageIcon state={deployState} />
                  <div className="text-center">
                    <p className="text-white font-semibold text-sm">Deploy</p>
                    <p className={`text-xs ${deployState === 'success' ? 'text-green-400' : deployState === 'failed' ? 'text-red-400' : deployState === 'processing' ? 'text-purple-400' : 'text-slate-500'}`}>
                      {!deployment ? 'Pending...' : deployment.status}
                    </p>
                  </div>
                </div>
              </div>

              {buildState === 'success' && !deployment && (
                <div className="flex justify-center mb-8">
                  <button
                    onClick={handleDeploy}
                    className="bg-white/5 hover:bg-white/10 border border-white/10 text-white px-5 py-2 rounded-lg text-sm font-medium transition"
                  >
                    Deploy to Preview
                  </button>
                </div>
              )}

              {build && (
                <div className="flex items-center justify-center gap-8 text-sm border-t border-white/5 pt-6">
                  <span className="text-slate-400">
                    Pipeline ID: <span className="text-white font-mono">#{build.id}</span>
                  </span>
                  <span className="text-slate-400">
                    Commit: <span className="text-purple-400 font-mono">{build.commitSha.slice(0, 7)}</span>
                  </span>
                  <span className="text-slate-400">
                    Duration: <span className="text-white font-mono">{duration(build.startedAt, build.finishedAt)}</span>
                  </span>
                </div>
              )}
            </div>
          )}

          {build?.logs && (
            <div className="mt-6 bg-black border border-white/5 rounded-2xl overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5">
                <span className="w-3 h-3 rounded-full bg-red-500" />
                <span className="w-3 h-3 rounded-full bg-yellow-500" />
                <span className="w-3 h-3 rounded-full bg-green-500" />
                <span className="text-slate-500 text-xs ml-2">build-{build.id}.logs</span>
              </div>
              <pre className="p-4 text-xs text-green-400 font-mono overflow-x-auto max-h-96 overflow-y-auto whitespace-pre-wrap">
                {build.logs}
              </pre>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}