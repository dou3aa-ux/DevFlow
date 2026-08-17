import { Search, Bell, ChevronDown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import type { Project } from '../lib/projects';

interface TopbarProps {
  projects: Project[];
  selectedProjectId: number | null;
  onSelectProject: (id: number) => void;
}

export default function Topbar({ projects, selectedProjectId, onSelectProject }: TopbarProps) {
  const { user } = useAuth();
  const selectedProject = projects.find((p) => p.id === selectedProjectId);

  return (
    <header className="h-20 border-b border-white/5 flex items-center justify-between px-8 gap-6">
      <div className="flex-1 max-w-xl">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            placeholder="Search commands, projects, files..."
            className="w-full bg-[#12121a] border border-white/5 rounded-lg pl-9 pr-3 py-2.5 text-sm text-white placeholder:text-slate-500 outline-none focus:border-purple-600/50"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative">
          <select
            value={selectedProjectId ?? ''}
            onChange={(e) => onSelectProject(Number(e.target.value))}
            className="appearance-none bg-[#12121a] border border-white/5 rounded-lg pl-4 pr-9 py-2 text-sm text-white outline-none cursor-pointer"
          >
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-green-500 pointer-events-none" />
          <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
        </div>

        <button className="relative w-9 h-9 rounded-lg bg-[#12121a] border border-white/5 flex items-center justify-center text-slate-400 hover:text-white transition">
          <Bell size={16} />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-red-500" />
        </button>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-sm font-medium text-white leading-tight">{user?.username ?? 'User'}</p>
            <p className="text-xs text-slate-500">{user?.role ?? ''}</p>
          </div>
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-sm font-semibold">
            {user?.username?.charAt(0).toUpperCase() ?? 'U'}
          </div>
        </div>
      </div>

      {selectedProject && <span className="sr-only">{selectedProject.name}</span>}
    </header>
  );
}