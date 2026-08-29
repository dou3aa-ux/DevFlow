import { useEffect, useState } from 'react';
import { Send, Filter, Download, MoreVertical, Copy, Check } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import { usersApi, ROLE_LABELS, ROLE_OPTIONS } from '../lib/users';
import type { AdminUser, UserRole } from '../lib/users';

function initials(name: string) {
  return name.slice(0, 2).toUpperCase();
}

const AVATAR_COLORS = [
  'from-purple-500 to-pink-500',
  'from-blue-500 to-cyan-500',
  'from-emerald-500 to-teal-500',
  'from-orange-500 to-amber-500',
];

function avatarColor(id: number) {
  return AVATAR_COLORS[id % AVATAR_COLORS.length];
}

export default function UserManagementPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('DEVELOPER');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [generatedPassword, setGeneratedPassword] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const load = () => {
    usersApi.getAll().then((u) => {
      setUsers(u);
      setLoading(false);
    });
  };

  useEffect(() => {
    load();
  }, []);

  const handleProvision = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    setGeneratedPassword(null);
    setCopied(false);
    try {
      const result = await usersApi.create({ username, email, role });
      setGeneratedPassword(result.tempPassword);
      setUsername('');
      setEmail('');
      setRole('DEVELOPER');
      load();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to create user');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopyPassword = () => {
    if (!generatedPassword) return;
    navigator.clipboard.writeText(generatedPassword);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRoleChange = async (id: number, newRole: UserRole) => {
    await usersApi.updateRole(id, newRole);
    setOpenMenuId(null);
    load();
  };

  const handleToggleStatus = async (id: number, current: boolean) => {
    await usersApi.updateStatus(id, !current);
    setOpenMenuId(null);
    load();
  };

  const handleExport = () => {
    const rows = ['Name,Email,Role,Status'];
    users.forEach((u) => {
      rows.push(`${u.username},${u.email},${ROLE_LABELS[u.role]},${u.isActive ? 'Active' : 'Inactive'}`);
    });
    const blob = new Blob([rows.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'devflow-users.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const filtered = users.filter(
    (u) => u.username.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#050508] flex">
      <Sidebar />
      <div className="flex-1 p-8">
        <h1 className="text-2xl font-bold text-white">User Management</h1>
        <p className="text-slate-500 text-sm mt-1 mb-8">Provision new accounts and manage team access.</p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-[#0e0e14] border border-white/5 rounded-2xl p-6">
            <h2 className="text-white font-semibold text-lg mb-5">Provision New User</h2>
            <form onSubmit={handleProvision} className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1.5">Full Name</label>
                <input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. Sarah Jenkins"
                  className="w-full bg-white/[0.03] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-slate-600 outline-none focus:border-purple-500/50"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1.5">Corporate Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="sarah.j@company.com"
                  className="w-full bg-white/[0.03] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-slate-600 outline-none focus:border-purple-500/50"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1.5">System Role Assignment</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  className="w-full bg-white/[0.03] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white outline-none"
                >
                  {ROLE_OPTIONS.map((r) => (
                    <option key={r} value={r} className="bg-[#0e0e14]">
                      {ROLE_LABELS[r]}
                    </option>
                  ))}
                </select>
              </div>

              <p className="text-xs text-slate-500">
                A secure password will be generated automatically — you'll get a one-time copyable code after creating the account.
              </p>

              {error && <p className="text-red-400 text-sm">{error}</p>}

              <button
                type="submit"
                disabled={submitting}
                className="w-full flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white py-3 rounded-lg text-sm font-semibold transition"
              >
                <Send size={15} /> {submitting ? 'Provisioning...' : 'Provision Account'}
              </button>
            </form>

            {generatedPassword && (
              <div className="mt-4 bg-purple-500/10 border border-purple-500/20 rounded-lg p-4">
                <p className="text-sm text-purple-300 mb-2">
                  Account created. Share this password with the user — it won't be shown again:
                </p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-black/30 text-white text-sm px-3 py-2 rounded font-mono break-all">
                    {generatedPassword}
                  </code>
                  <button
                    onClick={handleCopyPassword}
                    className="shrink-0 flex items-center gap-1 text-xs bg-white/10 hover:bg-white/20 text-white px-3 py-2 rounded transition"
                  >
                    {copied ? <Check size={14} /> : <Copy size={14} />} {copied ? 'Copied' : 'Copy'}
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="lg:col-span-2 bg-[#0e0e14] border border-white/5 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-white font-semibold text-lg">Team Roster</h2>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Filter..."
                    className="bg-white/5 border border-white/10 rounded-lg pl-8 pr-3 py-2 text-sm text-white outline-none w-40"
                  />
                </div>
                <button
                  onClick={handleExport}
                  className="flex items-center gap-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white text-sm px-3 py-2 rounded-lg transition"
                >
                  <Download size={14} /> Export
                </button>
              </div>
            </div>

            {loading ? (
              <p className="text-slate-500 text-sm py-8 text-center">Loading users...</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-500 text-xs border-b border-white/5">
                    <th className="pb-3 font-medium">Name</th>
                    <th className="pb-3 font-medium">Assigned Role</th>
                    <th className="pb-3 font-medium">Status</th>
                    <th className="pb-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((u) => (
                    <tr key={u.id} className="border-b border-white/5 last:border-0">
                      <td className="py-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-9 h-9 rounded-full bg-gradient-to-br ${avatarColor(u.id)} flex items-center justify-center text-white text-xs font-semibold`}
                          >
                            {initials(u.username)}
                          </div>
                          <div>
                            <p className="text-white font-medium">{u.username}</p>
                            <p className="text-slate-500 text-xs">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 text-slate-300">{ROLE_LABELS[u.role]}</td>
                      <td className="py-4">
                        <span
                          className={`text-xs font-medium px-2.5 py-1 rounded-full border ${
                            u.isActive
                              ? 'bg-green-500/10 text-green-400 border-green-500/20'
                              : 'bg-slate-500/10 text-slate-400 border-slate-500/20'
                          }`}
                        >
                          {u.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="py-4 text-right relative">
                        <button
                          onClick={() => setOpenMenuId(openMenuId === u.id ? null : u.id)}
                          className="text-slate-500 hover:text-white p-1"
                        >
                          <MoreVertical size={16} />
                        </button>
                        {openMenuId === u.id && (
                          <div className="absolute right-0 top-8 z-10 bg-[#12121a] border border-white/10 rounded-lg shadow-xl w-56 text-left p-2">
                            <p className="text-xs text-slate-500 px-2 py-1">Change role</p>
                            {ROLE_OPTIONS.map((r) => (
                              <button
                                key={r}
                                onClick={() => handleRoleChange(u.id, r)}
                                className={`w-full text-left px-2 py-1.5 rounded text-sm hover:bg-white/5 ${
                                  r === u.role ? 'text-purple-400' : 'text-slate-300'
                                }`}
                              >
                                {ROLE_LABELS[r]}
                              </button>
                            ))}
                            <div className="border-t border-white/5 my-1" />
                            <button
                              onClick={() => handleToggleStatus(u.id, u.isActive)}
                              className="w-full text-left px-2 py-1.5 rounded text-sm text-slate-300 hover:bg-white/5"
                            >
                              {u.isActive ? 'Deactivate account' : 'Activate account'}
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}