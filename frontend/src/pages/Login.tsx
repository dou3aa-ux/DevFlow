import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        try {
        await login(email, password);
        navigate('/projects');
        } catch {
        setError('Invalid email or password');
        }
    };

    return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center">
            <form onSubmit={handleSubmit} className="bg-slate-800 p-8 rounded-lg w-full max-w-sm space-y-4">
            <h1 className="text-2xl font-bold text-white">DevFlow Login</h1>

            {error && <p className="text-red-400 text-sm">{error}</p>}

            <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-2 rounded bg-slate-700 text-white outline-none"
            required
        />
            <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-2 rounded bg-slate-700 text-white outline-none"
            required
        />
            <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded font-medium"
            >
            Log In
            </button>
        </form>
        </div>
    );
}