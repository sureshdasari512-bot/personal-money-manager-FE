import { apiFetch } from '../../lib/api-client';
import type { InterestRateHistoryResponse } from '../../types';
import type { InterestConfigPayload, InterestConfigResponse } from './types';

/**
 * Creates or updates the simple-interest config for a transaction.
 *
 * @param transactionId - Parent transaction
 * @param payload       - Rate in basis points, compounding period, and optional effective date
 * @returns The upserted interest config
 */
export function upsertInterestConfig(
  transactionId: string,
  payload: InterestConfigPayload,
): Promise<InterestConfigResponse> {
  return apiFetch<InterestConfigResponse>(
    `/transactions/${transactionId}/interest-config`,
    { method: 'PUT', body: JSON.stringify(payload) },
  );
}

/**
 * Soft-deletes the interest config for a transaction.
 * Accrual history is preserved for auditability.
 *
 * @param transactionId - Parent transaction
 */
export function deleteInterestConfig(transactionId: string): Promise<void> {
  return apiFetch<void>(
    `/transactions/${transactionId}/interest-config`,
    { method: 'DELETE' },
  );
}

/**
 * Returns the full interest rate history and paired accrual segments for a
 * transaction. Used to render the per-loan rate history ledger view.
 *
 * @param transactionId - Parent transaction
 * @returns Rate segments (chronological) and their matching accrual data
 */
export function getInterestRateHistory(
  transactionId: string,
): Promise<InterestRateHistoryResponse> {
  return apiFetch<InterestRateHistoryResponse>(
    `/transactions/${transactionId}/interest-config/history`,
  );
}
