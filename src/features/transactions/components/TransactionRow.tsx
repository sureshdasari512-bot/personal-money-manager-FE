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
 * Displays a single transaction with outstanding balance, repayments, and actions.
 * Purely presentational — receives all data via props, no data fetching here.
 *
 * @param transaction - Ledger row to render
 * @param allocationTotals - Person-level payment totals keyed by allocation id
 * @param isDeleting - Whether this row's delete request is in flight
 * @param deletingRepaymentId - Repayment currently being removed
 * @param onEdit - Opens the edit dialog in the parent
 * @param onDelete - Soft-deletes this transaction from the parent
 * @param onAddRepayment - Opens the repayment dialog
 * @param onDeleteRepayment - Soft-deletes one repayment
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

  return (
    <article
      className="p-4 sm:p-5"
      style={{
        background: tokens.color.surface,
        borderRadius: tokens.radius.lg,
        boxShadow: `inset 0 0 0 1px ${tokens.color.line}`,
      }}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge
              label={formatTransactionStatus(transaction.status)}
              tone={transactionStatusTone(transaction.status)}
            />
            {overdue ? <StatusBadge label="Overdue" tone="danger" /> : null}
            <StatusBadge
              label={transaction.type === 'lend' ? 'They owe you' : 'You owe them'}
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
              onClick={() => {
                onDelete(transaction);
              }}
            >
              Delete
            </Button>
          </div>
        </div>
      </div>

      {hasRepayments ? (
        <ul
          className="mt-4 space-y-3 rounded-xl p-3"
          style={{ background: tokens.color.canvas }}
        >
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
                    <p className="mt-1 text-sm leading-5" style={{ color: tokens.color.primary }}>
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
                  onClick={() => {
                    onDeleteRepayment(transaction, repayment);
                  }}
                >
                  Remove
                </Button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </article>
  );
}

/**
 * Whether a due date is before today (local calendar date).
 *
 * @param dueDate - Optional ISO date
 * @returns True when the item is past due
 */
function isOverdue(dueDate: string | null): boolean {
  if (!dueDate) {
    return false;
  }
  return dueDate.slice(0, 10) < todayIsoDate();
}
