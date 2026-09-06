import { useCallback, useEffect, useState } from 'react';
import type { Person } from '../../../types';
import { toApiError } from '../../../types/errors';
import { fetchPeople } from '../api';

/**
 * Fetches and refreshes the current user's contacts.
 *
 * @returns People list plus loading, error, and reload helpers
 */
export function usePeople() {
  const [people, setPeople] = useState<Person[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setError(null);
    try {
      const response = await fetchPeople();
      setPeople(response.people);
    } catch (err) {
      setError(toApiError(err).message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { people, isLoading, error, reload };
}
