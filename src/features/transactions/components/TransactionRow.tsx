import { useState } from 'react';
import { Button } from '../../../components/Button';
import { StatusBadge } from '../../../components/StatusBadge';
import { formatAllocationSplit } from '../../../lib/allocationSplit';
import { tokens } from '../../../lib/design-tokens';
import { formatCurrency } from '../../../lib/formatCurrency';
import { formatDate, formatLoanWhen, formatPaymentWhen } from '../../../lib/formatDate';
import {
  formatTransactionStatus,
  transactionStatusTone,
} from '../../../lib/formatTransactionStatus';
import { todayIsoDate } from '../../../lib/todayIsoDate';
import type { LedgerTransaction, Repayment } from '../types';

interface TransactionRowProps {
  transaction: LedgerTransaction;
  allocationTotals: Record<string, number>;
  isDeleting: boolean;
  deletingRepaymentId: string | null;
  onEdit: (transaction: LedgerTransaction) => void;
  onDelete: (transaction: LedgerTransaction) => void;
  onAddRepayment: (transaction: LedgerTransaction) => void;
  onDeleteRepayment: (transaction: LedgerTransaction, repayment: Repayment) => void;
}

/**
 * Displays a single transaction with outstanding balance, repayments (in an
 * accordion), and action buttons.
 * Purely presentational — receives all data via props, no data fetching here.
 */
export function TransactionRow({
  transaction,
  allocationTotals,
  isDeleting,
  deletingRepaymentId,
  onEdit,
  onDelete,
  onAddRepayment,
  onDeleteRepayment,
}: TransactionRowProps) {
  const hasRepayments = transaction.repayments.length > 0;
  const settled = transaction.status === 'paid';
  const overdue = !settled && isOverdue(transaction.dueDate);
  const [repayOpen, setRepayOpen] = useState(false);

  const totalRepaidCents = transaction.repayments.reduce((sum, r) => sum + r.amountCents, 0);

  return (
    <article
      className="p-4 sm:p-5"
      style={{
        background: tokens.color.surface,
        borderRadius: tokens.radius.lg,
        boxShadow: `inset 0 0 0 1px ${tokens.color.line}`,
      }}
    >
      {/* ── Header row ── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
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
          </div>
          <p className="mt-1 text-sm text-slate-500">
            {formatLoanWhen(transaction.type, transaction.transactionDate)}
            {transaction.dueDate ? ` · Due ${formatDate(transaction.dueDate)}` : ''}
          </p>
          {transaction.notes ? (
            <p className="mt-1 truncate text-sm text-slate-500">{transaction.notes}</p>
          ) : null}
        </div>

        <div className="flex flex-col items-start gap-2 sm:items-end">
          <span className="text-lg font-semibold text-slate-900">
            {formatCurrency(transaction.amountCents)}
          </span>
          <p className="text-sm text-slate-500">
            Outstanding {formatCurrency(transaction.outstandingCents)}
          </p>
          {transaction.accruedInterestCents > 0 ? (
            <p
              className="text-sm"
              style={{ color: tokens.color.warning }}
              title="Simple interest accrued — see the Interest tab for details."
            >
              + {formatCurrency(transaction.accruedInterestCents)} interest
            </p>
          ) : null}
          <div className="flex flex-wrap items-center gap-2">
            {!settled ? (
              <Button variant="secondary" onClick={() => onAddRepayment(transaction)}>
                Add repayment
              </Button>
            ) : null}
            {!hasRepayments ? (
              <Button variant="secondary" onClick={() => onEdit(transaction)}>
                Edit
              </Button>
            ) : null}
            <Button
              variant="danger"
              isLoading={isDeleting}
              onClick={() => onDelete(transaction)}
            >
              Delete
            </Button>
          </div>
        </div>
      </div>

      {/* ── Repayment accordion ── */}
      {hasRepayments ? (
        <div className="mt-4">
          {/* Toggle button */}
          <button
            type="button"
            onClick={() => setRepayOpen((o) => !o)}
            className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-slate-50"
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

          {/* Expandable list */}
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
                      {splitLabel ? (
                        <p
                          className="mt-1 text-sm leading-5"
                          style={{ color: tokens.color.primary }}
                        >
                          {splitLabel}
                        </p>
                      ) : null}
                      <p className="mt-1 text-xs leading-5" style={{ color: tokens.color.muted }}>
                        <time dateTime={repayment.createdAt}>{whenLabel}</time>
                      </p>
                      {repayment.notes ? (
                        <p className="mt-1 text-sm leading-5" style={{ color: tokens.color.ink }}>
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
