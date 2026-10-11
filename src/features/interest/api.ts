import { apiFetch } from '../../lib/api-client';
import type { InterestConfigPayload, InterestConfigResponse } from './types';

/**
 * Creates or updates the simple-interest config for a transaction.
 *
 * @param transactionId - Parent transaction
 * @param payload       - Annual rate in basis points and compounding period
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
