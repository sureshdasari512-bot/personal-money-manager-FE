import { useEffect, useState } from 'react';
import type { PublicUser } from '../../../types';
import { fetchUsers } from '../api';

/**
 * Fetches the admin user-management list.
 *
 * @returns Users plus loading and error state
 */
export function useUsers() {
  const [users, setUsers] = useState<PublicUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchUsers()
      .then((data) => {
        if (!cancelled) {
          setUsers(data.users);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err : new Error('Failed to load users'));
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

  return { users, setUsers, isLoading, error };
}
