import { useState } from 'react';
import { Button } from '../../../components/Button';
import { Modal } from '../../../components/Modal';
import { StatusBadge } from '../../../components/StatusBadge';
import { formatAllocationSplit } from '../../../lib/allocationSplit';
import { tokens } from '../../../lib/design-tokens';
import { formatCurrency } from '../../../lib/formatCurrency';
import { formatDate, formatLoanWhen, formatPaymentWhen } from '../../../lib/formatDate';
import {
  formatTransactionStatus,
  transactionStatusTone,
} from '../../../lib/formatTransactionStatus';
import { bpsToPercent, PERIOD_LABELS } from '../../../lib/simpleInterest';
import { todayIsoDate } from '../../../lib/todayIsoDate';
import type { FieldErrors } from '../../../types/errors';
import type { InterestConfigPayload, LedgerTransaction, Repayment } from '../types';
import { InterestConfigForm } from '../../interest/components/InterestConfigForm';

interface TransactionRowProps {
  transaction: LedgerTransaction;
  allocationTotals: Record<string, number>;
  isDeleting: boolean;
  deletingRepaymentId: string | null;
  isSavingInterest: boolean;
  interestFieldErrors: FieldErrors;
  interestGlobalError: string | null;
  onEdit: (transaction: LedgerTransaction) => void;
  onDelete: (transaction: LedgerTransaction) => void;
  onAddRepayment: (transaction: LedgerTransaction) => void;
  onDeleteRepayment: (transaction: LedgerTransaction, repayment: Repayment) => void;
  onUpsertInterest: (transaction: LedgerTransaction, payload: InterestConfigPayload) => Promise<boolean>;
  onRemoveInterest: (transaction: LedgerTransaction) => Promise<boolean>;
  onReload: () => Promise<void>;
}

/**
 * Displays a single transaction with outstanding balance, interest breakdown,
 * repayments (in an accordion), and action buttons — all in one card.
 * Interest config (edit/remove) lives here so the user never has to switch tabs.
 * Purely presentational — receives all data via props, no data fetching here.
 */
export function TransactionRow({
  transaction,
  allocationTotals,
  isDeleting,
  deletingRepaymentId,
  isSavingInterest,
  interestFieldErrors,
  interestGlobalError,
  onEdit,
  onDelete,
  onAddRepayment,
  onDeleteRepayment,
  onUpsertInterest,
  onRemoveInterest,
  onReload,
}: TransactionRowProps) {
  const hasRepayments = transaction.repayments.length > 0;
  const settled = transaction.status === 'paid';
  const overdue = !settled && isOverdue(transaction.dueDate);
  const [repayOpen, setRepayOpen] = useState(false);
  const [isInterestFormOpen, setIsInterestFormOpen] = useState(false);

  const config = transaction.interestConfig;
  const hasInterest = config !== null;
  const totalRepaidCents = transaction.repayments.reduce((sum, r) => sum + r.amountCents, 0);
  const totalPayableCents = transaction.outstandingCents + transaction.accruedInterestCents;

  // Total interest ever generated = interest portions already paid out + currently accrued (pending).
  const totalInterestPaidCents = transaction.repayments.reduce(
    (sum, r) => sum + (r.amountCents - r.towardPrincipalCents),
    0,
  );
  const totalInterestGeneratedCents = totalInterestPaidCents + transaction.accruedInterestCents;



  /**
   * Submits the interest upsert, closes modal, reloads on success.
   */
  async function handleInterestSubmit(payload: InterestConfigPayload): Promise<void> {
    const ok = await onUpsertInterest(transaction, payload);
    if (ok) {
      setIsInterestFormOpen(false);
      await onReload();
    }
  }

  /**
   * Removes interest config and reloads on success.
   */
  async function handleInterestRemove(): Promise<void> {
    const ok = await onRemoveInterest(transaction);
    if (ok) {
      await onReload();
    }
  }

  return (
    <>
      <article
        className="p-4 sm:p-5"
        style={{
          background: tokens.color.surface,
          borderRadius: tokens.radius.lg,
          boxShadow: `inset 0 0 0 1px ${tokens.color.line}`,
        }}
      >
        {/* ── Header: badges + date + notes ── */}
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge
            label={formatTransactionStatus(transaction.status)}
            tone={transactionStatusTone(transaction.status)}
          />
          {overdue ? <StatusBadge label="Overdue" tone="danger" /> : null}
          <StatusBadge
            label={transaction.type === 'lend' ? 'Lent' : 'Borrowed'}
            tone={transaction.type === 'lend' ? 'success' : 'info'}
            emphasis="secondary"
          />
          {hasInterest ? (
            <span
              className="rounded-full px-2.5 py-0.5 text-xs font-semibold"
              style={{ background: tokens.color.primarySoft, color: tokens.color.primary }}
            >
              {bpsToPercent(config.interestRateBps)}% / month · {PERIOD_LABELS[config.interestPeriod]}
            </span>
          ) : null}
        </div>

        <p className="mt-1.5 text-sm" style={{ color: tokens.color.muted }}>
          {formatLoanWhen(transaction.type, transaction.transactionDate)}
          {transaction.dueDate ? ` · Due ${formatDate(transaction.dueDate)}` : ''}
        </p>
        {transaction.notes ? (
          <p className="mt-0.5 truncate text-sm" style={{ color: tokens.color.muted }}>
            {transaction.notes}
          </p>
        ) : null}

        {/* ── Amount + breakdown ── */}
        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          {/* Original transaction amount — always prominent */}
          <div>
            <p className="text-2xl font-semibold" style={{ color: tokens.color.ink }}>
              {formatCurrency(transaction.amountCents)}
            </p>
          </div>

          {/* Outstanding breakdown — right side */}
          {hasInterest && !settled ? (
            /* Interest-bearing active loan: show full breakdown */
            <div
              className="rounded-lg px-3 py-2 text-sm sm:text-right"
              style={{ background: tokens.color.canvas, minWidth: '180px' }}
            >
              <div className="flex items-center justify-between gap-6">
                <span style={{ color: tokens.color.muted }}>Principal</span>
                <span className="font-medium" style={{ color: tokens.color.ink }}>
                  {formatCurrency(transaction.outstandingCents)}
                </span>
              </div>
                <div className="flex items-center justify-between gap-6">
                  <span style={{ color: tokens.color.warning }}>Interest</span>
                  <span className="font-medium" style={{ color: tokens.color.warning }}>
                    + {formatCurrency(transaction.accruedInterestCents)}
                  </span>
                </div>
              <div
                className="mt-1.5 flex items-center justify-between gap-6 border-t pt-1.5 font-semibold"
                style={{ borderColor: tokens.color.line }}
              >
                <span style={{ color: tokens.color.ink }}>Total to pay</span>
                <span style={{ color: tokens.color.ink }}>
                  {formatCurrency(totalPayableCents)}
                </span>
              </div>
            </div>
          ) : settled ? (
            /* Settled */
            <p className="text-sm font-medium" style={{ color: tokens.color.success }}>
              ✓ Fully settled
            </p>
          ) : (
            /* No interest — simple outstanding */
            <div className="text-sm sm:text-right">
              <p style={{ color: tokens.color.muted }}>Outstanding</p>
              <p className="font-semibold" style={{ color: tokens.color.ink }}>
                {formatCurrency(transaction.outstandingCents)}
              </p>
            </div>
          )}
        </div>

        {/* ── Total interest generated since loan start ── */}
        {hasInterest && totalInterestGeneratedCents > 0 ? (
          <p className="mt-1.5 text-xs" style={{ color: tokens.color.muted }}>
            Total interest since {formatDate(transaction.transactionDate)}:{' '}
            <span className="font-semibold" style={{ color: tokens.color.warning }}>
              {formatCurrency(totalInterestGeneratedCents)}
            </span>
          </p>
        ) : null}

        {/* ── Action buttons ── */}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {!settled ? (
            <Button variant="outline" onClick={() => onAddRepayment(transaction)}>
              Add repayment
            </Button>
          ) : null}
          {!hasRepayments ? (
            <Button variant="outline" onClick={() => onEdit(transaction)}>
              Edit
            </Button>
          ) : null}
          {/* Interest actions — always inline */}
          {transaction.type === 'lend' && !settled ? (
            hasInterest ? (
              <>
                <Button variant="outline" onClick={() => setIsInterestFormOpen(true)}>
                  Edit interest
                </Button>
                <Button
                  variant="outline"
                  isLoading={isSavingInterest}
                  onClick={handleInterestRemove}
                >
                  Remove interest
                </Button>
              </>
            ) : (
              <Button variant="outline" onClick={() => setIsInterestFormOpen(true)}>
                Add interest
              </Button>
            )
          ) : null}
          <Button
            variant="danger"
            isLoading={isDeleting}
            onClick={() => onDelete(transaction)}
          >
            Delete
          </Button>
        </div>

        {/* ── Repayment accordion ── */}
        {hasRepayments ? (
          <div className="mt-4">
            <button
              type="button"
              onClick={() => setRepayOpen((o) => !o)}
              className="flex w-full items-center justify-between px-3 py-2.5 text-left transition-colors hover:bg-slate-50"
              style={{
                background: tokens.color.canvas,
                borderRadius: tokens.radius.md,
              }}
              aria-expanded={repayOpen}
            >
              <span className="text-sm font-medium" style={{ color: tokens.color.ink }}>
                {transaction.repayments.length === 1
                  ? '1 repayment'
                  : `${transaction.repayments.length} repayments`}
                <span className="ml-2 font-normal" style={{ color: tokens.color.muted }}>
                  · {formatCurrency(totalRepaidCents)} paid
                </span>
              </span>
              <ChevronIcon open={repayOpen} />
            </button>

            {repayOpen ? (
              <ul className="mt-2 space-y-2 px-1">
                {transaction.repayments.map((repayment) => {
                  const whenLabel = formatPaymentWhen(repayment.paidOn, repayment.createdAt);
                  const paymentTotalCents = repayment.allocationId
                    ? allocationTotals[repayment.allocationId]
                    : undefined;
                  const splitLabel =
                    paymentTotalCents === undefined
                      ? null
                      : formatAllocationSplit(repayment.amountCents, paymentTotalCents);

                  const towardInterestCents = repayment.amountCents - repayment.towardPrincipalCents;
                  const hasSplit = towardInterestCents > 0 && repayment.towardPrincipalCents > 0;
                  const isFullyInterest = towardInterestCents > 0 && repayment.towardPrincipalCents === 0;



                  return (
                    <li
                      key={repayment.id}
                      className="flex items-start justify-between gap-3 px-3 py-3"
                      style={{
                        background: tokens.color.surface,
                        borderRadius: tokens.radius.md,
                        boxShadow: `inset 0 0 0 1px ${tokens.color.line}`,
                      }}
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-semibold" style={{ color: tokens.color.ink }}>
                          {formatCurrency(repayment.amountCents)}
                        </p>
                        {hasSplit ? (
                          <p className="mt-0.5 text-xs" style={{ color: tokens.color.muted }}>
                            {formatCurrency(repayment.towardPrincipalCents)} principal
                            {' · '}
                            <span style={{ color: tokens.color.warning }}>
                              {formatCurrency(towardInterestCents)} interest
                            </span>
                          </p>
                        ) : isFullyInterest ? (
                          <p className="mt-0.5 text-xs" style={{ color: tokens.color.warning }}>
                            Interest payment only
                          </p>
                        ) : null}

                        {splitLabel ? (
                          <p className="mt-0.5 text-xs" style={{ color: tokens.color.primary }}>
                            {splitLabel}
                          </p>
                        ) : null}
                        <p className="mt-0.5 text-xs" style={{ color: tokens.color.muted }}>
                          <time dateTime={repayment.createdAt}>{whenLabel}</time>
                        </p>
                        {repayment.notes ? (
                          <p className="mt-0.5 text-sm" style={{ color: tokens.color.ink }}>
                            {repayment.notes}
                          </p>
                        ) : null}
                      </div>
                      <Button
                        variant="ghost"
                        className="shrink-0"
                        aria-label={`Remove repayment of ${formatCurrency(repayment.amountCents)}`}
                        isLoading={deletingRepaymentId === repayment.id}
                        onClick={() => onDeleteRepayment(transaction, repayment)}
                      >
                        Remove
                      </Button>
                    </li>
                  );
                })}
              </ul>
            ) : null}
          </div>
        ) : null}
      </article>

      {/* Interest config modal — inline, no tab switch needed */}
      <Modal
        title={hasInterest ? 'Edit interest' : 'Add interest'}
        isOpen={isInterestFormOpen}
        onClose={() => setIsInterestFormOpen(false)}
      >
        <InterestConfigForm
          key={transaction.id}
          transaction={transaction}
          isSaving={isSavingInterest}
          fieldErrors={interestFieldErrors}
          globalError={interestGlobalError}
          onSubmit={handleInterestSubmit}
          onCancel={() => setIsInterestFormOpen(false)}
        />
      </Modal>
    </>
  );
}

/** Animated chevron that flips when open. */
function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{
        color: tokens.color.muted,
        flexShrink: 0,
        transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
        transition: 'transform 200ms ease',
      }}
      aria-hidden
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

/**
 * Whether a due date is before today (local calendar date).
 */
function isOverdue(dueDate: string | null): boolean {
  if (!dueDate) return false;
  return dueDate.slice(0, 10) < todayIsoDate();
}
