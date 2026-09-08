import { useEffect, useState } from 'react';
import {
  ShieldCheck,
  Users,
  Check,
  X,
  Search,
  CheckCircle2,
  Lock,
  UserCog,
  ChevronDown,
} from 'lucide-react';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../context/AuthContext';
import { usersApi, type AdminUser, type UserRole, ROLE_LABELS, ROLE_OPTIONS } from '../lib/users';

interface PermissionRow {
  permission: string;
  category: string;
  admin: boolean;
  pm: boolean;
  dev: boolean;
  qa: boolean;
  stakeholder: boolean;
}

const PERMISSION_MATRIX: PermissionRow[] = [
  { permission: 'Manage Workspace & Cluster Settings', category: 'System', admin: true, pm: false, dev: false, qa: false, stakeholder: false },
  { permission: 'Provision Users & Assign Roles', category: 'System', admin: true, pm: false, dev: false, qa: false, stakeholder: false },
  { permission: 'Restart Services & Inspect Daemon Logs', category: 'Infrastructure', admin: true, pm: false, dev: true, qa: false, stakeholder: false },
  { permission: 'Create Workspaces & Project Groups', category: 'Projects', admin: true, pm: true, dev: false, qa: false, stakeholder: false },
  { permission: 'Manage Sprints & Create Tasks', category: 'Project Management', admin: true, pm: true, dev: false, qa: false, stakeholder: false },
  { permission: 'Update Task Progress (Kanban Board)', category: 'Execution', admin: true, pm: true, dev: true, qa: true, stakeholder: false },
  { permission: 'Trigger Automated CI/CD Pipelines', category: 'DevOps', admin: true, pm: true, dev: true, qa: false, stakeholder: false },
  { permission: 'Deploy to Preview & Staging Environments', category: 'DevOps', admin: true, pm: true, dev: true, qa: false, stakeholder: false },
  { permission: 'Publish Android APKs & Push Broadcast', category: 'Mobile & QA', admin: true, pm: true, dev: true, qa: true, stakeholder: false },
  { permission: 'Submit Bug Reports & Device Diagnostics', category: 'Mobile & QA', admin: true, pm: true, dev: true, qa: true, stakeholder: false },
  { permission: 'Verify Defects & Sign-Off Previews', category: 'Quality & Governance', admin: true, pm: true, dev: false, qa: true, stakeholder: true },
];

export default function RoleAssignmentPage() {
  const { user } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'users' | 'matrix'>('users');

  const loadUsers = () => {
    usersApi
      .getAll()
      .then(setUsers)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleRoleChange = async (userId: number, newRole: UserRole) => {
    try {
      await usersApi.updateRole(userId, newRole);
      setToastMessage(`Updated role for user #${userId} to ${ROLE_LABELS[newRole]}`);
      setTimeout(() => setToastMessage(null), 3500);
      loadUsers();
    } catch {
      setToastMessage('Failed to update user role.');
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.username.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#050508] flex">
      <Sidebar />

      <div className="flex-1 flex flex-col">
        <header className="h-20 border-b border-white/5 flex items-center justify-between px-8">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              <ShieldCheck size={22} className="text-purple-400" /> Role & Permission Governance
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Role-based access control (RBAC) security matrix and workspace role assignments
            </p>
          </div>

          <div className="flex bg-[#12121a] p-1 rounded-xl border border-white/10 text-xs">
            <button
              onClick={() => setActiveTab('users')}
              className={`px-4 py-1.5 rounded-lg font-medium transition ${
                activeTab === 'users' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              User Assignments
            </button>
            <button
              onClick={() => setActiveTab('matrix')}
              className={`px-4 py-1.5 rounded-lg font-medium transition ${
                activeTab === 'matrix' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Permission Matrix
            </button>
          </div>
        </header>

        <main className="flex-1 p-8 space-y-6">
          {/* Toast */}
          {toastMessage && (
            <div className="bg-purple-600/20 border border-purple-500/40 text-purple-200 px-4 py-3 rounded-xl text-xs flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 size={16} className="text-purple-400 shrink-0" />
              <span>{toastMessage}</span>
            </div>
          )}

          {activeTab === 'users' ? (
            /* User Role Assignments View */
            <div className="bg-[#0e0e14] border border-white/5 rounded-2xl p-6 shadow-xl space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-bold text-white">Team Member Roles</h3>
                  <p className="text-xs text-slate-500">
                    Assign personas to calibrate access boundaries across workspaces and DevOps environments.
                  </p>
                </div>

                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search by name or email..."
                    className="bg-[#12121a] border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder:text-slate-500 outline-none w-64 focus:border-purple-500"
                  />
                </div>
              </div>

              {loading ? (
                <p className="text-slate-500 text-xs py-8 text-center">Loading users...</p>
              ) : filteredUsers.length === 0 ? (
                <p className="text-slate-500 text-xs py-8 text-center">No users found.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead>
                      <tr className="text-slate-500 text-xs border-b border-white/5">
                        <th className="pb-3 font-medium">User Profile</th>
                        <th className="pb-3 font-medium">Email</th>
                        <th className="pb-3 font-medium">Current Role</th>
                        <th className="pb-3 font-medium">Status</th>
                        <th className="pb-3 font-medium text-right">Assign New Role</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {filteredUsers.map((u) => (
                        <tr key={u.id} className="hover:bg-white/[0.01] transition">
                          <td className="py-4 text-white font-medium flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center text-white text-xs font-bold shadow">
                              {u.username.slice(0, 2).toUpperCase()}
                            </div>
                            <span>{u.username}</span>
                          </td>
                          <td className="py-4 text-slate-400 text-xs font-mono">{u.email}</td>
                          <td className="py-4">
                            <span className="text-xs font-semibold text-purple-400 bg-purple-500/10 border border-purple-500/20 px-2.5 py-1 rounded-full">
                              {ROLE_LABELS[u.role]}
                            </span>
                          </td>
                          <td className="py-4">
                            <span
                              className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${
                                u.isActive
                                  ? 'bg-green-500/10 text-green-400 border-green-500/20'
                                  : 'bg-red-500/10 text-red-400 border-red-500/20'
                              }`}
                            >
                              {u.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="py-4 text-right">
                            <select
                              value={u.role}
                              onChange={(e) => handleRoleChange(u.id, e.target.value as UserRole)}
                              className="bg-[#12121a] border border-white/10 text-white text-xs rounded-lg px-3 py-1.5 outline-none cursor-pointer focus:border-purple-500"
                            >
                              {ROLE_OPTIONS.map((r) => (
                                <option key={r} value={r}>
                                  {ROLE_LABELS[r]}
                                </option>
                              ))}
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : (
            /* RBAC Matrix View */
            <div className="bg-[#0e0e14] border border-white/5 rounded-2xl p-6 shadow-xl space-y-6">
              <div>
                <h3 className="text-lg font-bold text-white">Platform Permission Matrix</h3>
                <p className="text-xs text-slate-500">
                  Granular breakdown of system capabilities enforced by NestJS RolesGuard across API endpoints.
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="text-slate-400 text-xs border-b border-white/10">
                      <th className="pb-3 font-semibold">Capability / Permission</th>
                      <th className="pb-3 font-semibold">Category</th>
                      <th className="pb-3 font-semibold text-center text-rose-400">ADMIN</th>
                      <th className="pb-3 font-semibold text-center text-purple-400">PM</th>
                      <th className="pb-3 font-semibold text-center text-blue-400">DEV</th>
                      <th className="pb-3 font-semibold text-center text-orange-400">QA</th>
                      <th className="pb-3 font-semibold text-center text-emerald-400">STAKEHOLDER</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {PERMISSION_MATRIX.map((row, idx) => (
                      <tr key={idx} className="hover:bg-white/[0.01]">
                        <td className="py-3.5 text-white font-medium">{row.permission}</td>
                        <td className="py-3.5 text-slate-500">{row.category}</td>
                        <td className="py-3.5 text-center">
                          {row.admin ? (
                            <Check size={16} className="text-rose-400 mx-auto" />
                          ) : (
                            <X size={14} className="text-slate-700 mx-auto" />
                          )}
                        </td>
                        <td className="py-3.5 text-center">
                          {row.pm ? (
                            <Check size={16} className="text-purple-400 mx-auto" />
                          ) : (
                            <X size={14} className="text-slate-700 mx-auto" />
                          )}
                        </td>
                        <td className="py-3.5 text-center">
                          {row.dev ? (
                            <Check size={16} className="text-blue-400 mx-auto" />
                          ) : (
                            <X size={14} className="text-slate-700 mx-auto" />
                          )}
                        </td>
                        <td className="py-3.5 text-center">
                          {row.qa ? (
                            <Check size={16} className="text-orange-400 mx-auto" />
                          ) : (
                            <X size={14} className="text-slate-700 mx-auto" />
                          )}
                        </td>
                        <td className="py-3.5 text-center">
                          {row.stakeholder ? (
                            <Check size={16} className="text-emerald-400 mx-auto" />
                          ) : (
                            <X size={14} className="text-slate-700 mx-auto" />
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
