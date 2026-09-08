import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Bug,
  Plus,
  Filter,
  Search,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Smartphone,
  Image as ImageIcon,
  ExternalLink,
  X,
  ChevronDown,
} from 'lucide-react';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';
import { useAuth } from '../context/AuthContext';
import { projectsApi, type Project } from '../lib/projects';
import { tasksApi, type Task } from '../lib/tasks';
import { bugsApi, type BugReport, type BugSeverity, type BugStatus } from '../lib/bugs';

const SEVERITY_BADGE: Record<BugSeverity, { label: string; classes: string }> = {
  CRITICAL: { label: 'CRITICAL', classes: 'bg-red-500/10 text-red-400 border-red-500/30' },
  HIGH: { label: 'HIGH', classes: 'bg-orange-500/10 text-orange-400 border-orange-500/30' },
  MEDIUM: { label: 'MEDIUM', classes: 'bg-blue-500/10 text-blue-400 border-blue-500/30' },
  LOW: { label: 'LOW', classes: 'bg-slate-500/10 text-slate-400 border-slate-500/30' },
};

const STATUS_BADGE: Record<BugStatus, { label: string; classes: string }> = {
  TODO: { label: 'Open', classes: 'bg-slate-500/10 text-slate-300 border-slate-500/20' },
  IN_PROGRESS: { label: 'Triaging', classes: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
  IN_REVIEW: { label: 'In QA Review', classes: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' },
  DONE: { label: 'Resolved', classes: 'bg-green-500/10 text-green-400 border-green-500/20' },
};

export default function QABugsPage() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const queryTaskId = searchParams.get('taskId') ? Number(searchParams.get('taskId')) : null;
  const queryProjectId = searchParams.get('projectId') ? Number(searchParams.get('projectId')) : null;

  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(queryProjectId);
  const [bugs, setBugs] = useState<BugReport[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Submit Bug Modal state
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formTaskId, setFormTaskId] = useState<number | ''>(queryTaskId || '');
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formSeverity, setFormSeverity] = useState<BugSeverity>('HIGH');
  const [formDeviceInfo, setFormDeviceInfo] = useState('Pixel 8 (Android 14) - DevFlow v1.2.0');
  const [formScreenshotUrl, setFormScreenshotUrl] = useState('');

  // Screenshot preview modal
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  useEffect(() => {
    projectsApi.getAll().then((projs) => {
      setProjects(projs);
      if (!selectedProjectId && projs.length > 0) {
        setSelectedProjectId(projs[0].id);
      }
    });
  }, []);

  const loadBugsAndTasks = async (pid: number) => {
    setLoading(true);
    try {
      const [bugsData, tasksData] = await Promise.all([
        bugsApi.getAll(pid, queryTaskId || undefined),
        tasksApi.getAll(pid).catch(() => []),
      ]);
      setBugs(bugsData);
      setTasks(tasksData);
      if (!formTaskId && tasksData.length > 0) {
        setFormTaskId(tasksData[0].id);
      }
    } catch {
      setBugs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedProjectId) {
      loadBugsAndTasks(selectedProjectId);
    }
  }, [selectedProjectId]);

  const handleCreateBug = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTaskId || !formTitle.trim()) return;
    setSubmitting(true);
    try {
      await bugsApi.create(Number(formTaskId), {
        title: formTitle,
        description: formDescription || undefined,
        severity: formSeverity,
        deviceInfo: formDeviceInfo || undefined,
        screenshotUrl: formScreenshotUrl || undefined,
      });
      setShowModal(false);
      setFormTitle('');
      setFormDescription('');
      setFormScreenshotUrl('');
      if (selectedProjectId) loadBugsAndTasks(selectedProjectId);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async (bugId: number, nextStatus: BugStatus) => {
    await bugsApi.updateStatus(bugId, nextStatus);
    if (selectedProjectId) loadBugsAndTasks(selectedProjectId);
  };

  const filteredBugs = bugs.filter((b) => {
    const matchesSearch =
      b.title.toLowerCase().includes(search.toLowerCase()) ||
      (b.description && b.description.toLowerCase().includes(search.toLowerCase())) ||
      (b.deviceInfo && b.deviceInfo.toLowerCase().includes(search.toLowerCase()));

    const matchesSeverity = severityFilter === 'ALL' || b.severity === severityFilter;
    const matchesStatus = statusFilter === 'ALL' || b.status === statusFilter;

    return matchesSearch && matchesSeverity && matchesStatus;
  });

  const criticalCount = bugs.filter((b) => b.severity === 'CRITICAL' && b.status !== 'DONE').length;
  const inReviewCount = bugs.filter((b) => b.status === 'IN_REVIEW').length;
  const resolvedCount = bugs.filter((b) => b.status === 'DONE').length;

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
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
                <Bug className="text-red-400" size={28} /> QA Bug Tracker
              </h1>
              <p className="text-slate-400 text-sm mt-1">
                Log, triage, and verify defects with device specifications, stacktraces, and visual proof.
              </p>
            </div>

            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition shadow-lg shadow-red-600/20 shrink-0"
            >
              <Plus size={16} /> Submit Bug Report
            </button>
          </div>

          {/* Metrics row */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-5">
            <div className="bg-[#0e0e14] border border-white/5 rounded-2xl p-5">
              <span className="text-xs text-slate-500 font-medium">Reported Issues</span>
              <p className="text-2xl font-bold text-white mt-1">{bugs.length}</p>
              <p className="text-[11px] text-slate-500 mt-1">Across active sprints</p>
            </div>

            <div className="bg-[#0e0e14] border border-white/5 rounded-2xl p-5">
              <span className="text-xs text-red-400 font-medium flex items-center gap-1">
                <AlertTriangle size={13} /> Critical Blockers
              </span>
              <p className="text-2xl font-bold text-red-400 mt-1">{criticalCount}</p>
              <p className="text-[11px] text-slate-500 mt-1">Requires immediate hotfix</p>
            </div>

            <div className="bg-[#0e0e14] border border-white/5 rounded-2xl p-5">
              <span className="text-xs text-yellow-400 font-medium flex items-center gap-1">
                <Clock size={13} /> In QA Verification
              </span>
              <p className="text-2xl font-bold text-white mt-1">{inReviewCount}</p>
              <p className="text-[11px] text-slate-500 mt-1">Awaiting tester sign-off</p>
            </div>

            <div className="bg-[#0e0e14] border border-white/5 rounded-2xl p-5">
              <span className="text-xs text-green-400 font-medium flex items-center gap-1">
                <CheckCircle2 size={13} /> Verified & Closed
              </span>
              <p className="text-2xl font-bold text-green-400 mt-1">{resolvedCount}</p>
              <p className="text-[11px] text-slate-500 mt-1">Passed test suite</p>
            </div>
          </div>

          {/* Filters Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 bg-[#0e0e14] border border-white/5 p-4 rounded-2xl">
            <div className="relative flex-1 min-w-[240px] max-w-md">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search bugs by keyword or device..."
                className="w-full bg-[#12121a] border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder:text-slate-600 outline-none focus:border-purple-500"
              />
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span>Severity:</span>
                <select
                  value={severityFilter}
                  onChange={(e) => setSeverityFilter(e.target.value)}
                  className="bg-[#12121a] border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white outline-none cursor-pointer"
                >
                  <option value="ALL">All Severities</option>
                  <option value="CRITICAL">Critical</option>
                  <option value="HIGH">High</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="LOW">Low</option>
                </select>
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span>Status:</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-[#12121a] border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white outline-none cursor-pointer"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="TODO">Open</option>
                  <option value="IN_PROGRESS">Triaging</option>
                  <option value="IN_REVIEW">In Review</option>
                  <option value="DONE">Resolved</option>
                </select>
              </div>
            </div>
          </div>

          {/* Bug List Cards */}
          {loading ? (
            <div className="bg-[#0e0e14] border border-white/5 rounded-2xl p-12 text-center text-slate-500 text-sm">
              Loading QA defect reports...
            </div>
          ) : filteredBugs.length === 0 ? (
            <div className="bg-[#0e0e14] border border-white/5 rounded-2xl p-12 text-center">
              <CheckCircle2 size={40} className="mx-auto text-green-500/50 mb-3" />
              <p className="text-white font-medium text-lg">No defects found</p>
              <p className="text-slate-500 text-sm mt-1 mb-6">
                All quality criteria passed or adjust your active filters.
              </p>
              <button
                onClick={() => setShowModal(true)}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
              >
                Log a Defect
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredBugs.map((bug) => {
                const sev = SEVERITY_BADGE[bug.severity];
                const stat = STATUS_BADGE[bug.status];
                return (
                  <div
                    key={bug.id}
                    className="bg-[#0e0e14] border border-white/5 hover:border-white/10 rounded-2xl p-6 transition flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-lg"
                  >
                    <div className="space-y-2.5 flex-1">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${sev.classes}`}>
                          {sev.label}
                        </span>
                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${stat.classes}`}>
                          {stat.label}
                        </span>
                        <span className="text-xs text-slate-500 font-mono">BUG #{bug.id}</span>
                        {bug.task && (
                          <span className="text-xs text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
                            Task: {bug.task.title}
                          </span>
                        )}
                      </div>

                      <h3 className="text-lg font-bold text-white leading-snug">{bug.title}</h3>

                      {bug.description && (
                        <p className="text-xs text-slate-400 leading-relaxed whitespace-pre-wrap line-clamp-2">
                          {bug.description}
                        </p>
                      )}

                      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-1">
                        {bug.deviceInfo && (
                          <span className="flex items-center gap-1.5 text-slate-300 bg-white/5 px-2.5 py-1 rounded-lg">
                            <Smartphone size={13} className="text-purple-400" />
                            {bug.deviceInfo}
                          </span>
                        )}

                        <span>
                          Reported by <strong className="text-slate-300 font-medium">{bug.reportedBy?.username || 'Tester'}</strong>
                        </span>

                        <span>{new Date(bug.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      {bug.screenshotUrl && (
                        <button
                          onClick={() => setPreviewImage(bug.screenshotUrl || null)}
                          className="flex items-center gap-1.5 bg-white/5 hover:bg-white/10 text-slate-300 px-3 py-2 rounded-xl text-xs font-medium border border-white/10 transition"
                        >
                          <ImageIcon size={14} className="text-blue-400" />
                          Screenshot
                        </button>
                      )}

                      {bug.status === 'TODO' && (
                        <button
                          onClick={() => handleUpdateStatus(bug.id, 'IN_PROGRESS')}
                          className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-xl text-xs font-medium transition"
                        >
                          Start Triaging
                        </button>
                      )}

                      {bug.status === 'IN_PROGRESS' && (
                        <button
                          onClick={() => handleUpdateStatus(bug.id, 'IN_REVIEW')}
                          className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-xl text-xs font-medium transition"
                        >
                          Send to QA
                        </button>
                      )}

                      {bug.status === 'IN_REVIEW' && (
                        <button
                          onClick={() => handleUpdateStatus(bug.id, 'DONE')}
                          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl text-xs font-medium transition"
                        >
                          Verify & Close
                        </button>
                      )}

                      {bug.status === 'DONE' && (
                        <button
                          onClick={() => handleUpdateStatus(bug.id, 'IN_PROGRESS')}
                          className="bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white px-3 py-2 rounded-xl text-xs font-medium border border-white/5 transition"
                        >
                          Reopen
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>

      {/* Submit Bug Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#0e0e14] border border-white/10 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in-95">
            <div className="p-6 border-b border-white/5 flex items-center justify-between">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Bug size={20} className="text-red-400" /> Report New Defect
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-500 hover:text-white transition"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateBug} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Associated Work Item</label>
                <select
                  value={formTaskId}
                  onChange={(e) => setFormTaskId(Number(e.target.value))}
                  className="w-full bg-[#12121a] border border-white/10 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-purple-500"
                  required
                >
                  <option value="" disabled>Select related task</option>
                  {tasks.map((t) => (
                    <option key={t.id} value={t.id}>
                      Task #{t.id}: {t.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Bug Title</label>
                <input
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g. Crash on Android 14 during OAuth redirect"
                  className="w-full bg-[#12121a] border border-white/10 rounded-lg px-4 py-2 text-xs text-white placeholder:text-slate-600 outline-none focus:border-purple-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">Severity</label>
                  <select
                    value={formSeverity}
                    onChange={(e) => setFormSeverity(e.target.value as BugSeverity)}
                    className="w-full bg-[#12121a] border border-white/10 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-purple-500"
                  >
                    <option value="CRITICAL">CRITICAL (Crash / Data loss)</option>
                    <option value="HIGH">HIGH (Major feature broken)</option>
                    <option value="MEDIUM">MEDIUM (Minor issue / Glitch)</option>
                    <option value="LOW">LOW (Cosmetic / Trivial)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">Device Diagnostics</label>
                  <input
                    value={formDeviceInfo}
                    onChange={(e) => setFormDeviceInfo(e.target.value)}
                    placeholder="e.g. Pixel 8 - Android 14"
                    className="w-full bg-[#12121a] border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder:text-slate-600 outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Screenshot URL / Attachment</label>
                <input
                  value={formScreenshotUrl}
                  onChange={(e) => setFormScreenshotUrl(e.target.value)}
                  placeholder="https://... image link or artifact URL"
                  className="w-full bg-[#12121a] border border-white/10 rounded-lg px-4 py-2 text-xs text-white placeholder:text-slate-600 outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Steps to Reproduce & Expected Behavior</label>
                <textarea
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  rows={3}
                  placeholder="1. Open login screen&#10;2. Click Google sign-in&#10;3. App terminates unexpectedly"
                  className="w-full bg-[#12121a] border border-white/10 rounded-lg px-4 py-2 text-xs text-white placeholder:text-slate-600 outline-none focus:border-purple-500 resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-lg text-xs text-slate-400 hover:text-white transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white px-5 py-2 rounded-lg text-xs font-medium transition"
                >
                  {submitting ? 'Logging...' : 'File Defect'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Screenshot Preview Modal */}
      {previewImage && (
        <div
          onClick={() => setPreviewImage(null)}
          className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-50 p-6"
        >
          <div className="relative max-w-3xl max-h-[85vh] overflow-hidden rounded-2xl border border-white/10">
            <img src={previewImage} alt="Bug proof" className="object-contain w-full h-full" />
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute top-4 right-4 bg-black/60 text-white p-2 rounded-full hover:bg-black transition"
            >
              <X size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
