import { useState } from 'react';
import { Link } from 'react-router-dom';
import { BalanceBreakdown } from '../../../components/BalanceBreakdown';
import { PageHeader } from '../../../components/PageHeader';
import { SegmentedTabs } from '../../../components/SegmentedTabs';
import { Spinner } from '../../../components/Spinner';
import { tokens } from '../../../lib/design-tokens';
import { useDashboard } from '../hooks/useDashboard';
import { DashboardDueList } from './DashboardDueList';
import { DashboardPeopleList } from './DashboardPeopleList';

type AttentionTab = 'overdue' | 'upcoming';

/**
 * Home screen: lend vs borrow totals, then final amount, due lists, and people.
 */
export function DashboardPage() {
  const { dashboard, isLoading, error } = useDashboard();
  const [attentionTab, setAttentionTab] = useState<AttentionTab>('overdue');

  if (isLoading) {
    return <Spinner />;
  }

  if (error || !dashboard) {
    return <p className="text-sm text-red-600">Could not load the dashboard.</p>;
  }

  const net = dashboard.totalOwedToUserCents - dashboard.totalUserOwesCents;
  const peopleWithBalance = dashboard.people.filter((person) => person.netBalanceCents !== 0);

  return (
    <main>
      <PageHeader
        eyebrow="Overview"
        title="Your balance"
        description="Lent and borrowed are shown separately. Final amount is after both sides."
      />
      <BalanceBreakdown
        theyOweYouCents={dashboard.totalOwedToUserCents}
        youOweThemCents={dashboard.totalUserOwesCents}
        netBalanceCents={net}
        scope="overall"
      />

      <section className="mt-8">
        <h2 className="mb-3 text-lg font-semibold" style={{ color: tokens.color.ink }}>
          Needs attention
        </h2>
        <SegmentedTabs
          ariaLabel="Due items"
          value={attentionTab}
          options={[
            { id: 'overdue', label: 'Overdue', count: dashboard.overdueCount },
            { id: 'upcoming', label: 'Due in 7 days', count: dashboard.upcomingDueCount },
          ]}
          onChange={setAttentionTab}
        />
        <div className="mt-3">
          {attentionTab === 'overdue' ? (
            <DashboardDueList items={dashboard.overdue} variant="overdue" />
          ) : (
            <DashboardDueList items={dashboard.upcomingDue} variant="upcoming" />
          )}
        </div>
      </section>

      <section className="mt-8">
        <div className="mb-3 flex items-end justify-between gap-3">
          <h2 className="text-lg font-semibold" style={{ color: tokens.color.ink }}>
            People
          </h2>
          <Link to="/people" className="text-sm font-semibold text-blue-700 hover:text-blue-800">
            All people
          </Link>
        </div>
        <DashboardPeopleList people={peopleWithBalance} />
      </section>
    </main>
  );
}
