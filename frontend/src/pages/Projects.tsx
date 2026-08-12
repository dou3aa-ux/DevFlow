import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { projectsApi } from '../lib/projects';
import type { Project } from '../lib/projects';

export default function Projects() {
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const { user, logout } = useAuth();

    const loadProjects = () => {
        setLoading(true);
        projectsApi.getAll()
        .then(setProjects)
        .finally(() => setLoading(false));
    };

    useEffect(() => {
        loadProjects();
    }, []);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        await projectsApi.create({ name, description });
        setName('');
        setDescription('');
        setShowForm(false);
        loadProjects();
    };

    return (
        <div className="min-h-screen bg-slate-900 text-white p-8">
        <div className="flex justify-between items-center mb-8">
            <div>
            <h1 className="text-2xl font-bold">Your Projects</h1>
            <p className="text-slate-400 text-sm">Logged in as {user?.username} ({user?.role})</p>
            </div>
            <div className="flex gap-3">
            <button
                onClick={() => setShowForm(!showForm)}
                className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded"
            >
            + New Project
            </button>
            <button onClick={logout} className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded">
            Log Out
            </button>
            </div>
        </div>

        {showForm && (
            <form onSubmit={handleCreate} className="bg-slate-800 p-4 rounded mb-6 space-y-3 max-w-md">
            <input
                placeholder="Project name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-2 rounded bg-slate-700 outline-none"
                required
            />
            <textarea
                placeholder="Description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full p-2 rounded bg-slate-700 outline-none"
            />
            <button type="submit" className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded">
            Create
            </button>
            </form>
        )}

        {loading ? (
            <p className="text-slate-400">Loading...</p>
        ) : projects.length === 0 ? (
            <p className="text-slate-400">No projects yet — create one above.</p>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {projects.map((p) => (
            <Link
                key={p.id}
                to={`/projects/${p.id}`}
                className="bg-slate-800 hover:bg-slate-700 p-4 rounded-lg block transition"
                >
                <h2 className="font-semibold text-lg">{p.name}</h2>
                <p className="text-slate-400 text-sm mt-1">{p.description}</p>
                <span className="inline-block mt-3 text-xs bg-slate-700 px-2 py-1 rounded">
                {p.status}
                </span>
            </Link>
            ))}
        </div>
        )}
    </div>
    );
}