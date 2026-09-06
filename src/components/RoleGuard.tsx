import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import type { UserRole } from '../types';
import { Spinner } from './Spinner';

interface RoleGuardProps {
  allowedRoles: UserRole[];
  children: ReactNode;
}

/**
 * Wraps a route and redirects away if the current user's role isn't allowed.
 * NOTE: UX convenience only — the backend's requireRole is the real enforcement.
 *
 * @param allowedRoles - Roles permitted to see the wrapped route
 * @param children - Protected UI
 */
export function RoleGuard({ allowedRoles, children }: RoleGuardProps) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <Spinner />;
  }

  if (!user || !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
}
