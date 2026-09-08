import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Plus,
  Filter,
  MessageSquare,
  MoreHorizontal,
  Calendar,
  X,
  Send,
  Trash2,
  ChevronRight,
  Bug,
  CheckCircle2,
  Clock,
  UserCheck,
} from 'lucide-react';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';
import { useAuth } from '../context/AuthContext';
import { tasksApi, type Task, type Board } from '../lib/tasks';
import { projectsApi, type Project } from '../lib/projects';
import { commentsApi, type Comment } from '../lib/comments';

const COLUMNS: { key: Task['status']; label: string }[] = [
  { key: 'TODO', label: 'To Do' },
  { key: 'IN_PROGRESS', label: 'In Progress' },
  { key: 'IN_REVIEW', label: 'In Review' },
  { key: 'DONE', label: 'Done' },
];

const PRIORITY_TAG: Record<Task['priority'], { label: string; classes: string }> = {
  LOW: { label: 'LOW', classes: 'bg-slate-500/10 text-slate-400 border-slate-500/20' },
  MEDIUM: { label: 'MEDIUM', classes: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  HIGH: { label: 'HIGH', classes: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
  CRITICAL: { label: 'CRITICAL', classes: 'bg-red-500/10 text-red-400 border-red-500/20' },
};

const CAN_CREATE_TASK_ROLES = ['PROJECT_MANAGER', 'ADMINISTRATOR'];

function initials(name?: string) {
  if (!name) return '?';
  return name.slice(0, 2).toUpperCase();
}

function isOverdue(dueDate: string | null) {
  if (!dueDate) return false;
  return new Date(dueDate) < new Date(new Date().toDateString());
}

function formatDate(dueDate: string) {
  return new Date(dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function formatCommentTime(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export default function KanbanPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialProjectId = searchParams.get('projectId') ? Number(searchParams.get('projectId')) : null;

  const { user } = useAuth();
  const canCreateTask = CAN_CREATE_TASK_ROLES.includes(user?.role ?? '');

  const [projects, setProjects] = useState<Project[]>([]);
  const [projectId, setProjectId] = useState<number | null>(initialProjectId);
  const [board, setBoard] = useState<Board | null>(null);
  const [filter, setFilter] = useState('');

  // Task detail & comments modal state
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);

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

  const loadComments = async (taskId: number) => {
    setLoadingComments(true);
    try {
      const data = await commentsApi.getByTask(taskId);
      setComments(data);
    } catch {
      setComments([]);
    } finally {
      setLoadingComments(false);
    }
  };

  const handleOpenTask = (task: Task) => {
    setSelectedTask(task);
    loadComments(task.id);
  };

  const handleStatusChange = async (newStatus: Task['status']) => {
    if (!selectedTask || !projectId) return;
    await tasksApi.updateStatus(selectedTask.id, newStatus);
    setSelectedTask({ ...selectedTask, status: newStatus });
    loadBoard(projectId);
  };

  const handleAdvanceStatus = async (task: Task, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const order: Task['status'][] = ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE'];
    const idx = order.indexOf(task.status);
    if (idx === order.length - 1) return;
    const next = order[idx + 1];
    await tasksApi.updateStatus(task.id, next);
    if (selectedTask?.id === task.id) {
      setSelectedTask({ ...selectedTask, status: next });
    }
    if (projectId) loadBoard(projectId);
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask || !newComment.trim()) return;
    setSubmittingComment(true);
    try {
      const created = await commentsApi.create(selectedTask.id, newComment);
      setComments((prev) => [...prev, created]);
      setNewComment('');
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    await commentsApi.delete(commentId);
    setComments((prev) => prev.filter((c) => c.id !== commentId));
  };

  const filterMatch = (t: Task) => t.title.toLowerCase().includes(filter.toLowerCase());

  const totalTasks = board ? Object.values(board).flat().length : 0;
  const doneTasks = board ? board.DONE?.length ?? 0 : 0;
  const remainingPct = totalTasks > 0 ? Math.round(((totalTasks - doneTasks) / totalTasks) * 100) : 0;

  return (
    <div className="min-h-screen bg-[#050508] flex">
      <Sidebar />

      <div className="flex-1 flex flex-col">
        <Topbar projects={projects} selectedProjectId={projectId} onSelectProject={setProjectId} />

        <main className="flex-1 p-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              {canCreateTask && (
                <button
                  onClick={() => projectId && navigate(`/projects/${projectId}/tasks/new`)}
                  disabled={!projectId}
                  className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-40 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition"
                >
                  <Plus size={16} /> Create Task
                </button>
              )}

              <div className="relative">
                <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  placeholder="Filter tasks..."
                  className="bg-[#0e0e14] border border-white/5 rounded-lg pl-8 pr-4 py-2.5 text-sm text-white placeholder:text-slate-500 outline-none w-64 focus:border-purple-500/40"
                />
              </div>
            </div>

            {totalTasks > 0 && (
              <div className="flex items-center gap-3">
                <span className="text-sm text-slate-400">Sprint Progress</span>
                <div className="w-40 h-2 bg-white/5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-purple-600 to-green-500 rounded-full transition-all duration-500"
                    style={{ width: `${100 - remainingPct}%` }}
                  />
                </div>
                <span className="text-sm font-medium text-green-400">{100 - remainingPct}% Completed</span>
              </div>
            )}
          </div>

          {!board ? (
            <p className="text-slate-500">Loading board...</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
              {COLUMNS.map((col) => {
                const tasks = (board[col.key] ?? []).filter(filterMatch);
                return (
                  <div key={col.key} className="flex flex-col">
                    <div className="flex items-center justify-between mb-3 px-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-white font-semibold text-sm">{col.label}</h3>
                        <span className="text-xs bg-white/10 text-slate-300 rounded-full w-5 h-5 flex items-center justify-center font-medium">
                          {tasks.length}
                        </span>
                      </div>
                      <button className="text-slate-500 hover:text-white">
                        <MoreHorizontal size={16} />
                      </button>
                    </div>

                    <div className="space-y-3 flex-1 bg-white/[0.01] p-1 rounded-2xl">
                      {tasks.map((task) => {
                        const tag = PRIORITY_TAG[task.priority];
                        const overdue = task.status !== 'DONE' && isOverdue(task.dueDate);
                        return (
                          <div
                            key={task.id}
                            onClick={() => handleOpenTask(task)}
                            className={`bg-[#0e0e14] border rounded-xl p-4 cursor-pointer transition-all duration-200 hover:border-purple-500/40 hover:-translate-y-0.5 hover:shadow-lg ${
                              task.status === 'DONE' ? 'border-white/5 opacity-60' : 'border-white/5'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-2.5">
                              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${tag.classes}`}>
                                {tag.label}
                              </span>
                              {task.dueDate && (
                                <span className={`flex items-center gap-1 text-[11px] ${overdue ? 'text-red-400 font-medium' : 'text-slate-500'}`}>
                                  <Calendar size={11} /> {overdue ? 'Overdue' : formatDate(task.dueDate)}
                                </span>
                              )}
                            </div>

                            <p className={`text-sm font-medium text-white mb-3 ${task.status === 'DONE' ? 'line-through text-slate-500' : ''}`}>
                              {task.title}
                            </p>

                            <div className="flex items-center justify-between pt-3 border-t border-white/5 text-slate-500 text-xs">
                              <div className="flex items-center gap-3">
                                <span className="flex items-center gap-1 hover:text-purple-400 transition">
                                  <MessageSquare size={13} />
                                </span>
                                {task.status !== 'DONE' && (
                                  <button
                                    onClick={(e) => handleAdvanceStatus(task, e)}
                                    title="Advance to next column"
                                    className="p-1 hover:bg-white/10 hover:text-purple-400 rounded transition"
                                  >
                                    <ChevronRight size={14} />
                                  </button>
                                )}
                              </div>

                              <div className="flex items-center gap-2">
                                {task.assignee ? (
                                  <>
                                    <span className="text-xs text-slate-400">{task.assignee.username}</span>
                                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-[10px] text-white font-semibold shadow">
                                      {initials(task.assignee.username)}
                                    </div>
                                  </>
                                ) : (
                                  <div className="w-6 h-6 rounded-full border border-dashed border-white/20 flex items-center justify-center text-slate-600 text-xs">
                                    ?
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}

                      {tasks.length === 0 && (
                        <div className="border border-dashed border-white/5 rounded-xl p-6 text-center text-slate-600 text-xs italic">
                          No tasks
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>

      {/* Task Details & Comments Modal */}
      {selectedTask && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#0e0e14] border border-white/10 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95">
            {/* Modal Header */}
            <div className="p-6 border-b border-white/5 flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2.5 mb-2">
                  <span className={`text-xs font-semibold px-2.5 py-0.5 rounded border ${PRIORITY_TAG[selectedTask.priority].classes}`}>
                    {selectedTask.priority}
                  </span>
                  <span className="text-xs text-slate-500 font-mono">TASK #{selectedTask.id}</span>
                </div>
                <h2 className="text-xl font-bold text-white leading-snug">{selectedTask.title}</h2>
              </div>
              <button
                onClick={() => setSelectedTask(null)}
                className="text-slate-500 hover:text-white p-1 rounded-lg transition"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              {/* Status and Action controls */}
              <div className="flex flex-wrap items-center justify-between gap-4 bg-[#12121a] p-4 rounded-xl border border-white/5">
                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-400 font-medium">Stage:</span>
                  <select
                    value={selectedTask.status}
                    onChange={(e) => handleStatusChange(e.target.value as Task['status'])}
                    className="bg-[#0e0e14] border border-white/10 text-white text-xs rounded-lg px-3 py-1.5 outline-none cursor-pointer focus:border-purple-500"
                  >
                    {COLUMNS.map((col) => (
                      <option key={col.key} value={col.key}>
                        {col.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const tid = selectedTask.id;
                      setSelectedTask(null);
                      navigate(`/qa?taskId=${tid}&projectId=${projectId}`);
                    }}
                    className="flex items-center gap-1.5 text-xs bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 px-3 py-1.5 rounded-lg transition"
                  >
                    <Bug size={14} /> Report Bug
                  </button>

                  {selectedTask.status !== 'DONE' && (
                    <button
                      onClick={() => handleAdvanceStatus(selectedTask)}
                      className="flex items-center gap-1.5 text-xs bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 rounded-lg transition"
                    >
                      Advance <ChevronRight size={14} />
                    </button>
                  )}
                </div>
              </div>

              {/* Task Meta Information */}
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="bg-[#12121a] p-3.5 rounded-xl border border-white/5 space-y-1">
                  <span className="text-slate-500 font-medium">Assignee</span>
                  <p className="text-white font-medium flex items-center gap-2">
                    <UserCheck size={14} className="text-purple-400" />
                    {selectedTask.assignee?.username ?? 'Unassigned'}
                  </p>
                </div>

                <div className="bg-[#12121a] p-3.5 rounded-xl border border-white/5 space-y-1">
                  <span className="text-slate-500 font-medium">Due Date</span>
                  <p className="text-white font-medium flex items-center gap-2">
                    <Calendar size={14} className="text-blue-400" />
                    {selectedTask.dueDate ? formatDate(selectedTask.dueDate) : 'No deadline'}
                  </p>
                </div>
              </div>

              {/* Description */}
              <div>
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Description</h4>
                <div className="bg-[#12121a] border border-white/5 rounded-xl p-4 text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">
                  {selectedTask.description || 'No detailed description provided for this work item.'}
                </div>
              </div>

              {/* Comments Section */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <MessageSquare size={14} className="text-purple-400" /> Discussion ({comments.length})
                  </h4>
                </div>

                <div className="space-y-3 mb-4">
                  {loadingComments ? (
                    <p className="text-slate-500 text-xs">Loading comments...</p>
                  ) : comments.length === 0 ? (
                    <p className="text-slate-500 text-xs italic bg-[#12121a] p-4 rounded-xl border border-white/5 text-center">
                      No comments yet. Start the conversation below!
                    </p>
                  ) : (
                    comments.map((c) => (
                      <div key={c.id} className="bg-[#12121a] border border-white/5 rounded-xl p-3.5 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-[10px] text-white font-bold">
                              {initials(c.author?.username)}
                            </div>
                            <span className="text-xs font-semibold text-white">{c.author?.username}</span>
                            <span className="text-[10px] text-slate-500">{formatCommentTime(c.createdAt)}</span>
                          </div>

                          {user?.id === c.author?.id && (
                            <button
                              onClick={() => handleDeleteComment(c.id)}
                              className="text-slate-600 hover:text-red-400 transition p-1"
                              title="Delete comment"
                            >
                              <Trash2 size={12} />
                            </button>
                          )}
                        </div>
                        <p className="text-xs text-slate-300 pl-8 leading-relaxed">{c.content}</p>
                      </div>
                    ))
                  )}
                </div>

                {/* New Comment Input */}
                <form onSubmit={handleAddComment} className="flex gap-2">
                  <input
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Write a comment or status update..."
                    className="flex-1 bg-[#12121a] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder:text-slate-600 outline-none focus:border-purple-500"
                  />
                  <button
                    type="submit"
                    disabled={submittingComment || !newComment.trim()}
                    className="bg-purple-600 hover:bg-purple-700 disabled:opacity-40 text-white px-4 py-2.5 rounded-xl text-xs font-medium transition flex items-center gap-1.5 shrink-0"
                  >
                    <Send size={13} /> {submittingComment ? 'Sending...' : 'Post'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}