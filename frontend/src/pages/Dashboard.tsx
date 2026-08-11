import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
    const { user, logout } = useAuth();

    return (
        <div className="min-h-screen bg-slate-900 text-white p-8">
        <div className="flex justify-between items-center mb-8">
            <h1 className="text-2xl font-bold">Welcome, {user?.username}</h1>
            <button onClick={logout} className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded">
            Log Out
            </button>
        </div>
        <p className="text-slate-400">Role: {user?.role}</p>
        <p className="text-slate-400 mt-4">Projects list goes here next.</p>
        </div>
    );
}