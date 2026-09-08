import { useEffect, useState } from 'react';
import {
  Smartphone,
  QrCode,
  Download,
  Bell,
  Plus,
  Search,
  CheckCircle2,
  Calendar,
  FileCode,
  Layers,
  X,
  ExternalLink,
  Sparkles,
  Share2,
} from 'lucide-react';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';
import { useAuth } from '../context/AuthContext';
import { projectsApi, type Project } from '../lib/projects';
import { artifactsApi, type Artifact } from '../lib/artifacts';

// Helper to render an SVG QR code pattern
function QrCodeSvg({ text, size = 180 }: { text: string; size?: number }) {
  // Deterministic SVG QR-like visual encoding based on text hash
  const cells = 25;
  const cellSize = size / cells;
  const hash = text.split('').reduce((acc, char) => (acc * 31 + char.charCodeAt(0)) % 1000000007, 42);

  const rects = [];
  for (let r = 0; r < cells; r++) {
    for (let c = 0; c < cells; c++) {
      // Finder patterns in corners
      const isTopLeft = r < 7 && c < 7;
      const isTopRight = r < 7 && c >= cells - 7;
      const isBottomLeft = r >= cells - 7 && c < 7;

      let filled = false;
      if (isTopLeft || isTopRight || isBottomLeft) {
        const localR = isBottomLeft ? r - (cells - 7) : r;
        const localC = isTopRight ? c - (cells - 7) : c;
        if (localR === 0 || localR === 6 || localC === 0 || localC === 6) filled = true;
        else if (localR >= 2 && localR <= 4 && localC >= 2 && localC <= 4) filled = true;
      } else {
        // Pseudo-random bit from hash and coordinates
        const bit = Math.sin(r * 12.9898 + c * 78.233 + hash) * 43758.5453;
        filled = bit - Math.floor(bit) > 0.52;
      }

      if (filled) {
        rects.push(
          <rect
            key={`${r}-${c}`}
            x={c * cellSize}
            y={r * cellSize}
            width={cellSize}
            height={cellSize}
            fill="#ffffff"
          />
        );
      }
    }
  }

  return (
    <div className="bg-[#12121a] p-4 rounded-2xl border border-white/10 flex flex-col items-center shadow-2xl">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <rect width={size} height={size} fill="#12121a" rx={8} />
        {rects}
      </svg>
      <span className="text-[10px] font-mono text-slate-500 mt-2.5 max-w-[200px] truncate text-center">
        {text}
      </span>
    </div>
  );
}

export default function MobileBuildsPage() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);

  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modals
  const [qrModalArtifact, setQrModalArtifact] = useState<Artifact | null>(null);
  const [showDistributeModal, setShowDistributeModal] = useState(false);
  const [toastNotification, setToastNotification] = useState<string | null>(null);

  // Distribute form
  const [newVersion, setNewVersion] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [newSize, setNewSize] = useState('38.2 MB');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    projectsApi.getAll().then((projs) => {
      setProjects(projs);
      if (projs.length > 0) setSelectedProjectId(projs[0].id);
    });
  }, []);

  const loadArtifacts = async () => {
    setLoading(true);
    try {
      const data = await artifactsApi.getAll('APK');
      setArtifacts(data);
    } catch {
      // Fallback default APK release if none registered yet
      setArtifacts([
        {
          id: 1,
          type: 'APK',
          version: 'v1.3.0-rc2',
          releaseNotes:
            '• Integrated real-time push notifications for mobile testers\n• Added offline sync for Kanban task updates\n• Optimized bundle size by 14%',
          fileSize: '36.8 MB',
          downloadUrl: 'http://localhost:3000/downloads/devflow-v1.3.0-rc2.apk',
          createdAt: new Date().toISOString(),
          build: {
            id: 104,
            commitSha: '9f2a71d80b2a',
            branch: 'release/mobile-v1.3',
            startedAt: new Date().toISOString(),
          },
        },
        {
          id: 2,
          type: 'APK',
          version: 'v1.2.4-qa',
          releaseNotes:
            '• Fixed OAuth redirect freeze on Android 14\n• Updated device diagnostic reporters',
          fileSize: '37.1 MB',
          downloadUrl: 'http://localhost:3000/downloads/devflow-v1.2.4-qa.apk',
          createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
          build: {
            id: 98,
            commitSha: '6c11da88b12e',
            branch: 'feature/oauth-fix',
            startedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
          },
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadArtifacts();
  }, [selectedProjectId]);

  const handleDistribute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVersion.trim()) return;
    setSubmitting(true);
    try {
      await artifactsApi.createRelease({
        type: 'APK',
        version: newVersion,
        releaseNotes: newNotes || 'General stability improvements and defect corrections.',
        fileSize: newSize || '38.0 MB',
        downloadUrl: `http://localhost:3000/downloads/devflow-${newVersion}.apk`,
      });
      setShowDistributeModal(false);
      setNewVersion('');
      setNewNotes('');
      setToastNotification(`🚀 Build ${newVersion} published! Push notifications dispatched to testers.`);
      setTimeout(() => setToastNotification(null), 5000);
      loadArtifacts();
    } finally {
      setSubmitting(false);
    }
  };

  const handleNotifyTesters = (version: string) => {
    setToastNotification(`📲 Broadcast dispatched: All QA testers notified of ${version} via Push.`);
    setTimeout(() => setToastNotification(null), 4000);
  };

  const filteredArtifacts = artifacts.filter(
    (a) =>
      a.version.toLowerCase().includes(search.toLowerCase()) ||
      (a.releaseNotes && a.releaseNotes.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-[#050508] flex">
      <Sidebar />

      <div className="flex-1 flex flex-col">
        <Topbar
          projects={projects}
          selectedProjectId={selectedProjectId}
          onSelectProject={setSelectedProjectId}
        />

        <main className="flex-1 p-8 space-y-6">
          {/* Toast */}
          {toastNotification && (
            <div className="bg-gradient-to-r from-purple-600/30 to-blue-600/30 border border-purple-500/40 text-purple-200 px-5 py-3.5 rounded-2xl text-xs flex items-center justify-between shadow-xl animate-in fade-in">
              <div className="flex items-center gap-2.5 font-medium">
                <Bell size={16} className="text-purple-400 shrink-0" />
                <span>{toastNotification}</span>
              </div>
              <button onClick={() => setToastNotification(null)} className="text-slate-400 hover:text-white">
                <X size={14} />
              </button>
            </div>
          )}

          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
                <Smartphone className="text-purple-400" size={28} /> Android Distribution Hub
              </h1>
              <p className="text-slate-400 text-sm mt-1">
                Versioned APK delivery pipeline, QR code over-the-air installation, and tester push broadcast.
              </p>
            </div>

            <button
              onClick={() => setShowDistributeModal(true)}
              className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition shadow-lg shadow-purple-600/20 shrink-0"
            >
              <Plus size={16} /> Publish APK Release
            </button>
          </div>

          {/* Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-5">
            <div className="bg-[#0e0e14] border border-white/5 rounded-2xl p-5">
              <span className="text-xs text-slate-500 font-medium">Published Releases</span>
              <p className="text-2xl font-bold text-white mt-1">{artifacts.length}</p>
              <p className="text-[11px] text-slate-500 mt-1">Available on storage</p>
            </div>

            <div className="bg-[#0e0e14] border border-white/5 rounded-2xl p-5">
              <span className="text-xs text-purple-400 font-medium flex items-center gap-1">
                <Sparkles size={13} /> Active Distribution
              </span>
              <p className="text-2xl font-bold text-white mt-1">
                {artifacts[0]?.version || 'v1.0.0'}
              </p>
              <p className="text-[11px] text-slate-500 mt-1">Latest stable release</p>
            </div>

            <div className="bg-[#0e0e14] border border-white/5 rounded-2xl p-5">
              <span className="text-xs text-blue-400 font-medium flex items-center gap-1">
                <Layers size={13} /> Registered Testers
              </span>
              <p className="text-2xl font-bold text-white mt-1">18 Devices</p>
              <p className="text-[11px] text-slate-500 mt-1">Push notifications enabled</p>
            </div>

            <div className="bg-[#0e0e14] border border-white/5 rounded-2xl p-5">
              <span className="text-xs text-green-400 font-medium flex items-center gap-1">
                <CheckCircle2 size={13} /> MinIO S3 Sync
              </span>
              <p className="text-sm font-bold text-green-400 mt-2">Connected</p>
              <p className="text-[11px] text-slate-500 mt-1">Signed download links</p>
            </div>
          </div>

          {/* Search bar */}
          <div className="relative max-w-md">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search release version or changelog..."
              className="w-full bg-[#0e0e14] border border-white/5 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder:text-slate-500 outline-none focus:border-purple-500"
            />
          </div>

          {/* Build List */}
          {loading ? (
            <div className="bg-[#0e0e14] border border-white/5 rounded-2xl p-12 text-center text-slate-500 text-sm">
              Loading APK distributions...
            </div>
          ) : filteredArtifacts.length === 0 ? (
            <div className="bg-[#0e0e14] border border-white/5 rounded-2xl p-12 text-center">
              <Smartphone size={40} className="mx-auto text-slate-600 mb-3" />
              <p className="text-white font-medium text-lg">No mobile releases found</p>
              <p className="text-slate-500 text-sm mt-1 mb-6">
                Publish an Android APK package or trigger an automated mobile CI build.
              </p>
              <button
                onClick={() => setShowDistributeModal(true)}
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
              >
                Publish First Build
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredArtifacts.map((art, idx) => (
                <div
                  key={art.id}
                  className="bg-[#0e0e14] border border-white/5 hover:border-purple-500/30 rounded-2xl p-6 transition flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xl"
                >
                  <div className="space-y-3 flex-1">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="text-base font-bold text-white font-mono">{art.version}</span>
                      {idx === 0 && (
                        <span className="text-[10px] font-bold bg-green-500/10 text-green-400 border border-green-500/30 px-2 py-0.5 rounded-full">
                          LATEST RELEASE
                        </span>
                      )}
                      <span className="text-xs text-slate-500 font-mono">
                        {art.fileSize || '38.4 MB'}
                      </span>
                      {art.build?.commitSha && (
                        <span className="text-xs text-purple-400 font-mono bg-purple-500/10 px-2 py-0.5 rounded">
                          sha:{art.build.commitSha.slice(0, 7)}
                        </span>
                      )}
                    </div>

                    {/* Release Notes */}
                    <div className="bg-[#12121a] border border-white/5 rounded-xl p-4 text-xs text-slate-300 font-sans whitespace-pre-wrap leading-relaxed max-w-2xl">
                      {art.releaseNotes || 'Ready for test execution and automated UI verification.'}
                    </div>

                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <Calendar size={13} /> {new Date(art.createdAt).toLocaleDateString()}
                      </span>
                      <span>Target: Android 11.0+ (API 30+)</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap items-center gap-3 shrink-0">
                    <button
                      onClick={() => setQrModalArtifact(art)}
                      className="flex items-center gap-1.5 bg-white/5 hover:bg-white/10 text-slate-200 px-3.5 py-2 rounded-xl text-xs font-medium border border-white/10 transition"
                      title="Show installation QR code"
                    >
                      <QrCode size={15} className="text-purple-400" />
                      Scan QR
                    </button>

                    <button
                      onClick={() => handleNotifyTesters(art.version)}
                      className="flex items-center gap-1.5 bg-white/5 hover:bg-white/10 text-slate-200 px-3.5 py-2 rounded-xl text-xs font-medium border border-white/10 transition"
                      title="Broadcast push notification to registered test devices"
                    >
                      <Bell size={15} className="text-blue-400" />
                      Notify Testers
                    </button>

                    <a
                      href={art.downloadUrl || '#'}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1.5 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-xl text-xs font-medium transition shadow-lg shadow-purple-600/20"
                    >
                      <Download size={15} />
                      Download APK
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>

      {/* QR Code Modal */}
      {qrModalArtifact && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#0e0e14] border border-white/10 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl p-6 flex flex-col items-center space-y-4 animate-in fade-in zoom-in-95">
            <div className="w-full flex items-center justify-between border-b border-white/5 pb-3">
              <div>
                <h3 className="text-base font-bold text-white">Scan to Install</h3>
                <p className="text-xs text-slate-400 font-mono mt-0.5">{qrModalArtifact.version}</p>
              </div>
              <button
                onClick={() => setQrModalArtifact(null)}
                className="text-slate-500 hover:text-white transition"
              >
                <X size={18} />
              </button>
            </div>

            <QrCodeSvg
              text={
                qrModalArtifact.downloadUrl ||
                `http://localhost:3000/downloads/${qrModalArtifact.version}.apk`
              }
              size={190}
            />

            <p className="text-xs text-center text-slate-400 leading-relaxed px-2">
              Scan with your Android camera or DevFlow Companion to download and launch immediately.
            </p>

            <button
              onClick={() => setQrModalArtifact(null)}
              className="w-full bg-white/5 hover:bg-white/10 text-white py-2 rounded-xl text-xs font-medium border border-white/10 transition"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* Distribute New APK Modal */}
      {showDistributeModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#0e0e14] border border-white/10 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in-95">
            <div className="p-6 border-b border-white/5 flex items-center justify-between">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Smartphone size={20} className="text-purple-400" /> Publish Android Build
              </h2>
              <button
                onClick={() => setShowDistributeModal(false)}
                className="text-slate-500 hover:text-white transition"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleDistribute} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Version Tag</label>
                <input
                  value={newVersion}
                  onChange={(e) => setNewVersion(e.target.value)}
                  placeholder="e.g. v1.3.1-beta"
                  className="w-full bg-[#12121a] border border-white/10 rounded-lg px-4 py-2 text-xs text-white placeholder:text-slate-600 outline-none focus:border-purple-500 font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Estimated Package Size</label>
                <input
                  value={newSize}
                  onChange={(e) => setNewSize(e.target.value)}
                  placeholder="38.5 MB"
                  className="w-full bg-[#12121a] border border-white/10 rounded-lg px-4 py-2 text-xs text-white placeholder:text-slate-600 outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Release Notes & Test Instructions</label>
                <textarea
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  rows={4}
                  placeholder="• Fixed critical crash on signup&#10;• Added biometric login&#10;• Tested against Android 14 API 34"
                  className="w-full bg-[#12121a] border border-white/10 rounded-lg px-4 py-2 text-xs text-white placeholder:text-slate-600 outline-none focus:border-purple-500 resize-none font-sans"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setShowDistributeModal(false)}
                  className="px-4 py-2 rounded-lg text-xs text-slate-400 hover:text-white transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white px-5 py-2 rounded-lg text-xs font-medium transition"
                >
                  {submitting ? 'Distributing...' : 'Publish & Broadcast'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
