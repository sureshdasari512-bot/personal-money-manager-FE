import { Button } from '../../../components/Button';
import { StatusBadge } from '../../../components/StatusBadge';
import { formatCurrency } from '../../../lib/formatCurrency';
import { formatDate } from '../../../lib/formatDate';
import {
  formatTransactionStatus,
  transactionStatusTone,
} from '../../../lib/formatTransactionStatus';
import { todayIsoDate } from '../../../lib/todayIsoDate';
import type { LedgerTransaction, Repayment } from '../types';

interface TransactionRowProps {
  transaction: LedgerTransaction;
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
 * @param isDeleting - Whether this row's delete request is in flight
 * @param deletingRepaymentId - Repayment currently being removed
 * @param onEdit - Opens the edit dialog in the parent
 * @param onDelete - Soft-deletes this transaction from the parent
 * @param onAddRepayment - Opens the repayment dialog
 * @param onDeleteRepayment - Soft-deletes one repayment
 */
export function TransactionRow({
  transaction,
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
    <div className="border-b border-slate-100 px-4 py-3 last:border-b-0">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge
              label={formatTransactionStatus(transaction.status)}
              tone={transactionStatusTone(transaction.status)}
            />
            {overdue ? <StatusBadge label="Overdue" tone="danger" /> : null}
            <StatusBadge
              label={transaction.type === 'lend' ? 'Lend' : 'Borrow'}
              tone={transaction.type === 'lend' ? 'success' : 'info'}
              emphasis="secondary"
            />
          </div>
          <p className="mt-1 text-sm text-slate-500">
            {formatDate(transaction.transactionDate)}
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
        <ul className="mt-3 space-y-2 rounded-xl bg-slate-50 p-3">
          {transaction.repayments.map((repayment) => (
            <li key={repayment.id} className="flex items-center justify-between gap-3 text-sm">
              <div className="min-w-0">
                <p className="font-medium text-slate-800">
                  {formatCurrency(repayment.amountCents)}
                </p>
                <p className="text-slate-500">
                  Paid {formatDate(repayment.paidOn)}
                  {repayment.notes ? ` · ${repayment.notes}` : ''}
                </p>
              </div>
              <Button
                variant="ghost"
                isLoading={deletingRepaymentId === repayment.id}
                onClick={() => {
                  onDeleteRepayment(transaction, repayment);
                }}
              >
                Remove
              </Button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
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
