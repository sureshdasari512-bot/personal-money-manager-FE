import type { StatusTone } from '../components/StatusBadge';
import type { TransactionStatus } from '../types';

const STATUS_LABEL: Record<TransactionStatus, string> = {
  pending: 'Pending',
  partially_paid: 'Partially paid',
  paid: 'Paid',
  cancelled: 'Cancelled',
};

const STATUS_TONE: Record<TransactionStatus, StatusTone> = {
  pending: 'info',
  partially_paid: 'warning',
  paid: 'success',
  cancelled: 'neutral',
};

/**
 * Human-readable label for a stored transaction status.
 *
 * @param status - Database status value
 * @returns UI label
 */
export function formatTransactionStatus(status: TransactionStatus): string {
  return STATUS_LABEL[status];
}

/**
 * Semantic badge tone for a stored transaction status.
 * Pending = open (blue), partial = attention (amber), paid = done (green),
 * cancelled = inactive (neutral, not danger).
 *
 * @param status - Database status value
 * @returns Design-system tone
 */
export function transactionStatusTone(status: TransactionStatus): StatusTone {
  return STATUS_TONE[status];
}
