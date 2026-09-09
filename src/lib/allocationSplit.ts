import { formatCurrency } from './formatCurrency';

interface AllocationSlice {
  allocationId: string | null;
  amountCents: number;
}

/**
 * Sums person-level payment slices so each loan can show its share of the cash received.
 *
 * @param transactions - Ledger rows that already include repayments
 * @returns Map of allocation id → total cents across all slices
 */
export function totalsByAllocationId(
  transactions: Array<{ repayments: AllocationSlice[] }>,
): Record<string, number> {
  const totals: Record<string, number> = {};

  for (const transaction of transactions) {
    for (const repayment of transaction.repayments) {
      if (!repayment.allocationId) {
        continue;
      }
      totals[repayment.allocationId] =
        (totals[repayment.allocationId] ?? 0) + repayment.amountCents;
    }
  }

  return totals;
}

/**
 * Client-facing line for a slice of a larger person-level payment.
 * Returns null when this repayment is the whole payment (nothing to explain).
 *
 * @param appliedCents - Amount applied to this loan
 * @param paymentCents - Full cash amount of that payment
 * @returns Split caption, or null
 */
export function formatAllocationSplit(
  appliedCents: number,
  paymentCents: number,
): string | null {
  if (paymentCents <= appliedCents) {
    return null;
  }

  return `${formatCurrency(appliedCents)} of ${formatCurrency(paymentCents)} payment applied here`;
}
