/**
 * Splits outstanding cents into lend vs borrow so the UI never mixes the two.
 *
 * @param transactions - Rows that already include outstanding amounts
 * @returns They-owe-you (lends) and you-owe-them (borrows)
 */
export function outstandingByType(
  transactions: Array<{ type: 'lend' | 'borrow'; outstandingCents: number }>,
): { theyOweYouCents: number; youOweThemCents: number } {
  return transactions.reduce(
    (totals, transaction) => {
      if (transaction.outstandingCents <= 0) {
        return totals;
      }
      if (transaction.type === 'lend') {
        return { ...totals, theyOweYouCents: totals.theyOweYouCents + transaction.outstandingCents };
      }
      return { ...totals, youOweThemCents: totals.youOweThemCents + transaction.outstandingCents };
    },
    { theyOweYouCents: 0, youOweThemCents: 0 },
  );
}
