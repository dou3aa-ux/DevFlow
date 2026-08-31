import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FolderKanban, Filter, X, Rocket, Search, Bell, Save } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../context/AuthContext';
import { usersApi, ROLE_LABELS, type AdminUser, type UserRole } from '../lib/users';
import { projectsApi } from '../lib/projects';
import type { Project, ProjectDetail } from '../lib/projects';

const ROLE_SECTIONS: { key: string; roles: UserRole[]; label: string }[] = [
  { key: 'developers', roles: ['DEVELOPER'], label: 'DEVELOPERS' },
  { key: 'managers', roles: ['PROJECT_MANAGER'], label: 'PROJECT MANAGERS' },
  { key: 'testers', roles: ['QA_TESTER'], label: 'TESTERS' },
  { key: 'stakeholders', roles: ['STAKEHOLDER'], label: 'STAKEHOLDERS' },
  { key: 'admins', roles: ['ADMINISTRATOR'], label: 'ADMINISTRATORS' },
];

const ROLE_BADGE_COLORS: Record<UserRole, string> = {
  DEVELOPER: 'bg-blue-500/15 text-blue-400 border-blue-500/25',
  PROJECT_MANAGER: 'bg-purple-500/15 text-purple-400 border-purple-500/25',
  QA_TESTER: 'bg-orange-500/15 text-orange-400 border-orange-500/25',
  STAKEHOLDER: 'bg-slate-500/15 text-slate-400 border-slate-500/25',
  ADMINISTRATOR: 'bg-rose-500/15 text-rose-400 border-rose-500/25',
};

function Avatar({ name, email }: { name: string; email: string }) {
  const initials = name.split(/[\s.]+/).filter(Boolean).map((n) => n[0]).join('').slice(0, 2).toUpperCase();
  const colors = [
    'from-purple-500 to-pink-500',
    'from-blue-500 to-cyan-500',
    'from-emerald-500 to-teal-500',
    'from-orange-500 to-amber-500',
    'from-rose-500 to-red-500',
  ];
  const idx = (email?.length ?? 0) % colors.length;
  return (
    <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${colors[idx]} flex items-center justify-center text-white text-xs font-semibold shrink-0`}>
      {initials || '?'}
    </div>
  );
}

type Mode = 'create' | 'edit';

export default function CreateProjectGroup() {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();

  const [mode, setMode] = useState<Mode>('create');
  const [existingProjects, setExistingProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<number | ''>('');
  const [originalMemberIds, setOriginalMemberIds] = useState<Set<number>>(new Set());

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [roleFilter, setRoleFilter] = useState<UserRole | 'ALL'>('ALL');
  const [search, setSearch] = useState('');

  useEffect(() => {
    usersApi.getAll().then(setUsers).catch(() => setError('Failed to load members')).finally(() => setLoading(false));
    projectsApi.getAllAdmin().then(setExistingProjects).catch(() => {});
  }, []);

  const loadProjectForEdit = async (projectId: number) => {
    setError('');
    setSuccess('');
    const detail: ProjectDetail = await projectsApi.getOne(projectId);
    setName(detail.name);
    setDescription(detail.description ?? '');
    const memberIds = new Set(detail.members.map((m) => m.id));
    setSelectedIds(memberIds);
    setOriginalMemberIds(memberIds);
  };

  const handleModeSwitch = (newMode: Mode) => {
    setMode(newMode);
    setError('');
    setSuccess('');
    setName('');
    setDescription('');
    setSelectedIds(new Set());
    setOriginalMemberIds(new Set());
    setSelectedProjectId('');
  };

  const handleSelectExisting = (id: number) => {
    setSelectedProjectId(id);
    loadProjectForEdit(id);
  };

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      if (!u.isActive) return false;
      if (roleFilter !== 'ALL' && u.role !== roleFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        return u.username.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
      }
      return true;
    });
  }, [users, roleFilter, search]);

  const selectedUsers = useMemo(() => users.filter((u) => selectedIds.has(u.id)), [users, selectedIds]);

  const toggleMember = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const clearSection = (roles: UserRole[]) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      users.forEach((u) => {
        if (roles.includes(u.role)) next.delete(u.id);
      });
      return next;
    });
  };

  const handleCreate = async () => {
    if (!name.trim()) {
      setError('Project group name is required');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      await projectsApi.create({
        name: name.trim(),
        description: description.trim() || undefined,
        memberIds: [...selectedIds],
      });
      navigate('/admin/users');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to create project group');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveEdits = async () => {
    if (!selectedProjectId) return;
    setError('');
    setSubmitting(true);
    try {
      const toAdd = [...selectedIds].filter((id) => !originalMemberIds.has(id));
      const toRemove = [...originalMemberIds].filter((id) => !selectedIds.has(id));

      await Promise.all([
        ...toAdd.map((userId) => projectsApi.addMember(selectedProjectId, userId)),
        ...toRemove.map((userId) => projectsApi.removeMember(selectedProjectId, userId)),
      ]);

      setOriginalMemberIds(new Set(selectedIds));
      setSuccess(`Team updated - ${toAdd.length} added, ${toRemove.length} removed.`);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to update team');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050508] flex">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b border-white/5 flex items-center justify-between px-8 gap-6 shrink-0">
          <div className="flex-1 max-w-xl">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                placeholder="Search members, roles, or projects..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-[#12121a] border border-white/5 rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder:text-slate-500 outline-none focus:border-purple-600/50"
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="relative w-9 h-9 rounded-lg bg-[#12121a] border border-white/5 flex items-center justify-center text-slate-400 hover:text-white transition">
              <Bell size={16} />
            </button>
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-sm font-semibold">
              {currentUser?.username?.charAt(0).toUpperCase() ?? 'A'}
            </div>
          </div>
        </header>

        <div className="px-8 pt-6 pb-4 border-b border-white/5">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <h1 className="text-2xl font-bold text-white">
                {mode === 'create' ? 'Create New Project Group' : 'Edit Existing Team'}
              </h1>
              <p className="text-slate-400 text-sm mt-1">
                {mode === 'create'
                  ? 'Define a new team structure and select members'
                  : 'Add or remove members from an existing project'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-4 py-2 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-white/5 transition"
            >
              Cancel
            </button>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => handleModeSwitch('create')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                mode === 'create' ? 'bg-purple-600 text-white' : 'bg-white/5 text-slate-400 hover:text-white'
              }`}
            >
              Create New Project
            </button>
            <button
              onClick={() => handleModeSwitch('edit')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                mode === 'edit' ? 'bg-purple-600 text-white' : 'bg-white/5 text-slate-400 hover:text-white'
              }`}
            >
              Edit Existing Project
            </button>
          </div>
        </div>

        <main className="flex-1 p-8 overflow-auto">
          {error && (
            <div className="mb-4 flex items-center justify-between bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-lg px-4 py-3">
              <span>{error}</span>
              <button onClick={() => setError('')} className="hover:text-white"><X size={16} /></button>
            </div>
          )}
          {success && (
            <div className="mb-4 flex items-center justify-between bg-green-500/10 border border-green-500/20 text-green-400 text-sm rounded-lg px-4 py-3">
              <span>{success}</span>
              <button onClick={() => setSuccess('')} className="hover:text-white"><X size={16} /></button>
            </div>
          )}

          {mode === 'edit' && (
            <div className="mb-6 bg-[#0e0e14] border border-white/5 rounded-2xl p-6 max-w-xl">
              <label className="block text-sm text-slate-400 mb-1.5">Select Project to Edit</label>
              <select
                value={selectedProjectId}
                onChange={(e) => handleSelectExisting(Number(e.target.value))}
                className="w-full bg-[#12121a] border border-white/5 rounded-lg px-3 py-2.5 text-sm text-white outline-none"
              >
                <option value="">Choose a project...</option>
                {existingProjects.map((p) => (
                  <option key={p.id} value={p.id}>{p.name} (id {p.id})</option>
                ))}
              </select>
            </div>
          )}

          {(mode === 'create' || selectedProjectId) && (
            <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
              <div className="xl:col-span-3 space-y-6">
                {mode === 'create' && (
                  <div className="bg-[#0e0e14] border border-white/5 rounded-2xl p-6">
                    <div className="flex items-center gap-2 mb-5">
                      <div className="w-8 h-8 rounded-lg bg-purple-600/20 flex items-center justify-center">
                        <FolderKanban size={16} className="text-purple-400" />
                      </div>
                      <h2 className="text-base font-semibold text-white">Project Details</h2>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm text-slate-400 mb-1.5">
                          Project Group Name <span className="text-purple-400">*</span>
                        </label>
                        <input
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="e.g. Q3 Mobile App Redesign"
                          className="w-full bg-[#12121a] border border-white/5 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-slate-600 outline-none focus:border-purple-600/50"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-slate-400 mb-1.5">Description (Optional)</label>
                        <input
                          type="text"
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          placeholder="Brief context about this team's objective..."
                          className="w-full bg-[#12121a] border border-white/5 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-slate-600 outline-none focus:border-purple-600/50"
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div className="bg-[#0e0e14] border border-white/5 rounded-2xl p-6">
                  <div className="flex items-center justify-between mb-5 gap-3 flex-wrap">
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-semibold text-white">Available Members</h2>
                      <span className="text-xs text-slate-500 bg-white/5 border border-white/5 px-2 py-0.5 rounded-full">
                        {filteredUsers.length} Total
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Filter size={14} className="text-slate-500" />
                      <select
                        value={roleFilter}
                        onChange={(e) => setRoleFilter(e.target.value as UserRole | 'ALL')}
                        className="bg-[#12121a] border border-white/5 rounded-lg px-3 py-1.5 text-xs text-slate-300 outline-none cursor-pointer"
                      >
                        <option value="ALL">All Roles</option>
                        {(Object.keys(ROLE_LABELS) as UserRole[]).map((r) => (
                          <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {loading ? (
                    <p className="text-slate-500 text-sm py-10 text-center">Loading members...</p>
                  ) : filteredUsers.length === 0 ? (
                    <p className="text-slate-500 text-sm py-10 text-center">No members match your filters.</p>
                  ) : (
                    <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
                      {filteredUsers.map((u) => {
                        const checked = selectedIds.has(u.id);
                        return (
                          <label
                            key={u.id}
                            className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition ${
                              checked ? 'bg-purple-600/10 border-purple-600/30' : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.04]'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleMember(u.id)}
                              className="w-4 h-4 rounded border-white/20 bg-[#12121a] text-purple-600 focus:ring-purple-600/40"
                            />
                            <Avatar name={u.username} email={u.email} />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-white truncate">{u.username}</p>
                              <p className="text-xs text-slate-500 truncate">{u.email}</p>
                            </div>
                            <span className={`text-[11px] font-medium px-2 py-0.5 rounded-md border shrink-0 ${ROLE_BADGE_COLORS[u.role] ?? 'bg-slate-500/15 text-slate-400 border-slate-500/25'}`}>
                              {ROLE_LABELS[u.role] ?? u.role}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              <div className="xl:col-span-2">
                <div className="bg-[#0e0e14] border border-white/5 rounded-2xl p-6 sticky top-6">
                  <div className="flex items-center justify-between mb-5">
                    <h2 className="text-base font-semibold text-white">Team Composition</h2>
                    <span className="text-xs font-medium text-purple-300 bg-purple-600/20 border border-purple-600/30 px-2.5 py-1 rounded-full">
                      {selectedIds.size} Selected
                    </span>
                  </div>

                  <div className="space-y-5 mb-6 max-h-[480px] overflow-y-auto">
                    {ROLE_SECTIONS.map((section) => {
                      const sectionUsers = selectedUsers.filter((u) => section.roles.includes(u.role));
                      return (
                        <div key={section.key}>
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-[11px] font-semibold tracking-wider text-slate-500">
                              {section.label} ({sectionUsers.length})
                            </p>
                            {sectionUsers.length > 0 && (
                              <button type="button" onClick={() => clearSection(section.roles)} className="text-[11px] text-slate-500 hover:text-purple-400 transition">
                                Clear
                              </button>
                            )}
                          </div>
                          {sectionUsers.length === 0 ? (
                            <div className="border border-dashed border-white/10 rounded-xl py-4 text-center text-xs text-slate-600">
                              No {section.label.toLowerCase()} selected
                            </div>
                          ) : (
                            <div className="space-y-2">
                              {sectionUsers.map((u) => (
                                <div key={u.id} className="flex items-center gap-2 bg-[#12121a] border border-white/5 rounded-xl px-3 py-2">
                                  <Avatar name={u.username} email={u.email} />
                                  <span className="flex-1 text-sm text-white truncate">{u.username}</span>
                                  <button type="button" onClick={() => toggleMember(u.id)} className="text-slate-500 hover:text-white p-0.5">
                                    <X size={14} />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {mode === 'create' ? (
                    <button
                      type="button"
                      onClick={handleCreate}
                      disabled={submitting || !name.trim()}
                      className="w-full flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 rounded-xl text-sm font-semibold transition shadow-lg shadow-emerald-500/20"
                    >
                      <Rocket size={16} />
                      {submitting ? 'Creating...' : 'Create Project Group'}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleSaveEdits}
                      disabled={submitting}
                      className="w-full flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 rounded-xl text-sm font-semibold transition"
                    >
                      <Save size={16} />
                      {submitting ? 'Saving...' : 'Save Team Changes'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}