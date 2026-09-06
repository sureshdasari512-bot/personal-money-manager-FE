import { useEffect, useState } from 'react';
import type { Person } from '../../../types';
import { toApiError } from '../../../types/errors';
import { fetchPerson } from '../api';

/**
 * Loads one contact owned by the current user.
 *
 * @param personId - Person id from the route
 * @returns Person, loading flag, and error message
 */
export function usePerson(personId: string) {
  const [person, setPerson] = useState<Person | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!personId) {
      setPerson(null);
      setError('Missing person.');
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setError(null);

    fetchPerson(personId)
      .then((response) => {
        if (!cancelled) {
          setPerson(response.person);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(toApiError(err).message);
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
  }, [personId]);

  return { person, isLoading, error };
}
