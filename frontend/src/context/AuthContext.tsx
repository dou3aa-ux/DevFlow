import { createContext, useContext, useState, ReactNode } from 'react';
import { api } from '../lib/api';

interface User {
    id: number;
    username: string;
    email: string;
    role: string;
}

interface AuthContextType {
    user: User | null;
    login: (email: string, password: string) => Promise<{ user: User; accessToken: string }>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('devflow_user');
    return saved ? JSON.parse(saved) : null;
    });

    const login = async (email: string, password: string) => {
    const res = await api.post('/auth/login', { email, password });
    localStorage.setItem('devflow_token', res.data.accessToken);
    localStorage.setItem('devflow_user', JSON.stringify(res.data.user));
    setUser(res.data.user);
    return res.data;
    };

    const logout = () => {
    localStorage.removeItem('devflow_token');
    localStorage.removeItem('devflow_user');
    setUser(null);
    };

    return (
    <AuthContext.Provider value={{ user, login, logout }}>
        {children}
    </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
}