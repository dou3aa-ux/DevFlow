import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FolderKanban,
  Plus,
  Search,
  Users,
  Rocket,
  ArrowRight,
  GitBranch,
  Calendar,
  CheckCircle2,
  Clock,
  Layers,
  X,
} from 'lucide-react';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';
import { useAuth } from '../context/AuthContext';
import { projectsApi, type Project } from '../lib/projects';

const STATUS_BADGE: Record<string, { label: string; classes: string }> = {
  ACTIVE: { label: 'Active', classes: 'bg-green-500/10 text-green-400 border-green-500/20' },
  PLANNING: { label: 'Planning', classes: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
  ON_HOLD: { label: 'On Hold', classes: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' },
  COMPLETED: { label: 'Completed', classes: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  ARCHIVED: { label: 'Archived', classes: 'bg-slate-500/10 text-slate-400 border-slate-500/20' },
};

export default function Projects() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadProjects = () => {
    setLoading(true);
    projectsApi
      .getAll()
      .then(setProjects)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadProjects();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);
    try {
      const created = await projectsApi.create({ name, description });
      setName('');
      setDescription('');
      setShowCreateModal(false);
      loadProjects();
      if (created?.id) {
        navigate(`/kanban?projectId=${created.id}`);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const filteredProjects = projects.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(search.toLowerCase()))
  );

  const activeCount = projects.filter((p) => p.status === 'ACTIVE').length;
  const planningCount = projects.filter((p) => p.status === 'PLANNING').length;

  return (
    <div className="min-h-screen bg-[#050508] flex">
      <Sidebar />

      <div className="flex-1 flex flex-col">
        <Topbar
          projects={projects}
          selectedProjectId={null}
          onSelectProject={(id) => navigate(`/kanban?projectId=${id}`)}
        />

        <main className="flex-1 p-8 space-y-6">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-white tracking-tight">Project Workspaces</h1>
              <p className="text-slate-400 text-sm mt-1">
                Manage, collaborate, and monitor all development initiatives across your engineering teams.
              </p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition shadow-lg shadow-purple-600/20 shrink-0"
            >
              <Plus size={16} /> New Project
            </button>
          </div>

          {/* Quick Stats Banner */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div className="bg-[#0e0e14] border border-white/5 rounded-2xl p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                <Layers size={22} />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium">Total Workspaces</p>
                <p className="text-2xl font-bold text-white">{projects.length}</p>
              </div>
            </div>

            <div className="bg-[#0e0e14] border border-white/5 rounded-2xl p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center text-green-400">
                <CheckCircle2 size={22} />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium">Active Development</p>
                <p className="text-2xl font-bold text-white">{activeCount}</p>
              </div>
            </div>

            <div className="bg-[#0e0e14] border border-white/5 rounded-2xl p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                <Clock size={22} />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium">In Planning</p>
                <p className="text-2xl font-bold text-white">{planningCount}</p>
              </div>
            </div>
          </div>

          {/* Search bar */}
          <div className="relative max-w-md">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search projects by name or keywords..."
              className="w-full bg-[#0e0e14] border border-white/5 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-slate-500 outline-none focus:border-purple-500/40"
            />
          </div>

          {/* Project Cards Grid */}
          {loading ? (
            <div className="bg-[#0e0e14] border border-white/5 rounded-2xl p-12 text-center text-slate-500">
              Loading workspaces...
            </div>
          ) : filteredProjects.length === 0 ? (
            <div className="bg-[#0e0e14] border border-white/5 rounded-2xl p-12 text-center">
              <FolderKanban size={40} className="mx-auto text-slate-600 mb-3" />
              <p className="text-white font-medium text-lg">No projects found</p>
              <p className="text-slate-500 text-sm mt-1 mb-6">
                Get started by creating your first workspace or adjust your search filter.
              </p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
              >
                + Create Project
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredProjects.map((p) => {
                const statusMeta = STATUS_BADGE[p.status] || STATUS_BADGE.ACTIVE;
                return (
                  <div
                    key={p.id}
                    className="bg-[#0e0e14] border border-white/5 hover:border-purple-500/30 rounded-2xl p-6 transition flex flex-col justify-between group shadow-lg"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-4">
                        <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border ${statusMeta.classes}`}>
                          {statusMeta.label}
                        </span>
                        <span className="text-xs text-slate-500 font-mono">ID #{p.id}</span>
                      </div>

                      <h3 className="text-xl font-bold text-white group-hover:text-purple-300 transition line-clamp-1">
                        {p.name}
                      </h3>
                      <p className="text-slate-400 text-sm mt-2 line-clamp-2 min-h-[40px]">
                        {p.description || 'Collaborative software project repository and workspace.'}
                      </p>
                    </div>

                    <div className="pt-6 mt-6 border-t border-white/5 space-y-4">
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <span className="flex items-center gap-1.5">
                          <Users size={14} className="text-slate-400" />
                          <span>Team Workspace</span>
                        </span>
                        <span className="flex items-center gap-1.5 text-purple-400">
                          <GitBranch size={14} />
                          <span>Git Integrated</span>
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <Link
                          to={`/kanban?projectId=${p.id}`}
                          className="flex items-center justify-center gap-1.5 bg-purple-600/15 hover:bg-purple-600 text-purple-300 hover:text-white border border-purple-600/30 py-2 px-3 rounded-lg text-xs font-medium transition"
                        >
                          <FolderKanban size={14} /> Kanban Board
                        </Link>
                        <Link
                          to={`/cicd?projectId=${p.id}`}
                          className="flex items-center justify-center gap-1.5 bg-white/5 hover:bg-white/10 text-white border border-white/10 py-2 px-3 rounded-lg text-xs font-medium transition"
                        >
                          <Rocket size={14} /> CI/CD Pipeline
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>

      {/* New Project Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#0e0e14] border border-white/10 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between p-6 border-b border-white/5">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <FolderKanban size={20} className="text-purple-400" /> Create Workspace
              </h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-500 hover:text-white transition"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Project Name</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Core Payment Engine"
                  className="w-full bg-[#12121a] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-slate-600 outline-none focus:border-purple-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  placeholder="Brief overview of technical deliverables and scope..."
                  className="w-full bg-[#12121a] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-slate-600 outline-none focus:border-purple-500 resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-lg text-sm text-slate-400 hover:text-white transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white px-5 py-2 rounded-lg text-sm font-medium transition"
                >
                  {submitting ? 'Creating...' : 'Create Workspace'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}