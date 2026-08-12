import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { tasksApi } from '../lib/tasks';
import type { Task, Board } from '../lib/tasks';
import DevOpsPanel from '../components/DevOpsPanel';

const COLUMNS: { key: Task['status']; label: string }[] = [
    { key: 'TODO', label: 'To Do' },
    { key: 'IN_PROGRESS', label: 'In Progress' },
    { key: 'IN_REVIEW', label: 'In Review' },
    { key: 'DONE', label: 'Done' },
];

const PRIORITY_COLORS: Record<Task['priority'], string> = {
    LOW: 'bg-slate-600',
    MEDIUM: 'bg-blue-600',
    HIGH: 'bg-orange-600',
    CRITICAL: 'bg-red-600',
};

export default function ProjectBoard() {
    const { id } = useParams();
    const projectId = Number(id);
    const [board, setBoard] = useState<Board | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [title, setTitle] = useState('');

    const loadBoard = () => {
        tasksApi.getBoard(projectId).then(setBoard);
    };

    useEffect(() => {
        loadBoard();
    }, [projectId]);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        await tasksApi.create(projectId, { title });
        setTitle('');
        setShowForm(false);
        loadBoard();
    };

  // Simple move: click a task to advance it to the next column
    const moveForward = async (task: Task) => {
        const order: Task['status'][] = ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE'];
        const currentIndex = order.indexOf(task.status);
        if (currentIndex === order.length - 1) return; // already DONE
        const nextStatus = order[currentIndex + 1];
        await tasksApi.updateStatus(task.id, nextStatus);
        loadBoard();
    };

    if (!board) return <div className="min-h-screen bg-slate-900 text-white p-8">Loading board...</div>;

    return (
    <div className="min-h-screen bg-slate-900 text-white p-8">
        <div className="flex justify-between items-center mb-6">
        <Link to="/projects" className="text-slate-400 hover:text-white text-sm">← Back to Projects</Link>
        <button
            onClick={() => setShowForm(!showForm)}
            className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded"
            >
            + New Task
        </button>
        </div>

        {showForm && (
        <form onSubmit={handleCreate} className="bg-slate-800 p-4 rounded mb-6 flex gap-3 max-w-lg">
            <input
            placeholder="Task title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="flex-1 p-2 rounded bg-slate-700 outline-none"
            required
            />
            <button type="submit" className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded">
                Add
            </button>
        </form>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-4 gap-4">
            {COLUMNS.map((col) => (
            <div key={col.key} className="bg-slate-800 rounded-lg p-3">
                <h3 className="font-semibold mb-3 text-slate-300">
                {col.label} <span className="text-slate-500">({board[col.key]?.length ?? 0})</span>
                </h3>
            <div className="space-y-2">
                {board[col.key]?.map((task) => (
                    <div
                    key={task.id}
                    onClick={() => moveForward(task)}
                    className="bg-slate-700 hover:bg-slate-600 p-3 rounded cursor-pointer transition"
                    title="Click to move to next column"
                    >
                    <p className="text-sm font-medium">{task.title}</p>
                    <span className={`inline-block mt-2 text-xs px-2 py-0.5 rounded ${PRIORITY_COLORS[task.priority]}`}>
                        {task.priority}
                    </span>
                    </div>
                    ))}
            </div>
            </div>
            ))}
        </div>

        <div className="lg:col-span-1">
            <DevOpsPanel projectId={projectId} />
        </div>
        </div>
    </div>
    );
}