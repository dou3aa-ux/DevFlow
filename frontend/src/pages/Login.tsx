import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getHomeForRole } from '../lib/roleHome';
import { Lock, Mail, ArrowRight, Shield, Code2, Users, Bug, ClipboardCheck } from 'lucide-react';

const DEMO_ACCOUNTS = [
  {
    role: 'ADMINISTRATOR',
    label: 'Administrator',
    icon: Shield,
    color: 'border-rose-500/30 text-rose-400 hover:bg-rose-500/10',
    email: 'admin@devflow.io',
    username: 'System Admin',
  },
  {
    role: 'PROJECT_MANAGER',
    label: 'Project Manager',
    icon: Users,
    color: 'border-purple-500/30 text-purple-400 hover:bg-purple-500/10',
    email: 'pm@devflow.io',
    username: 'Sarah Chen (PM)',
  },
  {
    role: 'DEVELOPER',
    label: 'Developer',
    icon: Code2,
    color: 'border-blue-500/30 text-blue-400 hover:bg-blue-500/10',
    email: 'dev@devflow.io',
    username: 'Alex Rivera (Dev)',
  },
  {
    role: 'QA_TESTER',
    label: 'QA Tester',
    icon: Bug,
    color: 'border-orange-500/30 text-orange-400 hover:bg-orange-500/10',
    email: 'tester@devflow.io',
    username: 'Elena Rostova (QA)',
  },
  {
    role: 'STAKEHOLDER',
    label: 'Stakeholder',
    icon: ClipboardCheck,
    color: 'border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10',
    email: 'stakeholder@devflow.io',
    username: 'David Miller (Stakeholder)',
  },
];

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { login, loginAsDemoUser } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const res = await login(email, password);
      navigate(getHomeForRole(res.user.role));
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Invalid email or password');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDemoLogin = async (account: (typeof DEMO_ACCOUNTS)[0]) => {
    if (account.role === 'ADMINISTRATOR') {
      try {
        setSubmitting(true);
        const res = await login(account.email, 'admin123');
        navigate(getHomeForRole(res.user.role));
        return;
      } catch (err: any) {
        setEmail(account.email);
        setPassword('admin123');
        setError(err?.response?.data?.message || 'Admin login failed');
        return;
      } finally {
        setSubmitting(false);
      }
    }

    loginAsDemoUser({
      id: Math.floor(Math.random() * 100) + 1,
      username: account.username,
      email: account.email,
      role: account.role,
    });
    navigate(getHomeForRole(account.role));
  };

  return (
    <div className="min-h-screen bg-[#050508] relative flex items-center justify-center p-6 overflow-hidden">
      {/* Ambient background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-purple-600/15 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-blue-600/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative w-full max-w-md space-y-6">
        {/* Branding header */}
        <div className="text-center space-y-2">
          <div className="inline-flex w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-500 items-center justify-center text-white font-mono font-bold text-xl shadow-lg shadow-purple-600/30">
            {'</>'}
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">DevFlow</h1>
          <p className="text-slate-400 text-sm">Unified Software Lifecycle & DevOps Platform</p>
        </div>

        {/* Login Card */}
        <div className="bg-[#0e0e14]/90 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs px-3.5 py-2.5 rounded-xl">
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Email Address</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="email"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#12121a] border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-slate-600 outline-none focus:border-purple-500 transition"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#12121a] border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-slate-600 outline-none focus:border-purple-500 transition"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white py-2.5 rounded-xl text-sm font-medium transition shadow-lg shadow-purple-600/20 flex items-center justify-center gap-2"
            >
              {submitting ? 'Authenticating...' : 'Sign In'} <ArrowRight size={16} />
            </button>
          </form>

          {/* Quick Demo Access */}
          <div className="pt-4 border-t border-white/5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Instant Demo Personas
              </span>
              <span className="text-[10px] text-purple-400 font-mono">1-Click Login</span>
            </div>

            <div className="grid grid-cols-1 gap-2">
              {DEMO_ACCOUNTS.map((acc) => {
                const Icon = acc.icon;
                return (
                  <button
                    key={acc.role}
                    type="button"
                    onClick={() => handleDemoLogin(acc)}
                    className={`flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-medium border transition ${acc.color} bg-white/[0.02]`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon size={15} />
                      <span>{acc.label}</span>
                    </div>
                    <span className="text-[10px] opacity-70 font-mono">{acc.email}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-slate-600">
          DevFlow v1.0 • Engineered for modern product & DevOps teams
        </p>
      </div>
    </div>
  );
}