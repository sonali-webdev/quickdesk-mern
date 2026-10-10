import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import type { UserRole } from '../types';

interface Props {
  roles?: UserRole[]; // optional: restrict this branch to certain roles
}

export default function ProtectedRoute({ roles }: Props) {
  const { user, loading } = useAuth();
  const location = useLocation();

  // On refresh we have a token but no user yet. Without this check we'd
  // wrongly redirect a logged-in user to /login.
  if (loading) return <p className="center">Loading...</p>;

  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/tickets" replace />;

  return <Outlet />;
}