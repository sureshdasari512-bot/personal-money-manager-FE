import { Link } from 'react-router-dom';
import { EmptyState } from '../../../components/EmptyState';
import { tokens } from '../../../lib/design-tokens';
import { formatCurrency } from '../../../lib/formatCurrency';
import type { DashboardPersonBalance } from '../types';

interface DashboardPeopleListProps {
  people: DashboardPersonBalance[];
}

/**
 * All people with an open balance, sorted largest first.
 * Green = they owe you, blue = you owe them.
 */
export function DashboardPeopleList({ people }: DashboardPeopleListProps) {
  if (people.length === 0) {
    return (
      <EmptyState
        title="No open balances"
        description="People you lend to or borrow from will show here while money is outstanding."
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

  const sorted = [...people].sort(
    (a, b) => Math.abs(b.netBalanceCents) - Math.abs(a.netBalanceCents),
  );

  return (
    <ul className="flex flex-col gap-3">
      {sorted.map((person) => {
        const theyOwe = person.netBalanceCents > 0;
        const accent = theyOwe ? tokens.color.success : tokens.color.info;
        const directionLabel = theyOwe ? 'Owes you' : 'You owe';

        return (
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
                <p className="mt-0.5 text-xs font-medium" style={{ color: accent }}>
                  {directionLabel}
                </p>
              </div>
              <p className="shrink-0 text-lg font-semibold" style={{ color: tokens.color.ink }}>
                {formatCurrency(Math.abs(person.netBalanceCents))}
              </p>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
