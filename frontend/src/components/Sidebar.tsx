import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Kanban,
  Rocket,
  Server,
  Users,
  Settings,
  ShieldCheck,
  UserCog,
  Lock,
  FileClock,
  ClipboardCheck,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

type NavItem = { label: string; icon: typeof LayoutDashboard; path: string };

const TEAM_NAV: NavItem[] = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
  { label: 'Kanban', icon: Kanban, path: '/kanban' },
  { label: 'CI/CD', icon: Rocket, path: '/cicd' },
  { label: 'Infrastructure', icon: Server, path: '/infrastructure' },
  { label: 'Stakeholder Review', icon: Users, path: '/stakeholder-review' },
];

const ADMIN_NAV: NavItem[] = [
  { label: 'User Management', icon: UserCog, path: '/admin/users' },
  { label: 'Role Assignment', icon: ShieldCheck, path: '/admin/roles' },
  { label: 'Workspace Security', icon: Lock, path: '/admin/security' },
  { label: 'System Logs', icon: FileClock, path: '/admin/logs' },
];

const STAKEHOLDER_NAV: NavItem[] = [
  { label: 'Review Dashboard', icon: ClipboardCheck, path: '/stakeholder-review' },
];

function getNavForRole(role?: string): NavItem[] {
  if (role === 'ADMINISTRATOR') return ADMIN_NAV;
  if (role === 'STAKEHOLDER') return STAKEHOLDER_NAV;
  return TEAM_NAV; // PROJECT_MANAGER, DEVELOPER, QA_TESTER
}

export default function Sidebar() {
  const location = useLocation();
  const { user } = useAuth();
  const navItems = getNavForRole(user?.role);

  return (
    <aside className="w-64 bg-[#0a0a0f] border-r border-white/5 flex flex-col h-screen sticky top-0">
      <div className="flex items-center gap-2 px-6 py-6">
        <div className="w-9 h-9 rounded-lg bg-purple-600 flex items-center justify-center text-white font-bold text-sm">
          {'</>'}
        </div>
        <span className="text-white font-bold text-lg">DevFlow</span>
      </div>

      <nav className="flex-1 px-3 space-y-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                isActive
                  ? 'bg-purple-600/15 text-purple-400 border border-purple-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Icon size={18} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="px-3 pb-6">
        <Link
          to="/settings"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:text-white hover:bg-white/5 transition"
        >
          <Settings size={18} />
          Settings
        </Link>
      </div>
    </aside>
  );
}