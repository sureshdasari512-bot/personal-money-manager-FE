import { tokens } from '../../../lib/design-tokens';
import { formatCurrency } from '../../../lib/formatCurrency';
import type { FieldErrors } from '../../../types/errors';
import type { InterestConfigPayload, LedgerTransaction } from '../types';
import { InterestConfigCard } from './InterestConfigCard';

interface InterestTabProps {
  transactions: LedgerTransaction[];
  isSaving: boolean;
  fieldErrors: FieldErrors;
  globalError: string | null;
  onUpsert: (transaction: LedgerTransaction, payload: InterestConfigPayload) => Promise<boolean>;
  onRemove: (transaction: LedgerTransaction) => Promise<boolean>;
  onReload: () => Promise<void>;
}

/**
 * Full-page Interest tab content for the person ledger.
 *
 * Shows:
 *  1. A summary card — total accrued interest across all transactions
 *  2. One InterestConfigCard per transaction — configure / view / remove interest
 *
 * Purely presentational — all mutations flow through props from PersonLedgerPage.
 *
 * @param transactions - All ledger transactions for this person
 * @param isSaving     - In-flight flag from the parent hook
 * @param fieldErrors  - Per-field API errors forwarded to the active form
 * @param globalError  - Form-level API error forwarded to the active form
 * @param onUpsert     - Create or update interest config
 * @param onRemove     - Soft-delete interest config
 * @param onReload     - Reload the ledger after any mutation
 */
export function InterestTab({
  transactions,
  isSaving,
  fieldErrors,
  globalError,
  onUpsert,
  onRemove,
  onReload,
}: InterestTabProps) {
  // Only transactions with interest configured belong in this tab.
  const interestTransactions = transactions.filter((tx) => tx.interestConfig !== null);
  const totalAccruedCents = interestTransactions.reduce(
    (sum, tx) => sum + tx.accruedInterestCents,
    0,
  );

  return (
    <div className="flex flex-col gap-4">
      {/* ── Summary card ──────────────────────────────────────── */}
      <div
        className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between"
        style={{
          background: tokens.color.surface,
          borderRadius: tokens.radius.lg,
          boxShadow: `inset 0 0 0 1px ${tokens.color.line}`,
        }}
      >
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: tokens.color.muted }}>
            Total interest accrued
          </p>
          <p
            className="mt-1 text-2xl font-bold"
            style={{ color: totalAccruedCents > 0 ? tokens.color.warning : tokens.color.ink }}
          >
            {formatCurrency(totalAccruedCents)}
          </p>
          <p className="mt-0.5 text-xs" style={{ color: tokens.color.muted }}>
            Across {interestTransactions.length} interest-bearing loan
            {interestTransactions.length !== 1 ? 's' : ''}
          </p>
        </div>

        <div
          className="rounded-lg px-3 py-2.5 text-sm"
          style={{
            background: tokens.color.warningSoft,
            color: tokens.color.warning,
            maxWidth: '18rem',
          }}
        >
          Interest is <strong>advisory only</strong>. It does not auto-create
          repayments — record them manually on the Transactions tab.
        </div>
      </div>

      {/* ── Per-transaction cards — interest loans only ───────── */}
      {interestTransactions.length === 0 ? (
        <p className="text-sm" style={{ color: tokens.color.muted }}>
          No interest-bearing loans yet. Toggle "Add interest" when adding a transaction.
        </p>
      ) : (
        interestTransactions.map((transaction) => (
          <InterestConfigCard
            key={transaction.id}
            transaction={transaction}
            isSaving={isSaving}
            fieldErrors={fieldErrors}
            globalError={globalError}
            onUpsert={onUpsert}
            onRemove={onRemove}
            onReload={onReload}
          />
        ))
      )}
    </div>
  );
}
