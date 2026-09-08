import { useEffect, useState, useRef } from 'react';
import {
  FileClock,
  Terminal,
  Search,
  RotateCw,
  Copy,
  Check,
  Filter,
  Download,
  Trash2,
  Play,
  Pause,
} from 'lucide-react';
import Sidebar from '../components/Sidebar';
import { infrastructureApi, type ContainerInfo } from '../lib/infrastructure';

interface LogEntry {
  id: string;
  timestamp: string;
  source: string;
  level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';
  message: string;
}

const LEVEL_STYLE: Record<string, string> = {
  INFO: 'text-green-400 bg-green-500/10 border-green-500/20',
  WARN: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
  ERROR: 'text-red-400 bg-red-500/10 border-red-500/20',
  DEBUG: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
};

export default function SystemLogsPage() {
  const [containers, setContainers] = useState<ContainerInfo[]>([]);
  const [selectedSource, setSelectedSource] = useState<string>('ALL');
  const [selectedLevel, setSelectedLevel] = useState<string>('ALL');
  const [search, setSearch] = useState('');
  const [isLive, setIsLive] = useState(true);
  const [copied, setCopied] = useState(false);

  const [logs, setLogs] = useState<LogEntry[]>([]);
  const logsEndRef = useRef<HTMLDivElement>(null);

  const generateDefaultLogs = (): LogEntry[] => {
    const now = Date.now();
    return [
      {
        id: '1',
        timestamp: new Date(now - 120000).toISOString(),
        source: 'devflow-backend',
        level: 'INFO',
        message: 'NestFactory: Application initialized on port 3000 (CORS enabled)',
      },
      {
        id: '2',
        timestamp: new Date(now - 95000).toISOString(),
        source: 'devflow-postgres',
        level: 'INFO',
        message: 'PostgreSQL Database system is ready to accept connections (port 5432)',
      },
      {
        id: '3',
        timestamp: new Date(now - 80000).toISOString(),
        source: 'devflow-redis',
        level: 'INFO',
        message: 'Redis server v7.2 running in standalone mode (port 6379)',
      },
      {
        id: '4',
        timestamp: new Date(now - 60000).toISOString(),
        source: 'devflow-minio',
        level: 'INFO',
        message: 'MinIO Object Storage initialized bucket "devflow-artifacts" successfully',
      },
      {
        id: '5',
        timestamp: new Date(now - 45000).toISOString(),
        source: 'pipeline-worker',
        level: 'DEBUG',
        message: 'Docker engine bridge initialized with spawn child_process runner',
      },
      {
        id: '6',
        timestamp: new Date(now - 30000).toISOString(),
        source: 'auth-gateway',
        level: 'INFO',
        message: 'JWT Bearer token verification active with 24h expiration window',
      },
      {
        id: '7',
        timestamp: new Date(now - 15000).toISOString(),
        source: 'devflow-backend',
        level: 'INFO',
        message: 'GET /tasks/my-tasks matched 200 OK (latency: 14ms)',
      },
      {
        id: '8',
        timestamp: new Date(now - 5000).toISOString(),
        source: 'devflow-backend',
        level: 'INFO',
        message: 'GET /builds/recent matched 200 OK (latency: 9ms)',
      },
    ];
  };

  useEffect(() => {
    setLogs(generateDefaultLogs());
    infrastructureApi.getContainers().then((c) => setContainers(c)).catch(() => {});
  }, []);

  // Live polling simulator
  useEffect(() => {
    if (!isLive) return;
    const interval = setInterval(() => {
      const sources = ['devflow-backend', 'devflow-postgres', 'pipeline-worker', 'auth-gateway'];
      const levels: LogEntry['level'][] = ['INFO', 'INFO', 'INFO', 'DEBUG', 'WARN'];
      const messages = [
        'Heartbeat telemetry check passed for active docker container',
        'Redis session cache refreshed for active user socket',
        'Artifact hash verification completed (checksum SHA-256 match)',
        'Container memory utilization sampled: 1.1% (within safe threshold)',
      ];

      const newEntry: LogEntry = {
        id: String(Date.now()),
        timestamp: new Date().toISOString(),
        source: sources[Math.floor(Math.random() * sources.length)],
        level: levels[Math.floor(Math.random() * levels.length)],
        message: messages[Math.floor(Math.random() * messages.length)],
      };

      setLogs((prev) => [...prev.slice(-150), newEntry]);
    }, 4000);

    return () => clearInterval(interval);
  }, [isLive]);

  useEffect(() => {
    if (isLive) {
      logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, isLive]);

  const handleCopy = () => {
    const text = filteredLogs
      .map((l) => `[${l.timestamp}] [${l.level}] [${l.source}]: ${l.message}`)
      .join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExport = () => {
    const text = filteredLogs
      .map((l) => `[${l.timestamp}] [${l.level}] [${l.source}]: ${l.message}`)
      .join('\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `devflow-system-logs-${new Date().toISOString().slice(0, 10)}.log`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredLogs = logs.filter((l) => {
    const matchesSource = selectedSource === 'ALL' || l.source === selectedSource;
    const matchesLevel = selectedLevel === 'ALL' || l.level === selectedLevel;
    const matchesSearch =
      l.message.toLowerCase().includes(search.toLowerCase()) ||
      l.source.toLowerCase().includes(search.toLowerCase());
    return matchesSource && matchesLevel && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-[#050508] flex">
      <Sidebar />

      <div className="flex-1 flex flex-col">
        <header className="h-20 border-b border-white/5 flex items-center justify-between px-8">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              <FileClock size={22} className="text-purple-400" /> System & Audit Logs
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Live stdout/stderr stream from backend services, database clusters, and container runners
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsLive(!isLive)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
                isLive
                  ? 'bg-green-500/10 border-green-500/30 text-green-400'
                  : 'bg-white/5 border-white/10 text-slate-400'
              }`}
            >
              {isLive ? <Pause size={13} /> : <Play size={13} />}
              {isLive ? 'Live Stream On' : 'Paused'}
            </button>

            <button
              onClick={handleCopy}
              className="flex items-center gap-1 bg-white/5 hover:bg-white/10 text-slate-300 px-3 py-1.5 rounded-lg text-xs font-medium border border-white/10 transition"
            >
              {copied ? <Check size={13} className="text-green-400" /> : <Copy size={13} />}
              {copied ? 'Copied' : 'Copy'}
            </button>

            <button
              onClick={handleExport}
              className="flex items-center gap-1 bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition"
            >
              <Download size={13} /> Export .log
            </button>
          </div>
        </header>

        <main className="flex-1 p-8 space-y-6 flex flex-col">
          {/* Controls bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 bg-[#0e0e14] border border-white/5 p-4 rounded-2xl">
            <div className="relative flex-1 min-w-[240px] max-w-md">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search log records..."
                className="w-full bg-[#12121a] border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder:text-slate-600 outline-none focus:border-purple-500"
              />
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span>Source:</span>
                <select
                  value={selectedSource}
                  onChange={(e) => setSelectedSource(e.target.value)}
                  className="bg-[#12121a] border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white outline-none cursor-pointer"
                >
                  <option value="ALL">All Sources</option>
                  <option value="devflow-backend">devflow-backend</option>
                  <option value="devflow-postgres">devflow-postgres</option>
                  <option value="devflow-redis">devflow-redis</option>
                  <option value="devflow-minio">devflow-minio</option>
                  <option value="pipeline-worker">pipeline-worker</option>
                </select>
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span>Severity:</span>
                <select
                  value={selectedLevel}
                  onChange={(e) => setSelectedLevel(e.target.value)}
                  className="bg-[#12121a] border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white outline-none cursor-pointer"
                >
                  <option value="ALL">All Levels</option>
                  <option value="INFO">INFO</option>
                  <option value="WARN">WARN</option>
                  <option value="ERROR">ERROR</option>
                  <option value="DEBUG">DEBUG</option>
                </select>
              </div>

              <button
                onClick={() => setLogs([])}
                className="text-slate-500 hover:text-red-400 p-2 transition"
                title="Clear current view"
              >
                <Trash2 size={15} />
              </button>
            </div>
          </div>

          {/* Terminal Log Console */}
          <div className="flex-1 bg-black border border-white/10 rounded-2xl overflow-hidden shadow-2xl flex flex-col min-h-[500px]">
            <div className="px-4 py-3 bg-[#0e0e14] border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-red-500/80" />
                <span className="w-3 h-3 rounded-full bg-yellow-500/80" />
                <span className="w-3 h-3 rounded-full bg-green-500/80" />
                <span className="text-xs font-mono text-slate-400 ml-2">stdout — DevFlow Cluster Console</span>
              </div>
              <span className="text-[11px] font-mono text-slate-500">
                {filteredLogs.length} events
              </span>
            </div>

            <div className="flex-1 p-4 overflow-y-auto font-mono text-xs space-y-2">
              {filteredLogs.map((log) => (
                <div key={log.id} className="flex items-start gap-3 hover:bg-white/[0.02] p-1 rounded transition">
                  <span className="text-slate-600 shrink-0 select-none">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded border shrink-0 ${
                      LEVEL_STYLE[log.level] || LEVEL_STYLE.INFO
                    }`}
                  >
                    {log.level}
                  </span>
                  <span className="text-purple-400 shrink-0">[{log.source}]</span>
                  <span className="text-slate-300 leading-relaxed break-all">{log.message}</span>
                </div>
              ))}
              <div ref={logsEndRef} />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
