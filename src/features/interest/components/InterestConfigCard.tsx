import { useState } from 'react';
import { Button } from '../../../components/Button';
import { Modal } from '../../../components/Modal';
import { tokens } from '../../../lib/design-tokens';
import { bpsToPercent, PERIOD_LABELS } from '../../../lib/simpleInterest';
import { formatCurrency } from '../../../lib/formatCurrency';
import { formatDate } from '../../../lib/formatDate';
import type { FieldErrors } from '../../../types/errors';
import type { InterestConfigPayload, LedgerTransaction } from '../types';
import { InterestConfigForm } from './InterestConfigForm';

interface InterestConfigCardProps {
  transaction: LedgerTransaction;
  isSaving: boolean;
  fieldErrors: FieldErrors;
  globalError: string | null;
  onUpsert: (transaction: LedgerTransaction, payload: InterestConfigPayload) => Promise<boolean>;
  onRemove: (transaction: LedgerTransaction) => Promise<boolean>;
  onReload: () => Promise<void>;
}

/**
 * Displays interest status for one transaction and allows configuring it.
 * Opens the InterestConfigForm in a modal inline — no navigation.
 * Purely presentational: all mutations flow through props.
 *
 * @param transaction - Ledger transaction with optional interestConfig
 * @param isSaving    - In-flight flag from the parent hook
 * @param fieldErrors - Per-field API errors
 * @param globalError - Form-level API error
 * @param onUpsert    - Create or update the interest config
 * @param onRemove    - Soft-delete the interest config
 * @param onReload    - Reload the ledger after a mutation
 */
export function InterestConfigCard({
  transaction,
  isSaving,
  fieldErrors,
  globalError,
  onUpsert,
  onRemove,
  onReload,
}: InterestConfigCardProps) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const config = transaction.interestConfig;
  const hasInterest = config !== null;

  /**
   * Opens the config form, resetting any stale errors.
   */
  function openForm(): void {
    setIsFormOpen(true);
  }

  /**
   * Closes the config form.
   */
  function closeForm(): void {
    setIsFormOpen(false);
  }

  /**
   * Submits an upsert, closes the form, and reloads the ledger on success.
   *
   * @param payload - Rate and period from the form
   */
  async function handleSubmit(payload: InterestConfigPayload): Promise<void> {
    const ok = await onUpsert(transaction, payload);
    if (ok) {
      closeForm();
      await onReload();
    }
  }

  /**
   * Removes the interest config and reloads the ledger on success.
   */
  async function handleRemove(): Promise<void> {
    const ok = await onRemove(transaction);
    if (ok) {
      await onReload();
    }
  }

  return (
    <>
      <article
        className="p-4"
        style={{
          background: tokens.color.surface,
          borderRadius: tokens.radius.lg,
          boxShadow: `inset 0 0 0 1px ${tokens.color.line}`,
        }}
      >
        {/* Transaction identity line */}
        <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: tokens.color.muted }}>
          {transaction.type === 'lend' ? 'You lent' : 'You borrowed'}
        </p>
        <p className="mt-0.5 text-base font-semibold" style={{ color: tokens.color.ink }}>
          {formatCurrency(transaction.amountCents)}
          <span className="ml-2 text-sm font-normal" style={{ color: tokens.color.muted }}>
            · {formatDate(transaction.transactionDate)}
          </span>
        </p>

        {hasInterest ? (
          /* ── Interest configured ────────────────────────── */
          <div className="mt-3 flex flex-col gap-3">
            {/* Config summary pill row */}
            <div className="flex flex-wrap gap-2">
              <span
                className="rounded-full px-2.5 py-0.5 text-xs font-semibold"
                style={{ background: tokens.color.primarySoft, color: tokens.color.primary }}
              >
                {bpsToPercent(config.interestRateBps)}% / month
              </span>
              <span
                className="rounded-full px-2.5 py-0.5 text-xs font-semibold"
                style={{ background: tokens.color.canvas, color: tokens.color.muted }}
              >
                {PERIOD_LABELS[config.interestPeriod]}
              </span>
            </div>

            {/* Key numbers */}
            <div
              className="grid grid-cols-2 gap-3 rounded-lg p-3"
              style={{ background: tokens.color.canvas }}
            >
              <div>
                <p className="text-xs" style={{ color: tokens.color.muted }}>Outstanding principal</p>
                <p className="mt-0.5 text-sm font-semibold" style={{ color: tokens.color.ink }}>
                  {formatCurrency(transaction.outstandingCents)}
                </p>
              </div>
              <div>
                <p className="text-xs" style={{ color: tokens.color.muted }}>Accrued interest</p>
                <p
                  className="mt-0.5 text-sm font-semibold"
                  style={{ color: transaction.accruedInterestCents > 0 ? tokens.color.warning : tokens.color.ink }}
                >
                  {formatCurrency(transaction.accruedInterestCents)}
                </p>
              </div>
              <div>
                <p className="text-xs" style={{ color: tokens.color.muted }}>Total payable</p>
                <p className="mt-0.5 text-sm font-semibold" style={{ color: tokens.color.ink }}>
                  {formatCurrency(transaction.outstandingCents + transaction.accruedInterestCents)}
                </p>
              </div>
              <div>
                <p className="text-xs" style={{ color: tokens.color.muted }}>Status</p>
                <p className="mt-0.5 text-sm font-semibold" style={{ color: tokens.color.ink }}>
                  {transaction.status === 'paid' ? 'Settled' : 'Active'}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Button variant="secondary" onClick={openForm} className="flex-1">
                Edit interest
              </Button>
              <Button
                variant="danger"
                isLoading={isSaving}
                onClick={handleRemove}
                className="flex-1"
              >
                Remove interest
              </Button>
            </div>
          </div>
        ) : (
          /* ── No interest configured ─────────────────────── */
          /* Only show "Set interest" when the loan is still active.
             Settled/cancelled loans don't need interest configured. */
          transaction.status !== 'paid' && transaction.status !== 'cancelled' ? (
            <div className="mt-3 flex items-center justify-between gap-3">
              <p className="text-sm" style={{ color: tokens.color.muted }}>
                No interest configured
              </p>
              <Button variant="secondary" onClick={openForm}>
                Set interest
              </Button>
            </div>
          ) : null
        )}
      </article>

      {/* Inline modal — no page navigation */}
      <Modal
        title={hasInterest ? 'Edit interest' : 'Set interest'}
        isOpen={isFormOpen}
        onClose={closeForm}
      >
        <InterestConfigForm
          key={transaction.id}
          transaction={transaction}
          isSaving={isSaving}
          fieldErrors={fieldErrors}
          globalError={globalError}
          onSubmit={handleSubmit}
          onCancel={closeForm}
        />
      </Modal>
    </>
  );
}
