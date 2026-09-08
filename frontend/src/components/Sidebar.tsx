import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Kanban,
  Rocket,
  Server,
  Users,
  ShieldCheck,
  UserCog,
  FileClock,
  ClipboardCheck,
  Code2,
  Bug,
  Smartphone,
  TrendingUp,
  BookOpen,
  FolderKanban,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

type NavItem = { label: string; icon: typeof LayoutDashboard; path: string };

const ADMIN_NAV: NavItem[] = [
  { label: 'User Management', icon: UserCog, path: '/admin/users' },
  { label: 'Role Assignment', icon: ShieldCheck, path: '/admin/roles' },
  { label: 'Project Teams', icon: Users, path: '/admin/teams' },
  { label: 'Workspaces', icon: FolderKanban, path: '/projects' },
  { label: 'Kanban Board', icon: Kanban, path: '/kanban' },
  { label: 'CI/CD Pipelines', icon: Rocket, path: '/cicd' },
  { label: 'Infrastructure', icon: Server, path: '/infrastructure' },
  { label: 'QA Bug Tracker', icon: Bug, path: '/qa' },
  { label: 'Mobile Builds (APK)', icon: Smartphone, path: '/mobile-builds' },
  { label: 'Analytics', icon: TrendingUp, path: '/analytics' },
  { label: 'Documentation', icon: BookOpen, path: '/docs' },
  { label: 'System Logs', icon: FileClock, path: '/admin/logs' },
];

const PM_NAV: NavItem[] = [
  { label: 'Executive Dashboard', icon: LayoutDashboard, path: '/dashboard' },
  { label: 'Workspaces', icon: FolderKanban, path: '/projects' },
  { label: 'Kanban Board', icon: Kanban, path: '/kanban' },
  { label: 'Developer Hub', icon: Code2, path: '/developer' },
  { label: 'CI/CD Pipelines', icon: Rocket, path: '/cicd' },
  { label: 'QA Bug Tracker', icon: Bug, path: '/qa' },
  { label: 'Mobile Distribution', icon: Smartphone, path: '/mobile-builds' },
  { label: 'Stakeholder Review', icon: ClipboardCheck, path: '/stakeholder-review' },
  { label: 'Analytics', icon: TrendingUp, path: '/analytics' },
  { label: 'Infrastructure', icon: Server, path: '/infrastructure' },
  { label: 'Documentation', icon: BookOpen, path: '/docs' },
];

const DEV_NAV: NavItem[] = [
  { label: 'Developer Workspace', icon: Code2, path: '/developer' },
  { label: 'Kanban Board', icon: Kanban, path: '/kanban' },
  { label: 'Workspaces', icon: FolderKanban, path: '/projects' },
  { label: 'CI/CD Pipelines', icon: Rocket, path: '/cicd' },
  { label: 'QA Bug Tracker', icon: Bug, path: '/qa' },
  { label: 'Mobile Builds', icon: Smartphone, path: '/mobile-builds' },
  { label: 'Infrastructure', icon: Server, path: '/infrastructure' },
  { label: 'Documentation', icon: BookOpen, path: '/docs' },
];

const QA_NAV: NavItem[] = [
  { label: 'QA Bug Tracker', icon: Bug, path: '/qa' },
  { label: 'Mobile Distribution (APK)', icon: Smartphone, path: '/mobile-builds' },
  { label: 'Kanban Board', icon: Kanban, path: '/kanban' },
  { label: 'Workspaces', icon: FolderKanban, path: '/projects' },
  { label: 'CI/CD Pipelines', icon: Rocket, path: '/cicd' },
  { label: 'Documentation', icon: BookOpen, path: '/docs' },
];

const STAKEHOLDER_NAV: NavItem[] = [
  { label: 'Review Dashboard', icon: ClipboardCheck, path: '/stakeholder-review' },
  { label: 'Workspaces', icon: FolderKanban, path: '/projects' },
  { label: 'Analytics', icon: TrendingUp, path: '/analytics' },
  { label: 'Documentation', icon: BookOpen, path: '/docs' },
];

function getNavForRole(role?: string): NavItem[] {
  if (role === 'ADMINISTRATOR') return ADMIN_NAV;
  if (role === 'DEVELOPER') return DEV_NAV;
  if (role === 'QA_TESTER') return QA_NAV;
  if (role === 'STAKEHOLDER') return STAKEHOLDER_NAV;
  return PM_NAV; // PROJECT_MANAGER or default
}

export default function Sidebar() {
  const location = useLocation();
  const { user } = useAuth();
  const navItems = getNavForRole(user?.role);

  return (
    <aside className="w-64 bg-[#0a0a0f] border-r border-white/5 flex flex-col h-screen sticky top-0 shrink-0">
      {/* Brand */}
      <div className="flex items-center gap-3 px-6 py-6 border-b border-white/5">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white font-mono font-bold text-sm shadow-lg shadow-purple-600/30">
          {'</>'}
        </div>
        <div>
          <span className="text-white font-bold text-lg tracking-tight leading-none block">DevFlow</span>
          <span className="text-[10px] text-slate-500 font-mono">Workspace OS</span>
        </div>
      </div>

      {/* Nav list */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition ${
                isActive
                  ? 'bg-purple-600/15 text-purple-400 border border-purple-600/30 shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-white/[0.03]'
              }`}
            >
              <Icon size={17} className={isActive ? 'text-purple-400' : 'text-slate-500'} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer info */}
      <div className="p-4 border-t border-white/5 bg-[#08080c]">
        <div className="flex items-center justify-between text-[11px] text-slate-500">
          <span>DevFlow Enterprise</span>
          <span className="text-green-400 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            Online
          </span>
        </div>
      </div>
    </aside>
  );
}