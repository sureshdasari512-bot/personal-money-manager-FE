/**
 * Splits outstanding into lend vs borrow totals.
 * Both sides include accrued interest — a borrowed transaction can have interest
 * configured on it just like a lent one.
 *
 * @param transactions - Rows that already include outstanding + interest amounts
 * @returns They-owe-you (lends, incl. interest), you-owe-them (borrows, incl. interest),
 *          and the principal-only figures for each side (shown in brackets on the UI)
 */
export function outstandingByType(
  transactions: Array<{ type: 'lend' | 'borrow'; status: string; outstandingCents: number; accruedInterestCents: number }>,
): {
  theyOweYouCents: number;
  theyOweYouPrincipalCents: number;
  youOweThemCents: number;
  youOweThemPrincipalCents: number;
} {
  return transactions.reduce(
    (totals, tx) => {
      // Paid / cancelled transactions owe nothing — skip entirely regardless of what
      // the accrual figures say (stale accrual data must never inflate the balance).
      if (tx.status === 'paid' || tx.status === 'cancelled') return totals;

      const liveTotal = tx.outstandingCents + tx.accruedInterestCents;
      if (liveTotal <= 0) return totals;

      if (tx.type === 'lend') {
        return {
          ...totals,
          theyOweYouCents: totals.theyOweYouCents + liveTotal,
          theyOweYouPrincipalCents: totals.theyOweYouPrincipalCents + tx.outstandingCents,
        };
      }

      return {
        ...totals,
        youOweThemCents: totals.youOweThemCents + liveTotal,
        youOweThemPrincipalCents: totals.youOweThemPrincipalCents + tx.outstandingCents,
      };
    },
    { theyOweYouCents: 0, theyOweYouPrincipalCents: 0, youOweThemCents: 0, youOweThemPrincipalCents: 0 },
  );
}
