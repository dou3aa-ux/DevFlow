import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getHomeForRole } from '../lib/roleHome';
import { ReactNode } from 'react';

interface ProtectedRouteProps {
    children: ReactNode;
    allowedRoles?: string[]; // omit = any logged-in user is allowed
}

export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
    const { user } = useAuth();

    if (!user) return <Navigate to="/login" replace />;

    if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Logged in, but wrong role for this page — send them to THEIR home, not a fixed one
    return <Navigate to={getHomeForRole(user.role)} replace />;
    }

    return <>{children}</>;
}