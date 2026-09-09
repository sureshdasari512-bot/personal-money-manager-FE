import { useEffect, useState } from 'react';
import type { DashboardSummary } from '../../../types';
import { fetchDashboard } from '../api';

/**
 * Fetches dashboard totals, people with balances, and due lists.
 *
 * @returns Summary, loading, and error state
 */
export function useDashboard() {
  const [dashboard, setDashboard] = useState<DashboardSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchDashboard()
      .then((data) => {
        if (!cancelled) {
          setDashboard(data.dashboard);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err : new Error('Failed to load dashboard'));
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

  return { dashboard, isLoading, error };
}
