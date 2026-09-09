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
type PeopleTab = 'theyOweYou' | 'youOweThem';

/**
 * Home screen: lend vs borrow totals, then final amount, due lists, and people.
 */
export function DashboardPage() {
  const { dashboard, isLoading, error } = useDashboard();
  const [attentionTab, setAttentionTab] = useState<AttentionTab>('overdue');
  const [peopleTab, setPeopleTab] = useState<PeopleTab>('theyOweYou');

  if (isLoading) {
    return <Spinner />;
  }

  if (error || !dashboard) {
    return <p className="text-sm text-red-600">Could not load the dashboard.</p>;
  }

  const net = dashboard.totalOwedToUserCents - dashboard.totalUserOwesCents;
  const theyOweYou = dashboard.people.filter((person) => person.netBalanceCents > 0);
  const youOweThem = dashboard.people.filter((person) => person.netBalanceCents < 0);

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
        <SegmentedTabs
          ariaLabel="Open balances"
          value={peopleTab}
          options={[
            { id: 'theyOweYou', label: 'They owe you', count: theyOweYou.length },
            { id: 'youOweThem', label: 'You owe them', count: youOweThem.length },
          ]}
          onChange={setPeopleTab}
        />
        <div className="mt-3">
          <DashboardPeopleList
            people={peopleTab === 'theyOweYou' ? theyOweYou : youOweThem}
            side={peopleTab}
          />
        </div>
      </section>
    </main>
  );
}
