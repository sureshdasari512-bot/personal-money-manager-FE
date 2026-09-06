import { useContext } from 'react';
import { AuthContext } from '../features/auth/AuthContext';

/**
 * Shared auth hook. Components must not read cookies or call `/auth/me` directly.
 *
 * @returns Current user, loading flag, and session actions
 * @throws Error if used outside AuthProvider
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
