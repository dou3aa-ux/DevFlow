import { useEffect, useState } from 'react';
import {
  Plus,
  Search,
  RotateCw,
  Terminal,
  Activity,
  Server,
  X,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
} from 'lucide-react';
import Sidebar from '../components/Sidebar';
import { infrastructureApi, type ContainerInfo } from '../lib/infrastructure';

const STATE_STYLE: Record<string, string> = {
  RUNNING: 'bg-green-500/10 text-green-400 border-green-500/20',
  STOPPED: 'bg-red-500/10 text-red-400 border-red-500/20',
  DEGRADED: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
};

export default function InfrastructurePage() {
  const [containers, setContainers] = useState<ContainerInfo[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Restarting state per container
  const [restarting, setRestarting] = useState<Record<string, boolean>>({});
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Logs modal
  const [selectedLogsContainer, setSelectedLogsContainer] = useState<string | null>(null);
  const [containerLogs, setContainerLogs] = useState<string>('');
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [copiedLogs, setCopiedLogs] = useState(false);

  const load = () => {
    infrastructureApi.getContainers().then((c) => {
      setContainers(c);
      setLoading(false);
    });
  };

  useEffect(() => {
    load();
    const interval = setInterval(load, 8000);
    return () => clearInterval(interval);
  }, []);

  const handleRestart = async (containerName: string) => {
    setRestarting((prev) => ({ ...prev, [containerName]: true }));
    try {
      const res = await infrastructureApi.restartContainer(containerName);
      setToastMessage(res.message);
      setTimeout(() => setToastMessage(null), 4000);
      load();
    } finally {
      setRestarting((prev) => ({ ...prev, [containerName]: false }));
    }
  };

  const handleOpenLogs = async (containerName: string) => {
    setSelectedLogsContainer(containerName);
    setLoadingLogs(true);
    try {
      const res = await infrastructureApi.getLogs(containerName, 150);
      setContainerLogs(res.logs);
    } catch {
      setContainerLogs('Failed to retrieve logs.');
    } finally {
      setLoadingLogs(false);
    }
  };

  const handleCopyLogs = () => {
    navigator.clipboard.writeText(containerLogs);
    setCopiedLogs(true);
    setTimeout(() => setCopiedLogs(false), 2000);
  };

  const runningCount = containers.filter((c) => c.state === 'RUNNING').length;
  const avgCpu =
    containers.length > 0
      ? (
          containers.reduce((sum, c) => sum + (parseFloat(c.cpuPercent) || 0), 0) / containers.length
        ).toFixed(1)
      : '0.0';

  const filtered = containers.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="min-h-screen bg-[#050508] flex">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <header className="h-20 border-b border-white/5 flex items-center justify-between px-8">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              <Server size={22} className="text-purple-400" /> Infrastructure Management
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Live daemon monitoring — {runningCount} of {containers.length} service containers operational
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={load}
              className="flex items-center gap-2 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white px-4 py-2 rounded-lg text-xs font-medium border border-white/10 transition"
            >
              <RotateCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh Telemetry
            </button>
          </div>
        </header>

        <main className="flex-1 p-8 space-y-6">
          {/* Toast Notification */}
          {toastMessage && (
            <div className="bg-purple-600/20 border border-purple-500/40 text-purple-200 px-4 py-3 rounded-xl text-xs flex items-center gap-2.5 animate-in fade-in">
              <CheckCircle2 size={16} className="text-purple-400 shrink-0" />
              <span>{toastMessage}</span>
            </div>
          )}

          {/* Metric Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-[#0e0e14] border border-white/5 rounded-2xl p-6">
              <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-2">
                <span>Avg CPU Utilization</span>
                <Activity size={16} className="text-purple-400" />
              </div>
              <p className="text-3xl font-bold text-white">{avgCpu}%</p>
              <p className="text-slate-500 text-xs mt-2">Active running workload</p>
            </div>

            <div className="bg-[#0e0e14] border border-white/5 rounded-2xl p-6">
              <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-2">
                <span>Container Availability</span>
                <Server size={16} className="text-green-400" />
              </div>
              <p className="text-3xl font-bold text-white">
                {runningCount} <span className="text-lg text-slate-500 font-normal">/ {containers.length}</span>
              </p>
              <p className="text-slate-500 text-xs mt-2">Docker Alpine services</p>
            </div>

            <div className="bg-[#0e0e14] border border-white/5 rounded-2xl p-6">
              <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-2">
                <span>Monitoring Subsystem</span>
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              </div>
              <p className="text-sm text-white font-medium">Prometheus & Docker Daemon</p>
              <p className="text-slate-500 text-xs mt-2">Streaming real-time stdout/stderr</p>
            </div>
          </div>

          {/* Containers Table */}
          <div className="bg-[#0e0e14] border border-white/5 rounded-2xl p-6 shadow-xl">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
              <div>
                <h3 className="text-white font-semibold text-lg">Active Cluster Services</h3>
                <p className="text-slate-500 text-xs mt-0.5">Direct telemetry inspection and container restart controls</p>
              </div>

              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Filter containers..."
                  className="bg-[#12121a] border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder:text-slate-500 outline-none w-64 focus:border-purple-500/50"
                />
              </div>
            </div>

            {loading ? (
              <p className="text-slate-500 text-sm py-8 text-center">Reading docker engine telemetry...</p>
            ) : filtered.length === 0 ? (
              <p className="text-slate-500 text-sm py-8 text-center">No service containers found matching criteria.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead>
                    <tr className="text-slate-500 text-xs border-b border-white/5">
                      <th className="pb-3 font-medium">Container Name</th>
                      <th className="pb-3 font-medium">Image</th>
                      <th className="pb-3 font-medium">Status</th>
                      <th className="pb-3 font-medium">CPU %</th>
                      <th className="pb-3 font-medium">Mem %</th>
                      <th className="pb-3 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filtered.map((c) => {
                      const isRestarting = !!restarting[c.name];
                      return (
                        <tr key={c.name} className="hover:bg-white/[0.01] transition">
                          <td className="py-4 text-white font-medium font-mono text-xs">{c.name}</td>
                          <td className="py-4 text-slate-400 text-xs font-mono">{c.image}</td>
                          <td className="py-4">
                            <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${STATE_STYLE[c.state]}`}>
                              {c.state}
                            </span>
                          </td>
                          <td className="py-4 text-slate-300 font-mono text-xs">{c.cpuPercent}</td>
                          <td className="py-4 text-slate-300 font-mono text-xs">{c.memPercent}</td>
                          <td className="py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleOpenLogs(c.name)}
                                className="flex items-center gap-1 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white px-2.5 py-1.5 rounded-lg text-xs font-medium border border-white/5 transition"
                                title="Inspect container logs"
                              >
                                <Terminal size={12} /> Logs
                              </button>

                              <button
                                onClick={() => handleRestart(c.name)}
                                disabled={isRestarting}
                                className="flex items-center gap-1 bg-purple-600/15 hover:bg-purple-600/30 text-purple-300 border border-purple-600/30 px-2.5 py-1.5 rounded-lg text-xs font-medium transition disabled:opacity-50"
                                title="Restart container"
                              >
                                <RotateCw size={12} className={isRestarting ? 'animate-spin' : ''} />
                                {isRestarting ? 'Restarting...' : 'Restart'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Logs Modal */}
      {selectedLogsContainer && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#0e0e14] border border-white/10 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95">
            <div className="p-4 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Terminal size={18} className="text-purple-400" />
                <h3 className="text-white font-mono text-sm font-semibold">{selectedLogsContainer} – Stdout/Stderr</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyLogs}
                  className="flex items-center gap-1 text-xs text-slate-400 hover:text-white bg-white/5 px-2.5 py-1.5 rounded-lg border border-white/10 transition"
                >
                  {copiedLogs ? <Check size={13} className="text-green-400" /> : <Copy size={13} />}
                  <span>{copiedLogs ? 'Copied' : 'Copy'}</span>
                </button>
                <button
                  onClick={() => setSelectedLogsContainer(null)}
                  className="text-slate-500 hover:text-white p-1 rounded-lg transition"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="p-4 bg-black flex-1 overflow-y-auto">
              {loadingLogs ? (
                <p className="text-slate-500 text-xs font-mono">Fetching latest logs...</p>
              ) : (
                <pre className="text-xs text-green-400 font-mono whitespace-pre-wrap leading-relaxed">
                  {containerLogs}
                </pre>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}