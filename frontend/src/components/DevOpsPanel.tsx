import { useEffect, useState } from 'react';
import { devopsApi } from '../lib/devops';
import type { Repository, Build, Deployment } from '../lib/devops';

const STATUS_COLORS: Record<string, string> = {
    PENDING: 'bg-slate-500',
    RUNNING: 'bg-blue-500 animate-pulse',
    SUCCESS: 'bg-green-500',
    FAILED: 'bg-red-500',
    DEPLOYING: 'bg-blue-500 animate-pulse',
    ROLLING_BACK: 'bg-yellow-500',
};

export default function DevOpsPanel({ projectId }: { projectId: number }) {
    const [repo, setRepo] = useState<Repository | null>(null);
    const [builds, setBuilds] = useState<Build[]>([]);
    const [deployments, setDeployments] = useState<Deployment[]>([]);
    const [showLinkForm, setShowLinkForm] = useState(false);
    const [repoUrl, setRepoUrl] = useState('');

    const loadAll = async () => {
    const r = await devopsApi.getRepository(projectId);
    setRepo(r);
    if (r) {
        const [b, d] = await Promise.all([
        devopsApi.getBuilds(r.id),
        devopsApi.getDeployments(projectId),
        ]);
        setBuilds(b);
        setDeployments(d);
    }
    };

    useEffect(() => {
    loadAll();
    const interval = setInterval(loadAll, 5000);
    return () => clearInterval(interval);
    }, [projectId]);

    const handleLink = async (e: React.FormEvent) => {
    e.preventDefault();
    await devopsApi.linkRepository(projectId, repoUrl, 'GITHUB');
    setRepoUrl('');
    setShowLinkForm(false);
    loadAll();
    };

    const handleDeploy = async (buildId: number) => {
    await devopsApi.deploy(buildId, 'PREVIEW');
    loadAll();
    };

    if (!repo) {
    return (
        <div className="bg-slate-800 rounded-lg p-4">
        <h3 className="font-semibold mb-2">No repository linked</h3>
        {showLinkForm ? (
                <form onSubmit={handleLink} className="flex gap-2">
                <input
                placeholder="https://github.com/user/repo"
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
                className="flex-1 p-2 rounded bg-slate-700 outline-none text-sm"
                required
                />
                <button type="submit" className="bg-green-600 hover:bg-green-700 px-3 py-1 rounded text-sm">
                Link
                </button>
                </form>
                ) : (
            <button onClick={() => setShowLinkForm(true)} className="text-blue-400 text-sm hover:underline">
                + Link a repository
            </button>
        )}
        </div>
        );
    }

    return (
        <div className="bg-slate-800 rounded-lg p-4 space-y-4">
        <div>
            <h3 className="font-semibold text-sm text-slate-300">Repository</h3>
            <p className="text-sm text-blue-400 truncate">{repo.url}</p>
        </div>

        <div>
            <h3 className="font-semibold text-sm text-slate-300 mb-2">Recent Builds</h3>
            {builds.length === 0 ? (
            <p className="text-slate-500 text-sm">No builds yet — push code to trigger one.</p>
            ) : (
            <div className="space-y-2">
                {builds.slice(0, 5).map((b) => (
                <div key={b.id} className="flex items-center justify-between bg-slate-700 p-2 rounded text-sm">
                <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${STATUS_COLORS[b.status]}`}></span>
                    <span>{b.version}</span>
                    <span className="text-slate-500 text-xs">{b.status}</span>
                    </div>
                    {b.status === 'SUCCESS' && (
                    <button
                    onClick={() => handleDeploy(b.id)}
                    className="text-xs bg-blue-600 hover:bg-blue-700 px-2 py-1 rounded"
                    >
                    Deploy
                    </button>
                    )}
                </div>
                ))}
            </div>
        )}
        </div>

        <div>
            <h3 className="font-semibold text-sm text-slate-300 mb-2">Deployments</h3>
            {deployments.length === 0 ? (
            <p className="text-slate-500 text-sm">No deployments yet.</p>
            ) : (
            <div className="space-y-2">
            {deployments.slice(0, 5).map((d) => (
                <div key={d.id} className="flex items-center justify-between bg-slate-700 p-2 rounded text-sm">
                    <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${STATUS_COLORS[d.status]}`}></span>
                    <span>{d.environment}</span>
                    </div>
                    {d.status === 'SUCCESS' && (
                    <a
                    href={`http://localhost:${d.port}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-blue-400 hover:underline"
                    >
                    Open →
                    </a>
                    )}
                </div>
                ))}
            </div>
            )}
        </div>
        </div>
    );
}