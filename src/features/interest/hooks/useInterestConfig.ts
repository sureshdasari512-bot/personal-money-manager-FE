import { useState } from 'react';
import { toApiError, type FieldErrors } from '../../../types/errors';
import { deleteInterestConfig, upsertInterestConfig } from '../api';
import type { InterestConfigPayload, LedgerTransaction } from '../types';

interface UseInterestConfigReturn {
  isSaving: boolean;
  fieldErrors: FieldErrors;
  globalError: string | null;
  handleUpsert: (transaction: LedgerTransaction, payload: InterestConfigPayload) => Promise<boolean>;
  handleDelete: (transaction: LedgerTransaction) => Promise<boolean>;
  clearErrors: () => void;
}

/**
 * Manages create / update / delete of a transaction's interest config.
 * Returns save state and error state — no data fetching (ledger reload is the caller's job).
 *
 * @returns Handler functions and in-flight / error state
 */
export function useInterestConfig(): UseInterestConfigReturn {
  const [isSaving, setIsSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [globalError, setGlobalError] = useState<string | null>(null);

  /**
   * Clears all error state — call when a form closes.
   */
  function clearErrors(): void {
    setFieldErrors({});
    setGlobalError(null);
  }

  /**
   * Creates or updates the interest config for a transaction.
   *
   * @param transaction - Transaction to configure
   * @param payload     - Rate in bps and compounding period
   * @returns true on success, false on API error
   */
  async function handleUpsert(
    transaction: LedgerTransaction,
    payload: InterestConfigPayload,
  ): Promise<boolean> {
    setIsSaving(true);
    clearErrors();
    try {
      await upsertInterestConfig(transaction.id, payload);
      return true;
    } catch (err) {
      const apiError = toApiError(err);
      setFieldErrors(apiError.fields ?? {});
      setGlobalError(apiError.message);
      return false;
    } finally {
      setIsSaving(false);
    }
  }

  /**
   * Soft-deletes the interest config for a transaction.
   *
   * @param transaction - Transaction whose config to remove
   * @returns true on success, false on API error
   */
  async function handleDelete(transaction: LedgerTransaction): Promise<boolean> {
    setIsSaving(true);
    clearErrors();
    try {
      await deleteInterestConfig(transaction.id);
      return true;
    } catch (err) {
      const apiError = toApiError(err);
      setGlobalError(apiError.message);
      return false;
    } finally {
      setIsSaving(false);
    }
  }

  return { isSaving, fieldErrors, globalError, handleUpsert, handleDelete, clearErrors };
}
