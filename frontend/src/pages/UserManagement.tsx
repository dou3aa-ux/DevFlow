import { useEffect, useState } from 'react';
import { Send, MoreVertical, Filter, Download, X } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../context/AuthContext';
import {
  usersApi,
  ROLE_LABELS,
  ROLE_OPTIONS,
  type AdminUser,
  type UserRole,
} from '../lib/users';

function generateTempPassword(length = 12) {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function Avatar({ name, email }: { name: string; email: string }) {
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
  const colors = [
    'from-purple-500 to-pink-500',
    'from-blue-500 to-cyan-500',
    'from-emerald-500 to-teal-500',
    'from-orange-500 to-amber-500',
    'from-rose-500 to-red-500',
  ];
  const idx = email.length % colors.length;
  return (
    <div
      className={`w-9 h-9 rounded-full bg-gradient-to-br ${colors[idx]} flex items-center justify-center text-white text-xs font-semibold shrink-0`}
    >
      {initials}
    </div>
  );
}

export default function UserManagement() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Form state
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole | ''>('');

  // Actions menu
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);

  const loadUsers = async () => {
    try {
      const data = await usersApi.getAll();
      setUsers(data);
    } catch {
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleProvision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim() || !role) {
      setError('Please fill in all fields');
      return;
    }
    setError('');
    setSuccessMsg('');
    setSubmitting(true);

    const tempPassword = generateTempPassword();
    // username = full name with spaces removed / lowercased, or use full name as-is
    const username = fullName.trim().replace(/\s+/g, '.').toLowerCase();

    try {
      await usersApi.create({
        username,
        email: email.trim(),
        password: tempPassword,
        role: role as UserRole,
      });
      setSuccessMsg(
        `Account created for ${fullName}. Temporary password: ${tempPassword} (share it securely)`
      );
      setFullName('');
      setEmail('');
      setRole('');
      await loadUsers();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || 'Failed to create user';
      setError(Array.isArray(msg) ? msg.join(', ') : msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (u: AdminUser) => {
    setOpenMenuId(null);
    try {
      await usersApi.updateStatus(u.id, !u.isActive);
      await loadUsers();
    } catch {
      setError('Failed to update status');
    }
  };

  const handleChangeRole = async (u: AdminUser, newRole: UserRole) => {
    setOpenMenuId(null);
    try {
      await usersApi.updateRole(u.id, newRole);
      await loadUsers();
    } catch {
      setError('Failed to update role');
    }
  };

  return (
    <div className="min-h-screen bg-[#050508] flex">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar (admin-friendly, no project dependency) */}
        <header className="h-16 border-b border-white/5 flex items-center justify-between px-8 gap-6 shrink-0">
          <div className="flex-1 max-w-xl">
            <div className="relative">
              <input
                placeholder="Search commands, projects, files..."
                className="w-full bg-[#12121a] border border-white/5 rounded-lg pl-4 pr-3 py-2 text-sm text-white placeholder:text-slate-500 outline-none focus:border-purple-600/50"
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-medium text-white leading-tight">
                {currentUser?.username ?? 'Admin'}
              </p>
              <p className="text-xs text-slate-500">{currentUser?.role ?? ''}</p>
            </div>
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-sm font-semibold">
              {currentUser?.username?.charAt(0).toUpperCase() ?? 'A'}
            </div>
          </div>
        </header>

        <main className="flex-1 p-8 overflow-auto">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-white">User Management</h1>
            <p className="text-slate-400 text-sm mt-1">
              Provision new accounts and manage team access.
            </p>
          </div>

          {error && (
            <div className="mb-4 flex items-center justify-between bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-lg px-4 py-3">
              <span>{error}</span>
              <button onClick={() => setError('')} className="hover:text-white">
                <X size={16} />
              </button>
            </div>
          )}
          {successMsg && (
            <div className="mb-4 flex items-center justify-between bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm rounded-lg px-4 py-3">
              <span>{successMsg}</span>
              <button onClick={() => setSuccessMsg('')} className="hover:text-white">
                <X size={16} />
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
            {/* Provision New User */}
            <div className="xl:col-span-2 bg-[#0e0e14] border border-white/5 rounded-2xl p-6">
              <h2 className="text-lg font-semibold text-white mb-6">Provision New User</h2>
              <form onSubmit={handleProvision} className="space-y-5">
                <div>
                  <label className="block text-sm text-slate-400 mb-1.5">Full Name</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Sarah Jenkins"
                    className="w-full bg-[#12121a] border border-white/5 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-slate-600 outline-none focus:border-purple-600/50"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1.5">
                    Corporate Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="sarah.j@company.com"
                    className="w-full bg-[#12121a] border border-white/5 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-slate-600 outline-none focus:border-purple-600/50"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1.5">System Role</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as UserRole | '')}
                    className="w-full bg-[#12121a] border border-white/5 rounded-lg px-3 py-2.5 text-sm text-white outline-none focus:border-purple-600/50 appearance-none cursor-pointer"
                    required
                  >
                    <option value="" disabled>
                      Select a role...
                    </option>
                    {ROLE_OPTIONS.map((r) => (
                      <option key={r} value={r}>
                        {ROLE_LABELS[r]}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-60 text-white py-3 rounded-xl text-sm font-medium transition"
                >
                  <Send size={16} />
                  {submitting ? 'Provisioning...' : 'Provision Account & Send Invite'}
                </button>
              </form>
            </div>

            {/* Team Roster */}
            <div className="xl:col-span-3 bg-[#0e0e14] border border-white/5 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-white">Team Roster</h2>
                <div className="flex gap-2">
                  <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/5 text-slate-400 text-xs hover:text-white transition">
                    <Filter size={14} /> Filter
                  </button>
                  <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/5 text-slate-400 text-xs hover:text-white transition">
                    <Download size={14} /> Export
                  </button>
                </div>
              </div>

              {loading ? (
                <p className="text-slate-500 text-sm py-12 text-center">Loading users...</p>
              ) : users.length === 0 ? (
                <p className="text-slate-500 text-sm py-12 text-center">
                  No users yet. Provision the first account.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-white/5 text-xs text-slate-500 uppercase tracking-wider">
                        <th className="pb-3 font-medium">Name</th>
                        <th className="pb-3 font-medium">Assigned Role</th>
                        <th className="pb-3 font-medium">Status</th>
                        <th className="pb-3 font-medium text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {users.map((u) => (
                        <tr key={u.id} className="group">
                          <td className="py-4 pr-4">
                            <div className="flex items-center gap-3">
                              <Avatar name={u.username} email={u.email} />
                              <div>
                                <p className="text-sm font-medium text-white">{u.username}</p>
                                <p className="text-xs text-slate-500">{u.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 pr-4">
                            <span className="text-sm text-slate-300">
                              {ROLE_LABELS[u.role] ?? u.role}
                            </span>
                          </td>
                          <td className="py-4 pr-4">
                            {u.isActive ? (
                              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                Active
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 bg-white/5 border border-white/10 px-2.5 py-1 rounded-full">
                                <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                                Inactive
                              </span>
                            )}
                          </td>
                          <td className="py-4 text-right relative">
                            <button
                              onClick={() =>
                                setOpenMenuId(openMenuId === u.id ? null : u.id)
                              }
                              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition"
                            >
                              <MoreVertical size={16} />
                            </button>
                            {openMenuId === u.id && (
                              <>
                                <div
                                  className="fixed inset-0 z-10"
                                  onClick={() => setOpenMenuId(null)}
                                />
                                <div className="absolute right-0 top-full mt-1 z-20 w-48 bg-[#16161f] border border-white/10 rounded-xl shadow-xl py-1 overflow-hidden">
                                  <p className="px-3 py-1.5 text-[10px] uppercase tracking-wider text-slate-500">
                                    Change role
                                  </p>
                                  {ROLE_OPTIONS.filter((r) => r !== u.role).map((r) => (
                                    <button
                                      key={r}
                                      onClick={() => handleChangeRole(u, r)}
                                      className="w-full text-left px-3 py-2 text-sm text-slate-300 hover:bg-white/5 hover:text-white"
                                    >
                                      {ROLE_LABELS[r]}
                                    </button>
                                  ))}
                                  <div className="border-t border-white/5 my-1" />
                                  <button
                                    onClick={() => handleToggleStatus(u)}
                                    className="w-full text-left px-3 py-2 text-sm text-slate-300 hover:bg-white/5 hover:text-white"
                                  >
                                    {u.isActive ? 'Deactivate' : 'Activate'}
                                  </button>
                                </div>
                              </>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}