import { Link } from 'react-router-dom';
import { EmptyState } from '../../../components/EmptyState';
import { tokens } from '../../../lib/design-tokens';
import { formatCurrency } from '../../../lib/formatCurrency';
import type { DashboardPersonBalance } from '../types';

interface DashboardPeopleListProps {
  people: DashboardPersonBalance[];
  side: 'theyOweYou' | 'youOweThem';
}

/**
 * People on one side of the ledger only. Amounts are always positive.
 *
 * @param people - Filtered dashboard person rows
 * @param side - They owe you vs you owe them
 */
export function DashboardPeopleList({ people, side }: DashboardPeopleListProps) {
  if (people.length === 0) {
    return (
      <EmptyState
        title={side === 'theyOweYou' ? 'Nobody owes you' : 'You do not owe anyone'}
        description={
          side === 'theyOweYou'
            ? 'People you lent to will show here while money is still outstanding.'
            : 'People you borrowed from will show here while money is still outstanding.'
        }
        action={
          <Link
            to="/people"
            className="inline-flex min-h-11 items-center rounded-lg px-3 text-sm font-semibold text-blue-700 hover:bg-blue-50"
          >
            Go to people
          </Link>
        }
      />
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {people.map((person) => (
        <li key={person.personId}>
          <Link
            to={`/people/${person.personId}`}
            className="flex items-center justify-between gap-3 p-4 transition-colors hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
            style={{
              background: tokens.color.surface,
              borderRadius: tokens.radius.lg,
              boxShadow: `inset 0 0 0 1px ${tokens.color.line}`,
            }}
          >
            <div className="min-w-0">
              <p className="truncate font-semibold" style={{ color: tokens.color.ink }}>
                {person.personName}
              </p>
              <p className="mt-0.5 text-sm" style={{ color: tokens.color.muted }}>
                {side === 'theyOweYou' ? 'They owe you' : 'You owe them'}
              </p>
            </div>
            <p className="shrink-0 text-lg font-semibold" style={{ color: tokens.color.ink }}>
              {formatCurrency(Math.abs(person.netBalanceCents))}
            </p>
          </Link>
        </li>
      ))}
    </ul>
  );
}
