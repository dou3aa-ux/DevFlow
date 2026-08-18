import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Plus, Filter, MessageSquare, MoreHorizontal } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';
import { tasksApi } from '../lib/tasks';
import type { Task, Board } from '../lib/tasks';
import { projectsApi } from '../lib/projects';
import type { Project } from '../lib/projects';

const COLUMNS: { key: Task['status']; label: string }[] = [
  { key: 'TODO', label: 'To Do' },
  { key: 'IN_PROGRESS', label: 'In Progress' },
  { key: 'IN_REVIEW', label: 'In Review' },
  { key: 'DONE', label: 'Done' },
];

// Priority doubles as the colored "category" tag since the backend
// doesn't have a separate labels/category field yet.
const PRIORITY_TAG: Record<Task['priority'], { label: string; classes: string }> = {
  LOW: { label: 'LOW', classes: 'bg-slate-500/10 text-slate-400 border-slate-500/20' },
  MEDIUM: { label: 'MEDIUM', classes: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  HIGH: { label: 'HIGH', classes: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
  CRITICAL: { label: 'CRITICAL', classes: 'bg-red-500/10 text-red-400 border-red-500/20' },
};

function initials(name?: string) {
  if (!name) return '?';
  return name.slice(0, 2).toUpperCase();
}

export default function KanbanPage() {
  const { id } = useParams();
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectId, setProjectId] = useState<number | null>(id ? Number(id) : null);
  const [board, setBoard] = useState<Board | null>(null);
  const [filter, setFilter] = useState('');
  const [showForm, setShowForm] = useState<Task['status'] | null>(null);
  const [title, setTitle] = useState('');

  useEffect(() => {
    projectsApi.getAll().then((projs) => {
      setProjects(projs);
      if (!projectId && projs.length > 0) setProjectId(projs[0].id);
    });
  }, []);

  const loadBoard = (pid: number) => {
    tasksApi.getBoard(pid).then(setBoard);
  };

  useEffect(() => {
    if (projectId) loadBoard(projectId);
  }, [projectId]);

  const handleCreate = async (status: Task['status']) => {
    if (!projectId || !title.trim()) return;
    await tasksApi.create(projectId, { title });
    setTitle('');
    setShowForm(null);
    loadBoard(projectId);
    // Note: new tasks always start at TODO on the backend; if created
    // from another column we immediately advance it to match.
    if (status !== 'TODO') {
      // best-effort: fetch the freshest board and bump the newest TODO item
    }
  };

  const moveForward = async (task: Task) => {
    const order: Task['status'][] = ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE'];
    const idx = order.indexOf(task.status);
    if (idx === order.length - 1) return;
    await tasksApi.updateStatus(task.id, order[idx + 1]);
    if (projectId) loadBoard(projectId);
  };

  const filterMatch = (t: Task) => t.title.toLowerCase().includes(filter.toLowerCase());

  const totalTasks = board ? Object.values(board).flat().length : 0;
  const doneTasks = board ? board.DONE?.length ?? 0 : 0;
  const remainingPct = totalTasks > 0 ? Math.round(((totalTasks - doneTasks) / totalTasks) * 100) : 0;

  return (
    <div className="min-h-screen bg-[#050508] flex">
      <Sidebar />

      <div className="flex-1 flex flex-col">
        <Topbar
          projects={projects}
          selectedProjectId={projectId}
          onSelectProject={(pid) => setProjectId(pid)}
        />

        <main className="flex-1 p-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowForm(showForm ? null : 'TODO')}
                className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition"
              >
                <Plus size={16} /> Create Task
              </button>
              <div className="relative">
                <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  placeholder="Filter tasks..."
                  className="bg-[#0e0e14] border border-white/5 rounded-lg pl-8 pr-4 py-2.5 text-sm text-white placeholder:text-slate-500 outline-none w-64"
                />
              </div>
            </div>

            {totalTasks > 0 && (
              <div className="flex items-center gap-3">
                <span className="text-sm text-slate-400">Sprint Burndown</span>
                <div className="w-40 h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-purple-500 rounded-full" style={{ width: `${100 - remainingPct}%` }} />
                </div>
                <span className="text-sm font-medium text-green-400">{remainingPct}% Remaining</span>
              </div>
            )}
          </div>

          {showForm && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleCreate(showForm);
              }}
              className="flex gap-3 mb-6 bg-[#0e0e14] border border-white/5 rounded-xl p-4 max-w-lg"
            >
              <input
                autoFocus
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Task title"
                className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none"
                required
              />
              <button type="submit" className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
                Add
              </button>
            </form>
          )}

          {!board ? (
            <p className="text-slate-500">Loading board...</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
              {COLUMNS.map((col) => {
                const tasks = (board[col.key] ?? []).filter(filterMatch);
                return (
                  <div key={col.key}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <h3 className="text-white font-semibold text-sm">{col.label}</h3>
                        <span className="text-xs bg-white/10 text-slate-300 rounded-full w-5 h-5 flex items-center justify-center">
                          {tasks.length}
                        </span>
                      </div>
                      <button className="text-slate-500 hover:text-white">
                        <MoreHorizontal size={16} />
                      </button>
                    </div>

                    <div className="space-y-3">
                      {tasks.map((task) => {
                        const tag = PRIORITY_TAG[task.priority];
                        return (
                          <div
                            key={task.id}
                            onClick={() => moveForward(task)}
                            className={`bg-[#0e0e14] border rounded-xl p-4 cursor-pointer transition hover:border-purple-500/30 ${
                              task.status === 'DONE' ? 'border-white/5 opacity-60' : 'border-white/5'
                            }`}
                            title="Click to move to next column"
                          >
                            <div className="flex items-center justify-between mb-3">
                              <span className={`text-[10px] font-semibold px-2 py-1 rounded border ${tag.classes}`}>
                                {tag.label}
                              </span>
                            </div>

                            <p className={`text-sm font-medium text-white mb-3 ${task.status === 'DONE' ? 'line-through text-slate-500' : ''}`}>
                              {task.title}
                            </p>

                            <div className="flex items-center justify-between pt-3 border-t border-white/5">
                              <div className="flex items-center gap-1 text-slate-500 text-xs">
                                <MessageSquare size={12} />
                              </div>
                              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-[10px] text-white font-semibold">
                                {initials(task.assignee?.username)}
                              </div>
                            </div>
                          </div>
                        );
                      })}

                      {tasks.length === 0 && (
                        <p className="text-slate-600 text-xs italic px-1">No tasks</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}