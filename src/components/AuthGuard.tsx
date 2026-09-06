import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Spinner } from './Spinner';

interface AuthGuardProps {
  children: ReactNode;
}

/**
 * Requires an authenticated session before rendering children.
 *
 * @param children - Protected UI
 */
export function AuthGuard({ children }: AuthGuardProps) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <Spinner />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
