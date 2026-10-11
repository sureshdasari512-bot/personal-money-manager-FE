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
 * Returns save state and error state — no data fetching (ledger owns that).
 *
 * @returns Handler functions and error state for the interest config form
 */
export function useInterestConfig(): UseInterestConfigReturn {
  const [isSaving, setIsSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [globalError, setGlobalError] = useState<string | null>(null);

  /**
   * Clears all error state — call when the modal closes.
   */
  function clearErrors(): void {
    setFieldErrors({});
    setGlobalError(null);
  }

  /**
   * Creates or updates the interest config for a transaction.
   *
   * @param transaction - The transaction to configure interest for
   * @param payload     - Rate in basis points and compounding period
   * @returns true if the save succeeded, false otherwise
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
   * @param transaction - The transaction whose config to remove
   * @returns true if the delete succeeded, false otherwise
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
