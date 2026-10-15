/**
 * Splits outstanding into lend vs borrow totals.
 * For lends: principal + accrued interest (the live amount they actually owe).
 * For borrows: principal only (interest on borrowed money is uncommon here).
 *
 * @param transactions - Rows that already include outstanding + interest amounts
 * @returns They-owe-you (lends, incl. interest) and you-owe-them (borrows)
 */
export function outstandingByType(
  transactions: Array<{ type: 'lend' | 'borrow'; status: string; outstandingCents: number; accruedInterestCents: number }>,
): { theyOweYouCents: number; theyOweYouPrincipalCents: number; youOweThemCents: number } {
  return transactions.reduce(
    (totals, transaction) => {
      // Paid / cancelled transactions owe nothing — skip entirely regardless of what
      // the accrual figures say (stale accrual data must never inflate the balance).
      if (transaction.status === 'paid' || transaction.status === 'cancelled') return totals;
      if (transaction.type === 'lend') {
        const liveTotal = transaction.outstandingCents + transaction.accruedInterestCents;
        if (liveTotal <= 0) return totals;
        return {
          ...totals,
          theyOweYouCents: totals.theyOweYouCents + liveTotal,
          theyOweYouPrincipalCents: totals.theyOweYouPrincipalCents + transaction.outstandingCents,
        };
      }
      if (transaction.outstandingCents <= 0) return totals;
      return { ...totals, youOweThemCents: totals.youOweThemCents + transaction.outstandingCents };
    },
    { theyOweYouCents: 0, theyOweYouPrincipalCents: 0, youOweThemCents: 0 },
  );
}
