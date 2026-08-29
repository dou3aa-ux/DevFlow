import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ChevronRight, GitBranch, Calendar, Flag, Plus } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import { tasksApi } from '../lib/tasks';
import type { Task } from '../lib/tasks';
import { projectsApi } from '../lib/projects';
import type { ProjectDetail } from '../lib/projects';
import { sprintsApi } from '../lib/sprints';
import type { Sprint } from '../lib/sprints';

const PRIORITIES: Task['priority'][] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

const PRIORITY_STYLE: Record<Task['priority'], string> = {
  LOW: 'border-slate-500 text-slate-400',
  MEDIUM: 'border-blue-500 text-blue-400',
  HIGH: 'border-orange-500 text-orange-400',
  CRITICAL: 'border-red-500 text-red-400',
};

export default function CreateTaskPage() {
  const { id } = useParams();
  const projectId = Number(id);
  const navigate = useNavigate();

  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [sprints, setSprints] = useState<Sprint[]>([]);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Task['priority']>('MEDIUM');
  const [assigneeId, setAssigneeId] = useState<number | ''>('');
  const [dueDate, setDueDate] = useState('');
  const [sprintId, setSprintId] = useState<number | ''>('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    projectsApi.getOne(projectId).then(setProject);
    sprintsApi.getAll(projectId).then(setSprints).catch(() => setSprints([]));
  }, [projectId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await tasksApi.create(projectId, {
        title,
        description: description || undefined,
        priority,
        dueDate: dueDate || undefined,
        sprintId: sprintId === '' ? undefined : sprintId,
        assigneeId: assigneeId === '' ? undefined : assigneeId,
      });
      navigate(`/kanban?projectId=${projectId}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050508] flex">
      <Sidebar />
      <div className="flex-1 p-10">
        <div className="flex items-center gap-2 text-sm text-slate-500 mb-6">
          <Link to="/projects" className="hover:text-white">Projects</Link>
          <ChevronRight size={14} />
          <span className="text-slate-400">{project?.name ?? '...'}</span>
          <ChevronRight size={14} />
          <span className="text-slate-400">Tasks</span>
          <ChevronRight size={14} />
          <span className="text-purple-400 font-medium">Create New</span>
        </div>

        <form onSubmit={handleSubmit} className="bg-[#0e0e14] border border-white/5 rounded-2xl p-10">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            <div className="lg:col-span-2 space-y-6">
              <div>
                <label className="block text-white font-medium text-sm mb-2">Task Title</label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Implement OAuth2 Authentication Flow"
                  className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-slate-600 outline-none focus:border-purple-500/50"
                  required
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-white font-medium text-sm">Task Description</label>
                  <span className="text-xs text-slate-500">Markdown supported</span>
                </div>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the task details..."
                  rows={10}
                  className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-slate-600 outline-none focus:border-purple-500/50 resize-none font-mono text-sm"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-white font-medium text-sm mb-2">
                  <GitBranch size={14} /> Link Git Branch
                </label>
                <div className="bg-white/[0.02] border border-white/5 rounded-xl px-4 py-3 text-slate-600 text-sm italic">
                  Not available yet — tasks aren't linked to branches in the current data model.
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-white/[0.02] border border-white/5 rounded-xl p-5">
                <h3 className="text-white font-semibold text-sm mb-4">Assignee</h3>
                <select
                  value={assigneeId}
                  onChange={(e) => setAssigneeId(e.target.value ? Number(e.target.value) : '')}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white outline-none"
                >
                  <option value="">Unassigned</option>
                  {project?.members.map((m) => (
                    <option key={m.id} value={m.id}>{m.username}</option>
                  ))}
                </select>
                <p className="text-xs text-slate-600 mt-2">
                  Only project members can be assigned. Add members from the project page first.
                </p>
              </div>

              <div>
                <h3 className="text-white font-medium text-sm mb-3">Priority</h3>
                <div className="flex gap-2">
                  {PRIORITIES.map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPriority(p)}
                      className={`flex-1 text-xs font-medium py-2 rounded-full border transition ${
                        priority === p ? PRIORITY_STYLE[p] : 'border-white/10 text-slate-500 hover:border-white/20'
                      }`}
                    >
                      {p.charAt(0) + p.slice(1).toLowerCase()}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-white font-medium text-sm mb-3">Schedule</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 bg-white/[0.03] border border-white/10 rounded-lg px-3 py-2.5">
                    <Calendar size={14} className="text-slate-500" />
                    <input
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="flex-1 bg-transparent text-sm text-white outline-none"
                    />
                  </div>
                  <div className="flex items-center gap-2 bg-white/[0.03] border border-white/10 rounded-lg px-3 py-2.5">
                    <Flag size={14} className="text-slate-500" />
                    <select
                      value={sprintId}
                      onChange={(e) => setSprintId(e.target.value ? Number(e.target.value) : '')}
                      className="flex-1 bg-transparent text-sm text-white outline-none"
                    >
                      <option value="" className="bg-[#0e0e14]">No sprint</option>
                      {sprints.map((s) => (
                        <option key={s.id} value={s.id} className="bg-[#0e0e14]">{s.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between mt-10 pt-6 border-t border-white/5">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="text-slate-400 hover:text-white text-sm font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !title.trim()}
              className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-40 text-white px-6 py-3 rounded-xl text-sm font-semibold transition"
            >
              <Plus size={16} /> {submitting ? 'Creating...' : 'Create & Publish Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}