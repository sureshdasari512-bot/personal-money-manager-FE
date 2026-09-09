import { apiFetch } from '../../lib/api-client';
import type {
  CreateRepaymentPayload,
  CreateTransactionPayload,
  PersonLedger,
  PersonRepaymentResponse,
  RepaymentResponse,
  TransactionResponse,
} from './types';

/**
 * Loads the ledger for one person.
 *
 * @param personId - Person whose history to fetch
 * @returns Transactions plus net outstanding balance
 */
export function fetchPersonLedger(personId: string): Promise<PersonLedger> {
  return apiFetch<PersonLedger>(`/people/${personId}/ledger`);
}

/**
 * Records a lend or borrow transaction.
 *
 * @param payload - Transaction fields (amount already in cents)
 * @returns Created transaction
 */
export function createTransaction(payload: CreateTransactionPayload): Promise<TransactionResponse> {
  return apiFetch<TransactionResponse>('/transactions', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * Updates a transaction owned by the current user.
 *
 * @param transactionId - Transaction id
 * @param payload - Updated fields (amount already in cents)
 * @returns Updated transaction
 */
export function updateTransaction(
  transactionId: string,
  payload: CreateTransactionPayload,
): Promise<TransactionResponse> {
  return apiFetch<TransactionResponse>(`/transactions/${transactionId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

/**
 * Soft-deletes a transaction owned by the current user.
 *
 * @param transactionId - Transaction id
 * @param cascade - When true, also soft-deletes repayments
 */
export function deleteTransaction(transactionId: string, cascade = false): Promise<void> {
  const suffix = cascade ? '?cascade=true' : '';
  return apiFetch<void>(`/transactions/${transactionId}${suffix}`, { method: 'DELETE' });
}

/**
 * Records a repayment against a transaction.
 *
 * @param transactionId - Parent transaction
 * @param payload - Amount in cents, payment date, optional notes
 * @returns Created repayment
 */
export function createRepayment(
  transactionId: string,
  payload: CreateRepaymentPayload,
): Promise<RepaymentResponse> {
  return apiFetch<RepaymentResponse>(`/transactions/${transactionId}/repayments`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * Records a person-level payment and splits it FIFO across outstanding lends.
 *
 * @param personId - Person who paid
 * @param payload - Amount in cents, payment date, optional notes
 * @returns Allocation header and the repayment slices
 */
export function createPersonRepayment(
  personId: string,
  payload: CreateRepaymentPayload,
): Promise<PersonRepaymentResponse> {
  return apiFetch<PersonRepaymentResponse>(`/people/${personId}/repayments`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * Soft-deletes a repayment owned by the current user.
 *
 * @param transactionId - Parent transaction
 * @param repaymentId - Repayment id
 */
export function deleteRepayment(transactionId: string, repaymentId: string): Promise<void> {
  return apiFetch<void>(`/transactions/${transactionId}/repayments/${repaymentId}`, {
    method: 'DELETE',
  });
}
