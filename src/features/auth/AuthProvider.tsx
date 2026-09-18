import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { PublicUser } from '../../types';
import * as authApi from './api';
import { AuthContext } from './AuthContext';

interface AuthProviderProps {
  children: ReactNode;
}

/**
 * Owns session state for the whole app. Pages consume it through `useAuth`.
 *
 * @param children - Application tree
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<PublicUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetchCurrentUserSafe()
      .then((nextUser) => {
        if (!cancelled) {
          setUser(nextUser);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const response = await authApi.login({ email, password });
    setUser(response.user);
    return response.user;
  }, []);

  /**
   * Activates an invited account and stores the new session user.
   *
   * @param token - Invite token from the email link
   * @param password - Password chosen by the invitee
   * @returns Newly created public user
   */
  const completeInvite = useCallback(async (token: string, password: string) => {
    const response = await authApi.acceptInvite({ token, password });
    setUser(response.user);
    return response.user;
  }, []);

  /**
   * Completes a password reset and stores the new session user.
   *
   * @param token - Reset token from the email link
   * @param password - New password
   * @returns Public user after reset
   */
  const completePasswordReset = useCallback(async (token: string, password: string) => {
    const response = await authApi.resetPassword({ token, password });
    setUser(response.user);
    return response.user;
  }, []);

  const logout = useCallback(async () => {
    await authApi.logout();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, isLoading, login, completeInvite, completePasswordReset, logout }),
    [user, isLoading, login, completeInvite, completePasswordReset, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Reads `/auth/me` and treats 401 as an anonymous session.
 *
 * @returns Current user or null
 */
async function fetchCurrentUserSafe(): Promise<PublicUser | null> {
  try {
    const response = await authApi.fetchCurrentUser();
    return response.user;
  } catch {
    return null;
  }
}
