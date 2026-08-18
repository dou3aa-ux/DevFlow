import { useEffect, useState } from 'react';
import { Plus, Search } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import { infrastructureApi } from '../lib/infrastructure';
import type { ContainerInfo } from '../lib/infrastructure';

const STATE_STYLE: Record<string, string> = {
  RUNNING: 'bg-green-500/10 text-green-400 border-green-500/20',
  STOPPED: 'bg-red-500/10 text-red-400 border-red-500/20',
  DEGRADED: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
};

export default function InfrastructurePage() {
  const [containers, setContainers] = useState<ContainerInfo[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const load = () => {
    infrastructureApi.getContainers().then((c) => {
      setContainers(c);
      setLoading(false);
    });
  };

  useEffect(() => {
    load();
    const interval = setInterval(load, 10000); // refresh every 10s, real docker stats each time
    return () => clearInterval(interval);
  }, []);

  const runningCount = containers.filter((c) => c.state === 'RUNNING').length;
  const avgCpu =
    containers.length > 0
      ? (
          containers.reduce((sum, c) => sum + parseFloat(c.cpuPercent) || 0, 0) / containers.length
        ).toFixed(1)
      : '0.0';

  const filtered = containers.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="min-h-screen bg-[#050508] flex">
      <Sidebar />
      <div className="flex-1">
        <header className="h-20 border-b border-white/5 flex items-center justify-between px-8">
          <div>
            <h1 className="text-2xl font-bold text-white">Infrastructure Management</h1>
            <p className="text-sm text-slate-500 mt-1">
              Live from your local Docker daemon — {runningCount} of {containers.length} containers running
            </p>
          </div>
          <button className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition">
            <Plus size={16} /> Deploy Service
          </button>
        </header>

        <main className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-[#0e0e14] border border-white/5 rounded-2xl p-6">
              <p className="text-slate-400 text-sm mb-1">Avg CPU Usage (running containers)</p>
              <p className="text-3xl font-bold text-white">{avgCpu}%</p>
            </div>
            <div className="bg-[#0e0e14] border border-white/5 rounded-2xl p-6">
              <p className="text-slate-400 text-sm mb-1">Running Containers</p>
              <p className="text-3xl font-bold text-white">
                {runningCount} <span className="text-lg text-slate-500">/ {containers.length}</span>
              </p>
            </div>
            <div className="bg-[#0e0e14] border border-white/5 rounded-2xl p-6">
              <p className="text-slate-400 text-sm mb-1">Disk / Network I/O</p>
              <p className="text-sm text-slate-500 italic mt-2">
                Not tracked yet — requires the Monitoring module (Prometheus/Grafana).
              </p>
            </div>
          </div>

          <div className="bg-[#0e0e14] border border-white/5 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold text-lg">Active Containers</h3>
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search..."
                  className="bg-white/5 border border-white/10 rounded-lg pl-8 pr-3 py-2 text-sm text-white outline-none w-56"
                />
              </div>
            </div>

            {loading ? (
              <p className="text-slate-500 text-sm py-6 text-center">Loading containers...</p>
            ) : filtered.length === 0 ? (
              <p className="text-slate-500 text-sm py-6 text-center">No containers found.</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-500 text-xs border-b border-white/5">
                    <th className="pb-3 font-medium">Container Name</th>
                    <th className="pb-3 font-medium">Status</th>
                    <th className="pb-3 font-medium">CPU %</th>
                    <th className="pb-3 font-medium">Mem %</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((c) => (
                    <tr key={c.name} className="border-b border-white/5 last:border-0">
                      <td className="py-4 text-white font-medium">{c.name}</td>
                      <td className="py-4">
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${STATE_STYLE[c.state]}`}>
                          {c.state}
                        </span>
                      </td>
                      <td className="py-4 text-slate-300">{c.cpuPercent}</td>
                      <td className="py-4 text-slate-300">{c.memPercent}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}