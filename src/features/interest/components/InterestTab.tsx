import { tokens } from '../../../lib/design-tokens';
import { formatCurrency } from '../../../lib/formatCurrency';
import type { LedgerTransaction } from '../types';

interface InterestTabProps {
  transactions: LedgerTransaction[];
}

/**
 * Interest tab — shows only the total interest summary across all
 * interest-bearing loans. Per-loan detail (edit/remove interest, breakdown)
 * lives directly on each transaction card in the All / Lent tabs so the
 * user never has to switch tabs to act on a loan.
 *
 * @param transactions - All ledger transactions for this person
 */
export function InterestTab({ transactions }: InterestTabProps) {
  const interestTransactions = transactions.filter((tx) => tx.interestConfig !== null);
  const totalAccruedCents = interestTransactions.reduce(
    (sum, tx) => sum + tx.accruedInterestCents,
    0,
  );
  const totalPrincipalCents = interestTransactions.reduce(
    (sum, tx) => sum + tx.outstandingCents,
    0,
  );

  if (interestTransactions.length === 0) {
    return (
      <p className="text-sm" style={{ color: tokens.color.muted }}>
        No interest-bearing loans yet. Add interest to a loan from the Lent tab.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* ── Overall summary ── */}
      <div
        className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between"
        style={{
          background: tokens.color.surface,
          borderRadius: tokens.radius.lg,
          boxShadow: `inset 0 0 0 1px ${tokens.color.line}`,
        }}
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:gap-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: tokens.color.muted }}>
              Total principal outstanding
            </p>
            <p className="mt-0.5 text-2xl font-bold" style={{ color: tokens.color.ink }}>
              {formatCurrency(totalPrincipalCents)}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: tokens.color.muted }}>
              Total interest accrued
            </p>
            <p
              className="mt-0.5 text-2xl font-bold"
              style={{ color: totalAccruedCents > 0 ? tokens.color.warning : tokens.color.ink }}
            >
              {formatCurrency(totalAccruedCents)}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: tokens.color.muted }}>
              Total to collect
            </p>
            <p className="mt-0.5 text-2xl font-bold" style={{ color: tokens.color.ink }}>
              {formatCurrency(totalPrincipalCents + totalAccruedCents)}
            </p>
          </div>
        </div>

        <div
          className="rounded-lg px-3 py-2.5 text-sm"
          style={{
            background: tokens.color.warningSoft,
            color: tokens.color.warning,
            maxWidth: '18rem',
          }}
        >
          Interest is <strong>advisory only</strong>. Record repayments manually
          on the Lent tab — each loan card has an "Add repayment" button.
        </div>
      </div>

      {/* ── Per-loan summary rows (read-only) ── */}
      <div className="flex flex-col gap-2">
        {interestTransactions.map((tx) => (
          <div
            key={tx.id}
            className="flex items-center justify-between gap-4 px-4 py-3"
            style={{
              background: tokens.color.surface,
              borderRadius: tokens.radius.md,
              boxShadow: `inset 0 0 0 1px ${tokens.color.line}`,
            }}
          >
            <div className="min-w-0">
              <p className="text-sm font-semibold" style={{ color: tokens.color.ink }}>
                {formatCurrency(tx.amountCents)} loan
              </p>
              <p className="text-xs" style={{ color: tokens.color.muted }}>
                {tx.transactionDate}
                {tx.interestConfig
                  ? ` · ${tx.interestConfig.interestRateBps / 100}% / month`
                  : ''}
              </p>
            </div>
            <div className="flex flex-col items-end gap-0.5">
              <p className="text-xs" style={{ color: tokens.color.muted }}>
                Principal{' '}
                <span className="font-medium" style={{ color: tokens.color.ink }}>
                  {formatCurrency(tx.outstandingCents)}
                </span>
              </p>
              <p className="text-xs" style={{ color: tokens.color.warning }}>
                + Interest{' '}
                <span className="font-medium">
                  {formatCurrency(tx.accruedInterestCents)}
                </span>
              </p>
              <p
                className="text-xs font-semibold"
                style={{ color: tokens.color.ink }}
              >
                = {formatCurrency(tx.outstandingCents + tx.accruedInterestCents)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
