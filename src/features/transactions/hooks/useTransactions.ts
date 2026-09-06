import { useCallback, useEffect, useState } from 'react';
import { toApiError } from '../../../types/errors';
import { fetchPersonLedger } from '../api';
import type { LedgerTransaction } from '../types';

/**
 * Fetches and refreshes the ledger for a given person.
 *
 * @param personId - The person whose transactions to load
 * @returns Ledger data, loading state, error, and reload helper
 */
export function useTransactions(personId: string) {
  const [transactions, setTransactions] = useState<LedgerTransaction[]>([]);
  const [netBalanceCents, setNetBalanceCents] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!personId) {
      setTransactions([]);
      setNetBalanceCents(0);
      setError('Missing person.');
      setIsLoading(false);
      return;
    }

    setError(null);
    try {
      const ledger = await fetchPersonLedger(personId);
      setTransactions(ledger.transactions);
      setNetBalanceCents(ledger.netBalanceCents);
    } catch (err) {
      setError(toApiError(err).message);
    } finally {
      setIsLoading(false);
    }
  }, [personId]);

  useEffect(() => {
    setIsLoading(true);
    void reload();
  }, [reload]);

  return { transactions, netBalanceCents, isLoading, error, reload };
}
