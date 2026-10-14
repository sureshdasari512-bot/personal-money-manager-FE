import { Link } from 'react-router-dom';
import { EmptyState } from '../../../components/EmptyState';
import { StatusBadge } from '../../../components/StatusBadge';
import { tokens } from '../../../lib/design-tokens';
import { formatCurrency } from '../../../lib/formatCurrency';
import { formatDate, formatLoanWhen } from '../../../lib/formatDate';
import type { DashboardDueItem } from '../types';

interface DashboardDueListProps {
  items: DashboardDueItem[];
  variant: 'overdue' | 'upcoming';
}

/**
 * Overdue or due-soon loans. Presentational — links through to the person ledger.
 *
 * @param items - Due rows from the dashboard API
 * @param variant - Overdue vs next 7 days (copy and badge)
 */
export function DashboardDueList({ items, variant }: DashboardDueListProps) {
  if (items.length === 0) {
    return (
      <EmptyState
        title={variant === 'overdue' ? 'Nothing overdue' : 'Nothing due in the next 7 days'}
        description={
          variant === 'overdue'
            ? 'Loans past their due date with money still outstanding will appear here.'
            : 'Loans due today or in the next week will appear here.'
        }
      />
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {items.map((item) => (
        <li key={item.transactionId}>
          <Link
            to={`/people/${item.personId}`}
            className="block p-4 transition-colors hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
            style={{
              background: tokens.color.surface,
              borderRadius: tokens.radius.lg,
              boxShadow: `inset 0 0 0 1px ${tokens.color.line}`,
            }}
          >
            <div className="flex flex-wrap items-center gap-2">
              {variant === 'overdue' ? <StatusBadge label="Overdue" tone="danger" /> : null}
              <StatusBadge
                label={item.type === 'lend' ? 'To collect' : 'You owe'}
                tone={item.type === 'lend' ? 'success' : 'info'}
                emphasis="secondary"
              />
            </div>
            <div className="mt-2 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate font-semibold" style={{ color: tokens.color.ink }}>
                  {item.personName}
                </p>
                <p className="mt-0.5 text-sm" style={{ color: tokens.color.muted }}>
                  {formatLoanWhen(item.type, item.transactionDate)}
                </p>
                <p className="mt-0.5 text-sm" style={{ color: tokens.color.muted }}>
                  Due {formatDate(item.dueDate)}
                </p>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-lg font-semibold" style={{ color: tokens.color.ink }}>
                  {formatCurrency(item.outstandingCents)}
                </p>
                {item.accruedInterestCents > 0 ? (
                  <p className="mt-0.5 text-xs" style={{ color: tokens.color.muted }}>
                    {formatCurrency(item.outstandingPrincipalCents)} principal
                    {' + '}
                    {formatCurrency(item.accruedInterestCents)} interest
                  </p>
                ) : (
                  <p className="mt-0.5 text-xs" style={{ color: tokens.color.muted }}>
                    still outstanding
                  </p>
                )}
              </div>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
